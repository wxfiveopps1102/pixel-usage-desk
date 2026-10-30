import Cocoa
import WebKit

// MARK: - Models

struct BalanceSnapshot {
    var status: String = "unknown"   // unknown, ready, signed-out, error
    var currency: String = "CNY"
    var normal: Double = 0
    var bonus: Double = 0
    var available: Double = 0
    var spent: Double = 0
    var error: String? = nil
}

struct SessionUsage {
    let id: String
    let title: String
    let total: Int
    let input: Int
    let output: Int
    let cacheRead: Int
    let cacheWrite: Int
    let contextUsed: Int?
    let contextWindow: Int?
}

struct UsageSnapshot {
    var current: SessionUsage? = nil
    var allTotal: Int = 0
    var sessions: Int = 0
    var updatedAt: Date = Date()
}

enum BalanceFailure: Error {
    case noToken
    case http(Int)
    case protocolError
    case network(String)
}

// MARK: - Logging

private let logDirectory: URL = {
    let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
        ?? URL(fileURLWithPath: NSHomeDirectory() + "/Library/Application Support")
    return base.appendingPathComponent("PixelUsageDesk", isDirectory: true)
}()

private let logURL = logDirectory.appendingPathComponent("app.log")
private let logQueue = DispatchQueue(label: "local.pixelusagedesk.log")

func writeLog(_ message: String) {
    logQueue.async {
        try? FileManager.default.createDirectory(at: logDirectory, withIntermediateDirectories: true)
        let stamp = ISO8601DateFormatter().string(from: Date())
        let line = stamp + " " + message + "\n"
        guard let data = line.data(using: .utf8) else { return }
        if FileManager.default.fileExists(atPath: logURL.path),
           let handle = try? FileHandle(forWritingTo: logURL) {
            handle.seekToEndOfFile()
            handle.write(data)
            try? handle.close()
        } else {
            try? data.write(to: logURL, options: .atomic)
        }
    }
}

// MARK: - Account token + balance

func readAccountToken() -> String? {
    let path = NSHomeDirectory() + "/.dsh/.credentials.yaml"
    guard let text = try? String(contentsOfFile: path, encoding: .utf8) else { return nil }
    let pattern = "(?m)^[ \\t]*token:[ \\t]*([^\\s]+)[ \\t]*$"
    guard let regex = try? NSRegularExpression(pattern: pattern) else { return nil }
    let range = NSRange(text.startIndex..<text.endIndex, in: text)
    guard let match = regex.firstMatch(in: text, range: range),
          let tokenRange = Range(match.range(at: 1), in: text) else { return nil }
    var token = String(text[tokenRange])
    if token.hasPrefix("\""), token.hasSuffix("\""), token.count >= 2 {
        token = String(token.dropFirst().dropLast())
    }
    if token.hasPrefix("'"), token.hasSuffix("'"), token.count >= 2 {
        token = String(token.dropFirst().dropLast())
    }
    return token.isEmpty ? nil : token
}

func walletCurrency(_ wallets: [[String: Any]]) -> String {
    var hasCNY = false
    var hasUSD = false
    for wallet in wallets {
        switch wallet["currency"] as? String {
        case "CNY": hasCNY = true
        case "USD": hasUSD = true
        default: break
        }
    }
    if hasCNY { return "CNY" }
    if hasUSD { return "USD" }
    return "CNY"
}

func sumWallets(_ wallets: [[String: Any]], currency: String) -> Double {
    var total = 0.0
    for wallet in wallets where (wallet["currency"] as? String) == currency {
        if let text = wallet["balance"] as? String, let value = Double(text) {
            total += value
        }
    }
    return total
}

func sumCosts(_ costs: [[String: Any]], currency: String) -> Double {
    var total = 0.0
    for cost in costs where (cost["currency"] as? String) == currency {
        if let text = cost["amount"] as? String, let value = Double(text) {
            total += value
        }
    }
    return total
}

let httpSession: URLSession = {
    let configuration = URLSessionConfiguration.ephemeral
    configuration.timeoutIntervalForRequest = 15
    configuration.timeoutIntervalForResource = 20
    return URLSession(configuration: configuration)
}()

func fetchBalance(completion: @escaping (Result<BalanceSnapshot, BalanceFailure>) -> Void) {
    guard let token = readAccountToken() else {
        completion(.failure(.noToken))
        return
    }
    var request = URLRequest(url: URL(string: "https://platform.deepseek.com/api/v0/users/get_user_summary")!)
    request.httpMethod = "GET"
    request.timeoutInterval = 15
    request.setValue(token, forHTTPHeaderField: "x-dsh-auth-token")
    request.setValue("application/json", forHTTPHeaderField: "accept")
    request.setValue("zh-CN", forHTTPHeaderField: "accept-language")
    request.setValue("Mozilla/5.0 PixelUsageDesk/1.0", forHTTPHeaderField: "user-agent")

    httpSession.dataTask(with: request) { data, response, error in
        if let error = error {
            completion(.failure(.network(error.localizedDescription)))
            return
        }
        let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0
        if statusCode == 401 || statusCode == 403 {
            completion(.failure(.http(statusCode)))
            return
        }
        guard statusCode == 200, let data = data else {
            completion(.failure(.http(statusCode)))
            return
        }
        do {
            guard let root = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                completion(.failure(.protocolError))
                return
            }
            let code = root["code"] as? Int ?? 0
            if code == 40003 { // Platform session expired
                completion(.failure(.http(401)))
                return
            }
            guard code == 0,
                  let dataObj = root["data"] as? [String: Any],
                  let bizCode = dataObj["biz_code"] as? Int, bizCode == 0,
                  let biz = dataObj["biz_data"] as? [String: Any] else {
                completion(.failure(.protocolError))
                return
            }
            let normalWallets = biz["normal_wallets"] as? [[String: Any]] ?? []
            let bonusWallets = biz["bonus_wallets"] as? [[String: Any]] ?? []
            let costs = biz["total_costs"] as? [[String: Any]] ?? []
            let currency = walletCurrency(normalWallets + bonusWallets)
            let normal = sumWallets(normalWallets, currency: currency)
            let bonus = sumWallets(bonusWallets, currency: currency)
            let spent = sumCosts(costs, currency: currency)
            let snapshot = BalanceSnapshot(
                status: "ready",
                currency: currency,
                normal: normal,
                bonus: bonus,
                available: normal + bonus,
                spent: spent,
                error: nil
            )
            completion(.success(snapshot))
        } catch {
            completion(.failure(.protocolError))
        }
    }.resume()
}

// MARK: - Usage projection cache

func intValue(_ value: Any?) -> Int? {
    if let number = value as? Int { return number }
    if let number = value as? NSNumber { return number.intValue }
    if let text = value as? String { return Int(text) }
    return nil
}

func readUsage() -> UsageSnapshot {
    var usage = UsageSnapshot()
    let directory = NSHomeDirectory() + "/.dsh/storages/session_projcache/sessions"
    let manager = FileManager.default
    guard let names = try? manager.contentsOfDirectory(atPath: directory) else { return usage }

    var found: [(Date, SessionUsage)] = []
    for name in names where name.hasSuffix(".json") {
        let path = directory + "/" + name
        guard let attrs = try? manager.attributesOfItem(atPath: path),
              let modified = attrs[.modificationDate] as? Date,
              let data = try? Data(contentsOf: URL(fileURLWithPath: path)),
              let root = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let record = root["record"] as? [String: Any],
              let rows = record["rows"] as? [String: Any] else { continue }

        let tokenRow = rows["tokenUsage"] as? [String: Any]
        let tokenVal = tokenRow?["val"] as? [String: Any]
        let totals = tokenVal?["totals"] as? [String: Any]
        if tokenRow == nil && totals == nil { continue }

        let input = intValue(totals?["uncachedInputTokens"]) ?? 0
        let output = intValue(totals?["outputTokens"]) ?? 0
        let cacheRead = intValue(totals?["cacheReadTokens"]) ?? 0
        let cacheWrite = intValue(totals?["cacheWriteTokens"]) ?? 0
        let total = input + output + cacheRead + cacheWrite

        let pressureRow = rows["contextPressure"] as? [String: Any]
        let pressureVal = pressureRow?["val"] as? [String: Any]
        let contextUsed = intValue(pressureVal?["projectedTokens"]) ?? intValue(pressureVal?["pressureTokens"])
        let contextWindow = intValue(pressureVal?["contextWindow"])
        let title = (rows["title"] as? [String: Any])?["val"] as? String ?? ""

        let session = SessionUsage(
            id: name,
            title: title,
            total: total,
            input: input,
            output: output,
            cacheRead: cacheRead,
            cacheWrite: cacheWrite,
            contextUsed: contextUsed,
            contextWindow: contextWindow
        )
        found.append((modified, session))
    }

    usage.sessions = found.count
    usage.allTotal = found.reduce(0) { $0 + $1.1.total }
    if let latest = found.max(by: { $0.0 < $1.0 }) {
        usage.current = latest.1
        usage.updatedAt = latest.0
    }
    return usage
}

// MARK: - Snapshot serialization

func snapshotDictionary(balance: BalanceSnapshot, usage: UsageSnapshot) -> [String: Any] {
    var balanceObject: [String: Any] = [
        "status": balance.status,
        "currency": balance.currency,
        "normal": balance.normal,
        "bonus": balance.bonus,
        "available": balance.available,
        "spent": balance.spent,
    ]
    if let error = balance.error { balanceObject["error"] = error }

    var usageObject: [String: Any] = [
        "allTotal": usage.allTotal,
        "sessions": usage.sessions,
        "updatedAt": Int(usage.updatedAt.timeIntervalSince1970 * 1000),
    ]
    if let current = usage.current {
        usageObject["current"] = [
            "id": current.id,
            "title": current.title,
            "total": current.total,
            "input": current.input,
            "output": current.output,
            "cacheRead": current.cacheRead,
            "cacheWrite": current.cacheWrite,
            "contextUsed": current.contextUsed.map { $0 as Any } ?? NSNull(),
            "contextWindow": current.contextWindow.map { $0 as Any } ?? NSNull(),
        ] as [String: Any]
    } else {
        usageObject["current"] = NSNull()
    }

    return [
        "status": balance.status,
        "balance": balanceObject,
        "usage": usageObject,
        "shownAt": Int(Date().timeIntervalSince1970 * 1000),
    ]
}

// MARK: - Probe mode (for verification without opening the window)

func runProbe() {
    writeLog("probe start")
    let group = DispatchGroup()
    group.enter()
    var result: BalanceSnapshot? = nil
    fetchBalance { outcome in
        if case .success(let snapshot) = outcome { result = snapshot }
        group.leave()
    }
    _ = group.wait(timeout: .now() + 20)
    let usage = readUsage()
    var balanceObject: [String: Any] = ["status": result?.status ?? "unavailable"]
    if let result = result {
        balanceObject["currency"] = result.currency
        balanceObject["normal"] = result.normal
        balanceObject["bonus"] = result.bonus
        balanceObject["available"] = result.available
        balanceObject["spent"] = result.spent
    }
    var usageObject: [String: Any] = ["allTotal": usage.allTotal, "sessions": usage.sessions]
    if let current = usage.current {
        usageObject["current"] = [
            "title": current.title,
            "total": current.total,
            "input": current.input,
            "output": current.output,
            "cacheRead": current.cacheRead,
            "cacheWrite": current.cacheWrite,
            "contextUsed": current.contextUsed.map { $0 as Any } ?? NSNull(),
            "contextWindow": current.contextWindow.map { $0 as Any } ?? NSNull(),
        ]
    }
    let payload: [String: Any] = ["balance": balanceObject, "usage": usageObject]
    if let data = try? JSONSerialization.data(withJSONObject: payload, options: [.prettyPrinted, .sortedKeys]),
       let text = String(data: data, encoding: .utf8) {
        print(text)
    }
    exit(0)
}

// MARK: - Window + web view

final class FloatingWindow: NSWindow {
    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { true }
}

final class DragHandleView: NSView {
    override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }

    private var startMouse = NSPoint.zero
    private var startOrigin = NSPoint.zero

    override func mouseDown(with event: NSEvent) {
        startMouse = NSEvent.mouseLocation
        startOrigin = window?.frame.origin ?? .zero
    }

    override func mouseDragged(with event: NSEvent) {
        guard let window = window else { return }
        let point = NSEvent.mouseLocation
        window.setFrameOrigin(NSPoint(
            x: startOrigin.x + point.x - startMouse.x,
            y: startOrigin.y + point.y - startMouse.y
        ))
    }

    override func mouseUp(with event: NSEvent) {
        (NSApp.delegate as? AppDelegate)?.saveWindowPosition()
    }

    override func resetCursorRects() {
        addCursorRect(bounds, cursor: .openHand)
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate, WKScriptMessageHandler, WKNavigationDelegate, NSWindowDelegate {
    private let windowWidth: CGFloat = 304
    private let windowHeight: CGFloat = 244
    private let defaults = UserDefaults.standard
    private let positionXKey = "pxd.window.x"
    private let positionYKey = "pxd.window.y"

    private var window: FloatingWindow!
    private var webView: WKWebView!
    private var statusItem: NSStatusItem!
    private var floatMenuItem: NSMenuItem?
    private var appearanceItems: [NSMenuItem] = []
    private var themeMode = "auto"
    private var balance = BalanceSnapshot()
    private var floatAbove = false
    private let baseLevel = NSWindow.Level.normal
    private var usage = UsageSnapshot()
    private var webReady = false
    private var balanceInFlight = false
    private var usageInFlight = false
    private var balanceTimer: Timer?
    private var usageTimer: Timer?

    func applicationDidFinishLaunching(_ notification: Notification) {
        writeLog("app launched")
        floatAbove = defaults.object(forKey: "pxd.floatAbove") as? Bool ?? true
        themeMode = defaults.string(forKey: "pxd.theme") ?? "auto"
        applyAppearance()
        if let iconURL = Bundle.main.url(forResource: "appicon", withExtension: "png"),
           let icon = NSImage(contentsOf: iconURL) {
            NSApp.applicationIconImage = icon
        }
        createWindow()
        createStatusItem()
        refreshUsage()
        refreshBalance()
        balanceTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            self?.refreshBalance()
        }
        usageTimer = Timer.scheduledTimer(withTimeInterval: 2, repeats: true) { [weak self] _ in
            self?.refreshUsage()
        }
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(screensChanged),
            name: NSApplication.didChangeScreenParametersNotification,
            object: nil
        )
    }

    func applicationWillTerminate(_ notification: Notification) {
        saveWindowPosition()
        balanceTimer?.invalidate()
        usageTimer?.invalidate()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        false
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        guard let window = window else { return true }
        NSApp.activate(ignoringOtherApps: true)
        window.makeKeyAndOrderFront(nil)
        return true
    }

    private func createWindow() {
        let contentRect = NSRect(x: restoreOrigin().x, y: restoreOrigin().y, width: windowWidth, height: windowHeight)
        let floating = FloatingWindow(
            contentRect: contentRect,
            styleMask: [.borderless],
            backing: .buffered,
            defer: false
        )
        floating.isOpaque = false
        floating.backgroundColor = .clear
        floating.hasShadow = false
        floating.level = floatAbove ? .floating : baseLevel
        floating.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        floating.isMovableByWindowBackground = false
        floating.isReleasedWhenClosed = false
        floating.isRestorable = false
        floating.delegate = self
        floating.title = "Pixel Usage Desk"
        window = floating

        let container = NSView(frame: NSRect(x: 0, y: 0, width: windowWidth, height: windowHeight))
        container.wantsLayer = true
        container.layer?.backgroundColor = NSColor.clear.cgColor
        floating.contentView = container

        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.websiteDataStore = .nonPersistent()
        configuration.preferences.isElementFullscreenEnabled = false
        let web = WKWebView(frame: container.bounds, configuration: configuration)
        web.autoresizingMask = [.width, .height]
        web.setValue(false, forKey: "drawsBackground")
        web.underPageBackgroundColor = .clear
        web.allowsMagnification = false
        web.allowsBackForwardNavigationGestures = false
        web.navigationDelegate = self
        web.configuration.userContentController.add(self, name: "desk")
        webView = web
        container.addSubview(web)

        let handle = DragHandleView(frame: NSRect(
            x: 0,
            y: windowHeight - 22,
            width: windowWidth,
            height: 22
        ))
        handle.autoresizingMask = [.minYMargin, .width]
        handle.wantsLayer = true
        handle.layer?.backgroundColor = NSColor.clear.cgColor
        container.addSubview(handle, positioned: .above, relativeTo: web)

        guard let html = Bundle.main.url(forResource: "desk", withExtension: "html") else {
            writeLog("window: desk.html missing")
            return
        }
        web.loadFileURL(html, allowingReadAccessTo: html.deletingLastPathComponent())
        floating.orderFrontRegardless()
        writeLog("window created frame=\(NSStringFromRect(floating.frame))")
    }

    private func defaultOrigin() -> NSPoint {
        let visible = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1440, height: 900)
        return NSPoint(
            x: visible.maxX - windowWidth - 24,
            y: visible.maxY - windowHeight - 48
        )
    }

    private func restoreOrigin() -> NSPoint {
        guard let x = defaults.object(forKey: positionXKey) as? Double,
              let y = defaults.object(forKey: positionYKey) as? Double else {
            return defaultOrigin()
        }
        let frame = NSRect(x: x, y: y, width: windowWidth, height: windowHeight)
        let visible = NSScreen.screens.contains { screen in
            let overlap = screen.visibleFrame.intersection(frame)
            return !overlap.isNull && overlap.width >= 60 && overlap.height >= 40
        }
        return visible ? NSPoint(x: x, y: y) : defaultOrigin()
    }

    func saveWindowPosition() {
        guard let window = window else { return }
        defaults.set(Double(window.frame.origin.x), forKey: positionXKey)
        defaults.set(Double(window.frame.origin.y), forKey: positionYKey)
    }

    @objc private func screensChanged() {
        guard let window = window, window.isVisible else { return }
        let origin = window.frame.origin
        let visible = NSScreen.screens.contains { screen in
            let overlap = screen.visibleFrame.intersection(window.frame)
            return !overlap.isNull && overlap.width >= 60 && overlap.height >= 40
        }
        if !visible {
            window.setFrameOrigin(defaultOrigin())
            saveWindowPosition()
        } else {
            _ = origin
        }
    }

    private func createStatusItem() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        if let button = statusItem.button {
            if let image = NSImage(systemSymbolName: "display", accessibilityDescription: "Pixel Usage Desk") {
                image.isTemplate = true
                button.image = image
            } else {
                button.title = "PD"
            }
            button.toolTip = "Pixel Usage Desk"
        }
        let menu = NSMenu()
        menu.addItem(NSMenuItem(title: "显示 / 隐藏小屏", action: #selector(toggleWindow), keyEquivalent: ""))
        menu.addItem(NSMenuItem(title: "立即刷新", action: #selector(refreshNow), keyEquivalent: "r"))
        let floatItem = NSMenuItem(title: "悬浮在所有窗口上方", action: #selector(toggleFloat), keyEquivalent: "f")
        floatItem.state = floatAbove ? .on : .off
        floatMenuItem = floatItem
        menu.addItem(floatItem)
        let appearanceRoot = NSMenuItem(title: "外观", action: nil, keyEquivalent: "")
        let appearanceMenu = NSMenu()
        for (title, mode) in [("跟随系统", "auto"), ("浅色", "light"), ("深色", "dark")] {
            let item = NSMenuItem(title: title, action: #selector(setThemeMode(_:)), keyEquivalent: "")
            item.target = self
            item.representedObject = mode
            item.state = (mode == themeMode) ? .on : .off
            appearanceItems.append(item)
            appearanceMenu.addItem(item)
        }
        appearanceRoot.submenu = appearanceMenu
        menu.addItem(appearanceRoot)
        menu.addItem(NSMenuItem(title: "重置位置（右上角）", action: #selector(resetPosition), keyEquivalent: ""))
        menu.addItem(NSMenuItem.separator())
        menu.addItem(NSMenuItem(title: "打开日志", action: #selector(openLog), keyEquivalent: ""))
        menu.addItem(NSMenuItem(title: "退出 Pixel Usage Desk", action: #selector(quitApp), keyEquivalent: "q"))
        for item in menu.items { item.target = self }
        statusItem.menu = menu
    }

    private func applyAppearance() {
        switch themeMode {
        case "light":
            NSApp.appearance = NSAppearance(named: .aqua)
        case "dark":
            NSApp.appearance = NSAppearance(named: .darkAqua)
        default:
            NSApp.appearance = nil
        }
        pushTheme()
    }

    private func pushTheme() {
        guard webReady, let webView = webView else { return }
        webView.evaluateJavaScript("window.__PIXEL_DESK__ && window.__PIXEL_DESK__.setTheme('\(themeMode)')")
    }

    @objc private func setThemeMode(_ sender: NSMenuItem) {
        guard let mode = sender.representedObject as? String else { return }
        themeMode = mode
        defaults.set(mode, forKey: "pxd.theme")
        for item in appearanceItems {
            item.state = (item.representedObject as? String) == mode ? .on : .off
        }
        applyAppearance()
        writeLog("theme=\(mode)")
    }

    @objc private func toggleWindow() {
        guard let window = window else { return }
        if window.isVisible {
            window.orderOut(nil)
        } else {
            NSApp.activate(ignoringOtherApps: true)
            window.makeKeyAndOrderFront(nil)
        }
    }

    @objc private func toggleFloat() {
        floatAbove.toggle()
        defaults.set(floatAbove, forKey: "pxd.floatAbove")
        window?.level = floatAbove ? .floating : baseLevel
        window?.orderFrontRegardless()
        floatMenuItem?.state = floatAbove ? .on : .off
        if floatAbove {
            NSApp.activate(ignoringOtherApps: true)
            window?.makeKeyAndOrderFront(nil)
        }
        writeLog("floatAbove=\(floatAbove)")
    }

    @objc private func resetPosition() {
        guard let window = window else { return }
        window.setFrameOrigin(defaultOrigin())
        saveWindowPosition()
    }

    @objc private func refreshNow() {
        refreshBalance()
        refreshUsage()
    }

    @objc private func openLog() {
        NSWorkspace.shared.open(logURL)
    }

    @objc private func quitApp() {
        NSApp.terminate(nil)
    }

    func windowShouldClose(_ sender: NSWindow) -> Bool {
        sender.orderOut(nil)
        return false
    }

    private func refreshUsage() {
        if usageInFlight { return }
        usageInFlight = true
        DispatchQueue.global(qos: .utility).async { [weak self] in
            let snapshot = readUsage()
            DispatchQueue.main.async {
                guard let self = self else { return }
                self.usage = snapshot
                self.usageInFlight = false
                self.pushSnapshot()
            }
        }
    }

    private func refreshBalance() {
        if balanceInFlight { return }
        balanceInFlight = true
        fetchBalance { [weak self] result in
            DispatchQueue.main.async {
                guard let self = self else { return }
                self.balanceInFlight = false
                switch result {
                case .success(let snapshot):
                    self.balance = snapshot
                    writeLog(String(
                        format: "balance ready %@ normal=%.4f bonus=%.4f spent=%.4f",
                        snapshot.currency, snapshot.normal, snapshot.bonus, snapshot.spent
                    ))
                case .failure(.noToken):
                    self.balance.status = "signed-out"
                    self.balance.error = nil
                    writeLog("balance signed-out: no account token")
                case .failure(.http(let code)) where code == 401 || code == 403:
                    self.balance.status = "signed-out"
                    self.balance.error = nil
                    writeLog("balance signed-out: http \(code)")
                case .failure(.http(let code)):
                    self.balance.status = "error"
                    self.balance.error = "http \(code)"
                    writeLog("balance error: http \(code)")
                case .failure(.protocolError):
                    self.balance.status = "error"
                    self.balance.error = "protocol"
                    writeLog("balance error: protocol")
                case .failure(.network(let message)):
                    self.balance.status = "error"
                    self.balance.error = message
                    writeLog("balance error: network \(message)")
                }
                self.pushSnapshot()
            }
        }
    }

    private func pushSnapshot() {
        guard webReady, let webView = webView else { return }
        let payload = snapshotDictionary(balance: balance, usage: usage)
        guard let data = try? JSONSerialization.data(withJSONObject: payload),
              let json = String(data: data, encoding: .utf8) else {
            writeLog("snapshot: serialization failed")
            return
        }
        webView.evaluateJavaScript("window.__PIXEL_DESK__ && window.__PIXEL_DESK__.update(\(json))") { _, error in
            if let error = error {
                writeLog("snapshot: evaluateJavaScript failed \(error.localizedDescription)")
            }
        }
    }

    // MARK: WKScriptMessageHandler

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "desk",
              let body = message.body as? [String: Any],
              let type = body["type"] as? String else { return }
        switch type {
        case "hide":
            window?.orderOut(nil)
        case "refresh":
            refreshNow()
        case "quit":
            NSApp.terminate(nil)
        default:
            break
        }
    }

    // MARK: WKNavigationDelegate

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        webReady = true
        writeLog("webview finished")
        pushTheme()
        pushSnapshot()
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        writeLog("webview failed: \(error.localizedDescription)")
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        writeLog("webview provisional failed: \(error.localizedDescription)")
    }
}

// MARK: - Entry point

if CommandLine.arguments.contains("--probe") {
    runProbe()
}

let application = NSApplication.shared
let appDelegate = AppDelegate()
application.delegate = appDelegate
application.setActivationPolicy(.regular)
application.run()

window.__ModuleLoader__.load({
  id: 'dsh-pixel-usage-desk',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    /* ------------------------------------------------------------------ *
     * Locale                                                              *
     * ------------------------------------------------------------------ */

    const DICT = {
      en: {
        title: 'Pixel Usage Desk',
        wallet: 'WALLET',
        tokens: 'TOKENS',
        context: 'CONTEXT',
        session: 'SESSION',
        all: 'ALL',
        rate: 'RATE',
        left: 'LEFT',
        bonus: 'BONUS',
        sync: 'SYNC',
        updated: 'UPDATED',
        set: 'SET',
        close: 'CLOSE',
        collapse: 'Collapse widget',
        expand: 'Expand widget',
        resetPos: 'RESET POS',
        budget: 'BUDGET',
        setBudget: 'SET BUDGET',
        idle: 'IDLE',
        run: 'RUN',
        live: 'LIVE',
        noAccount: 'NO ACCOUNT',
        signIn: 'SIGN IN VIA SETTINGS',
        offline: 'OFFLINE',
        loading: 'SYNC...',
        sessions: 'SESSIONS',
        summary: 'Pixel usage desk',
        dragHint: 'Drag to move, double-click to reset',
        syncNow: 'Refresh balance now',
      },
      zh: {
        title: '像素用量台',
        wallet: 'WALLET',
        tokens: 'TOKENS',
        context: 'CONTEXT',
        session: 'SESSION',
        all: 'ALL',
        rate: 'RATE',
        left: 'LEFT',
        bonus: 'BONUS',
        sync: 'SYNC',
        updated: 'UPDATED',
        set: 'SET',
        close: '关闭',
        collapse: '折叠小屏',
        expand: '展开小屏',
        resetPos: '重置位置',
        budget: 'BUDGET',
        setBudget: '设置预算',
        idle: 'IDLE',
        run: 'RUN',
        live: 'LIVE',
        noAccount: '未登录',
        signIn: '请在设置中登录',
        offline: '离线',
        loading: '同步中...',
        sessions: '会话',
        summary: '像素用量台',
        dragHint: '拖动移动，双击复位',
        syncNow: '立即刷新余额',
      },
    }

    /* ------------------------------------------------------------------ *
     * Pixel glyphs (5 x 7)                                                *
     * ------------------------------------------------------------------ */

    const GLYPHS = {
      '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
      '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
      '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
      '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
      '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
      '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
      '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
      '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
      '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
      '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
      '.': ['00000', '00000', '00000', '00000', '00000', '00110', '00110'],
      ':': ['00000', '00110', '00110', '00000', '00110', '00110', '00000'],
      '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
      '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
      'K': ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
      'M': ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
      'B': ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
      '¥': ['10001', '01010', '00100', '11111', '00100', '11111', '00100'],
      '$': ['00100', '01111', '10100', '01110', '00101', '11110', '00100'],
      '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
      '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
      '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
      ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
    }

    const GLYPH_W = 5
    const GLYPH_H = 7

    const KEYS = {
      pos: 'pxd.pos.v1',
      collapsed: 'pxd.collapsed.v1',
      budgets: 'pxd.budgets.v1',
    }

    /* ------------------------------------------------------------------ *
     * Small helpers                                                       *
     * ------------------------------------------------------------------ */

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value))
    }

    function isCount(value) {
      return typeof value === 'number' && Number.isFinite(value)
    }

    function totalOf(usage) {
      if (!usage) return 0
      return (usage.uncachedInputTokens || 0) + (usage.outputTokens || 0) +
        (usage.cacheReadTokens || 0) + (usage.cacheWriteTokens || 0)
    }

    function formatTokens(value) {
      const n = isCount(value) ? Math.max(0, value) : 0
      if (n < 1000) return String(Math.round(n))
      if (n < 1e6) {
        const k = n / 1e3
        return (k < 10 ? k.toFixed(1) : String(Math.round(k))) + 'K'
      }
      if (n < 1e9) {
        const m = n / 1e6
        return (m < 10 ? m.toFixed(2) : m.toFixed(1)) + 'M'
      }
      return (n / 1e9).toFixed(1) + 'B'
    }

    function formatMoney(value, currency) {
      const n = isCount(value) ? value : 0
      return (currency === 'USD' ? '$' : '¥') + n.toFixed(2)
    }

    function formatPercent(value) {
      return isCount(value) ? Math.round(value) + '%' : '--'
    }

    function formatClock(ms) {
      if (!ms) return '--:--:--'
      const date = new Date(ms)
      const pad = (n) => String(n).padStart(2, '0')
      return pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds())
    }

    function contextTone(pct) {
      if (!isCount(pct)) return 'green'
      if (pct >= 85) return 'red'
      if (pct >= 60) return 'amber'
      return 'green'
    }

    function readStored(key, fallback) {
      try {
        const raw = window.localStorage.getItem(key)
        if (raw === null) return fallback
        return JSON.parse(raw)
      } catch (error) {
        return fallback
      }
    }

    function writeStored(key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        /* storage can be unavailable; the widget still works in memory */
      }
    }

    /* ------------------------------------------------------------------ *
     * React hooks                                                         *
     * ------------------------------------------------------------------ */

    function useStored(key, fallback) {
      const [value, setValue] = React.useState(() => readStored(key, fallback))
      const set = React.useCallback((next) => {
        setValue((previous) => {
          const resolved = typeof next === 'function' ? next(previous) : next
          writeStored(key, resolved)
          return resolved
        })
      }, [key])
      return [value, set]
    }

    function useSnapshot(desk) {
      const [snapshot, setSnapshot] = React.useState(desk.getSnapshot())
      React.useEffect(() => {
        setSnapshot(desk.getSnapshot())
        return desk.subscribe(() => setSnapshot(desk.getSnapshot()))
      }, [desk])
      return snapshot
    }

    function useLocale(ctx) {
      const [, bump] = React.useReducer((value) => value + 1, 0)
      React.useEffect(() => {
        const dispose = ctx.locale.subscribe(bump)
        return () => {
          if (typeof dispose === 'function') dispose()
        }
      }, [ctx])
      return ctx.locale.bind('pixelUsageDesk')
    }

    /* ------------------------------------------------------------------ *
     * Pixel primitives                                                    *
     * ------------------------------------------------------------------ */

    function PixelText({ value, scale, className }) {
      const text = String(value === null || value === undefined ? '--' : value).toUpperCase()
      const chars = Array.from(text)
      const columns = Math.max(1, chars.length * (GLYPH_W + 1) - 1)
      const size = isCount(scale) ? scale : 2
      const cells = []

      chars.forEach((char, index) => {
        const rows = GLYPHS[char] || GLYPHS['?']
        const origin = index * (GLYPH_W + 1)
        for (let y = 0; y < GLYPH_H; y += 1) {
          const row = rows[y] || '00000'
          for (let x = 0; x < GLYPH_W; x += 1) {
            if (row.charAt(x) === '1') {
              cells.push(h('rect', {
                key: index + ':' + x + ':' + y,
                x: origin + x,
                y,
                width: 1,
                height: 1,
                fill: 'currentColor',
              }))
            }
          }
        }
      })

      return h('svg', {
        className: 'pxd-pixels' + (className ? ' ' + className : ''),
        viewBox: '0 0 ' + columns + ' ' + GLYPH_H,
        width: columns * size,
        height: GLYPH_H * size,
        shapeRendering: 'crispEdges',
        'aria-hidden': true,
        focusable: 'false',
        style: { maxWidth: '100%', height: 'auto' },
      }, cells)
    }

    function SegBar({ pct, tone, segments, label }) {
      const count = isCount(segments) ? segments : 16
      const value = isCount(pct) ? clamp(pct, 0, 100) : 0
      const filled = Math.round((value / 100) * count)
      const cells = []
      for (let index = 0; index < count; index += 1) {
        cells.push(h('i', {
          key: index,
          className: 'pxd-seg' + (index < filled ? ' pxd-on' : ''),
        }))
      }
      return h('div', {
        className: 'pxd-bar pxd-tone-' + (tone || 'green'),
        role: 'img',
        'aria-label': label || (isCount(pct) ? Math.round(pct) + '%' : 'no data'),
      }, cells)
    }

    function Ticks({ values }) {
      const list = Array.isArray(values) && values.length ? values : []
      let max = 1
      for (const value of list) if (isCount(value) && value > max) max = value
      const cells = list.map((value, index) => {
        const height = isCount(value) && value > 0 ? Math.max(8, Math.round((value / max) * 100)) : 0
        return h('i', {
          key: index,
          className: 'pxd-tick' + (index >= list.length - 3 && height > 0 ? ' pxd-tick-hot' : ''),
          style: { height: height + '%' },
        })
      })
      return h('div', { className: 'pxd-ticks', 'aria-hidden': true }, cells)
    }

    /* ------------------------------------------------------------------ *
     * Data store                                                          *
     * ------------------------------------------------------------------ */

    class UsageDesk {
      constructor(ctx) {
        this.ctx = ctx
        this.listeners = new Set()
        this.snapshot = {
          phase: 'loading',
          account: 'unknown',
          balance: null,
          balanceError: null,
          session: null,
          all: { total: 0, loaded: 0, count: 0 },
          rate: 0,
          ticks: new Array(24).fill(0),
          updatedAt: 0,
        }
        this.currentId = null
        this.samples = []
        this.lastTotal = 0
        this.lastBalanceAt = 0
        this.balanceInFlight = false
        this.started = false
        this.unsubscribeList = null
        this.tickTimer = null
        this.balanceTimer = null
        this.onVisibility = null
      }

      getSnapshot() {
        return this.snapshot
      }

      subscribe(listener) {
        this.listeners.add(listener)
        return () => {
          this.listeners.delete(listener)
        }
      }

      emit() {
        for (const listener of Array.from(this.listeners)) {
          try {
            listener()
          } catch (error) {
            console.error('[pixel-usage-desk] listener failed', error)
          }
        }
      }

      patch(partial) {
        this.snapshot = Object.assign({}, this.snapshot, partial)
        this.emit()
      }

      start() {
        if (this.started) return
        this.started = true
        if (this.ctx.sessions && this.ctx.sessions.list && this.ctx.sessions.list.subscribe) {
          this.unsubscribeList = this.ctx.sessions.list.subscribe(() => this.refreshSessions())
        }
        this.refreshSessions()
        this.refreshBalance(true)
        this.tickTimer = window.setInterval(() => this.tick(), 5000)
        this.balanceTimer = window.setInterval(() => this.refreshBalance(false), 30000)
        this.onVisibility = () => {
          if (document.visibilityState === 'visible') this.refreshBalance(false)
        }
        document.addEventListener('visibilitychange', this.onVisibility)
      }

      stop() {
        if (!this.started) return
        this.started = false
        if (this.unsubscribeList) {
          this.unsubscribeList()
          this.unsubscribeList = null
        }
        if (this.tickTimer) window.clearInterval(this.tickTimer)
        if (this.balanceTimer) window.clearInterval(this.balanceTimer)
        this.tickTimer = null
        this.balanceTimer = null
        if (this.onVisibility) document.removeEventListener('visibilitychange', this.onVisibility)
        this.onVisibility = null
        this.listeners.clear()
      }

      refreshSessions() {
        if (!this.ctx.sessions || !this.ctx.sessions.list) {
          this.patch({ phase: 'ready', session: null, all: { total: 0, loaded: 0, count: 0 }, updatedAt: Date.now() })
          return
        }
        const list = this.ctx.sessions.list.getSnapshot()
        const rows = []
        for (const id of list.ids || []) {
          const row = list.byId ? list.byId[id] : null
          if (row) rows.push(row)
        }

        let current = null
        for (const row of rows) {
          if (row.retainedBy && row.retainedBy.mainView > 0) {
            current = row
            break
          }
        }
        if (!current && rows.length > 0) current = rows[0]

        let session = null
        if (current) {
          const projections = current.projectionValues || {}
          const usage = projections.tokenUsage
          const pressure = projections.contextPressure
          const input = usage && isCount(usage.uncachedInputTokens) ? usage.uncachedInputTokens : 0
          const output = usage && isCount(usage.outputTokens) ? usage.outputTokens : 0
          const cacheRead = usage && isCount(usage.cacheReadTokens) ? usage.cacheReadTokens : 0
          const cacheWrite = usage && isCount(usage.cacheWriteTokens) ? usage.cacheWriteTokens : 0
          const total = input + output + cacheRead + cacheWrite
          const used = pressure && isCount(pressure.projectedTokens)
            ? pressure.projectedTokens
            : pressure && isCount(pressure.pressureTokens) ? pressure.pressureTokens : null
          const contextWindow = pressure && isCount(pressure.contextWindow) ? pressure.contextWindow : null
          const contextPct = used !== null && contextWindow !== null && contextWindow > 0
            ? Math.min(100, (used / contextWindow) * 100)
            : null

          session = {
            id: current.id,
            running: Boolean(current.running),
            total,
            input,
            output,
            cacheRead,
            cacheWrite,
            contextUsed: used,
            contextWindow,
            contextPct,
          }
        }

        let total = 0
        let loaded = 0
        for (const row of rows) {
          const usage = row.projectionValues && row.projectionValues.tokenUsage
          if (usage) {
            loaded += 1
            total += totalOf(usage)
          }
        }

        if (session && session.id !== this.currentId) {
          this.currentId = session.id
          this.samples = []
          this.lastTotal = session.total
          this.ticks = new Array(24).fill(0)
        } else if (!session) {
          this.currentId = null
          this.samples = []
          this.lastTotal = 0
          this.ticks = new Array(24).fill(0)
        }

        this.patch({
          phase: 'ready',
          session,
          all: { total, loaded, count: rows.length },
          updatedAt: Date.now(),
        })
      }

      tick() {
        const session = this.snapshot.session
        if (!session) {
          this.patch({ rate: 0, updatedAt: Date.now() })
          return
        }

        const total = session.total
        if (session.id !== this.currentId) {
          this.currentId = session.id
          this.samples = []
          this.lastTotal = total
          this.ticks = new Array(24).fill(0)
        }

        const delta = Math.max(0, total - this.lastTotal)
        this.lastTotal = total
        this.ticks = this.ticks.slice(1).concat(delta)

        const now = Date.now()
        this.samples.push({ t: now, total })
        while (this.samples.length > 2 && now - this.samples[0].t > 60000) this.samples.shift()

        let rate = 0
        if (this.samples.length >= 2) {
          const first = this.samples[0]
          const last = this.samples[this.samples.length - 1]
          const span = last.t - first.t
          if (span >= 5000) rate = Math.max(0, ((last.total - first.total) * 60000) / span)
        }

        this.patch({ rate, ticks: this.ticks.slice(), updatedAt: now })
        if (delta > 0) this.refreshBalance(false)
      }

      accountMeta() {
        const boot = typeof window !== 'undefined' ? window.__DSH_BOOT__ : null
        const release = boot && boot.release
        const version = release && typeof release.version === 'string' && release.version
          ? release.version
          : '0.0.0'
        let locale = 'en'
        try {
          const snapshot = this.ctx.locale.getSnapshot()
          if (snapshot && typeof snapshot.active === 'string' && snapshot.active) locale = snapshot.active
        } catch (error) {
          /* keep the fallback */
        }
        return {
          version,
          locale,
          timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60,
        }
      }

      async refreshBalance(force) {
        if (this.balanceInFlight) return
        const now = Date.now()
        if (!force && now - this.lastBalanceAt < 15000) return

        this.balanceInFlight = true
        this.lastBalanceAt = now
        try {
          const result = await this.ctx.remote.account.getBalance(this.accountMeta())
          if (!result || result.ok !== true) {
            const message = result && result.error && result.error.message
              ? result.error.message
              : 'account request rejected'
            throw new Error(message)
          }

          const value = result.value
          if (value === null || value === undefined) {
            this.patch({ account: 'signed-out', balance: null, balanceError: null, updatedAt: Date.now() })
            return
          }
          if (value.status === 'failed') {
            this.patch({ account: 'failed', balanceError: 'account read failed', updatedAt: Date.now() })
            return
          }

          const wallets = Array.isArray(value.value) ? value.value : []
          const bonuses = Array.isArray(value.bonusWallets) ? value.bonusWallets : []
          let primary = null
          for (const wallet of wallets) {
            if (wallet && wallet.currency === 'CNY') {
              primary = wallet
              break
            }
          }
          if (!primary && wallets.length > 0) primary = wallets[0]
          if (!primary) {
            this.patch({ account: 'ready', balance: null, balanceError: null, updatedAt: Date.now() })
            return
          }

          const amount = Number(primary.balance)
          let bonus = 0
          for (const wallet of bonuses) {
            if (wallet && wallet.currency === primary.currency) {
              const value = Number(wallet.balance)
              if (Number.isFinite(value)) bonus += value
            }
          }

          this.patch({
            account: 'ready',
            balance: {
              currency: primary.currency,
              amount: Number.isFinite(amount) ? amount + bonus : bonus,
              bonus,
              at: Date.now(),
            },
            balanceError: null,
            updatedAt: Date.now(),
          })
        } catch (error) {
          this.patch({
            account: 'error',
            balanceError: error && error.message ? String(error.message) : String(error),
            updatedAt: Date.now(),
          })
        } finally {
          this.balanceInFlight = false
        }
      }
    }

    /* ------------------------------------------------------------------ *
     * Styles                                                              *
     * ------------------------------------------------------------------ */

    const CSS = [
      '.pxd-layer{position:fixed;inset:0;pointer-events:none;z-index:40}',
      '.pxd-desk{--pxd-ink:#0a0c10;--pxd-case:#2b2f3a;--pxd-case-hi:#4a5160;--pxd-case-lo:#171a21;--pxd-screen:#07130c;--pxd-green:#3dff8b;--pxd-green-dim:#1f7a4a;--pxd-green-dark:#0f3d27;--pxd-amber:#ffb64d;--pxd-red:#ff5d5d;--pxd-paper:#d9ffe8;--pxd-muted:#6fbf92;position:fixed;right:24px;top:64px;width:320px;pointer-events:auto;user-select:none;z-index:41;color:var(--pxd-paper);font-family:ui-monospace,"SFMono-Regular",Menlo,"Courier New",monospace}',
      '.pxd-desk.pxd-collapsed{width:260px}',
      '.pxd-case{background:var(--pxd-case);border:2px solid var(--pxd-ink);padding:3px;box-shadow:4px 4px 0 rgba(0,0,0,.55)}',
      '.pxd-bezel{background:var(--pxd-case-lo);border:2px solid var(--pxd-ink);padding:4px}',
      '.pxd-head{display:flex;align-items:center;gap:6px;padding:0 2px 4px;cursor:grab;touch-action:none;user-select:none}',
      '.pxd-head:active{cursor:grabbing}',
      '.pxd-brand{font-size:9px;line-height:1;font-weight:700;letter-spacing:.12em;color:var(--pxd-paper);text-shadow:1px 1px 0 #000}',
      '.pxd-led{width:6px;height:6px;flex:none;background:#3a1d1d;border:1px solid #000}',
      '.pxd-led.pxd-green{background:var(--pxd-green);box-shadow:0 0 6px var(--pxd-green);animation:pxd-blink 2s steps(2,end) infinite}',
      '.pxd-led.pxd-red{background:var(--pxd-red);box-shadow:0 0 5px rgba(255,93,93,.6)}',
      '.pxd-led.pxd-amber{background:var(--pxd-amber);box-shadow:0 0 5px rgba(255,182,77,.5)}',
      '.pxd-live{font-size:8px;line-height:1;font-weight:700;letter-spacing:.08em;color:var(--pxd-muted)}',
      '.pxd-grow{flex:1}',
      '.pxd-badge{font-size:7px;line-height:1;font-weight:700;letter-spacing:.08em;color:var(--pxd-red);border:1px solid var(--pxd-red);padding:2px 3px;white-space:nowrap}',
      '.pxd-btn{appearance:none;border:1px solid var(--pxd-ink);background:var(--pxd-case);color:var(--pxd-paper);font-family:ui-monospace,"SFMono-Regular",Menlo,"Courier New",monospace;font-size:8px;font-weight:700;line-height:1;letter-spacing:.08em;padding:3px 5px;cursor:pointer;box-shadow:inset 1px 1px 0 var(--pxd-case-hi),inset -1px -1px 0 var(--pxd-ink)}',
      '.pxd-btn:hover{background:var(--pxd-case-hi)}',
      '.pxd-btn:active{transform:translate(1px,1px);box-shadow:inset -1px -1px 0 var(--pxd-case-hi),inset 1px 1px 0 var(--pxd-ink)}',
      '.pxd-btn:focus-visible,.pxd-link:focus-visible,.pxd-input:focus-visible{outline:2px solid var(--pxd-green);outline-offset:2px}',
      '.pxd-screen{position:relative;overflow:hidden;background:var(--pxd-screen);border:2px solid var(--pxd-ink);padding:8px 8px 6px;box-shadow:inset 0 0 0 1px #143d28,inset 0 0 22px rgba(61,255,139,.09)}',
      '.pxd-screen::before{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;background:radial-gradient(ellipse at 50% 40%,transparent 50%,rgba(0,0,0,.42) 100%)}',
      '.pxd-screen::after{content:"";position:absolute;inset:0;z-index:3;pointer-events:none;background:repeating-linear-gradient(to bottom,rgba(0,0,0,.26) 0 1px,transparent 1px 3px)}',
      '.pxd-screen > *{position:relative;z-index:1}',
      '.pxd-row{display:flex;align-items:flex-end;justify-content:space-between;gap:8px;margin:0 0 3px}',
      '.pxd-label{font-size:8px;line-height:1;font-weight:700;letter-spacing:.14em;color:var(--pxd-muted);text-transform:uppercase}',
      '.pxd-pct{font-size:10px;line-height:1;font-weight:700;letter-spacing:.06em;color:var(--pxd-paper)}',
      '.pxd-sub{display:flex;justify-content:space-between;gap:6px;font-size:8px;line-height:1.35;font-weight:700;letter-spacing:.03em;color:var(--pxd-green-dim)}',
      '.pxd-sub.pxd-three{gap:4px}',
      '.pxd-rule{height:1px;background:#123d28;margin:5px 0}',
      '.pxd-pixels{display:block;color:var(--pxd-paper);filter:drop-shadow(0 0 3px rgba(61,255,139,.18))}',
      '.pxd-bar{display:flex;gap:2px;height:8px;margin:3px 0 4px}',
      '.pxd-seg{flex:1;min-width:0;background:#0d2a1c;border:1px solid #06120c}',
      '.pxd-seg.pxd-on{background:currentColor;box-shadow:0 0 4px currentColor}',
      '.pxd-tone-green{color:var(--pxd-green)}',
      '.pxd-tone-amber{color:var(--pxd-amber)}',
      '.pxd-tone-red{color:var(--pxd-red)}',
      '.pxd-ticks{display:grid;grid-template-columns:repeat(24,1fr);gap:1px;height:14px;align-items:end;margin:5px 0 2px}',
      '.pxd-tick{display:block;width:100%;min-height:2px;background:var(--pxd-green-dim)}',
      '.pxd-tick.pxd-tick-hot{background:var(--pxd-green)}',
      '.pxd-foot{display:flex;justify-content:space-between;gap:6px;border-top:1px dashed #143d28;margin-top:5px;padding-top:4px;font-size:8px;line-height:1.2;font-weight:700;letter-spacing:.02em;color:var(--pxd-green-dim);white-space:nowrap}',
      '.pxd-foot.pxd-foot-first{border-top:0;margin-top:2px;padding-top:0}',
      '.pxd-link{appearance:none;border:0;background:none;padding:0;color:var(--pxd-green);font:inherit;cursor:pointer;text-decoration:underline}',
      '.pxd-mini{position:relative;overflow:hidden;display:flex;align-items:center;gap:8px;min-height:34px;padding:6px 8px;background:var(--pxd-screen);border:2px solid var(--pxd-ink)}',
      '.pxd-mini::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(to bottom,rgba(0,0,0,.26) 0 1px,transparent 1px 3px)}',
      '.pxd-mini > *{position:relative;z-index:1}',
      '.pxd-mini-sep{width:1px;height:14px;flex:none;background:#143d28}',
      '.pxd-mini-meta{margin-left:auto;font-size:8px;font-weight:700;letter-spacing:.04em;color:var(--pxd-green-dim);white-space:nowrap}',
      '.pxd-stand{display:flex;flex-direction:column;align-items:center;pointer-events:none}',
      '.pxd-stand i{display:block;background:var(--pxd-case);border:2px solid var(--pxd-ink);border-top:0}',
      '.pxd-stand i:first-child{width:44px;height:10px}',
      '.pxd-stand i:last-child{width:110px;height:6px}',
      '.pxd-settings{display:flex;flex-direction:column;gap:6px;margin-top:3px;padding:6px;border:2px solid var(--pxd-ink);background:var(--pxd-case-lo)}',
      '.pxd-set-row{display:flex;align-items:center;gap:6px;font-size:8px;font-weight:700;letter-spacing:.08em;color:var(--pxd-muted)}',
      '.pxd-input{width:64px;padding:3px 4px;background:var(--pxd-screen);border:1px solid var(--pxd-green-dark);color:var(--pxd-paper);font-family:ui-monospace,"SFMono-Regular",Menlo,"Courier New",monospace;font-size:9px;font-weight:700;line-height:1;appearance:textfield}',
      '.pxd-input::-webkit-inner-spin-button,.pxd-input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}',
      '.pxd-set-actions{display:flex;justify-content:flex-end;gap:6px}',
      '.pxd-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}',
      '@keyframes pxd-blink{0%,49%{opacity:1}50%,100%{opacity:.35}}',
      '@media (prefers-reduced-motion:reduce){.pxd-led.pxd-green{animation:none}}',
      '@media (max-width:520px){.pxd-desk{width:280px;right:12px;top:56px}.pxd-desk.pxd-collapsed{width:240px}}',
    ].join('\n')

    /* ------------------------------------------------------------------ *
     * Component                                                           *
     * ------------------------------------------------------------------ */

    function DeskView({ desk, ctx }) {
      const snapshot = useSnapshot(desk)
      const t = useLocale(ctx)
      const [collapsed, setCollapsed] = useStored(KEYS.collapsed, false)
      const [position, setPosition] = React.useState(() => readStored(KEYS.pos, null))
      const [budgets, setBudgets] = useStored(KEYS.budgets, { CNY: 50, USD: 10 })
      const [settingsOpen, setSettingsOpen] = React.useState(false)
      const rootRef = React.useRef(null)
      const positionRef = React.useRef(position)
      const dragRef = React.useRef(null)

      positionRef.current = position

      const commitPosition = React.useCallback((next, persist) => {
        const resolved = typeof next === 'function' ? next(positionRef.current) : next
        positionRef.current = resolved
        setPosition(resolved)
        if (persist) writeStored(KEYS.pos, resolved)
      }, [])

      const balance = snapshot.balance
      const currency = balance ? balance.currency : 'CNY'
      const savedBudgets = budgets && typeof budgets === 'object' ? budgets : {}
      const budget = isCount(savedBudgets[currency]) ? savedBudgets[currency] : currency === 'USD' ? 10 : 50
      const money = balance ? formatMoney(balance.amount, balance.currency) : '--'
      const leftPct = balance && budget > 0 ? clamp(100 - (balance.amount / budget) * 100, 0, 100) : null
      const leftTone = !isCount(leftPct) ? 'green' : leftPct > 50 ? 'green' : leftPct > 20 ? 'amber' : 'red'
      const session = snapshot.session
      const tokens = session ? session.total : 0
      const tokenText = formatTokens(tokens)
      const contextPct = session && isCount(session.contextPct) ? session.contextPct : null
      const live = snapshot.account === 'ready' && snapshot.phase === 'ready'
      const ledTone = snapshot.account === 'ready'
        ? 'green'
        : snapshot.account === 'error' || snapshot.account === 'failed' || snapshot.account === 'signed-out'
          ? 'red'
          : 'amber'
      const badge = snapshot.account === 'error' || snapshot.account === 'failed'
        ? t('offline')
        : snapshot.account === 'signed-out'
          ? t('noAccount')
          : null
      const posStyle = position && isCount(position.x) && isCount(position.y)
        ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' }
        : undefined
      const contextText = isCount(contextPct) ? Math.round(contextPct) + '%' : '--'
      const summary = t('summary') + '. ' + money + '. ' + tokenText + ' tokens. ' + contextText + ' context.'

      const stopProp = (event) => event.stopPropagation()

      const toggleCollapsed = () => {
        setSettingsOpen(false)
        setCollapsed((value) => !value)
      }

      const resetPosition = () => {
        commitPosition(null, true)
      }

      const updateBudget = (event) => {
        const raw = Number(event.target.value)
        const next = Number.isFinite(raw) && raw >= 0 ? raw : 0
        setBudgets((previous) => Object.assign({}, previous, { [currency]: next }))
      }

      const onDragStart = (event) => {
        if (event.button !== 0) return
        const element = rootRef.current
        if (!element) return
        const rect = element.getBoundingClientRect()
        dragRef.current = {
          dx: event.clientX - rect.left,
          dy: event.clientY - rect.top,
          width: rect.width,
          height: rect.height,
        }
        if (event.currentTarget.setPointerCapture) {
          try {
            event.currentTarget.setPointerCapture(event.pointerId)
          } catch (error) {
            /* pointer capture is optional */
          }
        }
        event.preventDefault()
      }

      const onDragMove = (event) => {
        const drag = dragRef.current
        if (!drag) return
        const x = clamp(event.clientX - drag.dx, 8, Math.max(8, window.innerWidth - drag.width - 8))
        const y = clamp(event.clientY - drag.dy, 8, Math.max(8, window.innerHeight - drag.height - 8))
        commitPosition({ x, y }, false)
      }

      const onDragEnd = (event) => {
        if (!dragRef.current) return
        dragRef.current = null
        if (event.currentTarget.releasePointerCapture) {
          try {
            event.currentTarget.releasePointerCapture(event.pointerId)
          } catch (error) {
            /* nothing to release */
          }
        }
        if (positionRef.current) writeStored(KEYS.pos, positionRef.current)
      }

      React.useEffect(() => {
        if (!position) return undefined
        const onResize = () => {
          const element = rootRef.current
          if (!element) return
          const rect = element.getBoundingClientRect()
          const x = clamp(position.x, 8, Math.max(8, window.innerWidth - rect.width - 8))
          const y = clamp(position.y, 8, Math.max(8, window.innerHeight - rect.height - 8))
          if (x !== position.x || y !== position.y) commitPosition({ x, y }, true)
        }
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
      }, [position, commitPosition])

      React.useEffect(() => {
        const onKeyDown = (event) => {
          if (event.key !== 'Escape') return
          if (settingsOpen) setSettingsOpen(false)
          else if (!collapsed) setCollapsed(true)
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
      }, [settingsOpen, collapsed, setCollapsed])

      const header = h('header', {
        className: 'pxd-head',
        onPointerDown: onDragStart,
        onPointerMove: onDragMove,
        onPointerUp: onDragEnd,
        onPointerCancel: onDragEnd,
        onDoubleClick: resetPosition,
        title: t('dragHint'),
      },
        h('span', { className: 'pxd-brand' }, 'PIXEL DESK'),
        h('span', { className: 'pxd-led pxd-' + ledTone }),
        h('span', { className: 'pxd-live' }, collapsed ? '' : (live ? t('live') : '')),
        badge ? h('span', { className: 'pxd-badge' }, badge) : null,
        h('span', { className: 'pxd-grow' }),
        collapsed ? null : h('button', {
          className: 'pxd-btn',
          type: 'button',
          title: t('set'),
          'aria-label': t('set'),
          onPointerDown: stopProp,
          onClick: () => setSettingsOpen((value) => !value),
        }, t('set')),
        h('button', {
          className: 'pxd-btn',
          type: 'button',
          title: collapsed ? t('expand') : t('collapse'),
          'aria-label': collapsed ? t('expand') : t('collapse'),
          onPointerDown: stopProp,
          onClick: toggleCollapsed,
        }, collapsed ? '+' : '–'),
      )

      const walletSub = balance
        ? (isCount(leftPct) ? Math.round(leftPct) + '% ' + t('left') : t('setBudget')) +
          (budget > 0 ? '   ' + t('budget') + ' ' + formatMoney(budget, currency) : '')
        : snapshot.account === 'signed-out' ? t('signIn') : t('setBudget')

      const screen = h('div', { className: 'pxd-screen' },
        h('div', { className: 'pxd-row' },
          h('span', { className: 'pxd-label' }, t('wallet')),
          h(PixelText, { value: money, scale: 2 }),
        ),
        balance && budget > 0
          ? h(SegBar, { pct: leftPct, tone: leftTone, label: Math.round(leftPct) + '% ' + t('left') })
          : null,
        h('div', { className: 'pxd-sub' },
          h('span', null, walletSub),
          balance && balance.bonus > 0
            ? h('span', null, t('bonus') + ' ' + formatMoney(balance.bonus, currency))
            : null,
        ),
        h('div', { className: 'pxd-rule' }),
        h('div', { className: 'pxd-row' },
          h('span', { className: 'pxd-label' }, t('tokens')),
          h(PixelText, { value: tokenText, scale: 2 }),
        ),
        h('div', { className: 'pxd-sub pxd-three' },
          h('span', null, 'IN ' + formatTokens(session ? session.input : 0)),
          h('span', null, 'OUT ' + formatTokens(session ? session.output : 0)),
          h('span', null, 'CACHE ' + formatTokens(session ? session.cacheRead + session.cacheWrite : 0)),
        ),
        h('div', { className: 'pxd-rule' }),
        h('div', { className: 'pxd-row' },
          h('span', { className: 'pxd-label' }, t('context')),
          h('span', { className: 'pxd-pct' }, formatPercent(contextPct)),
        ),
        h(SegBar, { pct: contextPct, tone: contextTone(contextPct), label: contextText + ' context' }),
        h('div', { className: 'pxd-sub' },
          h('span', null,
            session && isCount(session.contextUsed) && isCount(session.contextWindow)
              ? formatTokens(session.contextUsed) + ' / ' + formatTokens(session.contextWindow)
              : '--'),
          h('span', null, session && session.running ? t('run') : t('idle')),
        ),
        h(Ticks, { values: snapshot.ticks }),
        h('div', { className: 'pxd-foot pxd-foot-first' },
          h('span', null, t('session') + ' ' + formatTokens(tokens)),
          h('span', null, t('all') + ' ' + formatTokens(snapshot.all.total)),
          h('span', null, snapshot.rate > 0 ? formatTokens(snapshot.rate) + '/M' : t('idle')),
        ),
        h('div', { className: 'pxd-foot' },
          h('span', null, t('updated') + ' ' + formatClock(snapshot.updatedAt)),
          h('button', {
            className: 'pxd-link',
            type: 'button',
            title: t('syncNow'),
            'aria-label': t('syncNow'),
            onClick: () => desk.refreshBalance(true),
          }, t('sync')),
        ),
      )

      const mini = h('div', { className: 'pxd-mini' },
        h(PixelText, { value: money, scale: 2 }),
        h('span', { className: 'pxd-mini-sep' }),
        h(PixelText, { value: tokenText, scale: 1 }),
        h('span', { className: 'pxd-mini-meta' }, snapshot.rate > 0 ? formatTokens(snapshot.rate) + '/M' : t('idle')),
      )

      const settings = h('div', { className: 'pxd-settings' },
        h('label', { className: 'pxd-set-row' },
          h('span', null, t('budget')),
          h('input', {
            className: 'pxd-input',
            type: 'number',
            min: 0,
            step: 1,
            value: budget,
            'aria-label': t('budget'),
            onChange: updateBudget,
          }),
          h('span', null, currency),
        ),
        h('div', { className: 'pxd-set-actions' },
          h('button', { className: 'pxd-btn', type: 'button', onClick: resetPosition }, t('resetPos')),
          h('button', { className: 'pxd-btn', type: 'button', onClick: () => setSettingsOpen(false) }, t('close')),
        ),
      )

      return h('div', { className: 'pxd-layer' },
        h('section', {
          ref: rootRef,
          className: 'pxd-desk' + (collapsed ? ' pxd-collapsed' : ''),
          style: posStyle,
          'aria-label': t('title'),
        },
          h('style', null, CSS),
          h('div', { className: 'pxd-case' },
            h('div', { className: 'pxd-bezel' },
              header,
              collapsed ? mini : screen,
              !collapsed && settingsOpen ? settings : null,
            ),
            collapsed ? null : h('div', { className: 'pxd-stand', 'aria-hidden': true }, h('i'), h('i')),
          ),
          h('span', { className: 'pxd-sr' }, summary),
        ),
      )
    }

    /* ------------------------------------------------------------------ *
     * Apply                                                               *
     * ------------------------------------------------------------------ */

    function apply(ctx) {
      ctx.effect(
        () => ctx.locale.register('pixelUsageDesk', { en: DICT.en, zh: DICT.zh }),
        'pixel-usage-desk: locale',
      )

      const desk = new UsageDesk(ctx)
      ctx.effect(() => {
        desk.start()
        return () => desk.stop()
      }, 'pixel-usage-desk: data')

      const Widget = () => h(DeskView, { desk, ctx })
      ctx.slots.inject('shell.overlay', () => ctx.slots.register({
        name: 'shell.overlay',
        id: 'pixel-usage-desk',
        order: 50,
      }, Widget))
    }

    return {
      inject: ['slots', 'sessions', 'remote', 'remote.account', 'locale'],
      apply,
    }
  },
})

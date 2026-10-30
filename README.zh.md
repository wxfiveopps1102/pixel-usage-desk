# Pixel Usage Desk

[English](README.md) | **简体中文**

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![DSH](https://img.shields.io/badge/DSH-0.2.1%2B-1f6feb.svg)](https://github.com/deepseek-ai/deepseek-harness)
[![macOS](https://img.shields.io/badge/macOS-13%2B-lightgrey.svg)](desktop/README.md)
[![validate](https://github.com/wxfiveopps1102/pixel-usage-desk/actions/workflows/validate.yml/badge.svg)](https://github.com/wxfiveopps1102/pixel-usage-desk/actions/workflows/validate.yml)

一个给 **DeepSeek Harness** 用的复古像素 CRT：工作时随时看到 DeepSeek 账户余额和实时 Token 用量。

仓库包含两个相关部分：

| 部分 | 位置 | 说明 |
|---|---|---|
| **DSH 浮层插件** | 仓库根目录 | Harness Web UI 里的 `shell.overlay` 小组件：余额、当前会话 Token、上下文、累计用量、实时速率。 |
| **macOS 桌面 app** | [`desktop/`](desktop/README.md) | 同样的视觉，做成透明独立窗口，可放在屏幕任意位置。 |

![Pixel Usage Desk — 白天 / 黑夜](assets/preview.png)

*截图：macOS 桌面 app。浅色是米色机身 + 浅绿 LCD，深色是绿色荧光 CRT；DSH 浮层使用同一套显示设计。*

## 功能

### DSH 浮层

- 余额 + 预算进度条；钱包金额包含普通余额和赠送余额。
- 当前会话 Token：输入、输出、缓存读/写。
- 上下文占用分段条（`已用 / 上下文窗口`）。
- 已加载会话的累计 Token，以及实时 tokens/min 和 24 格活动条。
- `SYNC` 刷新余额，`SET` 修改本地预算，`–` 折叠。
- 5×7 点阵数字、扫描线、硬阴影、减少动效支持。
- **不调用模型**：只读 DSH 的 session projection 和已有的账户 Remote，不消耗 Token。

### macOS 桌面 app

- 透明、无边框、默认置顶；拖**整个上方边框**移动。
- 浅色 / 深色 / 跟随系统。深色是绿色 CRT，浅色是米色 LCD。
- Dock 图标 + 菜单栏图标；`×` 只隐藏窗口，点 Dock 图标重新打开。
- `SPENT` 是账户累计消耗（平台 `total_costs`），不是 Token 数。
- 读取同一份 DSH 本地数据；DSH 关闭后仍可运行，但 Token 可能过期、缓存不再更新。

## 仓库结构

```text
.
├── client.js                 # Web Client：浮层 UI 和数据 store
├── index.js                  # Host 半：故意为空
├── cordis.patch.yml          # 插件 Loader 行
├── package.json              # dsh.bundle + dsh.client 清单
├── locale/                   # 插件管理页标题/描述
├── icon.svg                  # 插件图标
├── desktop/                  # 独立 macOS app（Swift + WKWebView）
├── assets/                   # 商店图标和预览图
├── market/                   # awesome-dsh-plugin 目录条目
└── .github/workflows/        # 语法 / 清单校验
```

## 环境要求

- **DSH 0.2.1 或更新版本**（浮层）。
- **在 DSH 中登录的 DeepSeek 账户**（余额）；没有账户时 Token 用量仍可用，钱包会显示 `OFFLINE` / `NO ACCOUNT`。
- **macOS 13+ 和 Xcode Command Line Tools**（桌面 app，`swiftc`）。

## 安装 DSH 插件

### 从 Git 安装

在 DSH 的 Plugins 页面把本仓库添加为插件源：

```text
https://github.com/wxfiveopps1102/pixel-usage-desk
```

或者 `dsh` CLI 在 PATH 中时：

```bash
dsh plugin --profile <profile> add git+https://github.com/wxfiveopps1102/pixel-usage-desk.git
```

安装后在 Plugins 页面启用 **Pixel Usage Desk**，小屏会出现在 frame-wide overlay 的右上角。

> 仓库根目录就是可安装的 bundle（`package.json` 里的 `dsh.bundle` + `cordis.patch.yml`）。`desktop/` 里的 macOS app 是单独下载，**不会**被这个插件安装。

### 从社区目录安装

仓库已经准备好提交到 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) 目录，见 [`SUBMIT.md`](SUBMIT.md)。目录合并后，可以在任意 format-1 市场（包括 [dsh-market](https://github.com/dsh-market/dsh-market)）里直接安装。

## 使用浮层

- 拖 `PIXEL DESK` 标题移动（在 DSH 窗口内）。
- `SET` 修改余额进度条使用的本地预算。
- `SYNC` 立即刷新余额。
- `–` 折叠成一条紧凑状态条。
- 不需要时在 Plugins 页面禁用插件即可。

浮层只能活在 DSH 窗口内；要在桌面任意位置拖动，请用 macOS app。

## 桌面 app

```bash
cd desktop
./build.sh
open PixelUsageDesk.app
```

操作、可选 LaunchAgent 和故障排查见 [`desktop/README.md`](desktop/README.md)。app 是本地 ad-hoc 签名，不是公证过的下载包。

## 数据来源

### 浮层

- 钱包：DSH 现有的 `ctx.remote.account.getBalance(...)`（`deepseek-account` provider）。Remote 是可选依赖：没有账户服务时 Token 指标仍然工作，钱包显示 `OFFLINE`。
- Token：`ctx.sessions.list` 和 token-meter 的 wire projection（`tokenUsage`、`contextPressure`）。浏览器里不重放 session 日志。
- 刷新：余额每 30 秒，用量随 session 变化，速率每 5 秒。

### 桌面 app

- 钱包：`~/.dsh/.credentials.yaml` 里当前 DeepSeek 账户 token，只发送到 `https://platform.deepseek.com/api/v0/users/get_user_summary`。
- Token：`~/.dsh/storages/session_projcache/sessions/*.json`；当前会话取最近修改的缓存文件。
- 刷新：余额每 30 秒，用量每 2 秒。

## 隐私与安全

- **没有遥测**，**不调用模型**。
- 桌面 app 只**只读** DSH 的凭据 token；不写入、不打印，除了 DeepSeek Platform 余额接口之外不上传。
- 浮层通过 DSH 的账户 Remote 访问，不自己开网络连接。
- 仓库里没有任何凭据。请在本机构建桌面 app；不要把包含别人数据的副本分发出去。

## 兼容性与限制

- 浮层需要 DSH Web `0.2.1+` 和 `shell.overlay` / session-controller 服务。
- 钱包余额需要已登录的 DeepSeek 账户；Token 用量完全在本地，不依赖账户。
- “全部”是已加载 projection 的会话合计，不是历史数据库；暂时没有按天/按月统计。
- projection cache 在 DSH checkpoint 时更新，所以浮层可能比实时请求慢一点；速率条只是参考值。
- 桌面 app 仅 macOS，ad-hoc 签名未公证；macOS 可能要求 `Start Pixel Usage Desk.command` 或 Gatekeeper 确认。
- DSH 关闭后，桌面 app 保留最后数据；余额 token 可能过期，projection cache 不再前进。
- 桌面 app 不是 DSH 插件，不能从插件市场安装。

## 开发

```bash
# JavaScript 语法和清单检查
node --check index.js
node --check client.js
npm pack --dry-run

# 桌面 app
cd desktop
./build.sh
```

GitHub Actions 会在每次 push / pull request 时运行语法/清单检查。

## 故障排查

| 现象 | 检查 |
|---|---|
| 浮层没有出现 | 插件已安装并启用；刷新 DSH 页面；看浏览器 console 是否有 `pixel-usage-desk`。 |
| 钱包显示 `NO ACCOUNT` | 到 DSH Settings → Account 登录 DeepSeek 账户。 |
| 钱包显示 `OFFLINE` | 账户 Remote 或平台请求失败；点 `SYNC`；检查 DSH 账户会话。 |
| Token 一直是 0 | 打开一个会话；projection cache 会在 DSH checkpoint 时写入。 |
| 桌面 app 打不开 | macOS 13+；双击 `PixelUsageDesk.app`；LaunchServices 拒绝 ad-hoc 签名时用 `desktop/Start Pixel Usage Desk.command`。 |
| 桌面 app 不见了 | 点 Dock 里的 Pixel Usage Desk 图标，或菜单栏显示器图标。 |
| 桌面 app 数据不动 | DSH 关闭或未登录；重新打开 DSH，等一个 checkpoint。 |

## 贡献

欢迎 issue 和 PR。浮层的数据契约尽量保持只读，不要给小组件加模型调用。目录投稿只需要一个文件，见 [`SUBMIT.md`](SUBMIT.md)。

## 许可证

MIT，见 [`LICENSE`](LICENSE)。

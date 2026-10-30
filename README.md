# Pixel Usage Desk

A retro pixel CRT for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): watch the DeepSeek account balance and live token usage without leaving the harness.

The repository contains two related pieces:

1. **`dsh-pixel-usage-desk`** — a DSH Web plugin that renders the compact CRT in the Harness `shell.overlay`.
2. **`desktop/`** — a standalone macOS app with the same visual, transparent and freely draggable anywhere on the display, with light/dark themes.

![Pixel Usage Desk — light / dark](assets/preview.png)

## DSH plugin

- Requires DSH `0.2.1` or newer.
- Shows the account balance (normal + bonus), the current session's token totals (input / output / cache), context occupancy, the accumulated total, and a live rate/tick strip.
- Reads the balance from the existing `deepseekAccount` service and the token projections from the session list. No model calls, no token consumption.
- Refreshes the balance every 30 s and the usage every 2 s.

### Install

Use the DSH Plugins page and add this Git repository as a plugin source, or install the bundle with the plugin manager:

```text
https://github.com/wxfiveopps1102/pixel-usage-desk
```

After installation, enable **Pixel Usage Desk**. The overlay appears in the frame-wide overlay layer at the top-right. Drag the top-left `PIXEL DESK` header to move it; `SET` changes the budget used by the balance gauge.

The plugin itself lives at the repository root:

- `cordis.patch.yml` inserts the `pixel-usage-desk` row.
- `index.js` is the Host half (no behavior; the Client half owns the UI).
- `client.js` is the Web Client half.
- `locale/en.json` and `locale/zh.json` provide the plugin-manager title and description.

## macOS desktop app

The desktop app is a separate, optional macOS application. It is **not** installed by the DSH plugin; it lives in [`desktop/`](desktop/README.md).

```bash
cd desktop
./build.sh
open PixelUsageDesk.app
```

It reads the same local DeepSeek account token (`~/.dsh/.credentials.yaml`, read-only) and the DSH projection cache (`~/.dsh/storages/session_projcache/sessions`). It can stay open when DSH is closed, but the balance token may expire and the usage cache stops updating without DSH.

- Transparent, borderless, draggable from the entire top border.
- Light / dark / follow-system appearance.
- Dock icon and menu-bar icon; closing the window only hides it.
- Day/night palettes: warm beige LCD in light mode, green phosphor CRT in dark mode.

See [`desktop/README.md`](desktop/README.md) for build, menu, and data details.

## Privacy

Neither part calls a model. The only network request is the DeepSeek Platform account summary used to read the wallet balance; the token is read from the local DSH credentials file and is never written or uploaded. Token totals are computed from DSH's own local projection cache.

## License

MIT. See [`LICENSE`](LICENSE).

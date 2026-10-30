# Submitting this plugin to the community catalog

The community list behind [dsh-market](https://github.com/dsh-market/dsh-market), [awesome-dsh-plugin.com](https://awesome-dsh-plugin.com) and [dshmarket.com](https://dshmarket.com) is the **[awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)** registry. Do **not** open a PR against `dsh-market/dsh-market`; it says so in its own README.

The local Git repository is ready and committed. The two remaining steps need your GitHub account.

## 1. Create and push the GitHub repository

The catalog entry points at:

```text
https://github.com/wxfiveopps1102/pixel-usage-desk
```

Create a **public** GitHub repository named `pixel-usage-desk` under `wxfiveopps1102` (empty, no README), then:

```bash
cd pixel-usage-desk-community
git remote add origin https://github.com/wxfiveopps1102/pixel-usage-desk.git
git push -u origin main
```

Or, if you have GitHub CLI authenticated:

```bash
gh repo create wxfiveopps1102/pixel-usage-desk --public --source=. --remote=origin --push
gh repo edit wxfiveopps1102/pixel-usage-desk --add-topic dsh-plugin
```

Also add the **`dsh-plugin`** topic in the repository settings. This is required by the list.

> **The repository must be at least 1 day old before the catalog PR can pass CI.** Create it now; open the PR tomorrow. This rule is checked automatically.

## 2. Add the catalog entry

Fork **[awesome-dsh-plugin/awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)**, then add exactly one file:

```text
data/plugins/wxfiveopps1102__pixel-usage-desk.yml
```

The exact content is in [`market/awesome-dsh-plugin.yml`](market/awesome-dsh-plugin.yml). Copy it and keep these fields:

```yaml
url: https://github.com/wxfiveopps1102/pixel-usage-desk
name: wxfiveopps1102/pixel-usage-desk
category: usage
description:
  en: Retro pixel CRT overlay for DSH showing the DeepSeek account balance and live token usage.
  zh: 复古像素 CRT 的 DSH 浮层，实时显示 DeepSeek 账户余额与 Token 用量。
icon: https://raw.githubusercontent.com/wxfiveopps1102/pixel-usage-desk/main/assets/icon-180.png
```

Then:

```bash
cd awesome-dsh-plugin
git checkout -b add-wxfiveopps1102-pixel-usage-desk
cp /path/to/pixel-usage-desk-community/market/awesome-dsh-plugin.yml \
   data/plugins/wxfiveopps1102__pixel-usage-desk.yml
git add data/plugins/wxfiveopps1102__pixel-usage-desk.yml
git commit -m "Add wxfiveopps1102/pixel-usage-desk"
git push -u origin add-wxfiveopps1102-pixel-usage-desk
```

Open the PR with title `Add wxfiveopps1102/pixel-usage-desk` and a one-line body describing the plugin.

## Requirements checklist

- [x] Repository root `package.json` declares `dsh.bundle` and has a `cordis.patch.yml`.
- [x] Real, working DSH plugin code in the repository.
- [x] MIT license.
- [ ] Public GitHub repository.
- [ ] `dsh-plugin` topic.
- [ ] Repository at least 1 day old.
- [ ] One `data/plugins/<owner>__<repo>.yml` file in the PR.

After merge, the catalog is regenerated automatically and this plugin appears in the market. No further PR is needed in the market app.

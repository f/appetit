# Appétit

> *Bon appétit for apps.*

An Apple App Store-inspired web app that showcases your projects in a beautiful, browsable catalog. Built entirely with vanilla HTML, CSS, and JS — no frameworks, no build step.

All content is driven from a single `apps.json` file, making it easy to add, remove, or update apps without touching any code.

**Live:** [apps.fka.dev](https://apps.fka.dev)

## Features

- **App Store UI** — Dark and light themes with sidebar navigation, featured carousel, app cards, and detail pages
- **JSON-driven** — All apps, categories, and featured items are defined in `apps.json`
- **Brew / npx install modals** — macOS and CLI apps prompt with copy-to-clipboard install commands
- **Category filtering** — macOS, Web, CLI, Developer Tools, Productivity
- **Search** — Instant client-side search across names, descriptions, and features
- **Screenshots** — Detail pages show preview images from your repos
- **GitHub stats** — Star and fork counts displayed on every app, updatable via `update-stats.sh`
- **Responsive** — Works on desktop and mobile
- **Zero dependencies** — Pure HTML/CSS/JS, deploys anywhere as static files

## Quick Start

```bash
git clone https://github.com/f/appetit.git
cd appetit
```

Serve locally:

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Make It Yours

1. **Edit `apps.json`** — Replace the apps with your own projects. Each app entry supports:
   - `name`, `subtitle`, `description`, `longDescription`
   - `icon` (URL) or `iconEmoji` with optional `iconStyle` for sizing
   - `category` array (e.g. `["macos", "cli"]`)
   - `platform`, `price`, `language`, `stars`, `forks`
   - `github`, `homepage` URLs
   - `brew` or `installCommand` for install modals
   - `features` array and `screenshots` array

2. **Edit categories** — Add or remove categories in the `categories` array

3. **Edit featured** — Set the `featured` array with `id`, `headline`, `title`, `subtitle`

4. **Deploy** — Push to GitHub and enable Pages, or drop the files on any static host

## Update GitHub Stats

Run the included script to fetch live star/fork counts from the GitHub API:

```bash
./update-stats.sh
```

Set `GITHUB_TOKEN` for higher rate limits:

```bash
GITHUB_TOKEN=ghp_xxx ./update-stats.sh
```

## File Structure

```
├── index.html          # Main HTML shell
├── style.css           # All styles (dark/light themes)
├── app.js              # App logic, routing, rendering
├── apps.json           # All app data (edit this)
├── logo.svg            # Favicon
├── update-stats.sh     # GitHub stars/forks updater
└── .nojekyll           # Prevents Jekyll processing on GitHub Pages
```

## Deploy to GitHub Pages

1. Push to a GitHub repo
2. Go to Settings → Pages
3. Set source to your branch and `/` root
4. Optionally set a custom domain via CNAME

## License

MIT

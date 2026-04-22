# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`moedict-app` is the **native offline wrapper** around [moedict.tw](https://github.com/g0v/moedict.tw). It uses Capacitor 7 to package the upstream React app into Android / iOS / macOS binaries with all dictionary data, full-text search indexes, and stroke-order animations bundled inside — no network required at runtime.

**This repo contains no React source code.** `src/` is a symlink into the `moedict.tw/` git submodule. See `moedict.tw/CLAUDE.md` for frontend architecture, component layout, and the worker/API conventions — that file is authoritative for anything under `src/`.

## Commands

Package manager here is **npm** (not Bun — that's upstream only). The wrapper's `package.json` is deliberately minimal.

```bash
npm install              # also runs: git submodule update --init --depth 1
npm run prepare-data     # stage dictionary/search-index/assets/strokes into public/
npm run dev              # Vite dev server (runs against the symlinked src/)
npm run build            # tsc -b && vite build
npm run build:android    # prepare-data + build + cap sync android
npm run build:ios        # prepare-data + build + cap sync ios
npm run build:macos      # build + scripts/build-macos.sh (produces build/萌典.app)
npm run lint             # eslint
```

There are no tests in this wrapper. The upstream `moedict.tw/` submodule has its own three-tier test suite (unit / integration / e2e) — run those from inside the submodule.

### Single-test / watch loops

Not applicable at this layer. For iterating on UI logic, either:
- run `npm run dev` here and hit the app in a browser (offline API activates in dev when `VITE_CLOUDFLARE_REMOTE_DEV` is unset), or
- `cd moedict.tw` and use its own dev/test flow.

## Repository shape

```
moedict-app/
  src -> moedict.tw/src           # symlink — DO NOT edit through this path
  moedict.tw/                     # git submodule (shallow clone, depth 1)
  capacitor.config.ts             # appId: org.audreyt.dict.moe, webDir: dist
  vite.config.ts                  # plain React plugin, no aliases
  index.html                      # wrapper-specific (favicons, OG tags, manifest)
  scripts/
    prepare-data.sh               # stages submodule data → public/
    download-strokes.sh           # fetches U+4E00–U+9FFF stroke JSONs
    minify-strokes.mjs
    build-macos.sh                # assembles macos/萌典.app from dist/
  public/                         # populated by prepare-data.sh (gitignored)
    dictionary/                   # pack/, pcck/, phck/, ptck/ + a/c/h/t/
    search-index/                 # Fuse.js indexes per language
    assets-legacy/                # legacy moedict-webkit css/js/fonts
    stroke-json/                  # COMMITTED (~115MB, compresses well)
  android/ ios/ macos/            # Capacitor-generated native projects
```

Key things the layout implies:

- **Don't edit `src/`** — it's a symlink. All React/TypeScript changes belong upstream in `moedict.tw/src/`. Commit there, pull the submodule bump here, re-run `prepare-data` if data files changed.
- **`public/dictionary/`, `public/search-index/`, `public/assets-legacy/` are gitignored.** They are staged by `scripts/prepare-data.sh` from the submodule. A fresh clone has no data until you run `npm run prepare-data`.
- **`public/stroke-json/` IS committed** (see `.gitignore` comment). Don't regenerate it casually — `download-strokes.sh` hits a Rackspace CDN and is slow.
- **`android/app/src/main/assets/public/` is gitignored** — Capacitor copies `dist/` into it during `cap sync`.

## The key architectural trick: environment-detected offline API

Both moedict.tw (online, Cloudflare Workers + R2) and moedict-app (offline, bundled data) ship **the identical React bundle**. The switch happens in `src/offline-api.ts` (upstream), which monkey-patches `window.fetch` **only when** running inside Capacitor (or in dev without `VITE_CLOUDFLARE_REMOTE_DEV` set):

```ts
if (Capacitor || (import.meta.env.DEV && !import.meta.env.VITE_CLOUDFLARE_REMOTE_DEV)) {
  // intercept /api/* and serve from /dictionary/, /search-index/, /stroke-json/
}
```

Consequences for changes in this repo:

- Adding a new `/api/*` route requires updating `offline-api.ts` (upstream) **and** usually `scripts/prepare-data.sh` (to stage whatever data the route needs into `public/`). Otherwise the route works online but 404s in the packaged app.
- Paths served offline mirror what `prepare-data.sh` writes. `/api/index/a.json` → `/dictionary/a/index.json`; `/api/search-index/a.json` → `/search-index/a.json`. If you change the staging layout, change the router map to match.
- Capacitor's `androidScheme: 'https'` means requests look like `https://localhost/...` at runtime — paths are absolute from the webview root.

## Submodule workflow

```bash
# Pull upstream changes
cd moedict.tw && git pull origin main && cd ..
git add moedict.tw
git commit -m "Update moedict.tw to <sha>"

# If upstream changed files under data/ or scripts/build-search-index.mjs,
# re-stage before building:
npm run prepare-data
```

The `postinstall` hook does `git submodule update --init --depth 1`, so `npm install` on a fresh clone is sufficient — no `--recurse-submodules` needed.

## Build dependencies

`prepare-data.sh` expects this layout inside the submodule:

- `moedict.tw/data/dictionary/{pack,pcck,phck,ptck,a,c,h,t}/` — required, hard error if missing
- Search indexes: tries `moedict.tw/public/search-index/*.json`, then `moedict.tw/data/dictionary/search-index/*.json`, then falls back to running `node moedict.tw/scripts/build-search-index.mjs`. If upstream renames the script or output dir, update `prepare-data.sh`.
- `moedict.tw/data/assets/{css,js,fonts,images,styles.css}` — staged into `public/assets-legacy/` for the legacy moedict-webkit skin.

The `build-macos.sh` script compiles `macos/main.swift` with `swiftc` (target arm64-apple-macos13.0), copies `Info.plist` and `AppIcon.icns` from `macos/萌典.app/`, and drops `dist/` into `Contents/Resources/public/`. It's not an Xcode project — it's hand-assembled. Don't expect `cap sync macos` to produce a shippable app; run the script instead.

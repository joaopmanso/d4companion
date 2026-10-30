# Overview

**D4 Companion** is a Diablo IV build companion at https://joaopmanso.github.io/d4companion. Players pick a build guide, record their characters' gear, and paste item screenshots to find out whether an item is an upgrade and what to fix on it. It also shows the guide's skill tree, Paragon boards, farming routes and activity helpers (Hordes, War Plans, Strongrooms).

Maintainer: João Pedro Manso (GitHub `joaopmanso`). PRs are merged by hand.

## Hard constraints

These shape every change. Each has an ADR.

- **Browser-only.** No accounts and no app server. Characters and settings live in `localStorage`, and screenshots in IndexedDB. Export/Import backup moves data between devices. ([ADR 0001](adr/0001-browser-only.md))
- **Guide data is synced, not hand-written.** A daily job scrapes d4builds.gg, the only guide site that permits it, into `public/data/`. Maxroll, Mobalytics and Icy Veins are links only. ([ADR 0002](adr/0002-guide-sync-d4builds.md))
- **No images in the repo.** Art is linked from sunderarmor.com and Blizzard, optionally through the art-cache Worker.
- **Screenshot reading is free by default.** Tesseract runs in the browser. Claude is opt-in with the player's own API key, sent only to `api.anthropic.com`. ([ADR 0003](adr/0003-two-screenshot-readers.md), [ADR 0004](adr/0004-ocr-vocabulary-snapping.md))
- **Static hosting.** Vite builds to `dist/`, which deploys to GitHub Pages. ([ADR 0006](adr/0006-static-github-pages.md))
- **Personal data never in git.** `.gitignore` blocks exports and backups. Share links never include screenshots or the API key. ([ADR 0005](adr/0005-share-links-worker.md))

## Stack

Vanilla ES modules with no framework, plus Vite 6. Runtime dependencies are `tesseract.js` 5 and `@anthropic-ai/sdk`. Tests use `node --test`. Scraping uses Playwright, run by GitHub Actions. Season 15 content, with all eight classes: Barbarian, Druid, Necromancer, Paladin, Rogue, Sorcerer, Spiritborn and Warlock.

## Related repositories

- `d4companion-cdn` (private): a Cloudflare Worker at `https://d4companion-art.joaopmanso.workers.dev/`. It caches art (`sa/`, `bnet/`) and stores short share links (`POST /share`, `GET /share/<id>`).

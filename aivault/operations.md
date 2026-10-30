# Operations

## Commands (`package.json`)
| Command | Does |
|---|---|
| `npm run dev` | Vite dev server at http://localhost:5173 (also in `.claude/launch.json`). |
| `npm test` | `node --test "tests/*.test.js"`: evaluator, OCR parser, vault coverage. |
| `npm run build` | Static site in `dist/` (`base: "./"`, so it works under any Pages path). |
| `npm run preview` | Serves `dist/`. |
| `npm run sync` | `scripts/fetch-guides.mjs`: scrapes d4builds into `public/data/`, then rebuilds `items.json`. Needs `npx playwright install chromium`. |
| `npm run items` | `scripts/build-items.mjs`: rebuilds `public/data/items.json` from the synced files. No network needed. Prints which uniques have no clean tooltip. |

## CI (`.github/workflows/`)
- **`sync-guides.yml`** runs daily at 06:17 UTC, and can be started by hand. Steps: `npm ci`, install Playwright Chromium, `npm run sync`, `npm test`. It then commits `public/data` as `Sync guides YYYY-MM-DD`, only if something changed, and pushes to `main`.
- **`deploy.yml`** runs on a push to `main`, after a successful **Sync guides** run (bot pushes don't trigger push workflows), or by hand. Steps: `npm ci`, `npm test`, `npm run build`, then deploy to GitHub Pages. **A failing test, including the vault test, blocks the deploy.**

## Committing
- Commit and push straight to `main`; no PRs. Every push deploys, so run `npm test` and `npm run build` first.
- Each change updates `aivault/` (see [README](README.md#keeping-it-current-every-change)) and adds a line to [changelog.md](changelog.md).

## Testing the OCR reader
- Unit tests in `tests/parse.test.js` use real class vocab from `public/data/class-*.json` and noisy OCR text. When a real screenshot misreads, paste its Tesseract text into a new test. The reader keeps it on `item.rawText`; it isn't shown in the UI, so log it from `recognize()` in devtools.
- End to end: render a tooltip, or use a real screenshot, then run `src/recognize/index.js` in Chromium against `npm run dev`. Tesseract's worker, core and `eng.traineddata` come from `cdn.jsdelivr.net` by default.

## Cloud session gotchas (Claude Code on the web)
- `cdn.jsdelivr.net` and most of the web are blocked, but npm works. To run Tesseract, use `npm pack @tesseract.js-data/eng@1` for the language data. In Node, pass it with `langPath`. In Playwright, answer jsdelivr requests from `node_modules/tesseract.js/dist`, `node_modules/tesseract.js-core` and that file using `context.route`.
- Playwright: launch with `executablePath: "/opt/pw-browsers/chromium"`, because the project's Playwright version differs from the preinstalled browser.
- `npm install` rewrites `package-lock.json` with a newer npm. Don't commit that unless dependencies changed.
- GitHub pushes from a session need the Claude GitHub App to have access to `joaopmanso/d4companion`.

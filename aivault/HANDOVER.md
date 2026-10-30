# Handover, 2026-10-30

For any session that was working on this repo before this date. Read this once, then work from the vault as usual. Delete the "Pick-up steps" section once every active session has picked this up.

## What changed on `main`

1. **Free OCR reader rewritten** (`src/recognize/`). It now matches each tooltip line to the game's vocabulary instead of trusting Tesseract's letters. New files: `vocab.js` and `fuzzy.js`. `parse.js` was rewritten, and `ocr.js` uses an Otsu threshold, PSM 4 and loads the class vocabulary. The root cause was that bullet icons read as junk, so affixes fell into the aspect text. On rendered tooltips it went from 42% to 100% of fields right. Details: [ADR 0004](adr/0004-ocr-vocabulary-snapping.md).
2. **`aivault/` docs vault added.** It is now the source of truth for architecture, data model, features, operations, roadmap, ADRs and prompts. Root `CLAUDE.md` points every session here. Details: [ADR 0007](adr/0007-aivault-source-of-truth.md).
3. **The Claude reader's prompt moved** to `aivault/prompts/tooltip-reader.system.md`. `src/recognize/claude.js` imports it with `?raw`, and the text is unchanged.
4. **`tests/vault.test.js`** fails `npm test`, and so the deploy, when a file under `src/`, `scripts/` or `tests/`, an npm script, an ADR or a prompt isn't mentioned in the vault.
5. **Workflow:** commit and push straight to `main`, with no PRs. Every push deploys.

## Pick-up steps

1. Pull `main` (or rebase onto it) before your next commit. Expect conflicts only if you touched `src/recognize/parse.js`, `ocr.js`, `claude.js` or `README.md`.
2. Read `CLAUDE.md`, then `aivault/README.md`.
3. If you added or renamed files that aren't on `main` yet, add them to `aivault/architecture.md`, or `npm test` will fail.
4. Check that the vault covers whatever you were building. Update `features.md`, `roadmap.md` and `changelog.md` in the same commit.
5. Run `npm test` and `npm run build`, then push to `main`.

## Open items

- The OCR reader is untested on **real game screenshots**. The next step is real tooltip crops as fixtures, then Greater Affix and temper icon detection. See [roadmap.md](roadmap.md).
- These need the maintainer's confirmation: roadmap items marked *(proposed)*, and ADRs 0001–0003 and 0005–0006, which were reconstructed from the code.
- Known issue: any "damage reduction from/while …" line maps to the plain `damageReduction` key.

## Gotchas

Cloud sessions can't reach `cdn.jsdelivr.net`, need a specific Playwright browser path, and get `package-lock.json` churn from `npm install`. See [operations.md](operations.md#cloud-session-gotchas-claude-code-on-the-web).

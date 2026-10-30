# Changelog

One line per change, newest first. Format: `YYYY-MM-DD · area · what changed`.

- 2026-10-30 · ocr · Items are identified by name from the new all-class `public/data/items.json` (`npm run items`, also rebuilt on every sync); rarity, type and slot come from the catalog. This fixes mythics being read as helms. Wrapped type lines, `Mythic Charm`, base stats ("288 All Resist") and the Quality line are handled, and unique powers are no longer read as affixes. Item check says when it can't tell the slot instead of assuming Helm.
- 2026-10-30 · ocr · Charms and seals: the reader recognises `Set Charm`/`Unique Charm`/`Seal` type lines, matches names past the art's junk, and reads multi-line Lucky Hit affixes. Item check shows a talisman verdict and "Put in talisman" instead of treating them as a helm. Footer text is centred.
- 2026-10-30 · process · Changes are committed straight to `main` (no PRs); each push deploys.
- 2026-10-30 · docs · Added `aivault/` as the source of truth for AI sessions and prompts, root `CLAUDE.md`, and `tests/vault.test.js`. The Claude reader's system prompt moved to `aivault/prompts/tooltip-reader.system.md`.
- 2026-10-30 · ocr · Free OCR now snaps lines to the game's vocabulary (types, uniques, affixes, skills, aspects). It fixes digit and letter misreads, drops icon junk and roll ranges, and uses an Otsu threshold. Rendered tooltips went from 42% to 100% of fields right.
- 2026-10-30 · data · Daily guide sync (ongoing, commits titled `Sync guides YYYY-MM-DD`).

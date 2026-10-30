# Changelog

One line per PR, newest first. Format: `YYYY-MM-DD · area · what changed (PR link once merged)`.

- 2026-10-30 · docs · Added `aivault/` as the source of truth for AI sessions and prompts, root `CLAUDE.md`, and `tests/vault.test.js`. The Claude reader's system prompt moved to `aivault/prompts/tooltip-reader.system.md`.
- 2026-10-30 · ocr · Free OCR now snaps lines to the game's vocabulary (types, uniques, affixes, skills, aspects). It fixes digit and letter misreads, drops icon junk and roll ranges, and uses an Otsu threshold. Rendered tooltips went from 42% to 100% of fields right.
- 2026-10-30 · data · Daily guide sync (ongoing, commits titled `Sync guides YYYY-MM-DD`).

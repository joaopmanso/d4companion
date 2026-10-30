# Features

Status: ✅ shipped · 🧪 shipped, needs real-world tuning · 🗺️ planned (see [roadmap.md](roadmap.md))

| Feature | Status | Where | Notes |
|---|---|---|---|
| Guide browser: class picker, Season tier list (S–C, then unranked), every variant | ✅ | `views/guidepicker.js`, `data/guides.js` | **Change guide** in the header switches the active character's build within its class. |
| Characters: create, switch, delete | ✅ | `views/characters.js`, `lib/store.js` | The site ships with no characters. |
| Backup export/import (screenshots included) | ✅ | `lib/store.js` | |
| Loadout paperdoll with good/bad affix marks and next steps (enchant, temper, imprint, socket) | ✅ | `views/loadout.js`, `evaluate.js`, `lib/itemview.js` | Empty slots stay empty. The guide target is shown separately. |
| Talisman (charms, seal, set counts) | ✅ | `lib/talisman.js`, `views/loadout.js` | |
| Gear stat totals and guide fit | ✅ | `lib/gearstats.js` | Multipliers are summed roughly. |
| Item check: paste (`Ctrl+V`) or drop a screenshot, then a verdict and actions, then Equip | ✅ | `views/check.js`, `evaluate.js` | |
| Item check for charms and seals: talisman verdict, set count, "Put in talisman" | ✅ | `views/check.js`, `lib/talisman.js` | Fills the first empty socket, else replaces the first charm the guide doesn't use. |
| Free OCR reader (Tesseract) | 🧪 | `recognize/ocr.js`, `parse.js`, `vocab.js`, `fuzzy.js` | Uniques, mythics, charms and seals are identified by name from `items.json` (162 uniques and mythics, 207 charms), then lines are snapped to the game's vocabulary. Rendered test tooltips score 100%. Three real screenshots (a set charm; Moloch's Beating Flame; Elegy, with art junk, a socket and every icon type) read fully. Greater Affix, enchant and temper come from each line's icon; socket effects are recorded. The large blue box icon is assumed to be a Greater Affix (its value is above 1.5× the range). |
| Claude reader (player's own API key) | ✅ | `recognize/claude.js`, prompt in `aivault/prompts/` | Opus, Sonnet or Haiku 5.5. Falls back to OCR on error. |
| Skill tree: compact and full, Mine and Guide | ✅ | `views/skills.js` | |
| Paragon boards: tile art, rotation, Mine and Guide | ✅ | `views/paragon.js` | |
| Farm guide: best route per needed piece | ✅ | `views/farm.js`, `data/sources.js` | Routes are hand-kept for Season 15. |
| Hordes offer picker | ✅ | `views/hordes.js`, `data/activities.js` | |
| War Plans, Strongrooms | ✅ | `views/warplans.js`, `views/strongroom.js` | |
| Share links: short (Worker) with packed-URL fallback, read-only viewer, "Save a copy" | ✅ | `lib/share.js`, `main.js` | Never includes screenshots or the API key. |
| Themes: dark (default), light, system | ✅ | `lib/theme.js` | |
| Daily guide sync and deploy | ✅ | `scripts/`, `.github/workflows/` | See [operations.md](operations.md). |
| OCR: Greater Affix and temper icon detection | 🗺️ | | Needs real screenshots to calibrate. |
| OCR: auto-crop the tooltip out of a full-screen screenshot | 🗺️ | | |

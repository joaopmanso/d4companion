# Roadmap

Ordered by priority within each section. When an item ships, delete it here and record it in [features.md](features.md) and [changelog.md](changelog.md). Items marked *(proposed)* have not been confirmed by the maintainer yet.

## Next
- **A full item database, not just what guides use** *(proposed)*. `items.json` only knows items some synced guide uses (162 uniques and mythics, 207 charms). A drop no guide uses isn't identified by name, so it falls back to reading the type line. Scrape a complete item list in `npm run sync`, from a source whose terms allow it, and merge it in `scripts/build-items.mjs`.
- **Fix the scraper grabbing the socketed gem's tooltip** *(proposed)*. 32 uniques (mostly jewellery, e.g. Moloch's Beating Flame) have a Soul Splinter tooltip instead of their own, so their affix pool is empty. The hover in `scripts/lib/d4builds.mjs` needs to target the item art, not the socket.
- **Real screenshot fixtures for the OCR reader** *(proposed)*. One real case is in `tests/parse.test.js` (a set charm). Add a few more real tooltip crops (1080p, 1440p, 4K) under `tests/fixtures/tooltips/`, with expected items, plus a script that runs them through Tesseract. This is the only way to tune the preprocessing honestly.
- **Confirm the icon meanings** *(proposed)*. `iconMarks` was calibrated on three real screenshots. The large blue box icon (Elegy's Willpower) is assumed to be a Greater Affix, and orange value text (likely a masterwork crit) isn't used. Check both with more screenshots.
- **Name socketed gems from their effect** *(proposed)*. Free OCR records a socket's effect line. Mapping effects to gem and rune names needs their effect text in the synced data.
- **Auto-crop the tooltip from a full-screen screenshot** *(proposed)*. Find the dark plate and its border, or OCR once, find the rarity line's block, crop, and OCR again.

## Later
- Split "Damage Reduction from Close/Distant Enemies" and "…while Fortified" into their own affix keys. Today they map to `damageReduction` (see Known issues).
- Weapon-type vocabulary for Paladin and Warlock base weapons, once the catalog exposes them.

## Known issues
- `matchAffix` maps any line containing "damage reduction" to `damageReduction`, so conditional DR affixes score as plain DR.
- Free OCR guesses tempers by position (5th and later affixes on legendaries, 3rd and later on magic items). The player can fix it in the form.
- The guide data has typos ("Critcal Strike Chance", "All Damage Multipler"). The OCR vocabulary ignores near-copies of base phrases, but guide affix names are shown as scraped.

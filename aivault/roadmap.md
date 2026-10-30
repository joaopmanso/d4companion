# Roadmap

Ordered by priority within each section. When an item ships, delete it here and record it in [features.md](features.md) and [changelog.md](changelog.md). Items marked *(proposed)* have not been confirmed by the maintainer yet.

## Next
- **Real screenshot fixtures for the OCR reader** *(proposed)*. Add a few real tooltip crops (1080p, 1440p, 4K) under `tests/fixtures/tooltips/`, with expected items, plus a script that runs them through Tesseract. This is the only way to tune the preprocessing honestly.
- **Greater Affix and temper icon detection** *(proposed)*. Use Tesseract line boxes (`data.lines[].bbox`) to sample the icon left of each affix line in the original colour image. Classify it as a regular bullet, GA star, temper or enchant by colour and shape. Calibrate on the fixtures above.
- **Auto-crop the tooltip from a full-screen screenshot** *(proposed)*. Find the dark plate and its border, or OCR once, find the rarity line's block, crop, and OCR again.

## Later
- Split "Damage Reduction from Close/Distant Enemies" and "…while Fortified" into their own affix keys. Today they map to `damageReduction` (see Known issues).
- Weapon-type vocabulary for Paladin and Warlock base weapons, once the catalog exposes them.

## Known issues
- `matchAffix` maps any line containing "damage reduction" to `damageReduction`, so conditional DR affixes score as plain DR.
- Free OCR guesses tempers by position (5th and later affixes on legendaries, 3rd and later on magic items). The player can fix it in the form.
- The guide data has typos ("Critcal Strike Chance", "All Damage Multipler"). The OCR vocabulary ignores near-copies of base phrases, but guide affix names are shown as scraped.

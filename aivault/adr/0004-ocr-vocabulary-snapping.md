# 0004. Free OCR snaps lines onto the tooltip's closed vocabulary

- Status: Accepted
- Date: 2026-10-30

## Context
Raw Tesseract text from D4 tooltips is noisy. Bullet icons read as junk before each affix ("+ +185 Willpower"), digits and letters swap ("Wi11power", "8OO ltem Power"), roll ranges come out garbled ("[1 «© | |"), and the textured plate leaves specks. The old parser required each affix line to start with a number, so most affixes fell into the aspect text. On rendered tooltips it got 42% of fields right. Diablo IV tooltips have a rigid layout and a closed vocabulary, and the synced class data already lists the class's uniques, aspects (with power text) and skills.

## Decision
Parse by snapping, not by trusting characters. `src/recognize/vocab.js` builds the vocabulary: base affix, type and noise lists, plus the class catalog. `src/recognize/parse.js` uses `src/recognize/fuzzy.js` (Levenshtein, stricter on short words) to:
- find the rarity and type line, with fuzzy "Ancestral" and "Mythic"
- snap unique and mythic names to the catalog
- split each line into value and stat, dropping icon junk and anything from the roll-range bracket on, and fixing O/l/I/S/B in numbers
- snap the stat to an affix, or a rank line to a skill, backing off trailing junk words
- rejoin wrapped affixes, and name a legendary's aspect by word overlap with the catalog's power texts

Preprocessing uses Tesseract PSM 4 and, at first, an Otsu threshold clamped to 80–140. That was later replaced by a local threshold, because bright plates broke it (see the changelog).

## Consequences
- 100% of fields right on the rendered test set. Real screenshots still need fixtures (see roadmap).
- New affixes or item types must be added to `vocab.js` base lists, or come through the class catalog. Otherwise they are dropped or misread.
- Snapping can turn garbage into a plausible wrong affix. The thresholds (0.78 for affixes, 0.85 for words of 6 letters or fewer) trade this off, and the review form is the safety net.

## Alternatives considered
- Tesseract character whitelists or a custom-trained font model: brittle, and a heavy download.
- Always use Claude: costs the player money (see 0003).

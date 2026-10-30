# 0008. Identify items by name from one all-class catalog

- Status: Accepted
- Date: 2026-10-30

## Context
Real screenshots showed the free reader inventing items. Moloch's Beating Flame came out as a nameless helm, because:
- its type line wrapped onto two lines,
- its stylised name read as "MONOCH'S BEA TING FLARE",
- the reader only looked in the active class's catalog, where Moloch's tooltip was a Soul Splinter's,
- with no type, Item check fell back to Helm.

Diablo IV's uniques, mythics, charms and seals form a finite list with fixed names, types, slots and affix pools. The reader should look items up, not guess them.

## Decision
- `scripts/build-items.mjs` merges every class file and guide into `public/data/items.json`, rebuilt on every sync. It keeps each item's first real tooltip, and its slot from the guide slot it's worn in.
- `parseTooltip` identifies the item **by name first**. It matches every run of name lines, with trailing art junk trimmed, against that catalog, limited to what the type line allows (charm vs gear, and the slot). It then takes rarity, type and slot from the catalog. Reading the type line is the fallback, for legendaries and rares, whose names are random.
- A known unique's affixes are snapped to its own pool first.
- `tests/parse.test.js` checks that every unique, mythic and charm in `items.json` is identified from its upper-case name, with junk next to it.

## Consequences
- Mythics and uniques get the right slot even when the type line is unreadable.
- Coverage is limited to items some synced guide uses. 32 of them have no clean tooltip yet, so they have no affix pool. Both gaps are on the roadmap.
- `items.json` is about 300 KB and loaded once, on the first screenshot.

## Alternatives considered
- Keep per-class catalogs: mythics and shared uniques would be missing or broken, depending on the class.
- Rely on the type line: it wraps, and OCR garbles it.

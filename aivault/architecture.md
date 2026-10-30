# Architecture

A single-page app with hash routes (`#/<view>`, or `#/c/<id>/<view>` and `#/s/<packed>/<view>` for shared characters). `src/main.js` loads the active character's guide and class data, then renders one view at a time. Each view keeps its own container for the page's lifetime.

```
public/data/*.json ──fetch──▶ src/data/guides.js (toBuild) ──▶ build ─┐
localStorage / IndexedDB ──▶ src/lib/store.js ──▶ character ───────────┼──▶ src/views/* ──▶ DOM
screenshot ──▶ src/recognize/* ──▶ item ──▶ src/evaluate.js ───────────┘
```

## Source map

Every file under `src/` and `scripts/` must be listed here. `tests/vault.test.js` enforces this.

### App shell
| File | Role |
|---|---|
| `src/main.js` | Routing, header (character picker, guide picker), loading the build plus class data (`ensureBuild`), migrations, share-link banner, global paste handler. `VIEWS` lists the tabs. `NEEDS_CHAR` lists views that need a character. |
| `src/css/app.css` | Entry stylesheet: the Hallmark stamp (the design's recorded decisions), then imports the rest in order. |
| `src/css/tokens.css` | Every colour, font, space, size and duration token; dark default, light under `[data-theme=light]`; the fixed "deep plate" colours for game art. |
| `src/css/base.css` | Hallmark's base rules (focus ring, clipping, reduced motion). Rarely edited. |
| `src/css/shell.css` | The bar, tabs, footer and shared components (`.btn`, `.panel`, tags, `.ico` item tile, `.gt` game tooltip, tables, `.seg`). |
| `src/css/loadout.css` | Loadout screen: paperdoll, talisman, runes, slot tooltip, gear stats, pick list. |
| `src/css/trees.css` | Skill tree and Paragon screens. |
| `src/css/check.css` | Item check (and the item form it shares with the loadout), farm guide, Hordes. |
| `src/css/pages.css` | War Plans, Strongrooms, Sources, Characters, the welcome flow and the guide picker dialog. |
| `index.html` | Shell markup: header, tabs, `#main`. |

### Views (`src/views/`), one per tab, each exporting `render(root, ctx)`
| File | Tab |
|---|---|
| `src/views/loadout.js` | **Loadout.** In-game style paperdoll of the character's own gear, talisman, runes and Splinters. The guide's target is shown dimmed with next steps. Share button. |
| `src/views/check.js` | **Item check.** Paste or drop a screenshot, then `recognize`, an editable form (`itemform`), the `evaluate` verdict, and Equip. Charms and seals (`item.talisman`) get a talisman verdict instead: in the guide or not, already owned, set count, and "Put in talisman" into the first empty socket or the first non-guide charm. |
| `src/views/skills.js` | **Skill tree.** Compact summary or full tree. "Mine" (editable) and "Guide" (read-only). |
| `src/views/paragon.js` | **Paragon.** Boards drawn in tile art, rotated as attached. Mine and Guide. |
| `src/views/farm.js` | **Farm guide.** Best route per needed piece, from `data/sources.js`. |
| `src/views/hordes.js` | **Hordes.** Offer picker, stored per browser. |
| `src/views/warplans.js` | **War Plans.** Trees from `data/activities.js`. |
| `src/views/strongroom.js` | **Strongrooms.** Tiers from `data/activities.js`. |
| `src/views/guides.js` | **Sources.** Credits and links. |
| `src/views/characters.js` | **Characters.** List, settings (reader engine, API key, model), and backup export/import. Also `renderWelcome` for first run. |
| `src/views/guidepicker.js` | Guide browser dialog: class tabs, the Season tier list, builds and variants. Used to create a character or change its guide. |

### Data (`src/data/`)
| File | Role |
|---|---|
| `src/data/guides.js` | `loadIndex`, `loadGuide(id)`, `loadClass(className)` and `loadItems()` (`items.json`), all cached fetches of `public/data`. `toBuild` turns a synced guide into the **build** shape. `DEFAULT_GUIDE`. |
| `src/data/affixes.js` | Canonical affix keys (`AFFIXES`, ordered regexes). `matchAffix(line, className)`, `affixFromName`, `affixValue`, `affixLabel`, `CORE_STAT`. Rank lines become `ranks:<skill-slug>` keys. |
| `src/data/slots.js` | Slot ids, the paperdoll layout, weapon slots per build, and `slotFromType(typeLine)`. |
| `src/data/classes.js` | Per-class character-sheet stat targets (`CLASS_STATS`), emblems and art. |
| `src/data/sources.js` | Hand-kept farm routes per item (`SOURCES`), Season 15. |
| `src/data/activities.js` | Hordes offers and scoring, War Plan trees, Strongroom tests, links. |
| `src/data/cdn.js` | `CDN` Worker URL. `artUrl`/`rewriteArt` map source art to the cache. `watchArt` falls back to the original link when the cache fails. |

### Screenshot reading (`src/recognize/`)
| File | Role |
|---|---|
| `src/recognize/index.js` | `recognize(blob, settings, progress, className)`. Uses Claude when an API key is set and the engine isn't `ocr`, falling back to OCR on error. Fills `slot`, `key`, and `talisman` (`charm`/`seal` from the type line, in which case `slot` is null). |
| `src/recognize/claude.js` | Claude reader: player's key, browser-direct, JSON-schema output. The system prompt is imported from `aivault/prompts/tooltip-reader.system.md`. `claudeError` gives player-facing errors. |
| `src/recognize/models.js` | The model list shown in Settings. |
| `src/recognize/ocr.js` | Tesseract worker (PSM 4). Preprocessing: upscale to about 2000 px wide, take the brightest channel, then a **local threshold**: a pixel is ink when it is brighter than its neighbourhood mean by 35 and above 75, so bright plates (a mythic's purple header, a set charm's green) don't swallow the text. `iconMarks` reads the icon left of each affix line from the original colours, using Tesseract's word boxes and sizes relative to the line height: diamond = plain, blue swirl = enchanted, warm starburst or big blue box = Greater Affix, large plain icon = temper. Builds the vocabulary from `items.json` plus the class file's skills, then `parseTooltip`. |
| `src/recognize/parse.js` | `parseTooltip(text, className, vocab)`. Lines are first cut at wide gaps, keeping the wordiest part, because the item art beside the name and type line reads as junk words. **Identifies the item by name first** (`identify`): every run of name lines, with trailing art junk trimmed, is matched against all uniques, mythics, charms and seals, limited to what the type line allows (slot and rarity), with a strict retry over everything. Tesseract sometimes outputs the title after the type and Item Power lines, so if nothing above matches, the lines between Item Power and the first stat are tried; a tracked capital M read as `ITI`/`IVI` is fixed. If the name is unreadable, a unique is found from its power text. Everything from `Properties lost when equipped` on is the equipped item's stats and is ignored. A runeword's rune list (`JahIthBer`, `RUNE_LIST_RE` in `vocab.js`) is skipped. Rarity, type and slot then come from the catalog. Stat lines after the power text are socketed gem or rune effects (`item.sockets`). `marks` from `iconMarks` set `ga`, `enchanted` and temper; without marks, the 5th and later affixes are guessed as tempers. Then it snaps the rest onto the vocabulary: rarity and type line (also when wrapped onto two lines; including `Set Charm`, `Mythic Charm`, `Seal`), unique, charm and seal names (`nameIn` skips the art's junk beside the name), multi-line `Lucky Hit:` affixes, affixes (fixing misread digits and dropping icon junk and roll ranges), skill ranks, rejoined wrapped lines, and the aspect name from its power text. Also exports `splitStat` and `normaliseLines`. |
| `src/recognize/vocab.js` | `buildVocab(classJson, items)`: base affix, type and noise lists, every unique, mythic (with its affix pool), aspect, charm and seal from `items.json`, and the class's skills. Without `items`, it falls back to the class file's catalog. `BASE_VOCAB` has neither. |
| `src/recognize/fuzzy.js` | `norm` (OCR's `®©ø` read as `o`), Levenshtein `distance`/`similarity`, `closest(text, candidates, min)` (stricter for short words), `nameIn(text, names)` (every word of a name, in order, among junk words), and `wordOverlap` for prose. |

### Shared helpers (`src/lib/`)
| File | Role |
|---|---|
| `src/lib/store.js` | `store` (state in `localStorage` key `d4c.v1`), `shots` (screenshots in IndexedDB), backup export/import, `blobToDataUrl`. |
| `src/lib/share.js` | `shareLink`: a short id from the Worker, or a fallback packed into the URL hash. `readShort`, `readShared`. |
| `src/lib/itemform.js` | Editable item form, shared by Item check and Loadout. `readItemForm` re-keys affixes. |
| `src/lib/itemview.js` | Item tooltip rendering, with lines marked good or bad for the build. Item art lookup. |
| `src/lib/gearstats.js` | Sums gear affixes like the character sheet. `buildFit` shows how much of the guide the gear covers. |
| `src/lib/talisman.js` | Charm and seal matching, set counts, and talisman next steps. |
| `src/lib/dom.js` | `$`, `esc`, rarity labels, and tooltip cards and hover cards. |
| `src/lib/theme.js` | Dark, light or system theme toggle (its own `localStorage` key). |

### Scoring
| File | Role |
|---|---|
| `src/evaluate.js` | `evaluate(item, slotId, char, build)` returns `{ verdict: equip/build/sidegrade/salvage, headline, score, currentScore, potential, lines, actions, notes }`. `resolveSlot` and `slotStatus` serve the loadout. |

### Guide sync (`scripts/`, Node + Playwright, run in CI)
| File | Role |
|---|---|
| `scripts/fetch-guides.mjs` | Entry for `npm run sync`. Reads the tier list and every class's guides and variants, then writes `public/data/guides.json`, `guides/<id>.json` and `class-<class>.json`. |
| `scripts/lib/d4builds.mjs` | d4builds.gg scraper: variants, gear, gems, talisman, skills, Paragon, and the class tree and boards (weekly). |
| `scripts/lib/normalise.mjs` | Scraped variant to the app's guide JSON. `catalogAdd` builds the class item catalog. |
| `scripts/lib/browser.mjs` | Shared Playwright browser with polite pacing and ads blocked. |
| `scripts/build-items.mjs` | `buildItems(dataDir)` merges every class file's catalog and every guide into `public/data/items.json`. For each item it takes the first real tooltip (rejecting Soul Splinter tooltips the scraper grabbed by mistake), and fills slot and type from the guide slot when no tooltip is clean. Run at the end of `npm run sync`, or alone with `npm run items`. |

### Tests (`tests/`, `node --test`)
| File | Role |
|---|---|
| `tests/evaluate.test.js` | Evaluator and affix matching. |
| `tests/parse.test.js` | OCR parser against noisy Tesseract text, using the real class vocab from `public/data`. |
| `tests/vault.test.js` | Checks that this vault covers every source file, npm script and ADR. |
| `tests/fixture.js` | A made-up test character. |

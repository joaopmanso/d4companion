# D4 Companion

A Diablo IV build companion that runs entirely in the browser. It grew out of the *Blazing Scream Codex* and adds multiple characters, screenshot item checks, skills, Paragon and a per-item farming guide.

## What it does

- **Characters.** Each character follows one build and keeps its own gear and stats. You switch between them from the header.
- **Loadout.** An in-game style paperdoll with the talisman, runes and Splinters. Each slot marks its affixes good or bad against the guide and lists the next steps: enchant, temper, imprint, socket.
- **Item check.** Paste a tooltip screenshot (`Ctrl+V`) anywhere, or drag it onto the page.
  - It reads the item and tells you whether to equip it, build it up, treat it as a side-grade or salvage it.
  - It highlights the affixes that should be rerolled and the tempers that are missing.
  - Pressing **Equip** saves the item and the screenshot to the slot.
- **Skills and Paragon.** The skill bar, skill-tree points with their upgrades and modifiers, the Soul Shard, Prime Evil powers, and each Paragon board's path, glyph and legendary node.
- **Farm guide.** For every piece the build needs, the best route to get it: Mythic boss, Belial pool, Helltide, Escalation Nightmare Dungeon, Undercity or Cube recipe. Pieces you already own are hidden.
- **Activity tabs.** Hordes offer picker, War Plans paths, and Strongroom test tiers.

## Reading screenshots

| Reader | Cost | Accuracy |
|---|---|---|
| Free OCR (Tesseract.js, runs in your browser) | Free | Good on clean crops. It can't see the Greater Affix stars or temper icons, so you tick those yourself. |
| Claude (your own Anthropic API key) | A few cents per check with Opus 5.5; Sonnet and Haiku cost less | Reads every line, the GA stars, tempers and enchants |

The key is set under **Characters & settings**. It stays in that browser's local storage, is sent only to `api.anthropic.com`, and is never exported. Use a key that has a spending limit.

## Data and privacy

All data stays in your browser. Characters and settings are kept in `localStorage`, and screenshots in `IndexedDB`. Use **Export backup** and **Import backup** to move everything to another device. The site has no server.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # evaluator and parser tests
npm run build    # static site in dist/
```

Every push to `main` builds the site and deploys it to GitHub Pages through `.github/workflows/deploy.yml`. In the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.

## Adding a build

Builds live in `src/data/builds/`. Copy `blazing-scream.js`, then edit:

- the slot targets: guide item, affixes in priority order, tempers and sockets;
- the talisman, runes and Splinters;
- the skills and the Paragon boards.

Register the new file in `src/data/builds/index.js`. Item drop routes are shared across builds and live in `src/data/sources.js`.

## Sources

The current build data comes from the d4builds *Blazing Scream Warlock, Endgame* guide, "BEST OVERALL" variant, checked Oct 30, 2026. Stat targets come from Maxroll. Drop sources come from diablofilter, Maxroll, AOEAH, Timesaver and d4guides. Item and skill art comes from diablofilter.com and sunderarmor.com.

Diablo IV and its art are © Blizzard Entertainment. This is an unofficial fan tool.

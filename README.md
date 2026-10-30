# D4 Companion

A Diablo IV build companion that runs entirely in your browser. Pick a guide, track your characters' gear, paste item screenshots to see whether they're upgrades, and follow the guide's skill tree, Paragon and farming routes.

**Your data never leaves your browser.** There are no accounts and no server. The site ships with no characters, so a new browser or computer starts empty. Use **Export backup** and **Import backup** to move your characters between devices.

## What it does

- **Guide picker.** Choose from every synced guide and variant. Each character follows its own guide.
- **Loadout.**
  - An in-game style paperdoll with the talisman, runes and Splinters.
  - Each slot marks its affixes good or bad against the guide and lists the next steps: enchant, temper, imprint or socket.
- **Item check.** Paste a tooltip screenshot with `Ctrl+V`, or drop it on the page.
  - It gives a verdict: equip, build it up, side-grade or salvage.
  - It highlights affixes to reroll and tempers to fix.
  - **Equip** saves the item to the slot.
- **Skill tree.** The class's full tree, with the guide's points lit. Hover any node for its tooltip.
- **Paragon.** Every board in the game's tile art, turned the way the guide attaches it, with the path lit. Hover any tile for its stats.
- **Farm guide.** The best route to each piece the guide needs, such as a boss, Belial pool, Helltide, Escalation dungeon, Undercity or Cube recipe.
- **Activity tabs.** Hordes picker, War Plans and Strongroom tiers.
- **Themes.** Light, dark, or follow the system.

## Guide data, synced daily

`.github/workflows/sync-guides.yml` runs `npm run sync` every day. The sync (`scripts/fetch-guides.mjs`) does the following:

- Reads every **d4builds.gg** Warlock endgame guide and variant with headless Chromium.
- Writes the results to `public/data/`.
- Downloads the art they reference into `public/art/sa/`.
- Commits any changes, then the deploy workflow publishes them.

The class's skill tree layout, Paragon tiles and tooltips are captured once and refreshed weekly.

Only sites that allow it are synced. d4builds' `robots.txt` permits its build pages. Maxroll's terms forbid scraping. Mobalytics and Icy Veins block automated requests with a bot check. Those three appear in the guide menu as links that open on their own site.

## Reading screenshots

| Reader | Cost | Accuracy |
|---|---|---|
| Free OCR (Tesseract.js, runs in your browser) | Free | Good on clean crops. It can't see Greater Affix stars or temper icons, so you tick those yourself. |
| Claude (your own Anthropic API key) | A few cents per check with Opus 5.5; Sonnet and Haiku cost less | Reads every line, GA stars, tempers and enchants |

The key stays in your browser's local storage, is sent only to `api.anthropic.com`, and is never exported.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # evaluator and parser tests
npm run sync     # refresh public/data from the guide sites (needs: npx playwright install chromium)
npm run build    # static site in dist/
```

Pushes to `main`, and each successful sync, deploy the site to GitHub Pages.

## Credits

- Guide data comes from [d4builds.gg](https://d4builds.gg).
- Stat targets come from Maxroll.
- Drop routes come from diablofilter, Maxroll, AOEAH, Timesaver and d4guides.
- Item, skill and Paragon art comes from sunderarmor.com and diablofilter.com.
- The Warlock key art is © Blizzard Entertainment.

Diablo IV is © Blizzard Entertainment. This is an unofficial fan tool.

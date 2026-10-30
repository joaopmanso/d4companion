# D4 Companion

A Diablo IV build companion that runs entirely in your browser. Pick a guide, track your characters' gear, paste item screenshots to see whether they're upgrades, and follow the guide's skill tree, Paragon and farming routes.

**Your data never leaves your browser.** There are no accounts and no server. The site ships with no characters, so a new browser or computer starts empty. Use **Export backup** and **Import backup** to move your characters between devices.

## What it does

- **Guide browser.** New characters start from a class picker and this Season's tier list (S to C, then unranked builds), with every synced variant. **Change guide** in the header switches the active character to another build of its class at any time.
- **Loadout.**
  - An in-game style paperdoll: armour down the left with the weapon at the bottom, jewellery down the right with the off-hand at the bottom.
  - It shows only what you entered. Empty slots, talisman sockets and missing runes or Splinters stay empty, with the guide's target shown separately as the next step.
  - Each item marks its affixes good or bad against the guide and lists the next steps: enchant, temper, imprint or socket. Ancestral items carry a red marker.
- **Item check.** Paste a tooltip screenshot with `Ctrl+V`, or drop it on the page.
  - It gives a verdict: equip, build it up, side-grade or salvage.
  - It highlights affixes to reroll and tempers to fix.
  - **Equip** saves the item to the slot.
- **Skill tree.** The class's full tree, with the guide's points lit. Hover any node for its tooltip.
- **Paragon.** Every board in the game's tile art, turned the way the guide attaches it, with the path lit. Hover any tile for its stats.
- **Farm guide.** The best route to each piece the guide needs, such as a boss, Belial pool, Helltide, Escalation dungeon, Undercity or Cube recipe.
- **Activity tabs.** Hordes picker, War Plans and Strongroom tiers.
- **Share links.** **Share this character** (Loadout) or **Share** (Characters) makes a short read-only link like `…/#/c/k3Xq9aBz0W`. The character is stored for a year in the site's own Cloudflare Worker (private repo `d4companion-cdn`) under an id made from its content; if the Worker can't be reached, the link falls back to a long one with the character packed after the `#`. Screenshots and the API key are never included. Viewers can browse the loadout, skill tree and Paragon, or save a copy to their own browser.
- **Themes.** Light, dark, or follow the system.

## Guide data, synced daily

`.github/workflows/sync-guides.yml` runs `npm run sync` every day. The sync (`scripts/fetch-guides.mjs`) does the following:

- Reads the **d4builds.gg** Season tier list and every class's endgame guides and variants with headless Chromium.
- Writes the results to `public/data/`. Image URLs point at the source site; no images are copied into the repo.
- Commits only when guide content changed, then the deploy workflow publishes it.

The class's skill tree layout, Paragon tiles and tooltips are captured once and refreshed weekly.

Only sites that allow it are synced. d4builds' `robots.txt` permits its build pages. Maxroll's terms forbid scraping. Mobalytics and Icy Veins block automated requests with a bot check. Those three appear in the guide menu as links that open on their own site.

## Reading screenshots

| Reader | Cost | Accuracy |
|---|---|---|
| Free OCR (Tesseract.js, runs in your browser) | Free | Good on crops of the tooltip. Each line is snapped to the game's own wording: item types, the class's uniques, affix names, skill ranks and aspect powers. So misreads like "Critcal Strike Chanee" or "8OO ltem Power" still come out right, and a legendary's aspect is named from its power text. Greater Affixes, tempers and enchants are read from each line's icon. |
| Claude (your own Anthropic API key) | A few cents per check with Opus 5.5; Sonnet and Haiku cost less | Reads every line, GA stars, tempers and enchants |

The key stays in your browser's local storage, is sent only to `api.anthropic.com`, and is never exported.

## Development

Contributor and AI-session docs (architecture, data model, roadmap, decisions, prompts) live in [`aivault/`](aivault/README.md). Keep them current in the same commit as the code; `npm test` checks coverage.

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
- Item, skill and Paragon art is shown directly from sunderarmor.com (via d4builds.gg); the Warlock render is linked from Blizzard's site. No images are stored in this repository.

Diablo IV is © Blizzard Entertainment. This is an unofficial fan tool.

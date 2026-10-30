// Daily guide sync (run by .github/workflows/sync-guides.yml, or `npm run sync`).
// Reads the d4builds Season tier list and every class's endgame guides and variants, normalises them
// for the app and writes:
//   public/data/guides.json            index: classes, tier list, guides
//   public/data/guides/<id>.json       one file per guide variant
//   public/data/class-<class>.json     skill-tree layout, Paragon boards, tooltips and an item catalog
// Art is never copied: the data links to the images on the guide site.
// Only sites whose robots.txt allows it and that serve plain requests are synced. Maxroll forbids
// scraping; Mobalytics and Icy Veins sit behind a bot challenge, so they're listed as links only.
//
// Options: --class=warlock (one class), --only=<url part> (one guide), --no-static (skip layout refresh).
import { mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { openBrowser, pause } from "./lib/browser.mjs";
import * as d4b from "./lib/d4builds.mjs";
import { normalise, catalogAdd } from "./lib/normalise.mjs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const DATA = join(ROOT, "public", "data");
const CLASSES = ["Barbarian", "Druid", "Necromancer", "Paladin", "Rogue", "Sorcerer", "Spiritborn", "Warlock"];
const LINK_ONLY = [
  { site: "Maxroll", title: "Build guides", url: "https://maxroll.gg/d4/build-guides", note: "Maxroll's terms forbid copying its guides, so open them there." },
  { site: "Mobalytics", title: "Builds", url: "https://mobalytics.gg/diablo-4/builds", note: "Blocks automated requests, so it can't be synced." },
  { site: "Icy Veins", title: "Builds", url: "https://www.icy-veins.com/d4/builds/", note: "Blocks automated requests, so it can't be synced." },
];
const STATIC_MAX_AGE = 7 * 24 * 3600e3; // refresh class layouts and tooltips weekly
const arg = (k) => process.argv.slice(2).find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const onlyClass = arg("class")?.toLowerCase();
const only = arg("only");
const partial = !!(onlyClass || only);

const readJson = (p, d) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return d; } };
const writeJson = (p, v) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, JSON.stringify(v, null, 1) + "\n"); };
// Only content counts as a change: keep the previous dates when nothing else differs, so a day
// with no guide edits makes no commit and no redeploy.
const same = (a, b, skip) => JSON.stringify({ ...a, ...Object.fromEntries(skip.map((k) => [k, 0])) }) === JSON.stringify({ ...b, ...Object.fromEntries(skip.map((k) => [k, 0])) });
let changed = false;
function writeIfChanged(p, v, skip) {
  const old = readJson(p, null);
  if (old && same(old, v, skip)) return old;
  writeJson(p, v);
  changed = true;
  return v;
}
// Same guide whether its apostrophe is written ' or %27 (the tier list and sitemap differ).
const baseUrl = (u) => decodeURIComponent(u.replace(/\?.*$/, "")).replace(/\/?$/, "/");

const { browser, context } = await openBrowser();
const page = await context.newPage();
const prev = readJson(join(DATA, "guides.json"), { guides: [], tiers: [] });

let tiers = [];
try { tiers = await d4b.tierList(page); } catch (e) { console.warn("tier list failed", e.message); tiers = prev.tiers || []; }
const tierOf = new Map(tiers.flatMap((t) => t.builds.map((b) => [baseUrl(b.url), { tier: t.tier, ...b }])));

const index = { updated: new Date().toISOString(), classes: [], tiers, guides: [], links: LINK_ONLY };
let failures = 0;

for (const className of CLASSES) {
  const id = className.toLowerCase();
  index.classes.push({ name: className, emblem: `https://sunderarmor.com/DIABLO4/Classes/2/${id}.png` });
  if (onlyClass && onlyClass !== id) continue;
  const clsFile = join(DATA, `class-${id}.json`);
  const cache = readJson(clsFile, null);
  // Layouts from before art was linked (local art/ paths) are refreshed.
  const fresh = !process.argv.includes("--refresh-static") && cache && !JSON.stringify(cache.tree || "").includes('"art/') && Date.now() - Date.parse(cache.captured || 0) < STATIC_MAX_AGE;
  const state = { tree: fresh ? cache.tree : null, boards: fresh ? cache.boards : {}, glyphs: fresh ? cache.glyphs : {}, tips: fresh ? cache.tips : {} };
  const catalog = { items: {}, charms: {}, seals: {}, runes: {}, gems: {} };

  const tierUrls = tiers.flatMap((t) => t.builds).filter((b) => b.className === className).map((b) => baseUrl(b.url));
  const urls = (await d4b.discover(className, tierUrls)).map(baseUrl);
  for (const url of [...new Set(urls)]) {
    if (only && !url.includes(only)) continue;
    let n;
    try { n = await d4b.variantCount(page, url); } catch (e) { console.warn("skip", url, e.message); failures++; continue; }
    const t = tierOf.get(url);
    for (let i = 0; i < n; i++) {
      try {
        const raw = await d4b.scrapeVariant(page, url, i, state);
        const guide = normalise(raw, { site: "d4builds", className, index: i, tips: state.tips, tier: t });
        catalogAdd(catalog, guide);
        const kept = writeIfChanged(join(DATA, "guides", `${guide.id}.json`), guide, ["checked"]);
        guide.checked = kept.checked;
        index.guides.push({ id: guide.id, site: guide.site, className, build: guide.build, short: t?.name || guide.build, tier: t?.tier || "", icon: t?.icon || guide.skills.bar[0]?.icon || "", variant: guide.variant, url: guide.url, updated: guide.updated });
        console.log("ok", guide.id);
      } catch (e) {
        console.warn("variant failed", url, i, e.message);
        failures++;
      }
      await pause(800); // be gentle with the site
    }
  }

  if (!state.tree) continue; // nothing scraped for this class
  // Node frames come in lit and unlit versions; keep both so any guide's allocation can be drawn.
  const tree = { ...state.tree, nodes: state.tree.nodes.map((nd) => (nd.bgOn !== undefined ? nd : {
    ...nd, bg: undefined,
    bgOn: (nd.bg || "").replace("_inactive", "_active"), bgOff: (nd.bg || "").replace(/_active(?=\.png)/, "_inactive"),
  })) };
  const old = readJson(clsFile, null);
  // Keep catalog entries from earlier runs (e.g. guides that failed today) and add today's.
  for (const k of Object.keys(catalog)) catalog[k] = { ...(old?.catalog?.[k] || {}), ...catalog[k] };
  writeIfChanged(clsFile, { className, captured: fresh ? cache.captured : new Date().toISOString(), tree, boards: state.boards, glyphs: state.glyphs, tips: state.tips, catalog }, []);
}
await browser.close();

// Keep guides that weren't synced this run (other classes, or failures) rather than dropping them.
for (const g of prev.guides) if (!index.guides.some((x) => x.id === g.id) && (failures || partial)) index.guides.push(g);
if (!failures && !partial) for (const f of readdirSync(join(DATA, "guides"))) if (!index.guides.some((g) => `${g.id}.json` === f)) unlinkSync(join(DATA, "guides", f));
const TIER_ORDER = { S: 0, A: 1, B: 2, C: 3, D: 4 };
index.guides.sort((a, b) => a.className.localeCompare(b.className) || (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9) || a.build.localeCompare(b.build) || a.variant.localeCompare(b.variant));
if (!changed && JSON.stringify(prev.guides) === JSON.stringify(index.guides) && JSON.stringify(prev.tiers) === JSON.stringify(index.tiers)) index.updated = prev.updated;
writeIfChanged(join(DATA, "guides.json"), index, []);

console.log(`guides ${index.guides.length}, failures ${failures}`);
if (index.guides.length === 0) process.exit(1);

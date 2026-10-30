// Daily guide sync (run by .github/workflows/sync-guides.yml, or `npm run sync`).
// Reads every d4builds Warlock endgame guide and variant, normalises them for the app and writes:
//   public/data/guides.json            index for the guide picker
//   public/data/guides/<id>.json       one file per guide variant
//   public/data/class-<class>.json     skill-tree layout, Paragon boards and tooltip text (shared)
//   public/art/sa/…                    art referenced by the above, downloaded once
// Only sites whose robots.txt allows it and that serve plain requests are synced. Maxroll forbids
// scraping; Mobalytics and Icy Veins sit behind a bot challenge, so they're listed as links only.
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { openBrowser, pause } from "./lib/browser.mjs";
import * as d4b from "./lib/d4builds.mjs";
import { normalise } from "./lib/normalise.mjs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const DATA = join(ROOT, "public", "data");
const ART = join(ROOT, "public", "art", "sa");
const CLASSES = [
  { id: "warlock", name: "Warlock", extra: ["https://d4builds.gg/builds/blazing-scream-warlock-endgame/"] },
];
const LINK_ONLY = [
  { site: "Maxroll", title: "Warlock build guides", url: "https://maxroll.gg/d4/build-guides?filter[class]=warlock", note: "Maxroll's terms forbid copying its guides, so open them there." },
  { site: "Mobalytics", title: "Warlock builds", url: "https://mobalytics.gg/diablo-4/warlock-builds", note: "Blocks automated requests, so it can't be synced." },
  { site: "Icy Veins", title: "Warlock builds", url: "https://www.icy-veins.com/d4/warlock-builds", note: "Blocks automated requests, so it can't be synced." },
];
const STATIC_MAX_AGE = 7 * 24 * 3600e3; // refresh the class layout and tooltips weekly
const only = process.argv.slice(2).find((a) => a.startsWith("--only="))?.slice(7);

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

// Downloads sunderarmor.com art into public/art/sa and returns the local path.
const pending = new Map();
function localArt(url) {
  if (!url || !/^https:\/\/sunderarmor\.com\//.test(url)) return url || "";
  const rel = decodeURI(url.replace("https://sunderarmor.com/", "")).replace(/[^\w./-]/g, "_");
  pending.set(rel, url);
  return `art/sa/${rel}`;
}
async function downloadArt() {
  let n = 0;
  for (const [rel, url] of pending) {
    const file = join(ART, rel);
    if (existsSync(file)) continue;
    const res = await fetch(url, { headers: { "user-agent": "d4companion-guide-sync" } }).catch(() => null);
    if (!res?.ok) { console.warn("art failed", url); continue; }
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    n++;
    await pause(50);
  }
  return n;
}

const { browser, context } = await openBrowser();
const page = await context.newPage();
const index = { updated: new Date().toISOString(), guides: [], links: LINK_ONLY };
let failures = 0;

for (const cls of CLASSES) {
  const clsFile = join(DATA, `class-${cls.id}.json`);
  const cache = readJson(clsFile, null);
  const fresh = cache && Date.now() - Date.parse(cache.captured || 0) < STATIC_MAX_AGE;
  const state = { tree: fresh ? cache.tree : null, boards: fresh ? cache.boards : {}, glyphs: fresh ? cache.glyphs : {}, tips: fresh ? cache.tips : {} };

  const urls = await d4b.discover(cls.id, cls.extra);
  for (const url of urls) {
    if (only && !url.includes(only)) continue;
    let n;
    try { n = await d4b.variantCount(page, url); } catch (e) { console.warn("skip", url, e.message); failures++; continue; }
    for (let i = 0; i < n; i++) {
      try {
        const raw = await d4b.scrapeVariant(page, url, i, state);
        const guide = normalise(raw, { site: "d4builds", className: cls.name, index: i, art: localArt, tips: state.tips });
        const kept = writeIfChanged(join(DATA, "guides", `${guide.id}.json`), guide, ["checked"]);
        guide.checked = kept.checked;
        index.guides.push({ id: guide.id, site: guide.site, className: guide.className, build: guide.build, variant: guide.variant, url: guide.url, updated: guide.updated });
        console.log("ok", guide.id);
      } catch (e) {
        console.warn("variant failed", url, i, e.message);
        failures++;
      }
      await pause(800); // be gentle with the site
    }
  }

  // Shared class data: art paths made local.
  // Node frames come in lit and unlit versions; keep both so any guide's allocation can be drawn.
  // Nodes reused from the cache already have local bgOn/bgOff paths.
  const tree = state.tree && { ...state.tree, nodes: state.tree.nodes.map((nd) => (nd.bgOn !== undefined ? nd : {
    ...nd, icon: localArt(nd.icon), bg: undefined,
    bgOn: localArt((nd.bg || "").replace("_inactive", "_active")), bgOff: localArt((nd.bg || "").replace(/_active(?=\.png)/, "_inactive")),
  })) };
  const boards = Object.fromEntries(Object.entries(state.boards).map(([k, b]) => [k, { tiles: b.tiles.map((t) => ({ ...t, icon: localArt(t.icon), iconOn: localArt(t.iconOn), bg: localArt(t.bg) })) }]));
  writeIfChanged(clsFile, { className: cls.name, captured: fresh ? cache.captured : new Date().toISOString(), tree, boards, glyphs: state.glyphs, tips: state.tips }, []);
}
await browser.close();

// Keep files of guides that failed today rather than dropping them from the picker.
const prev = readJson(join(DATA, "guides.json"), { guides: [] });
for (const g of prev.guides) if (!index.guides.some((x) => x.id === g.id) && (failures || only)) index.guides.push(g);
if (!failures && !only) for (const f of readdirSync(join(DATA, "guides"))) if (!index.guides.some((g) => `${g.id}.json` === f)) unlinkSync(join(DATA, "guides", f));
index.guides.sort((a, b) => a.build.localeCompare(b.build) || a.variant.localeCompare(b.variant));
if (!changed && JSON.stringify(prev.guides) === JSON.stringify(index.guides)) index.updated = prev.updated;
writeIfChanged(join(DATA, "guides.json"), index, []);

console.log(`guides ${index.guides.length}, new art ${await downloadArt()}, failures ${failures}`);
if (index.guides.length === 0) process.exit(1);

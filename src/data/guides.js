// Guides come from public/data, written daily by scripts/fetch-guides.mjs. This turns a synced guide
// into the "build" shape the views and the evaluator use, and adds the hand-kept extras
// (stat targets, farm routes) that no guide site provides.
import { SOURCES } from "./sources.js";
import { CLASS_STATS } from "./classes.js";

const cache = new Map();
const getJson = (path) => {
  if (!cache.has(path)) cache.set(path, fetch(path, { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(`${path}: ${r.status}`); return r.json(); }));
  return cache.get(path);
};

export const DEFAULT_GUIDE = "blazing-scream-warlock-endgame-best-overall-currently-playing";
// Builds saved before guides were synced used a hand-written build id.
const LEGACY = { "blazing-scream-warlock": DEFAULT_GUIDE };

export const loadIndex = () => getJson("data/guides.json");
export const loadClass = (className) => getJson(`data/class-${className.toLowerCase()}.json`);

const slug = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Matches an equipped item to the guide's: by name, or for an aspect by its name or power text.
function matcher(item) {
  const words = item.name.replace(/\s*aspect$/i, "").trim();
  return new RegExp(escRe(words), "i");
}

export async function loadGuide(id) {
  const index = await loadIndex();
  const wanted = LEGACY[id] || id;
  const entry = index.guides.find((g) => g.id === wanted) || index.guides.find((g) => g.id === DEFAULT_GUIDE) || index.guides[0];
  if (!entry) throw new Error("No guides synced yet.");
  return toBuild(await getJson(`data/guides/${entry.id}.json`));
}

export function toBuild(g) {
  const slots = {};
  for (const [sid, s] of Object.entries(g.slots)) {
    const key = slug(s.item.name);
    slots[sid] = {
      item: { name: s.item.name, match: matcher(s.item), type: s.item.kind === "aspect" ? "aspect" : s.item.kind, rarity: s.item.rarity, source: SOURCES[key] ? key : null, art: s.item.art, tip: s.item.tip },
      affixes: [...new Set(s.affixes)],
      tempers: s.tempers,
      sockets: s.sockets,
      socketArt: s.socketArt,
      note: s.aspects?.length ? `Also listed: ${s.aspects.join(", ")}.` : "",
    };
  }
  return {
    id: g.id, name: g.build, variant: g.variant, className: g.className, season: 15,
    guide: { site: g.site, url: g.url, variant: g.variant, checked: g.checked, updated: g.updated },
    slots, runes: g.runes, talisman: g.talisman, skills: g.skills, paragon: g.paragon,
    stats: CLASS_STATS[g.className] || [],
    links: [[g.site, `${g.build}: ${g.variant}`, "The guide this character follows", g.url]],
  };
}

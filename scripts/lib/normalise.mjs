// Turns one scraped guide variant into the shape the app reads (see src/data/guides.js).
import { affixFromName } from "../../src/data/affixes.js";

const RUNEWORDS = new Set(["Ancient's Pledge", "Call to Arms", "Edge", "Enigma", "Grief", "Holy Thunder", "Infinity", "Insight", "Stealth", "Spirit", "Fortitude", "Beast", "Chains of Honor", "Heart of the Oak", "Last Wish", "Doom"]);
const slug = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// d4builds names neither the seal nor the charm's set, so read them from the art file and effect text.
const SEALS = [[/reduces the number of charms needed for set bonuses/i, "Seal of the Diamond Mind"]];
const sealName = (img, tip) => SEALS.find(([re]) => re.test(tip || ""))?.[1] || (/legendary/.test(img) ? "Legendary Seal" : /rare/.test(img) ? "Rare Seal" : "Mythic Seal");
const SET_FROM_ART = (src) => {
  const f = (src.split("/").pop() || "").replace(/\.\w+$/, "");
  if (/mythic/.test(f)) return { set: "", mythic: true };
  if (/unique/.test(f)) return { set: "", mythic: false, unique: true };
  return { set: f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bOf\b/g, "of").replace(/\bThe\b/g, "the"), mythic: false };
};

export function normalise(raw, { site, className, index, art, tips }) {
  const build = raw.title.replace(/\s*\(S\d+\)\s*$/, "").trim();
  const variant = raw.variant || `Variant ${index + 1}`;
  const base = slug(new URL(raw.url).pathname.split("/").filter(Boolean).pop());
  const tip = (name) => tips[name] || "";

  const slots = {};
  for (const g of raw.gear) {
    const id = raw.slotMap[g.slot];
    if (!id) continue;
    const stats = raw.stats[g.slot] || { affixes: [], tempers: [], aspects: [] };
    const kind = /aspect$/i.test(g.name) ? "aspect" : RUNEWORDS.has(g.name) ? "runeword" : g.rarity === "mythic" ? "mythic" : g.rarity === "unique" ? "unique" : "legendary";
    slots[id] = {
      item: { name: g.name, kind, rarity: g.rarity, art: art(g.img), tip: tip(g.name) },
      affixes: stats.affixes.map((a) => affixFromName(a)).filter(Boolean),
      affixNames: stats.affixes,
      tempers: stats.tempers.map(([a, recipe]) => [affixFromName(a), recipe.replace(/\s+-\s+/, " (") + (recipe.includes(" - ") ? ")" : "")]).filter(([k]) => k),
      aspects: stats.aspects,
      sockets: g.sockets.map((s) => s.name),
      socketArt: Object.fromEntries(g.sockets.map((s) => [s.name, art(s.img)])),
    };
  }

  return {
    id: `${base}-${slug(variant)}`,
    site, className, build, variant, url: raw.url, updated: raw.updated, author: raw.author, checked: new Date().toISOString().slice(0, 10),
    slots,
    // The site lists runes as Ritual + Invocation pairs but not always in the same pair order.
    runes: raw.runes.map((r) => ({ name: r.name, art: art(r.img), tip: tip(r.name) }))
      .reduce((pairs, r, i) => (i % 2 ? pairs[pairs.length - 1].push(r) : pairs.push([r]), pairs), [])
      .sort((a, b) => a.map((r) => r.name).join().localeCompare(b.map((r) => r.name).join()))
      .flat(),
    talisman: {
      seal: raw.talisman.seal ? (() => {
        const t = tips[`seal:${raw.talisman.seal.img}`] || "";
        const name = sealName(raw.talisman.seal.img, t);
        return { name, art: art(raw.talisman.seal.img), tip: t.replace(/^Seal\b/, name) };
      })() : null,
      charms: raw.talisman.charms.map((c) => ({ name: c.name, art: art(c.img), ...SET_FROM_ART(c.img), tip: tip(c.name) })),
    },
    skills: {
      bar: raw.skillBar.map((s) => ({ name: s.name, icon: art(s.img), tip: tip(s.name) })),
      prime: raw.prime.map((p) => ({ name: p.name, icon: art(p.img), main: p.main, tip: tip(p.name) })),
      soulShard: raw.soulShard,
      tree: raw.tree,
    },
    paragon: raw.paragon,
  };
}

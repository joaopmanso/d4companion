// Turns one scraped guide variant into the shape the app reads (see src/data/guides.js).
// Art stays as links to the guide site's images; nothing is copied.
import { affixFromName } from "../../src/data/affixes.js";

const RUNEWORDS = new Set(["Ancient's Pledge", "Call to Arms", "Edge", "Enigma", "Grief", "Holy Thunder", "Infinity", "Insight", "Stealth", "Spirit", "Fortitude", "Beast", "Chains of Honor", "Heart of the Oak", "Last Wish", "Doom"]);
const slug = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// Armour and jewellery have fixed ids; weapon slots differ by class and keep the site's names.
const FIXED = { Helm: "helm", "Chest Armor": "chest", Gloves: "gloves", Pants: "pants", Boots: "boots", Amulet: "amulet", "Ring 1": "ring1", "Ring 2": "ring2", Weapon: "weapon", Offhand: "offhand", "Off-Hand": "offhand" };
const slotId = (name) => FIXED[name] || slug(name);

// d4builds names neither the seal nor the charm's set, so read them from the art file and effect text.
const SEALS = [[/reduces the number of charms needed for set bonuses/i, "Seal of the Diamond Mind"]];
const sealName = (img, tip) => SEALS.find(([re]) => re.test(tip || ""))?.[1] || (/legendary/.test(img) ? "Legendary Seal" : /rare/.test(img) ? "Rare Seal" : "Mythic Seal");
const SET_FROM_ART = (src) => {
  const f = (src.split("/").pop() || "").replace(/\.\w+$/, "");
  if (/mythic/.test(f)) return { set: "", mythic: true };
  if (/unique/.test(f)) return { set: "", mythic: false, unique: true };
  return { set: f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bOf\b/g, "of").replace(/\bThe\b/g, "the"), mythic: false };
};

export function normalise(raw, { site, className, index, tips, tier }) {
  const build = raw.title.replace(/\s*\(S\d+[^)]*\)\s*$/, "").trim();
  const variant = raw.variant || `Variant ${index + 1}`;
  const base = slug(new URL(raw.url).pathname.split("/").filter(Boolean).pop());
  const tip = (name) => tips[name] || "";

  const slots = {};
  const slotNames = {};
  for (const g of raw.gear) {
    if (!g.slot) continue;
    const id = slotId(g.slot);
    slotNames[id] = g.slot;
    const stats = raw.stats[g.slot] || { affixes: [], tempers: [], aspects: [] };
    const kind = /aspect$/i.test(g.name) ? "aspect" : RUNEWORDS.has(g.name) ? "runeword" : g.rarity === "mythic" ? "mythic" : g.rarity === "unique" ? "unique" : "legendary";
    slots[id] = {
      name: g.slot,
      item: { name: g.name, kind, rarity: g.rarity, art: g.img, tip: tip(g.name) },
      affixes: stats.affixes.map((a) => affixFromName(a, className)).filter(Boolean),
      affixNames: stats.affixes,
      tempers: stats.tempers.map(([a, recipe]) => [affixFromName(a, className), recipe.replace(/\s+-\s+/, " (") + (recipe.includes(" - ") ? ")" : "")]).filter(([k]) => k),
      aspects: stats.aspects,
      sockets: g.sockets.map((s) => s.name),
      socketArt: Object.fromEntries(g.sockets.map((s) => [s.name, s.img])),
    };
  }

  const seal = raw.talisman.seal ? (() => {
    const t = tips[`seal:${raw.talisman.seal.img}`] || "";
    const name = sealName(raw.talisman.seal.img, t);
    return { name, art: raw.talisman.seal.img, tip: t.replace(/^Seal\b/, name) };
  })() : null;

  return {
    id: `${base}-${slug(variant)}`,
    site, className, build, variant, url: raw.url, updated: raw.updated, author: raw.author, checked: new Date().toISOString().slice(0, 10),
    tier: tier?.tier || "", short: tier?.name || build,
    slots,
    // The site lists runes as Ritual + Invocation pairs but not always in the same pair order.
    runes: raw.runes.map((r) => ({ name: r.name, art: r.img, tip: tip(r.name) }))
      .reduce((pairs, r, i) => (i % 2 ? pairs[pairs.length - 1].push(r) : pairs.push([r]), pairs), [])
      .sort((a, b) => a.map((r) => r.name).join().localeCompare(b.map((r) => r.name).join()))
      .flat(),
    talisman: {
      seal,
      charms: raw.talisman.charms.map((c) => ({ name: c.name, art: c.img, ...SET_FROM_ART(c.img), tip: tip(c.name) })),
    },
    skills: {
      bar: raw.skillBar.map((s) => ({ name: s.name, icon: s.img, tip: tip(s.name) })),
      prime: raw.prime.map((p) => ({ name: p.name, icon: p.img, main: p.main, tip: tip(p.name) })),
      soulShard: raw.soulShard,
      tree: raw.tree,
    },
    paragon: raw.paragon,
  };
}

// Everything a player could own, by name: lets the app show art and tooltips for what they enter.
export function catalogAdd(cat, g) {
  for (const s of Object.values(g.slots)) {
    cat.items[s.item.name] ||= { art: s.item.art, rarity: s.item.rarity, kind: s.item.kind, slot: s.name, tip: s.item.tip };
    for (const name of s.sockets) {
      const kind = /^splinter/i.test(name) ? "gems" : g.runes.some((r) => r.name === name) ? "runes" : "gems";
      cat[kind][name] ||= { art: s.socketArt[name] };
    }
  }
  for (const r of g.runes) cat.runes[r.name] = { art: r.art, tip: r.tip };
  for (const c of g.talisman.charms) cat.charms[c.name] ||= { art: c.art, set: c.set, mythic: c.mythic, unique: !!c.unique, tip: c.tip };
  if (g.talisman.seal) cat.seals[g.talisman.seal.name] ||= { art: g.talisman.seal.art, tip: g.talisman.seal.tip };
}

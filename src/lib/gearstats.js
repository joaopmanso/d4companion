// Totals of every affix on the character's gear (affixes, tempers and base stats), grouped like the
// in-game character sheet, plus how much of the guide the gear already covers.
// Values are summed as written: "×" multipliers are shown summed too, which is a rough guide, not
// the game's exact maths.
import { affixLabel, affixValue } from "../data/affixes.js";
import { isGuideItem } from "../evaluate.js";

const GROUPS = [
  ["Core", ["willpower", "strength", "dexterity", "intelligence", "allStats"]],
  ["Offense", ["critChance", "critDamage", "vulnDamage", "attackSpeed", "fireDamageMult", "fireDamage", "weaponDamage", "overpower", "luckyHit"]],
  ["Skill ranks", null], // any ranks* or ranks:<skill> key
  ["Defense", ["life", "armor", "damageReduction", "resAll", "fireRes", "lightningRes", "coldRes", "poisonRes", "shadowRes", "physicalRes", "dodge", "barrier", "healingReceived", "lifeOnKill", "lifeOnHit", "lifePerSecond", "thorns", "impairment"]],
  ["Utility", ["cdr", "resourceGen", "wrathRegen", "maxWrath", "movementSpeed", "evadeCdr", "evadeCharges"]],
];
const isRank = (k) => k.startsWith("ranks");

export function totals(gear) {
  const out = new Map();
  for (const item of Object.values(gear || {})) {
    for (const a of item?.affixes || []) {
      if (!a.key) continue;
      const v = affixValue(a.text);
      const t = out.get(a.key) || { value: 0, pct: false, mult: false, count: 0 };
      if (v != null) { t.value += v; t.numeric = true; }
      t.pct ||= /%/.test(a.text);
      t.mult ||= /^[×x]\s*\d/.test(a.text.trim());
      t.count++;
      out.set(a.key, t);
    }
  }
  return out;
}

export function grouped(gear) {
  const t = totals(gear);
  return GROUPS.map(([name, keys]) => {
    const ks = keys || [...t.keys()].filter(isRank);
    return { name, rows: ks.filter((k) => t.has(k)).map((k) => ({ key: k, label: affixLabel(k), ...t.get(k) })) };
  }).filter((g) => g.rows.length);
}

// Items picked from the list have affix names but no rolls yet: those show as "on gear".
export const fmtStat = (r, v = r.value) => (!r.numeric ? "on gear" : `${r.mult ? "×" : v > 0 && !r.pct ? "+" : ""}${Number(v.toFixed(1)).toLocaleString()}${r.pct ? "%" : ""}`);

// How much of the guide the gear covers: its items, wanted affixes, tempers and sockets.
export function buildFit(gear, build) {
  const fit = { items: [0, 0], affixes: [0, 0], tempers: [0, 0], sockets: [0, 0] };
  for (const [sid, t] of Object.entries(build.slots)) {
    const g = gear?.[sid];
    fit.items[1]++;
    if (g && isGuideItem(g, t)) fit.items[0]++;
    const have = new Set((g?.affixes || []).filter((a) => a.kind === "affix").map((a) => a.key));
    const temp = new Set((g?.affixes || []).filter((a) => a.kind === "temper").map((a) => a.key));
    fit.affixes[1] += t.affixes.length; fit.affixes[0] += t.affixes.filter((k) => have.has(k)).length;
    fit.tempers[1] += t.tempers.length; fit.tempers[0] += t.tempers.filter(([k]) => temp.has(k)).length;
    const sockets = (g?.sockets || []).join(" ").toLowerCase();
    fit.sockets[1] += (t.sockets || []).length;
    fit.sockets[0] += (t.sockets || []).filter((s) => sockets.includes(s.toLowerCase().replace(/^splinter of (the )?/, ""))).length;
  }
  return fit;
}

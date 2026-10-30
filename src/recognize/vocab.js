// The closed vocabulary of a Diablo IV tooltip: item types, affix names, skill names, item and aspect names.
// The base lists cover every class. buildVocab adds every known unique, mythic, aspect, charm and seal from
// public/data/items.json (all classes), and the class's skills from public/data/class-*.json.
import { AFFIXES } from "../data/affixes.js";
import { closest } from "./fuzzy.js";

export const RARITIES = ["Mythic Unique", "Mythic", "Unique", "Legendary", "Rare", "Magic", "Common", "Set"];

export const ITEM_TYPES = [
  "Helm", "Chest Armor", "Gloves", "Pants", "Boots", "Amulet", "Ring",
  "Sword", "Axe", "Mace", "Dagger", "Wand", "Scythe", "Flail", "Glaive", "Quarterstaff",
  "Two-Handed Sword", "Two-Handed Axe", "Two-Handed Mace", "Two-Handed Scythe",
  "1h Sword", "1h Axe", "1h Mace", "1h Dagger", "2h Sword", "2h Axe", "2h Mace", "2h Scythe",
  "Staff", "Bow", "Crossbow", "Polearm", "Focus", "Shield", "Totem", "Tome", "Weapon",
  "Charm", "Seal", // talisman pieces: "Set Charm", "Unique Charm", "Legendary Seal"
];

const ELEMENTS = ["Fire", "Cold", "Lightning", "Poison", "Shadow", "Physical", "Non-Physical"];

const BASE_AFFIXES = [
  "Strength", "Intelligence", "Willpower", "Dexterity", "All Stats", "Primary Core Stat",
  "Maximum Life", "Armor", "Total Armor", "All Resist", "Resistance to All Elements", "Maximum Resistance to All Elements",
  "Critical Strike Chance", "Critical Strike Damage", "Critical Strike Damage Multiplier",
  "Vulnerable Damage", "Vulnerable Damage Multiplier", "Overpower Damage", "Overpower Damage Multiplier",
  "All Damage Multiplier", "Damage", "Weapon Damage", "Main Hand Weapon Damage", "Damage over Time", "Damage over Time Multiplier",
  "Damage over Time Duration",
  "Attack Speed", "Cooldown Reduction", "Resource Generation", "Resource Cost Reduction", "Maximum Resource",
  "Lucky Hit Chance", "Movement Speed", "Damage Reduction", "Damage Reduction from Close Enemies",
  "Damage Reduction from Distant Enemies", "Damage Reduction while Fortified", "Damage Reduction while Berserking",
  "Damage Reduction from Burning Enemies", "Damage Reduction from Poisoned Enemies", "Damage Reduction from Bleeding Enemies",
  "Damage to Close Enemies", "Damage to Distant Enemies", "Damage to Elites", "Damage to Crowd Controlled Enemies",
  "Damage to Injured Enemies", "Damage to Healthy Enemies", "Damage to Demons", "Damage while Berserking",
  "Life on Kill", "Life on Hit", "Life per Second", "Life Regeneration", "Healing Received", "Barrier Generation",
  "Fortify Generation", "Dodge Chance", "Thorns", "Block Chance", "Blocked Damage Reduction",
  "Impairment Reduction", "Crowd Control Duration", "Maximum Evade Charges", "Evade Cooldown Reduction",
  "Gold Drop Rate", "Deadly Strike Chance", "Primary Resource on Kill",
  "Ranks to All Skills", "Ranks to Basic Skills", "Ranks to Core Skills", "Ranks to Defensive Skills",
  ...["Fury", "Mana", "Spirit", "Energy", "Essence", "Wrath", "Faith", "Vigor"].flatMap((r) => [`${r} Regeneration`, `${r} per Second`, `${r} on Kill`, `Maximum ${r}`]),
  ...ELEMENTS.flatMap((e) => [`${e} Damage`, `${e} Damage Multiplier`, `${e} Resistance`]),
];

// Lines that are on every tooltip but carry nothing to score.
export const NOISE_PHRASES = [
  "Requires Level", "Sell Value", "Durability", "Account Bound", "Not Yet Discovered", "Unequipped",
  "Properties lost when equipped", "Right-click to equip", "Shift", "Tempers", "Empty Socket", "Masterwork",
  "Item Power", "Socket", "Enchanted", "Imprinted", "Scroll to compare", "Mark as Junk", "Mark as Favorite",
  "Equipped", "Gold", "Scroll Down", "Link", "Unequip", "Unique Equipped", "Seasonal Item", "Lord of Hatred Item",
];

// A runeword's rune list, printed as one word under the item power: "JahIthBer".
export const RUNE_LIST_RE = /^[A-Z][a-z]+(?:[A-Z][a-z]+)+$/;

const statLike = (l) => l.length > 2 && l.length < 48 && !/\d|[,:.;]|\[/.test(l) && !/^(unique|mythic|legendary|codex)\b/i.test(l) && !RUNE_LIST_RE.test(l);

// What an item tip from the class catalog tells us: its affix names and its power text.
function tipParts(tip) {
  const [name, typeLine, ...rest] = String(tip || "").split("\n");
  const affixes = rest.filter(statLike);
  const power = rest.filter((l) => !statLike(l) && l.length > 30 && !/,\s/.test(l.slice(0, 20))).join(" ");
  return { name, typeLine, affixes, power };
}

// `items` is public/data/items.json. Without it (older callers), the class file's own catalog is used.
export function buildVocab(cls, all = catalogOf(cls)) {
  const affixes = new Set([...BASE_AFFIXES, ...AFFIXES.map((a) => a.label)]);
  const types = new Set(ITEM_TYPES);
  const skills = new Set();
  // Guide sites have typos ("Critcal Strike Chance"); a near-copy of a base phrase is left out.
  const addAffixes = (list) => { for (const a of list) if (!affixes.has(a) && !closest(a, BASE_AFFIXES, 0.9)) affixes.add(a); };
  // Uniques and mythics: { name, rarity, type, slot, affixes (its pool), power }.
  const items = (all?.uniques || []).map((u) => {
    const p = tipParts(u.tip);
    addAffixes(p.affixes);
    if (u.type && u.type.length < 24) types.add(u.type);
    return { name: u.name, rarity: u.rarity, type: u.type, slot: u.slot, affixes: p.affixes, power: p.power };
  });
  // Legendary powers: { name, power }.
  const aspects = (all?.aspects || []).map((a) => { const p = tipParts(a.tip); addAffixes(p.affixes); return { name: a.name, power: p.power }; }).filter((a) => a.power);
  // Talisman pieces: { name, set, unique, mythic, tip }.
  const charms = Object.entries(all?.charms || {}).map(([name, c]) => ({ name, set: c.set || "", unique: !!c.unique, mythic: !!c.mythic, tip: c.tip || "" }));
  const seals = Object.entries(all?.seals || {}).map(([name, s]) => ({ name, tip: s.tip || "" }));

  for (const n of cls?.tree?.nodes || []) if (n.kind === "skill" && n.name) skills.add(n.name);
  for (const a of affixes) {
    const m = a.match(/^ranks to (.+)$/i);
    if (m) skills.add(m[1]);
  }
  return { affixes: [...affixes], types: [...types], items, aspects, skills: [...skills], charms, seals };
}

// A class file's catalog in the items.json shape, for callers that don't load items.json.
function catalogOf(cls) {
  const entries = Object.entries(cls?.catalog?.items || {});
  const typeOf = (tip) => (String(tip || "").split("\n")[1] || "");
  return {
    uniques: entries.filter(([, it]) => !["aspect", "legendary"].includes(it.kind)).map(([name, it]) => ({
      name, rarity: it.rarity === "mythic" || /mythic/i.test(typeOf(it.tip)) ? "mythic" : "unique",
      type: /^(mythic\s+)?unique\b/i.test(typeOf(it.tip)) ? typeOf(it.tip).replace(/^(mythic\s+)?unique\s+/i, "") : "",
      slot: null, tip: /^(mythic\s+)?unique\b/i.test(typeOf(it.tip)) ? it.tip : "",
    })),
    aspects: entries.filter(([, it]) => ["aspect", "legendary"].includes(it.kind)).map(([name, it]) => ({ name, tip: it.tip })),
    charms: cls?.catalog?.charms, seals: cls?.catalog?.seals,
  };
}

export const BASE_VOCAB = buildVocab(null);

import blazingScream from "./blazing-scream.js";

// Every build a character can follow. To add one, copy blazing-scream.js, change the data, and list it here.
export const BUILDS = [blazingScream];
export const BUILD = Object.fromEntries(BUILDS.map((b) => [b.id, b]));
export const buildFor = (character) => BUILD[character?.buildId] || BUILDS[0];

// The paperdoll, as the in-game character screen lays it out.
export const SLOTS = [
  { id: "helm", name: "Helm", noun: "Helm", kind: "helm" },
  { id: "chest", name: "Chest", noun: "Chest Armor", kind: "chest" },
  { id: "gloves", name: "Gloves", noun: "Gloves", kind: "gloves" },
  { id: "pants", name: "Pants", noun: "Pants", kind: "pants" },
  { id: "boots", name: "Boots", noun: "Boots", kind: "boots" },
  { id: "amulet", name: "Amulet", noun: "Amulet", kind: "amulet" },
  { id: "ring1", name: "Ring 1", noun: "Ring", kind: "ring" },
  { id: "ring2", name: "Ring 2", noun: "Ring", kind: "ring" },
  { id: "weapon", name: "Weapon", noun: "Sword", kind: "sword" },
  { id: "offhand", name: "Off-hand", noun: "Focus", kind: "focus" },
];
export const SLOT = Object.fromEntries(SLOTS.map((s) => [s.id, s]));
export const LEFT = ["helm", "chest", "gloves", "pants", "boots"];
export const RIGHT = ["amulet", "ring1", "ring2", "weapon", "offhand"];

// Tooltip type lines ("Ancestral Legendary Boots") → slot. Rings resolve to ring1/ring2 later.
const TYPE_SLOT = [
  [/helm|crown|cap|hood|mask|circlet/i, "helm"],
  [/chest|armor$|robe|cuirass|harness/i, "chest"],
  [/glove|gauntlet|hand/i, "gloves"],
  [/pants|legging|greaves|trousers/i, "pants"],
  [/boots?$|shoes|treads|sabatons/i, "boots"],
  [/amulet|necklace|pendant/i, "amulet"],
  [/ring|band|loop/i, "ring"],
  [/focus|tome|totem|shield|off-?hand/i, "offhand"],
  [/sword|axe|mace|dagger|wand|scythe|staff|bow|crossbow|polearm|glaive|flail|weapon/i, "weapon"],
];
export function slotFromType(type) {
  for (const [re, slot] of TYPE_SLOT) if (re.test(type || "")) return slot;
  return null;
}

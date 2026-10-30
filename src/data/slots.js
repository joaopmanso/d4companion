// Slots and item types. The builds themselves are synced guides (see ./guides.js).
// Armour and jewellery are the same for every class; weapon slots come from the guide
// (Warlock: Weapon + Off-hand; Barbarian: four weapons; Rogue: dual wield + ranged…).

const SA = "https://sunderarmor.com/DIABLO4/Uniques/";
export const BASE_ART = {
  helm: `${SA}d4_helm.png`, chest: `${SA}d4_chest_armor.png`, gloves: `${SA}d4_gloves.png`, pants: `${SA}d4_pants.png`,
  boots: `${SA}d4_boots.png`, amulet: `${SA}d4_amulet.png`, ring: `${SA}d4_ring.png`, weapon: `${SA}d4_sword.png`, offhand: `${SA}d4_focus.png`,
};

const FIXED = [
  { id: "helm", name: "Helm", noun: "Helm", kind: "helm" },
  { id: "chest", name: "Chest", noun: "Chest Armor", kind: "chest" },
  { id: "gloves", name: "Gloves", noun: "Gloves", kind: "gloves" },
  { id: "pants", name: "Pants", noun: "Pants", kind: "pants" },
  { id: "boots", name: "Boots", noun: "Boots", kind: "boots" },
  { id: "amulet", name: "Amulet", noun: "Amulet", kind: "amulet" },
  { id: "ring1", name: "Ring 1", noun: "Ring", kind: "ring" },
  { id: "ring2", name: "Ring 2", noun: "Ring", kind: "ring" },
  { id: "weapon", name: "Weapon", noun: "Weapon", kind: "weapon" },
  { id: "offhand", name: "Off-hand", noun: "Off-hand", kind: "offhand" },
];
const pretty = (id) => id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// Any other id is a class weapon slot ("two-handed-slashing", "dual-wield-weapon-1"…).
export const SLOT = new Proxy(Object.fromEntries(FIXED.map((s) => [s.id, s])), {
  get: (t, k) => t[k] || (typeof k === "string" ? { id: k, name: pretty(k), noun: "Weapon", kind: /off|focus|shield|totem/.test(k) ? "offhand" : "weapon" } : undefined),
});
export const SLOTS = FIXED;
export const ARMOR = ["helm", "chest", "gloves", "pants", "boots"];
export const JEWELRY = ["amulet", "ring1", "ring2"];

// Weapon slots for a build, in the guide's order.
export const weaponSlots = (build) => Object.keys(build?.slots || {}).filter((id) => !ARMOR.includes(id) && !JEWELRY.includes(id));

// The in-game character screen: armour down the left ending with the main weapon; jewellery down
// the right ending with the off-hand. Extra weapons alternate left/right below them.
export function paperdoll(build) {
  const w = weaponSlots(build);
  const ws = w.length ? w : ["weapon", "offhand"];
  return {
    left: [...ARMOR, ...ws.filter((_, i) => i % 2 === 0)],
    right: [null, ...JEWELRY, null, ...ws.filter((_, i) => i % 2 === 1)],
  };
}
export const allSlots = (build) => [...ARMOR, ...JEWELRY, ...(weaponSlots(build).length ? weaponSlots(build) : ["weapon", "offhand"])];

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

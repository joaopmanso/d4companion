// Character-sheet targets per class. "Maxroll" ones come from its endgame stat list (read by hand, not
// scraped); the others are resistance floors we settled on for Mephisto and Baal.
export const CLASS_STATS = {
  Warlock: [
    { key: "attackSpeed", name: "Attack Speed", unit: "%", target: 100, src: "Maxroll" },
    { key: "crit", name: "Critical Strike Chance", unit: "%", target: 100, src: "Maxroll" },
    { key: "wrathRegen", name: "Wrath Regeneration", unit: "", target: 10, src: "Maxroll" },
    { key: "fire", name: "Fire Resistance", unit: "", target: 10000, src: "Maxroll" },
    { key: "lightning", name: "Lightning Resistance", unit: "", target: 8000, src: "floor" },
    { key: "poison", name: "Poison Resistance", unit: "", target: 4000, src: "floor" },
    { key: "physical", name: "Physical Resistance", unit: "", target: 4000, src: "floor" },
    { key: "cold", name: "Cold Resistance", unit: "", target: 3000, src: "floor" },
    { key: "shadow", name: "Shadow Resistance", unit: "", target: 3000, src: "floor" },
  ],
};

export const CLASS_ART = {
  Warlock: { portrait: "art/warlock-portrait.webp", crest: "art/class-warlock.webp", credit: "Warlock key art © Blizzard Entertainment" },
};

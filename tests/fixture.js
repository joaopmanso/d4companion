// A made-up character for tests. Not anyone's real gear.
const A = (text, key, extra = {}) => ({ text, key, kind: "affix", ...extra });
const T = (text, key) => ({ text, key, kind: "temper" });

export const TEST_CHARACTER = {
  id: "test",
  name: "Test Warlock",
  buildId: "blazing-scream-warlock",
  stats: {},
  gear: {
    helm: { name: "Leoric's Crown", rarity: "mythic", affixes: [A("+150 Willpower", "willpower"), A("+5 Wrath Regeneration", "wrathRegen"), A("10% Attack Speed", "attackSpeed"), T("+1,500 Maximum Life", "life")],
      sockets: ["Splinter of Pain"] },
    amulet: { name: "Moloch's Beating Flame", rarity: "mythic", affixes: [A("×30% Fire Damage Multiplier", "fireDamageMult"), A("+2 to Hellfire Skills", "ranksHellfire")],
      sockets: ["Splinter of Anguish"] },
    ring1: { name: "Plain Band", rarity: "legendary", affixes: [A("5% Critical Strike Chance", "critChance"), A("×15% Vulnerable Damage (enchanted)", "vulnDamage", { enchanted: true })] },
    ring2: { name: "The Eightfold Idol", rarity: "unique", affixes: [A("+150 Willpower", "willpower")] },
  },
};

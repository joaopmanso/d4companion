// Where each item comes from in Season 15, and the fastest way to get it. Shared by every build.
// `routes` are ordered best first. `kind` drives the badge: boss, helltide, dungeon, craft, hordes, undercity, world.
// Sources checked Oct 30, 2026: diablofilter.com, Maxroll, AOEAH boss tables, Timesaver, d4guides, Icy Veins.

export const ART = {
  "leorics-crown": "art/leorics-crown.webp",
  enigma: "art/enigma.webp",
  "hand-of-apotheosis": "art/hand-of-apotheosis.webp",
  temerity: "art/temerity.webp",
  elegy: "art/elegy.webp",
  "infernal-homunculus": "art/infernal-homunculus.webp",
  "molochs-beating-flame": "art/molochs-beating-flame.webp",
  "wendigo-brand": "art/wendigo-brand.webp",
  "the-eightfold-idol": "art/the-eightfold-idol.webp",
};

export const BASE_ART = {
  helm: "art/base-helm.webp", chest: "art/base-chest_armor.webp", gloves: "art/base-gloves.webp", pants: "art/base-pants.webp",
  boots: "art/base-boots.webp", sword: "art/base-sword.webp", focus: "art/base-focus.webp", amulet: "art/base-amulet.webp", ring: "art/base-ring.webp",
};

// Common boss facts reused by the item routes below.
const BELIAL = "After opening a lair boss hoard at Torment, Belial can ambush. Beat him and you choose which boss's loot pool his hoard uses, so pick the pool of the item you want.";

export const SOURCES = {
  "leorics-crown": {
    name: "Leoric's Crown", rarity: "mythic", slot: "Helm",
    power: "Gems socketed in the helm get 35–50% more effect, and the helm counts as Jewelry.",
    routes: [
      { kind: "boss", label: "Baal, Worldstone Keep (Hell)", best: true, steps: ["No key needed; the map labels it Torment 12.", "Also drops Stone of Jordan, so every kill rolls for both."] },
      { kind: "boss", label: "Echo of Mephisto with a Crux of the False Prophet", steps: ["One guaranteed Mythic per Crux. The Crux is spent when you open the hoard, not on entry.", "Crux drops from Greater Lair Bosses at T10+ and sometimes from Whisper key caches."] },
      { kind: "boss", label: "Echo of Diablo", steps: ["Free to summon; lower Mythic odds than a Crux kill."] },
      { kind: "craft", label: "Jeweler: random Mythic for the Helm slot", steps: ["Costs Resplendent Sparks plus runes. Random Warlock Mythic, not targeted."] },
    ],
  },
  enigma: {
    name: "Enigma", rarity: "unique", slot: "Chest Armor", runeword: ["Jah", "Ith", "Ber"],
    power: "Runeword: Evade becomes the Sorcerer's Teleport and costs 33 Primary Resource. Also +2 to All Skills, +45% Movement Speed, 12% Damage Reduction and 40% Maximum Life.",
    routes: [
      { kind: "craft", label: "Horadric Cube: white Chest Armor + Jah + Ith + Ber", best: true, steps: ["The base must be a Common (white) Chest Armor; Ancestral is optional but better.", "Rune order doesn't matter in D4.", "Re-temper Maximum Life (Worldly Endurance) and socket Cem + Que afterwards."] },
      { kind: "boss", label: "Jah: Lair Bosses with the Lair of Runes node", steps: ["Take Lair of Runes in the Lair Bosses War Plan so each boss drops its own runes.", "Guides point to The Beast in the Ice for Jah."] },
      { kind: "craft", label: "Ber: Cube upgrade from Lo runes", steps: ["Guides disagree on the exact recipe (2 or 3 Lo). Check the Cube's recipe list in game before spending.", "Worldstone Keep and Torment 12 Capstone Dungeons drop Lo and Ber as a side effect."] },
      { kind: "craft", label: "Ith: climb the lower rune ladder in the Cube", steps: ["Ith is reachable by upgrading low runes; don't farm it directly."] },
    ],
  },
  "hand-of-apotheosis": {
    name: "Hand of Apotheosis", rarity: "mythic", slot: "Gloves",
    power: "Each Demonform grants every Metamorphosis Upgrade for free, and they're 50–100% more potent.",
    routes: [
      { kind: "boss", label: "Belial hoard → Bartuc's pool", best: true, steps: [BELIAL, "Confirmed in game that Belial offers the Bartuc pool."] },
      { kind: "hordes", label: "Bartuc, Lord of Chaos", steps: ["Infernal Hordes Compass, then spend 666 Burning Aether on Bartuc after the last wave.", "Take Colossal Fiends and Spire multipliers to reach 666 Aether reliably."] },
    ],
  },
  temerity: {
    name: "Temerity", rarity: "mythic", slot: "Pants",
    power: "Overhealing becomes a Barrier worth 80–100% of the excess for 8 s.",
    routes: [
      { kind: "boss", label: "Harbinger of Hatred (Greater Lair Key)", best: true, steps: ["Use the Two by Two War Plan node to fight two bosses per key."] },
      { kind: "boss", label: "Belial hoard → Harbinger's pool", steps: [BELIAL] },
    ],
  },
  elegy: {
    name: "Elegy", rarity: "mythic", slot: "Sword",
    power: "Blazing Scream becomes an Archfiend Skill with 30–50% more damage and gets the Skull Splitter variant for free.",
    routes: [
      { kind: "boss", label: "Lord Zir (Lair Key)", best: true, steps: ["Lair Bosses War Plan: Two by Two first."] },
      { kind: "boss", label: "Belial hoard → Lord Zir's pool", steps: [BELIAL] },
      { kind: "craft", label: "Horadric Cube: upgrade a Unique Elegy to Mythic", steps: ["Keeps affixes, tempers and masterwork, but uses your single Crafted Mythic slot."] },
    ],
  },
  "infernal-homunculus": {
    name: "Infernal Homunculus", rarity: "mythic", slot: "Focus",
    power: "Archfiend Skills deal 80–110% more damage; casting one activates all Lesser Demon Upgrades with 200% longer durations.",
    routes: [
      { kind: "boss", label: "Urivar (Lair Key)", best: true, steps: ["Only worth it once you have Elegy."] },
      { kind: "boss", label: "Belial hoard → Urivar's pool", steps: [BELIAL] },
    ],
  },
  "molochs-beating-flame": {
    name: "Moloch's Beating Flame", rarity: "mythic", slot: "Amulet",
    power: "Hellfire Skills deal 20–30% more damage per Volatility-Empowered Skill; each cast adds 5% Core Stats for 10 s, up to 50%.",
    routes: [
      { kind: "boss", label: "The Butcher (Greater Lair Key)", best: true, steps: ["Greater keys drop more often with the Helltide Writhe and Rot node."] },
      { kind: "boss", label: "Belial hoard → The Butcher's pool", steps: [BELIAL] },
    ],
  },
  "wendigo-brand": {
    name: "Wendigo Brand", rarity: "mythic", slot: "Ring",
    power: "Every 15 kills in the last 50–60 s gives +2% damage and +1% Attack Speed.",
    routes: [
      { kind: "boss", label: "Any lair boss (General Unique Pool)", best: true, steps: ["diablofilter lists Lord Zir and Andariel as targeted bosses; farm Zir so Elegy rolls drop too.", "Belial hoards are 50% general pool, so any Belial pick can drop it."] },
      { kind: "world", label: "World drop", steps: ["Helltide and Nightmare Dungeon bosses can drop it at a lower rate."] },
    ],
    note: "Reported in July to drain health at max stacks; Blizzard said it was investigating.",
  },
  "the-eightfold-idol": {
    name: "The Eightfold Idol", rarity: "mythic", slot: "Ring",
    power: "Blazing Scream leaves Shadow or Lava Sigil of Subversion trails; enemies on them take 60–80% more Abyss or Hellfire damage.",
    routes: [
      { kind: "boss", label: "The Beast in the Ice (Lair Key)", best: true, steps: ["Out of the Cold (Lair Bosses War Plan) adds Beast in the Ice items.", "Also the best boss for Jah runes."] },
      { kind: "boss", label: "Belial hoard → Beast in the Ice's pool", steps: [BELIAL] },
    ],
  },
  "undying-aspect": {
    name: "Undying Aspect", rarity: "legendary", slot: "Boots", aspect: true,
    power: "Casting a Skill heals you for 2–3% of your Maximum Life, doubled while Injured.",
    routes: [
      { kind: "helltide", label: "Base boots: Helltide Tortured Gifts", best: true, steps: ["Farm Ancestral boots with Willpower, Maximum Evade Charges, Ranks to Hellfire Skills and Wrath Regeneration.", "Spend Cinders on the armour chests; the Writhe and Rot War Plan node speeds this up."] },
      { kind: "dungeon", label: "Unlock the aspect in the Codex of Power", steps: ["Its dungeon is listed in the Codex of Power; select the aspect there to pin it.", "Salvaging a Legendary that has it also unlocks a better roll."] },
      { kind: "craft", label: "Occultist: imprint it onto the boots", steps: ["Imprint, then temper Evade Cooldown Reduction (Natural Motion) and masterwork."] },
    ],
  },
  "sadistic-aspect": {
    name: "Sadistic Aspect", rarity: "legendary", slot: "Amulet or Boots", aspect: true,
    power: "Killing your Demons has a 30–50% chance to count as two kills; Life on Kill is increased.",
    routes: [{ kind: "dungeon", label: "Codex of Power dungeon or salvage", best: true, steps: ["The guide's stopgap before Moloch's Beating Flame."] }],
  },
  splinters: {
    name: "Soul Splinters", rarity: "legendary", slot: "Jewelry sockets",
    routes: [
      { kind: "dungeon", label: "Escalation Nightmare Dungeons with the matching gem Reserve", best: true, steps: [
        "Each Splinter grants one resistance. Pick the gem Reserve bonus of that element on every floor: Ruby → Anguish (Fire), Emerald → Pain (Poison), Amethyst → Damnation (Shadow), Topaz → Sin (Lightning).",
        "The Horadric Chests on those floors and the boss are then very likely to drop it.",
        "Black Soulstone gives All Stats, so no Reserve targets it; just run Escalations."] },
      { kind: "craft", label: "Horadric Cube: 5 Lesser Splinters → 1 Splinter", steps: ["Lesser Splinters of the same name amalgamate into the full one."] },
    ],
  },
  runes: {
    name: "Runes", rarity: "rare", slot: "Sockets",
    routes: [
      { kind: "boss", label: "Lair Bosses with Lair of Runes", best: true, steps: ["Each boss drops its own runes; take the node in the Lair Bosses War Plan."] },
      { kind: "craft", label: "Horadric Cube rune ladder", steps: ["Upgrade lower runes into the one you need. There's no direct jump from Sol to Mal."] },
      { kind: "world", label: "Any activity", steps: ["Runes drop everywhere; Worldstone Keep and T12 Capstones drop high runes most often."] },
    ],
  },
  "set-charms": {
    name: "Set Charms (Flesh of Abaddon, Rite of the Nameless)", rarity: "set", slot: "Talisman",
    routes: [
      { kind: "undercity", label: "Kurast Undercity with a Tribute of the Horadrim", best: true, steps: ["The Tribute guarantees Charm and Seal drops; untributed runs drop far fewer.", "Lesser Tributes are crafted at the Occultist; better ones come from World Bosses and War Plans."] },
      { kind: "hordes", label: "Infernal Hordes: Chest of Talismans", steps: ["Take Council Coffers (Hordes War Plan) so the chest spawns after the Fell Council or Bartuc.", "With Diablo's Splinter of Terror at reputation rank 20 the chest costs 1 Aether."] },
      { kind: "craft", label: "Cube: Reroll Set Charm", steps: ["1 Set Charm + 25 Raw Primordial Dust + 50 Infused Horadric Resin turns a duplicate into the piece you're missing.", "Resin comes from salvaging Charms and Seals at the Blacksmith."] },
    ],
  },
  "seal-diamond-mind": {
    name: "Seal of the Diamond Mind", rarity: "mythic", slot: "Talisman seal",
    power: "Set bonuses need one fewer Charm, down to a minimum of 2.",
    routes: [
      { kind: "boss", label: "High-Torment bosses (T10+)", best: true, steps: ["Mythic Seals and Charms only drop at high Torment; sources point to Mephisto and the Prime Evils for the best odds."] },
      { kind: "undercity", label: "Undercity Tributes and Lair Bosses", steps: ["Both drop Seals in bulk; Mythic ones are rare."] },
    ],
    note: "Guides disagree on whether Mythic Seals can be crafted with Resplendent Sparks this season.",
  },
  "hellfire-torch": {
    name: "Hellfire Torch", rarity: "mythic", slot: "Talisman charm",
    power: "Adds +1 to one class Charm Set, plus All Stats, Resistance to All Elements and +1–4 to All Skills.",
    routes: [
      { kind: "boss", label: "Echo of Tristram", best: true, steps: ["Beat all three Prime Evils there.", "Entry needs Wirt's Lucky Coins, cubed from the Terror, Destruction and Hatred Splinters (T12 Capstone Dungeons)."] },
    ],
  },
};

export const KIND_LABEL = {
  boss: "Boss", helltide: "Helltide", dungeon: "Dungeon", craft: "Craft", hordes: "Hordes", undercity: "Undercity", world: "World drop",
};

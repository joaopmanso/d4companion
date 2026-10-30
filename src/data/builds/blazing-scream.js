// Blazing Scream Warlock, d4builds Endgame guide, "BEST OVERALL (currently playing)" variant (?var=2).
// Read from the guide on Oct 30, 2026 (guide updated Oct 25). Gear stats, skill tree and Paragon are the guide's;
// talisman set counting and the Hellfire Torch's set are our reading of the tooltips.

export default {
  id: "blazing-scream-warlock",
  name: "Blazing Scream Warlock",
  className: "Warlock",
  season: 15,
  primaryStat: "Willpower",
  guide: { site: "d4builds", url: "https://d4builds.gg/builds/blazing-scream-warlock-endgame/?var=2", variant: "BEST OVERALL", checked: "2026-10-30" },

  // affixes: in priority order (first = most important). tempers: [affix key, recipe].
  // item.type: mythic | unique | runeword | aspect. `source` points into SOURCES.
  slots: {
    helm: {
      item: { name: "Leoric's Crown", match: /leoric/i, type: "mythic", source: "leorics-crown" },
      affixes: ["willpower", "wrathRegen", "cdr", "life"],
      tempers: [["life", "Worldly Endurance (Defensive)"]],
      sockets: ["Splinter of Anguish", "Splinter of the Black Soulstone"],
    },
    chest: {
      item: { name: "Enigma", match: /enigma/i, type: "runeword", source: "enigma" },
      affixes: ["ranksAll", "movementSpeed", "damageReduction", "life", "armor"],
      tempers: [["life", "Worldly Endurance (Defensive)"]],
      sockets: ["Cem", "Que"],
    },
    gloves: {
      item: { name: "Hand of Apotheosis", match: /apotheosis/i, type: "mythic", source: "hand-of-apotheosis" },
      affixes: ["critChance", "life", "vulnDamage", "critDamage"],
      tempers: [["fireDamage", "Elemental Finesse: Day (Offensive)"]],
    },
    pants: {
      item: { name: "Temerity", match: /temerity/i, type: "mythic", source: "temerity" },
      affixes: ["willpower", "life", "armor", "wrathRegen"],
      tempers: [["life", "Worldly Endurance (Defensive)"]],
      sockets: ["Mal", "Tir"],
    },
    boots: {
      item: { name: "Undying Aspect", match: /undying|casting a skill heals you/i, type: "aspect", source: "undying-aspect" },
      affixes: ["willpower", "evadeCharges", "ranksHellfire", "wrathRegen"],
      tempers: [["evadeCdr", "Natural Motion (Mobility)"]],
    },
    weapon: {
      item: { name: "Elegy", match: /elegy/i, type: "mythic", source: "elegy" },
      affixes: ["life", "ranksBlazingScream", "critDamage", "willpower"],
      tempers: [["critChance", "Worldly Destruction (Weapons)"], ["attackSpeed", "Worldly Destruction (Weapons)"]],
    },
    offhand: {
      item: { name: "Infernal Homunculus", match: /homunculus/i, type: "mythic", source: "infernal-homunculus" },
      affixes: ["life", "ranksDemonology", "critChance", "critDamage"],
      tempers: [["critChance", "Worldly Destruction (Weapons)"]],
      note: "Only once you have Elegy.",
    },
    amulet: {
      item: { name: "Moloch's Beating Flame", match: /moloch/i, type: "mythic", source: "molochs-beating-flame" },
      affixes: ["fireDamageMult", "ranksHellfire", "vulnDamage", "critDamage"],
      tempers: [["life", "Worldly Endurance (Defensive)"]],
      sockets: ["Splinter of Pain"],
      note: "Before Moloch's: a Legendary amulet with Sadistic Aspect.",
    },
    ring1: {
      item: { name: "Wendigo Brand", match: /wendigo/i, type: "mythic", source: "wendigo-brand" },
      affixes: ["willpower", "life", "vulnDamage", "critDamage"],
      tempers: [["resourceGen", "Worldly Stability (Resource)"]],
      sockets: ["Splinter of Damnation"],
    },
    ring2: {
      item: { name: "The Eightfold Idol", match: /eightfold/i, type: "mythic", source: "the-eightfold-idol" },
      affixes: ["willpower", "critDamage", "vulnDamage", "critChance"],
      tempers: [["resourceGen", "Worldly Stability (Resource)"]],
      sockets: ["Splinter of Sin"],
    },
  },

  talisman: {
    seal: { name: "Seal of the Diamond Mind", art: "art/seal-diamond-mind.webp", text: "Set bonuses need one fewer Charm, down to a minimum of 2.", source: "seal-diamond-mind" },
    charms: [
      { name: "Berú of the Nameless", set: "nameless", art: "art/charm-beru-nameless.webp" },
      { name: "Hellfire Torch", set: "torch", art: "art/charm-hellfire-torch.webp", source: "hellfire-torch" },
      { name: "Fer of the Nameless", set: "nameless", art: "art/charm-fer-nameless.webp" },
      { name: "Linta of Abaddon's Flesh", set: "flesh", art: "art/charm-linta-flesh.webp" },
      { name: "Berú of Abaddon's Flesh", set: "flesh", art: "art/charm-beru-flesh.webp" },
      { name: "Phoba of Abaddon's Flesh", set: "flesh", art: "art/charm-phoba-flesh.webp" },
    ],
    // Our reading: the guide's Torch rolls Flesh of Abaddon, which takes its 3 charms to 4.
    torch: { set: "flesh", affixes: ["+10–20% All Stats", "+10–20% Resistance to All Elements", "+1–4 to All Skills", "Can equip 1 more Unique Charm"] },
    sets: {
      flesh: { name: "Flesh of Abaddon", bonuses: [
        [2, "In Demonform you build Infernal Hunger (+0.5% damage taken per stack). Kills, Demon kills and Elite hits turn it into Demonic Strength: ×2% damage per stack for 20 s."],
        [3, "Demonform gives +20% Maximum Life, plus 0.55% more per Demonic Strength stack."],
        [5, "Demonic Strength is 150% stronger and stays after Demonform ends. With Volatility, Hellfire Skills deal ×66% damage and Infernal Hunger builds twice as fast."],
      ] },
      nameless: { name: "Rite of the Nameless", bonuses: [
        [2, "Casting a Sigil starts a 60 s Ritual worth ×100% damage, rising to ×200% near its end. Completing Sigils adds 6 s; when it ends, your next Sigil unleashes the Power Within and Occult Skills cost nothing for 6 s."],
        [3, "The Ritual gives 20% Damage Reduction, rising to 40% as it intensifies."],
        [5, "Casting a Sigil creates every Base Sigil at once. Enemies inside Base Sigils take ×200% damage, doubled while the Power Within is active."],
      ] },
    },
    setNeed: (n) => Math.max(2, n - 1), // Seal of the Diamond Mind
  },

  runes: [
    { pair: ["Mal", "Tir"], socket: "Pants" },
    { pair: ["Cem", "Que"], socket: "Chest (Enigma)" },
  ],
  runeInfo: {
    Mal: { role: "Ritual", rarity: "unique", art: "art/rune-mal.png", text: "Gain 666 Offering when you invoke your Prime Evil power." },
    Tir: { role: "Invocation", rarity: "unique", art: "art/rune-tir.png", text: "Spends 300 Offering: +2 Primary Resource on Kill for 8 s, stacking to +8. Extra Offering adds more stacks." },
    Cem: { role: "Ritual", rarity: "magic", art: "art/rune-cem.png", text: "Gain 75 Offering each time you cast Evade." },
    Que: { role: "Invocation", rarity: "rare", art: "art/rune-que.png", text: "Spends 300 Offering to invoke the Druid's Earthen Bulwark for 3 s, giving you a Barrier. Extra Offering makes it last longer." },
  },
  runeNote: "Short on Wrath? The guide suggests Que + Tir instead.",

  splinters: [
    { short: "Anguish", name: "Splinter of Anguish", socket: "Helm", art: "art/spl-anguish.webp", affix: "+1,750 Fire Resistance", text: "+10% Attack Speed and Critical Strike Chance, but Primary Resource costs rise by 30%.", reserve: "Ruby" },
    { short: "Soulstone", name: "Splinter of the Black Soulstone", socket: "Helm", art: "art/spl-soulstone.webp", affix: "+20 All Stats", text: "Kills absorb a soul for 10 s. Each soul gives ×1.5% damage and +1% damage taken, up to 200 souls; souls don't refresh.", reserve: null },
    { short: "Pain", name: "Splinter of Pain", socket: "Amulet", art: "art/spl-pain.webp", affix: "+1,750 Poison Resistance", text: "15% Damage Reduction, but 30% less Movement Speed.", reserve: "Emerald" },
    { short: "Damnation", name: "Splinter of Damnation", socket: "Ring 1", art: "art/spl-damnation.webp", affix: "+1,750 Shadow Resistance", text: "Killing an Elite pack raises Monster Power by 1 and gives +25% Experience for 15 s.", reserve: "Amethyst" },
    { short: "Sin", name: "Splinter of Sin", socket: "Ring 2", art: "art/spl-sin.webp", affix: "+1,750 Lightning Resistance", text: "+30% Maximum Life, but your Maximum Primary Resource drops by 30%.", reserve: "Topaz" },
  ],

  skills: {
    bar: [
      { name: "Sigil of Chaos", icon: "art/skills/sigil-of-chaos.png" },
      { name: "Metamorphosis", icon: "art/skills/metamorphosis.png" },
      { name: "Summon Abodian", icon: "art/skills/summon-abodian.png" },
      { name: "Dark Prison", icon: "art/skills/dark-prison.png" },
      { name: "Command Fallen", icon: "art/skills/command-fallen.png" },
      { name: "Blazing Scream", icon: "art/skills/blazing-scream.png" },
    ],
    // Points in the order the guide's tree lists them. Upgrade = the diamond node; mods = the two side nodes.
    tree: [
      { skill: "Blazing Scream", ranks: 15, icon: "art/skills/blazing-scream.png", tag: "Fire", upgrade: "Shoots smaller Lesser Demon Skulls that seek enemies and deal 74% damage.",
        mods: ["×3% more damage per different enemy hit, up to ×30%.", "Up to ×30% more damage and speed from your Movement Speed bonus."] },
      { skill: "Sigil of Chaos", ranks: 15, icon: "art/skills/sigil-of-chaos.png", tag: "Fire", upgrade: "Cast around yourself for 15 s and instantly explodes your Lesser Demons inside for 61% damage. Cooldown rises to 25 s.",
        mods: ["Volatility lasts 10 s after you leave the area.", "Volatility-empowered casts inside count as 3 kills."] },
      { skill: "Metamorphosis", ranks: 15, icon: "art/skills/metamorphosis.png", tag: "Fire", upgrade: "Replaces no Skills and grants Volatility while active. Each cast adds ×8.4% Hellfire damage but Burns you for 8% Maximum Life.",
        mods: [] },
      { skill: "Dark Prison", ranks: 15, icon: "art/skills/dark-prison.png", tag: "Shadow", upgrade: "Becomes a Hellfire Skill: an aura of fire chains that cuts damage from outside by 45% and Slows enemies inside.",
        mods: ["Kills inside cut its cooldown by 0.5 s.", "Hits inside Fortify you for 1% Maximum Life."] },
      { skill: "Sigil of Subversion", ranks: 6, icon: "art/skills/sigil-of-subversion.png", tag: "Occult", upgrade: "Becomes a Hellfire Skill: lava trails that deal 543% damage periodically. At these ranks you can have 3 trails at once.",
        mods: ["Trails give ×20% Movement Speed while on them.", "Trails Slow enemies by 75%."] },
      { skill: "Command Fallen", ranks: 1, icon: "art/skills/command-fallen.png", tag: "Physical", upgrade: "Becomes a Hellfire Skill and passively summons a Lunatic every 5 s that detonates near enemies, up to 5.",
        mods: ["+1 Wrath per Demon or enemy killed in the last 2 s, up to +5.", "Every 15 hits gives 1 Dominance."] },
    ],
    soulShard: { group: "Vanguard Shard", text: "Demonform gives Hellfire Demonology Skills ×30% damage and 0.4 Dominance per second per close Hellfire Demonology summon, extending their durations." },
    primeEvil: { main: "Ghosts of Odium", others: ["Undying Rage", "Flush of Bile", "Death Collector", "Strangling Grip", "Vengeful Soul", "Fever of Malice"] },
  },

  // Boards in the order you attach them. Grid rows read top to bottom in the board's own orientation
  // (before rotation): '.' empty, n/m/r normal/magic/rare, L legendary, G glyph socket, S start;
  // upper case = allocated (# = allocated legendary, @ = socketed glyph). rotate = degrees the guide turns the board.
  paragon: {
    points: 299, note: "The guide spends 262 of 299 points; the last 37 go wherever you like.",
    boards: [
      { name: "Starting Board", glyph: "Eldritch Sight", glyphText: "Increase damage to Vulnerable targets by ×15.4%.", rotate: 0,
        stats: { str: 64, dex: 25, int: 59, will: 105 }, legendary: null,
        rares: ["10 Willpower ×2", "4% Maximum Life ×2"],
        grid: [".....................", ".........nNN.........", ".........n.N.........", "........mM.Mm........", ".......nmR.Rmn.......", "......nNMM.Mmnn......", ".....NNNnN@Nnnnn.....", "......nNnNNNNnn......", ".......NnNnnNn.......", "........NN.NN........", "........MN.nM........", ".......mRM.MRM.......", "........m...M........", "........nnNNN........", ".........nSn.........", ".....................", ".....................", ".....................", ".....................", ".....................", "....................."] },
      { name: "Demonic Spicules", glyph: "Demonologist", glyphText: "Demonology Skill damage +15.4%.", rotate: 180,
        stats: { str: 59, dex: 25, int: 49, will: 115 },
        legendary: "Demonology Skill hits shred the enemy's soul: ×40% damage to them permanently, +2% per hit up to ×120%.",
        rares: ["10 Willpower ×2", "4% Maximum Life", "6% Healing Received", "3% Resistance to All Elements", "2% Total Armor"],
        grid: [".....................", "..........Nn.........", "........nnNnn.m......", "........n.NNNMRM.....", "......Mnn...NMm......", "....MRMNN...Nn.......", "....MM.nNNNNNn.......", "....nnn.N...N........", "..nnnnnnNN.mMn.......", "..n...n.n#.MRmn......", ".NNn..n...nnMNn.NNNN.", ".nNn..n.mMnnNnnNNn.n.", "..NNNNNNMRMn@NNNn.nn.", "...MMnn.nMNNN.NNnnnn.", "..mRm....NNnnn.N.n...", "...M.......nnNNNNM...", "..........nnNN.nMM...", "..........nn.nnMMR...", "..........n.nn.......", "..........nnnn.......", "....................."] },
      { name: "Dynamism", glyph: "Unbound", glyphText: "Damage +15.4%.", rotate: 90,
        stats: { str: 59, dex: 20, int: 59, will: 110 },
        legendary: "In Demonform, Demonology Skill damage rises ×2.5% per point of Dominance you have. Out of Demonform you gain 2% Maximum Dominance every 2 s.",
        rares: ["10 Willpower ×2", "3% Resistance to All Elements ×2", "6% Healing Received"],
        grid: [".....................", "..........Nnnnn......", "..........N.nnMm.....", "..........N...MR.....", "..........NNNNMm.....", "..........N..nn......", "....RMMNNNNNnnn......", "....MmnNn.MMnnn......", "..nnM.nN.nRMn.nn.....", ".nnnn..N.MMNnnnnnnnn.", ".N....#Nn..N@nnnnn.n.", ".NNNN..N.MMNnnnnnnnn.", "..nnM.nN.nRMn.nn.....", "....MmnNn.mMnnn......", "....RMMNnnnnnnn......", "..........n..nn......", "..........nnnnmm.....", "..........n...mr.....", "..........n.nnmm.....", "..........nnnnn......", "....................."] },
      { name: "Ritualism", glyph: "Archfiend", glyphText: "Archfiend Skill damage +15.4%.", rotate: 0,
        stats: { str: 54, dex: 10, int: 74, will: 110 },
        legendary: "×90% damage for 20 s after casting a Sigil Skill. Greater Demons count as 10 kills when they die inside Sigils.",
        rares: ["10 Willpower ×2", "4% Maximum Life", "3% Total Armor", "15% Critical Strike Damage", "3% Resistance to All Elements"],
        grid: [".....................", ".........nnn.........", ".........nnn.........", ".........nnn.........", "........nnnnm........", ".......nnn.MM........", "....MMMMNn.MR........", "...nnMR.NNNM.........", "...nn.....N...RMm....", "...nn.....N..MMmnnnn.", ".nnn.n..nNNNNN..nnnn.", ".nnnnnn.NNn..Nnnnnnn.", "..nnnnn.#nn..NNnn....", "...nnnnn......Mn.....", ".mm.nN.nnN...RM......", "nmRNN@NNNNn..MM......", ".nmM.NnNnN.nNNM......", "..nNmn.nnNNNNn.......", "...NMRm.nnN..........", "....nmm..nN..........", ".....n..............."] },
      { name: "Fathomless", glyph: "Hellforge", glyphText: "Hellfire Skill damage +15.4%.", rotate: 180,
        stats: { str: 64, dex: 15, int: 59, will: 110 },
        legendary: "Each demon you've summoned in the last 20 s gives ×15% damage, up to ×105%.",
        rares: ["10 Willpower ×2", "6% Healing Received", "3% Resistance to All Elements"],
        grid: ["...............n.....", "..........nnnnmMN....", "..........nnnnmRmn...", "..........n..nnMN.n..", "..........nnnnnN.nMN.", ".......nnnnnNNN@NMRMn", "......Mnnnn.Nn.nNnMM.", ".nnnMRM.....N.nnNnnn.", ".nnn.mMNnn.MMnnnN.nn.", ".nn...nNNNMRM..nN.nn.", ".n......N..m..nnNNNN.", ".n....nNNn.nn.nn.....", ".nn...NN.nnnn.nn.....", ".nn..nN.nn.nn.nn.....", ".nn..NNnnn.nmmm......", ".nn.n#nn....mr.......", "..nnnn.......m.......", "..mmn.......nn.......", ".mrmnnnnn..nnn.......", "..m..nnnnnnnnn.......", "....................."] },
    ],
  },

  // Character-sheet targets. "Maxroll" ones come from its endgame list; the others are floors we settled on.
  stats: [
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

  links: [
    ["d4builds", "Blazing Scream Warlock, endgame", "The main guide: gear, Paragon, skill tree", "https://d4builds.gg/builds/blazing-scream-warlock-endgame/?var=2"],
    ["Maxroll", "Blazing Scream Warlock guide", "Stat targets, Splinters, Push and Speedfarm variants", "https://maxroll.gg/d4/build-guides/blazing-scream-warlock-guide"],
  ],
};

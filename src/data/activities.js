// Activity reference data carried over from the Blazing Scream Codex: Infernal Hordes offers, War Plan trees,
// Strongroom tests and general guide links. Hordes scores follow Maxroll's offer order, adjusted for what you already took.

export const OFFERS = [
  { id: "colossal", name: "The Colossal Fiends", g: "lords", fx: "Aether Fiends spawn as Aether Lords that drop 3× Aether. Hellfire erupts around Lords.", base: 100 },
  { id: "ruthless", name: "The Ruthless Lords", g: "lords", fx: "Lords give +5 Aether but gain health and damage with each spawn.", base: 88 },
  { id: "enduring", name: "The Enduring Lords", g: "lords", fx: "Lords get much more health and don't despawn at wave end.", base: 45 },
  { id: "chaotic", name: "The Chaotic Offering", g: "special", fx: "Starts a random Chaos Wave.", base: 84 },
  { id: "fiendish", name: "The Fiendish Legions", g: "fiends", fx: "Elites and Fiends deal +25% damage. Aether Fiends can spawn in place of Elites.", base: 80 },
  { id: "goblins", name: "The Aether Goblins", g: "special", fx: "Monsters +100% health. Aether Events can spawn a Goblin worth 25 Aether.", base: 76 },
  { id: "exaltedHordes", name: "The Exalted Hordes", g: "special", fx: "Normal monsters +25% damage. Aether Events spawn 50% faster.", base: 70 },
  { id: "exaltedFiends", name: "The Exalted Fiends", g: "fiends", fx: "Aether Fiends have +100% health and give +2 Aether.", base: 68 },
  { id: "stalking", name: "The Stalking Devil", g: "special", fx: "The Burning Butcher hunts you. Killing him gives +100 Aether.", base: 66 },
  { id: "puffing", name: "The Puffing Masses", g: "masses", fx: "Masses make you Vulnerable. Each Mass drops +1 Aether per offering taken, +2 per Mass offering.", base: 60 },
  { id: "teeming", name: "The Teeming Masses", g: "masses", fx: "Knockback on damage. 50% chance a Mass spawns an Aether Fiend on death.", base: 60 },
  { id: "precious", name: "The Precious Spires", g: "spires", fx: "Soulspires spawn 75% as often but give 2.5× Aether.", base: 58 },
  { id: "massing", name: "The Massing Masses", g: "masses", fx: "Masses +100% health, 30% chance to re-form on death.", base: 52 },
  { id: "treasured", name: "The Treasured Spires", g: "spires", fx: "Soulspires spawn 75% as often but give 2.25× Aether.", base: 50 },
  { id: "coveted", name: "The Coveted Spires", g: "spires", fx: "Soulspires spawn 75% as often but give 2× Aether.", base: 48 },
  { id: "burningRain", name: "The Burning Rain", g: "special", fx: "Hellfire rains on you. Each wave end spawns 9–15 Aether.", base: 42 },
  { id: "wrathOfHell", name: "The Wrath of Hell", g: "special", fx: "Hellfire intensifies. Each wave end spawns 15–24 extra Aether.", base: 40 },
  { id: "anchored", name: "The Anchored Masses", g: "masses", fx: "Masses attack much faster. 50% chance to leave a Soulspire on death.", base: 34 },
  { id: "hungry", name: "The Hungry Spires", g: "spires", fx: "Soulspires pull enemies and you in. Kills in range may drop 1 Aether.", base: 24 },
  { id: "ambushingHB", name: "The Ambushing Hellborne", g: "hellborne", fx: "Hellborne can ambush. Hellborne give +1 Aether.", base: 22 },
  { id: "summonedHB", name: "The Summoned Hellborne", g: "hellborne", fx: "20% chance to spawn with Aether Events. Hellborne give +1 Aether.", base: 20 },
  { id: "exaltedHB", name: "The Exalted Hellborne", g: "hellborne", fx: "Hellborne damage increased. Hellborne give +1 Aether.", base: 18 },
  { id: "surgingHB", name: "The Surging Hellborne", g: "hellborne", fx: "Hellborne health greatly increased. +1 Hellborne per spawn.", base: 14 },
  { id: "meteoricHB", name: "The Meteoric Hellborne", g: "hellborne", fx: "Hellfire damage increased. Hellfire spawns Hellborne.", base: 12 },
  { id: "draining", name: "The Draining Spires", g: "spires", fx: "Soulspires drain your health. +3 Aether when destroyed.", base: 14 },
  { id: "hellish", name: "The Hellish Masses", g: "masses", fx: "Masses explode on death. 50% chance to spawn Hellborne.", base: 10 },
  { id: "rising", name: "The Rising Spires", g: "spires", fx: "Enemies are empowered. A Soulspire spawns at wave start.", base: 10 },
  { id: "bursting", name: "The Bursting Masses", g: "masses", fx: "Unavoidable damage. Two Masses spawn at wave start.", base: 8 },
];
export const OFFER = Object.fromEntries(OFFERS.map((o) => [o.id, o]));
export const SPIRE_MULT = ["precious", "treasured", "coveted"];

export function scoreOffer(id, taken) {
  const o = OFFER[id];
  const has = (x) => taken.includes(x);
  const massTaken = taken.filter((t) => OFFER[t]?.g === "masses").length;
  let s = o.base;
  const why = [];
  if (has(id)) { s -= 25; why.push("You already took it this run. Stacking is unconfirmed, so fresh offers come first."); }
  switch (id) {
    case "colossal": why.push("Maxroll's top offer: every Fiend becomes a Lord worth 3× Aether."); break;
    case "ruthless":
      if (has("colossal") || has("fiendish")) { s += 10; why.push("You already spawn lots of Lords, so +5 each adds up fast."); }
      why.push("Lords get tougher each spawn. Kill them first in late waves."); break;
    case "fiendish":
      if (has("colossal")) { s += 18; why.push("With Colossal Fiends, every Elite it replaces becomes a Lord."); }
      else why.push("More Fiends per wave; best once Colossal Fiends shows up."); break;
    case "exaltedFiends":
      if (has("colossal") || has("fiendish") || has("teeming")) { s += 12; why.push("Builds on your Fiend picks: +2 Aether on each one."); }
      else why.push("Starts a Fiend run. Strong once Colossal Fiends shows up."); break;
    case "teeming":
      if (has("colossal")) { s += 28; why.push("Its Fiends become Lords through Colossal Fiends."); }
      if (has("puffing")) { s += 8; why.push("A Mass offering, so +2 on every Mass's Puffing bonus."); }
      if (!has("colossal") && !has("puffing")) why.push("Fine filler; much better with Colossal Fiends."); break;
    case "puffing":
      if (taken.length < 2) { s += 16; why.push("Taken early, it grows with every later offering."); }
      else why.push(`Late pick: still counts your ${taken.length} offerings.`);
      why.push("Pays out with or without Lord offers. Don't let Masses hit you (Vulnerable)."); break;
    case "massing":
      if (has("puffing")) { s += 22; why.push("Re-forming Masses pay Puffing again, and it adds +2 per Mass as a Mass offering."); }
      else why.push("Without Puffing it mostly makes Masses tankier."); break;
    case "precious": case "treasured": case "coveted":
      if (SPIRE_MULT.some((x) => x !== id && has(x))) { s += 20; why.push("Spire multipliers stack multiplicatively with the one you have."); }
      why.push("No danger added; strongest in a Spire run."); break;
    case "anchored":
      if (SPIRE_MULT.some(has)) { s += 26; why.push("Masses leave Soulspires your multiplier makes valuable."); }
      if (has("teeming")) { s += 6; why.push("Each Mass can pay twice with Teeming."); }
      if (!SPIRE_MULT.some(has)) why.push("Weak without a Spire multiplier."); break;
    case "stalking": why.push("+100 Aether per Butcher kill. Stop clearing and kill him when he shows; keep Evade ready."); break;
    case "chaotic": why.push("Maxroll: almost always worth it unless a Lord offer is on the table."); break;
    case "goblins": why.push("Goblins are 25 Aether each, but all monsters get +100% health."); break;
    case "exaltedHordes": why.push("Faster Aether Events for +25% monster damage."); break;
    case "burningRain": why.push("Flat Aether every wave; walk out of the Hellfire."); break;
    case "wrathOfHell":
      if (has("burningRain") || has("colossal")) { s -= 15; why.push("You already have Hellfire on the ground; this stacks more on top of Metamorphosis drain."); }
      else why.push("Good flat Aether, heavier Hellfire."); break;
    case "draining": s -= 4; why.push("Drains your health on top of Metamorphosis. Skip."); break;
    case "hellish":
      if (has("ambushingHB") || has("summonedHB") || has("exaltedHB")) { s += 6; why.push("Your Hellborne pick makes the spawns worth +1 each."); }
      if (has("puffing")) { s += 6; why.push("Counts as a Mass offering for Puffing."); }
      why.push("Explosions for little Aether."); break;
    case "bursting":
      if (has("puffing") || has("teeming")) { s += 6; why.push("Two extra Masses feed your Mass picks."); }
      why.push("Unavoidable damage. Last resort."); break;
    case "rising": why.push("Every enemy is stronger all wave for one Soulspire. Skip."); break;
    case "enduring": why.push("Lords linger past the wave, but they're much tankier."); break;
    default: if (o.g === "hellborne") why.push("Maxroll: avoid Hellborne unless nothing better is offered."); break;
  }
  if (o.g === "masses" && has("puffing") && id !== "puffing" && !["teeming", "massing", "hellish", "bursting"].includes(id)) {
    s += 8; why.push("Counts as a Mass offering for Puffing.");
  }
  if (massTaken > 0 && id === "puffing") { s += massTaken * 3; }
  return { id, score: s, why };
}

export const TREES = [
  { name: "Lair Bosses", goal: "Mythics, runes", path: [["Two by Two", "Two bosses per run"], ["Greater Nemesis", "Nemesis lairs, better loot"], ["Lair of Runes", "Boss-specific rune drops"], ["Free choice", "Out of the Cold for Beast in the Ice items"], ["Free choice", ""], ["Free choice", ""], ["Free choice", ""]],
    alt: "ConsolePulse: Two by Two, Grigoire's Gambit, Out of the Cold, then Lair of Runes, Lair of Plenty, Golden Hoard, Dog of Astaroth. Maxroll notes a bug: reset dungeons after a Nemesis Lair." },
  { name: "Helltide", goal: "Lair keys, XP", path: [["Hellmouth", "Opens the tree"], ["Writhe and Rot", "High XP and extra Boss Lair keys"], ["Wretched Vermin", "Free cinders"], ["Free choice", "Night Terrors for Escalation elites"], ["Free choice", "Undying Embers or Meat Brothers"], ["Free choice", ""], ["Free choice", ""]],
    alt: "ConsolePulse full tree: Fall of the Fell, Tainted Shrines, Hated Foe, Night Terrors." },
  { name: "Infernal Hordes", goal: "Aether, charms", path: [["Method and Madness", "More consistent runs"], ["Exalted Council", ""], ["Council Coffers", "Adds the Chest of Talismans"], ["Infernal Hoard", "Spend Aether for a chance at good items"], ["Free choice", ""], ["Free choice", ""], ["Free choice", ""]],
    alt: "ConsolePulse: Method and Madness, Total Chaos, Bedlam, Impending Doom, The Black Pact, Exalted Council, Council Coffers. Or Reign in Hell and Pulse of Aether in place of the Chaos nodes (don't mix them)." },
  { name: "The Pit", goal: "Glyph levels", path: [["Choron's Blessing", "Extra Glyph upgrade chances"], ["Choron's Haste", "+1 upgrade chance per 5 min left"], ["Heart of Stone", "Progression orbs from kills"], ["Damned Thieves", "Faster clears"], ["Free choice", ""], ["Free choice", ""], ["Free choice", ""]],
    alt: "ConsolePulse starts with Choron's Haste. Avoid Pit Butcher unless you're safe: the run fails if he kills you." },
  { name: "Nightmare Dungeons", goal: "Escalation, dust", path: [["Waking Spoils", ""], ["Gauntlet", ""], ["Fearless Conviction", "Attuned Primordial Dust"], ["Nemesis", ""], ["Dread Revival", "Boss revivals"], ["Recurring Nightmare", "Escalating Nightmare Sigils"], ["Branching Pathways", "Choose Escalation rewards"]],
    alt: "Maxroll: take the middle path (Branching Pathways) first if you rarely reroll Uniques. ConsolePulse starts there." },
  { name: "Kurast Undercity", goal: "XP, chests", path: [["Endless Swarm", ""], ["Unfortunate Souls", ""], ["Gutter Filth", "More chests per run"], ["Jade Epiphany", "Main XP node"], ["Finely Tuned", ""], ["Pathfinder", "Faster runs"], ["Initiative", "Better Tribute tier if the boss dies in time"]],
    alt: "Guides disagree on Gutter Filth: Maxroll says more chests, ConsolePulse says Portal Pranksters only." },
  { name: "Tree of Whispers", goal: "Caches, XP", path: [["Tree of Plenty", ""], ["Wisdom of Whispers", ""], ["Grim Mysteries", ""], ["Resplendent Favor", "Extra caches and loot"], ["Grim Retribution", ""], ["Colossal Foe", ""], ["Free choice", "Skip Malignant Invasion on Hardcore"]],
    alt: "ConsolePulse uses Chaotic Favor and Corrupted Roots in place of Grim Mysteries. Key caches here can drop a Crux." },
];

export const TESTS = [
  ["s", "Might", "Reaching Reward Upgrade III summons a special demon.", "The demon is worth 500 Attunement, about 125 normal kills."],
  ["s", "Weight", "Idol: +25% Attunement while held. Drops on Evade.", "Everything you kill is worth a quarter more. Evade less."],
  ["a", "Ghosts", "Guide Ghost Apparitions to Pillars: +75 Attunement.", "Big payout, costs killing time."],
  ["a", "Doom", "Idol: +25% Attunement while held. Drops on potion use.", "Like Weight, but you can't potion for Barrier."],
  ["a", "Lunatics", "Pillars tether Lunatics; killing them gives +8 Attunement.", "Free bonus on kills you make anyway."],
  ["a", "Tethering", "Pillars tether monsters; killing them gives +4 Attunement.", "Same idea, smaller."],
  ["a", "Agility", "Per Shrine: Evade cooldown +5 s, kills +25% Attunement for 10 s.", "Good if you don't need Evade."],
  ["a", "Vitality", "Per Shrine: potion cooldown +5 s, kills +25% Attunement for 10 s.", "Good, but delays potion Barrier."],
  ["b", "Lure", "Lure Mummies to Pillars: +40 Attunement.", "Slower than Ghosts for less."],
  ["b", "Wandering", "Catch Wisp of Energy: +25 Attunement.", "Small."],
  ["b", "Restlessness", "Approaching Pillars attracts extra ambushes.", "More kills for a strong build, more damage taken."],
  ["b", "Unsettled", "Completing Pillar Events attracts extra ambushes.", "Same trade as Restlessness."],
  ["b", "Frenzy", "Activating Shrines attracts extra ambushes.", "Same trade."],
  ["b", "Speed", "Approaching Pillars grants +2 Swiftness Motes.", "Movement only."],
  ["b", "Celerity", "Staying near Pillars grants +3 Swiftness Motes.", "Movement only."],
  ["b", "Movement", "Every other Shrine grants +3 Swiftness Motes.", "Movement only."],
  ["b", "Swiftness", "Monsters can drop Swiftness Motes.", "Movement only."],
  ["b", "Chains", "Pillar Ritual: kill tethered monsters to complete it.", "Neutral."],
  ["b", "Slaughter", "Pillar Ritual: kill nearby monsters to complete it.", "Neutral; suits fast AoE."],
  ["b", "Efficiency", "Pillar Ritual 25% faster; you take damage near Pillars.", "Small gain, adds to Metamorphosis drain."],
  ["x", "Mentality", "Per Shrine: monsters +50% health, Pillar Ritual +25% speed.", "Slower kills in a 100-second timer. Skip."],
  ["x", "Ferocity", "Per Shrine: monsters +50% damage, Pillar Ritual +25% speed.", "Danger for little gain. Skip."],
  ["x", "Resistance", "Per Shrine: all resistances −10%, +5 Swiftness Motes.", "Cuts your resistances. Skip."],
];

export const LINKS = [
  ["d4builds", "Blazing Scream Warlock, endgame", "Your main guide: gear, Paragon, skill tree", "https://d4builds.gg/builds/blazing-scream-warlock-endgame/?var=2"],
  ["Maxroll", "Blazing Scream Warlock guide", "Stat targets, Splinters, Push and Speedfarm variants", "https://maxroll.gg/d4/build-guides/blazing-scream-warlock-guide"],
  ["Maxroll", "War Plans", "Every tree and node, updated Oct 14, 2026", "https://maxroll.gg/d4/resources/war-plans"],
  ["ConsolePulse", "Season 15 War Plans", "Starter and full trees, Prime Evil bonuses", "https://consolepulse.com/multiplatform/diablo/guides/diablo-4-season-15-war-plans-guide"],
  ["Maxroll", "Infernal Horde optimization", "Offer order and Aether spending", "https://maxroll.gg/d4/meta/infernal-horde-optimization-guide"],
  ["Maxroll", "Nightmare Dungeons and Strongrooms", "All Strongroom tests and Attunement", "https://maxroll.gg/d4/resources/nightmare-dungeons"],
  ["AOEAH", "Season 15 boss loot tables", "Which boss drops which unique", "https://www.aoeah.com/news/4818--diablo-4-season-15-boss-loot-table--legacymythicsuniques-drop-boss"],
  ["d4guides", "Mythic farming in Season 15", "Baal, Mephisto, Belial, Sparks, crafting", "https://d4guides.gg/en/guides/endgame/mythic-farming-in-diablo-4-season-15-best-methods"],
  ["d4guides", "Crux of the False Prophet", "Where the Mephisto key drops", "https://d4guides.gg/en/guides/endgame/crux-of-the-false-prophet-farm-guaranteed-mythics-from-mephisto"],
  ["Timesaver", "Worldstone Keep and Baal", "Nightmare vs Hell versions, resets", "https://timesaver.gg/blog/diablo-4-worldstone-keep-guide-season-15"],
  ["Icy Veins", "Mythic crafting changes", "Jeweler slot crafting and the Crafted tag", "https://www.icy-veins.com/d4/news/mythic-unique-crafting-changes-coming-to-diablo-4-season-15/"],
  ["diablofilter", "Item database", "Every unique's power, ranges and drop source", "https://diablofilter.com/items"],
  ["d4guides", "Moophisto", "Prime Ribs and the Bovine Sanctum", "https://d4guides.gg/en/bosses/moophisto"],
];

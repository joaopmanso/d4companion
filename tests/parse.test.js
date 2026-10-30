// The OCR parser against the kind of text Tesseract returns for real tooltips: icon junk at line starts,
// letters read as digits, small misspellings, roll ranges and wrapped lines.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseTooltip, splitStat } from "../src/recognize/parse.js";
import { buildVocab } from "../src/recognize/vocab.js";

// The same data the site loads: the class file (skills) and items.json (every known item, all classes).
const json = (f) => JSON.parse(readFileSync(new URL(`../public/data/${f}`, import.meta.url)));
const items = json("items.json");
const warlock = buildVocab(json("class-warlock.json"), items);
const barbarian = buildVocab(json("class-barbarian.json"), items);

test("splitStat drops icon junk and roll ranges, and fixes misread digits", () => {
  assert.deepEqual(splitStat("© +185 Willpower [165 - 190]"), { value: "+185", stat: "Willpower" });
  assert.deepEqual(splitStat("e 12.S% Critical Strike Chance [8.0 - 12.5]%"), { value: "12.5%", stat: "Critical Strike Chance" });
  assert.deepEqual(splitStat("x 22% Vulnerable Damage (15 - 25"), { value: "×22%", stat: "Vulnerable Damage" });
  assert.deepEqual(splitStat("+1,2O4 Maximum Life"), { value: "+1,204", stat: "Maximum Life" });
  assert.deepEqual(splitStat("Lucky Hit: Up to a 20% Chance"), { value: "", stat: "Lucky Hit: Up to a 20% Chance" });
});

test("a noisy legendary helm reads cleanly", () => {
  const text = `GRIM VISAGE
Ancestra1 Legendary He1m
800 ltem Power
1,113 Armor
© +185 Wi11power [165 - 190]
* 12.5% Critcal Strike Chanee [8.0 - 12.5]%
e +1,224 Maximum Lfe
@ 8.5% Cooldown Reductlon
& +14.0% Movement Speed [10 - 14]%
Requires Level 60
Sell Value: 12,345 Gold
Durability: 100/100`;
  const item = parseTooltip(text, "Warlock", warlock);
  assert.equal(item.rarity, "legendary");
  assert.equal(item.ancestral, true);
  assert.equal(item.type, "Helm");
  assert.equal(item.slot, "helm");
  assert.equal(item.itemPower, 800);
  assert.equal(item.name, "Grim Visage");
  assert.deepEqual(item.affixes.map((a) => [a.text, a.key, a.kind]), [
    ["+185 Willpower", "willpower", "affix"],
    ["12.5% Critical Strike Chance", "critChance", "affix"],
    ["+1,224 Maximum Life", "life", "affix"],
    ["8.5% Cooldown Reduction", "cdr", "affix"],
    ["+14.0% Movement Speed", "movementSpeed", "temper"],
  ]);
});

test("unique names snap to the class catalog, and rank lines snap to skills", () => {
  const text = `MOLOCHS BEATlNG FLAME
Mythlc Unique Amu1et
800 Item Power
x 30% Fire Damage Multipller
+2 to Hellflre Skllls
+3 to Blazinq Screarn
Requires Level 60`;
  const item = parseTooltip(text, "Warlock", warlock);
  assert.equal(item.name, "Moloch's Beating Flame");
  assert.equal(item.rarity, "mythic");
  assert.equal(item.slot, "amulet");
  assert.deepEqual(item.affixes.map((a) => [a.text, a.key]), [
    ["×30% Fire Damage Multiplier", "fireDamageMult"],
    ["+2 to Hellfire Skills", "ranksHellfire"],
    ["+3 to Blazing Scream", "ranksBlazingScream"],
  ]);
});

test("a wrapped affix joins back onto its value line", () => {
  const text = `STURDY GREAVES
Legendary Pants
750 Item Power
+9.5% Damage Reduction from
Close Enemies
+180 Strength`;
  const item = parseTooltip(text, "Barbarian", barbarian);
  assert.deepEqual(item.affixes.map((a) => a.text), ["+9.5% Damage Reduction from Close Enemies", "+180 Strength"]);
});

test("legendary aspect text finds the aspect's name", () => {
  const text = `EMBER GRASP
Ancestral Legendary Gloves
800 Item Power
+12% Attack Speed
Skills empowered by Volatility deal an additional x60% increased
damage and you have a 62% chance for Volatility to persist on
casting an empowered Skill.`;
  const item = parseTooltip(text, "Warlock", warlock);
  assert.match(item.aspect, /^Aspect of Ignition: Skills empowered/);
  assert.equal(parseTooltip("X\nLegendary Gloves\n+ Skills empowered by Volatility deal an additional x60% increased damage", "Warlock", warlock).aspect.split(": ")[1].slice(0, 6), "Skills");
  assert.equal(item.affixes.length, 1);
});

test("real Tesseract output from a rendered tooltip, specks and all", () => {
  const text = `STURDY GREAVES                                       |
Legendary Pants                                                         |
750 Item Power

1,013 Armor

eo +180 Strength [1 «© | |
+ +9.5% Damage Reduction from Close Enemies |:
Jor

+ +1,050 Maximum Life [:: 1 a

+o +12.0% Resistance to All Elements - |

¢ Slain Burning enemies have a 10% chance to grant
Overpower. Your Fire damage is increased by x18%.
Empty Socket

Requires Level 60
Sell Value: 31,412 @
Durability: 100/100`;
  const item = parseTooltip(text, "Barbarian", barbarian);
  assert.equal(item.slot, "pants");
  assert.equal(item.itemPower, 750);
  assert.deepEqual(item.affixes.map((a) => a.text), ["+180 Strength", "+9.5% Damage Reduction from Close Enemies", "+1,050 Maximum Life", "+12.0% Resistance to All Elements"]);
  assert.match(item.aspect, /^Overheating Aspect: Slain Burning/);
});

test("a real set charm screenshot: talisman piece, name past the icon junk, multi-line Lucky Hit", () => {
  // Tesseract's output for a player's Fer of Abaddon's Flesh tooltip (green plate, charm art to the right of the name).
  const text = `FER OF                  PIN
ABADD®N'S FLESH    mw

i

Set Charm
850 Item Power

o +1,870 Cold Resistance [1,800 - 2,274]

o Lucky Hit: Up to a 40% Chance to
Deal +800 Shadow Damage [550 -
1,000]

Flesh of Abaddon
—« Phoba of Abaddon's Flesh §
—+ Fer of Abaddon's Flesh {7
— Mlor of Abaddon's Flesh 7
—+ Linta of Abaddon's Flesh &
—+ Berti of Abaddon's Flesh )

Flesh of Abaddon (5/5)
(2) Set:

+ While in Demonform quickly gain
Infernal Hunger stacks, each increasing
the damage you take by 0.5%. Killing

¥* Scroll Down

 + 8 Link`;
  const item = parseTooltip(text, "Warlock", warlock);
  assert.equal(item.talisman, "charm");
  assert.equal(item.slot, null);
  assert.equal(item.name, "Fer of Abaddon's Flesh");
  assert.equal(item.set, "Flesh of Abaddon");
  assert.equal(item.itemPower, 850);
  assert.deepEqual(item.affixes.map((a) => a.text), ["+1,870 Cold Resistance", "Lucky Hit: Up to a 40% Chance to Deal +800 Shadow Damage"]);
  assert.match(item.power, /^\(2\) Set: While in Demonform/);
});

test("a real mythic screenshot: wrapped type line, stylised name, power text not read as affixes", () => {
  // Tesseract's output for a player's Moloch's Beating Flame (purple plate; the type line wraps onto two lines).
  const text = `'MONOCH'S

BEA TING FLARE *

Ancestral Mythic Unique
Amulet

900 Item Power
25 > (% +25) Quality

| 288 All Resist                                             |
* +270 Willpower
o +10.6% Critical Strike Chance [6.5 -
8.5]%
o x42% Fire Damage Multiplier [14 -
241%
o +3 to Hellfire Skills [1 - 3]
¥ +1,875 Maximum Life [1,000 - 1,500]
+ Hellfire Skills deal 39%(x] [25 - 39]%
increased damage for every Skill you
have Empowered by Volatility.
Casting a Volatility Empowered Skill
increases you Core Stats by 5%][+] for
10 seconds, up to 50% +].
#2 You gain 10%(+] Attack Speed and
|          Critical Strike Chance, but your

Primary Resource Costs are increased
hv3n BB Scroll Down

#8 Unequip
 + 8 Link
 Unmark Item`;
  const item = parseTooltip(text, "Warlock", warlock);
  assert.equal(item.name, "Moloch's Beating Flame");
  assert.equal(item.rarity, "mythic");
  assert.equal(item.ancestral, true);
  assert.equal(item.slot, "amulet");
  assert.equal(item.talisman, null);
  assert.equal(item.itemPower, 900);
  assert.deepEqual(item.affixes.map((a) => [a.text, a.key, a.kind]), [
    ["288 All Resist", "resAll", "implicit"],
    ["+270 Willpower", "willpower", "affix"],
    ["+10.6% Critical Strike Chance", "critChance", "affix"],
    ["×42% Fire Damage Multiplier", "fireDamageMult", "affix"],
    ["+3 to Hellfire Skills", "ranksHellfire", "affix"],
    ["+1,875 Maximum Life", "life", "temper"], // fifth line, its own icon and above its roll range
  ]);
  assert.match(item.power, /^Hellfire Skills deal 39%/);
});

test("a unique is identified by name even when its type line is unreadable", () => {
  const item = parseTooltip("HARLEQUIN CREST\n~~ garbled ~~\n800 Item Power\n+12% Cooldown Reduction", "Sorcerer", buildVocab(json("class-sorcerer.json"), items));
  assert.equal(item.name, "Harlequin Crest");
  assert.equal(item.rarity, "mythic");
  assert.equal(item.slot, "helm");
});

test("every unique, mythic and charm in items.json is identified from its name, with junk from the art", () => {
  const misses = [];
  for (const u of items.uniques) {
    const it = parseTooltip(`${u.name.toUpperCase()}   mw\nAncestral ${u.rarity === "mythic" ? "Mythic Unique" : "Unique"} ${u.type}\n800 Item Power`, "Warlock", warlock);
    if (it.name !== u.name || it.slot !== u.slot || it.rarity !== u.rarity) misses.push(`${u.name} → ${it.name} (${it.slot}, ${it.rarity})`);
  }
  for (const [name, c] of Object.entries(items.charms)) {
    const it = parseTooltip(`${name.toUpperCase()} *\n${c.set ? "Set" : c.mythic ? "Mythic" : "Unique"} Charm\n850 Item Power`, "Warlock", warlock);
    if (it.name !== name || it.talisman !== "charm") misses.push(`${name} → ${it.name} (${it.talisman})`);
  }
  assert.deepEqual(misses, []);
});


test("a real mythic weapon: art junk cut at the gap, socket effect, icons for Greater Affix, enchant and temper", () => {
  // Tesseract's output for a player's Elegy (purple header, sword art beside the name and type line).
  const text = `-FLEGY °°                       /

[J       [J                % Ld     *     ’
Ancestral Mythic Unique            * J
Sword
900 Item Power

25 (+25) Quality

2,288 Damage Per Second
-  [1,766 - 2,394] Damage per Hit

+ 1.10 Attacks per Second (Fast)

© +196 Weapon Damage [94 - 157]

¢ +315 Willpower +[150 - 180]

© x31% Critical Strike Damage
Multiplier [13 - 25]%

o +4 to Blazing Scream [3 - 4]

X +6.3% Critical Strike Chance [2.5 -
5.0]%

+ Blazing Scream is now an Archfiend
Skill and deals 65%(x] [39 - 65]%
increased damage. Blazing Scream
gains the Skull Splitter Variant for
free and the Lesser Demon skulls deal
the same damage as the main skull.

& x24% Fire and Holy Damage
Multiplier

TAZ 10 + cnney Frm #ho AAasvisvod Dhl thot`;
  // What iconMarks read from the screenshot's icons, by line.
  const marks = new Map([["196|weapon", "plain"], ["315|willpower", "ga"], ["31|critical", "enchant"], ["4|to", "plain"], ["63|critical", "temper"]]);
  const item = parseTooltip(text, "Warlock", warlock, marks);
  assert.equal(item.name, "Elegy");
  assert.equal(item.rarity, "mythic");
  assert.equal(item.ancestral, true);
  assert.equal(item.slot, "weapon");
  assert.deepEqual(item.affixes.map((a) => [a.text, a.kind, !!a.ga, !!a.enchanted]), [
    ["+196 Weapon Damage", "affix", false, false],
    ["+315 Willpower", "affix", true, false],
    ["×31% Critical Strike Damage Multiplier", "affix", false, true],
    ["+4 to Blazing Scream", "affix", false, false],
    ["+6.3% Critical Strike Chance", "temper", false, false],
  ]);
  assert.deepEqual(item.sockets, ["×24% Fire and Holy Damage Multiplier"]);
  assert.match(item.power, /^Blazing Scream is now an Archfiend Skill/);
});

test("a real runeword screenshot: title read after the type line, compare block ignored", () => {
  // Tesseract's text for Enigma with an equipped chest to compare against: the title comes after Item Power,
  // its tracked M reads as "ITI", and "Properties lost when equipped" lists the other item's stats.
  const text = `Ancestral Unique Chest
Armor

900 Item Power

ENIGITIA %* A
% yan
Wr,

JahIthBer
2,805 Armor (-10% Toughness)
* +1,531 Armor (+1,531)

o 40.0% Maximum Life [40.0]% (
+40.0%)

o +45% Movement Speed [45]% (+14%)
%* 15.0% Damage Reduction (-3.8%)
o +2 to All Skills [2] (+2)                              |

+ Your Evade is now Sorcerer's Teleport
and costs 33 Primary Resource.

APN
hd

- Properties lost when equipped:
o 18.8% Resource Generation
o 31.3% Impairment Reduction
o +31.3% Attack Speed
o +6,100 Maximum Life
Socket (2)

Requires Level 70

Unique Equipped
Lord of Hatred Item 1¥

@ Seasonal Item

#* Scroll Down`;
  const item = parseTooltip(text, "Sorcerer", buildVocab(json("class-sorcerer.json"), items));
  assert.equal(item.name, "Enigma");
  assert.equal(item.rarity, "unique");
  assert.equal(item.ancestral, true);
  assert.equal(item.type, "Chest Armor");
  assert.equal(item.slot, "chest");
  assert.equal(item.itemPower, 900);
  assert.deepEqual(item.affixes.map((a) => [a.text, a.key]), [
    ["+1,531 Armor", "armor"],
    ["40.0% Maximum Life", "life"],
    ["+45% Movement Speed", "movementSpeed"],
    ["15.0% Damage Reduction", "damageReduction"],
    ["+2 to All Skills", "ranksAll"],
  ]);
  assert.deepEqual(item.sockets, []);
  assert.equal(item.power, "Your Evade is now Sorcerer's Teleport and costs 33 Primary Resource.");
});

test("a random legendary name loses icon junk and symbols, and its words snap to known name words", () => {
  // The user's screenshot read "Sadistic Excepti®Nal 5 Y J Boots": ® for an o, and the art's specks on the title line.
  for (const name of ["SADISTIC EXCEPTI®NAL 5 Y J\nBOOTS", "SADISTlC EXCEPTI©NAL BOOTS 5 Y J", "Sadistic Excepti®Nal 5 Y J Boots"]) {
    const item = parseTooltip(`${name}\nAncestral Legendary Boots\n800 Item Power\n+12% Movement Speed`, "Warlock", warlock);
    assert.equal(item.name, "Sadistic Exceptional Boots", name);
    assert.equal(item.slot, "boots");
  }
  assert.equal(parseTooltip("HELM OF THE DEAD\nRare Helm\n800 Item Power", "Warlock", warlock).name, "Helm of the Dead");
});

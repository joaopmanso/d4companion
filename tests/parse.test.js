// The OCR parser against the kind of text Tesseract returns for real tooltips: icon junk at line starts,
// letters read as digits, small misspellings, roll ranges and wrapped lines.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseTooltip, splitStat } from "../src/recognize/parse.js";
import { buildVocab } from "../src/recognize/vocab.js";

const warlock = buildVocab(JSON.parse(readFileSync(new URL("../public/data/class-warlock.json", import.meta.url))));
const barbarian = buildVocab(JSON.parse(readFileSync(new URL("../public/data/class-barbarian.json", import.meta.url))));

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

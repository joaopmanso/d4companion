import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { toBuild } from "../src/data/guides.js";
import { TEST_CHARACTER } from "./fixture.js";
import { evaluate, resolveSlot, slotStatus } from "../src/evaluate.js";
import { parseTooltip } from "../src/recognize/parse.js";
import { matchAffix } from "../src/data/affixes.js";

const build = toBuild(JSON.parse(readFileSync(new URL("../public/data/guides/blazing-scream-warlock-endgame-best-overall-currently-playing.json", import.meta.url))));
const char = structuredClone(TEST_CHARACTER);

test("affix lines map to keys", () => {
  assert.equal(matchAffix("+4 to Blazing Scream"), "ranksBlazingScream");
  assert.equal(matchAffix("+2 Ranks to Hellfire Skills"), "ranksHellfire");
  assert.equal(matchAffix("+12.5% Critical Strike Damage [10.0 - 15.0]%"), "critDamage");
  assert.equal(matchAffix("10.6% Critical Strike Chance"), "critChance");
  assert.equal(matchAffix("+1,875 Maximum Life"), "life");
  assert.equal(matchAffix("+150 Primary Core Stat", "Warlock"), "willpower");
  assert.equal(matchAffix("+150 Primary Core Stat", "Rogue"), "dexterity");
  assert.equal(matchAffix("+3 to Penetrating Shot"), "ranks:penetrating-shot");
  assert.equal(matchAffix("×42% Fire Damage Multiplier"), "fireDamageMult");
  assert.equal(matchAffix("1,234 Armor"), null);
});

test("guide Mythic beats a non-guide legendary ring", () => {
  const wendigo = { name: "Wendigo Brand", rarity: "mythic", affixes: [
    { text: "+200 Willpower", key: "willpower", kind: "affix" },
    { text: "+2,000 Maximum Life", key: "life", kind: "affix" },
    { text: "×20% Vulnerable Damage", key: "vulnDamage", kind: "affix" },
    { text: "+8% Movement Speed", key: "movementSpeed", kind: "affix" },
  ] };
  assert.equal(resolveSlot(wendigo, char, build), "ring1");
  const ev = evaluate(wendigo, "ring1", char, build);
  assert.equal(ev.verdict, "equip");
  const reroll = ev.lines.find((l) => l.reroll);
  assert.equal(reroll.key, "movementSpeed");
  assert.ok(ev.actions.some((a) => a.type === "temper" && /Resource Generation/.test(a.text)));
});

test("worse copy of an equipped guide item is salvage", () => {
  const weak = { name: "Leoric's Crown", rarity: "unique", affixes: [{ text: "+5% Thorns", key: "thorns", kind: "affix" }] };
  assert.equal(evaluate(weak, "helm", char, build).verdict, "salvage");
});

test("seed slots surface the splinter swap", () => {
  const helm = slotStatus(char, build, "helm");
  assert.ok(helm.steps.some((s) => /Anguish/.test(s)));
  const amulet = slotStatus(char, build, "amulet");
  assert.ok(amulet.steps.some((s) => /Pain/.test(s)));
});

test("OCR text parses into an item", () => {
  const text = `WENDIGO BRAND
Ancestral Mythic Unique Ring
800 Item Power
+3,380 Fire Resistance
+210 Willpower [180 - 220]
+12.5% Critical Strike Damage
+2,100 Maximum Life
×22% Vulnerable Damage
+8.0% Resource Generation
Every 15 kills in the last 60 seconds grants you +2% damage and +1% Attack Speed.
Requires Level 60`;
  const it = parseTooltip(text);
  assert.equal(it.name, "Wendigo Brand");
  assert.equal(it.rarity, "mythic");
  assert.equal(it.ancestral, true);
  assert.equal(it.itemPower, 800);
  assert.equal(it.slot, "ring");
  assert.deepEqual(it.affixes.map((a) => a.key), ["fireRes", "willpower", "critDamage", "life", "vulnDamage", "resourceGen"]);
  assert.deepEqual(it.affixes.map((a) => a.kind), ["implicit", "affix", "affix", "affix", "affix", "temper"]);
  assert.equal(it.affixes[1].text, "+210 Willpower");
  assert.match(it.power, /Every 15 kills/);
});

// Canonical affix keys. A tooltip line (from Claude or OCR) is matched against these in order,
// so more specific patterns come before the general ones they overlap with.
// `core` marks the class's primary stat, which guides also write as "Primary Core Stat".
export const AFFIXES = [
  { key: "ranksBlazingScream", label: "Ranks to Blazing Scream", re: /(ranks?\s*(to|of)\s*)?blazing scream\b(?!.*(damage|deals|becomes))/i, rank: true },
  { key: "ranksSigilSubversion", label: "Ranks to Sigil of Subversion", re: /(ranks?\s*(to|of)\s*)?sigil of subversion\b(?!.*(trails|deals))/i, rank: true },
  { key: "ranksDemonology", label: "Ranks to Demonology Skills", re: /demonology skills?$/i, rank: true },
  { key: "ranksHellfire", label: "Ranks to Hellfire Skills", re: /hellfire skills?$/i, rank: true },
  { key: "ranksAll", label: "Ranks to All Skills", re: /all skills$/i, rank: true },
  { key: "willpower", label: "Willpower", re: /willpower/i },
  { key: "allStats", label: "All Stats", re: /all stats/i },
  { key: "life", label: "Maximum Life", re: /max(imum)?\.?\s*life(?!\s*(on|per))/i },
  { key: "critChance", label: "Critical Strike Chance", re: /crit(ical)?\.?\s*(strike\s*)?chance/i },
  { key: "critDamage", label: "Critical Strike Damage Multiplier", re: /crit(ical)?\.?\s*(strike\s*)?damage/i },
  { key: "vulnDamage", label: "Vulnerable Damage Multiplier", re: /vulnerable damage|damage to vulnerable/i },
  { key: "fireDamageMult", label: "Fire Damage Multiplier", re: /fire (and holy )?damage multiplier/i },
  { key: "fireDamage", label: "Fire Damage", re: /fire damage/i },
  { key: "attackSpeed", label: "Attack Speed", re: /attack speed/i },
  { key: "evadeCdr", label: "Evade Cooldown Reduction", re: /evade cooldown/i },
  { key: "evadeCharges", label: "Maximum Evade Charges", re: /evade charges?/i },
  { key: "cdr", label: "Cooldown Reduction", re: /cooldown reduction/i },
  { key: "resourceGen", label: "Resource Generation", re: /resource generation/i },
  { key: "wrathRegen", label: "Wrath Regeneration", re: /wrath (regeneration|per second)|primary resource (regeneration|per second)/i },
  { key: "maxWrath", label: "Maximum Wrath", re: /maximum wrath|maximum primary resource/i },
  { key: "movementSpeed", label: "Movement Speed", re: /movement speed/i },
  { key: "damageReduction", label: "Damage Reduction", re: /damage reduction/i },
  { key: "resAll", label: "Resistance to All Elements", re: /resistance to all elements|all resist(ances?)?\b/i },
  { key: "fireRes", label: "Fire Resistance", re: /fire resistance/i },
  { key: "lightningRes", label: "Lightning Resistance", re: /lightning resistance/i },
  { key: "coldRes", label: "Cold Resistance", re: /cold resistance/i },
  { key: "poisonRes", label: "Poison Resistance", re: /poison resistance/i },
  { key: "shadowRes", label: "Shadow Resistance", re: /shadow resistance/i },
  { key: "physicalRes", label: "Physical Resistance", re: /physical resistance/i },
  { key: "armor", label: "Armor", re: /(total\s+)?armor$/i },
  { key: "weaponDamage", label: "Weapon Damage", re: /weapon damage/i },
  { key: "impairment", label: "Impairment Reduction", re: /impairment reduction/i },
  { key: "lifeOnKill", label: "Life on Kill", re: /life on kill/i },
  { key: "lifeOnHit", label: "Life on Hit", re: /life on hit/i },
  { key: "lifePerSecond", label: "Life per Second", re: /life (per second|regeneration)/i },
  { key: "healingReceived", label: "Healing Received", re: /healing received/i },
  { key: "barrier", label: "Barrier Generation", re: /barrier generation/i },
  { key: "dodge", label: "Dodge Chance", re: /dodge chance/i },
  { key: "strength", label: "Strength", re: /strength/i },
  { key: "dexterity", label: "Dexterity", re: /dexterity/i },
  { key: "intelligence", label: "Intelligence", re: /intelligence/i },
  { key: "thorns", label: "Thorns", re: /thorns/i },
  { key: "luckyHit", label: "Lucky Hit Chance", re: /lucky hit/i },
  { key: "overpower", label: "Overpower Damage", re: /overpower/i },
];

export const AFFIX = Object.fromEntries(AFFIXES.map((a) => [a.key, a]));

// Weapon and armour base lines that every item of the type has. They are never rerolled or scored.
const IMPLICIT = /^(damage per second|[\d,.\s-]+damage per hit|attacks per second|[\d,.]+\s*armor$|[\d,.]+\s*item power|requires level|sell value|durability|account bound|unequipped|properties lost)/i;

const clean = (s) => String(s || "")
  .replace(/\[[^\]]*\]/g, "")        // roll ranges like [10.0 - 15.0]%
  .replace(/[•·◆◇★☆*]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

// Strips the number so "+12.5% Critical Strike Damage" leaves "Critical Strike Damage".
export const statText = (line) => clean(line).replace(/^[+\-×x]?\s*[\d,.]+\s*%?\s*(to\s+)?/i, "").replace(/^(to|of)\s+/i, "").trim();

// Each class's main stat, which guides write as "Primary Core Stat".
export const CORE_STAT = { Barbarian: "strength", Paladin: "strength", Druid: "willpower", Warlock: "willpower", Necromancer: "intelligence", Sorcerer: "intelligence", Rogue: "dexterity", Spiritborn: "dexterity" };

// Skill ranks for any class: "ranks:<skill>". The Warlock keys above stay for their nicer labels.
const slug = (s) => s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const rankKey = (skill) => `ranks:${slug(skill.replace(/^ranks?\s+(to|of)\s+/i, ""))}`;

export function matchAffix(line, className) {
  const text = clean(line);
  if (!text || IMPLICIT.test(text)) return null;
  if (/primary core stat/i.test(text)) return CORE_STAT[className] || "willpower";
  const stat = statText(text);
  // Rank lines read "+2 to Blazing Scream" or "+2 Ranks to Hellfire Skills".
  const ranked = /^[+]?\s*\d+\s+(ranks?\s+)?(to|of)\s+/i.test(text);
  for (const a of AFFIXES) {
    if (a.rank && !ranked) continue;
    if (a.re.test(stat) || a.re.test(text)) return a.key;
  }
  return ranked ? rankKey(stat) : null;
}

// A stat named without a value, as guides write it ("Ranks To Blazing Scream", "Hellfire Skills",
// "Primary Core Stat", "Maximum Evade Charge").
export function affixFromName(name, className) {
  if (/primary core stat/i.test(name)) return CORE_STAT[className] || "willpower";
  const text = clean(name).replace(/^ranks?\s+(to|of)\s+/i, "");
  for (const a of AFFIXES) if (a.re.test(text)) return a.key;
  return /^ranks?\s+(to|of)\s+|skills?$/i.test(clean(name)) ? rankKey(text) : null;
}

export const affixValue = (line) => {
  const m = clean(line).match(/[+\-×x]?\s*([\d,]+(\.\d+)?)/);
  return m ? Number(m[1].replace(/,/g, "")) : null;
};

export const affixLabel = (key) => AFFIX[key]?.label
  || (key?.startsWith("ranks:") ? `Ranks to ${key.slice(6).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}` : key) || "That stat";

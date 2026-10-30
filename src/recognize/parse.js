// Turns the text of a Diablo IV tooltip (OCR output, one line per row) into an item.
// OCR can't see the tooltip's icons, so greater affixes and tempers are guessed here and shown for review.
import { matchAffix } from "../data/affixes.js";
import { slotFromType } from "../data/slots.js";

const RARITY_RE = /\b(ancestral\s+)?(mythic\s+unique|unique|legendary|rare|magic|common)\s+([a-z][a-z\s-]{2,30})$/i;
const POWER_RE = /(\d{3,4})\s*item\s*power/i;
const NOISE = /^(requires level|sell value|durability|account bound|not yet discovered|unequipped|properties lost|right[- ]click|shift|tempers?:|\d+\s*\/\s*\d+$|empty socket|masterwork|item power|socket)/i;

export function normaliseLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((l) => l.replace(/[|_~`]/g, " ").replace(/\s+/g, " ").trim())
    .filter((l) => l.length > 1);
}

export function parseTooltip(text, className) {
  const lines = normaliseLines(text);
  const item = { name: "", rarity: "legendary", ancestral: false, itemPower: null, type: "", slot: null, affixes: [], power: "", aspect: "" };

  const ri = lines.findIndex((l) => RARITY_RE.test(l));
  if (ri >= 0) {
    const m = lines[ri].match(RARITY_RE);
    item.ancestral = !!m[1];
    item.rarity = m[2].toLowerCase().startsWith("mythic") ? "mythic" : m[2].toLowerCase();
    item.type = m[3].trim();
    item.slot = slotFromType(item.type);
    // The name is the run of mostly upper-case lines just above the rarity line.
    const nameParts = [];
    for (let i = ri - 1; i >= 0 && nameParts.length < 3; i--) {
      const l = lines[i];
      if (/[a-z]{3}/.test(l) && !/^[A-Z' -]+$/.test(l) && nameParts.length) break;
      if (POWER_RE.test(l) || /^\d/.test(l)) break;
      nameParts.unshift(l);
    }
    item.name = titleCase(nameParts.join(" "));
  } else {
    item.name = titleCase(lines[0] || "");
  }

  const ip = lines.find((l) => POWER_RE.test(l));
  if (ip) item.itemPower = Number(ip.match(POWER_RE)[1]);

  const prose = [];
  for (const l of lines.slice(Math.max(0, ri + 1))) {
    if (NOISE.test(l) || POWER_RE.test(l)) continue;
    if (/^\[?[\d.,\s%-]+\]?%?$/.test(l)) continue; // a lone roll range
    const key = matchAffix(l, className);
    // Stat lines start with a value ("+210 Willpower", "×22% Vulnerable…"); wrapped power text doesn't.
    const looksLikeStat = /^[+×x\-]?\s*[\d,.]+%?\s+\D/.test(l);
    if (key && looksLikeStat) {
      item.affixes.push({ text: l.replace(/\s*\[[^\]]*\]%?/g, "").trim(), key, kind: "affix", ga: false });
    } else if (l.length > 20 && !looksLikeStat) {
      prose.push(l);
    }
  }
  item.power = prose.join(" ").replace(/\s+/g, " ").trim();
  if (item.rarity === "legendary") { item.aspect = item.power; item.power = ""; }

  // Rings carry resistance base stats above the divider; OCR can't see the divider, so mark them here.
  if (item.slot === "ring") {
    for (const a of item.affixes) { if (/Res$/.test(a.key)) a.kind = "implicit"; else break; }
  }
  // Past the fourth affix (second on Magic items), lines are almost always tempers.
  const regular = item.rarity === "magic" ? 2 : 4;
  item.affixes.filter((a) => a.kind === "affix").forEach((a, i) => { if (i >= regular) a.kind = "temper"; });
  return item;
}

const SMALL = new Set(["of", "the", "and", "to", "a", "in"]);
function titleCase(s) {
  return s.toLowerCase().replace(/\b[\p{L}']+/gu, (w, i) => (i > 0 && SMALL.has(w) ? w : w[0].toUpperCase() + w.slice(1)));
}

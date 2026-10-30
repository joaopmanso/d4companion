// Turns the text of a Diablo IV tooltip (OCR output, one line per row) into an item.
// Tooltips are rigidly laid out and use a closed vocabulary, so instead of trusting OCR letter by letter
// each line is snapped onto the nearest known phrase: rarity and type, item name, affix names, skill ranks
// and aspect powers (see ./vocab.js). OCR can't see the tooltip's icons, so greater affixes and tempers
// are guessed here and shown for review.
import { matchAffix } from "../data/affixes.js";
import { slotFromType } from "../data/slots.js";
import { closest, nameIn, norm, similarity, wordOverlap } from "./fuzzy.js";
import { BASE_VOCAB, RARITIES, NOISE_PHRASES } from "./vocab.js";

const RARITY_RE = /\b(ancestral\s+)?(mythic\s+unique|unique|legendary|rare|magic|common|set)\s+([a-z0-9][a-z0-9\s-]{1,30})$/i;
// "800 Item Power", and the misreads "8OO ltem Power", "800 Item P0wer".
const POWER_RE = /([\dOoIl|]{3,4})\s*\+?\s*[il1|]tem\s*p[o0]wer/i;
// Roll ranges after a value: "[8.0 - 12.5]%", "(8.0-12.5)", or one OCR cut off before its bracket closed.
const ROLL_RE = /\s*[[({]\s*[\d.,\s\-–—%xX×]*[\])}]?\s*%?\s*$/;
// A value token, with the letters OCR mistakes for digits: O→0, l/I/|→1, S→5, B→8.
const VALUE_RE = /^([+\-×xX*]?)\s*([\dOoIl|SB][\dOoIl|SB,.]*)\s*(%?)$/;
const DIGIT_FIX = { O: "0", o: "0", I: "1", l: "1", "|": "1", S: "5", B: "8" };

export function normaliseLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((l) => l.replace(/[_~`]/g, " ").replace(/\s+/g, " ").trim()
      // Specks of the plate's texture after the text: "Legendary Pants |", "Close Enemies |: ©»".
      .replace(/(\s+[^A-Za-z0-9%\])]{1,3})+$/, ""))
    .filter((l) => l.length > 1);
}

// Splits "◆ +12.5% Critical Strike Damage [8.0 - 12.5]%" into its value and stat words.
// Icons at the start of the line come through as one or two junk characters, so they are dropped.
export function splitStat(line) {
  // Everything from the roll range's bracket on is noise, however badly OCR read it ("[1 «© | |").
  const cut = line.search(/[[({]/);
  if (cut > 0 && /[A-Za-z]{2}/.test(line.slice(0, cut))) line = line.slice(0, cut);
  let s = line.replace(ROLL_RE, "").replace(/[[\]{}]/g, " ").replace(/\s+/g, " ").trim();
  s = s.replace(/^[^A-Za-z0-9+\-×]+/, "");
  const words = s.split(" ");
  // Up to two junk tokens in front of the value: "e +185", "eo +180", "© » 12%". A lone x/× is the multiplier sign.
  let sign = "";
  for (let i = 0; i < Math.min(3, words.length - 1); i++) {
    const m = words[i].match(VALUE_RE);
    if (m && /\d/.test(m[2])) {
      const pre = words.slice(0, i).join("");
      if (pre && !/^[^A-Za-z0-9]*[A-Za-z]{0,2}[^A-Za-z0-9]*$/.test(pre)) break;
      sign = m[1] || (/^[xX×*]$/.test(pre) ? "×" : "");
      const num = m[2].replace(/[OoIl|SB]/g, (c) => DIGIT_FIX[c]).replace(/[.,]$/, "");
      if (!/^\d[\d,]*(\.\d+)?$/.test(num)) break;
      return { value: `${sign === "x" || sign === "X" || sign === "*" ? "×" : sign}${num}${m[3]}`, stat: words.slice(i + 1).join(" ") };
    }
  }
  return { value: "", stat: s };
}

// Snaps stat words onto a known affix ("Critcal Strike Chanee" → "Critical Strike Chance"), or onto a skill
// for rank lines ("to Blazinq Scream" → "to Blazing Scream").
function snapStat(stat, vocab) {
  const rank = stat.match(/^(ranks?\s+)?(t[o0]|of)\s+(.+)$/i);
  if (rank) {
    const skill = closest(rank[3], vocab.skills, 0.75) || closest(rank[3], vocab.affixes.filter((a) => /skills$/i.test(a)), 0.75);
    if (skill) return { phrase: `${rank[1] ? "Ranks " : ""}to ${skill.value}`, score: skill.score };
  }
  // Stray marks after the stat ("Strength i:", "Attack Speed 11 111i") are dropped a word at a time.
  const words = stat.split(" ");
  for (let n = words.length; n >= Math.max(1, words.length - 3); n--) {
    const hit = closest(words.slice(0, n).join(" "), vocab.affixes, 0.78);
    if (hit) return { phrase: hit.value, score: hit.score };
  }
  return null;
}

const isNoise = (l) => {
  const head = norm(l).split(" ").slice(0, 3).join(" ");
  return NOISE_PHRASES.some((p) => {
    const n = norm(p);
    return head.startsWith(n) || similarity(head.slice(0, n.length + 1), n) >= 0.8;
  }) || /^\d+\s*\/\s*\d+$/.test(l);
};

// The "Ancestral Legendary Boots" line: exact, or the closest rarity + type pair.
function findRarityLine(lines, vocab) {
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(RARITY_RE);
    if (m && (closest(m[3], vocab.types, 0.75) || slotFromType(m[3]))) {
      const before = norm(lines[i].slice(0, m.index)).split(" ").pop();
      const words = norm(lines[i].slice(0, m.index)).split(" ");
      const mythic = /^unique$/i.test(m[2]) && similarity(words.pop(), "mythic") >= 0.6;
      return { i, ancestral: !!m[1] || words.concat(before).some((w) => similarity(w, "ancestral") >= 0.7), rarity: mythic ? "mythic unique" : m[2], type: closest(m[3], vocab.types, 0.75)?.value || m[3].trim() };
    }
  }
  let best = null;
  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const words = norm(lines[i]).split(" ");
    const ancestral = similarity(words[0], "ancestral") >= 0.7;
    const rest = (ancestral ? words.slice(1) : words).join(" ");
    for (const rarity of RARITIES) {
      const rn = norm(rarity);
      const rWords = rn.split(" ").length;
      const head = rest.split(" ").slice(0, rWords).join(" ");
      const rs = similarity(head, rn);
      if (rs < 0.7) continue;
      const type = closest(rest.split(" ").slice(rWords).join(" "), vocab.types, 0.7);
      if (!type) continue;
      const score = (rs + type.score) / 2;
      if (!best || score > best.score) best = { i, ancestral, rarity, type: type.value, score };
    }
  }
  return best;
}

const SMALL = new Set(["of", "the", "and", "to", "a", "in"]);
function titleCase(s) {
  return s.toLowerCase().replace(/\b[\p{L}']+/gu, (w, i) => (i > 0 && SMALL.has(w) ? w : w[0].toUpperCase() + w.slice(1)));
}

export function parseTooltip(text, className, vocab = BASE_VOCAB) {
  const lines = normaliseLines(text);
  const item = { name: "", rarity: "legendary", ancestral: false, itemPower: null, type: "", slot: null, affixes: [], power: "", aspect: "" };

  const r = findRarityLine(lines, vocab);
  const ri = r ? r.i : -1;
  let known = null, charm = null;
  if (r) {
    item.ancestral = r.ancestral;
    item.rarity = /mythic/i.test(r.rarity) ? "mythic" : /^set$/i.test(r.rarity) ? "legendary" : r.rarity.toLowerCase();
    item.type = /^set$/i.test(r.rarity) ? `Set ${r.type}` : r.type;
    // Charms and seals go in the talisman, not a gear slot.
    item.talisman = /^charm$/i.test(r.type) ? "charm" : /^seal$/i.test(r.type) ? "seal" : null;
    item.slot = item.talisman ? null : slotFromType(item.type);
    // The name is the run of lines just above the rarity line (long names wrap onto two or three).
    const nameParts = [];
    for (let i = ri - 1; i >= 0 && nameParts.length < 3; i--) {
      const l = lines[i];
      if (POWER_RE.test(l) || /^\W*\d/.test(l) || isNoise(l)) break;
      nameParts.unshift(l.replace(/^[^A-Za-z]+|[^A-Za-z']+$/g, ""));
    }
    const raw = nameParts.join(" ");
    if (item.talisman) {
      // Charm and seal names are fixed: snap to the class's charm or seal list.
      const pool = item.talisman === "charm" ? vocab.charms : vocab.seals;
      const names = pool.map((c) => c.name);
      const hit = closest(raw, names, 0.75) || nameIn(raw, names);
      charm = hit && pool.find((c) => c.name === hit.value);
      item.name = charm ? charm.name : titleCase(raw);
      if (charm?.mythic) item.rarity = "mythic";
      if (charm?.set) item.set = charm.set;
    } else {
      // Uniques and mythics have fixed names, so snap to the class's catalog; legendary and rare names are random.
      const pool = vocab.items.filter((it) => item.rarity === "unique" || item.rarity === "mythic" || !item.type || !it.type || norm(it.type) === norm(item.type));
      const names = pool.map((it) => it.name);
      const tail = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
      const hit = closest(raw, names, 0.72) || (tail && closest(tail, names, 0.8)) || nameIn(raw, names);
      if (hit && (item.rarity === "unique" || item.rarity === "mythic")) {
        known = vocab.items.find((it) => it.name === hit.value);
        item.name = known.name;
        if (known.rarity === "mythic") item.rarity = "mythic";
      } else {
        item.name = titleCase(raw);
      }
    }
  } else {
    item.name = titleCase(lines[0] || "");
  }

  const ip = lines.find((l) => POWER_RE.test(l));
  if (ip) item.itemPower = Number(ip.match(POWER_RE)[1].replace(/[OoIl|]/g, (c) => DIGIT_FIX[c]));

  // A unique's tip lists its affixes, so they are tried first.
  const statVocab = known?.affixes?.length ? { ...vocab, affixes: [...new Set([...known.affixes, ...vocab.affixes])] } : vocab;
  const prose = [];
  let last = null;
  const body = lines.slice(ri + 1);
  for (let li = 0; li < body.length; li++) {
    const l = body[li];
    if (POWER_RE.test(l) || isNoise(l) || /^\(?\d\)?\s*set\b/i.test(l)) { last = null; continue; }
    // "Lucky Hit: Up to a 40% Chance to / Deal +800 Shadow Damage [550 - / 1,000]" is one affix over several lines.
    const lucky = l.replace(/^[^A-Za-z]*\S?\s+(?=lucky)/i, "").match(/^lucky\s*hit\s*[:;]\s*(.+)$/i);
    if (lucky) {
      let text = lucky[1];
      while (!/[[(]/.test(text) && li + 1 < body.length && /^[a-z+\d]/i.test(body[li + 1]) && !isNoise(body[li + 1])) text += ` ${body[++li]}`;
      if (/[[(]/.test(text) && !/[\])]/.test(text) && /^[\d.,\s\-–%]+[\])]/.test(body[li + 1] || "")) li++;
      last = { text: `Lucky Hit: ${text.replace(/\s*[[(].*$/, "").trim()}`, key: null, kind: "affix", ga: false };
      item.affixes.push(last);
      last = null;
      continue;
    }
    if (/^[\s[\]()\d.,%\-–xX×+]+$/.test(l)) continue; // a lone roll range or stray number
    const { value, stat } = splitStat(l);
    const snap = stat ? snapStat(stat, statVocab) : null;
    // Stat lines start with a value ("+210 Willpower", "×22% Vulnerable Damage"). Without one, only a very close
    // match counts, since aspect text is full of stat words.
    if (snap && (value || (snap.score >= 0.9 && stat.length < 40))) {
      const text = `${value} ${snap.phrase}`.trim();
      if (/^[\d,.]+ (total )?armor$/i.test(text)) { last = null; continue; } // the armour base line
      last = { text, key: matchAffix(text, className), kind: "affix", ga: false };
      item.affixes.push(last);
      continue;
    }
    // A long affix that wrapped onto a second line: "+9.5% Damage Reduction from" / "Close Enemies".
    if (last && !value) {
      const joined = snapStat(`${last.text.replace(/^\S+\s/, "")} ${stat}`, statVocab);
      if (joined && joined.phrase.length > last.text.length - 6) {
        last.text = `${last.text.split(" ")[0]} ${joined.phrase}`;
        last.key = matchAffix(last.text, className);
        continue;
      }
    }
    last = null;
    if (value && matchAffix(l, className)) {
      const text = `${value} ${stat}`;
      item.affixes.push({ text, key: matchAffix(text, className), kind: "affix", ga: false });
    } else if (l.length > 20 && !value) {
      prose.push(l.replace(/^[^A-Za-z0-9]+(?=[A-Za-z])/, ""));
    }
  }
  item.power = prose.join(" ").replace(/\s+/g, " ").trim();
  if (charm?.set) {
    // A set charm's tooltip repeats the set's piece list and bonuses; the catalog has them clean.
    item.power = charm.tip.split("\n").filter((t) => /^\(\d\) Set:/.test(t)).join("\n");
  } else if (item.talisman) {
    // keep the unique charm's or seal's power as read
  } else if (item.rarity === "legendary") {
    // Legendary tooltips print the aspect's power but not its name; find the name from the power text.
    let best = null;
    for (const a of vocab.aspects) {
      const s = wordOverlap(item.power, a.power);
      if (!best || s > best.score) best = { ...a, score: s };
    }
    item.aspect = item.power && best?.score >= 0.5 ? `${best.name}: ${item.power}` : item.power;
    item.power = "";
  }

  // Rings carry resistance base stats above the divider; OCR can't see the divider, so mark them here.
  if (item.slot === "ring") {
    for (const a of item.affixes) { if (/Res$/.test(a.key || "")) a.kind = "implicit"; else break; }
  }
  // Past the fourth affix (second on Magic items), lines are almost always tempers.
  const regular = item.rarity === "magic" ? 2 : 4;
  item.affixes.filter((a) => a.kind === "affix").forEach((a, i) => { if (i >= regular) a.kind = "temper"; });
  return item;
}

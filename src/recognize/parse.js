// Turns the text of a Diablo IV tooltip (OCR output, one line per row) into an item.
// Tooltips are rigidly laid out and use a closed vocabulary, so instead of trusting OCR letter by letter
// each line is snapped onto the nearest known phrase: rarity and type, item name, affix names, skill ranks
// and aspect powers (see ./vocab.js). OCR can't see the tooltip's icons, so greater affixes and tempers
// are guessed here and shown for review.
import { matchAffix } from "../data/affixes.js";
import { slotFromType } from "../data/slots.js";
import { closest, nameIn, norm, similarity, wordOverlap } from "./fuzzy.js";
import { BASE_VOCAB, RARITIES, NOISE_PHRASES, RUNE_LIST_RE } from "./vocab.js";

const RARITY_RE = /\b(ancestral\s+)?(mythic\s+unique|mythic|unique|legendary|rare|magic|common|set)\s+([a-z0-9][a-z0-9\s-]{1,30})$/i;
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
    // The item art beside the name and type line is read as words after a wide gap ("BEATING FLAME *    JRRSASYY").
    // Tooltip text is one column, so a line keeps only its wordiest gap-separated part.
    .map((l) => l.split(/\s{3,}/).reduce((a, b) => (b.replace(/[^A-Za-z0-9]/g, "").length > a.replace(/[^A-Za-z0-9]/g, "").length ? b : a), ""))
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

// Matches an affix line between the OCR text and the icon reader: its value's digits and first stat word.
export const lineKey = (value, stat) => `${String(value).replace(/\D/g, "")}|${norm(stat).split(" ")[0] || ""}`;

// Snaps stat words onto a known affix ("Critcal Strike Chanee" → "Critical Strike Chance"), or onto a skill
// for rank lines ("to Blazinq Scream" → "to Blazing Scream").
function snapStat(stat, vocab, trim = true) {
  const rank = stat.match(/^(ranks?\s+)?(t[o0]|of)\s+(.+)$/i);
  if (rank) {
    const skill = closest(rank[3], vocab.skills, 0.75) || closest(rank[3], vocab.affixes.filter((a) => /skills$/i.test(a)), 0.75);
    if (skill) return { phrase: `${rank[1] ? "Ranks " : ""}to ${skill.value}`, score: skill.score };
  }
  // Stray marks after the stat ("Strength i:", "Attack Speed 11 111i") are dropped a word at a time.
  // Only for lines with a value: a power line like "Hellfire Skills deal 39%" must not shrink to "Hellfire Skills".
  const words = stat.split(" ");
  for (let n = words.length; n >= (trim ? Math.max(1, words.length - 3) : words.length); n--) {
    const hit = closest(words.slice(0, n).join(" "), vocab.affixes, 0.78);
    if (hit) return { phrase: hit.value, score: hit.score };
  }
  return null;
}

const isNoise = (l) => {
  const words = norm(l).split(" ");
  return NOISE_PHRASES.some((p) => {
    const n = norm(p);
    const head = words.slice(0, Math.max(3, n.split(" ").length)).join(" ");
    return head.startsWith(n) || similarity(head.slice(0, n.length + 1), n) >= 0.8;
  }) || /^\d+\s*\/\s*\d+$/.test(l);
};

// The "Ancestral Legendary Boots" line: exact, or the closest rarity + type pair. It can wrap onto two lines
// ("Ancestral Mythic Unique" / "Amulet"), so each line is also tried joined with the next. `end` is its last line.
function findRarityLine(lines, vocab) {
  // Single lines first; a joined pair only where the second line holds just the type.
  const single = lines.map((l, i) => [l, i, i]);
  const joined = lines.slice(0, -1).map((l, i) => [`${l} ${lines[i + 1]}`, i, i + 1, l.length]);
  for (const [text, i, end, split] of [...single, ...joined]) {
    const m = text.match(RARITY_RE);
    if (m && (split === undefined || m.index < split) && (closest(m[3], vocab.types, 0.75) || slotFromType(m[3]))) {
      const words = norm(text.slice(0, m.index)).split(" ");
      const mythic = /^unique$/i.test(m[2]) && similarity(words[words.length - 1], "mythic") >= 0.6;
      // "Ancestral Unique Chest" / "Armor": "Chest" alone names a slot, but the type goes on onto the next line.
      const wrapped = split === undefined && lines[i + 1] && !closest(m[3], vocab.types, 0.75) && closest(`${m[3]} ${lines[i + 1]}`, vocab.types, 0.85);
      if (wrapped) return { i, end: i + 1, ancestral: !!m[1] || words.some((w) => similarity(w, "ancestral") >= 0.7), rarity: mythic ? "mythic unique" : m[2], type: wrapped.value };
      return { i, end, ancestral: !!m[1] || words.some((w) => similarity(w, "ancestral") >= 0.7), rarity: mythic ? "mythic unique" : m[2], type: closest(m[3], vocab.types, 0.75)?.value || m[3].trim() };
    }
  }
  for (const views of [single.slice(0, 12), joined.slice(0, 12)]) {
    let best = null;
    for (const [text, i, end] of views) {
      const words = norm(text).split(" ");
      const ancestral = similarity(words[0], "ancestral") >= 0.7;
      const rest = (ancestral ? words.slice(1) : words).join(" ");
      for (const rarity of RARITIES) {
        const rn = norm(rarity);
        const rWords = rn.split(" ").length;
        const rs = similarity(rest.split(" ").slice(0, rWords).join(" "), rn);
        if (rs < 0.7) continue;
        const type = closest(rest.split(" ").slice(rWords).join(" "), vocab.types, 0.7);
        if (!type) continue;
        const score = (rs + type.score) / 2;
        if (!best || score > best.score) best = { i, end, ancestral, rarity, type: type.value, score };
      }
    }
    if (best) return best;
  }
  return null;
}

// Uniques, mythics, charms and seals have fixed names, so the item is found by name in the catalog first;
// its rarity, type and slot then come from the catalog rather than from OCR. Name lines carry junk from the
// item art beside them, so a name is tried as a whole and word by word (nameIn).
function identify(nameLines, vocab, typed) {
  // What the type line allows: a charm or seal, or gear for that slot. Some unique charms share a unique's name.
  const slot = typed && !typed.talisman ? typed.slot : null;
  const fits = (it) => (!slot || !it.slot || it.slot === slot) && (!typed || typed.talisman || it.rarity === typed.rarity);
  const gear = vocab.items.filter(fits);
  const pool = [
    ...(typed?.talisman ? [] : (gear.length ? gear : vocab.items).map((it) => ({ ...it, what: "item" }))),
    ...(typed && typed.talisman !== "charm" ? [] : vocab.charms.map((c) => ({ ...c, what: "charm" }))),
    ...(typed && typed.talisman !== "seal" ? [] : vocab.seals.map((c) => ({ ...c, what: "seal" }))),
  ];
  // Every run of name lines, each also without short junk words at its end ("BEATING FLAME mw").
  const texts = [];
  // Tracked capitals split an M into strokes: "ENIGITIA" is "ENIGMA".
  const lines = nameLines.filter((l) => l.replace(/[^A-Za-z]/g, "").length >= 3) // drop specks like "J"
    .flatMap((l) => (/ITI|IVI/.test(l) ? [l, l.replace(/ITI|IVI/g, "M")] : [l]));
  for (let a = 0; a < lines.length; a++) {
    for (let b = a + 1; b <= lines.length; b++) {
      const words = lines.slice(a, b).join(" ").split(" ").filter(Boolean);
      texts.push(words.join(" "));
      for (let n = words.length - 1; n >= Math.max(1, words.length - 2) && words[n].replace(/[^A-Za-z]/g, "").length <= 3; n--) texts.push(words.slice(0, n).join(" "));
    }
  }
  const search = (candidates, min, shortMin) => {
    const names = candidates.map((p) => p.name);
    let hit = null;
    for (const t of texts) {
      const h = closest(t, names, min, shortMin);
      if (h && (!hit || h.score > hit.score)) hit = h;
    }
    if (!hit) {
      // Word by word, skipping junk between them. A one-word name must match closely ("Infinite" isn't "Infinity").
      const loose = nameIn(lines.join(" "), names);
      if (loose && loose.score >= 0.85 && (norm(loose.value).includes(" ") || loose.score >= 0.95)) hit = loose;
    }
    return hit ? candidates.find((p) => p.name === hit.value) : null;
  };
  // With the type line read, the pool is one slot's and rarity's worth of names, so a looser match is safe
  // ("FLEGY" is Elegy). If that finds nothing, the catalog's slot or rarity may be off: try everything, strictly.
  const narrowed = Boolean(slot || typed?.talisman);
  return search(pool, narrowed ? 0.72 : 0.78, narrowed ? 0.78 : 0.85)
    || (narrowed && !typed.talisman ? search(vocab.items.map((it) => ({ ...it, what: "item" })), 0.78, 0.85) : null);
}

const SMALL = new Set(["of", "the", "and", "to", "a", "in"]);
function titleCase(s) {
  return s.toLowerCase().replace(/\b[\p{L}']+/gu, (w, i) => (i > 0 && SMALL.has(w) ? w : w[0].toUpperCase() + w.slice(1)));
}

// `marks` (from the OCR reader) maps lineKey(value, stat) to the line's icon: "ga", "enchant", "temper" or "plain".
export function parseTooltip(text, className, vocab = BASE_VOCAB, marks = null) {
  const lines = normaliseLines(text);
  const item = { name: "", rarity: "legendary", ancestral: false, itemPower: null, type: "", slot: null, affixes: [], power: "", aspect: "", sockets: [] };

  const r = findRarityLine(lines, vocab);
  const powerAt = lines.findIndex((l) => POWER_RE.test(l));
  // The name is the run of lines above the type line (or above Item Power when the type line wasn't read).
  const top = r ? r.i : powerAt >= 0 ? powerAt : Math.min(lines.length, 3);
  const nameLines = [];
  for (let i = top - 1; i >= 0 && nameLines.length < 3; i--) {
    const l = lines[i];
    // A number line ends the name block, but "0F THE" or "1INTA" are letters misread as digits.
    if (POWER_RE.test(l) || /^\W*\d[\d,.]*%?(\s|$)/.test(l) || isNoise(l)) break;
    nameLines.unshift(l.replace(/^[^A-Za-z]+|[^A-Za-z']+$/g, ""));
  }
  if (r) {
    item.ancestral = r.ancestral;
    item.rarity = /mythic/i.test(r.rarity) ? "mythic" : /^set$/i.test(r.rarity) ? "legendary" : r.rarity.toLowerCase();
    item.type = /^set$/i.test(r.rarity) ? `Set ${r.type}` : r.type;
    item.talisman = /^charm$/i.test(r.type) ? "charm" : /^seal$/i.test(r.type) ? "seal" : null;
    item.slot = item.talisman ? null : slotFromType(item.type);
  } else {
    item.ancestral = lines.slice(0, top + 3).some((l) => norm(l).split(" ").some((w) => similarity(w, "ancestral") >= 0.8));
  }
  // Legendary, rare and magic names are random, so only uniques, mythics, charms and seals are looked up.
  const fixedName = !r || !/^(legendary|rare|magic|common)$/i.test(r.rarity) || item.talisman;
  let id = fixedName ? identify(nameLines, vocab, r && item) : null;
  // Tesseract sometimes reads the big title after the type and Item Power lines ("Ancestral Unique Chest" /
  // "Armor" / "900 Item Power" / "ENIGITIA %* A"), so the lines between them and the first stat are tried too.
  let bodyStart = r ? r.end + 1 : powerAt >= 0 ? powerAt + 1 : top;
  if (fixedName && !id) {
    const from = Math.max(bodyStart, powerAt + 1);
    const below = [];
    for (let i = from; i < lines.length && i < from + 4 && !splitStat(lines[i]).value && !isNoise(lines[i]); i++) below.push(lines[i]);
    id = identify(below.map((l) => l.replace(/^[^A-Za-z]+|[^A-Za-z']+$/g, "")), vocab, r && item);
    if (id) bodyStart = from + below.length;
  }
  let known = null, charm = null;
  if (id?.what === "item") {
    known = id;
    item.name = id.name;
    item.rarity = id.rarity;
    item.type = id.type || item.type;
    item.slot = id.slot || slotFromType(item.type) || item.slot;
    item.talisman = null;
  } else if (id) {
    charm = id;
    item.talisman = id.what;
    item.name = id.name;
    item.slot = null;
    if (id.mythic) item.rarity = "mythic";
    else if (id.unique) item.rarity = "unique";
    if (id.set) item.set = id.set;
    item.type ||= id.what === "seal" ? "Seal" : id.set ? "Set Charm" : `${id.mythic ? "Mythic" : "Unique"} Charm`;
  } else {
    item.name = titleCase(nameLines.join(" ") || lines[0] || "");
  }
  const ip = lines.find((l) => POWER_RE.test(l));
  if (ip) item.itemPower = Number(ip.match(POWER_RE)[1].replace(/[OoIl|]/g, (c) => DIGIT_FIX[c]));

  // A unique's tip lists its affixes, so they are tried first.
  // A known unique rolls from its own affix pool, so that is tried first and loosely; then everything.
  const pool = known?.affixes?.length ? { ...vocab, affixes: known.affixes } : null;
  const statVocab = vocab;
  const snapTo = (stat, trim) => (pool && snapStat(stat, pool, trim)) || snapStat(stat, statVocab, trim);
  const prose = [];
  let last = null;
  const body = lines.slice(bodyStart);
  for (let li = 0; li < body.length; li++) {
    const l = body[li];
    // The compare block lists the equipped item's stats, not this one's; nothing after it belongs to this item.
    if (/^properties lost/.test(norm(l))) break;
    if (RUNE_LIST_RE.test(l)) continue;
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
    if (/\bquality\s*$/i.test(l)) continue; // "25 (+25) Quality"
    if (/damage per (second|hit)|attacks? per second/i.test(l)) continue; // a weapon's base lines
    // After the power text, a stat line is what a socketed gem or rune adds ("×24% Fire and Holy Damage / Multiplier").
    if (prose.length && value) {
      const next = body[li + 1] || "";
      const wraps = next && !splitStat(next).value && next.length < 25 && !isNoise(next);
      const full = `${stat}${wraps ? ` ${next.replace(/[^A-Za-z ]/g, "").trim()}` : ""}`;
      // Only a real stat counts; power text has numbers too ("10 seconds, up to 50%").
      const hit = snapTo(full, true);
      if (hit || matchAffix(`${value} ${full}`, className)) {
        item.sockets.push(`${value} ${hit && hit.score > 0.9 ? hit.phrase : full}`.trim());
        if (wraps) li++;
        continue;
      }
    }
    const snap = stat ? snapTo(stat, !!value) : null;
    // Stat lines start with a value ("+210 Willpower", "×22% Vulnerable Damage"). Without one, only a very close
    // match counts, since aspect text is full of stat words.
    if (snap && (value || (snap.score >= 0.9 && stat.length < 40))) {
      const text = `${value} ${snap.phrase}`.trim();
      if (/^[\d,.]+ (total )?armor$/i.test(text)) { last = null; continue; } // the armour base line
      // A value with no sign is a base stat ("288 All Resist"), not a rolled affix ("+270 Willpower").
      last = { text, key: matchAffix(text, className), kind: /^[\d,.]+\s/.test(text) ? "implicit" : "affix", ga: false, mark: marks?.get(lineKey(value, stat)) };
      item.affixes.push(last);
      continue;
    }
    // A long affix that wrapped onto a second line: "+9.5% Damage Reduction from" / "Close Enemies".
    if (last && !value) {
      const joined = snapTo(`${last.text.replace(/^\S+\s/, "")} ${stat}`, true);
      if (joined && joined.phrase.length > last.text.length - 6) {
        last.text = `${last.text.split(" ")[0]} ${joined.phrase}`;
        last.key = matchAffix(last.text, className);
        continue;
      }
    }
    last = null;
    // A stat the vocabulary doesn't know yet: kept only if the words right after the value name it.
    if (value && stat.length < 40 && matchAffix(`${value} ${stat}`, className)) {
      const text = `${value} ${stat}`;
      item.affixes.push({ text, key: matchAffix(text, className), kind: "affix", ga: false });
    } else if (l.length > 20 && !value) {
      prose.push(l.replace(/^[^A-Za-z0-9]+(?=[A-Za-z])/, ""));
    }
  }
  item.power = prose.join(" ").replace(/\s+/g, " ").trim();
  // Name unreadable? A unique's power text is as good as its name: compare it with every unique's.
  if (!known && !item.talisman && item.power && (!r || /unique|mythic/.test(item.rarity))) {
    let best = null;
    for (const it of vocab.items) {
      const s = it.power ? wordOverlap(item.power, it.power) : 0;
      if (!best || s > best.score) best = { it, score: s };
    }
    if (best?.score >= 0.6) {
      known = best.it;
      Object.assign(item, { name: known.name, rarity: known.rarity, type: known.type || item.type, slot: known.slot || slotFromType(known.type) || item.slot });
    }
  }
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
  // The icons say which lines are Greater Affixes, enchanted or tempered. Without them (no icon read for any
  // line), past the fourth affix (second on Magic items) lines are almost always tempers.
  const rolled = item.affixes.filter((a) => a.kind === "affix");
  if (rolled.some((a) => a.mark)) {
    for (const a of rolled) {
      if (a.mark === "ga") a.ga = true;
      if (a.mark === "enchant") a.enchanted = true;
      if (a.mark === "temper") a.kind = "temper";
    }
  } else {
    const regular = item.rarity === "magic" ? 2 : 4;
    rolled.forEach((a, i) => { if (i >= regular) a.kind = "temper"; });
  }
  for (const a of item.affixes) delete a.mark;
  return item;
}

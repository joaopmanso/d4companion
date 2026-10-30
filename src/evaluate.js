// Compares an item with the build's target for a slot and with what the character wears there,
// then says whether to equip it and what to fix (enchant, temper, imprint, socket, masterwork).
import { affixLabel } from "./data/affixes.js";
import { SOURCES } from "./data/sources.js";
import { SLOT } from "./data/builds/index.js";

const RARITY_RANK = { mythic: 4, unique: 3, legendary: 2, rare: 1, magic: 0, common: 0 };

export function isGuideItem(item, target) {
  if (!item || !target?.item) return false;
  const t = target.item;
  if (t.type === "aspect") return t.match.test(`${item.name} ${item.aspect || ""} ${item.power || ""}`);
  return t.match.test(item.name || "");
}

const regular = (item) => (item?.affixes || []).filter((a) => a.kind === "affix");
const tempers = (item) => (item?.affixes || []).filter((a) => a.kind === "temper");

function affixWeight(key, target) {
  const i = target.affixes.indexOf(key);
  return i < 0 ? 0 : Math.max(4, 10 - i * 1.5);
}

export function scoreItem(item, target) {
  if (!item) return { total: 0, guide: false };
  const guide = isGuideItem(item, target);
  let identity = 0;
  if (guide) identity = target.item.type === "aspect" ? 40 : 50 + (item.rarity === "mythic" ? 15 : 0);
  else if (item.rarity === "mythic" || item.rarity === "unique") identity = 8;

  const seen = new Set();
  let affix = 0;
  for (const a of regular(item)) {
    if (!a.key || seen.has(a.key)) continue;
    seen.add(a.key);
    affix += affixWeight(a.key, target) * (a.ga ? 1.5 : 1);
  }
  let temper = 0;
  const wantT = new Set(target.tempers.map(([k]) => k));
  for (const a of tempers(item)) if (wantT.has(a.key)) { temper += 5; wantT.delete(a.key); }

  const misc = (item.ancestral ? 3 : 0) + (item.itemPower ? Math.max(0, Math.min(4, (item.itemPower - 700) / 50)) : 0) + (RARITY_RANK[item.rarity] || 0) * 0.5;
  return { total: identity + affix + temper + misc, identity, affix, temper, guide };
}

// Picks ring1/ring2 for a ring, and maps an item to its slot by name when the type line was missed.
export function resolveSlot(item, character, build) {
  for (const [id, t] of Object.entries(build.slots)) if (isGuideItem(item, t)) return id;
  const s = item.slot;
  if (s === "ring" || s === "ring1" || s === "ring2") {
    const gain = (id) => scoreItem(item, build.slots[id]).total - scoreItem(character.gear[id], build.slots[id]).total;
    return gain("ring2") > gain("ring1") ? "ring2" : "ring1";
  }
  return s && build.slots[s] ? s : null;
}

export function evaluate(item, slotId, character, build) {
  const target = build.slots[slotId];
  const current = character.gear[slotId] || null;
  const cand = scoreItem(item, target);
  const cur = scoreItem(current, target);
  const guideName = target.item.name;
  const slotName = SLOT[slotId].name;

  // Per-line verdicts.
  const wantTemper = new Map(target.tempers);
  const enchanted = regular(item).find((a) => a.enchanted);
  const lines = (item.affixes || []).map((a) => {
    const label = a.key ? affixLabel(a.key) : "Unrecognised stat";
    if (a.kind === "implicit") return { ...a, status: "neutral", note: "Base stat of the item type." };
    if (a.kind === "temper") {
      return wantTemper.has(a.key)
        ? { ...a, status: "good", note: `Guide temper, from ${wantTemper.get(a.key)}.` }
        : { ...a, status: "bad", note: `Not a guide temper here. Re-temper toward ${target.tempers.map(([k, r]) => `${affixLabel(k)} (from ${r})`).join(" or ")}.` };
    }
    const i = target.affixes.indexOf(a.key);
    if (i >= 0) return { ...a, status: "good", note: `Guide stat #${i + 1} for ${slotName}${a.ga ? ", and a Greater Affix" : ""}.` };
    return { ...a, status: "bad", note: a.ga ? `Greater Affix, but ${label} isn't wanted on ${slotName}.` : `${label} isn't in the guide for ${slotName}.` };
  });

  // Fixes, in the order you'd do them.
  const actions = [];
  const have = new Set(regular(item).map((a) => a.key));
  const missing = target.affixes.filter((k) => !have.has(k));
  const bad = lines.filter((l) => l.kind === "affix" && l.status === "bad");
  if (bad.length && missing.length) {
    let pick = enchanted && bad.includes(lines.find((l) => l.text === enchanted.text)) ? lines.find((l) => l.text === enchanted.text)
      : bad.find((l) => !l.ga) || bad[0];
    if (enchanted && enchanted.text !== pick.text) {
      actions.push({ type: "enchant", text: `${affixLabel(pick.key)} isn't wanted, but the item is already enchanted on ${affixLabel(enchanted.key)}, so that line is the only one you can reroll.` });
    } else {
      pick.reroll = true;
      actions.push({ type: "enchant", text: `Enchant at the Occultist: reroll “${pick.text}” into ${affixLabel(missing[0])}${missing[1] ? ` (or ${affixLabel(missing[1])})` : ""}.` });
    }
    if (bad.length > 1) actions.push({ type: "note", text: `Only one affix can be enchanted, so ${bad.length - 1} unwanted line${bad.length > 2 ? "s stay" : " stays"}.` });
  }
  const temperHave = new Set(tempers(item).map((a) => a.key));
  for (const [k, recipe] of target.tempers) {
    if (!temperHave.has(k)) actions.push({ type: "temper", text: `Temper ${affixLabel(k)}, from ${recipe}.` });
  }
  if (target.item.type === "aspect" && !cand.guide) {
    actions.push({ type: "aspect", text: `Imprint ${guideName} at the Occultist.` });
  }
  if (target.sockets?.length) {
    const has = (item.sockets || []).join(" ");
    const need = target.sockets.filter((s) => !has.toLowerCase().includes(s.toLowerCase().replace(/^splinter of (the )?/, "")));
    if (need.length) actions.push({ type: "socket", text: `Socket ${need.join(" + ")}.` });
  }
  const top = target.affixes.find((k) => have.has(k));
  if (top) actions.push({ type: "masterwork", text: `Masterwork it; you want the crits on ${affixLabel(top)}.` });

  // What a fully fixed copy would score: one enchant, guide tempers, the aspect if this slot uses one.
  const fixedAffix = cand.affix + (actions.some((a) => a.type === "enchant" && /reroll/.test(a.text)) ? affixWeight(missing[0], target) : 0);
  const potential = (cand.guide || target.item.type !== "aspect" ? cand.identity : 40) + fixedAffix + target.tempers.length * 5 + (cand.total - cand.identity - cand.affix - cand.temper);

  let verdict, headline;
  const delta = cand.total - cur.total;
  if (!current) {
    verdict = "equip"; headline = `Equip it. Your ${slotName} slot is empty.`;
  } else if (cand.guide && !cur.guide) {
    verdict = "equip"; headline = `Upgrade: this is the guide's ${guideName}.`;
  } else if (!cand.guide && cur.guide && target.item.type !== "aspect") {
    verdict = potential > cur.total + 4 ? "build" : "salvage";
    headline = verdict === "build" ? `Not ${guideName}, but it could beat yours once fixed.` : `Keep your ${current.name}. The guide's ${guideName} is better than this.`;
  } else if (delta >= 4) {
    verdict = "equip"; headline = `Upgrade over your ${current.name}.`;
  } else if (delta > -4) {
    verdict = potential > cur.total + 4 ? "build" : "sidegrade";
    headline = verdict === "build" ? `About even now, better than yours once fixed.` : `Side-grade: about as good as your ${current.name}.`;
  } else {
    verdict = potential > cur.total + 4 ? "build" : "salvage";
    headline = verdict === "build" ? `Worse right now, but it beats yours once fixed.` : `Salvage. Your ${current.name} is better.`;
  }

  const notes = [];
  if (!cand.guide) {
    const src = SOURCES[target.item.source];
    const best = src?.routes.find((r) => r.best);
    notes.push(`Long term the guide wants ${guideName}${best ? `: ${best.label}.` : "."}`);
  }
  if (item.rarity === "mythic" && cand.guide) notes.push("Mythic: its unique power rolls above the normal range.");

  return { slotId, verdict, headline, lines, actions, notes, score: Math.round(cand.total), currentScore: Math.round(cur.total), potential: Math.round(potential), guide: cand.guide };
}

// The upgrade path for one equipped slot, used by the loadout tooltip.
export function slotStatus(character, build, slotId) {
  const item = character.gear[slotId];
  const target = build.slots[slotId];
  if (!item) return { done: false, steps: [`Nothing recorded. Guide: ${target.item.name}.`] };
  const ev = evaluate(item, slotId, { ...character, gear: { ...character.gear, [slotId]: null } }, build);
  const steps = ev.actions.filter((a) => a.type !== "masterwork" && a.type !== "note").map((a) => a.text);
  if (!ev.guide) steps.push(ev.notes[0]);
  return { done: steps.length === 0, steps, ev };
}

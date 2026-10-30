// Loadout: the character's own gear, talisman, runes and Splinters, laid out like the in-game character
// screen. Nothing here is taken from the guide: where the character has nothing yet, the slot is empty
// and the guide's target is shown separately (dimmed) with the next step.
import { $, esc, tipCard, tipFromText, rarityOf, hoverCards } from "../lib/dom.js";
import { store, shots } from "../lib/store.js";
import { SLOT, paperdoll, BASE_ART } from "../data/slots.js";
import { SOURCES } from "../data/sources.js";
import { CLASS_ART, emblem } from "../data/classes.js";
import { affixLabel } from "../data/affixes.js";
import { slotStatus } from "../evaluate.js";
import { itemArt, itemTip, typeLine, wantedList, ancestralBadge } from "../lib/itemview.js";
import { itemFormHtml, bindItemForm, readItemForm } from "../lib/itemform.js";
import { emptyTalisman, charmInfo, sealInfo, setCounts, lowersThresholds, talismanSteps } from "../lib/talisman.js";
import { setPreset } from "./check.js";
import { artUrl } from "../data/cdn.js";

let selected = "helm";
let editing = false;
let editingStats = false;
let picking = null; // "seal" | charm index being chosen
let hover = null;
let ctxNow = null;

const myTalisman = (char) => char.talisman || emptyTalisman();
// Runes have short one-word names (Tal, Mal, Igni…); any guide's rune list catches the rest.
const GEM = /^(ruby|topaz|skull|emerald|amethyst|sapphire|diamond)\b/i;
const isRune = (name, build) => !GEM.test(name) && !build.catalog?.gems?.[name]
  && !!(build.catalog?.runes?.[name] || build.runes?.some((r) => r.name === name) || /^[A-Z][a-z]{1,3}$/.test(name));

// Sockets the character actually has, and the ones the guide wants that are missing.
function socketReport(char, build, pick) {
  const have = [], missing = [];
  for (const [sid, g] of Object.entries(char.gear || {})) for (const name of g?.sockets || []) if (pick(name)) have.push({ name, slot: sid });
  for (const [sid, t] of Object.entries(build.slots)) for (const name of t.sockets || []) {
    if (!pick(name)) continue;
    const at = have.find((h) => h.name === name);
    if (!at) missing.push({ name, slot: sid, art: t.socketArt?.[name] || "" });
    else if (at.slot !== sid) at.move = sid;
  }
  return { have, missing };
}
const socketArt = (name, build) => build.catalog?.runes?.[name]?.art || build.catalog?.gems?.[name]?.art
  || Object.values(build.slots).map((s) => s.socketArt?.[name]).find(Boolean)
  || (isRune(name, build) ? artUrl("https://sunderarmor.com/DIABLO4/Runes/ritual.png") : "");
const shortSplinter = (n) => n.replace(/^Splinter of (the )?/i, "");

export function render(root, ctx) {
  ctxNow = ctx;
  const { char, build } = ctx;
  if (!root.querySelector(".doll-wrap")) {
    root.innerHTML = `<section class="view">
      <div class="view-head"><h2>Loadout</h2><p>What your character has, laid out like the character screen. Pick a slot for its rolls marked against the guide and what to do next. Empty slots and dimmed sockets are things you haven't entered yet; the guide's target is shown beside them, not as yours.</p></div>
      <div class="doll-wrap">
        <div class="doll"><div class="doll-col left" id="doll-left"></div><div class="doll-figure" id="doll-figure"></div><div class="doll-col right" id="doll-right"></div></div>
        <div class="doll-foot">
          <div class="foot-group"><span class="label">Talisman</span><div class="talisman" id="talisman"></div><div id="tal-pick"></div><ul class="charms" id="charms"></ul></div>
          <div class="foot-stack">
            <div class="foot-group"><span class="label">Runes</span><div class="runes" id="runes"></div></div>
            <div class="foot-group"><span class="label">Splinters</span><div class="splinters" id="splinters"></div></div>
          </div>
        </div>
      </div>
      <div class="loadout-lower"><div id="detail"></div><div class="stats-panel" id="stats"></div></div>
    </section>`;
    bind(root);
  }
  const art = CLASS_ART[build.className];
  $("#doll-figure", root).innerHTML = art
    ? `<img class="portrait" src="${esc(art.portrait)}" alt="" style="object-position:${art.focus}"><img class="crest" src="${esc(emblem(build.className))}" alt=""><span class="art-credit">${esc(art.credit)}</span>`
    : `<img class="crest big" src="${esc(emblem(build.className))}" alt="">`;
  renderDoll(root, char, build);
  renderTalisman(root, char, build);
  renderSockets(root, char, build);
  renderDetail(root, char, build);
  renderStats(root, char, build);
}

function slotButton(id, char, build) {
  if (!id) return `<span class="dslot spacer" aria-hidden="true"></span>`;
  const g = char.gear[id];
  const r = rarityOf(g);
  const target = build.slots[id];
  const st = slotStatus(char, build, id);
  const miss = target && (!g || !target.item.match.test(`${g.name} ${g.aspect || ""} ${g.power || ""}`)) ? `<span class="gd">Guide: ${esc(target.item.name)}</span>` : "";
  return `<button class="dslot${g ? "" : " empty"}" data-pick="${id}" aria-pressed="${id === selected}">
    <span class="ico t-${r === "unknown" ? "unknown" : r}"><img class="art${g ? "" : " empty"}" src="${esc(itemArt(g, id, build))}" alt="">${ancestralBadge(g)}<i class="pip ${st.done ? "done" : "todo"}" aria-hidden="true"></i></span>
    <span class="dtext"><span class="nm r-${r}">${esc(g?.name || SLOT[id].name)}</span><span class="ty">${g ? typeLine(g, id, { html: true }) : "Empty"}</span>${miss}</span>
  </button>`;
}

function renderDoll(root, char, build) {
  const { left, right } = paperdoll(build);
  $("#doll-left", root).innerHTML = left.map((id) => slotButton(id, char, build)).join("");
  $("#doll-right", root).innerHTML = right.map((id) => slotButton(id, char, build)).join("");
  $("#doll-left", root).style.gridTemplateRows = $("#doll-right", root).style.gridTemplateRows = `repeat(${Math.max(left.length, right.length)}, 1fr)`;
}

// Talisman: the seal in the middle, six charm sockets around it. Click a socket to set what you have.
const CHARM_POS = [[30, 15], [70, 15], [11, 50], [89, 50], [30, 85], [70, 85]];

function renderTalisman(root, char, build) {
  const mine = myTalisman(char);
  const seal = sealInfo(mine.seal, build);
  const charms = mine.charms.map((n) => charmInfo(n, build));
  const sockets = CHARM_POS.map(([x, y], i) => {
    const c = charms[i];
    const cls = c ? (c.mythic ? " mythic" : c.unique ? " unique" : c.set ? " set" : "") : " empty";
    return `<span class="tal-ring" style="left:${x}%;top:${y}%"></span><button class="tal-socket${cls}" style="left:${x}%;top:${y}%" data-tip="charm:${i}" aria-label="${esc(c?.name || "Empty charm socket")}">${c?.art ? `<img src="${esc(c.art)}" alt="">` : `<span class="plus">+</span>`}</button>`;
  }).join("");
  $("#talisman", root).innerHTML = `<span class="tal-ring seal-ring" style="left:50%;top:50%"></span>
    <button class="tal-socket seal${seal ? "" : " empty"}" style="left:50%;top:50%" data-tip="seal" aria-label="${esc(seal?.name || "Empty seal socket")}">${seal?.art ? `<img src="${esc(seal.art)}" alt="">` : `<span class="plus">+</span>`}</button>${sockets}`;

  const counts = setCounts(charms);
  const minus = lowersThresholds(seal) ? 1 : 0;
  const steps = talismanSteps(mine, build);
  $("#charms", root).innerHTML = (counts.size ? [...counts].map(([name, n]) => `<li><i></i>${esc(name)} <span class="muted">${n} counted${minus ? " (needs one fewer)" : ""}</span></li>`).join("") : `<li class="muted">No charms entered. Click a socket to add yours.</li>`)
    + (steps.length ? `<li class="tal-steps"><span class="label">To match the guide</span><ul>${steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></li>` : `<li class="ok">Matches the guide's talisman.</li>`);

  const pick = $("#tal-pick", root);
  if (picking === null) { pick.innerHTML = ""; return; }
  const isSeal = picking === "seal";
  const pool = isSeal ? Object.keys(build.catalog?.seals || {}) : Object.keys(build.catalog?.charms || {});
  const want = isSeal ? build.talisman?.seal?.name : build.talisman?.charms?.[picking]?.name;
  const groups = new Map();
  for (const n of pool) { const ci = charmInfo(n, build); const k = isSeal ? "Seals" : (ci.set || (ci.mythic ? "Mythic charms" : "Unique charms")); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(n); }
  const current = isSeal ? mine.seal : mine.charms[picking];
  pick.innerHTML = `<form class="tal-picker" id="tal-form">
    <label class="label" for="tal-choice">${isSeal ? "Your seal" : `Your charm in socket ${picking + 1}`}</label>
    <select id="tal-choice"><option value="">Empty</option>${[...groups].map(([k, list]) => `<optgroup label="${esc(k)}">${list.sort().map((n) => `<option${n === current ? " selected" : ""}>${esc(n)}</option>`).join("")}</optgroup>`).join("")}</select>
    ${want ? `<p class="note">The guide uses ${esc(want)} here.</p>` : ""}
    <div class="row"><button class="btn primary" type="submit">Save</button><button class="btn ghost" type="button" id="tal-cancel">Cancel</button></div>
  </form>`;
}

function renderSockets(root, char, build) {
  const runes = socketReport(char, build, (n) => isRune(n, build));
  const spl = socketReport(char, build, (n) => /^splinter/i.test(n));
  const chip = (s, kind, i, ghost) => `<button class="${kind}${ghost ? " ghost" : ""}" data-tip="${kind}:${ghost ? "want" : "have"}:${i}">
    ${socketArt(s.name, build) ? `<img src="${esc(socketArt(s.name, build))}" alt="">` : ""}${esc(kind === "splinter" ? shortSplinter(s.name) : s.name)}
    <small>${ghost ? `Guide: ${esc(SLOT[s.slot].name)}` : esc(SLOT[s.slot].name)}${!ghost && s.move ? ` → ${esc(SLOT[s.move].name)}` : ""}</small></button>`;
  $("#runes", root).innerHTML = runes.have.map((s, i) => chip(s, "rune", i, false)).join("") + runes.missing.map((s, i) => chip(s, "rune", i, true)).join("") || `<span class="note">None</span>`;
  $("#splinters", root).innerHTML = spl.have.map((s, i) => chip(s, "splinter", i, false)).join("") + spl.missing.map((s, i) => chip(s, "splinter", i, true)).join("") || `<span class="note">None</span>`;
  ctxNow.sockets = { rune: runes, splinter: spl };
}

function guideWants(target, id) {
  return `<div class="want-box"><span class="label">Guide wants for ${esc(SLOT[id].name)}</span>
    ${tipFromText(target.item.tip, { name: target.item.name, art: target.item.art, ghost: true, foot: `Affixes: ${esc(wantedList(target)) || "not listed"}.` })}</div>`;
}

function tipHtml(el) {
  const { char, build } = ctxNow;
  if (el.dataset.pick) {
    const id = el.dataset.pick, g = char.gear[id], target = build.slots[id];
    if (!g) return tipCard({ name: SLOT[id].name, type: "Empty: nothing entered yet", r: "unknown", art: BASE_ART[SLOT[id].kind], ghost: true,
      foot: target ? `Guide wants ${esc(target.item.name)}. Paste a screenshot or enter it by hand.` : "" });
    const st = slotStatus(char, build, id);
    return itemTip(g, id, build, st.ev, { foot: st.steps.length ? `Next: ${esc(st.steps[0])}` : "Matches the guide." });
  }
  const [kind, a, b] = el.dataset.tip.split(":");
  const mine = myTalisman(char);
  if (kind === "seal") {
    const s = sealInfo(mine.seal, build);
    const want = build.talisman?.seal;
    if (!s) return tipCard({ name: "Empty seal socket", r: "unknown", art: want?.art || "", ghost: true, foot: want ? `Guide uses ${esc(want.name)}. Click to set yours.` : "Click to set yours." });
    return tipFromText(s.tip, { name: s.name, art: s.art, r: "mythic", foot: want && want.name !== s.name ? `Guide uses ${esc(want.name)}.` : "Click to change." });
  }
  if (kind === "charm") {
    const c = charmInfo(mine.charms[+a], build);
    const want = build.talisman?.charms?.[+a];
    if (!c) return tipCard({ name: "Empty charm socket", r: "unknown", art: want?.art || "", ghost: true, foot: want ? `Guide uses ${esc(want.name)} here. Click to set yours.` : "Click to set yours." });
    return tipFromText(c.tip, { name: c.name, art: c.art, r: c.mythic ? "mythic" : c.unique ? "unique" : c.set ? "set" : undefined, foot: "Click to change." });
  }
  if (kind === "rune" || kind === "splinter") {
    const rep = ctxNow.sockets[kind];
    const s = a === "want" ? rep.missing[+b] : rep.have[+b];
    const tip = build.catalog?.runes?.[s.name]?.tip || build.runes?.find((r) => r.name === s.name)?.tip || "";
    const foot = a === "want" ? `You don't have this socketed yet. Guide: ${esc(SLOT[s.slot].name)}.` : s.move ? `Guide puts it in ${esc(SLOT[s.move].name)}.` : `Socketed in your ${esc(SLOT[s.slot].name)}.`;
    return tipFromText(tip, { name: s.name, art: socketArt(s.name, build), r: kind === "splinter" ? "legendary" : undefined, ghost: a === "want", foot });
  }
  return "";
}

async function renderDetail(root, char, build) {
  const box = $("#detail", root);
  const id = selected, g = char.gear[id], target = build.slots[id];
  const src = target && SOURCES[target.item.source];
  const want = target ? `<div class="tt-sec"><span class="label">Guide for ${esc(SLOT[id].name)}</span>
    <p><b>${esc(target.item.name)}</b>${target.note ? ` · ${esc(target.note)}` : ""}</p>
    <p class="note">Affixes, in order: ${esc(wantedList(target)) || "not listed"}. Temper: ${esc(target.tempers.map(([k, r]) => `${affixLabel(k)} from ${r}`).join(", ")) || "not listed"}.${target.sockets?.length ? ` Sockets: ${esc(target.sockets.join(" + "))}.` : ""}</p>
    <p class="note">Get it: ${src ? esc(src.routes.find((r) => r.best)?.label || src.routes[0].label) : "see the farm guide"} · <a href="#/farm">full route</a></p></div>` : `<p class="note">This guide doesn't use ${esc(SLOT[id].name)}.</p>`;

  if (editing) {
    box.innerHTML = `<form class="tooltip slot-detail" id="edit-form">${itemFormHtml(g || { name: "", rarity: "legendary", affixes: [] }, { slotId: id, showSlot: false })}
      <div class="slot-actions"><button type="button" class="btn ghost" id="e-cancel">Cancel</button><button class="btn primary" type="submit">Save ${esc(SLOT[id].name)}</button></div></form>`;
    bindItemForm($("#edit-form", box));
    return;
  }
  if (!g) {
    box.innerHTML = `<div class="tooltip slot-detail">
      ${tipCard({ name: SLOT[id].name, type: "Empty: nothing entered yet", r: "unknown", art: BASE_ART[SLOT[id].kind], ghost: true })}
      <div class="slot-actions"><button class="btn" data-act="edit">Enter by hand</button><button class="btn primary" data-act="check">Add from screenshot</button></div>
      ${target ? guideWants(target, id) : ""}${want}</div>`;
    return;
  }
  const st = slotStatus(char, build, id);
  const steps = st.steps.length ? `<ol class="steps">${st.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>` : `<p class="chip done">Matches the guide</p>`;
  box.innerHTML = `<div class="tooltip slot-detail">
    ${itemTip(g, id, build, st.ev, { why: true })}
    <div class="tt-sec"><span class="label">Next steps</span>${steps}</div>
    ${want}
    ${g.shot ? `<button class="tt-shot" id="shot-btn" aria-label="Show the screenshot"><img id="shot-img" alt="Saved tooltip screenshot"></button>` : ""}
    <p class="note">Updated ${esc(new Date(g.updated || Date.now()).toLocaleDateString())}${g.engine ? ` · read by ${g.engine === "claude" ? "Claude" : "OCR"}` : ""}</p>
    <div class="slot-actions"><button class="btn ghost" data-act="clear">Clear slot</button><button class="btn" data-act="edit">Edit by hand</button><button class="btn primary" data-act="check">Check a replacement</button></div>
  </div>`;
  if (g.shot) { const u = await shots.url(g.shot); const img = $("#shot-img", box); if (img && u) img.src = u; }
}

function renderStats(root, char, build) {
  const box = $("#stats", root);
  if (!build.stats.length) { box.innerHTML = `<h3>Stat targets</h3><p class="note">No stat targets on file for the ${esc(build.className)} yet.</p>`; return; }
  const st = char.stats || {};
  const fmt = (s, n) => s.unit === "%" ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) + "%" : n.toLocaleString();
  box.innerHTML = `<div class="stats-head"><h3>Stat targets</h3><div class="row"><span class="note">${st.updated ? `Updated ${esc(new Date(st.updated).toLocaleDateString())}` : ""}</span>
    <button class="btn ghost" id="stats-edit">${editingStats ? "Save numbers" : "Update numbers"}</button></div></div>
    <div class="stat-grid">${build.stats.map((s) => {
      const v = st[s.key], has = typeof v === "number" && isFinite(v);
      const pct = has ? Math.min(100, (v / s.target) * 100) : 0;
      const cls = !has ? "" : v >= s.target ? "ok" : v >= s.target * 0.6 ? "low" : "bad";
      const val = editingStats ? `<input id="stat-${s.key}" inputmode="decimal" value="${has ? v : ""}" aria-label="${esc(s.name)}">` : `<span class="stat-val">${has ? fmt(s, v) : "—"}</span>`;
      return `<div class="stat"><div class="stat-top"><span class="stat-name">${esc(s.name)}</span>${val}</div><div class="meter ${cls}"><i style="width:${pct}%"></i></div><span class="stat-target">Target ${fmt(s, s.target)} · ${s.src === "Maxroll" ? "Maxroll" : "our floor"}</span></div>`;
    }).join("")}</div>
    ${typeof st.toughness === "number" ? `<p class="note">Toughness ${st.toughness.toLocaleString()}</p>` : ""}
    <p class="note">Copy these from the character sheet.</p>`;
}

function bind(root) {
  hover = hoverCards(root, "[data-pick], [data-tip]", (el) => tipHtml(el));
  root.addEventListener("click", (e) => {
    const { char, build, go } = ctxNow;
    const pick = e.target.closest("[data-pick]");
    if (pick) { selected = pick.dataset.pick; editing = false; hover.hide(); render(root, ctxNow); return; }
    const tal = e.target.closest(".tal-socket");
    if (tal) { hover.hide(); picking = tal.dataset.tip === "seal" ? "seal" : +tal.dataset.tip.split(":")[1]; renderTalisman(root, char, build); $("#tal-choice", root)?.focus(); return; }
    if (e.target.closest("#tal-cancel")) { picking = null; renderTalisman(root, char, build); return; }
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "edit") { editing = true; renderDetail(root, char, build); }
    if (act === "check") { setPreset(selected); go("check"); }
    if (act === "clear" && confirm(`Clear ${SLOT[selected].name} for ${char.name}?`)) store.setGear(char.id, selected, null);
    if (e.target.closest("#e-cancel")) { editing = false; renderDetail(root, char, build); }
    if (e.target.closest("#shot-btn")) e.target.closest("#shot-btn").classList.toggle("big");
    if (e.target.closest("#stats-edit")) {
      if (editingStats) {
        const next = { ...(char.stats || {}) };
        for (const s of build.stats) { const raw = $(`#stat-${s.key}`, root)?.value.replace(/[,\s%]/g, ""); next[s.key] = raw === "" || raw == null ? null : Number(raw); }
        next.updated = new Date().toISOString();
        editingStats = false;
        store.updateCharacter(char.id, { stats: next });
      } else { editingStats = true; renderStats(root, char, build); }
    }
  });
  root.addEventListener("submit", (e) => {
    const { char, build } = ctxNow;
    e.preventDefault();
    if (e.target.id === "tal-form") {
      const t = structuredClone(myTalisman(char));
      const v = $("#tal-choice", root).value || null;
      if (picking === "seal") t.seal = v; else t.charms[picking] = v;
      picking = null;
      store.updateCharacter(char.id, { talisman: t });
      return;
    }
    if (e.target.id !== "edit-form") return;
    const prev = char.gear[selected] || {};
    const item = readItemForm(e.target, prev, build.className);
    delete item.slot;
    editing = false;
    store.setGear(char.id, selected, { ...item, updated: new Date().toISOString() });
  });
}

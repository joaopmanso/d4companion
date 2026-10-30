import { $, esc, tipCard, rarityOf, hoverCards } from "../lib/dom.js";
import { store, shots } from "../lib/store.js";
import { SLOT, LEFT, RIGHT } from "../data/builds/index.js";
import { SOURCES } from "../data/sources.js";
import { affixLabel } from "../data/affixes.js";
import { slotStatus } from "../evaluate.js";
import { itemArt, itemTip, typeLine, wantedList } from "../lib/itemview.js";
import { itemFormHtml, bindItemForm, readItemForm } from "../lib/itemform.js";
import { FIGURE } from "../lib/figure.js";
import { setPreset } from "./check.js";

let selected = "gloves";
let editing = false;
let editingStats = false;
let hover = null;
let ctxNow = null;

export function render(root, ctx) {
  ctxNow = ctx;
  const { char, build } = ctx;
  if (!char) { root.innerHTML = `<p class="note">Make a character first in Characters.</p>`; return; }
  if (!root.querySelector(".doll-wrap")) {
    root.innerHTML = `<section class="view">
      <div class="view-head"><h2>Loadout</h2><p>Pick a slot to see its rolls marked against the guide and what to do next. A gold diamond means the slot matches the guide with nothing left to fix; an ember one means it still has steps.</p></div>
      <div class="doll-wrap">
        <div class="doll"><div class="doll-col left" id="doll-left"></div><div class="doll-figure" aria-hidden="true">${FIGURE}<img class="crest" src="art/class-warlock.webp" alt=""></div><div class="doll-col right" id="doll-right"></div></div>
        <div class="doll-foot">
          <div class="foot-group"><span class="label">Talisman</span><div class="talisman" id="talisman"></div><ul class="charms" id="charms"></ul></div>
          <div class="foot-stack">
            <div class="foot-group"><span class="label">Runes</span><div class="runes" id="runes"></div></div>
            <div class="foot-group"><span class="label">Splinters</span><div class="splinters" id="splinters"></div></div>
          </div>
        </div>
        <p class="note doll-src" id="doll-src"></p>
      </div>
      <div class="loadout-lower"><div id="detail"></div><div class="stats-panel" id="stats"></div></div>
    </section>`;
    bind(root);
  }
  renderDoll(root, char, build);
  renderTalisman(root, build);
  renderDetail(root, char, build);
  renderStats(root, char, build);
}

function slotButton(id, char, build) {
  const g = char.gear[id];
  const r = rarityOf(g);
  const st = slotStatus(char, build, id);
  const guide = build.slots[id].item;
  const miss = g && !guide.match.test(`${g.name} ${g.aspect || ""} ${g.power || ""}`) ? `<span class="gd">Guide: ${esc(guide.name)}</span>` : "";
  const art = itemArt(g, id, build);
  return `<button class="dslot" data-pick="${id}" aria-pressed="${id === selected}">
    <span class="ico t-${r === "unknown" ? "unknown" : r}"><img class="art${g ? "" : " empty"}" src="${esc(art)}" alt=""><i class="pip ${st.done ? "done" : "todo"}" aria-hidden="true"></i></span>
    <span class="dtext"><span class="nm r-${r}">${esc(g?.name || SLOT[id].name)}</span><span class="ty">${g ? esc(typeLine(g, id)) : "Empty"}</span>${miss}</span>
  </button>`;
}

function renderDoll(root, char, build) {
  $("#doll-left", root).innerHTML = LEFT.map((id) => slotButton(id, char, build)).join("");
  $("#doll-right", root).innerHTML = RIGHT.map((id) => slotButton(id, char, build)).join("");
  $("#doll-src", root).textContent = `Talisman, runes and Splinters follow the ${build.guide.site} “${build.guide.variant}” variant, checked ${build.guide.checked}. Point at any of them for details.`;
}

const setCount = (t, k) => t.charms.filter((c) => c.set === k).length + (t.torch.set === k ? 1 : 0);

function renderTalisman(root, build) {
  const t = build.talisman;
  const pos = t.charms.map((_, i) => { const a = (Math.PI / 3) * i - Math.PI / 2; return [120 + 88 * Math.cos(a), 120 + 88 * Math.sin(a)]; });
  const pct = (v) => (v / 240 * 100).toFixed(2) + "%";
  $("#talisman", root).innerHTML = `<svg viewBox="0 0 240 240" aria-hidden="true">
      <circle cx="120" cy="120" r="88" fill="none" stroke="#7b5a26" stroke-width="3"/><circle cx="120" cy="120" r="44" fill="#140d0b" stroke="#a88a52" stroke-width="2"/>
      ${pos.map(([x, y]) => `<line x1="120" y1="120" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#4a3424" stroke-width="2"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="24" fill="#140d0b" stroke="#7b5a26" stroke-width="2"/>`).join("")}
    </svg>
    <button class="tal-socket seal" style="left:50%;top:50%" data-tip="seal"><img src="${esc(t.seal.art)}" alt="${esc(t.seal.name)}"></button>
    ${t.charms.map((c, i) => `<button class="tal-socket" style="left:${pct(pos[i][0])};top:${pct(pos[i][1])}" data-tip="charm:${i}"><img src="${esc(c.art)}" alt="${esc(c.name)}"></button>`).join("")}`;
  $("#charms", root).innerHTML = Object.entries(t.sets).map(([k, s]) => {
    const n = setCount(t, k), on = s.bonuses.filter(([p]) => n >= t.setNeed(p)).length;
    return `<li><i class="${k}"></i>${esc(s.name)} <span class="muted">${n} counted${t.torch.set === k ? " (with Torch)" : ""} · ${on} of ${s.bonuses.length} bonuses</span></li>`;
  }).join("");
  $("#runes", root).innerHTML = build.runes.map(({ pair, socket }) => `<div class="rune-pair" title="${esc(socket)}">${pair.map((r, i) => `${i ? `<span class="rune-link"></span>` : ""}<button class="rune" data-tip="rune:${r}"><img src="${esc(build.runeInfo[r].art)}" alt="">${r}</button>`).join("")}</div>`).join("");
  $("#splinters", root).innerHTML = build.splinters.map((s, i) => `<button class="splinter" data-tip="splinter:${i}"><img src="${esc(s.art)}" alt="">${esc(s.short)}</button>`).join("");
}

function setBody(t, k) {
  const s = t.sets[k], n = setCount(t, k);
  return `<div class="gt-set">${esc(s.name)} <span>(${n} counted)</span></div><ul class="gt-bonus">${s.bonuses.map(([p, txt]) => {
    const need = t.setNeed(p);
    return `<li class="${n >= need ? "on" : ""}"><b>(${p}${need !== p ? `, needs ${need}` : ""})</b> ${esc(txt)}</li>`;
  }).join("")}</ul>`;
}

function tipHtml(el) {
  const { char, build } = ctxNow;
  if (el.dataset.pick) {
    const id = el.dataset.pick, g = char.gear[id];
    if (!g) return tipCard({ name: SLOT[id].name, type: "Empty slot", r: "unknown", art: itemArt(null, id, build), body: `<p class="gt-next">Guide: ${esc(build.slots[id].item.name)}. Wants ${esc(wantedList(build.slots[id]))}.</p>` });
    const st = slotStatus(char, build, id);
    return itemTip(g, id, build, st.ev, { foot: st.steps.length ? `Next: ${esc(st.steps[0])}` : "Matches the guide." });
  }
  const t = build.talisman;
  const [kind, arg] = el.dataset.tip.split(":");
  if (kind === "seal") return tipCard({ name: t.seal.name, type: "Mythic Seal", r: "mythic", art: t.seal.art, power: esc(t.seal.text), body: Object.keys(t.sets).map((k) => setBody(t, k)).join("") });
  if (kind === "charm") {
    const c = t.charms[+arg];
    if (c.set === "torch") return tipCard({ name: c.name, type: "Mythic Charm", r: "mythic", art: c.art, lines: `<ul class="gt-aff">${t.torch.affixes.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>`, body: setBody(t, t.torch.set), foot: "We read the guide's Torch as rolling Flesh of Abaddon." });
    return tipCard({ name: c.name, type: "Set Charm", r: "set", art: c.art, body: setBody(t, c.set) });
  }
  if (kind === "rune") {
    const r = build.runeInfo[arg];
    return tipCard({ name: `${arg} Rune`, type: `${r.rarity[0].toUpperCase() + r.rarity.slice(1)} ${r.role} Rune`, r: r.rarity, art: r.art, power: esc(r.text), foot: build.runeNote });
  }
  if (kind === "splinter") {
    const s = build.splinters[+arg];
    return tipCard({ name: s.name, type: "Soul Splinter", r: "legendary", art: s.art, lines: `<ul class="gt-aff"><li>${esc(s.affix)}</li></ul>`, power: esc(s.text), foot: `Guide socket: ${esc(s.socket)}.${s.reserve ? ` Farm: Escalation Nightmare Dungeons, ${esc(s.reserve)} Reserve.` : ""}` });
  }
  return "";
}

async function renderDetail(root, char, build) {
  const box = $("#detail", root);
  const id = selected, g = char.gear[id], target = build.slots[id];
  const src = SOURCES[target.item.source];
  const want = `<div class="tt-sec"><span class="label">Guide for ${esc(SLOT[id].name)}</span>
    <p><b>${esc(target.item.name)}</b>${target.note ? ` · ${esc(target.note)}` : ""}</p>
    <p class="note">Affixes, in order: ${esc(wantedList(target))}. Temper: ${esc(target.tempers.map(([k, r]) => `${affixLabel(k)} from ${r}`).join(", "))}.${target.sockets ? ` Sockets: ${esc(target.sockets.join(" + "))}.` : ""}</p>
    ${src ? `<p class="note">Get it: ${esc(src.routes.find((r) => r.best)?.label || src.routes[0].label)} · <a href="#/farm" data-farm>full route</a></p>` : ""}</div>`;

  if (editing) {
    box.innerHTML = `<form class="tooltip slot-detail" id="edit-form">${itemFormHtml(g || { name: "", rarity: "legendary", affixes: [] }, { slotId: id, showSlot: false })}
      <div class="slot-actions"><button type="button" class="btn ghost" id="e-cancel">Cancel</button><button class="btn primary" type="submit">Save ${esc(SLOT[id].name)}</button></div></form>`;
    bindItemForm($("#edit-form", box));
    return;
  }
  if (!g) {
    box.innerHTML = `<div class="tooltip slot-detail">${tipCard({ name: SLOT[id].name, type: "Empty slot", r: "unknown", art: itemArt(null, id, build) })}${want}
      <div class="slot-actions"><button class="btn" data-act="edit">Enter by hand</button><button class="btn primary" data-act="check">Add from screenshot</button></div></div>`;
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
  const st = char.stats || {};
  const fmt = (s, n) => s.unit === "%" ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) + "%" : n.toLocaleString();
  $("#stats", root).innerHTML = `<div class="stats-head"><h3>Stat targets</h3><div class="row"><span class="note">${st.updated ? `Updated ${esc(new Date(st.updated).toLocaleDateString())}` : ""}</span>
    <button class="btn ghost" id="stats-edit">${editingStats ? "Save numbers" : "Update numbers"}</button></div></div>
    <div class="stat-grid">${build.stats.map((s) => {
      const v = st[s.key], has = typeof v === "number" && isFinite(v);
      const pct = has ? Math.min(100, (v / s.target) * 100) : 0;
      const cls = !has ? "" : v >= s.target ? "ok" : v >= s.target * 0.6 ? "low" : "bad";
      const val = editingStats ? `<input id="stat-${s.key}" inputmode="decimal" value="${has ? v : ""}" aria-label="${esc(s.name)}">` : `<span class="stat-val">${has ? fmt(s, v) : "—"}</span>`;
      return `<div class="stat"><div class="stat-top"><span class="stat-name">${esc(s.name)}</span>${val}</div><div class="meter ${cls}"><i style="width:${pct}%"></i></div><span class="stat-target">Target ${fmt(s, s.target)} · ${s.src === "Maxroll" ? "Maxroll" : "our floor"}</span></div>`;
    }).join("")}</div>
    ${typeof st.toughness === "number" ? `<p class="note">Toughness ${st.toughness.toLocaleString()}</p>` : ""}
    <p class="note">Copy these from the character sheet. Resistance floors other than Maxroll's are levels we settled on for Mephisto and Baal.</p>`;
}

function bind(root) {
  hover = hoverCards(root, "[data-pick], [data-tip]", (el) => tipHtml(el));
  root.addEventListener("click", (e) => {
    const { char, build, go } = ctxNow;
    const pick = e.target.closest("[data-pick]");
    if (pick) { selected = pick.dataset.pick; editing = false; hover.hide(); render(root, ctxNow); return; }
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
    if (e.target.id !== "edit-form") return;
    e.preventDefault();
    const { char } = ctxNow;
    const prev = char.gear[selected] || {};
    const item = readItemForm(e.target, prev);
    delete item.slot;
    editing = false;
    store.setGear(char.id, selected, { ...item, updated: new Date().toISOString() });
  });
}

import { $, esc, tipCard, tipFromText, rarityOf, hoverCards } from "../lib/dom.js";
import { store, shots } from "../lib/store.js";
import { SLOT, LEFT, RIGHT } from "../data/slots.js";
import { SOURCES } from "../data/sources.js";
import { CLASS_ART } from "../data/classes.js";
import { affixLabel } from "../data/affixes.js";
import { slotStatus } from "../evaluate.js";
import { itemArt, itemTip, typeLine, wantedList } from "../lib/itemview.js";
import { itemFormHtml, bindItemForm, readItemForm } from "../lib/itemform.js";
import { setPreset } from "./check.js";

let selected = "gloves";
let editing = false;
let editingStats = false;
let hover = null;
let ctxNow = null;

const splintersOf = (build) => {
  const out = [];
  for (const [sid, s] of Object.entries(build.slots)) for (const name of s.sockets || []) if (/^splinter/i.test(name)) out.push({ name, slot: SLOT[sid].name, art: s.socketArt?.[name] || "" });
  return out;
};

export function render(root, ctx) {
  ctxNow = ctx;
  const { char, build } = ctx;
  if (!root.querySelector(".doll-wrap")) {
    root.innerHTML = `<section class="view">
      <div class="view-head"><h2>Loadout</h2><p>Pick a slot to see its rolls marked against the guide and what to do next. A gold diamond means the slot matches the guide with nothing left to fix; an ember one means it still has steps.</p></div>
      <div class="doll-wrap">
        <div class="doll"><div class="doll-col left" id="doll-left"></div><div class="doll-figure" id="doll-figure"></div><div class="doll-col right" id="doll-right"></div></div>
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
  const art = CLASS_ART[build.className];
  $("#doll-figure", root).innerHTML = art ? `<img class="portrait" src="${esc(art.portrait)}" alt=""><img class="crest" src="${esc(art.crest)}" alt=""><span class="art-credit">${esc(art.credit)}</span>` : "";
  renderDoll(root, char, build);
  renderTalisman(root, build);
  renderDetail(root, char, build);
  renderStats(root, char, build);
}

function slotButton(id, char, build) {
  const g = char.gear[id];
  const r = rarityOf(g);
  const st = slotStatus(char, build, id);
  const guide = build.slots[id]?.item;
  const miss = g && guide && !guide.match.test(`${g.name} ${g.aspect || ""} ${g.power || ""}`) ? `<span class="gd">Guide: ${esc(guide.name)}</span>` : "";
  const art = itemArt(g, id, build);
  return `<button class="dslot" data-pick="${id}" aria-pressed="${id === selected}">
    <span class="ico t-${r === "unknown" ? "unknown" : r}"><img class="art${g ? "" : " empty"}" src="${esc(art)}" alt=""><i class="pip ${st.done ? "done" : "todo"}" aria-hidden="true"></i></span>
    <span class="dtext"><span class="nm r-${r}">${esc(g?.name || SLOT[id].name)}</span><span class="ty">${g ? esc(typeLine(g, id)) : "Empty"}</span>${miss}</span>
  </button>`;
}

function renderDoll(root, char, build) {
  $("#doll-left", root).innerHTML = LEFT.map((id) => slotButton(id, char, build)).join("");
  $("#doll-right", root).innerHTML = RIGHT.map((id) => slotButton(id, char, build)).join("");
  $("#doll-src", root).textContent = `Talisman, runes and Splinters follow ${build.guide.site} “${build.name}: ${build.variant}”. Point at any of them for details.`;
}

// Talisman: the seal in the middle, six charms around it at the in-game positions.
const CHARM_POS = [[30, 15], [70, 15], [11, 50], [89, 50], [30, 85], [70, 85]];

function renderTalisman(root, build) {
  const t = build.talisman || { charms: [] };
  const sockets = CHARM_POS.map(([x, y], i) => {
    const c = t.charms[i];
    return `<span class="tal-ring" style="left:${x}%;top:${y}%"></span>${c ? `<button class="tal-socket${c.mythic ? " mythic" : c.unique ? " unique" : c.set ? " set" : ""}" style="left:${x}%;top:${y}%" data-tip="charm:${i}" aria-label="${esc(c.name)}"><img src="${esc(c.art)}" alt=""></button>` : ""}`;
  }).join("");
  $("#talisman", root).innerHTML = `<span class="tal-ring seal-ring" style="left:50%;top:50%"></span>
    ${t.seal ? `<button class="tal-socket seal" style="left:50%;top:50%" data-tip="seal" aria-label="${esc(t.seal.name)}"><img src="${esc(t.seal.art)}" alt=""></button>` : ""}${sockets}`;
  const sets = new Map();
  for (const c of t.charms) if (c.set) sets.set(c.set, (sets.get(c.set) || 0) + 1);
  $("#charms", root).innerHTML = [...sets].map(([name, n]) => `<li><i></i>${esc(name)} <span class="muted">${n} charm${n > 1 ? "s" : ""}</span></li>`).join("")
    + t.charms.filter((c) => c.mythic || c.unique).map((c) => `<li class="r-${c.mythic ? "mythic" : "unique"}"><i class="m"></i>${esc(c.name)}</li>`).join("")
    + (t.seal ? `<li class="r-mythic"><i class="m"></i>${esc(t.seal.name)}</li>` : "");
  $("#runes", root).innerHTML = (build.runes || []).map((r, i) => `<button class="rune" data-tip="rune:${i}"><img src="${esc(r.art)}" alt="">${esc(r.name)}</button>`).join("") || `<span class="note">None</span>`;
  const spl = splintersOf(build);
  $("#splinters", root).innerHTML = spl.map((s, i) => `<button class="splinter" data-tip="splinter:${i}"><img src="${esc(s.art)}" alt="">${esc(s.name.replace(/^Splinter of (the )?/i, ""))}</button>`).join("") || `<span class="note">None</span>`;
}

function tipHtml(el) {
  const { char, build, cls } = ctxNow;
  if (el.dataset.pick) {
    const id = el.dataset.pick, g = char.gear[id], target = build.slots[id];
    if (!g) return target ? tipFromText(target.item.tip, { name: target.item.name, art: target.item.art, foot: `Guide item for ${SLOT[id].name}. You have nothing recorded here.` }) : "";
    const st = slotStatus(char, build, id);
    return itemTip(g, id, build, st.ev, { foot: st.steps.length ? `Next: ${esc(st.steps[0])}` : "Matches the guide." });
  }
  const t = build.talisman;
  const [kind, arg] = el.dataset.tip.split(":");
  if (kind === "seal") return tipFromText(t.seal.tip, { name: t.seal.name, art: t.seal.art, r: "mythic" });
  if (kind === "charm") { const c = t.charms[+arg]; return tipFromText(c.tip, { name: c.name, art: c.art, r: c.mythic ? "mythic" : c.set ? "set" : undefined }); }
  if (kind === "rune") { const r = build.runes[+arg]; return tipFromText(r.tip, { name: r.name, art: r.art }); }
  if (kind === "splinter") {
    const s = splintersOf(build)[+arg];
    return tipFromText(cls?.tips?.[s.name] || "", { name: s.name, art: s.art, r: "legendary", foot: `Guide socket: ${esc(s.slot)}. Farm: Escalation Nightmare Dungeons with the matching gem Reserve.` });
  }
  return "";
}

async function renderDetail(root, char, build) {
  const box = $("#detail", root);
  const id = selected, g = char.gear[id], target = build.slots[id];
  if (!target) { box.innerHTML = `<div class="tooltip slot-detail"><p class="note">This guide doesn't list ${esc(SLOT[id].name)}.</p></div>`; return; }
  const src = SOURCES[target.item.source];
  const want = `<div class="tt-sec"><span class="label">Guide for ${esc(SLOT[id].name)}</span>
    <p><b>${esc(target.item.name)}</b>${target.note ? ` · ${esc(target.note)}` : ""}</p>
    <p class="note">Affixes, in order: ${esc(wantedList(target)) || "not listed"}. Temper: ${esc(target.tempers.map(([k, r]) => `${affixLabel(k)} from ${r}`).join(", ")) || "not listed"}.${target.sockets?.length ? ` Sockets: ${esc(target.sockets.join(" + "))}.` : ""}</p>
    <p class="note">Get it: ${src ? esc(src.routes.find((r) => r.best)?.label || src.routes[0].label) : "see the farm guide"} · <a href="#/farm">full route</a></p></div>`;

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

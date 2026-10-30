// Item check: paste or drop a tooltip screenshot, read it, then say whether it's an upgrade for the active
// character and which lines to reroll, temper or fix. Equipping saves it (and the screenshot) to the loadout.
import { $, esc, tipCard } from "../lib/dom.js";
import { store, shots } from "../lib/store.js";
import { SLOT } from "../data/slots.js";
import { recognize } from "../recognize/index.js";
import { evaluate, resolveSlot } from "../evaluate.js";
import { itemTip, itemArt } from "../lib/itemview.js";
import { itemFormHtml, bindItemForm, readItemForm } from "../lib/itemform.js";

const S = { blob: null, url: null, item: null, slotId: null, preset: null, status: "", error: false, busy: false, saved: false, run: 0 };
let ctxNow = null;
let rootNow = null;

export function setPreset(slotId) { S.preset = slotId; }

export function setImage(blob) {
  if (S.url) URL.revokeObjectURL(S.url);
  Object.assign(S, { blob, url: URL.createObjectURL(blob), item: null, slotId: null, status: "Reading the tooltip…", error: false, saved: false });
  read();
}

async function read(engineOverride) {
  const run = ++S.run;
  S.busy = true;
  paint();
  const settings = { ...store.settings(), ...(engineOverride ? { engine: engineOverride } : {}) };
  try {
    const item = await recognize(S.blob, settings, (msg) => { if (run === S.run) { S.status = msg; paintStatus(); } });
    if (run !== S.run) return;
    if (!item.name && !item.affixes.length) throw new Error("No item tooltip found in that image. Crop closer to the tooltip, or enter it by hand below.");
    S.item = item;
    const { char, build } = ctxNow;
    S.slotId = S.preset && (!item.slot || SLOT[S.preset].kind === SLOT[item.slot]?.kind || item.slot === "ring") ? S.preset : resolveSlot(item, char, build) || S.preset || "helm";
    S.status = item.engine === "claude"
      ? `Read by Claude. Check the lines below before you equip it.`
      : `Read by free OCR${item.warning ? ` (Claude failed: ${item.warning})` : ""}. OCR can't see Greater Affix stars or temper icons, so tick those yourself.`;
    S.error = false;
  } catch (err) {
    if (run !== S.run) return;
    S.status = err.message || String(err);
    S.error = true;
    S.item = S.item || { name: "", rarity: "legendary", affixes: [], sockets: [] };
    S.slotId = S.slotId || S.preset || "helm";
  } finally {
    if (run === S.run) { S.busy = false; paint(); }
  }
}

export function render(root, ctx) {
  ctxNow = ctx;
  rootNow = root;
  if (!root.dataset.ready) {
    root.dataset.ready = "1";
    root.innerHTML = `<section class="view">
      <div class="view-head"><h2>Item check</h2><p>Paste a tooltip screenshot (<kbd>Ctrl</kbd>+<kbd>V</kbd>) anywhere on the site, or drop it here. You'll see whether it's worth equipping on the active character, which affixes are wrong and what to reroll or temper. Nothing is saved until you press Equip.</p></div>
      <div class="check-grid">
        <div class="panel" id="c-left">
          <div class="drop" id="c-drop" tabindex="0" role="button" aria-label="Add a tooltip screenshot">
            <span id="c-drop-text">Paste (Ctrl+V), drop an image here, or click to pick a file</span>
            <img id="c-preview" class="check-shot" alt="Tooltip screenshot" hidden>
          </div>
          <input type="file" id="c-file" accept="image/*" hidden>
          <p class="status-line" id="c-status" aria-live="polite"></p>
          <div class="row" id="c-engine"></div>
          <form id="c-form"></form>
        </div>
        <div class="panel" id="c-right"></div>
      </div>
    </section>`;
    bind(root);
  }
  paint();
}

function paintStatus() {
  if (!rootNow) return;
  const el = $("#c-status", rootNow);
  el.textContent = S.status;
  el.classList.toggle("err", S.error);
}

function paint() {
  if (!rootNow || !ctxNow) return;
  const root = rootNow;
  const { char, build } = ctxNow;
  const img = $("#c-preview", root);
  img.hidden = !S.url;
  if (S.url && img.src !== S.url) img.src = S.url;
  $("#c-drop-text", root).textContent = S.url ? "Paste or drop another screenshot to replace it" : "Paste (Ctrl+V), drop an image here, or click to pick a file";
  $("#c-drop", root).classList.toggle("small", !!S.url);
  paintStatus();

  const settings = store.settings();
  const engineBtns = [];
  if (S.blob && !S.busy) {
    if (settings.apiKey && S.item?.engine !== "claude") engineBtns.push(`<button class="btn ghost" data-reread="claude">Read with Claude</button>`);
    if (S.item?.engine !== "ocr") engineBtns.push(`<button class="btn ghost" data-reread="ocr">Read with free OCR</button>`);
  }
  if (!settings.apiKey) engineBtns.push(`<span class="note">Using free OCR. Add an Anthropic API key in <a href="#/characters">Settings</a> for much better reading.</span>`);
  $("#c-engine", root).innerHTML = engineBtns.join("");

  const form = $("#c-form", root);
  if (S.item && !S.busy) {
    if (form.dataset.for !== String(S.run)) {
      form.dataset.for = String(S.run);
      form.innerHTML = `<h3>What was read</h3>${itemFormHtml(S.item, { slotId: S.slotId })}`;
    }
  } else if (!S.item) {
    form.innerHTML = S.busy ? "" : `<p class="note">No screenshot yet. You can also <button type="button" class="btn ghost" id="c-manual">type an item in</button>.</p>`;
    form.dataset.for = "";
  }
  paintVerdict(char, build);
}

function paintVerdict(char, build) {
  const box = $("#c-right", rootNow);
  if (!S.item || S.busy) {
    box.innerHTML = `<h3>Verdict</h3><div class="answer idle">${S.busy ? "Reading…" : `Example: a Wendigo Brand with Willpower, Maximum Life, Vulnerable Damage and Movement Speed. The check would say equip it (it's the guide's ring), enchant Movement Speed into Critical Strike Damage, temper Resource Generation, and socket the Damnation Splinter.`}</div>`;
    return;
  }
  const slotId = S.slotId;
  const ev = evaluate(S.item, slotId, char, build);
  const cur = char.gear[slotId];
  const label = { equip: "Equip it", build: "Worth building up", sidegrade: "Side-grade", salvage: "Salvage" }[ev.verdict];
  const actions = ev.actions.length ? `<ol class="steps">${ev.actions.map((a) => `<li class="k-${a.type}">${esc(a.text)}</li>`).join("")}</ol>` : `<p class="note">Nothing to fix.</p>`;
  const curTip = cur ? itemTip(cur, slotId, build, evaluate(cur, slotId, { ...char, gear: { ...char.gear, [slotId]: null } }, build))
    : tipCard({ name: SLOT[slotId].name, type: "Empty slot", r: "unknown", art: itemArt(null, slotId, build) });
  box.innerHTML = `<div class="verdict-card">
    <div class="verdict-head"><span class="badge ${ev.verdict}">${label}</span><span class="verdict-title">${esc(ev.headline)}</span></div>
    <p class="scores">Score ${ev.score} vs your ${ev.currentScore} · ${ev.potential} once fixed · for ${esc(char.name)}, ${esc(SLOT[slotId].name)}</p>
    ${itemTip(S.item, slotId, build, ev, { why: true })}
    <div><span class="label">What to do with it</span>${actions}</div>
    ${ev.notes.length ? `<ul class="note">${ev.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}
    <details><summary class="label">Compare with what you wear now</summary>${curTip}</details>
    <div class="row">
      <button class="btn primary" id="c-equip"${S.saved ? " disabled" : ""}>${S.saved ? "Equipped" : `Equip as ${esc(SLOT[slotId].name)}`}</button>
      <button class="btn ghost" id="c-clear">Clear</button>
      <span class="note" id="c-saved">${S.saved ? `Saved to ${esc(char.name)}'s ${esc(SLOT[slotId].name)}.` : ""}</span>
    </div>
  </div>`;
}

let typing = 0;
function bind(root) {
  const pick = () => $("#c-file", root).click();
  $("#c-drop", root).addEventListener("click", pick);
  $("#c-drop", root).addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
  $("#c-file", root).addEventListener("change", (e) => { const f = e.target.files?.[0]; if (f) setImage(f); e.target.value = ""; });

  const form = $("#c-form", root);
  bindItemForm(form, () => {
    clearTimeout(typing);
    typing = setTimeout(() => {
      if (!S.item) return;
      S.item = readItemForm(form, S.item);
      S.slotId = S.item.slot || S.slotId;
      S.saved = false;
      paintVerdict(ctxNow.char, ctxNow.build);
    }, 200);
  });

  root.addEventListener("click", async (e) => {
    const re = e.target.closest("[data-reread]");
    if (re) read(re.dataset.reread);
    if (e.target.closest("#c-manual")) {
      S.item = { name: "", rarity: "legendary", affixes: [], sockets: [] };
      S.slotId = S.preset || "helm";
      S.run++;
      paint();
    }
    if (e.target.closest("#c-clear")) {
      if (S.url) URL.revokeObjectURL(S.url);
      Object.assign(S, { blob: null, url: null, item: null, slotId: null, status: "", error: false, saved: false, preset: null });
      S.run++;
      paint();
    }
    if (e.target.closest("#c-equip")) {
      const { char } = ctxNow;
      const item = readItemForm(form, S.item);
      const slotId = item.slot || S.slotId;
      delete item.slot; delete item.rawText; delete item.usage; delete item.warning;
      const shot = S.blob ? await shots.put(S.blob) : null;
      S.saved = true;
      store.setGear(char.id, slotId, { ...item, shot, updated: new Date().toISOString() });
    }
  });
}

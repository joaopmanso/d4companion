// Characters (each has a class and follows one guide) and settings: screenshot reader, API key, backup.
// New characters start in the guide browser: pick a class, browse its tier list, choose a variant, name it.
import { $, esc } from "../lib/dom.js";
import { store } from "../lib/store.js";
import { MODELS } from "../recognize/models.js";
import { emblem } from "../data/classes.js";
import { pickerHtml } from "./guidepicker.js";


let creating = false;
const draft = { className: "Warlock", open: undefined, guideId: null };
export function startNew() { creating = true; }

const guideOf = (index, id) => index?.guides.find((x) => x.id === id);
const guideName = (index, id) => { const g = guideOf(index, id); return g ? `${g.short || g.build}: ${g.variant}` : "Guide not synced"; };

// The create-a-character panel, shared by the welcome screen and the Characters page.
function newCharacterHtml(index, cancellable) {
  const chosen = guideOf(index, draft.guideId);
  return `<div class="panel new-char">
    <h3>New character</h3>
    <p class="note">Choose a class, then a build from this Season's tier list, then the variant you'll follow. You can change the guide later.</p>
    ${pickerHtml({ index, className: draft.className, currentId: draft.guideId, open: draft.open })}
    <form class="new-char-form" id="nc-form">
      ${chosen ? `<p class="chosen"><img src="${esc(emblem(chosen.className))}" alt=""> <span><b>${esc(chosen.short || chosen.build)}</b>: ${esc(chosen.variant)}<br><span class="note">${esc(chosen.className)}${chosen.tier ? ` · tier ${esc(chosen.tier)}` : ""}</span></span></p>` : `<p class="note">No build chosen yet.</p>`}
      <div class="field"><label class="label" for="nc-name">Character name</label><input id="nc-name" required placeholder="e.g. My ${esc(draft.className)}"></div>
      <div class="row"><button class="btn primary" type="submit"${chosen ? "" : " disabled"}>Create character</button>${cancellable ? `<button class="btn ghost" type="button" id="nc-cancel">Cancel</button>` : ""}</div>
    </form>
  </div>`;
}

function bindNew(root, rerender) {
  root.addEventListener("click", (e) => {
    const c = e.target.closest("[data-class]");
    if (c && root.contains(c)) { draft.className = c.dataset.class; draft.open = undefined; draft.guideId = null; rerender(); return; }
    const b = e.target.closest("[data-build]");
    if (b) { draft.open = draft.open === b.dataset.build ? "" : b.dataset.build; rerender(); return; }
    const g = e.target.closest("[data-guide]");
    if (g) { draft.guideId = g.dataset.guide; rerender(); $("#nc-name", root)?.focus(); }
  });
  root.addEventListener("submit", (e) => {
    if (e.target.id !== "nc-form") return;
    e.preventDefault();
    const g = guideOf(lastCtx.index, draft.guideId);
    if (!g) return;
    creating = false;
    const name = $("#nc-name", root).value.trim() || `My ${g.className}`;
    draft.guideId = null;
    store.addCharacter({ name, buildId: g.id, className: g.className });
  });
}

// First visit in this browser: nothing is stored yet, so offer a new character or a backup.
let welcomeBound = false;
export function renderWelcome(root, ctx) {
  lastCtx = { ...lastCtx, ...ctx };
  root.innerHTML = `<section class="view">
    <div class="view-head"><h2>Welcome</h2><p>This site keeps everything in your browser only. There are no accounts and nothing is uploaded, so another computer or browser starts empty. Create a character, or import a backup you exported elsewhere.</p></div>
    ${newCharacterHtml(ctx.index, false)}
    <div class="panel">
      <h3>Import a backup</h3>
      <p class="note">Use a file from <b>Export backup</b> on another device.</p>
      <div class="row"><button class="btn" id="w-import" type="button">Choose backup file</button><input type="file" id="w-file" accept="application/json,.json" hidden><span class="note" id="w-note"></span></div>
    </div>
  </section>`;
  if (welcomeBound) return;
  welcomeBound = true;
  bindNew(root, () => renderWelcome(root, lastCtx));
  root.addEventListener("click", (e) => { if (e.target.closest("#w-import")) $("#w-file", root).click(); });
  root.addEventListener("change", async (e) => {
    if (e.target.id !== "w-file" || !e.target.files?.[0]) return;
    try { await store.importAll(await e.target.files[0].text()); } catch (err) { $("#w-note", root).textContent = err.message; }
  });
}

let lastCtx = {};
let bound = false;
export function render(root, ctx = lastCtx) {
  lastCtx = ctx;
  const { index } = ctx;
  const s = store.get();
  const set = s.settings;
  root.innerHTML = `<section class="view">
    <div class="view-head"><h2>Characters</h2><p>Each character has a class, follows one guide and keeps its own gear, talisman and stats. Switch the active one from the menu at the top.</p></div>
    <div class="panel">
      <div class="char-list">${s.characters.map((c) => `<div class="char-row${c.id === s.activeId ? " active" : ""}">
        <img class="char-emblem" src="${esc(emblem(c.className || guideOf(index, c.buildId)?.className || "Warlock"))}" alt="">
        <span class="nm">${esc(c.name)}</span>
        <span class="note">${esc(guideName(index, c.buildId))} · ${Object.values(c.gear || {}).filter(Boolean).length} items</span>
        ${c.id === s.activeId ? `<span class="tag take">Active</span>` : `<button class="btn ghost" data-use="${esc(c.id)}">Make active</button>`}
        <button class="btn ghost" data-rename="${esc(c.id)}">Rename</button>
        <button class="btn ghost" data-del="${esc(c.id)}">Delete</button>
      </div>`).join("") || `<p class="note">No characters yet.</p>`}</div>
      ${creating ? "" : `<div class="row"><button class="btn" id="add-char">New character</button></div>`}
    </div>
    ${creating ? newCharacterHtml(index, true) : ""}

    <div class="view-head"><h2>Screenshot reading</h2></div>
    <div class="panel">
      <label class="radio"><input type="radio" name="engine" value="auto"${set.engine !== "ocr" ? " checked" : ""}> <span><b>Claude when a key is set, free OCR otherwise</b><br><span class="note">Claude reads Greater Affix stars, temper icons and odd fonts reliably.</span></span></label>
      <label class="radio"><input type="radio" name="engine" value="ocr"${set.engine === "ocr" ? " checked" : ""}> <span><b>Always free OCR</b><br><span class="note">Tesseract runs in your browser. No key and no cost, but check the lines it reads.</span></span></label>
      <div class="form-grid">
        <div class="field"><label class="label" for="api-key">Anthropic API key</label><input id="api-key" type="password" autocomplete="off" spellcheck="false" placeholder="${set.apiKey ? "Saved. Paste a new one to replace it." : "sk-ant-…"}"></div>
        <div class="field"><label class="label" for="model">Model</label><select id="model">${MODELS.map((m) => `<option value="${m.id}"${(set.model || "claude-opus-5-5") === m.id ? " selected" : ""}>${esc(m.label)}</option>`).join("")}</select></div>
      </div>
      <div class="row"><button class="btn primary" id="save-key">Save key</button>${set.apiKey ? `<button class="btn ghost" id="forget-key">Forget key</button><span class="note">A key is saved in this browser.</span>` : ""}</div>
      <p class="warnbox">The key is stored only in this browser's local storage and is sent only to api.anthropic.com. Anyone using this browser profile could read it, so use a key with a spending limit. Each Opus check costs a few cents; Sonnet and Haiku cost less. Get a key at <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a>.</p>
    </div>

    <div class="view-head"><h2>Backup</h2></div>
    <div class="panel">
      <p>Everything is saved in this browser only. Export a backup to move your characters to another PC or phone, then import it there. The API key is never exported.</p>
      <div class="row"><button class="btn" id="export">Export backup</button><button class="btn ghost" id="import">Import backup</button><input type="file" id="import-file" accept="application/json,.json" hidden><span class="note" id="backup-note"></span></div>
    </div>
  </section>`;
  if (bound) return;
  bound = true;
  bindNew(root, () => render(root));

  root.addEventListener("click", async (e) => {
    const t = e.target;
    const s2 = store.get();
    if (t.closest("#add-char")) { creating = true; render(root); }
    if (t.closest("#nc-cancel")) { creating = false; render(root); }
    const use = t.closest("[data-use]")?.dataset.use; if (use) store.setActive(use);
    const ren = t.closest("[data-rename]")?.dataset.rename;
    if (ren) { const c = s2.characters.find((x) => x.id === ren); const n = prompt("New name", c.name); if (n?.trim()) store.updateCharacter(ren, { name: n.trim() }); }
    const del = t.closest("[data-del]")?.dataset.del;
    if (del) { const c = s2.characters.find((x) => x.id === del); if (confirm(`Delete ${c.name} and its saved gear? This can't be undone unless you have a backup.`)) store.removeCharacter(del); }
    if (t.closest("#save-key")) {
      const key = $("#api-key", root).value.trim();
      store.setSettings({ ...(key ? { apiKey: key } : {}), model: $("#model", root).value });
    }
    if (t.closest("#forget-key")) store.setSettings({ apiKey: "" });
    if (t.closest("#export")) {
      const blob = new Blob([await store.exportAll()], { type: "application/json" });
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `d4companion-${new Date().toISOString().slice(0, 10)}.json` });
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }
    if (t.closest("#import")) $("#import-file", root).click();
  });
  root.addEventListener("change", async (e) => {
    if (e.target.name === "engine") store.setSettings({ engine: e.target.value });
    if (e.target.id === "model") store.setSettings({ model: e.target.value });
    if (e.target.id === "import-file" && e.target.files?.[0]) {
      try {
        if (!confirm("Importing replaces the characters saved in this browser. Continue?")) return;
        await store.importAll(await e.target.files[0].text());
      } catch (err) { $("#backup-note", root).textContent = err.message; }
    }
  });
}


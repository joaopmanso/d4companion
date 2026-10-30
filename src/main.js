import "./styles.css";
import "./app.css";
import { $, esc } from "./lib/dom.js";
import { store } from "./lib/store.js";
import { loadIndex, loadGuide, loadClass, DEFAULT_GUIDE } from "./data/guides.js";
import { initTheme } from "./lib/theme.js";
import { watchArt } from "./data/cdn.js";
import { readShared } from "./lib/share.js";
import * as loadout from "./views/loadout.js";
import * as check from "./views/check.js";
import * as skills from "./views/skills.js";
import * as paragon from "./views/paragon.js";
import * as farm from "./views/farm.js";
import * as hordes from "./views/hordes.js";
import * as warplans from "./views/warplans.js";
import * as strongroom from "./views/strongroom.js";
import * as guides from "./views/guides.js";
import * as characters from "./views/characters.js";
import { openGuideDialog } from "./views/guidepicker.js";

const VIEWS = [
  ["loadout", "Loadout", loadout],
  ["check", "Item check", check],
  ["skills", "Skill tree", skills],
  ["paragon", "Paragon", paragon],
  ["farm", "Farm guide", farm],
  ["hordes", "Hordes", hordes],
  ["warplans", "War Plans", warplans],
  ["strongroom", "Strongrooms", strongroom],
  ["guides", "Sources", guides],
  ["characters", "Characters", characters],
];
const VIEW = Object.fromEntries(VIEWS.map(([id, , mod]) => [id, mod]));
const NEEDS_CHAR = new Set(["loadout", "check", "farm"]);

$("#tabs").innerHTML = VIEWS.map(([id, label]) => `<button class="tab" role="tab" data-view="${id}" id="tab-${id}">${label}</button>`).join("");
initTheme($("#theme-toggle"));
watchArt();

let index = { guides: [], links: [], classes: [], tiers: [] };
let current = null;
let loaded = { id: null, build: null, cls: null };

// Share links look like #/s/<packed character>/<view>. While one is open, that character is shown
// read-only in place of the user's own, and nothing is saved.
const SHARE_VIEWS = new Set(["loadout", "skills", "paragon"]);
let shared = { payload: null, char: null };
const sharePayload = () => (location.hash.startsWith("#/s/") ? location.hash.split("/")[2] : null);
const viewFromHash = () => {
  const parts = location.hash.replace(/^#\/?/, "").split("/");
  const id = parts[0] === "s" ? parts[2] : parts[0];
  return VIEW[id] && (!sharePayload() || SHARE_VIEWS.has(id)) ? id : "loadout";
};
const currentChar = () => shared.char || store.active();
const activeGuideId = () => currentChar()?.buildId || DEFAULT_GUIDE;

async function ensureBuild() {
  const id = activeGuideId();
  if (loaded.id === id && loaded.build) return;
  const build = await loadGuide(id);
  const cls = await loadClass(build.className).catch(() => null);
  build.catalog = cls?.catalog || {};
  loaded = { id, build, cls };
}

// Characters saved before classes existed get theirs from the guide they follow.
function migrate() {
  for (const c of store.get().characters) {
    if (c.className) continue;
    const g = index.guides.find((x) => x.id === c.buildId) || (c.buildId === "blazing-scream-warlock" ? { className: "Warlock" } : null);
    if (g) store.updateCharacter(c.id, { className: g.className });
  }
}

function renderHeader() {
  const s = store.get();
  const c = currentChar();
  $("#share-banner").innerHTML = shared.char ? `<span>Viewing <b>${esc(shared.char.name)}</b>, a shared ${esc(shared.char.className || "")} character. Read-only: nothing here is saved.</span>
    <button class="btn" id="share-save" type="button">Save a copy</button><a class="btn ghost" href="#/loadout">Back to my characters</a>` : "";
  $("#share-banner").hidden = !shared.char;
  $("#char-pick").innerHTML = (s.characters.length ? s.characters.map((x) => `<option value="${esc(x.id)}"${x.id === c?.id ? " selected" : ""}>${esc(x.name)}</option>`).join("") : `<option value="">No character yet</option>`)
    + `<option value="__new">+ New character…</option>`;
  const b = loaded.build;
  const entry = index.guides.find((g) => g.id === b?.id);
  $("#guide-pick").innerHTML = c && b
    ? `${entry?.icon ? `<img src="${esc(entry.icon)}" alt="">` : ""}<span><b>${esc(entry?.short || b.name)}</b> · ${esc(b.variant)}${entry?.tier ? ` <i class="tier-chip t-${esc(entry.tier)}">${esc(entry.tier)}</i>` : ""}</span><span class="change">Change</span>`
    : `<span>Create a character to pick a guide</span><span class="change">Start</span>`;
  $("#build-line").innerHTML = c && b ? `<a href="${esc(b.guide.url)}" target="_blank" rel="noopener">Open on ${esc(b.guide.site)}</a> · guide updated ${esc(b.guide.updated || "?")} · guides checked daily, last change ${esc(index.updated ? new Date(index.updated).toLocaleDateString() : "?")}` : "";
  $("#season-line").textContent = c && b ? `Diablo IV · Season ${b.season} · ${c.className || b.className}` : "Diablo IV · Season 15";
}

async function render() {
  try {
    const payload = sharePayload();
    if (payload !== shared.payload) shared = { payload, char: payload ? await readShared(payload) : null };
    document.body.classList.toggle("read-only", !!shared.char);
    await ensureBuild();
  } catch (err) {
    $("#main").innerHTML = `<p class="warnbox">Couldn't load the guide data: ${esc(err.message)}</p>`;
    return;
  }
  renderHeader();
  const id = viewFromHash();
  for (const t of document.querySelectorAll(".tab")) t.setAttribute("aria-selected", String(t.dataset.view === id));
  // Each view keeps its own container (and listeners) for the life of the page; only one is shown.
  const char = currentChar();
  const welcome = !char && NEEDS_CHAR.has(id);
  const main = $("#main");
  const rootId = welcome ? "welcome" : id;
  let box = main.querySelector(`[data-root="${rootId}"]`);
  if (!box) { box = document.createElement("div"); box.dataset.root = rootId; main.appendChild(box); }
  for (const el of main.children) el.hidden = el !== box;
  if (current !== id) { current = id; scrollTo({ top: 0 }); }
  if (welcome) characters.renderWelcome(box, { index });
  else VIEW[id].render(box, { char, build: loaded.build, cls: loaded.cls, index, go, readOnly: !!shared.char });
}

export function go(id) {
  const target = shared.payload ? `#/s/${shared.payload}/${id}` : `#/${id}`;
  if (location.hash !== target) location.hash = target;
  else render();
}

$("#tabs").addEventListener("click", (e) => { const t = e.target.closest(".tab"); if (t) go(t.dataset.view); });
addEventListener("hashchange", render);
$("#char-pick").addEventListener("change", (e) => {
  if (e.target.value === "__new") { characters.startNew(); go("characters"); return; }
  if (e.target.value) store.setActive(e.target.value);
});
// Change the guide the active character follows: the browser shows only that character's class.
$("#guide-pick").addEventListener("click", async () => {
  const c = store.active();
  if (!c) { characters.startNew(); go(store.get().characters.length ? "characters" : "loadout"); return; }
  const id = await openGuideDialog({ index, className: c.className || loaded.build.className, currentId: c.buildId });
  if (id && id !== c.buildId) store.updateCharacter(c.id, { buildId: id });
});$("#char-manage").addEventListener("click", () => go("characters"));
store.subscribe(() => render());

// Paste or drop a screenshot anywhere: it goes to the item check.
function takeImage(file) {
  if (!file || !file.type.startsWith("image/")) return;
  check.setImage(file);
  go("check");
}
document.addEventListener("click", (e) => {
  if (!e.target.closest("#share-save") || !shared.char) return;
  const { name, className, buildId, gear, talisman, stats } = shared.char;
  store.addCharacter({ name: `${name} (copy)`, className, buildId });
  const id = store.get().activeId;
  store.updateCharacter(id, { gear: structuredClone(gear), talisman: structuredClone(talisman || { seal: null, charms: [null, null, null, null, null, null] }), stats: structuredClone(stats || {}) });
  location.hash = "#/loadout";
});
addEventListener("paste", (e) => {
  if (shared.char) return;
  if (e.target.closest?.("input, textarea") && !e.clipboardData?.files?.length) return;
  const f = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith("image/"))?.getAsFile();
  if (f) { e.preventDefault(); takeImage(f); }
});
const veil = $("#drop-veil");
let depth = 0;
addEventListener("dragenter", (e) => { if ([...(e.dataTransfer?.types || [])].includes("Files")) { depth++; veil.classList.add("on"); } });
addEventListener("dragleave", () => { depth = Math.max(0, depth - 1); if (!depth) veil.classList.remove("on"); });
addEventListener("dragover", (e) => e.preventDefault());
addEventListener("drop", (e) => {
  e.preventDefault(); depth = 0; veil.classList.remove("on");
  if (shared.char) return;
  takeImage([...(e.dataTransfer?.files || [])].find((f) => f.type.startsWith("image/")));
});

loadIndex().then((i) => { index = { classes: [], tiers: [], ...i }; migrate(); }).catch(() => {}).finally(render);

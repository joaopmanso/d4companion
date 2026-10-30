import "./styles.css";
import "./app.css";
import { $, esc } from "./lib/dom.js";
import { store } from "./lib/store.js";
import { BUILDS, buildFor } from "./data/builds/index.js";
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

const VIEWS = [
  ["loadout", "Loadout", loadout],
  ["check", "Item check", check],
  ["skills", "Skills", skills],
  ["paragon", "Paragon", paragon],
  ["farm", "Farm guide", farm],
  ["hordes", "Hordes picker", hordes],
  ["warplans", "War Plans", warplans],
  ["strongroom", "Strongrooms", strongroom],
  ["guides", "Guides", guides],
  ["characters", "Characters", characters],
];
const VIEW = Object.fromEntries(VIEWS.map(([id, , mod]) => [id, mod]));
const NEEDS_CHAR = new Set(["loadout", "check", "farm"]);

$("#tabs").innerHTML = VIEWS.map(([id, label]) => `<button class="tab" role="tab" data-view="${id}" id="tab-${id}">${label}</button>`).join("");

let current = null;
function viewFromHash() {
  const id = location.hash.replace(/^#\/?/, "").split("/")[0];
  return VIEW[id] ? id : "loadout";
}

function ctx() {
  const char = store.active();
  return { char, build: buildFor(char), go };
}

function renderHeader() {
  const s = store.get();
  const c = store.active();
  $("#char-pick").innerHTML = s.characters.map((x) => `<option value="${esc(x.id)}"${x.id === c?.id ? " selected" : ""}>${esc(x.name)}</option>`).join("")
    + `<option value="__new">+ New character…</option>`;
  const b = buildFor(c);
  $("#build-line").innerHTML = c ? `Following <b>${esc(b.name)}</b> · <a href="${esc(b.guide.url)}" target="_blank" rel="noopener">${esc(b.guide.site)} “${esc(b.guide.variant)}”</a>, checked ${esc(b.guide.checked)}` : "";
  $("#season-line").textContent = `Diablo IV · Season ${b.season} · ${b.className}`;
}

function render() {
  renderHeader();
  const id = viewFromHash();
  for (const t of document.querySelectorAll(".tab")) t.setAttribute("aria-selected", String(t.dataset.view === id));
  // Each view keeps its own container (and listeners) for the life of the page; only one is shown.
  // A brand-new browser has no characters: views that need one show the welcome form instead.
  const c = ctx();
  const welcome = !c.char && NEEDS_CHAR.has(id);
  const main = $("#main");
  const rootId = welcome ? "welcome" : id;
  let box = main.querySelector(`[data-root="${rootId}"]`);
  if (!box) { box = document.createElement("div"); box.dataset.root = rootId; main.appendChild(box); }
  for (const el of main.children) el.hidden = el !== box;
  if (current !== id) { current = id; scrollTo({ top: 0 }); }
  if (welcome) characters.renderWelcome(box);
  else VIEW[id].render(box, c);
}

export function go(id) {
  if (location.hash !== `#/${id}`) location.hash = `#/${id}`;
  else render();
}

$("#tabs").addEventListener("click", (e) => { const t = e.target.closest(".tab"); if (t) go(t.dataset.view); });
addEventListener("hashchange", render);
$("#char-pick").addEventListener("change", (e) => {
  if (e.target.value === "__new") { go("characters"); characters.startNew(); renderHeader(); return; }
  store.setActive(e.target.value);
});
$("#char-manage").addEventListener("click", () => go("characters"));
store.subscribe(() => render());

// Paste or drop a screenshot anywhere: it goes to the item check.
function takeImage(file) {
  if (!file || !file.type.startsWith("image/")) return;
  check.setImage(file);
  go("check");
}
addEventListener("paste", (e) => {
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
  takeImage([...(e.dataTransfer?.files || [])].find((f) => f.type.startsWith("image/")));
});

if (!BUILDS.length) throw new Error("No builds registered.");
render();

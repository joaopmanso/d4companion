// Loadout: the character's own gear, talisman, runes and Splinters, laid out like the in-game character
// screen. Nothing here is taken from the guide: where the character has nothing yet, the slot is empty
// and the guide's target is shown separately (dimmed) with the next step.
import { $, esc, tipCard, tipFromText, rarityOf, hoverCards } from "../lib/dom.js";
import { store, shots } from "../lib/store.js";
import { SLOT, paperdoll, BASE_ART } from "../data/slots.js";
import { SOURCES } from "../data/sources.js";
import { CLASS_ART, emblem } from "../data/classes.js";
import { affixLabel } from "../data/affixes.js";
import { slotStatus, evaluate } from "../evaluate.js";
import { itemArt, itemTip, typeLine, wantedList, ancestralBadge } from "../lib/itemview.js";
import { itemFormHtml, bindItemForm, readItemForm } from "../lib/itemform.js";
import { emptyTalisman, charmInfo, sealInfo, setCounts, lowersThresholds, talismanSteps } from "../lib/talisman.js";
import { setPreset } from "./check.js";
import { artUrl } from "../data/cdn.js";
import { grouped, fmtStat, buildFit, totals } from "../lib/gearstats.js";
import { shareLink } from "../lib/share.js";

// Makes a read-only link to the character and copies it; the link is also shown to copy by hand.
async function shareFlow(root, char) {
  const note = $("#share-note", root);
  try {
    const url = await shareLink(char);
    let copied = false;
    try { await navigator.clipboard.writeText(url); copied = true; } catch { /* clipboard blocked */ }
    note.innerHTML = `${copied ? "Link copied. " : ""}Anyone with it can view this character read-only; your screenshots and API key aren't included. <input class="share-url" readonly value="${esc(url)}" aria-label="Share link">`;
    note.querySelector(".share-url").select();
  } catch (err) { note.textContent = `Couldn't make the link: ${err.message}`; }
}

let selected = "helm";
let editing = false;
let editingStats = false;
let picking = null; // "seal" | charm index being chosen
let listing = false; // the "pick from list" panel is open for the selected slot
let trials = {}; // slot → item being tried on (not saved)
let hover = null;
let ctxNow = null;

// The character as currently shown: saved gear with any items being tried on in their place.
const viewOf = (char) => ({ ...char, gear: { ...char.gear, ...trials } });

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
  if (root.dataset.char !== char.id) { trials = {}; listing = false; root.dataset.char = char.id; }
  const view = viewOf(char);
  if (!root.querySelector(".doll-wrap")) {
    root.innerHTML = `<section class="view">
      <div class="view-head"><h2>Loadout</h2><p>What your character has, laid out like the character screen. Pick a slot for its rolls marked against the guide and what to do next. Empty slots and dimmed sockets are things you haven't entered yet; the guide's target is shown beside them, not as yours.</p>
        <div class="row share-row"><button class="btn" id="share-btn" type="button">Share this character</button><span class="note" id="share-note"></span></div></div>
      <div class="loadout-top">
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
        <aside class="panel gear-stats" id="gear-stats" aria-label="Stats from your gear"></aside>
      </div>
      <div class="loadout-lower"><div id="detail"></div><div class="stats-panel" id="stats"></div></div>
    </section>`;
    bind(root);
  }
  const art = CLASS_ART[build.className];
  $("#doll-figure", root).innerHTML = art
    ? `<img class="portrait" src="${esc(art.portrait)}" alt="" style="object-position:${art.focus}"><img class="crest" src="${esc(emblem(build.className))}" alt=""><span class="art-credit">${esc(art.credit)}</span>`
    : `<img class="crest big" src="${esc(emblem(build.className))}" alt="">`;
  renderDoll(root, view, build);
  renderTalisman(root, char, build);
  renderSockets(root, view, build);
  renderDetail(root, char, build);
  renderGearStats(root, char, build);
  renderStats(root, char, build);
}

function slotButton(id, char, build) {
  if (!id) return `<span class="dslot spacer" aria-hidden="true"></span>`;
  const g = char.gear[id];
  const r = rarityOf(g);
  const target = build.slots[id];
  const st = slotStatus(char, build, id);
  const miss = target && (!g || !target.item.match.test(`${g.name} ${g.aspect || ""} ${g.power || ""}`)) ? `<span class="gd">Guide: ${esc(target.item.name)}</span>` : "";
  return `<button class="dslot${g ? "" : " empty"}${trials[id] ? " trying" : ""}" data-pick="${id}" aria-pressed="${id === selected}">
    <span class="ico t-${r === "unknown" ? "unknown" : r}${g?.ancestral ? " ancestral" : ""}"><img class="art${g ? "" : " empty"}" src="${esc(itemArt(g, id, build))}" alt="">${ancestralBadge(g)}<i class="pip ${st.done ? "done" : "todo"}" aria-hidden="true"></i></span>
    <span class="dtext"><span class="nm r-${r}">${esc(g?.name || SLOT[id].name)}</span><span class="ty">${trials[id] ? `<b class="trying-tag">Trying</b> ` : ""}${g ? typeLine(g, id, { html: true }) : "Empty"}</span>${miss}</span>
  </button>`;
}

// Character stats from the gear (with a column for what the items being tried on change).
function renderGearStats(root, char, build) {
  const box = $("#gear-stats", root);
  const view = viewOf(char);
  const trying = Object.keys(trials).length > 0;
  const now = grouped(view.gear);
  const base = trying ? totals(char.gear) : null;
  const fit = buildFit(view.gear, build);
  const bar = ([a, b], label) => `<div class="fit"><span>${label}</span><b>${a}/${b}</b><i style="--p:${b ? Math.round((a / b) * 100) : 0}%"></i></div>`;
  box.innerHTML = `<h3>Gear stats</h3>
    ${trying ? `<p class="note trying-note">Including what you're trying on: ${esc(Object.entries(trials).map(([s, it]) => `${it.name} (${SLOT[s].name})`).join(", "))}.</p>` : ""}
    <div class="fit-grid">${bar(fit.items, "Guide items")}${bar(fit.affixes, "Guide affixes")}${bar(fit.tempers, "Guide tempers")}${bar(fit.sockets, "Guide sockets")}</div>
    ${now.length ? `<div class="gs-groups">` + now.map((g) => `<div class="gs-group"><span class="label">${esc(g.name)}</span><dl>${g.rows.map((r) => {
      const was = base?.get(r.key);
      const diff = trying && r.numeric ? r.value - (was?.value || 0) : 0;
      return `<div><dt>${esc(r.label)}</dt><dd>${esc(fmtStat(r))}${diff ? ` <span class="delta ${diff > 0 ? "up" : "down"}">${diff > 0 ? "+" : ""}${Number(diff.toFixed(1)).toLocaleString()}</span>` : ""}</dd></div>`;
    }).join("")}</dl></div>`).join("") + `</div>` : `<p class="note">Nothing entered yet. Add items to see their stats here.</p>`}
    <p class="note">Totals of the affixes, tempers and base stats on your gear. "×" multipliers are summed as a rough guide; the in-game sheet is exact.</p>`;
}

function renderDoll(root, char, build) {
  const { left, right } = paperdoll(build);
  $("#doll-left", root).innerHTML = left.map((id) => slotButton(id, char, build)).join("");
  $("#doll-right", root).innerHTML = right.map((id) => slotButton(id, char, build)).join("");
  $("#doll-left", root).style.gridTemplateRows = $("#doll-right", root).style.gridTemplateRows = `repeat(${Math.max(left.length, right.length)}, 1fr)`;
}

// Charm and seal art sits off-centre in its image, by a different amount for each (a set charm's gem
// is at 56% of the height, a mythic charm's at 51%), so each image is measured once and placed so its
// visible artwork fills and centres the socket. Needs CORS-readable images (our image cache allows it);
// if an image can't be read it just stays centred as a whole.
const artBox = new Map();
function measureArt(img) {
  if (artBox.has(img.src)) return artBox.get(img.src);
  let box = null;
  try {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext("2d", { willReadFrequently: true });
    x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    let l = c.width, t = c.height, r = -1, b = -1;
    for (let y = 0; y < c.height; y++) for (let k = 0; k < c.width; k++) {
      if (d[(y * c.width + k) * 4 + 3] > 40) { if (k < l) l = k; if (k > r) r = k; if (y < t) t = y; if (y > b) b = y; }
    }
    if (r >= 0) box = { l, t, w: r - l + 1, h: b - t + 1, nw: c.width, nh: c.height };
  } catch { /* image not CORS-readable */ }
  artBox.set(img.src, box);
  return box;
}
function centerArt(img) {
  const box = measureArt(img);
  const socket = img.parentElement;
  if (!box || !socket) return;
  const size = socket.clientWidth;
  const k = (size * (socket.classList.contains("seal") ? 1 : 0.94)) / Math.max(box.w, box.h);
  Object.assign(img.style, {
    position: "absolute", maxWidth: "none", objectFit: "fill", borderRadius: "0",
    width: `${box.nw * k}px`, height: `${box.nh * k}px`,
    left: `${size / 2 - (box.l + box.w / 2) * k}px`, top: `${size / 2 - (box.t + box.h / 2) * k}px`,
  });
}
function centerTalismanArt(root) {
  for (const img of root.querySelectorAll(".tal-socket img")) {
    if (img.complete && img.naturalWidth) centerArt(img);
    else img.addEventListener("load", () => centerArt(img), { once: true });
  }
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
    return `<span class="tal-ring" style="left:${x}%;top:${y}%"></span><button class="tal-socket${cls}" style="left:${x}%;top:${y}%" data-tip="charm:${i}" aria-label="${esc(c?.name || "Empty charm socket")}">${c?.art ? `<img crossorigin="anonymous" src="${esc(c.art)}" alt="">` : `<span class="plus">+</span>`}</button>`;
  }).join("");
  $("#talisman", root).innerHTML = `<span class="tal-ring seal-ring" style="left:50%;top:50%"></span>
    <button class="tal-socket seal${seal ? "" : " empty"}" style="left:50%;top:50%" data-tip="seal" aria-label="${esc(seal?.name || "Empty seal socket")}">${seal?.art ? `<img crossorigin="anonymous" src="${esc(seal.art)}" alt="">` : `<span class="plus">+</span>`}</button>${sockets}`;
  centerTalismanArt($("#talisman", root));

  const counts = setCounts(charms);
  const minus = lowersThresholds(seal) ? 1 : 0;
  const steps = talismanSteps(mine, build);
  // The guide's talisman as a checklist: what to get, and the affix to look for on each piece.
  const want = build.talisman || { charms: [] };
  const haveNames = new Set(mine.charms.filter(Boolean));
  const row = (w, have, kind) => `<li class="${have ? "have" : "need"}"><span class="mark">${have ? "✓" : "✗"}</span><span><b>${esc(w.name)}</b>${kind ? ` <span class="muted">${esc(kind)}</span>` : ""}${w.affix ? `<br><span class="aff">${w.mythic ? "Rolls" : "Look for"}: ${esc(w.affix)}</span>` : w.mythic ? "" : `<br><span class="muted">Any affix</span>`}</span></li>`;
  const checklist = (want.seal || want.charms.length) ? `<li class="tal-guide"><span class="label">Guide's talisman</span><ul>
      ${want.seal ? row(want.seal, mine.seal === want.seal.name, "Seal") : ""}
      ${want.charms.map((c) => row(c, haveNames.has(c.name), c.set || (c.mythic ? "Mythic charm" : "Unique charm"))).join("")}
    </ul></li>` : "";
  $("#charms", root).innerHTML = (counts.size ? [...counts].map(([name, n]) => `<li><i></i>${esc(name)} <span class="muted">${n} counted${minus ? " (needs one fewer)" : ""}</span></li>`).join("") : `<li class="muted">No charms entered. Click a socket to add yours.</li>`)
    + checklist
    + (!steps.length ? `<li class="ok">Matches the guide's talisman.</li>` : "");

  const pick = $("#tal-pick", root);
  if (picking === null) { pick.innerHTML = ""; return; }
  const isSeal = picking === "seal";
  const pool = isSeal ? Object.keys(build.catalog?.seals || {}) : Object.keys(build.catalog?.charms || {});
  const wantItem = isSeal ? build.talisman?.seal : build.talisman?.charms?.[picking];
  const wantText = wantItem ? `${wantItem.name}${wantItem.affix && !wantItem.mythic ? ` with ${wantItem.affix}` : ""}` : "";
  const groups = new Map();
  for (const n of pool) { const ci = charmInfo(n, build); const k = isSeal ? "Seals" : (ci.set || (ci.mythic ? "Mythic charms" : "Unique charms")); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(n); }
  const current = isSeal ? mine.seal : mine.charms[picking];
  pick.innerHTML = `<form class="tal-picker" id="tal-form">
    <label class="label" for="tal-choice">${isSeal ? "Your seal" : `Your charm in socket ${picking + 1}`}</label>
    <select id="tal-choice"><option value="">Empty</option>${[...groups].map(([k, list]) => `<optgroup label="${esc(k)}">${list.sort().map((n) => `<option${n === current ? " selected" : ""}>${esc(n)}</option>`).join("")}</optgroup>`).join("")}</select>
    ${wantText ? `<p class="note">The guide uses ${esc(wantText)} here.</p>` : ""}
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
    const look = want?.affix ? ` Affix to look for: ${esc(want.affix)}.` : "";
    if (!s) return tipCard({ name: "Empty seal socket", r: "unknown", art: want?.art || "", ghost: true, foot: want ? `Guide uses ${esc(want.name)}.${look} Click to set yours.` : "Click to set yours." });
    return tipFromText(s.tip, { name: s.name, art: s.art, r: "mythic", foot: want && want.name !== s.name ? `Guide uses ${esc(want.name)}.${look}` : `${look} Click to change.` });
  }
  if (kind === "charm") {
    const c = charmInfo(mine.charms[+a], build);
    const want = build.talisman?.charms?.[+a];
    // The guide's affix for this charm (by name if you have it, else for this socket).
    const same = build.talisman?.charms?.find((x) => x.name === c?.name);
    const look = (w) => (w?.affix && !w.mythic ? ` Affix to look for: ${esc(w.affix)}.` : w && !w.mythic ? " The guide doesn't name an affix for it." : "");
    if (!c) return tipCard({ name: "Empty charm socket", r: "unknown", art: want?.art || "", ghost: true, foot: want ? `Guide uses ${esc(want.name)} here.${look(want)} Click to set yours.` : "Click to set yours." });
    return tipFromText(c.tip, { name: c.name, art: c.art, r: c.mythic ? "mythic" : c.unique ? "unique" : c.set ? "set" : undefined, foot: `${same ? look(same) : " Not in this guide's talisman."} Click to change.` });
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

// Items that fit a slot: the guide's pick first, then everything the class's synced guides use there.
const slotOfCatalog = (name) => ({ helm: /^helm/i, chest: /chest/i, gloves: /glove/i, pants: /pants/i, boots: /boots/i, amulet: /amulet/i, ring1: /^ring/i, ring2: /^ring/i })[name];
function candidates(id, build) {
  const t = build.slots[id];
  const fits = (cat) => (slotOfCatalog(id) ? slotOfCatalog(id).test(cat.slot || "") : !/helm|chest|glove|pants|boots|amulet|ring/i.test(cat.slot || ""));
  const out = new Map();
  if (t) out.set(t.item.name, { name: t.item.name, art: t.item.art, rarity: t.item.rarity || "legendary", kind: t.item.type, tip: t.item.tip, guide: true });
  for (const [name, cat] of Object.entries(build.catalog?.items || {})) if (fits(cat) && !out.has(name)) out.set(name, { name, ...cat, guide: false });
  return [...out.values()];
}

// An item made from a list pick. The guide's own item comes with the guide's affixes and tempers
// (names only, no rolls yet) so you can see how it would fit; others start blank.
function itemFromPick(c, id, build) {
  const t = build.slots[id];
  const isGuide = t && t.item.name === c.name;
  const aspect = c.kind === "aspect";
  return {
    name: aspect ? `Legendary ${SLOT[id].noun}` : c.name,
    rarity: aspect ? "legendary" : c.rarity === "mythic" ? "mythic" : c.rarity === "unique" ? "unique" : "legendary",
    aspect: aspect ? c.name : "",
    power: "",
    affixes: isGuide ? [...t.affixes.map((k) => ({ text: affixLabel(k), key: k, kind: "affix" })), ...t.tempers.map(([k]) => ({ text: affixLabel(k), key: k, kind: "temper" }))] : [],
    sockets: isGuide ? [...(t.sockets || [])] : [],
    fromList: true,
  };
}

function listHtml(id, build) {
  const list = candidates(id, build);
  return `<div class="pick-list">
    <div class="pick-head"><label class="label" for="pick-q">Pick an item for ${esc(SLOT[id].name)}</label><input id="pick-q" type="search" placeholder="Search ${list.length} items" autocomplete="off"></div>
    <div class="pick-items" id="pick-items">${list.map((c, i) => `<div class="pick-item" data-name="${esc(c.name.toLowerCase())}">
      <span class="ico t-${c.kind === "aspect" ? "legendary" : esc(c.rarity || "legendary")}"><img class="art" src="${esc(c.art || BASE_ART[SLOT[id].kind])}" alt=""></span>
      <span class="pi-text"><b class="r-${c.kind === "aspect" ? "legendary" : esc(c.rarity || "legendary")}">${esc(c.name)}</b><small>${c.guide ? "The guide's pick · " : ""}${c.kind === "aspect" ? "Aspect" : esc(c.rarity || "")}</small></span>
      <span class="pi-acts"><button class="btn ghost" data-try="${i}">Try</button><button class="btn" data-equip="${i}">Equip</button></span>
    </div>`).join("")}</div>
    <p class="note">Rolls aren't known for list picks; paste a screenshot or edit by hand once you have the item.</p>
    <div class="slot-actions"><button class="btn ghost" id="pick-close">Close</button></div>
  </div>`;
}

async function renderDetail(root, char, build) {
  const box = $("#detail", root);
  const id = selected, target = build.slots[id];
  if (listing) { box.innerHTML = `<div class="tooltip slot-detail">${listHtml(id, build)}</div>`; return; }
  if (trials[id]) {
    const tr = trials[id];
    const ev = evaluate(tr, id, char, build);
    const label = { equip: "Equip it", build: "Worth building up", sidegrade: "Side-grade", salvage: "Salvage" }[ev.verdict];
    box.innerHTML = `<div class="tooltip slot-detail">
      <div class="verdict-head"><span class="badge ${ev.verdict}">${label}</span><span class="verdict-title">Trying ${esc(tr.aspect || tr.name)}: ${esc(ev.headline)}</span></div>
      ${itemTip(tr, id, build, ev, { why: true })}
      ${ev.actions.length ? `<div class="tt-sec"><span class="label">To make it match the guide</span><ol class="steps">${ev.actions.map((a) => `<li>${esc(a.text)}</li>`).join("")}</ol></div>` : ""}
      <p class="note">Not saved. The paperdoll and gear stats show it in place of ${char.gear[id] ? esc(char.gear[id].name) : "the empty slot"}.</p>
      <div class="slot-actions"><button class="btn ghost" data-act="untry">Stop trying</button><button class="btn" data-act="list">Try another</button><button class="btn primary" data-act="keep">Equip it</button></div>
    </div>`;
    return;
  }
  const g = char.gear[id];
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
      <div class="slot-actions"><button class="btn" data-act="list">Pick from list</button><button class="btn" data-act="edit">Enter by hand</button><button class="btn primary" data-act="check">Add from screenshot</button></div>
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
    <div class="slot-actions"><button class="btn ghost" data-act="clear">Clear slot</button><button class="btn" data-act="list">Swap or try from list</button><button class="btn" data-act="edit">Edit by hand</button><button class="btn primary" data-act="check">Check a replacement</button></div>
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
  root.addEventListener("click", async (e) => {
    const { char, build, go } = ctxNow;
    if (e.target.closest("#share-btn")) { await shareFlow(root, char); return; }
    // A shared character is read-only: only looking at slots is allowed.
    if (ctxNow.readOnly && !e.target.closest("[data-pick]")) return;
    const pick = e.target.closest("[data-pick]");
    if (pick) { selected = pick.dataset.pick; editing = false; listing = false; hover.hide(); render(root, ctxNow); return; }
    // Picking from the list: try an item on (not saved) or equip it.
    const tryBtn = e.target.closest("[data-try], [data-equip]");
    if (tryBtn) {
      const c = candidates(selected, build)[+(tryBtn.dataset.try ?? tryBtn.dataset.equip)];
      const item = itemFromPick(c, selected, build);
      listing = false;
      if (tryBtn.dataset.try != null) { trials[selected] = item; render(root, ctxNow); }
      else { delete trials[selected]; store.setGear(char.id, selected, { ...item, updated: new Date().toISOString() }); }
      return;
    }
    if (e.target.closest("#pick-close")) { listing = false; renderDetail(root, char, build); return; }
    const tal = e.target.closest(".tal-socket");
    if (tal) { hover.hide(); picking = tal.dataset.tip === "seal" ? "seal" : +tal.dataset.tip.split(":")[1]; renderTalisman(root, char, build); $("#tal-choice", root)?.focus(); return; }
    if (e.target.closest("#tal-cancel")) { picking = null; renderTalisman(root, char, build); return; }
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "list") { listing = true; renderDetail(root, char, build); $("#pick-q", root)?.focus(); return; }
    if (act === "untry") { delete trials[selected]; render(root, ctxNow); return; }
    if (act === "keep") { const item = trials[selected]; delete trials[selected]; store.setGear(char.id, selected, { ...item, updated: new Date().toISOString() }); return; }
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
  root.addEventListener("input", (e) => {
    if (e.target.id !== "pick-q" || ctxNow.readOnly) return;
    const q = e.target.value.trim().toLowerCase();
    for (const el of root.querySelectorAll(".pick-item")) el.hidden = !!q && !el.dataset.name.includes(q);
  });
  root.addEventListener("submit", (e) => {
    const { char, build } = ctxNow;
    e.preventDefault();
    if (ctxNow.readOnly) return;
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

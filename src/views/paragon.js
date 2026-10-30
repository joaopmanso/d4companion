// Paragon boards drawn with the game's tile art (synced from the guide site), turned as attached.
// Two views: "Mine" is the character's own boards and path, which the player edits (click tiles,
// add or remove boards they've unlocked, set rotation and glyph); "Guide" is the guide's, read-only.
// In Mine, tiles the guide takes that you don't are ringed orange, and your extras blue.
import { esc, tipFromText, hoverCards } from "../lib/dom.js";
import { store } from "../lib/store.js";

let ctxNow = null;
const modeFor = new Map(); // character id → "mine" | "guide"
const tipOf = (cls, name, kind) => cls?.boards?.[name]?.tiles.find((t) => t.t === kind)?.tip || "";
const pts = (boards) => (boards || []).reduce((n, b) => n + b.on.length, 0);
const ROTATIONS = [0, 90, 180, 270];

function boardHtml(bd, def, bi, { guideOn, editable }) {
  const on = new Set(bd.on);
  const tiles = (def?.tiles || []).map((t, ti) => {
    const key = `${t.r},${t.c}`;
    const lit = on.has(key) || t.t === "S";
    const diff = guideOn ? (guideOn.has(key) && !lit ? " miss" : lit && !guideOn.has(key) && t.t !== "S" ? " extra" : "") : "";
    const icon = lit ? t.iconOn || t.icon : t.icon || t.iconOn;
    return `<button class="pg-tile t-${t.t}${lit ? " on" : ""}${diff}${editable ? " editable" : ""}" style="grid-row:${t.r};grid-column:${t.c}" data-tile="${bi}:${ti}" aria-label="${esc((t.tip || "").split("\n").slice(0, 2).join(", "))}">
      <span class="pg-rot" style="transform:rotate(${-bd.rotate}deg)">${t.bg ? `<img class="pg-bg" src="${esc(t.bg)}" alt="">` : ""}${icon ? `<img class="pg-ic" src="${esc(icon)}" alt="">` : ""}</span></button>`;
  }).join("");
  return `<div class="pg-board" style="transform:rotate(${bd.rotate}deg)">${tiles}</div>`;
}

// Small map of where each board attaches, numbered in order.
function mapHtml(boards) {
  const xs = boards.map((b) => b.x), ys = boards.map((b) => b.y);
  const minX = Math.min(...xs), minY = Math.min(...ys), w = Math.max(...xs) - minX + 1, h = Math.max(...ys) - minY + 1;
  return `<div class="pg-map deep" style="grid-template-columns:repeat(${w}, 1fr);grid-template-rows:repeat(${h}, 1fr);aspect-ratio:${w}/${h}">${boards.map((b, i) => `<a href="#pg-${i}" data-jump="${i}" style="grid-column:${b.x - minX + 1};grid-row:${b.y - minY + 1}" title="${esc(b.name)}"><b>${i + 1}</b><span>${esc(b.name)}</span></a>`).join("")}</div>`;
}

export function render(root, ctx) {
  ctxNow = ctx;
  const { build, cls, char, readOnly } = ctx;
  const guide = build.paragon || [];
  const id = char?.id || "none";
  const own = char?.paragon;
  if (!modeFor.has(id)) modeFor.set(id, own?.boards?.length ? "mine" : "guide");
  const mine = char && modeFor.get(id) === "mine";
  const editable = mine && !readOnly;
  const boards = mine ? own?.boards || [] : guide;
  const guideBy = new Map(guide.map((b) => [b.name, new Set(b.on)]));
  const allBoards = Object.keys(cls?.boards || {});
  const glyphs = Object.keys(cls?.glyphs || {});

  const start = mine && !boards.length ? `<div class="panel"><h3>Your Paragon</h3>
      <p>${readOnly ? "No Paragon boards entered." : "Nothing entered yet. Start from the guide's boards and click the tiles you've taken, or copy the guide's whole path."}</p>
      ${editable ? `<div class="row"><button class="btn primary" data-act="boards">Start with the guide's boards</button><button class="btn" data-act="copy">Copy the guide's path</button></div>` : ""}</div>` : "";

  root.innerHTML = `<section class="view">
    <div class="view-head"><h2>Paragon</h2><p>${mine ? `Your path: ${pts(boards)} points on ${boards.length} board${boards.length === 1 ? "" : "s"}. The guide (${esc(build.name)}: ${esc(build.variant)}) uses ${pts(guide)} on ${guide.length}.` : `${esc(build.name)}: ${esc(build.variant)}. Attach the boards in this order, turned as shown; lit tiles are the guide's path.`} Point at any tile for its stats.</p></div>
    <div class="st-toolbar">
      ${char ? `<div class="seg" role="tablist"><button role="tab" data-mode="mine" aria-selected="${!!mine}">${readOnly ? esc(char.name) : "Mine"}</button><button role="tab" data-mode="guide" aria-selected="${!mine}">Guide</button></div>` : ""}
      ${editable && boards.length ? `<button class="btn ghost" data-act="copy">Copy the guide's path</button><button class="btn ghost" data-act="clear">Clear mine</button>
        ${allBoards.filter((n) => !boards.some((b) => b.name === n)).length ? `<label class="add-board"><span class="sr">Add a board</span><select data-act="add"><option value="">+ Add a board…</option>${allBoards.filter((n) => !boards.some((b) => b.name === n)).map((n) => `<option>${esc(n)}</option>`).join("")}</select></label>` : ""}` : ""}
    </div>
    ${editable && boards.length ? `<p class="note">Click a tile to take or remove it. Remove boards you haven't unlocked yet. Orange rings: the guide takes it and you don't. Blue: yours, not the guide's.</p>` : ""}
    ${start}
    ${boards.length ? `<div class="pg-top">
      <div class="panel"><h3>Board layout</h3>${mapHtml(boards)}</div>
      <div class="panel"><h3>Glyphs</h3><ul class="pg-glyphs">${boards.map((b, i) => `<li data-glyph="${i}"><b>${esc(b.glyph || "No glyph")}</b> <span class="note">on ${esc(b.name)}</span></li>`).join("")}</ul></div>
    </div>
    <div class="pg-boards">${boards.map((b, i) => {
      const def = cls?.boards?.[b.name];
      const leg = tipOf(cls, b.name, "L").split("\n");
      const g = mine ? guideBy.get(b.name) : null;
      return `<article class="panel pg-card" id="pg-${i}">
        <div class="board-head"><span class="board-num">${i + 1}</span><h3>${esc(b.name)}</h3>
          ${editable ? `<select data-rot="${i}" aria-label="Rotation">${ROTATIONS.map((r) => `<option value="${r}"${r === b.rotate ? " selected" : ""}>Turned ${r}°</option>`).join("")}</select>
            <select data-glyph-set="${i}" aria-label="Glyph"><option value="">No glyph</option>${glyphs.map((n) => `<option${n === b.glyph ? " selected" : ""}>${esc(n)}</option>`).join("")}</select>
            ${i ? `<button class="btn ghost" data-remove="${i}">Remove</button>` : ""}`
          : `${b.rotate ? `<span class="tag">Turned ${b.rotate}°</span>` : ""}`}
          <span class="tag"><span class="data">${b.on.length}</span> points</span>${g ? `<span class="tag">Guide: <span class="data">${g.size}</span></span>` : mine ? `<span class="tag">Not in guide</span>` : ""}</div>
        <div class="pg-frame deep">${def ? boardHtml(b, def, i, { guideOn: g, editable }) : `<p class="note">This board's layout hasn't been synced yet.</p>`}</div>
        ${leg[0] ? `<p><b class="r-legendary">${esc(leg[1] || leg[0])}</b>${leg.length > 2 ? `: ${esc(leg.slice(2).join(" "))}` : ""}</p>` : ""}
        <p><b class="pg-glyph-name">${esc(b.glyph || "No glyph")}</b> <span class="note">glyph</span></p>
      </article>`;
    }).join("")}</div>` : ""}
  </section>`;

  if (root.dataset.bound) return;
  root.dataset.bound = "1";

  const myBoards = () => structuredClone(ctxNow.char?.paragon?.boards || []);
  const save = (boardsNext) => store.updateCharacter(ctxNow.char.id, { paragon: { boards: boardsNext } });
  const shown = () => (ctxNow.char && modeFor.get(ctxNow.char.id) === "mine" ? ctxNow.char.paragon?.boards || [] : ctxNow.build.paragon || []);
  const isEditable = () => ctxNow.char && !ctxNow.readOnly && modeFor.get(ctxNow.char.id) === "mine";

  hoverCards(root, "[data-tile], [data-glyph]", (el) => {
    const { cls: c, build: bld } = ctxNow;
    const bs = shown();
    if (el.dataset.glyph) { const bd = bs[+el.dataset.glyph]; return bd.glyph ? tipFromText(c?.glyphs?.[bd.glyph] || "", { name: bd.glyph, r: "rare" }) : ""; }
    const [bi, ti] = el.dataset.tile.split(":").map(Number);
    const bd = bs[bi];
    const t = c.boards[bd.name].tiles[ti];
    const key = `${t.r},${t.c}`;
    const lit = bd.on.includes(key);
    const inGuide = (bld.paragon || []).find((g) => g.name === bd.name)?.on.includes(key);
    const r = { L: "legendary", r: "rare", m: "magic", G: "rare" }[t.t] || "unknown";
    // The site writes the node type first ("Rare Node", "Magic Node"); show the node's name first instead.
    const lines = (t.tip || "").split("\n");
    const text = /(node|glyph)$/i.test(lines[0] || "") && lines[1] ? [lines[1], lines[0], ...lines.slice(2)].join("\n") : t.tip;
    const foot = isEditable() ? `${lit ? "Taken" : "Not taken"}. Guide: ${inGuide ? "takes it" : "doesn't"}. Click to ${lit ? "remove" : "take"} it.` : lit ? "On this path." : "Not taken.";
    return tipFromText(text, { r, art: t.iconOn || t.icon, foot });
  });

  root.addEventListener("click", (e) => {
    const { char: ch, build: bld, cls: c } = ctxNow;
    const jump = e.target.closest("[data-jump]");
    if (jump) { e.preventDefault(); root.querySelector(`#pg-${jump.dataset.jump}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    const m = e.target.closest("[data-mode]");
    if (m && ch) { modeFor.set(ch.id, m.dataset.mode); render(root, ctxNow); return; }
    if (!isEditable()) return;
    const act = e.target.closest("[data-act]")?.dataset.act;
    const guideBoards = bld.paragon || [];
    if (act === "boards") { save(guideBoards.map((b) => ({ ...structuredClone(b), on: [] }))); return; }
    if (act === "copy") { if (!pts(ch.paragon?.boards) || confirm("Replace your Paragon with the guide's path?")) save(structuredClone(guideBoards)); return; }
    if (act === "clear") { if (confirm("Clear all your Paragon boards and points?")) save([]); return; }
    const rm = e.target.closest("[data-remove]");
    if (rm) { const bs = myBoards(); bs.splice(+rm.dataset.remove, 1); save(bs); return; }
    const tile = e.target.closest(".pg-tile[data-tile]");
    if (tile) {
      const [bi, ti] = tile.dataset.tile.split(":").map(Number);
      const bs = myBoards();
      const t = c.boards[bs[bi].name].tiles[ti];
      if (t.t === "S") return; // the starting tile is always taken
      const key = `${t.r},${t.c}`;
      bs[bi].on = bs[bi].on.includes(key) ? bs[bi].on.filter((k) => k !== key) : [...bs[bi].on, key];
      save(bs);
    }
  });
  root.addEventListener("change", (e) => {
    if (!isEditable()) return;
    const bs = myBoards();
    if (e.target.dataset.act === "add" && e.target.value) {
      const g = (ctxNow.build.paragon || []).find((b) => b.name === e.target.value);
      const last = bs[bs.length - 1];
      bs.push(g ? { ...structuredClone(g), on: [] } : { name: e.target.value, glyph: "", rotate: 0, x: last ? last.x : 0, y: last ? last.y - 1 : 0, on: [] });
      save(bs);
    } else if (e.target.dataset.rot != null) { bs[+e.target.dataset.rot].rotate = +e.target.value; save(bs); }
    else if (e.target.dataset.glyphSet != null) { bs[+e.target.dataset.glyphSet].glyph = e.target.value; save(bs); }
  });
}

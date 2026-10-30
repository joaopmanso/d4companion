// Paragon boards drawn with the game's tile art (synced from the guide site), turned the way the guide
// attaches them, with the guide's path lit. Hover any tile for its tooltip.
import { esc, tipFromText, hoverCards } from "../lib/dom.js";

let ctxNow = null;
const tipOf = (cls, name, kind) => cls?.boards?.[name]?.tiles.find((t) => t.t === kind)?.tip || "";

function boardHtml(bd, def, bi) {
  const on = new Set(bd.on);
  const tiles = (def?.tiles || []).map((t, ti) => {
    const lit = on.has(`${t.r},${t.c}`);
    const icon = lit ? t.iconOn || t.icon : t.icon || t.iconOn;
    return `<button class="pg-tile t-${t.t}${lit ? " on" : ""}" style="grid-row:${t.r};grid-column:${t.c}" data-tile="${bi}:${ti}" aria-label="${esc((t.tip || "").split("\n").slice(0, 2).join(", "))}">
      <span class="pg-rot" style="transform:rotate(${-bd.rotate}deg)">${t.bg ? `<img class="pg-bg" src="${esc(t.bg)}" alt="">` : ""}${icon ? `<img class="pg-ic" src="${esc(icon)}" alt="">` : ""}</span></button>`;
  }).join("");
  return `<div class="pg-board" style="transform:rotate(${bd.rotate}deg)">${tiles}</div>`;
}

// Small map of where each board attaches, numbered in order.
function mapHtml(boards) {
  const xs = boards.map((b) => b.x), ys = boards.map((b) => b.y);
  const minX = Math.min(...xs), minY = Math.min(...ys), w = Math.max(...xs) - minX + 1, h = Math.max(...ys) - minY + 1;
  return `<div class="pg-map" style="grid-template-columns:repeat(${w}, 1fr);grid-template-rows:repeat(${h}, 1fr);aspect-ratio:${w}/${h}">${boards.map((b, i) => `<a href="#pg-${i}" style="grid-column:${b.x - minX + 1};grid-row:${b.y - minY + 1}" title="${esc(b.name)}"><b>${i + 1}</b><span>${esc(b.name)}</span></a>`).join("")}</div>`;
}

export function render(root, ctx) {
  ctxNow = ctx;
  const { build, cls } = ctx;
  const boards = build.paragon || [];
  root.innerHTML = `<section class="view">
    <div class="view-head"><h2>Paragon</h2><p>${esc(build.name)}: ${esc(build.variant)}. Attach the boards in this order, turned as shown; lit tiles are the guide's path. Point at any tile for its stats.</p></div>
    <div class="pg-top">
      <div class="panel"><h3>Board layout</h3>${boards.length ? mapHtml(boards) : `<p class="note">No boards in this guide.</p>`}</div>
      <div class="panel"><h3>Glyphs</h3><ul class="pg-glyphs">${boards.map((b, i) => `<li data-glyph="${i}"><b>${esc(b.glyph)}</b> <span class="note">on ${esc(b.name)}</span></li>`).join("")}</ul></div>
    </div>
    <div class="pg-boards">${boards.map((b, i) => {
      const def = cls?.boards?.[b.name];
      const leg = tipOf(cls, b.name, "L").split("\n");
      return `<article class="panel pg-card" id="pg-${i}">
        <div class="board-head"><span class="board-num">${i + 1}</span><h3>${esc(b.name)}</h3>${b.rotate ? `<span class="tag">Turned ${b.rotate}°</span>` : ""}<span class="tag">${b.on.length} points</span></div>
        <div class="pg-frame">${def ? boardHtml(b, def, i) : `<p class="note">This board's layout hasn't been synced yet.</p>`}</div>
        ${leg[0] ? `<p><b class="r-legendary">${esc(leg[1] || leg[0])}</b>${leg.length > 2 ? `: ${esc(leg.slice(2).join(" "))}` : ""}</p>` : ""}
        <p><b class="pg-glyph-name">${esc(b.glyph)}</b> <span class="note">glyph</span></p>
      </article>`;
    }).join("")}</div>
  </section>`;

  if (!root.dataset.bound) {
    root.dataset.bound = "1";
    hoverCards(root, "[data-tile], [data-glyph]", (el) => {
      const { build: b, cls: c } = ctxNow;
      if (el.dataset.glyph) { const bd = b.paragon[+el.dataset.glyph]; return tipFromText(c?.glyphs?.[bd.glyph] || tipOf(c, bd.name, "G"), { name: bd.glyph, r: "rare" }); }
      const [bi, ti] = el.dataset.tile.split(":").map(Number);
      const bd = b.paragon[bi];
      const t = c.boards[bd.name].tiles[ti];
      const lit = bd.on.includes(`${t.r},${t.c}`);
      const r = { L: "legendary", r: "rare", m: "magic", G: "rare" }[t.t] || "unknown";
      // The site writes the node type first ("Rare Node", "Magic Node"); show the node's name first instead.
      const lines = (t.tip || "").split("\n");
      const text = /(node|glyph)$/i.test(lines[0] || "") && lines[1] ? [lines[1], lines[0], ...lines.slice(2)].join("\n") : t.tip;
      return tipFromText(text, { r, art: t.iconOn || t.icon, foot: lit ? "On the guide's path." : "Not taken in this guide." });
    });
  }
}

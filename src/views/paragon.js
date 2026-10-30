import { esc } from "../lib/dom.js";

const KIND = { n: "n", m: "m", r: "r", l: "L", g: "G", s: "S" };

function grid(rows) {
  let cells = "";
  for (const row of rows) for (const ch of row) {
    if (ch === ".") { cells += "<i></i>"; continue; }
    const on = ch !== ch.toLowerCase() || ch === "#" || ch === "@";
    const k = ch === "#" ? "L" : ch === "@" ? "G" : KIND[ch.toLowerCase()] || "n";
    cells += `<i class="${k}${on ? " on" : ""}"></i>`;
  }
  return cells;
}

export function render(root, { build }) {
  const p = build.paragon;
  root.innerHTML = `<section class="view">
    <div class="view-head"><h2>Paragon</h2><p>Attach the boards in this order. Each map shows the guide's path (lit tiles) in the board's own layout, turned the way the guide places it. ${esc(p.note)}</p></div>
    <div class="legend-row">
      <span><i style="background:#c9b48a"></i>Normal</span><span><i style="background:#6f8cff"></i>Magic</span><span><i style="background:#f1de58"></i>Rare</span>
      <span><i style="background:#ff8a3d"></i>Legendary</span><span><i style="background:#e14fd0;border-radius:50%"></i>Glyph socket</span><span><i style="background:#2a2320"></i>Not taken</span>
    </div>
    <div class="boards">${p.boards.map((b, i) => `<article class="panel board">
      <div class="board-head"><span class="board-num">${i + 1}</span><h3>${esc(b.name)}</h3><span class="tag">Glyph: ${esc(b.glyph)}</span>${b.rotate ? `<span class="tag">Rotate ${b.rotate}°</span>` : ""}</div>
      <div class="board-grid-wrap"><div class="board-grid" style="transform:rotate(${b.rotate}deg)" role="img" aria-label="${esc(b.name)} board path">${grid(b.grid)}</div></div>
      ${b.legendary ? `<p><b class="r-legendary">${esc(b.name)}:</b> ${esc(b.legendary)}</p>` : ""}
      <p><b style="color:#e14fd0">${esc(b.glyph)}:</b> ${esc(b.glyphText)}</p>
      <p class="note">Rares: ${esc(b.rares.join(", "))}</p>
      <p class="board-stats">Str ${b.stats.str} · Dex ${b.stats.dex} · Int ${b.stats.int} · Will ${b.stats.will}</p>
    </article>`).join("")}</div>
    <p class="note">Glyph text is the guide's level-15 value. Level glyphs in the Pit (see War Plans: Choron's Blessing).</p>
  </section>`;
}

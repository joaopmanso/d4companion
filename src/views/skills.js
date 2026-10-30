// Skill tree. Compact by default: the skill bar and a summary of each skill with points, its upgrade and
// modifiers. "Show full tree" expands the class's real tree (positions, frames, icons, connectors).
// Two views: "Mine" is the character's own allocation, which the player edits freely (click +1,
// right-click −1, Ctrl-click to max or clear) and can start from the guide's; "Guide" is read-only.
// In Mine, nodes the guide takes that you don't are ringed orange, and your extras blue.
import { $, esc, tipFromText, hoverCards } from "../lib/dom.js";
import { store } from "../lib/store.js";

let ctxNow = null;
let resize = null;
let full = false;
const modeFor = new Map(); // character id → "mine" | "guide"

const bgFor = (n, on) => (on ? n.bgOn : n.bgOff) || (n.bg ? (on ? n.bg.replace("_inactive", "_active") : n.bg.replace(/_active(?=\.png)/, "_inactive")) : "");
const ends = (d) => { const nums = d.match(/-?\d+(\.\d+)?/g).map(Number); return [`${Math.round(nums[0])},${Math.round(nums[1])}`, `${Math.round(nums.at(-2))},${Math.round(nums.at(-1))}`]; };
// Points a node can take: skills 15 (or the site's max), named upgrades and modifiers 1, junctions none.
const maxOf = (n) => (n.kind === "category" || (!n.name && !n.max) ? 0 : n.max || (n.kind === "skill" ? 15 : 1));
const sum = (alloc) => Object.values(alloc || {}).reduce((a, b) => a + b, 0);

// Each upgrade or modifier belongs to the nearest skill node.
function owners(tree) {
  const skills = tree.nodes.filter((n) => n.kind === "skill");
  const own = new Map();
  for (const n of tree.nodes) {
    if (n.kind === "skill" || n.kind === "category" || !n.name) continue;
    let best = null, bd = Infinity;
    for (const s of skills) { const d = (s.x - n.x) ** 2 + (s.y - n.y) ** 2; if (d < bd) { bd = d; best = s; } }
    if (best) own.set(n.key, best.key);
  }
  return own;
}

function treeHtml(tree, alloc, guide, mine) {
  const xs = tree.nodes.map((n) => n.x), ys = tree.nodes.map((n) => n.y);
  const minX = Math.min(...xs) - 60, minY = Math.min(...ys) - 60, w = Math.max(...xs) - minX + 60, h = Math.max(...ys) - minY + 60;
  const on = (k) => alloc[k] > 0;
  // Category hubs and the small unnamed junctions between a skill and its upgrades pass the path through.
  const pass = new Set(tree.nodes.filter((n) => n.kind === "category" || (!n.name && !n.max)).map((n) => n.key));
  const lines = tree.lines.map((d) => {
    const [a, b] = ends(d);
    const lit = (on(a) || pass.has(a)) && (on(b) || pass.has(b)) && (on(a) || on(b));
    return `<path d="${d}" class="${lit ? "lit" : ""}"/>`;
  }).join("");
  const nodes = tree.nodes.map((n, i) => {
    const pts = alloc[n.key] || 0, lit = pts > 0 || n.kind === "category";
    const diff = mine && maxOf(n) ? (guide[n.key] && !pts ? " miss" : pts && !guide[n.key] ? " extra" : "") : "";
    const badge = n.kind === "skill" || (n.kind === "mod" && n.max > 1) ? `<span class="st-badge">${pts}/${maxOf(n)}</span>` : "";
    return `<button class="st-node k-${n.kind}${lit ? " on" : ""}${diff}${mine && maxOf(n) ? " editable" : ""}" style="left:${n.x - minX}px;top:${n.y - minY}px" data-node="${i}" aria-label="${esc(n.name || "Node")}${pts ? `, ${pts} points` : ""}">
      ${bgFor(n, lit) ? `<img class="st-bg" src="${esc(bgFor(n, lit))}" alt="">` : ""}${n.icon ? `<img class="st-icon" src="${esc(n.icon)}" alt="">` : ""}${badge}</button>`;
  }).join("");
  return { html: `<div class="st-inner" style="width:${w}px;height:${h}px"><svg class="st-lines" width="${w}" height="${h}" viewBox="${minX} ${minY} ${w} ${h}">${lines}</svg>${nodes}</div>`, w, h };
}

// One card per skill with points: its ranks, then the upgrade and modifiers taken.
function summaryHtml(tree, alloc, guide, mine) {
  const own = owners(tree);
  const idx = new Map(tree.nodes.map((n, i) => [n.key, i]));
  const skills = tree.nodes.filter((n) => n.kind === "skill" && (alloc[n.key] || (mine && guide[n.key])));
  if (!skills.length) return `<p class="note">${mine ? "No points yet. Open the full tree to spend them, or copy the guide's." : "This guide spends no points."}</p>`;
  return `<div class="ss-grid">${skills.map((s) => {
    const pts = alloc[s.key] || 0, gp = guide[s.key] || 0;
    const kids = tree.nodes.filter((n) => own.get(n.key) === s.key && (alloc[n.key] || (mine && guide[n.key])));
    return `<div class="ss-skill${pts ? "" : " missing"}">
      <button class="ss-head" data-node="${idx.get(s.key)}"><img src="${esc(s.icon)}" alt=""><span><b>${esc(s.name)}</b><small class="data">${pts}/${maxOf(s)}</small>${mine && gp !== pts ? `<small class="ss-guide">Guide: <span class="data">${gp}</span></small>` : ""}</span></button>
      ${kids.length ? `<div class="ss-mods">${kids.map((k) => {
        const have = alloc[k.key] > 0, want = guide[k.key] > 0;
        return `<button class="ss-mod${have ? "" : " missing"}${mine && have && !want ? " extra" : ""}" data-node="${idx.get(k.key)}"><img src="${esc(k.icon)}" alt="">${esc(k.name)}</button>`;
      }).join("")}</div>` : ""}
    </div>`;
  }).join("")}</div>`;
}

export function render(root, ctx) {
  ctxNow = ctx;
  const { build, cls, char, readOnly } = ctx;
  const s = build.skills;
  const guide = s.tree || {};
  const tree = cls?.tree;
  const id = char?.id || "none";
  const own = char?.skillTree;
  if (!modeFor.has(id)) modeFor.set(id, own && sum(own) ? "mine" : "guide");
  const mode = char ? modeFor.get(id) : "guide";
  const mine = mode === "mine";
  const alloc = mine ? own || {} : guide;
  const t = tree && full ? treeHtml(tree, alloc, guide, mine && !readOnly) : null;

  root.innerHTML = `<section class="view">
    <div class="view-head"><h2>Skill tree</h2><p>${mine ? `Your points: ${sum(alloc)}. The guide (${esc(build.name)}: ${esc(build.variant)}) spends ${sum(guide)}.` : `${esc(build.name)}: ${esc(build.variant)} spends ${sum(guide)} points.`} Point at anything for its tooltip.</p></div>
    <div class="st-toolbar">
      ${char ? `<div class="seg" role="tablist"><button role="tab" data-mode="mine" aria-selected="${mine}">${readOnly ? esc(char.name) : "Mine"}</button><button role="tab" data-mode="guide" aria-selected="${!mine}">Guide</button></div>` : ""}
      ${mine && !readOnly ? `<button class="btn ghost" data-act="copy">Copy the guide's points</button><button class="btn ghost" data-act="clear">Clear mine</button>` : ""}
      ${tree ? `<button class="btn" data-act="full">${full ? "Collapse tree" : "Show full tree"}</button>` : ""}
    </div>
    <div class="skill-top">
      <div class="panel"><h3>Skill bar</h3><div class="skill-bar deep">${s.bar.map((k, i) => `<button class="skill-icon" data-bar="${i}"><img src="${esc(k.icon)}" alt=""><span>${esc(k.name)}</span></button>`).join("")}</div><p class="note">The guide's bar.</p></div>
      <div class="panel"><h3>Prime Evil powers</h3><div class="prime deep">${(s.prime || []).map((p, i) => `<button class="${p.main ? "main" : ""}" data-prime="${i}">${p.icon ? `<img src="${esc(p.icon)}" alt="">` : ""}<span>${esc(p.name)}${p.main ? " (main)" : ""}</span></button>`).join("")}</div>
        ${s.soulShard?.length ? `<p class="note">Soul Shard: <b>${esc(s.soulShard.map((x) => x.shard).join(", "))}</b></p>` : ""}</div>
    </div>
    ${tree ? (full
      ? `${mine && !readOnly ? `<p class="note">Click a node for +1, right-click for −1, Ctrl-click to max or clear it. Orange rings: the guide takes it and you don't. Blue: yours, not the guide's.</p>` : ""}
         <div class="st-wrap deep" id="st-wrap"><div class="st-scale" id="st-scale" style="height:${t.h}px">${t.html}</div></div>`
      : `<div class="panel"><h3>${mine ? "Your skills" : "The guide's skills"}</h3>${summaryHtml(tree, alloc, guide, mine && !readOnly)}</div>`)
      : `<p class="warnbox">The skill-tree layout hasn't been synced yet.</p>`}
  </section>`;

  resize?.disconnect();
  if (t) {
    const fit = () => {
      const wrap = $("#st-wrap", root);
      if (!wrap) return;
      const k = Math.min(1, (wrap.clientWidth - 8) / t.w);
      const scale = $("#st-scale", root);
      scale.style.height = `${t.h * k}px`;
      scale.firstElementChild.style.transform = `scale(${k})`;
    };
    resize = new ResizeObserver(fit);
    resize.observe($("#st-wrap", root));
    fit();
  }
  if (root.dataset.bound) return;
  root.dataset.bound = "1";

  hoverCards(root, "[data-node], [data-bar], [data-prime]", (el) => {
    const { build: b, cls: c, char: ch } = ctxNow;
    if (el.dataset.bar) { const k = b.skills.bar[+el.dataset.bar]; return tipFromText(k.tip || c?.tips?.[k.name], { name: k.name, art: k.icon }); }
    if (el.dataset.prime) { const p = b.skills.prime[+el.dataset.prime]; return tipFromText(p.tip || c?.tips?.[p.name], { name: p.name, art: p.icon, r: "legendary" }); }
    const n = c.tree.nodes[+el.dataset.node];
    if (n.kind === "category") return "";
    const g = b.skills.tree[n.key] || 0, m = ch?.skillTree?.[n.key] || 0;
    const foot = `Guide: ${g ? `${g}/${maxOf(n)}` : "not taken"}.${ch ? ` Yours: ${m ? `${m}/${maxOf(n)}` : "not taken"}.` : ""}`;
    return tipFromText(n.tip, { name: n.name || undefined, art: n.icon, r: g || m ? "legendary" : "unknown", foot });
  });

  const change = (node, delta, toggle) => {
    const { char: ch, cls: c } = ctxNow;
    const n = c.tree.nodes[node];
    const max = maxOf(n);
    if (!ch || !max) return;
    const next = { ...(ch.skillTree || {}) };
    const cur = next[n.key] || 0;
    const v = toggle ? (cur ? 0 : max) : Math.max(0, Math.min(max, cur + delta));
    if (v) next[n.key] = v; else delete next[n.key];
    store.updateCharacter(ch.id, { skillTree: next });
  };
  const editable = () => ctxNow.char && !ctxNow.readOnly && modeFor.get(ctxNow.char.id) === "mine";

  root.addEventListener("click", (e) => {
    const { char: ch, build: b } = ctxNow;
    const m = e.target.closest("[data-mode]");
    if (m && ch) { modeFor.set(ch.id, m.dataset.mode); render(root, ctxNow); return; }
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "full") { full = !full; render(root, ctxNow); return; }
    if (act === "copy" && editable()) { if (!sum(ch.skillTree) || confirm("Replace your points with the guide's?")) store.updateCharacter(ch.id, { skillTree: { ...b.skills.tree } }); return; }
    if (act === "clear" && editable()) { if (confirm("Clear all your skill points?")) store.updateCharacter(ch.id, { skillTree: {} }); return; }
    const node = e.target.closest(".st-node[data-node]");
    if (node && editable()) change(+node.dataset.node, 1, e.ctrlKey || e.metaKey);
  });
  root.addEventListener("contextmenu", (e) => {
    const node = e.target.closest(".st-node[data-node]");
    if (!node || !editable()) return;
    e.preventDefault();
    change(+node.dataset.node, -1, false);
  });
}

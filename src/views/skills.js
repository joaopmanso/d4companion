// Skill tree drawn from the synced class layout (node positions, frames, icons and connectors from the
// guide site), lit where the selected guide spends points. Hover any node for its tooltip.
import { $, esc, tipFromText, hoverCards } from "../lib/dom.js";

let ctxNow = null;
let resize = null;

const bgFor = (n, on) => (on ? n.bgOn : n.bgOff) || (n.bg ? (on ? n.bg.replace("_inactive", "_active") : n.bg.replace(/_active(?=\.png)/, "_inactive")) : "");
const ends = (d) => { const nums = d.match(/-?\d+(\.\d+)?/g).map(Number); return [`${Math.round(nums[0])},${Math.round(nums[1])}`, `${Math.round(nums.at(-2))},${Math.round(nums.at(-1))}`]; };

function treeHtml(tree, alloc) {
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
    const badge = n.kind === "skill" || (n.kind === "mod" && n.max > 1) ? `<span class="st-badge">${pts}/${n.max || 1}</span>` : "";
    return `<button class="st-node k-${n.kind}${lit ? " on" : ""}" style="left:${n.x - minX}px;top:${n.y - minY}px" data-node="${i}" aria-label="${esc(n.name || "Node")}${pts ? `, ${pts} points` : ""}">
      ${bgFor(n, lit) ? `<img class="st-bg" src="${esc(bgFor(n, lit))}" alt="">` : ""}${n.icon ? `<img class="st-icon" src="${esc(n.icon)}" alt="">` : ""}${badge}</button>`;
  }).join("");
  return { html: `<div class="st-inner" style="width:${w}px;height:${h}px"><svg class="st-lines" width="${w}" height="${h}" viewBox="${minX} ${minY} ${w} ${h}">${lines}</svg>${nodes}</div>`, w, h };
}

export function render(root, ctx) {
  ctxNow = ctx;
  const { build, cls } = ctx;
  const s = build.skills;
  const alloc = s.tree || {};
  const total = Object.values(alloc).reduce((a, b) => a + b, 0);
  const tree = cls?.tree;
  const t = tree ? treeHtml(tree, alloc) : null;
  root.innerHTML = `<section class="view">
    <div class="view-head"><h2>Skill tree</h2><p>${esc(build.name)}: ${esc(build.variant)} spends ${total} points. Lit nodes are the guide's; point at any node for its full tooltip.</p></div>
    <div class="skill-top">
      <div class="panel"><h3>Skill bar</h3><div class="skill-bar">${s.bar.map((k, i) => `<button class="skill-icon" data-bar="${i}"><img src="${esc(k.icon)}" alt="">${esc(k.name)}</button>`).join("")}</div></div>
      <div class="panel"><h3>Prime Evil powers</h3><div class="prime">${(s.prime || []).map((p, i) => `<button class="${p.main ? "main" : ""}" data-prime="${i}">${p.icon ? `<img src="${esc(p.icon)}" alt="">` : ""}${esc(p.name)}${p.main ? " (main)" : ""}</button>`).join("")}</div>
        ${s.soulShard?.length ? `<p class="note">Soul Shard: <b>${esc(s.soulShard.map((x) => x.shard).join(", "))}</b></p>` : ""}</div>
    </div>
    ${t ? `<div class="st-wrap" id="st-wrap"><div class="st-scale" id="st-scale" style="height:${t.h}px">${t.html}</div></div>` : `<p class="warnbox">The skill-tree layout hasn't been synced yet.</p>`}
  </section>`;

  if (t) {
    const fit = () => {
      const wrap = $("#st-wrap", root);
      if (!wrap) return;
      const k = Math.min(1, (wrap.clientWidth - 8) / t.w);
      const scale = $("#st-scale", root);
      scale.style.height = `${t.h * k}px`;
      scale.firstElementChild.style.transform = `scale(${k})`;
    };
    resize?.disconnect();
    resize = new ResizeObserver(fit);
    resize.observe($("#st-wrap", root));
    fit();
  }
  if (!root.dataset.bound) {
    root.dataset.bound = "1";
    hoverCards(root, "[data-node], [data-bar], [data-prime]", (el) => {
      const { build: b, cls: c } = ctxNow;
      if (el.dataset.bar) { const k = b.skills.bar[+el.dataset.bar]; return tipFromText(k.tip || c?.tips?.[k.name], { name: k.name, art: k.icon }); }
      if (el.dataset.prime) { const p = b.skills.prime[+el.dataset.prime]; return tipFromText(p.tip || c?.tips?.[p.name], { name: p.name, art: p.icon, r: "legendary" }); }
      const n = c.tree.nodes[+el.dataset.node];
      if (n.kind === "category") return "";
      const pts = b.skills.tree[n.key] || 0;
      return tipFromText(n.tip, { name: n.name || undefined, art: n.icon, r: pts ? "legendary" : "unknown", foot: pts ? `The guide takes this: ${pts}/${n.max || 1}.` : "Not taken in this guide." });
    });
  }
}

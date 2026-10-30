import { esc } from "../lib/dom.js";

export function render(root, { build }) {
  const s = build.skills;
  const total = s.tree.reduce((n, t) => n + t.ranks + (t.upgrade ? 1 : 0) + t.mods.length, 0);
  root.innerHTML = `<section class="view">
    <div class="view-head"><h2>Skills</h2><p>${esc(build.guide.site)} “${esc(build.guide.variant)}”: the skill bar, then every skill you put points into, with the upgrade and modifier nodes the guide takes. ${total} points shown; spend the rest on passives you like.</p></div>
    <div class="panel"><h3>Skill bar</h3>
      <div class="skill-bar">${s.bar.map((k) => `<div class="skill-icon"><img src="${esc(k.icon)}" alt="">${esc(k.name)}</div>`).join("")}</div>
    </div>
    <div class="skill-tree">${s.tree.map((t) => `<article class="panel skill-card">
      <img src="${esc(t.icon)}" alt="">
      <div style="display:grid;gap:6px;min-width:0">
        <h3>${esc(t.skill)} <span class="ranks">${t.ranks}/15 · ${esc(t.tag)}</span></h3>
        ${t.upgrade ? `<p class="upgrade">${esc(t.upgrade)}</p>` : ""}
        ${t.mods.length ? `<ul class="mods">${t.mods.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>` : ""}
      </div></article>`).join("")}</div>
    <div class="two-col">
      <div class="panel"><h3>Soul Shard</h3><p><b>${esc(s.soulShard.group)}</b></p><p class="note">${esc(s.soulShard.text)}</p></div>
      <div class="panel"><h3>Prime Evil powers</h3>
        <div class="prime"><span class="main">${esc(s.primeEvil.main)} (main)</span>${s.primeEvil.others.map((p) => `<span>${esc(p)}</span>`).join("")}</div>
        <p class="note">The main power is the one you invoke; the others are passives the guide keeps active.</p>
      </div>
    </div>
  </section>`;
}

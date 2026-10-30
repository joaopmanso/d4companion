import { esc } from "../lib/dom.js";
import { TREES } from "../data/activities.js";

export function render(root) {
  if (root.dataset.ready) return;
  root.dataset.ready = "1";
  root.innerHTML = `<section class="view">
    <div class="view-head"><h2>War Plans</h2><p>Set at the table next to Tyrael in Temis. Each activity levels its own seven-point tree, and since Season 15 the points are shared across your characters in the same Seasonal/Hardcore partition (each character still picks its own layout). The order below is Maxroll's (updated Oct 14, 2026); where ConsolePulse disagrees, its version is under the path.</p></div>
    <div class="panel"><h3>Pick the plan for what you farm now</h3>
      <div class="table-scroll" style="border:0"><table>
        <thead><tr><th>Goal</th><th>Activities</th><th>Prime Evil bonus</th><th>Key node</th></tr></thead>
        <tbody>
          <tr><td><b>Mythics and keys</b></td><td>Lair Bosses, Helltide, Infernal Hordes, Pit, Nightmare Dungeons</td><td>Baal favours Lair Bosses</td><td>Helltide <b>Writhe and Rot</b> for extra lair keys</td></tr>
          <tr><td><b>Glyph levels</b></td><td>Pit first</td><td>Mephisto boosts Choron's Blessing</td><td>Pit <b>Choron's Haste</b> and <b>Choron's Blessing</b></td></tr>
          <tr><td><b>XP and alts</b></td><td>Undercity, Lair Bosses, Tree of Whispers</td><td>Baal adds Jade Epiphany orbs</td><td>Whispers <b>Wisdom of Whispers</b> (+50% XP orbs from caches)</td></tr>
          <tr><td><b>Charms</b></td><td>Infernal Hordes, Undercity</td><td>Diablo (Splinter of Terror)</td><td>Hordes <b>Council Coffers</b></td></tr>
        </tbody></table></div>
      <p class="note">Prime Evil pairings come from ConsolePulse only. You can reset a plan up to 3 times.</p>
    </div>
    <div class="tree-grid">${TREES.map((t) => `<article class="tree">
      <div class="tree-head"><h3>${esc(t.name)}</h3><span class="tag">${esc(t.goal)}</span></div>
      <ol class="path">${t.path.map(([n, d]) => `<li><div><b>${esc(n)}</b>${d ? ` <span>· ${esc(d)}</span>` : ""}</div></li>`).join("")}</ol>
      <p class="note">${esc(t.alt)}</p></article>`).join("")}</div>
  </section>`;
}

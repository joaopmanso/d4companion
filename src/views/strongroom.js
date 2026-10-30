import { esc } from "../lib/dom.js";
import { TESTS } from "../data/activities.js";

const TIER_LABEL = { s: "S", a: "A", b: "B", x: "Skip" };

export function render(root) {
  if (root.dataset.ready) return;
  root.dataset.ready = "1";
  root.innerHTML = `<section class="view">
    <div class="view-head"><h2>Horadric Strongroom tests</h2><p>You have 100 seconds to build Attunement, then a boss opens a cache sized to it. Base Attunement per kill: normal 4, champion 8, elite 20, special demon 500. No guide ranks the tests, so these tiers are our reasoning for a fast-clearing build.</p></div>
    <div class="table-scroll"><table>
      <thead><tr><th>Tier</th><th>Test</th><th>Effect</th><th>Why</th></tr></thead>
      <tbody>${TESTS.map(([t, n, fx, why]) => `<tr><td><span class="tier ${t}">${TIER_LABEL[t]}</span></td><td><b>${esc(n)}</b></td><td>${esc(fx)}</td><td class="note">${esc(why)}</td></tr>`).join("")}</tbody>
    </table></div>
  </section>`;
}

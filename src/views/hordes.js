import { $, esc } from "../lib/dom.js";
import { OFFERS, OFFER, SPIRE_MULT, scoreOffer } from "../data/activities.js";

// The current Hordes run is per browser, not per character.
const KEY = "d4c.hordes-run";
let run = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } })();
const saveRun = () => { try { localStorage.setItem(KEY, JSON.stringify(run)); } catch { /* ignore */ } };
const short = (id) => OFFER[id]?.name.replace(/^The /, "") || id;

export function render(root) {
  if (root.dataset.ready) return;
  root.dataset.ready = "1";
  const opts = `<option value="">Choose…</option>` + OFFERS.slice().sort((a, b) => a.name.localeCompare(b.name)).map((o) => `<option value="${o.id}">${esc(short(o.id))}</option>`).join("");
  root.innerHTML = `<section class="view">
    <div class="view-head"><h2>Hordes picker</h2><p>Enter the three Infernal Offers you're shown. The picker ranks them from Maxroll's order and adjusts for what you already took this run. Your run is kept in this browser only.</p></div>
    <div class="hordes">
      <div class="panel">
        <div class="row" style="justify-content:space-between"><h3>This run</h3><button class="btn ghost" id="run-reset">New run</button></div>
        <div class="picks" id="run-picks"></div>
        <p class="note" id="run-plan"></p>
        <div class="field"><label class="label" for="run-add">Add a pick by hand</label><select id="run-add">${opts}</select></div>
        <div class="slot-next"><span class="label">After the last wave</span>
          <p>Spend on <b>Bartuc</b> at 666 (Hand of Apotheosis). Below that, <b>Greater Equipment</b> at 400. With Council Coffers, open the <b>Chest of Talismans</b> for set charms. Materials and Gold eat everything left, so open them last.</p></div>
      </div>
      <div class="panel">
        <h3>Offers now</h3>
        <div class="offer-row">${[1, 2, 3].map((i) => `<select id="offer-${i}" aria-label="Offer ${i}">${opts}</select>`).join("")}</div>
        <div class="verdicts" id="verdicts"></div>
      </div>
    </div>
  </section>`;

  const offers = () => [1, 2, 3].map((i) => $(`#offer-${i}`, root));
  function renderRun() {
    $("#run-picks", root).innerHTML = run.length
      ? run.map((id, i) => `<span class="pick">${esc(short(id))}<button aria-label="Remove ${esc(short(id))}" data-rm="${i}">×</button></span>`).join("")
      : `<span class="note">No picks yet. Take your first offer from the right.</span>`;
    const lords = run.includes("colossal"), puff = run.includes("puffing"), spires = SPIRE_MULT.some((x) => run.includes(x));
    $("#run-plan", root).textContent = lords ? "Plan: Lords. Look for Fiendish Legions, Teeming Masses, Ruthless Lords, Exalted Fiends."
      : puff ? "Plan: Masses. Every Mass offering adds +2 per Mass; take Colossal Fiends the moment it shows."
      : spires ? "Plan: Spires. Stack Precious, Treasured, Coveted; Anchored Masses feeds them."
      : "Plan: take Colossal Fiends whenever it appears. Until then, Puffing Masses early or a Spire multiplier.";
  }
  function renderVerdicts() {
    const ids = offers().map((s) => s.value).filter(Boolean);
    const box = $("#verdicts", root);
    if (!ids.length) { box.innerHTML = `<p class="note">Example: with Colossal Fiends taken, Fiendish Legions beats Precious Spires and Wrath of Hell. Pick the three offers you see to rank them.</p>`; return; }
    box.innerHTML = ids.map((id) => scoreOffer(id, run)).sort((a, b) => b.score - a.score).map((r, i) => {
      const o = OFFER[r.id];
      const tag = i === 0 ? `<span class="tag take">Take this</span>` : r.score < 30 ? `<span class="tag skip">Skip</span>` : `<span class="tag">Second choice</span>`;
      return `<div class="verdict${i === 0 ? " best" : ""}"><div class="verdict-top"><span class="verdict-name">${esc(o.name)}</span>${tag}</div>
        <p class="note">${esc(o.fx)}</p><ul>${r.why.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>
        <div class="row"><button class="btn ${i === 0 ? "primary" : "ghost"}" data-take="${r.id}">${i === 0 ? "I took it" : "I took this one instead"}</button></div></div>`;
    }).join("");
  }
  const addPick = (id) => { if (!id) return; run.push(id); saveRun(); offers().forEach((s) => { s.value = ""; }); renderRun(); renderVerdicts(); };
  offers().forEach((s) => s.addEventListener("change", renderVerdicts));
  $("#verdicts", root).addEventListener("click", (e) => { const b = e.target.closest("[data-take]"); if (b) addPick(b.dataset.take); });
  $("#run-add", root).addEventListener("change", (e) => { addPick(e.target.value); e.target.value = ""; });
  $("#run-picks", root).addEventListener("click", (e) => { const b = e.target.closest("[data-rm]"); if (!b) return; run.splice(Number(b.dataset.rm), 1); saveRun(); renderRun(); renderVerdicts(); });
  $("#run-reset", root).addEventListener("click", () => { run = []; saveRun(); renderRun(); renderVerdicts(); });
  renderRun();
  renderVerdicts();
}

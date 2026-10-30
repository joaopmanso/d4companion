// Guide browser: class tabs, the Season tier list (S → C, then unranked builds), build cards and their
// variants. Used to create a character (pick class, build and variant, then name it) and to change an
// existing character's guide (class fixed).
import { esc } from "../lib/dom.js";
import { CLASSES, emblem } from "../data/classes.js";

const TIER_ORDER = ["S", "A", "B", "C", "D"];

// Builds of one class from the index, grouped by guide (URL) and ordered by tier.
export function buildsFor(index, className) {
  const byUrl = new Map();
  for (const g of index.guides.filter((x) => x.className === className)) {
    const key = g.url.replace(/\?.*$/, "");
    if (!byUrl.has(key)) byUrl.set(key, { key, name: g.short || g.build, title: g.build, tier: g.tier || "", icon: g.icon, url: key, variants: [] });
    byUrl.get(key).variants.push(g);
  }
  return [...byUrl.values()].sort((a, b) => (TIER_ORDER.indexOf(a.tier) + 1 || 9) - (TIER_ORDER.indexOf(b.tier) + 1 || 9) || a.name.localeCompare(b.name));
}

export function pickerHtml({ index, className, currentId, lockClass, open }) {
  const builds = buildsFor(index, className);
  const current = index.guides.find((g) => g.id === currentId);
  const openKey = open ?? current?.url.replace(/\?.*$/, "");
  const groups = new Map();
  for (const b of builds) { const t = b.tier || "Unranked"; if (!groups.has(t)) groups.set(t, []); groups.get(t).push(b); }
  const tabs = lockClass ? "" : `<div class="gp-classes" role="tablist">${CLASSES.map((c) => {
    const n = buildsFor(index, c).length;
    return `<button type="button" role="tab" class="gp-class" data-class="${c}" aria-selected="${c === className}"><img src="${esc(emblem(c))}" alt="">${c}<small>${n ? `${n} builds` : "not synced yet"}</small></button>`;
  }).join("")}</div>`;
  const body = builds.length ? [...groups].map(([tier, list]) => `<div class="gp-tier"><div class="gp-tier-label t-${esc(tier)}">${esc(tier)}</div>
      <div class="gp-builds">${list.map((b) => `<div class="gp-build${b.key === openKey ? " open" : ""}">
        <button type="button" class="gp-card" data-build="${esc(b.key)}" aria-expanded="${b.key === openKey}">
          ${b.icon ? `<img src="${esc(b.icon)}" alt="">` : ""}<span><b>${esc(b.name)}</b><small>${b.variants.length} variant${b.variants.length > 1 ? "s" : ""}</small></span>
        </button>
        ${b.key === openKey ? `<div class="gp-variants">${b.variants.map((v) => `<button type="button" class="gp-variant${v.id === currentId ? " current" : ""}" data-guide="${esc(v.id)}">${esc(v.variant)}<small>${esc(v.updated || "")}</small></button>`).join("")}
          <a class="note" href="${esc(b.url)}" target="_blank" rel="noopener">Read it on ${esc(b.variants[0].site)} ↗</a></div>` : ""}
      </div>`).join("")}</div></div>`).join("")
    : `<p class="note">No ${esc(className)} guides synced yet. They arrive with the next daily sync.</p>`;
  const tierNote = index.tiers?.length ? `<p class="note">Tiers are d4builds' Season tier list; unranked builds have a guide but aren't on it.</p>` : "";
  return `${tabs}<div class="gp-list">${body}</div>${tierNote}
    <div class="gp-other"><span class="label">Other guide sites</span>${(index.links || []).map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener" title="${esc(l.note)}">${esc(l.site)} ↗</a>`).join("")}</div>`;
}

// Modal version for "Change guide". Resolves with the chosen guide id, or null.
export function openGuideDialog({ index, className, currentId }) {
  return new Promise((resolve) => {
    const dlg = document.createElement("dialog");
    dlg.className = "gp-dialog";
    let open;
    const paint = () => {
      dlg.innerHTML = `<div class="gp-head"><h2>${esc(className)} guides</h2><button type="button" class="btn ghost" data-close>Close</button></div>
        <p class="note">Pick the build you're playing now, then its variant. Your gear stays; it's just compared with the new guide.</p>
        ${pickerHtml({ index, className, currentId, lockClass: true, open })}`;
    };
    paint();
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg || e.target.closest("[data-close]")) { dlg.close(); return; }
      const b = e.target.closest("[data-build]");
      if (b) { open = open === b.dataset.build ? "" : b.dataset.build; paint(); return; }
      const g = e.target.closest("[data-guide]");
      if (g) { resolve(g.dataset.guide); dlg.close(); }
    });
    dlg.addEventListener("close", () => { dlg.remove(); resolve(null); });
    document.body.appendChild(dlg);
    dlg.showModal();
  });
}

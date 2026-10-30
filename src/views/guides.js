import { esc } from "../lib/dom.js";
import { LINKS } from "../data/activities.js";

const card = ([site, title, desc, url]) => `<a class="link" href="${esc(url)}" target="_blank" rel="noopener"><span class="link-site">${esc(site)}</span><b>${esc(title)}</b><span class="link-desc">${esc(desc)}</span></a>`;

export function render(root, { build, index }) {
  const others = (index?.links || []).map((l) => [l.site, l.title, l.note, l.url]);
  const general = LINKS.filter(([, , , url]) => !/d4builds\.gg\/builds|maxroll\.gg\/d4\/build-guides/.test(url));
  root.innerHTML = `<section class="view view-sources">
    <div class="view-head"><h2>Sources</h2><p>Guide data is synced daily from d4builds.gg. Other guide sites can't be synced, so they're linked here and in the Guide menu.</p></div>
    <div class="panel src-mine"><h3>Your guide</h3>
    <div class="links mine">${card([build.guide.site, `${build.name}: ${build.variant}`, `Updated ${build.guide.updated || "?"}, synced ${build.guide.checked}`, build.guide.url])}</div></div>
    <div class="two-col src-more">
      <div class="panel"><h3>Other guide sites</h3><div class="links">${others.map(card).join("")}</div></div>
      <div class="panel"><h3>Reference</h3><div class="links">${general.map(card).join("")}</div></div>
    </div>
    <p class="note">Item, skill and Paragon art comes from sunderarmor.com and diablofilter.com. Warlock key art and Diablo IV are © Blizzard Entertainment; this is an unofficial fan tool.</p>
  </section>`;
}

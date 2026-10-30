import { esc } from "../lib/dom.js";
import { LINKS } from "../data/activities.js";

export function render(root, { build }) {
  const links = [...build.links, ...LINKS.filter(([, , , url]) => !build.links.some((l) => l[3] === url))];
  root.innerHTML = `<section class="view">
    <div class="view-head"><h2>Guides and sources</h2><p>The pages this companion is built from. ${esc(build.guide.site)} is the main guide for ${esc(build.name)}; the others fill in stat targets, drop tables and activities.</p></div>
    <div class="links">${links.map(([site, title, desc, url]) => `<a class="link" href="${esc(url)}" target="_blank" rel="noopener"><span class="label">${esc(site)}</span><b>${esc(title)}</b><span>${esc(desc)}</span></a>`).join("")}</div>
    <p class="note">Item art and skill icons come from diablofilter.com and sunderarmor.com. Diablo IV and its art are © Blizzard Entertainment; this is an unofficial fan tool.</p>
  </section>`;
}

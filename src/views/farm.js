// Farm guide: for every piece the build needs, the best way to get it, and whether the character already has it.
import { esc } from "../lib/dom.js";
import { SOURCES, KIND_LABEL } from "../data/sources.js";
import { SLOT } from "../data/slots.js";
import { isGuideItem } from "../evaluate.js";

let filter = "todo";

const slug = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Items with no hand-checked route yet still get a card that points to their drop source.
const unknown = (name, rarity) => ({
  name, rarity, routes: [{ kind: "world", label: "No route on file yet", steps: [`Check where ${name} drops on diablofilter.com/items/${slug(name)}.`] }],
});

function targets(char, build) {
  const out = [];
  for (const [slotId, t] of Object.entries(build.slots)) {
    const src = SOURCES[t.item.source] || unknown(t.item.name, t.item.rarity || "legendary");
    const g = char.gear[slotId];
    const have = isGuideItem(g, t);
    const mythicNeeded = (src.rarity === "mythic" || t.item.rarity === "mythic") && g?.rarity !== "mythic" && t.item.type !== "aspect";
    out.push({ key: t.item.source || slug(t.item.name), src, art: t.item.art || "", where: SLOT[slotId].name, have: have && !mythicNeeded,
      status: !have ? "Not yet" : mythicNeeded ? "You have the Unique; farm the Mythic" : "Have it" });
  }
  const sockets = Object.values(build.slots).flatMap((s) => s.sockets || []);
  const splinters = [...new Set(sockets.filter((s) => /^splinter/i.test(s)))];
  const charms = build.talisman?.charms || [];
  const extra = [];
  if (splinters.length) extra.push(["splinters", Object.values(build.slots).map((s) => s.socketArt?.[splinters[0]]).find(Boolean) || "", splinters.join(", ")]);
  if (build.runes?.length) extra.push(["runes", build.runes[0].art, build.runes.map((r) => r.name).join(", ")]);
  if (charms.some((c) => c.set)) extra.push(["set-charms", charms.find((c) => c.set).art, [...new Set(charms.filter((c) => c.set).map((c) => c.set))].join(", ")]);
  if (build.talisman?.seal) extra.push([SOURCES[slug(build.talisman.seal.name)] ? slug(build.talisman.seal.name) : null, build.talisman.seal.art, "Talisman seal", build.talisman.seal.name]);
  for (const c of charms.filter((c) => c.mythic)) extra.push([SOURCES[slug(c.name)] ? slug(c.name) : null, c.art, "Talisman charm", c.name]);
  for (const [key, art, where, name] of extra) out.push({ key, src: SOURCES[key] || unknown(name, "mythic"), art, where, have: false, status: "" });
  return out;
}

export function render(root, { char, build }) {
  const list = targets(char, build);
  const shown = list.filter((t) => filter === "all" || !t.have);
  const kinds = [...new Set(list.flatMap((t) => t.src.routes.filter((r) => r.best).map((r) => r.kind)))];
  root.innerHTML = `<section class="view">
    <div class="view-head"><h2>Farm guide</h2><p>Where every piece of ${esc(build.name)} comes from this season and the fastest way to get it, best route first. Items ${esc(char.name)} already wears in the guide's version are hidden unless you show all.</p></div>
    <div class="filters">
      <button class="btn ghost" data-f="todo" aria-pressed="${filter === "todo"}">Still to farm (${list.filter((t) => !t.have).length})</button>
      <button class="btn ghost" data-f="all" aria-pressed="${filter === "all"}">Everything (${list.length})</button>
      <span class="note">Best routes use: ${kinds.map((k) => `<span class="kind ${k}">${esc(KIND_LABEL[k])}</span>`).join(" ")}</span>
    </div>
    <div class="farm-list">${shown.map(({ src, art, where, have, status }) => `<article class="panel farm-card">
      <span class="ico t-${src.rarity === "set" ? "set" : src.rarity}">${art ? `<img class="art" src="${esc(art)}" alt="">` : ""}</span>
      <div style="display:grid;gap:8px;min-width:0">
        <h3><span class="r-${src.rarity}">${esc(src.name)}</span><small>${esc(where)}</small>${have ? `<span class="have">Have it</span>` : status ? `<small>${esc(status)}</small>` : ""}</h3>
        ${src.power ? `<p class="note">${esc(src.power)}</p>` : ""}
        <div class="routes">${src.routes.map((r) => `<div class="route${r.best ? " best" : ""}">
          <div class="route-top"><span class="kind ${r.kind}">${esc(KIND_LABEL[r.kind])}</span><b>${esc(r.label)}</b>${r.best ? `<span class="tag take">Best</span>` : ""}</div>
          <ul>${r.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div>`).join("")}</div>
        ${src.note ? `<p class="note">${esc(src.note)}</p>` : ""}
      </div></article>`).join("") || `<p class="note">Everything in the guide is already equipped. Show everything to see the routes anyway.</p>`}</div>
    <div class="two-col">
      <div class="panel"><h3>Ways to get any Mythic</h3><ul>
        <li><b>Belial hoard:</b> choose the pool of the item you want. The fastest targeted route once you clear Belial.</li>
        <li><b>Echo of Mephisto</b> with a Crux of the False Prophet: one guaranteed Mythic.</li>
        <li><b>Baal, Worldstone Keep (Hell):</b> no key; also drops Leoric's Crown and Stone of Jordan.</li>
        <li><b>Jeweler:</b> pick a slot, get a random Mythic for it. Resplendent Sparks plus runes.</li>
        <li><b>Horadric Cube:</b> upgrades your exact Unique into its Mythic, keeping affixes. One Crafted Mythic per character.</li>
      </ul></div>
      <div class="panel"><h3>Keys and materials</h3><ul>
        <li><b>Boss lair keys:</b> War Plan rewards; Helltide's Writhe and Rot node adds extra keys.</li>
        <li><b>Crux of the False Prophet:</b> Greater Lair Bosses at T10+; sometimes Whisper key caches.</li>
        <li><b>Resplendent Sparks:</b> Season ranks, Mythic caches, salvaging Mythics.</li>
        <li><b>Cinders:</b> Helltide kills; spend them on the Tortured Gift chests for slot-targeted bases.</li>
      </ul></div>
    </div>
  </section>`;
  root.querySelectorAll("[data-f]").forEach((b) => b.addEventListener("click", () => { filter = b.dataset.f; render(root, { char, build }); }));
}

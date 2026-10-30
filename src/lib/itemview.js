// Shared item rendering: art lookup and the tooltip with each line marked good, bad or neutral for the build.
// Art is linked from the guide site; an item with no known art shows the slot's plain base icon.
import { esc, tipCard, rarityOf, RARITY_LABEL } from "./dom.js";
import { SLOT, BASE_ART } from "../data/slots.js";
import { affixLabel } from "../data/affixes.js";

// Only for items the player has: art by exact name from the guide or the class catalog.
export function itemArt(item, slotId, build) {
  if (item?.name) {
    const cat = build?.catalog?.items?.[item.name];
    if (cat?.art) return cat.art;
    for (const t of Object.values(build?.slots || {})) if (t.item.type !== "aspect" && t.item.name.toLowerCase() === item.name.toLowerCase() && t.item.art) return t.item.art;
  }
  return BASE_ART[SLOT[slotId]?.kind] || BASE_ART.weapon;
}

// Ancestral items glow white in game; the glow is the .ico.ancestral class, this only labels it.
export const ancestralBadge = (item) => (item?.ancestral ? `<span class="sr">Ancestral</span>` : "");

export function affixListHtml(lines, { why = false } = {}) {
  if (!lines?.length) return "";
  return `<ul class="gt-aff">${lines.map((l) => {
    const cls = [l.status, l.kind === "temper" ? "temper" : "", l.reroll ? "reroll" : ""].join(" ");
    const tags = [l.ga ? `<span class="ga-star" title="Greater Affix">★</span>` : "", l.kind === "temper" ? `<span class="tag">Temper</span>` : "", l.enchanted ? `<span class="tag">Enchanted</span>` : "", l.reroll ? `<span class="tag">Reroll this</span>` : ""].join("");
    const label = l.key ? "" : ` <span class="why">(not recognised; fix the text if it's wrong)</span>`;
    return `<li class="${cls}"><span>${tags} ${esc(l.text)}${label}${why && l.note ? `<span class="why">${esc(l.note)}</span>` : ""}</span></li>`;
  }).join("")}</ul>`;
}

export function typeLine(item, slotId, { html = false } = {}) {
  const r = rarityOf(item);
  if (r === "unknown") return `${SLOT[slotId].noun}, not recorded`;
  const anc = item.ancestral ? (html ? `<span class="anc-text">Ancestral</span> ` : "Ancestral ") : "";
  return `${anc}${item.crafted ? "Crafted " : ""}${RARITY_LABEL[r]} ${esc(SLOT[slotId].noun)}${item.itemPower ? `, ${item.itemPower} Item Power` : ""}`;
}

export function itemTip(item, slotId, build, ev, { why = false, foot = "" } = {}) {
  const r = rarityOf(item);
  const sockets = item.sockets?.length ? `<p class="gt-next">Sockets: ${esc(item.sockets.join(", "))}</p>` : "";
  const mw = item.masterwork ? `<p class="gt-next">${esc(item.masterwork)}</p>` : "";
  const power = [item.power, item.aspect].filter(Boolean).map(esc).join(" ");
  return tipCard({
    name: item.name || "Unnamed item", typeHtml: typeLine(item, slotId, { html: true }), r: r === "unknown" ? "unknown" : r,
    art: itemArt(item, slotId, build), ancestral: !!item.ancestral,
    lines: affixListHtml(ev?.lines || item.affixes.map((a) => ({ ...a, status: "neutral" })), { why }),
    power, body: sockets + mw, foot,
  });
}

export const wantedList = (target) => target.affixes.map(affixLabel).join(", ");

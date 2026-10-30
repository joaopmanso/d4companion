// The editable item form, shared by the item check (to fix what was read) and the loadout (to edit by hand).
import { esc } from "./dom.js";
import { AFFIXES, matchAffix } from "../data/affixes.js";
import { SLOTS } from "../data/slots.js";

const RARITIES = ["mythic", "unique", "legendary", "rare", "magic"];
const KINDS = [["affix", "Affix"], ["temper", "Temper"], ["implicit", "Base stat"]];

function affixRow(a = { text: "", kind: "affix", ga: false }) {
  return `<div class="aff-row">
    <input type="text" data-f="text" value="${esc(a.text)}" placeholder="+12.5% Critical Strike Damage" aria-label="Affix line">
    <select data-f="kind" aria-label="Line type">${KINDS.map(([v, l]) => `<option value="${v}"${a.kind === v ? " selected" : ""}>${l}</option>`).join("")}</select>
    <label title="Greater Affix (star icon)"><input type="checkbox" data-f="ga"${a.ga ? " checked" : ""}> GA</label>
    <button type="button" class="x" data-rm aria-label="Remove line">×</button>
  </div>`;
}

export function itemFormHtml(item, { slotId, showSlot = true } = {}) {
  return `<div class="review">
    <div class="row2">
      <div class="field"><label class="label" for="f-name">Name</label><input id="f-name" value="${esc(item.name)}"></div>
      ${showSlot ? `<div class="field"><label class="label" for="f-slot">Slot</label><select id="f-slot">${SLOTS.map((s) => `<option value="${s.id}"${s.id === slotId ? " selected" : ""}>${s.name}</option>`).join("")}</select></div>` : ""}
      <div class="field"><label class="label" for="f-rarity">Rarity</label><select id="f-rarity">${RARITIES.map((r) => `<option value="${r}"${item.rarity === r ? " selected" : ""}>${r[0].toUpperCase() + r.slice(1)}</option>`).join("")}</select></div>
      <div class="field"><label class="label" for="f-ip">Item Power</label><input id="f-ip" inputmode="numeric" value="${esc(item.itemPower ?? "")}"></div>
    </div>
    <label class="radio"><input type="checkbox" id="f-anc"${item.ancestral ? " checked" : ""}> Ancestral</label>
    <div class="field">
      <span class="label">Affixes, tempers and base stats</span>
      <div class="aff-edit" id="f-affixes">${(item.affixes || []).map(affixRow).join("")}</div>
      <div class="row"><button type="button" class="btn ghost" id="f-add">Add a line</button><span class="note">GA = Greater Affix. Tempers are the lines with the hammer icon.</span></div>
    </div>
    <div class="field"><label class="label" for="f-power">Unique power or aspect text</label><textarea id="f-power" rows="2">${esc(item.power || item.aspect || "")}</textarea></div>
    <div class="field"><label class="label" for="f-sockets">Sockets (comma separated)</label><input id="f-sockets" value="${esc((item.sockets || []).join(", "))}" placeholder="Splinter of Anguish, Ruby"></div>
  </div>`;
}

export function bindItemForm(root, onChange) {
  root.addEventListener("click", (e) => {
    if (e.target.closest("#f-add")) { root.querySelector("#f-affixes").insertAdjacentHTML("beforeend", affixRow()); onChange?.(); }
    const rm = e.target.closest("[data-rm]");
    if (rm) { rm.closest(".aff-row").remove(); onChange?.(); }
  });
  root.addEventListener("input", () => onChange?.());
  root.addEventListener("change", () => onChange?.());
}

export function readItemForm(root, base = {}) {
  const v = (id) => root.querySelector(id)?.value.trim() ?? "";
  const power = v("#f-power");
  const rarity = v("#f-rarity") || "legendary";
  const affixes = [...root.querySelectorAll(".aff-row")].map((r) => {
    const text = r.querySelector('[data-f="text"]').value.trim();
    const prev = (base.affixes || []).find((a) => a.text === text);
    return { text, key: matchAffix(text) || prev?.key || null, kind: r.querySelector('[data-f="kind"]').value, ga: r.querySelector('[data-f="ga"]').checked, enchanted: prev?.enchanted || /enchant/i.test(text) };
  }).filter((a) => a.text);
  return {
    ...base,
    name: v("#f-name"),
    rarity,
    ancestral: root.querySelector("#f-anc")?.checked || false,
    itemPower: Number(v("#f-ip")) || null,
    affixes,
    power: rarity === "legendary" ? "" : power,
    aspect: rarity === "legendary" ? power : "",
    sockets: v("#f-sockets").split(",").map((s) => s.trim()).filter(Boolean),
    slot: root.querySelector("#f-slot")?.value || base.slot,
  };
}

export const KNOWN_AFFIXES = AFFIXES.map((a) => a.label);

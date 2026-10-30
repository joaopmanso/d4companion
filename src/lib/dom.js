export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const RARITY_LABEL = { mythic: "Mythic Unique", unique: "Unique", legendary: "Legendary", rare: "Rare", magic: "Magic", common: "Common", set: "Set" };
export const rarityOf = (item) => (item && RARITY_LABEL[item.rarity] ? item.rarity : "unknown");

// The game's tooltip frame: name, type line, art, then sections split by ornate rules.
export function tipCard({ name, type = "", r = "unknown", art = "", lines = "", power = "", body = "", foot = "" }) {
  const icon = art ? `<div class="ico t-${r}"><img class="art" src="${esc(art)}" alt=""></div>` : "";
  return `<div class="gt t-${r}">
    <div class="gt-head"><div><div class="gt-name r-${r}">${esc(name)}</div><div class="gt-type r-${r}">${esc(type)}</div></div>${icon}</div>
    ${lines ? `<div class="gt-rule"></div>${lines}` : ""}
    ${power ? `<div class="gt-rule"></div><p class="gt-power">${power}</p>` : ""}
    ${body ? `<div class="gt-rule"></div>${body}` : ""}
    ${foot ? `<p class="gt-foot">${foot}</p>` : ""}
  </div>`;
}

// A tooltip card from a guide site's plain tooltip text: first line is the name, a short second line
// naming a type becomes the type line, "+…" stat lines become affixes and the rest is body text.
export function tipFromText(text, { name, art = "", r, foot = "" } = {}) {
  const lines = String(text || "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return tipCard({ name: name || "", r: r || "unknown", art, foot: foot || "No details from the guide site." });
  const title = lines.shift();
  const typeRe = /(unique|mythic|legendary|rare|magic|set|charm|seal|rune|gem|splinter|skill|power|node|glyph|basic|core|ultimate|passive)/i;
  const type = lines[0] && lines[0].length < 48 && typeRe.test(lines[0]) ? lines.shift() : "";
  const rr = r || (/mythic/i.test(type) ? "mythic" : /unique/i.test(type) ? "unique" : /legendary/i.test(type) ? "legendary" : /rare/i.test(type) ? "rare" : /magic/i.test(type) ? "magic" : /set/i.test(type) ? "set" : "unknown");
  const stats = lines.filter((l) => /^[+×x-]?\s*[\d.,]+%?\s/.test(l) && l.length < 60);
  const prose = lines.filter((l) => !stats.includes(l));
  return tipCard({
    name: name || title, type, r: rr, art,
    lines: stats.length ? `<ul class="gt-aff">${stats.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : "",
    power: prose.map(esc).join("<br>"),
    foot,
  });
}

// One floating card shared by every hoverable thing. `content(el)` returns HTML for the element.
export function hoverCards(root, selector, content) {
  const card = document.createElement("div");
  card.className = "hovercard";
  card.setAttribute("role", "tooltip");
  document.body.appendChild(card);
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  let owner = null;

  const place = (el) => {
    const b = el.getBoundingClientRect();
    const w = card.offsetWidth, h = card.offsetHeight;
    const rightX = b.right + 12, leftX = b.left - w - 12;
    let x = rightX + w <= innerWidth - 8 ? rightX : leftX >= 8 ? leftX : Math.max(8, Math.min(b.left, innerWidth - w - 8));
    let y = Math.max(8, Math.min(b.top, innerHeight - h - 8));
    if (x === Math.max(8, Math.min(b.left, innerWidth - w - 8))) y = b.bottom + 8 + h <= innerHeight ? b.bottom + 8 : Math.max(8, b.top - h - 8);
    card.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  };
  const show = async (el) => {
    owner = el;
    const html = await content(el);
    if (owner !== el || !html) return;
    card.innerHTML = html;
    card.classList.add("on");
    place(el);
  };
  const hide = () => { owner = null; card.classList.remove("on"); };

  root.addEventListener("mouseover", (e) => { const el = e.target.closest(selector); if (el && fine.matches && el !== owner) show(el); });
  root.addEventListener("mouseout", (e) => { const el = e.target.closest(selector); if (el && !el.contains(e.relatedTarget)) hide(); });
  root.addEventListener("focusin", (e) => { const el = e.target.closest(selector); if (el) show(el); });
  root.addEventListener("focusout", hide);
  addEventListener("scroll", hide, { passive: true });
  return { hide };
}

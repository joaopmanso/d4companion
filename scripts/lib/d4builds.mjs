// d4builds.gg: reads every variant of a guide from the rendered page (robots.txt allows /builds/).
// Per variant: gear, gems/runes, talisman, gear stats, skill bar, Prime Evil powers, Soul Shard,
// skill-tree allocation and Paragon boards. Per class (once, cached): the full skill tree layout and
// every tile of every Paragon board seen, with tooltip text, so the site can draw them.
import { pause, hoverText } from "./browser.mjs";

const SLOT_NAMES = { Helm: "helm", "Chest Armor": "chest", Gloves: "gloves", Pants: "pants", Boots: "boots", Weapon: "weapon", Offhand: "offhand", Amulet: "amulet", "Ring 1": "ring1", "Ring 2": "ring2" };

async function open(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector(".builder__gear__name", { timeout: 60000 });
  await pause(1200);
}

async function tab(page, name) {
  await page.evaluate((n) => [...document.querySelectorAll(".builder__navigation__link")].find((e) => e.textContent.trim() === n)?.click(), name);
  await pause(1500);
}

export async function variantCount(page, url) {
  await open(page, url);
  await page.click(".build-variant-dropdown .dropdown__button").catch(() => {});
  await pause(500);
  const n = await page.evaluate(() => document.querySelectorAll(".build-variant-dropdown .dropdown__option").length);
  return Math.max(1, n);
}

function readGearTab() {
  const txt = (el) => el?.innerText?.trim() || "";
  const out = { title: txt(document.querySelector(".builder__header__description")) || txt(document.querySelector(".builder__header__name")), variant: document.querySelector(".builder__variant__input")?.value || "", updated: "", author: "" };
  const upd = [...document.querySelectorAll("*")].find((e) => e.children.length === 0 && /^Updated on /.test(e.textContent.trim()));
  out.updated = upd ? upd.textContent.trim().replace(/^Updated on\s*/, "").replace(/\.$/, "") : "";
  const by = [...document.querySelectorAll("*")].find((e) => e.children.length === 0 && e.textContent.trim() === "Created By");
  out.author = by ? txt(by.parentElement).replace("Created By", "").trim() : "";

  out.gear = [...document.querySelectorAll(".builder__gear__item")].map((i) => {
    const name = i.querySelector(".builder__gear__name");
    if (!name) return null;
    return {
      slot: txt(i.querySelector(".builder__gear__slot")),
      name: txt(name),
      rarity: (name.className.match(/--(\w+)/) || [])[1] || "legendary",
      img: i.querySelector(".builder__gear__icon img")?.src || "",
      sockets: [...i.querySelectorAll(".builder__gems__item img")].map((g) => ({ name: g.alt, img: g.src })),
    };
  }).filter(Boolean);

  const runesTitle = [...document.querySelectorAll(".builder__gems__title")].find((e) => e.textContent.trim() === "Active Runes");
  out.runes = runesTitle ? [...runesTitle.parentElement.querySelectorAll(".builder__gems__item img")].map((g) => ({ name: g.alt, img: g.src })) : [];

  const seal = document.querySelector(".builder__seal.active .builder__seal__icon");
  out.talisman = {
    seal: seal ? { img: seal.src } : null,
    charms: [...document.querySelectorAll(".builder__charm.active .builder__charm__icon")].map((c) => ({ name: c.alt, img: c.src, pos: c.closest(".builder__charm").className.replace(/builder__charm|active/g, "").trim() })),
  };
  out.skillBar = [...document.querySelectorAll(".builder__skills__list .build__skill__wrapper img")].filter((s) => /\/Skills\//.test(s.src)).map((s) => ({ name: s.alt, img: s.src }));
  out.prime = [...document.querySelectorAll(".builder__prime__power.active")].map((p) => ({ name: p.querySelector("img")?.alt || txt(p), img: p.querySelector("img")?.src || "", main: p.className.includes("--main") }));
  const boons = [...document.querySelectorAll(".builder__skills__boons")];
  out.soulShard = boons.map((g) => {
    const cat = g.querySelector(".builder__skills__boon.category");
    const picked = [...g.children].map((c, i) => [c, i]).filter(([c]) => !c.classList.contains("category") && /selected|active/.test(c.className));
    return cat && /selected|active/.test(cat.className + [...cat.querySelectorAll("img")].map((x) => x.className).join(" ")) && picked.length
      ? { shard: cat.querySelector(".builder__skills__boon__icon")?.alt || "", options: picked.map(([, i]) => i) } : null;
  }).filter(Boolean);

  // Gear Stats: per slot a title, then stat lines; lines with "(…)" are temper recipes.
  const sec = document.querySelector(".builder__stats__section");
  const lines = sec ? sec.innerText.split("\n").map((l) => l.trim()).filter(Boolean) : [];
  const stats = {};
  let cur = null;
  const SLOTS = ["Weapon", "Pants", "Offhand", "Ring 1", "Chest Armor", "Ring 2", "Amulet", "Boots", "Gloves", "Helm"];
  for (const l of lines) {
    if (l === "Gear Stats" || l === "Transfigure") continue;
    if (SLOTS.includes(l)) { cur = stats[l] = { affixes: [], tempers: [], aspects: [] }; continue; }
    if (!cur) continue;
    const m = l.match(/^(.*?)\s*\((.+)\)$/);
    if (m) cur.tempers.push([m[1], m[2]]);
    else if (/aspect$/i.test(l)) cur.aspects.push(l);
    else cur.affixes.push(l);
  }
  out.stats = stats;
  return out;
}

function readTree(withLayout) {
  const nodes = [...document.querySelectorAll(".viewer-canvas .viewer-node")].map((n) => {
    const left = parseFloat(n.style.left), top = parseFloat(n.style.top);
    const icon = n.querySelector(".node-icon, .category-icon");
    const badge = n.querySelector(".node-rank-badge")?.textContent.trim() || "";
    const [pts, max] = badge.split("/").map(Number);
    const kind = n.classList.contains("category") ? "category" : n.classList.contains("large") ? "skill" : n.classList.contains("diamond") ? "upgrade" : "mod";
    return { key: `${Math.round(left)},${Math.round(top)}`, x: left, y: top, kind, name: icon?.alt || "", icon: icon?.src || "", bg: n.querySelector(".node-bg, .category-icon-bg")?.src || "", max: max || 0, pts: pts || 0 };
  });
  const lines = withLayout ? [...document.querySelectorAll(".viewer-canvas svg .skill-line-base")].map((p) => p.getAttribute("d")) : [];
  return { nodes, lines };
}

function readParagon() {
  const T = { common: "n", magic: "m", rare: "r", legendary: "L", glyph: "G", paragon_starting: "S" };
  return [...document.querySelectorAll(".paragon__board")].map((b) => {
    const name = b.querySelector(".paragon__board__name")?.innerText.replace(/\s+/g, " ").trim() || "";
    const m = name.match(/^\d+\s+(.*?)\s*\((.*?)\)/);
    const st = b.getAttribute("style") || "";
    const num = (re) => Number((st.match(re) || [])[1] || 0);
    const tiles = [...b.querySelectorAll(".paragon__board__tile")].map((t) => {
      const rc = t.className.match(/r(\d+) c(\d+)/);
      if (!rc) return null;
      const bg = (t.querySelector(".paragon__board__tile__bg")?.src || "").split("/").pop().replace("tile_bg_", "").replace(".png", "");
      const icon = t.querySelector(".paragon__board__tile__icon:not(.active)");
      const iconOn = t.querySelector(".paragon__board__tile__icon.active");
      return { r: +rc[1], c: +rc[2], t: T[bg] || "n", alt: icon?.alt || "", icon: icon?.src || "", iconOn: iconOn?.src || "", bg: t.querySelector(".paragon__board__tile__bg")?.src || "", on: /\bactive\b/.test(t.className) };
    }).filter(Boolean);
    return { name: m ? m[1] : name, glyph: m ? m[2] : "", top: num(/top:\s*(-?\d+)/), left: num(/left:\s*(-?\d+)/), rotate: ((num(/rotate\((-?\d+)deg/) % 360) + 360) % 360, tiles };
  });
}

// Tooltip text for items, gems, runes, charms, the seal, Prime Evil powers and skills, cached by name.
async function captureTips(page, cls) {
  const groups = [
    [".builder__gear__icon", "img"], [".builder__gem__icon", "img"], [".builder__charm.active", "img"],
    [".builder__seal.active", "img"], [".builder__prime__power.active", "img"], [".builder__skills__list .build__skill__wrapper", "img"],
  ];
  let seal = "";
  for (const [sel, imgSel] of groups) {
    for (const h of await page.$$(sel)) {
      const [alt, src] = await h.evaluate((el, s) => [el.querySelector(s)?.alt || "", el.querySelector(s)?.src || ""], imgSel);
      // The seal's alt text is just "Seal": its name is the tooltip's first line, cached by image.
      const key = alt === "Seal" ? `seal:${src}` : alt;
      if (!alt) continue;
      if (!cls.tips[key]) {
        const tip = await hoverText(page, h);
        if (tip) cls.tips[key] = tip;
      }
      if (alt === "Seal" && cls.tips[key]) seal = cls.tips[key].split("\n")[0].trim();
    }
  }
  return seal;
}

export async function scrapeVariant(page, url, i, cls) {
  await open(page, `${url}?var=${i}`);
  const gear = await page.evaluate(readGearTab);
  const sealName = await captureTips(page, cls);
  if (gear.talisman.seal) gear.talisman.seal.name = sealName;

  await tab(page, "Skill Tree");
  const needLayout = !cls.tree;
  const tree = await page.evaluate(readTree, needLayout);
  if (needLayout) {
    // Class layout plus tooltip text for every node, captured once.
    const handles = await page.$$(".viewer-canvas .viewer-node");
    for (let k = 0; k < handles.length; k++) {
      if (tree.nodes[k].kind === "category") continue;
      tree.nodes[k].tip = await hoverText(page, handles[k]);
    }
    cls.tree = { nodes: tree.nodes.map(({ pts, ...n }) => n), lines: tree.lines };
  }
  const alloc = Object.fromEntries(tree.nodes.filter((n) => n.pts > 0).map((n) => [n.key, n.pts]));

  await tab(page, "Paragon");
  const boards = await page.evaluate(readParagon);
  const handlesByBoard = await page.$$(".paragon__board");
  for (let b = 0; b < boards.length; b++) {
    const bd = boards[b];
    if (cls.boards[bd.name]) continue;
    // New board: hover every special tile and one of each normal tile kind for its text.
    const tiles = await handlesByBoard[b].$$(".paragon__board__tile");
    const seenNormal = new Map();
    for (let k = 0; k < tiles.length; k++) {
      const t = bd.tiles[k];
      if (!t) continue;
      const normalKey = t.t === "n" ? t.alt : null;
      if (normalKey && seenNormal.has(normalKey)) { t.tip = seenNormal.get(normalKey); continue; }
      t.tip = await hoverText(page, tiles[k]);
      if (normalKey) seenNormal.set(normalKey, t.tip);
    }
    cls.boards[bd.name] = { tiles: bd.tiles.map(({ on, ...t }) => t) };
  }
  const paragon = boards.map((bd) => ({ name: bd.name, glyph: bd.glyph, x: Math.round(bd.left / 1258), y: Math.round(bd.top / 1258), rotate: bd.rotate, on: bd.tiles.filter((t) => t.on).map((t) => `${t.r},${t.c}`) }));
  const glyphTips = Object.fromEntries(boards.map((bd) => [bd.glyph, cls.boards[bd.name]?.tiles.find((t) => t.t === "G")?.tip || ""]));
  Object.assign(cls.glyphs, glyphTips);

  return { ...gear, url: `${url}?var=${i}`, tree: alloc, paragon, slotMap: SLOT_NAMES };
}

// Warlock guide URLs: the site's sitemap plus any listed by hand (some guides aren't in the sitemap yet).
export async function discover(className, extra = []) {
  const res = await fetch("https://d4builds.gg/sitemap.txt", { headers: { "user-agent": "d4companion-guide-sync" } });
  const list = res.ok ? (await res.text()).split("\n").map((l) => l.trim()) : [];
  const re = new RegExp(`/builds/[^/]*${className.toLowerCase()}-endgame/$`);
  return [...new Set([...list.filter((u) => re.test(u)), ...extra])].map((u) => u.replace(/\/$/, "/"));
}

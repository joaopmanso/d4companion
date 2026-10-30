// Free, in-browser text recognition with Tesseract. The language data downloads once (about 10 MB) and is cached.
// D4 tooltips are light text on a dark textured plate, so the image is upscaled, inverted and thresholded first.
// The text is then snapped onto the known items, affixes and skills (see ./parse.js and ./vocab.js), and each affix
// line's icon is read for Greater Affix, temper and enchant (iconMarks).
import { createWorker } from "tesseract.js";
import { parseTooltip, normaliseLines, splitStat, lineKey } from "./parse.js";
import { buildVocab, BASE_VOCAB } from "./vocab.js";
import { loadClass, loadItems } from "../data/guides.js";

let workerP = null;
let onProgress = () => {};
const vocabs = new Map();

function worker() {
  if (!workerP) {
    workerP = createWorker("eng", 1, { logger: (m) => onProgress(m) }).then(async (w) => {
      // One column of lines of different sizes; keep the gaps OCR sees between words.
      await w.setParameters({ tessedit_pageseg_mode: "4", preserve_interword_spaces: "1", user_defined_dpi: "300" });
      return w;
    });
  }
  return workerP;
}

// Items come from the all-class catalog; skills from the class's own file.
function vocabFor(className) {
  const key = className || "";
  if (!vocabs.has(key)) {
    vocabs.set(key, Promise.all([className ? loadClass(className).catch(() => null) : null, loadItems().catch(() => undefined)])
      .then(([cls, items]) => buildVocab(cls, items), () => BASE_VOCAB));
  }
  return vocabs.get(key);
}

const P = globalThis.__ocrP || { win: 30, floor: 75, delta: 35 };
async function prepare(blob) {
  const bmp = await createImageBitmap(blob);
  // Tesseract reads best with capital letters about 30 px tall; tooltip text at 1080p is about 12 px.
  const scale = Math.min(4, Math.max(1, 2000 / bmp.width));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  // Brightest channel keeps coloured text (orange, blue, purple, grey roll ranges) as bright as white text.
  const w = c.width, h = c.height;
  const v = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) v[p] = Math.max(d[i], d[i + 1], d[i + 2]);
  const color = new Uint8ClampedArray(d); // kept for reading the affix icons (see iconMarks)
  // Text is ink where it's clearly brighter than its surroundings. A fixed cut fails on bright plates: a mythic's
  // purple header or a set charm's green plate would turn solid black and swallow the name and type line.
  const sum = new Float64Array((w + 1) * (h + 1)); // integral image of v
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) { row += v[y * w + x]; sum[(y + 1) * (w + 1) + x + 1] = sum[y * (w + 1) + x + 1] + row; }
  }
  const r = Math.max(16, Math.round(w / P.win));
  for (let y = 0, p = 0; y < h; y++) {
    const y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
    for (let x = 0; x < w; x++, p++) {
      const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1);
      const mean = (sum[y1 * (w + 1) + x1] - sum[y0 * (w + 1) + x1] - sum[y1 * (w + 1) + x0] + sum[y0 * (w + 1) + x0]) / ((x1 - x0) * (y1 - y0));
      const ink = v[p] > P.floor && v[p] > mean + P.delta ? 0 : 255;
      d[p * 4] = d[p * 4 + 1] = d[p * 4 + 2] = ink;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { canvas: c, color };
}

export async function ocrItem(blob, progress, className) {
  onProgress = (m) => {
    if (m.status === "recognizing text") progress?.(`Reading text… ${Math.round(m.progress * 100)}%`);
    else if (m.status) progress?.(m.status.replace(/^\w/, (c) => c.toUpperCase()) + "…");
  };
  const [w, vocab] = await Promise.all([worker(), vocabFor(className)]);
  const { canvas, color } = await prepare(blob);
  const { data } = await w.recognize(canvas);
  const item = parseTooltip(data.text, className, vocab, iconMarks(data, color, canvas.width));
  item.rawText = data.text;
  return item;
}

// Greater Affix, temper and enchant show only as the icon left of an affix line. Each line's icon is classed by
// its colour and size, measured on the original colours, relative to the line's height (so any resolution works):
//   small grey diamond (about half the line height)  → a plain affix
//   small blue swirl                                 → enchanted
//   warm starburst, or a large blue box               → Greater Affix
//   large plain icon (crossed swords, feather, …)     → tempered
// Returns a map from lineKey(value, stat) to "ga" | "enchant" | "temper" | "plain".
function iconMarks(data, color, w) {
  const h = color.length / 4 / w;
  const marks = new Map();
  for (const line of data.lines || []) {
    const words = line.words || [];
    // The value word ("+315", "x31%"); a lone sign read as its own word joins the number after it.
    const vi = words.findIndex((wd) => /^[+×xX]?\d/.test(wd.text) || (/^[+×xX]$/.test(wd.text) && /^\d/.test(words[words.indexOf(wd) + 1]?.text || "")));
    if (vi < 0) continue;
    const { x0, y0, y1 } = words[vi].bbox;
    const lh = y1 - y0;
    if (lh < 4) continue;
    let n = 0, bright = 0, blue = 0, warm = 0, bx0 = Infinity, bx1 = -1, by0 = Infinity, by1 = -1;
    for (let y = Math.max(0, y0); y < Math.min(h, y1); y++) {
      for (let x = Math.max(0, Math.round(x0 - 1.9 * lh)); x < Math.max(0, Math.round(x0 - 0.3 * lh)); x++) {
        const i = (y * w + x) * 4, r = color[i], g = color[i + 1], b = color[i + 2];
        n++;
        if (Math.max(r, g, b) > 110) { bright++; bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); }
        if (b > 120 && b > r + 30 && b > g + 15) blue++;
        if (r > 150 && r >= g && r > b + 30) warm++;
      }
    }
    if (!n || !bright) continue;
    const ext = Math.max(bx1 - bx0, by1 - by0) / lh;
    const mark = (warm / n >= 0.1 && ext < 1.2) || (blue / n >= 0.15 && ext >= 0.75) ? "ga"
      : blue / n >= 0.03 ? "enchant"
      : ext >= 0.72 ? "temper"
      : "plain";
    const [text] = normaliseLines(line.text);
    if (!text) continue;
    const { value, stat } = splitStat(text);
    if (value) marks.set(lineKey(value, stat), mark);
  }
  return marks;
}

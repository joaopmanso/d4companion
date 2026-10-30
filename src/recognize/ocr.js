// Free, in-browser text recognition with Tesseract. The language data downloads once (about 10 MB) and is cached.
// D4 tooltips are light text on a dark textured plate, so the image is upscaled, inverted and thresholded first.
// The text is then snapped onto the class's known items, affixes and skills (see ./parse.js and ./vocab.js).
import { createWorker } from "tesseract.js";
import { parseTooltip } from "./parse.js";
import { buildVocab, BASE_VOCAB } from "./vocab.js";
import { loadClass } from "../data/guides.js";

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

function vocabFor(className) {
  if (!className) return Promise.resolve(BASE_VOCAB);
  if (!vocabs.has(className)) vocabs.set(className, loadClass(className).then(buildVocab, () => BASE_VOCAB));
  return vocabs.get(className);
}

// Otsu's threshold on a 256-bin histogram: the cut that best separates text from plate.
function otsu(hist, total) {
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0, wB = 0, best = 0, cut = 110;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += t * hist[t];
    const mB = sumB / wB, mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > best) { best = between; cut = t; }
  }
  return cut;
}

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
  const v = new Uint8Array(d.length / 4);
  const hist = new Uint32Array(256);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) { v[p] = Math.max(d[i], d[i + 1], d[i + 2]); hist[v[p]]++; }
  // The plate's texture changes from shot to shot, so the cut adapts, within limits that keep grey text.
  const cut = Math.min(140, Math.max(80, otsu(hist, v.length)));
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const ink = v[p] > cut ? 0 : 255;
    d[i] = d[i + 1] = d[i + 2] = ink;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

export async function ocrItem(blob, progress, className) {
  onProgress = (m) => {
    if (m.status === "recognizing text") progress?.(`Reading text… ${Math.round(m.progress * 100)}%`);
    else if (m.status) progress?.(m.status.replace(/^\w/, (c) => c.toUpperCase()) + "…");
  };
  const [w, vocab] = await Promise.all([worker(), vocabFor(className)]);
  const { data } = await w.recognize(await prepare(blob));
  const item = parseTooltip(data.text, className, vocab);
  item.rawText = data.text;
  return item;
}

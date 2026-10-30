// Free, in-browser text recognition with Tesseract. The language data downloads once (about 10 MB) and is cached.
// D4 tooltips are light text on a dark textured plate, so the image is upscaled, inverted and thresholded first.
import { createWorker } from "tesseract.js";
import { parseTooltip } from "./parse.js";

let workerP = null;
let onProgress = () => {};

function worker() {
  if (!workerP) workerP = createWorker("eng", 1, { logger: (m) => onProgress(m) });
  return workerP;
}

async function prepare(blob) {
  const bmp = await createImageBitmap(blob);
  const scale = Math.min(3, Math.max(1, 1800 / bmp.width));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    // Brightest channel keeps coloured text (orange, blue, purple) as bright as white text.
    const v = Math.max(d[i], d[i + 1], d[i + 2]);
    const ink = v > 110 ? 0 : 255;
    d[i] = d[i + 1] = d[i + 2] = ink;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

export async function ocrItem(blob, progress) {
  onProgress = (m) => {
    if (m.status === "recognizing text") progress?.(`Reading text… ${Math.round(m.progress * 100)}%`);
    else if (m.status) progress?.(m.status.replace(/^\w/, (c) => c.toUpperCase()) + "…");
  };
  const w = await worker();
  const { data } = await w.recognize(await prepare(blob));
  const item = parseTooltip(data.text);
  item.rawText = data.text;
  return item;
}

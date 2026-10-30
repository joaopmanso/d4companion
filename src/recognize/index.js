// Picks the reader: Claude when an API key is set (unless the player chose OCR), otherwise free OCR.
// Both readers load on first use, so the rest of the site stays light.
import { matchAffix } from "../data/affixes.js";
import { slotFromType } from "../data/slots.js";

export async function recognize(blob, settings, progress, className) {
  const useClaude = settings.apiKey && settings.engine !== "ocr";
  let item, engine;
  const ocr = async () => (await import("./ocr.js")).ocrItem(blob, progress, className);
  if (useClaude) {
    const { claudeItem, claudeError } = await import("./claude.js");
    try {
      item = await claudeItem(blob, { apiKey: settings.apiKey, model: settings.model || "claude-opus-5-5" }, progress);
      engine = "claude";
    } catch (err) {
      progress?.(`${claudeError(err)} Falling back to free text recognition…`);
      item = await ocr();
      engine = "ocr";
      item.warning = claudeError(err);
    }
  } else {
    item = await ocr();
    engine = "ocr";
  }
  item.engine = engine;
  item.slot = item.slot || slotFromType(item.type);
  for (const a of item.affixes) if (!a.key) a.key = matchAffix(a.text, className);
  if (!item.itemPower) item.itemPower = null;
  return item;
}

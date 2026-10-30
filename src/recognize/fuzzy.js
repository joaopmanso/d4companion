// Small fuzzy-matching helpers for snapping OCR text onto known tooltip phrases.

// Lower case, letters and digits only, single spaces. "Critical Strike Damage" → "critical strike damage".
// Digits inside words are OCR misreads ("Amu1et", "Hellf1re", "Sc0rn") and become the letters they look like;
// "1h"/"2h" weapon types stay as they are.
const LETTER = { 0: "o", 1: "l", 5: "s", 8: "b" };
export const norm = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .replace(/['’`]/g, "").replace(/[|]/g, "l").replace(/[®©°øº]/g, "o").replace(/[^a-z0-9]+/g, " ").trim()
  .replace(/\S+/g, (w) => (/[a-z]/.test(w) && /\d/.test(w) && !/^\d+h$/.test(w) ? w.replace(/[0158]/g, (d) => LETTER[d]) : w));

export function distance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

// 1 for identical, 0 for nothing in common. Spaces are ignored, since OCR often drops or adds them.
export function similarity(a, b) {
  const x = norm(a).replace(/ /g, ""), y = norm(b).replace(/ /g, "");
  if (!x || !y) return 0;
  return 1 - distance(x, y) / Math.max(x.length, y.length);
}

// The closest candidate and its score. Short phrases need a closer match: one wrong letter in "Armor" is a lot.
export function closest(text, candidates, min = 0.78) {
  const x = norm(text).replace(/ /g, "");
  if (!x) return null;
  let best = null;
  for (const c of candidates) {
    const y = norm(c).replace(/ /g, "");
    if (!y || Math.abs(x.length - y.length) > Math.max(x.length, y.length) * (1 - min)) continue;
    const score = 1 - distance(x, y) / Math.max(x.length, y.length);
    if (!best || score > best.score) best = { value: c, score };
  }
  const need = Math.max(x.length, best?.value.length || 0) <= 6 ? Math.max(min, 0.85) : min;
  return best && best.score >= need ? best : null;
}

// The candidate name whose every word appears, in order, among the OCR words. Item art sits to the right of
// the name, so name lines pick up junk words ("FER OF PIN" / "ABADD®N'S FLESH mw"), which this skips over.
export function nameIn(text, names) {
  const raw = norm(text).split(" ").filter(Boolean);
  let best = null;
  for (const n of names) {
    const want = norm(n).split(" ").filter(Boolean);
    let j = 0, total = 0;
    for (const w of want) {
      let k = j;
      while (k < raw.length && similarity(raw[k], w) < (w.length <= 3 ? 1 : 0.7)) k++;
      if (k === raw.length) { total = -1; break; }
      total += similarity(raw[k], w);
      j = k + 1;
    }
    if (total < 0) continue;
    // Longer names win ties, so "Fer of Abaddon's Flesh" beats a shorter name hidden inside it.
    const score = total / want.length + want.length / 100;
    if (!best || score > best.score) best = { value: n, score };
  }
  return best;
}

// Share of the query's words found in the candidate. For long prose (aspect powers) where numbers differ.
export function wordOverlap(text, candidate) {
  const words = (s) => new Set(norm(s).split(" ").filter((w) => w.length > 2 && !/\d/.test(w)));
  const a = words(text), b = words(candidate);
  if (!a.size || !b.size) return 0;
  let hit = 0;
  for (const w of a) if (b.has(w)) hit++;
  return hit / Math.max(a.size, Math.min(b.size, a.size * 1.5));
}

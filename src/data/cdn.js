// Game art is served through our Cloudflare Worker image cache (private repo d4companion-cdn) when CDN is set;
// otherwise it's linked straight from its source. If the cache can't serve an image, the page
// falls back to the original link (see watchArt).
export const CDN = "https://d4companion-art.joaopmanso.workers.dev/";

const MAP = [["https://sunderarmor.com/", "sa/"], ["https://bnetcmsus-a.akamaihd.net/", "bnet/"]];

export function artUrl(url) {
  if (!CDN || !url) return url;
  for (const [from, to] of MAP) if (url.startsWith(from)) return CDN + to + url.slice(from.length);
  return url;
}

// Rewrites every source URL in a JSON document's text before it's parsed.
export function rewriteArt(text) {
  if (!CDN) return text;
  let out = text;
  for (const [from, to] of MAP) out = out.split(from).join(CDN + to);
  return out;
}

const original = (url) => {
  for (const [from, to] of MAP) if (url.startsWith(CDN + to)) return from + url.slice((CDN + to).length);
  return null;
};

// One listener for the whole page: an image the cache fails on is reloaded from its source.
export function watchArt() {
  if (!CDN) return;
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || img.dataset.fellBack) return;
    const src = original(img.src);
    if (src) { img.dataset.fellBack = "1"; img.src = src; }
  }, true);
}

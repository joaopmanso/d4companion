// Shared Playwright setup for the guide scrapers: one browser, polite pacing, no ads or trackers.
import { chromium } from "playwright";

const BLOCK = /doubleclick|googlesyndication|googletagmanager|google-analytics|amazon-adsystem|adnxs|rubiconproject|aniview|nitropay|primis|btloader|crashbamboo|cookielaw|twitch\.tv|intergient/;

export async function openBrowser() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1200 },
    userAgent: "Mozilla/5.0 (compatible; d4companion-guide-sync/1.0; +https://github.com/joaopmanso/d4companion)",
  });
  await context.route("**/*", (route) => (BLOCK.test(route.request().url()) ? route.abort() : route.continue()));
  return { browser, context };
}

export const pause = (ms) => new Promise((r) => setTimeout(r, ms));

// Show an element's tooltip (tippy or the site's own) and return its full text.
// Tooltips are either tippy boxes (linked by aria-describedby) or unnamed elements the site
// appends on hover, so we watch for newly added elements while hovering.
export async function hoverText(page, handle) {
  await page.evaluate(() => {
    window.__tipAdded = [];
    window.__tipObs?.disconnect();
    window.__tipObs = new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) window.__tipAdded.push(n); });
    window.__tipObs.observe(document.body, { childList: true, subtree: true });
  });
  await handle.scrollIntoViewIfNeeded().catch(() => {});
  await handle.hover({ force: true, timeout: 2000 }).catch(() => {});
  let text = "";
  for (let i = 0; i < 8 && !text; i++) {
    await pause(80);
    // Off-screen elements (Paragon boards outside the panned view) can't take a real hover.
    if (i === 2) await handle.evaluate((el) => {
      const r = el.getBoundingClientRect();
      for (const t of ["pointerover", "pointerenter", "mouseover", "mouseenter", "mousemove"]) {
        el.dispatchEvent(new (t.startsWith("pointer") ? PointerEvent : MouseEvent)(t, { bubbles: true, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 }));
      }
    }).catch(() => {});
    text = await page.evaluate((el) => {
      const id = el.getAttribute("aria-describedby");
      const tippy = id && document.getElementById(id);
      if (tippy && tippy.innerText.trim()) return tippy.innerText.trim();
      const added = window.__tipAdded.filter((n) => n.isConnected && !el.contains(n) && n.innerText?.trim());
      added.sort((a, b) => b.innerText.length - a.innerText.length);
      return added[0]?.innerText.trim() || "";
    }, handle);
  }
  await page.mouse.move(2, 2);
  await page.evaluate(() => window.__tipObs?.disconnect());
  await pause(40);
  return text;
}

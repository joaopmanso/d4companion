// Share links: the whole character, compressed into the part of the URL after "#".
// Browsers never send that part to the server, so the data only travels inside the link itself.
// Screenshots (kept in this browser's IndexedDB) and settings such as the API key are never included.

const toB64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function pipe(bytes, stream) {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

// Only what's needed to show the character: no ids, screenshots or timestamps of the saving browser.
function strip(char) {
  const gear = {};
  for (const [slot, g] of Object.entries(char.gear || {})) {
    if (!g) continue;
    const { shot, engine, rawText, usage, warning, ...rest } = g;
    gear[slot] = rest;
  }
  return { v: 1, name: char.name, className: char.className, buildId: char.buildId, gear, talisman: char.talisman, stats: char.stats };
}

export async function shareLink(char) {
  const json = new TextEncoder().encode(JSON.stringify(strip(char)));
  const packed = await pipe(json, new CompressionStream("deflate-raw"));
  const base = location.href.replace(/#.*$/, "");
  return `${base}#/s/${toB64url(packed)}/loadout`;
}

export async function readShared(payload) {
  const json = await pipe(fromB64url(payload), new DecompressionStream("deflate-raw"));
  const c = JSON.parse(new TextDecoder().decode(json));
  if (c.v !== 1 || !c.buildId) throw new Error("This share link isn't valid.");
  return { id: "shared", name: c.name || "Shared character", className: c.className, buildId: c.buildId, gear: c.gear || {}, talisman: c.talisman, stats: c.stats || {} };
}

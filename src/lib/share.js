// Share links: the whole character, compressed into the part of the URL after "#".
// Browsers never send that part to the server, so the data only travels inside the link itself.
// Screenshots (kept in this browser's IndexedDB) and settings such as the API key are never included.
import { CDN } from "../data/cdn.js";

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
  return { v: 1, name: char.name, className: char.className, buildId: char.buildId, gear, talisman: char.talisman, stats: char.stats, skillTree: char.skillTree, paragon: char.paragon };
}

// Short links (#/c/<id>) keep the packed character in our Cloudflare Worker's store, under an id made
// from its content. If the Worker can't be reached, the long link (#/s/<packed>) still works on its own.
export async function shareLink(char) {
  const json = new TextEncoder().encode(JSON.stringify(strip(char)));
  const packed = toB64url(await pipe(json, new CompressionStream("deflate-raw")));
  const base = location.href.replace(/#.*$/, "");
  if (CDN) {
    try {
      const res = await fetch(`${CDN}share`, { method: "POST", body: packed });
      if (res.ok) { const { id } = await res.json(); if (id) return `${base}#/c/${id}`; }
    } catch { /* fall back to the long link */ }
  }
  return `${base}#/s/${packed}/loadout`;
}

export async function readShort(id) {
  const res = await fetch(`${CDN}share/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(res.status === 404 ? "This share link has expired or doesn't exist." : "Couldn't load this share link.");
  return readShared(await res.text());
}

export async function readShared(payload) {
  const json = await pipe(fromB64url(payload), new DecompressionStream("deflate-raw"));
  const c = JSON.parse(new TextDecoder().decode(json));
  if (c.v !== 1 || !c.buildId) throw new Error("This share link isn't valid.");
  return { id: "shared", name: c.name || "Shared character", className: c.className, buildId: c.buildId, gear: c.gear || {}, talisman: c.talisman, stats: c.stats || {}, skillTree: c.skillTree, paragon: c.paragon };
}

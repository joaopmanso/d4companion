// Everything lives in this browser: characters and settings in localStorage, screenshots in IndexedDB.
// Nothing personal ships with the site; a new browser starts with no characters.
// Export/Import moves it all (screenshots included) as one JSON file.
const KEY = "d4c.v1";
const listeners = new Set();

const blank = () => ({ activeId: null, characters: [], settings: { engine: "auto", model: "claude-opus-5-5" } });

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (Array.isArray(s.characters)) return { settings: {}, ...s };
    }
  } catch { /* private mode or corrupt data: start fresh */ }
  return blank();
}

let state = load();

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
  for (const fn of listeners) fn(state);
}

export const store = {
  get: () => state,
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  active: () => state.characters.find((c) => c.id === state.activeId) || state.characters[0] || null,
  setActive(id) { state.activeId = id; save(); },
  // A character has a class, follows one guide, and keeps only what the player entered:
  // gear by slot, a talisman (seal + six charm names) and character-sheet stats.
  addCharacter({ name, buildId, className }) {
    const c = { id: `c${Date.now().toString(36)}`, name, className, buildId, gear: {}, talisman: { seal: null, charms: [null, null, null, null, null, null] }, stats: {} };
    state.characters.push(c);
    state.activeId = c.id;
    save();
    return c;
  },
  updateCharacter(id, patch) {
    const c = state.characters.find((x) => x.id === id);
    if (c) { Object.assign(c, patch); save(); }
  },
  removeCharacter(id) {
    const c = state.characters.find((x) => x.id === id);
    state.characters = state.characters.filter((x) => x.id !== id);
    if (state.activeId === id) state.activeId = state.characters[0]?.id || null;
    save();
    for (const g of Object.values(c?.gear || {})) if (g?.shot) shots.remove(g.shot);
  },
  setGear(charId, slotId, item) {
    const c = state.characters.find((x) => x.id === charId);
    if (!c) return;
    const old = c.gear[slotId];
    c.gear[slotId] = item;
    save();
    if (old?.shot && old.shot !== item?.shot) shots.remove(old.shot);
  },
  settings: () => state.settings,
  setSettings(patch) { Object.assign(state.settings, patch); save(); },

  async exportAll() {
    const images = {};
    for (const c of state.characters) for (const g of Object.values(c.gear)) {
      if (g?.shot) { const b = await shots.get(g.shot); if (b) images[g.shot] = await blobToDataUrl(b); }
    }
    const { apiKey, ...settings } = state.settings; // never export the API key
    return JSON.stringify({ app: "d4companion", version: 1, exported: new Date().toISOString(), ...state, settings, images }, null, 2);
  },
  async importAll(text) {
    const data = JSON.parse(text);
    if (data.app !== "d4companion" || !Array.isArray(data.characters)) throw new Error("This isn't a D4 Companion export file.");
    for (const [id, url] of Object.entries(data.images || {})) await shots.put(await (await fetch(url)).blob(), id);
    const apiKey = state.settings.apiKey;
    state = { activeId: data.activeId, characters: data.characters, settings: { ...data.settings, ...(apiKey ? { apiKey } : {}) } };
    save();
  },
};

// Screenshots: IndexedDB, falling back to memory when it's unavailable.
const mem = new Map();
let dbp = null;
function db() {
  if (!dbp) dbp = new Promise((resolve) => {
    try {
      const req = indexedDB.open("d4c-shots", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("shots");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
  return dbp;
}
function tx(mode, fn) {
  return db().then((d) => d && new Promise((resolve) => {
    const t = d.transaction("shots", mode);
    const r = fn(t.objectStore("shots"));
    t.oncomplete = () => resolve(r?.result);
    t.onerror = () => resolve(null);
  }));
}
export const shots = {
  async put(blob, id = `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`) {
    mem.set(id, blob);
    await tx("readwrite", (s) => s.put(blob, id));
    return id;
  },
  async get(id) { return mem.get(id) || (await tx("readonly", (s) => s.get(id))) || null; },
  async remove(id) { mem.delete(id); await tx("readwrite", (s) => s.delete(id)); },
  async url(id) { const b = await shots.get(id); return b ? URL.createObjectURL(b) : null; },
};

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

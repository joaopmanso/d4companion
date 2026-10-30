// Dark by default; the toggle cycles dark → light → follow the system. The choice is a per-browser
// convenience in localStorage (new key, so choices made before dark became the default reset).
const KEY = "d4c.theme.v2";
const ORDER = ["dark", "light", "system"];
const LABEL = { system: "Theme: auto", dark: "Theme: dark", light: "Theme: light" };
const ICON = {
  system: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18V3Z" fill="currentColor"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" fill="currentColor"/></svg>',
  light: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></g></svg>',
};

const read = () => { try { return localStorage.getItem(KEY) || "dark"; } catch { return "dark"; } };
function apply(mode, btn) {
  if (mode === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = mode;
  if (btn) { btn.innerHTML = ICON[mode]; btn.title = LABEL[mode]; btn.setAttribute("aria-label", LABEL[mode]); }
}

export function initTheme(btn) {
  let mode = read();
  apply(mode, btn);
  btn?.addEventListener("click", () => {
    mode = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    try { localStorage.setItem(KEY, mode); } catch { /* private mode */ }
    apply(mode, btn);
  });
}

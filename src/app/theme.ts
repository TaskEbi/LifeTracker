/**
 * Colour themes. A per-device choice (not synced): Curio Cabinet's appearance settings are left
 * alone. Each theme sets the surface, text and two accent colours; section colours follow the
 * theme's light or dark mode.
 */
export interface Theme {
  id: string;
  name: string;
  /** One kanji for the picker. */
  kanji: string;
  mode: 'light' | 'dark';
  bg: string;
  surf: string;
  surf2: string;
  surf3: string;
  fg: string;
  fg2: string;
  fg3: string;
  rule: string;
  /** Main accent: buttons, the current page, XP. */
  sig: string;
  sigFg: string;
  /** Second accent: levels, power bars, highlights. */
  acc2: string;
  acc2Fg: string;
  ok?: string;
  warn?: string;
}

const DARK = { ok: '#3dd68c', warn: '#ff6b52' };
const LIGHT = { ok: '#138a5c', warn: '#c4301c' };

export const THEMES: Theme[] = [
  { id: 'shonen', name: 'Shōnen', kanji: '炎', mode: 'dark', bg: '#0b0b0d', surf: '#16161b', surf2: '#1f1f26', surf3: '#2a2a33', fg: '#f4f1ea', fg2: '#bab6c3', fg3: '#8b8797', rule: '#2c2c35', sig: '#ff1f3d', sigFg: '#ffffff', acc2: '#ffc400', acc2Fg: '#0b0b0d' },
  { id: 'cyber', name: 'Cyber', kanji: '電', mode: 'dark', bg: '#07080d', surf: '#0e1019', surf2: '#151827', surf3: '#1e2236', fg: '#e9ecf5', fg2: '#a9b1c7', fg3: '#7d87a0', rule: '#1f2740', sig: '#ff2bd6', sigFg: '#07080d', acc2: '#2ef2ff', acc2Fg: '#07080d', ok: '#d4ff3a', warn: '#ff5c7a' },
  { id: 'paper', name: 'Manga paper', kanji: '紙', mode: 'light', bg: '#f4f1ea', surf: '#ffffff', surf2: '#ebe7de', surf3: '#dcd7cb', fg: '#111111', fg2: '#3d3a36', fg3: '#66625b', rule: '#cfc9bc', sig: '#e60033', sigFg: '#ffffff', acc2: '#111111', acc2Fg: '#ffffff' },
  { id: 'oni', name: 'Oni', kanji: '鬼', mode: 'dark', bg: '#120a14', surf: '#1c1020', surf2: '#26162b', surf3: '#321d38', fg: '#f5ecf7', fg2: '#c6b3cc', fg3: '#9a86a1', rule: '#36223d', sig: '#c724ff', sigFg: '#ffffff', acc2: '#ff5e3a', acc2Fg: '#120a14' },
  { id: 'ocean', name: 'Ocean', kanji: '海', mode: 'dark', bg: '#06121f', surf: '#0c1b2c', surf2: '#12253a', surf3: '#19304a', fg: '#e6f1fb', fg2: '#a9c0d6', fg3: '#7d97b1', rule: '#1a3049', sig: '#1fb6ff', sigFg: '#04101b', acc2: '#ffd166', acc2Fg: '#06121f' },
  { id: 'jade', name: 'Jade', kanji: '翠', mode: 'dark', bg: '#07130e', surf: '#0e1d16', surf2: '#142820', surf3: '#1b342a', fg: '#e8f5ee', fg2: '#a9c9b8', fg3: '#7fa392', rule: '#1d3a2e', sig: '#22d48b', sigFg: '#04120b', acc2: '#f5d061', acc2Fg: '#07130e' },
  { id: 'ember', name: 'Ember', kanji: '火', mode: 'dark', bg: '#140b05', surf: '#1f120a', surf2: '#2a190e', surf3: '#362114', fg: '#fbefe6', fg2: '#d2b8a5', fg3: '#a38a78', rule: '#3a2617', sig: '#ff7a1a', sigFg: '#140b05', acc2: '#ffe066', acc2Fg: '#140b05' },
  { id: 'royal', name: 'Royal', kanji: '王', mode: 'dark', bg: '#0a0e24', surf: '#111737', surf2: '#182046', surf3: '#202a57', fg: '#eef0ff', fg2: '#b4bbe6', fg3: '#8790c4', rule: '#222c5c', sig: '#5b78ff', sigFg: '#ffffff', acc2: '#ffc94d', acc2Fg: '#0a0e24' },
  { id: 'vapor', name: 'Vapor', kanji: '夢', mode: 'dark', bg: '#1a1033', surf: '#231645', surf2: '#2d1d57', surf3: '#382569', fg: '#fdf1ff', fg2: '#d3bfe6', fg3: '#a993c3', rule: '#3b2a66', sig: '#ff71ce', sigFg: '#1a1033', acc2: '#01cdfe', acc2Fg: '#1a1033' },
  { id: 'toxic', name: 'Toxic', kanji: '毒', mode: 'dark', bg: '#0b0f05', surf: '#13190a', surf2: '#1b2310', surf3: '#242e16', fg: '#f0f7e4', fg2: '#bccb9f', fg3: '#8e9d73', rule: '#26311a', sig: '#a6ff00', sigFg: '#0b0f05', acc2: '#ff2e88', acc2Fg: '#0b0f05' },
  { id: 'ink', name: 'Ink', kanji: '墨', mode: 'dark', bg: '#0d0d0d', surf: '#171717', surf2: '#212121', surf3: '#2c2c2c', fg: '#f2f2f2', fg2: '#bdbdbd', fg3: '#8f8f8f', rule: '#303030', sig: '#f2f2f2', sigFg: '#0d0d0d', acc2: '#a3a3a3', acc2Fg: '#0d0d0d' },
  { id: 'sakura', name: 'Sakura', kanji: '桜', mode: 'light', bg: '#fff4f6', surf: '#ffffff', surf2: '#fde6ec', surf3: '#f6cfda', fg: '#2b1220', fg2: '#5c3a4b', fg3: '#84606f', rule: '#f0cdd8', sig: '#d62a66', sigFg: '#ffffff', acc2: '#7a3cff', acc2Fg: '#ffffff' },
  { id: 'ice', name: 'Ice', kanji: '氷', mode: 'light', bg: '#eef5fb', surf: '#ffffff', surf2: '#e1ecf6', surf3: '#cfdfee', fg: '#0b1b2b', fg2: '#34495e', fg3: '#5d7186', rule: '#c9d9e8', sig: '#1f6fe0', sigFg: '#ffffff', acc2: '#00877c', acc2Fg: '#ffffff' },
  { id: 'matcha', name: 'Matcha', kanji: '茶', mode: 'light', bg: '#f3f1e4', surf: '#fffdf4', surf2: '#e8e5d2', surf3: '#d9d5bd', fg: '#1d2a1a', fg2: '#44523f', fg3: '#66735f', rule: '#d3cfb5', sig: '#4a7f28', sigFg: '#ffffff', acc2: '#b4442d', acc2Fg: '#ffffff' },
];

/** A theme id, or 'auto': Manga paper by day, Shōnen at night (follows the device). */
export type ThemeChoice = string;
export const DEFAULT_THEME = 'shonen';
const KEY = 'lifetracker-look';
const OLD_KEY = 'lifetracker-theme';

export function themeChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'auto' || THEMES.some((t) => t.id === v)) return v!;
    // The earlier light/dark switch: keep what was picked.
    const old = localStorage.getItem(OLD_KEY);
    return old === 'light' ? 'paper' : old === 'system' ? 'auto' : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function resolveTheme(choice: ThemeChoice = themeChoice()): Theme {
  const id = choice === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'shonen' : 'paper') : choice;
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function applyTheme(choice: ThemeChoice = themeChoice()) {
  const t = resolveTheme(choice);
  const root = document.documentElement;
  const ok = t.ok ?? (t.mode === 'dark' ? DARK.ok : LIGHT.ok);
  const warn = t.warn ?? (t.mode === 'dark' ? DARK.warn : LIGHT.warn);
  const vars: Record<string, string> = {
    '--bg': t.bg,
    '--surf': t.surf,
    '--surf-2': t.surf2,
    '--surf-3': t.surf3,
    '--fg': t.fg,
    '--fg-2': t.fg2,
    '--fg-3': t.fg3,
    '--rule': t.rule,
    '--grid': `color-mix(in srgb, ${t.fg} 6%, ${t.bg})`,
    '--bg-dot': `color-mix(in srgb, ${t.fg} 5%, transparent)`,
    '--led-off': t.surf3,
    '--sig': t.sig,
    '--sig-fg': t.sigFg,
    '--sig-soft': `color-mix(in srgb, ${t.sig} 15%, transparent)`,
    '--acc2': t.acc2,
    '--acc2-fg': t.acc2Fg,
    '--ok': ok,
    '--ok-soft': `color-mix(in srgb, ${ok} 14%, transparent)`,
    '--warn': warn,
    '--warn-soft': `color-mix(in srgb, ${warn} 14%, transparent)`,
  };
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  root.dataset.theme = t.mode;
  root.dataset.look = t.id;
  // Curio Cabinet's sheets read data-mode for their own day/night palette.
  root.dataset.mode = t.mode;
  root.style.colorScheme = t.mode;
  for (const m of document.querySelectorAll('meta[name="theme-color"]')) m.setAttribute('content', t.bg);
}

export function setTheme(choice: ThemeChoice) {
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    /* private mode */
  }
  applyTheme(choice);
}

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (themeChoice() === 'auto') applyTheme();
});

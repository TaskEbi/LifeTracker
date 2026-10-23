/** Light / dark / follow the system. A per-device choice (not synced): Curio Cabinet's appearance settings are left alone. */
export type ThemeChoice = 'system' | 'light' | 'dark';
const KEY = 'lifetracker-theme';

export function themeChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(choice: ThemeChoice = themeChoice()) {
  const root = document.documentElement;
  if (choice === 'system') delete root.dataset.theme;
  else root.dataset.theme = choice;
  // Curio Cabinet's sheets read data-mode for their own day/night palette.
  root.dataset.mode = choice === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : choice;
}

export function setTheme(choice: ThemeChoice) {
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    /* private mode */
  }
  applyTheme(choice);
}

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme());

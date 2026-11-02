/**
 * Canonical client-side appearance preference used by the application module.
 * The pre-paint bootstrap exposes the same API on globalThis; these fallbacks
 * keep theme selection safe if the bootstrap is omitted by an embedding host.
 */

const BOOTSTRAP = globalThis.NoursTheme;

export const THEME_STORAGE_KEY = BOOTSTRAP?.storageKey || 'nours.theme.v1';
export const THEME_VALUES = Object.freeze([...(BOOTSTRAP?.themes || ['default', 'oled'])]);
export const THEME_META_COLORS = Object.freeze({
  default: BOOTSTRAP?.metaColors?.default || '#0f172a',
  oled: BOOTSTRAP?.metaColors?.oled || '#000000',
});
export const THEME_OPTIONS = Object.freeze([
  Object.freeze({
    value: 'default',
    label: 'Default',
    description: 'The after-hours arcade appearance with layered ink surfaces.',
  }),
  Object.freeze({
    value: 'oled',
    label: 'OLED Black',
    description: 'True-black canvas with restrained elevated surfaces.',
  }),
]);

export function normalizeTheme(value) {
  if (BOOTSTRAP?.normalize) return BOOTSTRAP.normalize(value);
  return THEME_VALUES.includes(value) ? value : 'default';
}

export function readThemePreference() {
  if (BOOTSTRAP?.read) return normalizeTheme(BOOTSTRAP.read());
  try {
    const raw = globalThis.localStorage?.getItem(THEME_STORAGE_KEY);
    if (raw === null || raw === undefined) return 'default';
    const theme = normalizeTheme(raw);
    if (theme !== raw) globalThis.localStorage?.removeItem(THEME_STORAGE_KEY);
    return theme;
  } catch {
    return 'default';
  }
}

export function writeThemePreference(value) {
  const theme = normalizeTheme(value);
  if (BOOTSTRAP?.write) return BOOTSTRAP.write(theme);
  try {
    globalThis.localStorage?.setItem(THEME_STORAGE_KEY, theme);
    return true;
  } catch {
    return false;
  }
}

export function applyThemeToDocument(value) {
  const theme = normalizeTheme(value);
  if (BOOTSTRAP?.apply) return BOOTSTRAP.apply(theme);

  const root = globalThis.document?.documentElement;
  if (root) {
    root.dataset.theme = theme;
    root.style.backgroundColor = theme === 'oled' ? '#000000' : '';
    root.style.colorScheme = theme === 'oled' ? 'dark' : '';
  }
  const meta = globalThis.document?.querySelector?.('meta[name="theme-color"]');
  meta?.setAttribute('content', THEME_META_COLORS[theme]);
  return theme;
}

/** Listen for the canonical preference changing in another tab. */
export function onThemePreferenceStorage(callback) {
  if (typeof globalThis.addEventListener !== 'function' || typeof callback !== 'function') {
    return () => {};
  }
  const listener = (event) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    callback(normalizeTheme(event.newValue));
  };
  globalThis.addEventListener('storage', listener);
  return () => globalThis.removeEventListener?.('storage', listener);
}

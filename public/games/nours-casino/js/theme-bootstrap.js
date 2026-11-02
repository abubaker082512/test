/**
 * Applies the saved appearance before render-blocking stylesheets are fetched.
 *
 * This file is deliberately a classic, same-origin script instead of an inline
 * snippet: the deployment CSP permits `script-src 'self'` and forbids unsafe
 * inline code. Keep it dependency-free and in <head> so OLED never paints as
 * the default navy theme first.
 */
(function bootstrapTheme(global) {
  'use strict';

  const STORAGE_KEY = 'nours.theme.v1';
  const THEMES = Object.freeze(['default', 'oled']);
  const META_COLORS = Object.freeze({ default: '#0f172a', oled: '#000000' });

  function normalize(value) {
    return THEMES.includes(value) ? value : 'default';
  }

  function storage() {
    try { return global.localStorage || null; }
    catch { return null; }
  }

  function read() {
    const store = storage();
    if (!store) return 'default';
    try {
      const raw = store.getItem(STORAGE_KEY);
      if (raw === null) return 'default';
      const value = normalize(raw);
      if (value !== raw) store.removeItem(STORAGE_KEY);
      return value;
    } catch {
      return 'default';
    }
  }

  function write(value) {
    const theme = normalize(value);
    const store = storage();
    if (!store) return false;
    try {
      store.setItem(STORAGE_KEY, theme);
      return true;
    } catch {
      return false;
    }
  }

  function apply(value) {
    const theme = normalize(value);
    const doc = global.document;
    const root = doc && doc.documentElement;
    if (root) {
      root.dataset.theme = theme;
      root.style.backgroundColor = theme === 'oled' ? '#000000' : '';
      root.style.colorScheme = theme === 'oled' ? 'dark' : '';
    }

    const meta = doc && doc.querySelector && doc.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', META_COLORS[theme]);
    return theme;
  }

  const api = {
    storageKey: STORAGE_KEY,
    themes: THEMES,
    metaColors: META_COLORS,
    normalize,
    read,
    write,
    apply,
    get current() {
      return normalize(global.document?.documentElement?.dataset?.theme);
    },
  };

  global.NoursTheme = api;
  apply(read());
})(globalThis);

import path from 'path';
import fs from 'fs';

let freeToGameCatalog = [];
try {
  const filePath = path.resolve(process.cwd(), 'data', 'freeToGameCatalog.json');
  if (fs.existsSync(filePath)) {
    freeToGameCatalog = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
} catch (e) {
  console.warn('Could not load freeToGameCatalog.json:', e.message);
}

// In-memory cache for live requests
let liveGamesCache = null;
let liveGamesCacheTime = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache

const gameDetailsCache = new Map();

/**
 * Format raw FreeToGame game object into unified platform game schema
 */
export function formatFtgGame(g, idx = 0) {
  if (!g) return null;
  const ftgId = g.id || (g.ftgId ? g.ftgId : null);
  const isBrowser = (g.platform || '').toLowerCase().includes('browser');

  return {
    id: `ftg-${ftgId}`,
    ftgId: ftgId,
    slug: `ftg-${ftgId}`,
    title: g.title,
    imageUrl: g.thumbnail || g.imageUrl,
    thumbnail: g.thumbnail || g.imageUrl,
    short_description: g.short_description || '',
    description: g.description || g.short_description || '',
    game_url: g.game_url || '',
    genre: g.genre || 'Action',
    platform: g.platform || 'Web Browser',
    publisher: g.publisher || '',
    developer: g.developer || '',
    release_date: g.release_date || '',
    freetogame_profile_url: g.freetogame_profile_url || '',
    provider: 'FreeToGame',
    rawProvider: g.developer || g.publisher || 'FreeToGame',
    category: 'Free Games',
    badge: isBrowser ? '⚡ Instant' : '🎁 Free',
    recommended: idx < 30 || isBrowser,
    theme: isBrowser
      ? 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)'
      : 'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)',
    rtp: '100% Free',
    isFreeGame: true,
    isBrowser: isBrowser,
    screenshots: g.screenshots || []
  };
}

/**
 * Fetch games list from FreeToGame API with fallback to bundled catalog
 */
export async function getFreeToGames({ platform, category, sortBy, search } = {}) {
  const now = Date.now();

  let games = [];

  // Use cache if available and fresh
  if (liveGamesCache && (now - liveGamesCacheTime < CACHE_TTL_MS)) {
    games = liveGamesCache;
  } else {
    try {
      const url = new URL('https://www.freetogame.com/api/games');
      if (platform && platform !== 'all') url.searchParams.set('platform', platform);
      if (category) url.searchParams.set('category', category);
      if (sortBy) url.searchParams.set('sort-by', sortBy);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          games = data.map((g, idx) => formatFtgGame(g, idx));
          if (!platform && !category && !sortBy) {
            liveGamesCache = games;
            liveGamesCacheTime = now;
          }
        }
      }
    } catch (e) {
      console.warn('FreeToGame live API fetch failed or timed out, falling back to local catalog:', e.message);
    }
  }

  // Fallback to local catalog if API failed
  if (!games || games.length === 0) {
    games = freeToGameCatalog.map((g, idx) => formatFtgGame(g, idx));
  }

  // Filter in-memory if needed
  let filtered = [...games];

  if (platform && platform !== 'all') {
    const p = platform.toLowerCase();
    filtered = filtered.filter(g => (g.platform || '').toLowerCase().includes(p));
  }

  if (category && category.toLowerCase() !== 'all' && category.toLowerCase() !== 'free games') {
    const c = category.toLowerCase();
    filtered = filtered.filter(g => 
      (g.genre || '').toLowerCase().includes(c) ||
      (g.category || '').toLowerCase().includes(c)
    );
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(g => 
      g.title.toLowerCase().includes(q) ||
      (g.genre && g.genre.toLowerCase().includes(q)) ||
      (g.short_description && g.short_description.toLowerCase().includes(q))
    );
  }

  return filtered;
}

/**
 * Fetch single game details by ID from FreeToGame API
 */
export async function getFreeToGameDetails(id) {
  // Strip ftg- prefix if present
  const cleanId = String(id).replace(/^ftg-/, '');

  if (gameDetailsCache.has(cleanId)) {
    return gameDetailsCache.get(cleanId);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`https://www.freetogame.com/api/game?id=${encodeURIComponent(cleanId)}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.id) {
        const formatted = {
          ...formatFtgGame(data),
          description: data.description || data.short_description || '',
          minimum_system_requirements: data.minimum_system_requirements || null,
          screenshots: data.screenshots || []
        };
        gameDetailsCache.set(cleanId, formatted);
        return formatted;
      }
    }
  } catch (e) {
    console.warn(`Failed to fetch FreeToGame game #${cleanId}:`, e.message);
  }

  // Fallback to local catalog search
  const found = freeToGameCatalog.find(g => String(g.ftgId) === String(cleanId) || g.id === `ftg-${cleanId}`);
  if (found) {
    return formatFtgGame(found);
  }

  return null;
}

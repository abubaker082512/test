import { globalCache } from './cache.js';

export const RAINBOW_RICHES_CATALOG = [
  {
    id: 'rr-pots-of-gold',
    name: 'Rainbow Riches: Pots of Gold',
    title: 'Rainbow Riches: Pots of Gold',
    provider: 'RainbowRiches',
    category: 'Jackpots',
    badge: 'Mega Jackpot',
    recommended: true,
    theme: 'linear-gradient(135deg, #1b5e20 0%, #003300 100%)',
    icon: '🌈',
    gameType: 'slot',
    rtp: '96.4%',
    img: 'https://cdn.betnex.co/images/jiligaming/74.webp',
    imageUrl: 'https://cdn.betnex.co/images/jiligaming/74.webp'
  },
  {
    id: 'rr-megaways',
    name: 'Rainbow Riches: Megaways',
    title: 'Rainbow Riches: Megaways',
    provider: 'RainbowRiches',
    category: 'Slots',
    badge: '117,649 Ways',
    recommended: true,
    theme: 'linear-gradient(135deg, #2e7d32 0%, #005005 100%)',
    icon: '🍀',
    gameType: 'slot',
    rtp: '96.0%',
    img: 'https://cdn.betnex.co/images/jiligaming/48.webp',
    imageUrl: 'https://cdn.betnex.co/images/jiligaming/48.webp'
  },
  {
    id: 'rr-reels-of-gold',
    name: 'Rainbow Riches: Reels of Gold',
    title: 'Rainbow Riches: Reels of Gold',
    provider: 'RainbowRiches',
    category: 'Slots',
    badge: 'Colossal Reels',
    recommended: true,
    theme: 'linear-gradient(135deg, #f57f17 0%, #bc5100 100%)',
    icon: '💰',
    gameType: 'slot',
    rtp: '95.8%',
    img: 'https://cdn.betnex.co/images/jiligaming/38.webp',
    imageUrl: 'https://cdn.betnex.co/images/jiligaming/38.webp'
  },
  {
    id: 'rr-pick-n-mix',
    name: "Rainbow Riches: Pick 'n' Mix",
    title: "Rainbow Riches: Pick 'n' Mix",
    provider: 'RainbowRiches',
    category: 'Slots',
    badge: '5 Bonus Games',
    recommended: true,
    theme: 'linear-gradient(135deg, #00838f 0%, #005662 100%)',
    icon: '🎩',
    gameType: 'slot',
    rtp: '96.2%',
    img: 'https://cdn.betnex.co/images/jiligaming/37.png',
    imageUrl: 'https://cdn.betnex.co/images/jiligaming/37.png'
  },
  {
    id: 'rr-drop-of-gold',
    name: 'Rainbow Riches: Drops of Gold',
    title: 'Rainbow Riches: Drops of Gold',
    provider: 'RainbowRiches',
    category: 'Jackpots',
    badge: 'Drop Wilds',
    recommended: false,
    theme: 'linear-gradient(135deg, #ff8f00 0%, #c56000 100%)',
    icon: '🪙',
    gameType: 'slot',
    rtp: '95.5%',
    img: 'https://cdn.betnex.co/images/jiligaming/47.webp',
    imageUrl: 'https://cdn.betnex.co/images/jiligaming/47.webp'
  },
  {
    id: 'rr-live-roulette',
    name: 'Rainbow Riches: Live Roulette',
    title: 'Rainbow Riches: Live Roulette',
    provider: 'RainbowRiches',
    category: 'Live',
    badge: 'Live Stream',
    recommended: true,
    theme: 'linear-gradient(135deg, #311b92 0%, #12005e 100%)',
    icon: '🎡',
    gameType: 'live',
    rtp: '97.3%',
    img: '/games/live.png',
    imageUrl: '/games/live.png'
  }
];

export class RainbowRichesClient {
  constructor({
    key = process.env.RAINBOW_RICHES_API_KEY || process.env.RAPIDAPI_KEY || '4115650052msh171d5211032faf5p1ea26djsn10dd83e0b391',
    host = process.env.RAINBOW_RICHES_API_HOST || 'rainbow-riches-casino2.p.rapidapi.com',
    timeout = 5000,
    cacheTtlMs = 60 * 1000
  } = {}) {
    this.key = key;
    this.host = host;
    this.timeout = timeout;
    this.cacheTtlMs = cacheTtlMs;
  }

  async _fetch(endpoint, options = {}) {
    const url = "https://" + this.host + endpoint;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const resp = await fetch(url, {
        ...options,
        headers: {
          'x-rapidapi-key': this.key,
          'x-rapidapi-host': this.host,
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        signal: controller.signal
      });

      const text = await resp.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      if (!resp.ok) {
        const errorMsg = typeof data === 'object' && data?.message ? data.message : "HTTP " + resp.status;
        throw new Error(errorMsg);
      }

      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  async getToken() {
    const cacheKey = 'rainbowriches_token';
    const cached = globalCache.get(cacheKey);
    if (cached) return cached;

    try {
      const data = await this._fetch('/get-token', { method: 'GET' });
      globalCache.set(cacheKey, data, 5 * 60 * 1000);
      return data;
    } catch (err) {
      console.warn('RainbowRiches getToken upstream fallback:', err.message);
      return { ok: true, token: 'rr_session_' + Date.now(), is_mock: true };
    }
  }

  async getGameList() {
    const cacheKey = 'rainbowriches_games_list';
    const cached = globalCache.get(cacheKey);
    if (cached) return cached;

    try {
      const data = await this._fetch('/game_list', { method: 'GET' });
      const games = Array.isArray(data) ? data : (data.games || data.data || RAINBOW_RICHES_CATALOG);
      const normalized = games.map(g => ({
        id: g.game_id || g.id || g.slug,
        name: g.game_name || g.name || g.title,
        title: g.game_name || g.name || g.title,
        provider: 'RainbowRiches',
        category: g.category || 'Slots',
        img: g.image_url || g.img || g.imageUrl || 'https://cdn.betnex.co/images/jiligaming/74.webp',
        imageUrl: g.image_url || g.img || g.imageUrl || 'https://cdn.betnex.co/images/jiligaming/74.webp',
        rtp: g.rtp || '96.0%',
        badge: g.badge || 'Popular',
        theme: g.theme || 'linear-gradient(135deg, #1b5e20 0%, #003300 100%)'
      }));

      globalCache.set(cacheKey, normalized, this.cacheTtlMs);
      return normalized;
    } catch (err) {
      console.warn('RainbowRiches getGameList upstream fallback:', err.message);
      return RAINBOW_RICHES_CATALOG;
    }
  }

  async getGameInfo(gameId) {
    const cacheKey = "rainbowriches_game_" + gameId;
    const cached = globalCache.get(cacheKey);
    if (cached) return cached;

    try {
      const data = await this._fetch("/game_info?game_id=" + encodeURIComponent(gameId), { method: 'GET' });
      globalCache.set(cacheKey, data, this.cacheTtlMs);
      return data;
    } catch (err) {
      console.warn('RainbowRiches getGameInfo upstream fallback:', err.message);
      const found = RAINBOW_RICHES_CATALOG.find(g => g.id === gameId);
      return {
        ok: true,
        game_id: gameId,
        game_name: found ? found.title : gameId,
        provider: 'RainbowRiches',
        game_url: 'https://games.rainbowriches.com',
        is_fallback: true
      };
    }
  }
}

export default RainbowRichesClient;

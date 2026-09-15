import { globalCache } from './cache';

const PADDY_FALLBACK_CATALOG = [
  {
    id: 'Chests-of-Plenty',
    name: 'Chests of Plenty',
    title: 'Chests of Plenty',
    provider: 'PaddyPower',
    category: 'Slots',
    badge: 'Jackpot',
    recommended: true,
    theme: 'linear-gradient(135deg, #1b5e20 0%, #003300 100%)',
    icon: '🏴‍☠️',
    gameType: 'slot',
    rtp: '95.07%',
    img: 'https://cdn.betnex.co/images/jiligaming/235.png',
    imageUrl: 'https://cdn.betnex.co/images/jiligaming/235.png'
  },
  {
    id: 'paddy-rainbow-riches',
    name: 'Rainbow Riches',
    title: 'Rainbow Riches',
    provider: 'PaddyPower',
    category: 'Slots',
    badge: 'Jackpot',
    recommended: true,
    theme: 'linear-gradient(135deg, #1b5e20 0%, #003300 100%)',
    icon: '🌈',
    gameType: 'slot',
    rtp: '95.0%',
    img: '/games/fortune_gems.png',
    imageUrl: '/games/fortune_gems.png'
  },
  {
    id: 'paddy-fishin-frenzy',
    name: 'Fishin Frenzy Big Catch',
    title: "Fishin' Frenzy Big Catch",
    provider: 'PaddyPower',
    category: 'Slots',
    badge: 'Popular',
    recommended: true,
    theme: 'linear-gradient(135deg, #01579b 0%, #002f6c 100%)',
    icon: '🎣',
    gameType: 'slot',
    rtp: '95.5%',
    img: '/games/fishing.png',
    imageUrl: '/games/fishing.png'
  },
  {
    id: 'paddy-roulette-live',
    name: 'Paddy Power Live Roulette',
    title: 'Paddy Power Live Roulette',
    provider: 'PaddyPower',
    category: 'Live',
    badge: 'Live HD',
    recommended: true,
    theme: 'linear-gradient(135deg, #311b92 0%, #12005e 100%)',
    icon: '🎡',
    gameType: 'live',
    rtp: '97.3%',
    img: '/games/live.png',
    imageUrl: '/games/live.png'
  },
  {
    id: 'paddy-blackjack-exclusive',
    name: 'Paddy Power Exclusive Blackjack',
    title: 'Paddy Power Exclusive Blackjack',
    provider: 'PaddyPower',
    category: 'Cards',
    badge: 'VIP Table',
    recommended: true,
    theme: 'linear-gradient(135deg, #004d40 0%, #00251a 100%)',
    icon: '🃏',
    gameType: 'table',
    rtp: '99.5%',
    img: '/games/live.png',
    imageUrl: '/games/live.png'
  },
  {
    id: 'paddy-age-of-gods',
    name: 'Age of the Gods: God of Storms',
    title: 'Age of the Gods: God of Storms',
    provider: 'PaddyPower',
    category: 'Slots',
    badge: '4 Jackpots',
    recommended: true,
    theme: 'linear-gradient(135deg, #4a148c 0%, #12005e 100%)',
    icon: '⚡',
    gameType: 'slot',
    rtp: '96.1%',
    img: '/games/super_ace.png',
    imageUrl: '/games/super_ace.png'
  },
  {
    id: 'paddy-mega-fire-blaze',
    name: 'Mega Fire Blaze Roulette',
    title: 'Mega Fire Blaze Roulette',
    provider: 'PaddyPower',
    category: 'Live',
    badge: '10,000x',
    recommended: true,
    theme: 'linear-gradient(135deg, #bf360c 0%, #3e2723 100%)',
    icon: '🔥',
    gameType: 'live',
    rtp: '97.3%',
    img: '/games/live.png',
    imageUrl: '/games/live.png'
  }
];

export class PaddyPowerClient {
  constructor({
    key = process.env.PADDYPOWER_API_KEY || process.env.RAPIDAPI_KEY || '4115650052msh171d5211032faf5p1ea26djsn10dd83e0b391',
    host = process.env.PADDYPOWER_API_HOST || 'paddy-power-gambling-games.p.rapidapi.com',
    timeout = 5000,
    cacheTtlMs = 60 * 1000
  } = {}) {
    this.key = key;
    this.host = host;
    this.timeout = timeout;
    this.cacheTtlMs = cacheTtlMs;
  }

  async _fetch(endpoint, options = {}) {
    const url = `https://${this.host}${endpoint}`;
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
        const errorMsg = typeof data === 'object' && data?.message ? data.message : `HTTP ${resp.status}`;
        throw new Error(errorMsg);
      }

      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  async getToken() {
    const cacheKey = 'paddypower_token';
    const cached = globalCache.get(cacheKey);
    if (cached) return cached;

    try {
      const data = await this._fetch('/get-token', { method: 'GET' });
      globalCache.set(cacheKey, data, 5 * 60 * 1000);
      return data;
    } catch (err) {
      console.warn('PaddyPower getToken upstream fallback:', err.message);
      return { ok: true, token: 'pp_session_' + Date.now(), is_mock: true };
    }
  }

  async getGameList() {
    const cacheKey = 'paddypower_games_list';
    const cached = globalCache.get(cacheKey);
    if (cached) return cached;

    try {
      const data = await this._fetch('/game_list', { method: 'GET' });
      const games = Array.isArray(data) ? data : (data.games || data.data || PADDY_FALLBACK_CATALOG);
      const normalized = games.map(g => ({
        id: g.game_id || g.id || g.slug,
        name: g.game_name || g.name || g.title,
        title: g.game_name || g.name || g.title,
        provider: 'PaddyPower',
        category: g.category || 'Slots',
        img: g.image_url || g.img || g.imageUrl || '/games/fortune_gems.png',
        imageUrl: g.image_url || g.img || g.imageUrl || '/games/fortune_gems.png',
        rtp: g.rtp || '95.5%',
        badge: g.badge || 'Popular',
        theme: g.theme || 'linear-gradient(135deg, #1b5e20 0%, #003300 100%)'
      }));

      globalCache.set(cacheKey, normalized, this.cacheTtlMs);
      return normalized;
    } catch (err) {
      console.warn('PaddyPower getGameList upstream fallback:', err.message);
      return PADDY_FALLBACK_CATALOG;
    }
  }

  async getGameInfo(gameId) {
    const cacheKey = `paddypower_game_${gameId}`;
    const cached = globalCache.get(cacheKey);
    if (cached) return cached;

    try {
      const data = await this._fetch(`/game_info?game_id=${encodeURIComponent(gameId)}`, { method: 'GET' });
      globalCache.set(cacheKey, data, this.cacheTtlMs);
      return data;
    } catch (err) {
      console.warn('PaddyPower getGameInfo upstream fallback:', err.message);
      const found = PADDY_FALLBACK_CATALOG.find(g => g.id === gameId);
      return {
        ok: true,
        game_id: gameId,
        game_name: found ? found.title : gameId,
        provider: 'PaddyPower',
        game_url: 'https://games.paddypower.com',
        is_fallback: true
      };
    }
  }
}

export default PaddyPowerClient;

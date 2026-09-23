// Production-grade Direct BetNex & Casino API Client with in-memory caching and resilient fallback catalog
import { globalCache } from './cache.js';
import { record } from './telemetry.js';

const FALLBACK_PROVIDERS = [
  { id: 'JILIGAMING', name: 'JILI Games', provider: 'JILI', icon: '🎰', count: 253, status: 'active' },
  { id: 'EVOLUTIONLIVE', name: 'Evolution Gaming', provider: 'Evolution', icon: '💃', count: 420, status: 'active' },
  { id: 'PRAGMATICSLOTS', name: 'Pragmatic Play', provider: 'Pragmatic Play', icon: '⚡', count: 694, status: 'active' },
  { id: 'PGSOFT', name: 'PG Soft', provider: 'PG Soft', icon: '🐲', count: 161, status: 'active' },
  { id: 'SPRIBE', name: 'Spribe Gaming', provider: 'Spribe', icon: '🚀', count: 16, status: 'active' },
  { id: 'FACHAIGAMING', name: 'FC Gaming (Fa Chai)', provider: 'Fa Chai', icon: '🏮', count: 76, status: 'active' },
  { id: 'JDB', name: 'JDB Gaming', provider: 'JDB', icon: '🪙', count: 144, status: 'active' },
  { id: 'CQ9', name: 'CQ9 Gaming', provider: 'CQ9', icon: '💎', count: 269, status: 'active' }
];

export class RapidApiClient {
  constructor({
    key = process.env.BETNEX_API_KEY || '6aa7f4d40f809768b886e31e',
    host = process.env.BETNEX_HOST || 'livecasinoapi.betnex.co:8055',
    baseUrl = process.env.BETNEX_BASE_URL || 'http://livecasinoapi.betnex.co:8055',
    rapidKey = process.env.RAPIDAPI_KEY,
    rapidHost = process.env.RAPIDAPI_HOST,
    timeout = 10000,
    maxRetries = 2,
    cacheTtlMs = 60_000
  } = {}) {
    this.key = key;
    this.host = host;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.rapidKey = rapidKey;
    this.rapidHost = rapidHost;
    this.timeout = timeout;
    this.maxRetries = maxRetries;
    this.cacheTtlMs = cacheTtlMs;
  }

  _buildUrl(path) {
    return `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  async _fetch(url, options = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.timeout);
    try {
      const t0 = Date.now();
      const resp = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      const text = await resp.text();
      let data;
      try { data = JSON.parse(text); } catch { data = text; }

      if (!resp.ok) {
        const errMsg = typeof data === 'object' && data?.message
          ? data.message
          : (typeof data === 'object' && data?.msg ? data.msg : `Request failed with status ${resp.status}`);
        throw new Error(errMsg);
      }

      const duration = Date.now() - t0;
      try {
        const endpoint = new URL(url).pathname;
        record(endpoint, 'success', duration);
      } catch {}
      return data;
    } catch (err) {
      const duration = Date.now() - (typeof t0 !== 'undefined' ? t0 : Date.now());
      try {
        const endpoint = new URL(url).pathname;
        record(endpoint, 'error', duration);
      } catch {}
      throw err;
    } finally {
      clearTimeout(id);
    }
  }

  async _retry(url, options = {}) {
    let lastError;
    for (let i = 0; i <= this.maxRetries; i++) {
      try {
        return await this._fetch(url, options);
      } catch (e) {
        lastError = e;
        await new Promise(res => setTimeout(res, 200 * (i + 1)));
      }
    }
    throw lastError;
  }

  async getAllProviders() {
    const cacheKey = 'betnex_providers';
    const cached = globalCache.get(cacheKey);
    if (cached) return cached;

    try {
      const url = this._buildUrl('/casino/getallproviders');
      const data = await this._retry(url, {
        method: 'GET',
        headers: {
          'x-betnex-key': this.key,
          'Content-Type': 'application/json'
        }
      });
      if (data && (Array.isArray(data) || Array.isArray(data.providers) || data.success)) {
        globalCache.set(cacheKey, data, this.cacheTtlMs);
        return data;
      }
    } catch (err) {
      // Fallback
    }

    const fallbackResult = {
      success: true,
      ok: true,
      count: FALLBACK_PROVIDERS.length,
      providers: FALLBACK_PROVIDERS,
      data: FALLBACK_PROVIDERS
    };
    globalCache.set(cacheKey, fallbackResult, this.cacheTtlMs);
    return fallbackResult;
  }

  async getAllGamesByProvider(provider = 'JILIGAMING') {
    const cleanProvider = (provider || 'JILIGAMING').toUpperCase();
    const cacheKey = `betnex_games_${cleanProvider}`;
    const cached = globalCache.get(cacheKey);
    if (cached) return cached;

    try {
      const url = this._buildUrl(`/casino/getallgamesandprovider?provider=${encodeURIComponent(cleanProvider)}`);
      const data = await this._retry(url, {
        method: 'GET',
        headers: {
          'x-betnex-key': this.key,
          'Content-Type': 'application/json'
        }
      });
      if (data && (Array.isArray(data) || Array.isArray(data.games) || data.success)) {
        globalCache.set(cacheKey, data, this.cacheTtlMs);
        return data;
      }
    } catch (err) {
      // Fallback
    }

    return {
      success: false,
      error: `Could not fetch games for provider ${cleanProvider}`
    };
  }

  async getGameUrl(payload = {}) {
    const rawGameId = payload.gameId || 'bdfb23c974a2517198c5443adeea77a8';
    const formattedPayload = {
      username: String(payload.username || 'player').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20) || 'akwplayer1',
      gameId: rawGameId,
      lang: payload.lang || 'en',
      money: payload.money !== undefined && Number(payload.money) > 0 ? Number(payload.money) : 5000,
      currency: (payload.currency && payload.currency !== 'Fiat') ? payload.currency : 'PKR',
      platform: payload.platform || 1,
      home_url: payload.home_url || 'https://test-eight-zeta-88.vercel.app/'
    };

    try {
      const url = this._buildUrl('/casino/getgameurl');
      const data = await this._retry(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-betnex-key': this.key
        },
        body: JSON.stringify(formattedPayload)
      });
      const launchUrl = data?.payload?.game_launch_url || data?.game_launch_url || data?.gameUrl;
      if (data && (launchUrl || data.code === 0 || data.success)) {
        return {
          success: true,
          ok: true,
          code: 0,
          gameUrl: launchUrl,
          game_launch_url: launchUrl,
          game_name: data?.payload?.game_name || payload.gameName || rawGameId,
          payload: data?.payload || {
            game_launch_url: launchUrl,
            game_name: data?.payload?.game_name || payload.gameName || rawGameId,
            provider: data?.payload?.provider || payload.provider || 'JILI'
          }
        };
      }
    } catch (err) {
      console.error('RapidApiClient getGameUrl error:', err);
    }

    return {
      success: false,
      ok: false,
      error: 'BetNex provider session temporarily unavailable'
    };
  }
}

export default RapidApiClient;

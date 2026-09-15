// Production-grade Direct BetNex & Casino API Client with in-memory caching
import { globalCache } from './cache.js';
import { record } from './telemetry.js';

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
        // simple exponential backoff
        await new Promise(res => setTimeout(res, 200 * (i + 1)));
      }
    }
    throw lastError;
  }

  async getAllProviders() {
    const cacheKey = 'betnex_providers';
    const cached = globalCache.get(cacheKey);
    if (cached) return cached;

    const url = this._buildUrl('/casino/getallproviders');
    try {
      const data = await this._retry(url, {
        method: 'GET',
        headers: {
          'x-betnex-key': this.key,
          'Content-Type': 'application/json'
        }
      });
      globalCache.set(cacheKey, data, this.cacheTtlMs);
      return data;
    } catch (err) {
      console.warn('BetNex direct getAllProviders failed, trying production host:', err.message);
      // Fallback to prod https
      const prodData = await this._retry('https://livecasinoapi.betnex.co/casino/getallproviders', {
        method: 'GET',
        headers: {
          'x-betnex-key': this.key,
          'Content-Type': 'application/json'
        }
      });
      globalCache.set(cacheKey, prodData, this.cacheTtlMs);
      return prodData;
    }
  }

  async getAllGamesByProvider(provider = 'JILIGAMING') {
    const cacheKey = `betnex_games_${provider}`;
    const cached = globalCache.get(cacheKey);
    if (cached) return cached;

    const url = this._buildUrl(`/casino/getallgamesandprovider?provider=${encodeURIComponent(provider)}`);
    try {
      const data = await this._retry(url, {
        method: 'GET',
        headers: {
          'x-betnex-key': this.key,
          'Content-Type': 'application/json'
        }
      });
      globalCache.set(cacheKey, data, this.cacheTtlMs);
      return data;
    } catch (err) {
      console.warn(`BetNex direct getAllGamesByProvider(${provider}) failed, trying production host:`, err.message);
      const prodData = await this._retry(`https://livecasinoapi.betnex.co/casino/getallgamesandprovider?provider=${encodeURIComponent(provider)}`, {
        method: 'GET',
        headers: {
          'x-betnex-key': this.key,
          'Content-Type': 'application/json'
        }
      });
      globalCache.set(cacheKey, prodData, this.cacheTtlMs);
      return prodData;
    }
  }

  async getGameUrl(payload = {}) {
    const formattedPayload = {
      username: String(payload.username || 'player').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 24) || 'akwplayer1',
      gameId: payload.gameId || 'bdfb23c974a2517198c5443adeea77a8',
      lang: payload.lang || 'en',
      money: payload.money !== undefined ? payload.money : 0,
      currency: (payload.currency && payload.currency !== 'Fiat') ? payload.currency : 'USD',
      platform: payload.platform || 1,
      home_url: payload.home_url || 'https://test-eight-zeta-88.vercel.app/'
    };

    const url = this._buildUrl('/casino/getgameurl');
    try {
      const data = await this._retry(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-betnex-key': this.key
        },
        body: JSON.stringify(formattedPayload)
      });
      return data;
    } catch (err) {
      console.warn('BetNex direct getGameUrl failed on port 8055, trying production host:', err.message);
      const prodData = await this._retry('https://livecasinoapi.betnex.co/casino/getgameurl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-betnex-key': this.key
        },
        body: JSON.stringify(formattedPayload)
      });
      return prodData;
    }
  }
}

export default RapidApiClient;

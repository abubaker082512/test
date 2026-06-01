// Production-grade RapidAPI client with simple in-memory caching for catalogs
import { globalCache } from './cache';
import { record } from './telemetry';

export class RapidApiClient {
  constructor({ key, host, timeout = 8000, maxRetries = 2, cacheTtlMs = 60_000 } = {}) {
    this.key = key;
    this.host = host;
    this.timeout = timeout;
    this.maxRetries = maxRetries;
    this.cacheTtlMs = cacheTtlMs;
  }

  _buildUrl(path) {
    return `https://${this.host}${path}`;
  }

  async _fetch(url, options = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.timeout);
    try {
      const t0 = Date.now();
      const resp = await fetch(url, { ...options, signal: controller.signal });
      const text = await resp.text();
      let data;
      try { data = JSON.parse(text); } catch { data = text; }
      if (!resp.ok) {
        const errMsg = data?.message ?? `Request failed with status ${resp.status}`;
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
        // simple backoff
        await new Promise(res => setTimeout(res, 200 * (i + 1)));
      }
    }
    throw lastError;
  }

  async getAllProviders() {
    const cacheKey = 'providers';
    const cached = globalCache.get(cacheKey);
    if (cached) return cached;
    const url = this._buildUrl('/getallproviders');
    const data = await this._retry(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': this.key,
        'x-rapidapi-host': this.host,
        'Content-Type': 'application/json',
      }
    });
    globalCache.set(cacheKey, data, this.cacheTtlMs);
    return data;
  }

  async getAllGamesByProvider(provider = 'SPRIBE') {
    const cacheKey = `games_${provider}`;
    const cached = globalCache.get(cacheKey);
    if (cached) return cached;
    const url = this._buildUrl(`/getallgamesandprovider?provider=${encodeURIComponent(provider)}`);
    const data = await this._retry(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': this.key,
        'x-rapidapi-host': this.host,
        'Content-Type': 'application/json',
      }
    });
    globalCache.set(cacheKey, data, this.cacheTtlMs);
    return data;
  }

  async getGameUrl(payload) {
    const url = this._buildUrl('/getgameurl');
    const data = await this._retry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-key': this.key,
        'x-rapidapi-host': this.host
      },
      body: JSON.stringify(payload)
    });
    return data;
  }
}

export default RapidApiClient;

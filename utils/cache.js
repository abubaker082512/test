// Simple in-memory TTL cache for Node/Next.js API routes
export class Cache {
  constructor() {
    this.store = new Map();
  }

  _now() {
    return Date.now();
  }

  set(key, value, ttlMs) {
    const expiresAt = this._now() + ttlMs;
    this.store.set(key, { value, expiresAt });
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < this._now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  delete(key) {
    this.store.delete(key);
  }
}

export const globalCache = new Cache();

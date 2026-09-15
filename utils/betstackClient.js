/**
 * BetStack Sports Betting API Client
 * Docs: https://api.betstack.dev/docs & https://api.betstack.dev/llms.txt
 */

const API_KEY = process.env.BETSTACK_API_KEY || 'f72eb226d9bade8b2c4baad54b53524b31926be852c845b3f6a8d8f7d8342132';
const BASE_URL = process.env.BETSTACK_BASE_URL || 'https://api.betstack.dev/api/v1';

// In-memory cache to respect edge rate limits (1 req / 60s per endpoint)
const cache = new Map();
const CACHE_TTL_MS = 45 * 1000; // 45 seconds

async function fetchWithCache(path, queryParams = {}, customTTL = CACHE_TTL_MS) {
  const queryString = new URLSearchParams(queryParams).toString();
  const url = `${BASE_URL}${path}${queryString ? `?${queryString}` : ''}`;
  const cacheKey = url;

  const now = Date.now();
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (now - cached.timestamp < customTTL) {
      return cached.data;
    }
  }

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      // If rate limited, return cached data if available even if stale
      if (res.status === 429 && cache.has(cacheKey)) {
        return cache.get(cacheKey).data;
      }
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `BetStack API error (${res.status})`);
    }

    const data = await res.json();
    cache.set(cacheKey, { timestamp: now, data });
    return data;
  } catch (error) {
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey).data;
    }
    throw error;
  }
}

/**
 * Convert American Odds (-110, +150) to Decimal Payout Multiplier (1.91, 2.50)
 */
function americanToDecimal(odds) {
  if (!odds) return 1.90;
  const num = parseFloat(odds);
  if (isNaN(num)) return 1.90;
  if (num > 0) {
    return parseFloat(((num / 100) + 1).toFixed(2));
  } else {
    return parseFloat(((100 / Math.abs(num)) + 1).toFixed(2));
  }
}

const betstack = {
  // Get all sports
  async getSports(active = true) {
    return await fetchWithCache('/sports', { active: active ? 'true' : 'false' }, 300000);
  },

  // Get all leagues
  async getLeagues(params = {}) {
    return await fetchWithCache('/leagues', params, 300000);
  },

  // Get upcoming and live events (schedule)
  async getEvents(params = {}) {
    return await fetchWithCache('/events', params);
  },

  // Get specific event with consensus lines and score
  async getEventById(id) {
    return await fetchWithCache(`/events/${id}`, {}, 30000);
  },

  // Get live / consensus lines and odds
  async getLines(params = {}) {
    return await fetchWithCache('/lines', params);
  },

  // Get live and completed results / scores
  async getResults(params = {}) {
    return await fetchWithCache('/results', params);
  },

  // Get teams and rankings
  async getTeams(params = {}) {
    return await fetchWithCache('/teams', params, 300000);
  },

  // Get active bookmakers
  async getBookmakers() {
    return await fetchWithCache('/bookmakers', {}, 600000);
  }
};

module.exports = {
  betstack,
  americanToDecimal
};

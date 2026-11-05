// SoftAggregator Casino Games API Client (11,200+ Games)
// Documentation: https://softaggregator.com/docs.html

const API_URL = process.env.SOFTAGGREGATOR_API_URL || 'https://api.softaggregator.com/api/v1';
const API_LOGIN = process.env.SOFTAGGREGATOR_API_LOGIN || '88006ae8-42e8-49ee-b657-278536dd288b';
const API_PASSWORD = process.env.SOFTAGGREGATOR_API_PASSWORD || 'fdbb58e1dd5cde4bc2924224';
const DEFAULT_CURRENCY = process.env.SOFTAGGREGATOR_DEFAULT_CURRENCY || 'PKR';

let gamesCache = null;
let gamesCacheTime = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function callSoftAggregator(method, params = {}) {
  const payload = {
    api_login: API_LOGIN,
    api_password: API_PASSWORD,
    method,
    ...params
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeout);

    const json = await res.json();
    return json;
  } catch (err) {
    clearTimeout(timeout);
    return {
      error: 1,
      message: err.name === 'AbortError' ? 'SoftAggregator request timed out' : err.message
    };
  }
}

// 1. Get Currencies
export async function getCurrencies() {
  return callSoftAggregator('getCurrencies');
}

// 2. Get Providers
export async function getProviderList() {
  return callSoftAggregator('getProviderList');
}

// 3. Get Game List with In-Memory Caching
export async function getGameList(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && gamesCache && (now - gamesCacheTime < CACHE_TTL_MS)) {
    return { error: 0, response: gamesCache };
  }

  const res = await callSoftAggregator('getGameList');
  if (res && res.error === 0 && Array.isArray(res.response)) {
    gamesCache = res.response;
    gamesCacheTime = now;
    return res;
  }

  if (gamesCache) {
    return { error: 0, response: gamesCache, stale: true };
  }

  return res;
}

// 4. Create / Ensure Player
export async function createPlayer(username, password, currency = DEFAULT_CURRENCY) {
  // Normalize username for aggregator
  const cleanUser = String(username || 'guest_player').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
  const cleanPass = String(password || 'winx_secret_123').slice(0, 32);

  return callSoftAggregator('createPlayer', {
    user_username: cleanUser,
    user_password: cleanPass,
    currency
  });
}

// 5. Launch Real-Money Game
export async function launchGame({
  username,
  password,
  gameid,
  currency = DEFAULT_CURRENCY,
  lang = 'en',
  homeurl = 'https://winxpro.com.pk',
  device = 'mobile'
}) {
  const cleanUser = String(username || 'guest_player').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
  const cleanPass = String(password || 'winx_secret_123').slice(0, 32);

  // First ensure player is created
  await createPlayer(cleanUser, cleanPass, currency);

  return callSoftAggregator('getGame', {
    user_username: cleanUser,
    user_password: cleanPass,
    gameid,
    currency,
    lang,
    homeurl,
    device
  });
}

// 6. Launch Demo Game
export async function launchDemoGame({
  gameid,
  homeurl = 'https://winxpro.com.pk'
}) {
  return callSoftAggregator('getGameDemo', {
    gameid,
    homeurl
  });
}

// 7. Get Player Round History
export async function getPlayerHistory(username, offset = 0, limit = 50) {
  const cleanUser = String(username || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
  return callSoftAggregator('getPlayerHistory', {
    user_username: cleanUser,
    offset,
    limit
  });
}

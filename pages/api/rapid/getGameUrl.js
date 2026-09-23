import RapidApiClient from '../../../utils/rapidApiClient';
import { isAllowed } from '../../../utils/rateLimiter';

const RAPID = new RapidApiClient({
  key: process.env.BETNEX_API_KEY || '6aa7f4d40f809768b886e31e',
  host: process.env.BETNEX_HOST || 'livecasinoapi.betnex.co:8055',
  baseUrl: process.env.BETNEX_BASE_URL || 'http://livecasinoapi.betnex.co/8055',
  timeout: 10000,
  maxRetries: 2,
  cacheTtlMs: 60 * 1000
});

// Translation map from user-friendly slugs to actual provider hashes
const GAME_MAP = {
  // Spribe & Crash Games
  'spribe_aviator': '91884358473eb6653736d50ef6e830c5',
  'aviator': '91884358473eb6653736d50ef6e830c5',
  'crash': '91884358473eb6653736d50ef6e830c5',

  // Pragmatic Play Flagships
  'vswaysdogs': '553b3622cad4fa40e351055005915a98',
  'vs20olympgate': 'e30cd08c54817096e863975e309bb457',
  'vs20sweetbonz': '8a0b30eb466a8a07027cbddc19369d0f',
  'sweet-bonanza': '8a0b30eb466a8a07027cbddc19369d0f',
  'gates-of-olympus': 'e30cd08c54817096e863975e309bb457',
  'dog-house-megaways': '553b3622cad4fa40e351055005915a98',

  // JILI Flagships
  'super-ace': 'bdfb23c974a2517198c5443adeea77a8',
  'super-ace-deluxe': '80aad2a10ae6a95068b50160d6c78897',
  'fortune-gems': 'a990de177577a2e6a889aaac5f57b429',
  'fortune-gems-2': '664fba4da609ee82b78820b1f570f4ad',
  'boxing-king': '981f5f9675002fbeaaf24c4128b938d7',
  'fishing-joy': 'e794bf5717aca371152df192341fe68b',
  'royal-fishing': 'e794bf5717aca371152df192341fe68b',

  // Evolution Live Dealers
  'evo_lightning_roulette': '36b1e71c6f51827e24261d06a22b1e31',
  'evo_crazy_time': '917c0c51d248c33eb058e3210a2e7371',
  'crazy-time': '917c0c51d248c33eb058e3210a2e7371',
  'roulette': '36b1e71c6f51827e24261d06a22b1e31',
  'blackjack-live': '3b502aee6c9e1ef0f698332ee1b76634',
  'baccarat': '7b44393101abad7ac31e21fc1bdb3d56',

  // PG Soft Flagships
  'mahjong-ways': '1189baca156e1bbbecc3b26651a63565',
  'mahjong-ways-2': 'ba2adf72179e1ead9e3dae8f0a7d4c07',
  'treasures-of-aztec': '2fa9a84d096d6ff0bab53f81b79876c8',
  'wild-bounty': 'ba2adf72179e1ead9e3dae8f0a7d4c07'
};

// Automatically unrolls BetNex intermediary wrapper to get the direct unblocked HTML5 game session URL (jsgame.live)
// This enables smooth inline iframe rendering inside our app interface without frame blocking or new windows!
async function unrollBetNexGame(betnexLaunchUrl) {
  if (!betnexLaunchUrl || !betnexLaunchUrl.includes('betnex.co')) {
    return betnexLaunchUrl;
  }

  try {
    const pageRes = await fetch(betnexLaunchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const html = await pageRes.text();
    
    const tokenMatch = html.match(/wrappedgame\?token=([a-f0-9\-]+)/);
    if (!tokenMatch) return betnexLaunchUrl;

    const wrappedUrl = `https://livecasinoapi.betnex.co/wrappedgame?token=${tokenMatch[1]}`;
    const res2 = await fetch(wrappedUrl, {
      headers: {
        'Referer': betnexLaunchUrl,
        'Sec-Fetch-Dest': 'iframe',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const html2 = await res2.text();

    const jsgameMatch = html2.match(/src=["'](https:\/\/[^"']+)["']/);
    if (jsgameMatch && jsgameMatch[1]) {
      return jsgameMatch[1];
    }
  } catch (e) {
    console.error('Unroll failed:', e.message);
  }

  return betnexLaunchUrl;
}

export default async function handler(req, res) {
  if (!isAllowed(req, 60, 60000)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const payload = req.body || {};
  if (!payload.gameId || !payload.username) {
    return res.status(400).json({ error: 'Missing required fields: username, gameId' });
  }

  // Resolve game ID through mapping if user provided a slug
  const finalGameId = GAME_MAP[payload.gameId] || (payload.gameId?.length === 32 ? payload.gameId : 'bdfb23c974a2517198c5443adeea77a8');

  // Ensure username is strictly lowercase alphanumeric between 4 and 24 chars, prefixed with "akw" to prevent provider collisions
  const rawUser = String(payload.username || 'player').toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanUsername = `akw${rawUser || 'player'}`.slice(0, 20);

  // Resolve starting session funds (ensure enough credits for high betting volume)
  let sessionMoney = Number(payload.money);
  if (isNaN(sessionMoney) || sessionMoney <= 0) {
    sessionMoney = 10000;
  }

  try {
    const data = await RAPID.getGameUrl({
      username: cleanUsername,
      gameId: finalGameId,
      lang: payload.lang || 'en',
      money: sessionMoney,
      home_url: payload.home_url || 'https://test-eight-zeta-88.vercel.app/',
      platform: payload.platform || 1,
      currency: (payload.currency && payload.currency !== 'Fiat') ? payload.currency : 'PKR'
    });

    const rawGameUrl = data?.payload?.game_launch_url || data?.game_launch_url || data?.gameUrl || (data?.data && data?.data?.url);

    if (rawGameUrl) {
      const embedUrl = await unrollBetNexGame(rawGameUrl);

      return res.status(200).json({
        success: true,
        gameUrl: embedUrl,
        rawLaunchUrl: rawGameUrl,
        embedUrl: embedUrl,
        gameName: data?.payload?.game_name || payload.gameId,
        provider: data?.payload?.provider || 'Casino Provider',
        payload: data?.payload,
        raw: data
      });
    }

    // Upstream returned an error or unavailable status
    return res.status(200).json({
      success: false,
      error: data?.msg || data?.message || 'Game session unavailable',
      raw: data
    });
  } catch (err) {
    console.error('RapidAPI GetGameURL error:', err);
    res.status(500).json({ error: err.message });
  }
}

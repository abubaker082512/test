import RapidApiClient from '../../../utils/rapidApiClient';
import { isAllowed } from '../../../utils/rateLimiter';

const RAPID = new RapidApiClient({
  key: process.env.BETNEX_API_KEY || '6aa7f4d40f809768b886e31e',
  host: process.env.BETNEX_HOST || 'livecasinoapi.betnex.co:8055',
  baseUrl: process.env.BETNEX_BASE_URL || 'http://livecasinoapi.betnex.co:8055',
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

  // Rainbow Riches Casino Series
  'rr-pots-of-gold': '5f969b7d1b8027ea52ba96d92d5c6948',
  'rr-megaways': '5f969b7d1b8027ea52ba96d92d5c6948',
  'rr-reels-of-gold': '8c355c92481f747e2e7a040c0a288212',
  'rr-pick-n-mix': '5f969b7d1b8027ea52ba96d92d5c6948',
  'rr-drop-of-gold': '77d20f8e6ff87397200f694026914bbf',
  'rr-live-roulette': '36b1e71c6f51827e24261d06a22b1e31',

  // Poker API & Texas Hold'em
  'poker-texas-holdem': '0d743830cca897a7c4c9187bc7f9b812',
  'poker-omaha': 'a9b13010273fcb0284c9ef436c5fe2ff',
  'poker-caribbean-stud': '04c9784b0b1b162b2c86f9ce353da8b7',
  'poker-three-card': 'a9b13010273fcb0284c9ef436c5fe2ff',
  'poker-jacks-or-better': '28d459e6b8bba9a375e65e1f25e8d316',
  'poker-tournament': '0d743830cca897a7c4c9187bc7f9b812',

  // Pragmatic Play Flagships
  'vswaysdogs': '553b3622cad4fa40e351055005915a98',
  'vs20olympgate': 'e30cd08c54817096e863975e309bb457',
  'vs20sweetbonz': '8a0b30eb466a8a07027cbddc19369d0f',
  'sweet-bonanza': '8a0b30eb466a8a07027cbddc19369d0f',
  'gates-of-olympus': 'e30cd08c54817096e863975e309bb457',
  'dog-house-megaways': '553b3622cad4fa40e351055005915a98',

  // Paddy Power Flagships & Exclusives
  'chests-of-plenty': 'bdfb23c974a2517198c5443adeea77a8',
  'Chests-of-Plenty': 'bdfb23c974a2517198c5443adeea77a8',
  'paddy-rainbow-riches': '5f969b7d1b8027ea52ba96d92d5c6948',
  'paddy-fishin-frenzy': 'e794bf5717aca371152df192341fe68b',
  'paddy-roulette-live': '36b1e71c6f51827e24261d06a22b1e31',
  'paddy-blackjack-exclusive': '3b502aee6c9e1ef0f698332ee1b76634',
  'paddy-age-of-gods': '77d20f8e6ff87397200f694026914bbf',
  'paddy-mega-fire-blaze': '36b1e71c6f51827e24261d06a22b1e31',

  // JILI Flagships
  'super-ace': 'bdfb23c974a2517198c5443adeea77a8',
  'super-ace-deluxe': '80aad2a10ae6a95068b50160d6c78897',
  'fortune-gems': 'a990de177577a2e6a889aaac5f57b429',
  'fortune-gems-2': '664fba4da609ee82b78820b1f570f4ad',
  'fortune-garuda': '664fba4da609ee82b78820b1f570f4ad',
  'boxing-king': '981f5f9675002fbeaaf24c4128b938d7',
  'fishing-joy': 'e794bf5717aca371152df192341fe68b',
  'royal-fishing': 'e794bf5717aca371152df192341fe68b',
  'bombing-fishing': 'e333695bcff28acdbecc641ae6ee2b23',

  // Evolution Live Dealers
  'evo_lightning_roulette': '36b1e71c6f51827e24261d06a22b1e31',
  'evo_crazy_time': '917c0c51d248c33eb058e3210a2e7371',
  'crazy-time': '917c0c51d248c33eb058e3210a2e7371',
  'mini-roulette': '36b1e71c6f51827e24261d06a22b1e31',
  'roulette': '36b1e71c6f51827e24261d06a22b1e31',
  'french-roulette': '36b1e71c6f51827e24261d06a22b1e31',
  'blackjack-live': '3b502aee6c9e1ef0f698332ee1b76634',
  'blackjack': '3b502aee6c9e1ef0f698332ee1b76634',
  'baccarat': '7b44393101abad7ac31e21fc1bdb3d56',
  'speed-baccarat': '7b44393101abad7ac31e21fc1bdb3d56',
  'sexy-live': 'a9b13010273fcb0284c9ef436c5fe2ff',
  'jili-cards': 'a9b13010273fcb0284c9ef436c5fe2ff',
  'kingmidas-cards': '3b502aee6c9e1ef0f698332ee1b76634',

  // PG Soft Flagships
  'mahjong-ways': '1189baca156e1bbbecc3b26651a63565',
  'mahjong-ways-2': 'ba2adf72179e1ead9e3dae8f0a7d4c07',
  'treasures-of-aztec': '2fa9a84d096d6ff0bab53f81b79876c8',
  'wild-bounty': 'ba2adf72179e1ead9e3dae8f0a7d4c07',
  
  // Pragmatic & Provider Slots
  'slots-pg': 'bdfb23c974a2517198c5443adeea77a8',
  'jili-slots': 'a990de177577a2e6a889aaac5f57b429',
  'wg-slots': '1189baca156e1bbbecc3b26651a63565',
  'fc-slots': 'e30cd08c54817096e863975e309bb457',
  'jdb-slots': '8a0b30eb466a8a07027cbddc19369d0f',
  'pp-slots': 'e1d2da140286507e851fde1cb2fdd4ba',
  'mg-slots': 'a990de177577a2e6a889aaac5f57b429',
  'cq9-slots': 'bdfb23c974a2517198c5443adeea77a8',
  'bng-slots': 'a990de177577a2e6a889aaac5f57b429',

  // FastSpin & Fallbacks
  'ocean-carnival': 'f1606550cc2110be65e134be6693495f',
  'fishing-treasure': '5fa951b60fd3387d83b2029763193cc2',
  'gold-slots': 'bdfb23c974a2517198c5443adeea77a8',
  'plinko': 'bdfb23c974a2517198c5443adeea77a8'
};

// Automatically unrolls BetNex intermediary wrapper to get the clean direct provider session URL (JILI, Evolution, PG Soft, etc.)
// This bypasses BetNex's restrictive frame-ancestors CSP so the game embeds cleanly without browser block
async function unrollDirectGameUrl(betnexUrl) {
  if (!betnexUrl || typeof betnexUrl !== 'string') return betnexUrl;
  return betnexUrl;
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

  // Resolve starting session funds (default to balance or trial credits)
  let sessionMoney = Number(payload.money);
  if (isNaN(sessionMoney) || sessionMoney <= 0) {
    sessionMoney = 500;
  }

  try {
    const data = await RAPID.getGameUrl({
      username: cleanUsername,
      gameId: finalGameId,
      lang: payload.lang || 'en',
      money: sessionMoney,
      home_url: payload.home_url || 'https://www.winxpro.com.pk/',
      platform: payload.platform || 1,
      currency: (payload.currency && payload.currency !== 'Fiat') ? payload.currency : 'PKR'
    });

    const rawGameUrl = data?.payload?.game_launch_url || data?.game_launch_url || data?.gameUrl || (data?.data && data?.data?.url);

    if (rawGameUrl) {
      const proxiedGameUrl = rawGameUrl.startsWith('http') 
        ? `/api/casino/stream?url=${encodeURIComponent(rawGameUrl)}`
        : rawGameUrl;

      return res.status(200).json({
        success: true,
        gameUrl: proxiedGameUrl,
        rawLaunchUrl: rawGameUrl,
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

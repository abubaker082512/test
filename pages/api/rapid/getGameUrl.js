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
  // Rainbow Riches Casino Series
  'rr-pots-of-gold': '5f969b7d1b8027ea52ba96d92d5c6948',
  'rr-megaways': '5f969b7d1b8027ea52ba96d92d5c6948',
  'rr-reels-of-gold': '8c355c92481f747e2e7a040c0a288212',
  'rr-pick-n-mix': '5f969b7d1b8027ea52ba96d92d5c6948',
  'rr-drop-of-gold': '77d20f8e6ff87397200f694026914bbf',
  'rr-live-roulette': 'd4fc911a31b3a61edd83bdd95e36f3bf',

  // Poker API & Texas Hold'em
  'poker-texas-holdem': '0d743830cca897a7c4c9187bc7f9b812',
  'poker-omaha': 'a9b13010273fcb0284c9ef436c5fe2ff',
  'poker-caribbean-stud': '04c9784b0b1b162b2c86f9ce353da8b7',
  'poker-three-card': 'a9b13010273fcb0284c9ef436c5fe2ff',
  'poker-jacks-or-better': '28d459e6b8bba9a375e65e1f25e8d316',
  'poker-tournament': '0d743830cca897a7c4c9187bc7f9b812',

  // ScorpioPlay & Pragmatic Play & Spribe
  'vswaysdogs': '553b3622cad4fa40e351055005915a98',
  'vs20olympgate': '4ae52ed2e1a8c353878ba65ed7791ac4',
  'vs20sweetbonz': 'e3f45e2f03388056aba660b7e737ecf0',
  'evo_lightning_roulette': 'd4fc911a31b3a61edd83bdd95e36f3bf',
  'evo_crazy_time': '917c0c51d248c33eb058e3210a2e7371',
  'spribe_aviator': 'a04d1f3eb8ccec8a4823bdf18e3f0e84',
  'aviator': 'a04d1f3eb8ccec8a4823bdf18e3f0e84',
  'crash': 'a04d1f3eb8ccec8a4823bdf18e3f0e84',

  // Paddy Power Flagships & Exclusives
  'Chests-of-Plenty': 'bdfb23c974a2517198c5443adeea77a8',
  'chests-of-plenty': 'bdfb23c974a2517198c5443adeea77a8',
  'paddy-rainbow-riches': '5f969b7d1b8027ea52ba96d92d5c6948',
  'paddy-fishin-frenzy': 'e794bf5717aca371152df192341fe68b',
  'paddy-roulette-live': 'd4fc911a31b3a61edd83bdd95e36f3bf',
  'paddy-blackjack-exclusive': '3b502aee6c9e1ef0f698332ee1b76634',
  'paddy-age-of-gods': '77d20f8e6ff87397200f694026914bbf',
  'paddy-mega-fire-blaze': 'd4fc911a31b3a61edd83bdd95e36f3bf',

  // JILI Flagships
  'super-ace': 'bdfb23c974a2517198c5443adeea77a8',          // Super Ace (JILI)
  'super-ace-deluxe': '80aad2a10ae6a95068b50160d6c78897',   // Super Ace Deluxe (JILI)
  'fortune-gems': 'a990de177577a2e6a889aaac5f57b429',       // Fortune Gems (JILI)
  'fortune-gems-2': '664fba4da609ee82b78820b1f570f4ad',     // Fortune Gems 2 (JILI)
  'fortune-garuda': '664fba4da609ee82b78820b1f570f4ad',     // Fortune Gems 2 (JILI)
  'boxing-king': '981f5f9675002fbeaaf24c4128b938d7',        // Boxing King (JILI)
  'fishing-joy': 'e794bf5717aca371152df192341fe68b',        // Royal Fishing (JILI)

  // Evolution Live Dealers
  'mini-roulette': 'd4fc911a31b3a61edd83bdd95e36f3bf',      // Roulette
  'blackjack-live': '3b502aee6c9e1ef0f698332ee1b76634',     // Blackjack
  'blackjack': '3b502aee6c9e1ef0f698332ee1b76634',          // Blackjack
  'sexy-live': 'a9b13010273fcb0284c9ef436c5fe2ff',          // Poker / Live
  'jili-cards': 'a9b13010273fcb0284c9ef436c5fe2ff',         // Poker King (JILI)
  'kingmidas-cards': '3b502aee6c9e1ef0f698332ee1b76634',    // Blackjack

  // PG Soft
  'mahjong-ways-2': 'ba2adf72179e1ead9e3dae8f0a7d4c07',     // Mahjong Ways 2 (PG Soft)
  'treasures-of-aztec': '2fa9a84d096d6ff0bab53f81b79876c8', // Treasures of Aztec (PG Soft)
  'wild-bounty': 'ba2adf72179e1ead9e3dae8f0a7d4c07',        // PG Soft
  
  // Pragmatic & Provider Slots
  'slots-pg': 'bdfb23c974a2517198c5443adeea77a8',           // Super Ace (JILI)
  'jili-slots': 'a990de177577a2e6a889aaac5f57b429',         // Fortune Gems (JILI)
  'wg-slots': '1189baca156e1bbbecc3b26651a63565',           // Mahjong Ways (PG Soft)
  'fc-slots': 'e30cd08c54817096e863975e309bb457',           // Waves of Poseidon (Pragmatic)
  'jdb-slots': '8a0b30eb466a8a07027cbddc19369d0f',          // Gem Fire Fortune (Pragmatic)
  'pp-slots': 'e1d2da140286507e851fde1cb2fdd4ba',           // Gold Party 2 (Pragmatic)
  'mg-slots': 'a990de177577a2e6a889aaac5f57b429',           // Fortune Gems (JILI)
  'cq9-slots': 'bdfb23c974a2517198c5443adeea77a8',          // Super Ace (JILI)
  'bng-slots': 'a990de177577a2e6a889aaac5f57b429',          // Fortune Gems (JILI)

  // Fallbacks
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
  const cleanUsername = `akw${rawUser}`.toLowerCase().substring(0, 24);

  try {
    const data = await RAPID.getGameUrl({
      username: cleanUsername,
      gameId: finalGameId,
      lang: payload.lang || 'en',
      money: payload.money !== undefined ? payload.money : 0,
      home_url: payload.home_url || 'https://test-eight-zeta-88.vercel.app/',
      platform: payload.platform || 1,
      currency: (payload.currency && payload.currency !== 'Fiat') ? payload.currency : 'USD'
    });

    const rawGameUrl = data?.payload?.game_launch_url || data?.game_launch_url || data?.gameUrl || (data?.data && data?.data?.url);

    if (rawGameUrl) {
      return res.status(200).json({
        success: true,
        gameUrl: rawGameUrl,
        rawLaunchUrl: rawGameUrl,
        gameName: data?.payload?.game_name || payload.gameId,
        provider: data?.payload?.provider,
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

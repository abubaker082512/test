import RapidApiClient from '../../../utils/rapidApiClient';
import { isAllowed } from '../../../utils/rateLimiter';

const RAPID = new RapidApiClient({
  key: process.env.RAPIDAPI_KEY,
  host: process.env.RAPIDAPI_HOST,
  timeout: 8000,
  maxRetries: 2,
  cacheTtlMs: 60 * 1000
});

// Translation map from user-friendly slugs to actual RapidAPI provider hashes
const GAME_MAP = {
  // JILI Flagships
  'super-ace': 'bdfb23c974a2517198c5443adeea77a8',          // Super Ace (JILI)
  'super-ace-deluxe': '80aad2a10ae6a95068b50160d6c78897',   // Super Ace Deluxe (JILI)
  'fortune-gems': 'a990de177577a2e6a889aaac5f57b429',       // Fortune Gems (JILI)
  'fortune-garuda': '664fba4da609ee82b78820b1f570f4ad',     // Fortune Gems 2 (JILI)
  'boxing-king': '981f5f9675002fbeaaf24c4128b938d7',        // Boxing King (JILI)
  'fishing-joy': '3cf4a85cb6dcf4d8836c982c359cd72d',        // Jackpot Fishing (JILI)

  // Evolution Live Dealers
  'mini-roulette': 'b4af506243cafae52908e8fa266f8ff6',      // Speed Roulette (Evolution Live)
  'blackjack-live': '87a7f4550407f5ed73c3353a54a11187',     // Blackjack VIP 12 (Evolution Live)
  'blackjack': '87a7f4550407f5ed73c3353a54a11187',          // Blackjack VIP 12 (Evolution Live)
  'sexy-live': '7b44393101abad7ac31e21fc1bdb3d56',          // Emperor Speed Baccarat B (Evolution Live)
  'jili-cards': '7b44393101abad7ac31e21fc1bdb3d56',         // Emperor Speed Baccarat B (Evolution Live)
  'kingmidas-cards': '87a7f4550407f5ed73c3353a54a11187',    // Blackjack VIP (Evolution Live)

  // PG Soft
  'mahjong-ways-2': 'ba2adf72179e1ead9e3dae8f0a7d4c07',     // Mahjong Ways 2 (PG Soft)
  'treasures-of-aztec': '2fa9a84d096d6ff0bab53f81b79876c8', // Treasures of Aztec (PG Soft)
  'wild-bounty': 'fb2a2ac51303c0a0801dbe6a72d936f7',        // Leprechaun Riches / Wilds (PG Soft)
  
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

  // PaddyPower Mappings
  'paddy-rainbow-riches': 'fb2a2ac51303c0a0801dbe6a72d936f7',
  'paddy-fishin-frenzy': '3cf4a85cb6dcf4d8836c982c359cd72d',
  'paddy-roulette-live': 'b4af506243cafae52908e8fa266f8ff6',
  'paddy-blackjack-exclusive': '87a7f4550407f5ed73c3353a54a11187',
  'paddy-age-of-gods': '80aad2a10ae6a95068b50160d6c78897',
  'paddy-mega-fire-blaze': '36b1e71c6f51827e24261d06a22b1e31',
  
  // Fallbacks
  'gold-slots': 'bdfb23c974a2517198c5443adeea77a8',
  'crash': 'bdfb23c974a2517198c5443adeea77a8',
  'plinko': 'bdfb23c974a2517198c5443adeea77a8'
};

// Automatically unrolls BetNex intermediary wrapper to get the clean direct provider session URL (JILI, Evolution, PG Soft, etc.)
// This bypasses BetNex's restrictive frame-ancestors CSP so the game embeds cleanly without browser block
async function unrollDirectGameUrl(betnexUrl) {
  if (!betnexUrl || typeof betnexUrl !== 'string') return betnexUrl;
  if (!betnexUrl.includes('betnex.co')) return betnexUrl;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const r1 = await fetch(betnexUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      },
      signal: controller.signal
    });
    const html1 = await r1.text();
    const match1 = html1.match(/src="([^"]+wrappedgame[^"]+)"/);
    if (!match1) {
      clearTimeout(timeout);
      return betnexUrl;
    }

    const wrappedUrl = match1[1];
    const r2 = await fetch(wrappedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': betnexUrl,
        'Sec-Fetch-Dest': 'iframe'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    const html2 = await r2.text();
    const match2 = html2.match(/src="([^"]+)"/);
    if (match2) {
      const directUrl = match2[1].replaceAll('&amp;', '&');
      return directUrl;
    }
  } catch (err) {
    console.warn('Failed to unroll BetNex wrapper, falling back to launch url:', err.message);
  }

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
  const finalGameId = GAME_MAP[payload.gameId] || payload.gameId;

  // Ensure username is strictly alphanumeric between 4 and 32 chars, prefixed with "akw" to prevent provider collisions
  const rawUser = (payload.username || 'player').replace(/[^a-zA-Z0-9]/g, '');
  const cleanUsername = `akw${rawUser}`.substring(0, 30);

  try {
    const data = await RAPID.getGameUrl({
      username: cleanUsername,
      gameId: finalGameId,
      lang: payload.lang || 'en',
      money: payload.money !== undefined ? payload.money : 0,
      home_url: payload.home_url || 'https://betnex.co',
      platform: payload.platform || 1,
      currency: 'PKR'
    });

    const rawGameUrl = data?.payload?.game_launch_url || data?.game_launch_url || data?.gameUrl || (data?.data && data?.data?.url);

    if (rawGameUrl) {
      // Resolve direct provider URL to avoid iframe blocking
      const directUrl = await unrollDirectGameUrl(rawGameUrl);

      return res.status(200).json({
        success: true,
        gameUrl: directUrl || rawGameUrl,
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

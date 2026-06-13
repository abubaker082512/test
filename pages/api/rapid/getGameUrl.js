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
  'super-ace': 'bdfb23c974a2517198c5443adeea77a8',          // Super Ace (JILI)
  'super-ace-deluxe': '80aad2a10ae6a95068b50160d6c78897',   // Super Ace Deluxe (JILI)
  'fortune-gems': 'a990de177577a2e6a889aaac5f57b429',       // Fortune Gems (JILI)
  'fortune-garuda': 'ddfbe3b51c60ab9166310916a43cb17f',     // Fortune Garuda 500 (JILI)
  'fishing-joy': '3cf4a85cb6dcf4d8836c982c359cd72d',        // Jackpot Fishing (JILI)
  'mini-roulette': 'b4af506243cafae52908e8fa266f8ff6',      // Speed Roulette (Evolution Live)
  'blackjack-live': '58d7089aa20bce7f70e0e2ce81e888f4',     // Infinite Blackjack (Evolution Live)
  'blackjack': '58d7089aa20bce7f70e0e2ce81e888f4',          // Infinite Blackjack (Evolution Live)
  
  // Fallbacks
  'gold-slots': 'bdfb23c974a2517198c5443adeea77a8',
  'crash': 'bdfb23c974a2517198c5443adeea77a8',
  'plinko': 'bdfb23c974a2517198c5443adeea77a8'
};

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

  // Translate slug to RapidAPI hash ID if mapped, otherwise use directly
  const finalGameId = GAME_MAP[payload.gameId] || payload.gameId;

  try {
    const data = await RAPID.getGameUrl({
      gameId: finalGameId,
      username: payload.username
    });
    res.status(200).json(data);
  } catch (err) {
    console.error('RapidAPI GetGameURL error:', err);
    res.status(500).json({ error: err.message });
  }
}

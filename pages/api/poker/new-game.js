import PokerApiClient from '../../../utils/pokerApiClient.js';
import { isAllowed } from '../../../utils/rateLimiter.js';

const client = new PokerApiClient();

export default async function handler(req, res) {
  if (!isAllowed(req, 60, 60000)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const game = await client.getNewGame();
    return res.status(200).json({
      success: true,
      ...game
    });
  } catch (err) {
    console.error('Poker API new-game error:', err);
    return res.status(500).json({ error: err.message });
  }
}

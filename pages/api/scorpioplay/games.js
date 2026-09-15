import ScorpioPlayClient from '../../../utils/scorpioPlayClient.js';
import { isAllowed } from '../../../utils/rateLimiter.js';

const client = new ScorpioPlayClient();

export default async function handler(req, res) {
  if (!isAllowed(req, 60, 60000)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { providerId } = req.query;
    const games = await client.getGameList(providerId);
    return res.status(200).json({
      success: true,
      total: games.length,
      games
    });
  } catch (err) {
    console.error('ScorpioPlay games error:', err);
    return res.status(500).json({ error: err.message });
  }
}

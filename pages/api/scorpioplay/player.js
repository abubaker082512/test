import ScorpioPlayClient from '../../../utils/scorpioPlayClient.js';
import { isAllowed } from '../../../utils/rateLimiter.js';

const client = new ScorpioPlayClient();

export default async function handler(req, res) {
  if (!isAllowed(req, 60, 60000)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  try {
    if (req.method === 'POST') {
      const { playerExternalId } = req.body || {};
      const result = await client.createPlayer(playerExternalId || 'akw_player');
      return res.status(200).json(result);
    }
    
    if (req.method === 'GET') {
      const { playerExternalId } = req.query || {};
      const result = await client.getPlayerInfo(playerExternalId || 'akw_player');
      return res.status(200).json(result);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('ScorpioPlay player error:', err);
    return res.status(500).json({ error: err.message });
  }
}

import ScorpioPlayClient from '../../../utils/scorpioPlayClient.js';
import { isAllowed } from '../../../utils/rateLimiter.js';

const client = new ScorpioPlayClient();

export default async function handler(req, res) {
  if (!isAllowed(req, 60, 60000)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};
    const result = await client.launchGame(body);
    return res.status(200).json(result);
  } catch (err) {
    console.error('ScorpioPlay launch error:', err);
    return res.status(500).json({ error: err.message });
  }
}

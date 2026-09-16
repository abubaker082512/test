// MCP-compatible proxy for RapidAPI/BetNex games by provider
import { RapidApiClient } from '../../../utils/rapidApiClient.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const provider = req.query.provider || 'SPRIBE';

  try {
    const client = new RapidApiClient();
    const data = await client.getAllGamesByProvider(provider);
    return res.status(200).json(data);
  } catch (err) {
    console.error('getAllGamesByProvider error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch games' });
  }
}

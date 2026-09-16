// MCP-compatible proxy for RapidAPI/BetNex providers
import { RapidApiClient } from '../../../utils/rapidApiClient.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const client = new RapidApiClient();
    const data = await client.getAllProviders();
    return res.status(200).json(data);
  } catch (err) {
    console.error('getAllProviders error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch providers' });
  }
}

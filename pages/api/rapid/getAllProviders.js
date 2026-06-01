import RapidApiClient from '../../../utils/rapidApiClient';
import { isAllowed } from '../../../utils/rateLimiter';

const RAPID = new RapidApiClient({
  key: process.env.RAPIDAPI_KEY,
  host: process.env.RAPIDAPI_HOST,
  timeout: 8000,
  maxRetries: 2,
  cacheTtlMs: 60 * 1000
});

export default async function handler(req, res) {
  if (!isAllowed(req, 60, 60000)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const data = await RAPID.getAllProviders();
    res.status(200).json(data);
  } catch (err) {
    console.error('RapidAPI getAllProviders error:', err);
    res.status(500).json({ error: err.message });
  }
}

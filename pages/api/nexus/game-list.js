import { nexusClient } from '../../../utils/nexusClient';

export default async function handler(req, res) {
  const providerCode = req.query.provider_code || req.body?.provider_code || '';

  if (!nexusClient.isConfigured()) {
    return res.status(200).json({
      status: 0,
      code: 7770014,
      msg: 'NexusGGR API credentials not configured',
      configured: false,
      games: []
    });
  }

  try {
    const result = await nexusClient.getGameList({ providerCode });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({
      status: 0,
      code: 7770500,
      msg: err.message || 'Error fetching game list from NexusGGR'
    });
  }
}

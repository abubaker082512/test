import { nexusClient } from '../../../utils/nexusClient';

export default async function handler(req, res) {
  if (!nexusClient.isConfigured()) {
    return res.status(200).json({
      status: 0,
      code: 7770014,
      msg: 'NexusGGR API credentials not configured',
      configured: false
    });
  }

  try {
    const result = await nexusClient.getMoneyInfo();
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({
      status: 0,
      code: 7770500,
      msg: err.message || 'Error fetching agent info from NexusGGR'
    });
  }
}

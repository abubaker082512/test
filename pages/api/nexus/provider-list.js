import { nexusClient } from '../../../utils/nexusClient';

export default async function handler(req, res) {
  if (!nexusClient.isConfigured()) {
    return res.status(200).json({
      status: 0,
      code: 7770014,
      msg: 'NexusGGR API credentials not configured',
      configured: false,
      providers: [
        { code: 'JILI', name: 'JILI Games' },
        { code: 'PGSOFT', name: 'PG Soft' },
        { code: 'PRAGMATIC', name: 'Pragmatic Play' },
        { code: 'EVOLUTION', name: 'Evolution Gaming' },
        { code: 'SPRIBE', name: 'Spribe' },
        { code: 'FASTGAMES', name: 'FastGames' },
        { code: 'CQ9', name: 'CQ9 Gaming' },
        { code: 'JDB', name: 'JDB Gaming' }
      ]
    });
  }

  try {
    const result = await nexusClient.getProviderList();
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({
      status: 0,
      code: 7770500,
      msg: err.message || 'Error fetching provider list from NexusGGR'
    });
  }
}

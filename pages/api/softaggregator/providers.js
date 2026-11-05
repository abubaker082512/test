// API Endpoint: /api/softaggregator/providers
// Returns the list of 107+ game providers available on SoftAggregator

import { getProviderList } from '../../../utils/softAggregatorClient.js';

export default async function handler(req, res) {
  try {
    const pRes = await getProviderList();
    if (!pRes || pRes.error !== 0 || !Array.isArray(pRes.response)) {
      return res.status(200).json({
        success: false,
        error: pRes?.message || 'Failed to fetch providers',
        providers: []
      });
    }

    return res.status(200).json({
      success: true,
      count: pRes.response.length,
      providers: pRes.response
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      providers: []
    });
  }
}

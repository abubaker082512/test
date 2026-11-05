/**
 * Official NexusGGR Seamless API Endpoint
 * Site Endpoint: https://winxpro.com.pk/gold_api
 * Documentation: https://my.nexusggr.com/app/docs/integration/seamless-api
 */

import { handleUserBalance, handleTransaction } from '../../../utils/nexusSeamless';

export default async function handler(req, res) {
  // NexusGGR communicates via POST with application/json
  if (req.method !== 'POST') {
    return res.status(200).json({
      status: 1,
      code: 7777777,
      msg: 'NexusGGR Seamless Endpoint Online',
      endpoint: '/gold_api'
    });
  }

  const body = req.body || {};
  const method = String(body.method || req.query.method || '').toLowerCase().trim();

  try {
    if (method === 'user_balance') {
      const result = handleUserBalance(body);
      return res.status(200).json(result);
    }

    if (method === 'transaction') {
      const result = handleTransaction(body);
      return res.status(200).json(result);
    }

    // If method is not explicitly named, infer from payload structure
    if (body.user_code && (body.bet_amount !== undefined || body.win_amount !== undefined)) {
      const result = handleTransaction(body);
      return res.status(200).json(result);
    }

    if (body.user_code && body.bet_amount === undefined && body.win_amount === undefined) {
      const result = handleUserBalance(body);
      return res.status(200).json(result);
    }

    return res.status(200).json({
      status: 0,
      code: 7770400,
      msg: `Unknown method: ${method || 'None provided'}`
    });
  } catch (err) {
    console.error('Fatal gold_api handler error:', err);
    return res.status(200).json({
      status: 0,
      code: 7770500,
      msg: err.message || 'Internal error in gold_api router'
    });
  }
}

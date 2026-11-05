import { nexusClient } from '../../../utils/nexusClient';
import { getUserWallet } from '../../../utils/walletStore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 0, code: 7770400, msg: 'Method Not Allowed' });
  }

  const { user_code, user_id, email, provider_code, game_code, lang } = req.body || {};

  const effectiveUserCode = user_code || user_id || (email ? email.split('@')[0] : 'guest_player');
  const cleanProvider = String(provider_code || '').trim().toUpperCase();

  if (!cleanProvider) {
    return res.status(400).json({
      status: 0,
      code: 7770405,
      msg: 'provider_code is required (e.g. JILI, PGSOFT, PRAGMATIC, EVOLUTION, SPRIBE)'
    });
  }

  // Ensure user wallet exists locally
  const wallet = getUserWallet(effectiveUserCode, email || '');

  // If Nexus credentials are not yet configured in .env.local, provide clear diagnostic response
  if (!nexusClient.isConfigured()) {
    return res.status(200).json({
      status: 0,
      code: 7770014,
      msg: 'NexusGGR API credentials not set. Add NEXUSGGR_AGENT_CODE and NEXUSGGR_AGENT_TOKEN to .env.local',
      configured: false,
      wallet_balance: wallet.balance
    });
  }

  try {
    const result = await nexusClient.gameLaunch({
      userCode: effectiveUserCode,
      providerCode: cleanProvider,
      gameCode: game_code || '',
      lang: lang || 'en'
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('Nexus game-launch error:', err);
    return res.status(500).json({
      status: 0,
      code: 7770500,
      msg: err.message || 'Internal error launching game via NexusGGR'
    });
  }
}

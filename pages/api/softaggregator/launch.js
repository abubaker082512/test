// API Endpoint: /api/softaggregator/launch
// Launches a real-money or demo game on SoftAggregator and returns the session iframe URL

import { launchGame, launchDemoGame } from '../../../utils/softAggregatorClient.js';
import { registerPlayerUsername, getLiveUserWallet } from '../../../utils/walletStore.js';

function extractLaunchUrl(response) {
  if (!response) return null;
  if (typeof response === 'string' && response.startsWith('http')) return response;
  if (typeof response === 'object') {
    if (typeof response.gameurl === 'string' && response.gameurl.startsWith('http')) {
      return response.gameurl;
    }
    if (typeof response.url === 'string' && response.url.startsWith('http')) {
      return response.url;
    }
    if (typeof response.link === 'string' && response.link.startsWith('http')) {
      return response.link;
    }
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const {
    gameid,
    user_id,
    email,
    lang = 'en',
    device = 'mobile',
    demo = false
  } = req.body;

  if (!gameid) {
    return res.status(400).json({ success: false, error: 'gameid is required' });
  }

  // 1. Determine clean alphanumeric username for SoftAggregator
  let username = '';
  if (email && email.includes('@')) {
    username = email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);
  } else if (user_id && !String(user_id).startsWith('user_')) {
    username = String(user_id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);
  }
  if (!username) {
    username = 'guest_player';
  }

  // 2. Pre-register all username variants in walletStore so SoftAggregator callbacks instantly return full balance
  registerPlayerUsername(username, user_id, email);
  if (user_id) registerPlayerUsername(user_id, user_id, email);
  registerPlayerUsername('c1000273_' + username, user_id, email);

  // Warm up live wallet from Supabase
  await getLiveUserWallet(user_id || username, email || '');

  const host = req.headers.host || 'winxpro.com.pk';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const homeurl = `${protocol}://${host}`;

  try {
    if (demo) {
      const demoRes = await launchDemoGame({ gameid, homeurl });
      const demoUrl = extractLaunchUrl(demoRes?.response);
      if (demoRes && demoRes.error === 0 && demoUrl) {
        return res.status(200).json({
          success: true,
          launch_url: demoUrl,
          mode: 'demo'
        });
      }
    }

    // Launch real-money game
    const launchRes = await launchGame({
      username,
      password: 'winx_secret_player_123',
      gameid,
      currency: 'PKR',
      lang,
      homeurl,
      device
    });

    const realUrl = extractLaunchUrl(launchRes?.response);
    if (launchRes && launchRes.error === 0 && realUrl) {
      return res.status(200).json({
        success: true,
        launch_url: realUrl,
        username,
        mode: 'real'
      });
    }

    return res.status(200).json({
      success: false,
      error: launchRes?.message || 'Failed to launch game via SoftAggregator',
      details: launchRes
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}

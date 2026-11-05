// API Endpoint: /api/softaggregator/launch
// Launches a real-money or demo game on SoftAggregator and returns the session iframe URL

import { launchGame, launchDemoGame } from '../../../utils/softAggregatorClient.js';

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

  // Determine username
  let username = user_id || '';
  if (!username && email) {
    username = email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '');
  }
  if (!username) {
    username = 'guest_player';
  }

  const host = req.headers.host || 'winxpro.com.pk';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const homeurl = `${protocol}://${host}`;

  try {
    if (demo) {
      const demoRes = await launchDemoGame({ gameid, homeurl });
      if (demoRes && demoRes.error === 0 && demoRes.response) {
        return res.status(200).json({
          success: true,
          launch_url: demoRes.response,
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

    if (launchRes && launchRes.error === 0 && launchRes.response) {
      return res.status(200).json({
        success: true,
        launch_url: launchRes.response,
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

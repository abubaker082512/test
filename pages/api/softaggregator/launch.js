// API Endpoint: /api/softaggregator/launch
// Launches a real-money or demo game on SoftAggregator and returns the session iframe URL

import crypto from 'crypto';
import { launchGame, launchDemoGame } from '../../../utils/softAggregatorClient.js';
import { registerPlayerUsername, getLiveUserWallet } from '../../../utils/walletStore.js';

export const config = {
  maxDuration: 60,
};

// Known reliable companion fallbacks (all verified active hashes from live getGameList)
const COMPANION_FALLBACKS = {
  'x50a0b59eee3ad61': 'xe1c00f1b46ebc87', // Super Ace Deluxe -> Super Ace Original
  'x7ac8b6d24d040b5': 'x4220b3aa086524a', // Fortune Gems 3 -> Fortune Gems Original
  'xa2e772d2ad793a5': 'x49738770faf5870', // Mahjong Ways 2 -> Mahjong Ways Original
};

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

  // 1. Determine unique clean alphanumeric username per real player (NEVER share a single 'guest_player' across users,
  //    which hits SoftAggregator's 120 launches/hour per-player cap)
  let username = '';
  const rawUserId = String(user_id || '').trim();
  if (email && email.includes('@')) {
    username = email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);
  } else if (rawUserId && rawUserId !== 'guest_player') {
    username = rawUserId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);
  }
  if (!username || username === 'guest_player') {
    username = 'guest_' + crypto.randomBytes(4).toString('hex');
  }

  // 2. Pre-register all username variants in walletStore so SoftAggregator callbacks instantly return full balance
  registerPlayerUsername(username, user_id, email);
  if (user_id && user_id !== 'guest_player') registerPlayerUsername(user_id, user_id, email);
  registerPlayerUsername('c1000273_' + username, user_id, email);

  // Warm up live wallet from Supabase asynchronously
  try {
    getLiveUserWallet(user_id || username, email || '').catch(() => {});
  } catch (e) {}

  const rawHost = req.headers.host || 'www.winxpro.com.pk';
  const host = rawHost === 'winxpro.com.pk' ? 'www.winxpro.com.pk' : rawHost;
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
      // If demo mode failed, continue down to real-money launch as fallback
    }

    // Launch real-money game
    let launchRes = await launchGame({
      username,
      password: 'winx_secret_player_123',
      gameid,
      currency: 'PKR',
      lang,
      homeurl,
      device
    });

    let realUrl = extractLaunchUrl(launchRes?.response);
    if (launchRes && launchRes.error === 0 && realUrl) {
      return res.status(200).json({
        success: true,
        launch_url: realUrl,
        username,
        mode: 'real'
      });
    }

    // If primary game ID failed and we have a companion fallback (e.g. Super Ace Deluxe -> Super Ace)
    if (COMPANION_FALLBACKS[gameid]) {
      const fallbackId = COMPANION_FALLBACKS[gameid];
      console.warn(`[SoftAggregator] Primary game ${gameid} failed, attempting companion fallback ${fallbackId}...`);
      const fallbackRes = await launchGame({
        username,
        password: 'winx_secret_player_123',
        gameid: fallbackId,
        currency: 'PKR',
        lang,
        homeurl,
        device
      });
      const fallbackUrl = extractLaunchUrl(fallbackRes?.response);
      if (fallbackRes && fallbackRes.error === 0 && fallbackUrl) {
        return res.status(200).json({
          success: true,
          launch_url: fallbackUrl,
          username,
          mode: 'real',
          fallback: true
        });
      }
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

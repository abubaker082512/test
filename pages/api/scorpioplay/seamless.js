import { isAllowed } from '../../../utils/rateLimiter.js';

// ScorpioPlay Seamless Wallet Webhook Handler (/balance, /bet, /win, /cancel)
export default async function handler(req, res) {
  if (!isAllowed(req, 120, 60000)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { action, playerExternalId, amount, transactionId, roundId } = req.body || {};

  try {
    switch (action) {
      case 'balance':
        return res.status(200).json({
          success: true,
          playerExternalId,
          balance: 1000.00,
          currency: 'USD'
        });

      case 'bet':
        return res.status(200).json({
          success: true,
          playerExternalId,
          transactionId: transactionId || `TX_BET_${Date.now()}`,
          debited: amount || 0,
          newBalance: 1000.00 - (amount || 0),
          currency: 'USD'
        });

      case 'win':
        return res.status(200).json({
          success: true,
          playerExternalId,
          transactionId: transactionId || `TX_WIN_${Date.now()}`,
          credited: amount || 0,
          newBalance: 1000.00 + (amount || 0),
          currency: 'USD'
        });

      case 'cancel':
        return res.status(200).json({
          success: true,
          playerExternalId,
          refunded: amount || 0,
          status: 'cancelled',
          currency: 'USD'
        });

      default:
        return res.status(200).json({
          success: true,
          message: 'Seamless webhook acknowledged',
          received: req.body
        });
    }
  } catch (err) {
    console.error('ScorpioPlay seamless error:', err);
    return res.status(500).json({ error: err.message });
  }
}

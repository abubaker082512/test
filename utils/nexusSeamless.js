/**
 * NexusGGR Seamless API Handler Engine
 * Official Endpoint: /gold_api
 * Documentation: https://my.nexusggr.com/app/docs/integration/seamless-api
 */

import {
  getUserWallet,
  creditUserBalance,
  debitUserBalance,
  recordTransactionRecord
} from './walletStore.js';

// In-memory idempotency cache for processed transaction IDs (kept for 24h)
const processedTxCache = new Map();

// Periodic cleanup of cache to avoid memory leak
setInterval(() => {
  const now = Date.now();
  for (const [txId, item] of processedTxCache.entries()) {
    if (now - item.timestamp > 24 * 60 * 60 * 1000) {
      processedTxCache.delete(txId);
    }
  }
}, 60 * 60 * 1000);

/**
 * Handle user_balance query from NexusGGR
 * @param {Object} data - { user_code }
 */
export function handleUserBalance(data = {}) {
  const userCode = String(data.user_code || data.user_id || '').trim();

  if (!userCode) {
    return {
      status: 0,
      code: 7770405,
      msg: 'user_code is required',
      user_balance: 0
    };
  }

  try {
    const wallet = getUserWallet(userCode);
    const balance = parseFloat(wallet.balance || 0);

    return {
      status: 1,
      code: 7777777,
      msg: 'SUCCESS',
      user_balance: Number(balance.toFixed(2))
    };
  } catch (err) {
    console.error('[Nexus Seamless] user_balance error:', err);
    return {
      status: 0,
      code: 7770500,
      msg: err.message || 'Internal wallet error',
      user_balance: 0
    };
  }
}

/**
 * Handle game gameplay transaction (bets, wins, refunds) from NexusGGR
 * @param {Object} data - { user_code, bet_amount, win_amount, tx_id, round_id, provider_code, game_code, currency }
 */
export function handleTransaction(data = {}) {
  const userCode = String(data.user_code || data.user_id || '').trim();
  const txId = String(data.tx_id || '').trim();
  const roundId = String(data.round_id || '').trim();
  const providerCode = String(data.provider_code || '').toUpperCase();
  const gameCode = String(data.game_code || '');
  const currency = String(data.currency || 'PKR').toUpperCase();

  const betAmount = parseFloat(data.bet_amount) || 0;
  const winAmount = parseFloat(data.win_amount) || 0;

  if (!userCode) {
    return {
      status: 0,
      code: 7770405,
      msg: 'user_code is required',
      user_balance: 0
    };
  }

  // 1. Idempotency Check (Duplicate request protection)
  if (txId && processedTxCache.has(txId)) {
    const cached = processedTxCache.get(txId);
    console.log(`[Nexus Seamless] Duplicate tx_id ${txId} detected, returning cached result.`);
    const currentWallet = getUserWallet(userCode);
    return {
      status: 1,
      code: 7777777,
      msg: 'SUCCESS (IDEMPOTENT_RETRY)',
      user_balance: Number((currentWallet.balance || 0).toFixed(2))
    };
  }

  try {
    const wallet = getUserWallet(userCode);
    let currentBalance = parseFloat(wallet.balance || 0);

    // 2. Process Bet (Debit)
    if (betAmount > 0) {
      if (currentBalance < betAmount) {
        return {
          status: 0,
          code: 7770015,
          msg: 'INSUFFICIENT_USER_FUNDS',
          user_balance: Number(currentBalance.toFixed(2))
        };
      }

      const debitRes = debitUserBalance(userCode, betAmount);
      if (!debitRes.success) {
        return {
          status: 0,
          code: 7770015,
          msg: debitRes.error || 'INSUFFICIENT_USER_FUNDS',
          user_balance: Number(currentBalance.toFixed(2))
        };
      }
      currentBalance = debitRes.wallet.balance;
    }

    // 3. Process Win (Credit)
    if (winAmount > 0) {
      const creditWallet = creditUserBalance(userCode, winAmount);
      currentBalance = creditWallet.balance;
    }

    // 4. Record Transaction in ledger
    const netChange = winAmount - betAmount;
    recordTransactionRecord({
      user_id: wallet.user_id || userCode,
      email: wallet.email || '',
      type: netChange >= 0 ? 'win' : 'bet',
      amount: Math.abs(netChange),
      status: 'completed',
      method: `NexusGGR ${providerCode || 'Casino'}`,
      notes: `${gameCode ? `${gameCode} | ` : ''}Bet: Rs ${betAmount.toFixed(2)}, Win: Rs ${winAmount.toFixed(2)} | TX: ${txId || 'N/A'}`
    });

    // 5. Store in Idempotency Cache
    if (txId) {
      processedTxCache.set(txId, {
        timestamp: Date.now(),
        userCode,
        balance: currentBalance
      });
    }

    return {
      status: 1,
      code: 7777777,
      msg: 'SUCCESS',
      user_balance: Number(currentBalance.toFixed(2))
    };
  } catch (err) {
    console.error('[Nexus Seamless] Transaction execution error:', err);
    return {
      status: 0,
      code: 7770500,
      msg: err.message || 'Internal wallet error',
      user_balance: 0
    };
  }
}

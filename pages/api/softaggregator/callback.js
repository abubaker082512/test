// SoftAggregator Seamless Wallet Callback Endpoint
// Reference: https://softaggregator.com/docs.html
// Handles action: balance, debit, credit
// Balances & amounts are integers in cents (minor units, e.g. Rs 100.00 -> 10000 cents)

import crypto from 'crypto';
import { getUserWallet, creditUserBalance, debitUserBalance, recordTransactionRecord } from '../../../utils/walletStore.js';

const SALT_KEY = process.env.SOFTAGGREGATOR_SALT_KEY || '748b7a8c4aada521';

// In-memory 24h idempotency cache for call_id
const seenCallIds = new Map();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

function cleanupOldCallIds() {
  const now = Date.now();
  for (const [id, entry] of seenCallIds.entries()) {
    if (now - entry.timestamp > IDEMPOTENCY_TTL_MS) {
      seenCallIds.delete(id);
    }
  }
}

export default async function handler(req, res) {
  // Callbacks are sent as GET requests, but support POST fallback
  const query = req.method === 'GET' ? req.query : { ...req.query, ...req.body };

  const {
    username,
    currency = 'PKR',
    action,
    amount,
    type,
    call_id,
    round_id,
    game_id,
    rb,
    timestamp,
    key
  } = query;

  // Always return HTTP 200 with JSON body per docs
  res.setHeader('Content-Type', 'application/json');

  // 1. Signature validation: key = md5(timestamp + salt_key)
  if (timestamp && key) {
    const expectedKey = crypto.createHash('md5').update(String(timestamp) + SALT_KEY).digest('hex');
    if (key.toLowerCase() !== expectedKey.toLowerCase()) {
      return res.status(200).json({ error: 2, balance: 0, message: 'Invalid signature key' });
    }
  }

  // Normalize username (SoftAggregator prefixes or passes user_username)
  // e.g. "c1000273_test_player_winx" or "test_player_winx" or user ID
  const cleanUsername = String(username || '').replace(/^c\d+_/, '');
  const wallet = getUserWallet(cleanUsername, cleanUsername.includes('@') ? cleanUsername : '');

  const currentBalPkr = parseFloat(wallet?.balance || 0);
  const currentBalCents = Math.round(currentBalPkr * 100);

  // 2. action: balance
  if (action === 'balance') {
    return res.status(200).json({
      error: 0,
      balance: currentBalCents
    });
  }

  // 3. De-duplication using call_id
  cleanupOldCallIds();
  if (call_id && seenCallIds.has(call_id)) {
    const cached = seenCallIds.get(call_id);
    return res.status(200).json({
      error: 0,
      balance: cached.balance,
      cached: true
    });
  }

  const numAmountCents = parseInt(amount, 10) || 0;
  const numAmountPkr = numAmountCents / 100;

  // 4. action: debit (subtract bet)
  if (action === 'debit') {
    // If rollback or free-spin bonus without cost, handle safely
    if (type === 'bonus_fs' || numAmountCents <= 0) {
      if (call_id) seenCallIds.set(call_id, { timestamp: Date.now(), balance: currentBalCents });
      return res.status(200).json({ error: 0, balance: currentBalCents });
    }

    if (currentBalCents < numAmountCents) {
      // Insufficient balance: return error 1 with current balance in cents
      return res.status(200).json({
        error: 1,
        balance: currentBalCents,
        message: 'Insufficient balance'
      });
    }

    const debitRes = debitUserBalance(cleanUsername, numAmountPkr);
    const newBalPkr = parseFloat(debitRes.wallet?.balance || (currentBalPkr - numAmountPkr));
    const newBalCents = Math.round(newBalPkr * 100);

    // Record ledger transaction
    const txId = call_id || `sg-debit-${Date.now()}`;
    recordTransactionRecord({
      id: txId,
      tx_id: txId,
      user_id: wallet.user_id || cleanUsername,
      type: 'bet',
      amount: numAmountPkr,
      balance_after: newBalPkr,
      description: `SoftAggregator Bet | Game: ${game_id || 'Casino'} | Round: ${round_id || 'N/A'}`,
      game_id: game_id,
      metadata: { call_id, round_id, game_id, type, rb, source: 'softaggregator' }
    });

    if (call_id) seenCallIds.set(call_id, { timestamp: Date.now(), balance: newBalCents });

    return res.status(200).json({
      error: 0,
      balance: newBalCents
    });
  }

  // 5. action: credit (add win - can arrive with no matching debit e.g. Free Spins/Jackpot)
  if (action === 'credit') {
    const creditRes = creditUserBalance(cleanUsername, numAmountPkr);
    const newBalPkr = parseFloat(creditRes?.balance || (currentBalPkr + numAmountPkr));
    const newBalCents = Math.round(newBalPkr * 100);

    const txId = call_id || `sg-credit-${Date.now()}`;
    recordTransactionRecord({
      id: txId,
      tx_id: txId,
      user_id: wallet.user_id || cleanUsername,
      type: 'win',
      amount: numAmountPkr,
      balance_after: newBalPkr,
      description: `SoftAggregator Win | Game: ${game_id || 'Casino'} | Round: ${round_id || 'N/A'}`,
      game_id: game_id,
      metadata: { call_id, round_id, game_id, type, rb, source: 'softaggregator' }
    });

    if (call_id) seenCallIds.set(call_id, { timestamp: Date.now(), balance: newBalCents });

    return res.status(200).json({
      error: 0,
      balance: newBalCents
    });
  }

  // Fallback for unknown action
  return res.status(200).json({
    error: 0,
    balance: currentBalCents
  });
}

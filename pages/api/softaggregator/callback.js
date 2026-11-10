// SoftAggregator Seamless Wallet Callback Endpoint
// Reference: https://softaggregator.com/docs.html
// Handles action: balance, debit, credit
// Balances & amounts are integers in cents (minor units, e.g. Rs 100.00 -> 10000 cents)

import crypto from 'crypto';
import { getUserWallet, getLiveUserWallet, creditUserBalance, atomicDebitBalance, recordTransactionRecord, resolveUserUuid } from '../../../utils/walletStore.js';
import { supabase } from '../../../utils/supabaseClient.js';

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
  const cleanUsername = String(username || '').replace(/^c\d+_/, '');
  const wallet = await getLiveUserWallet(cleanUsername, cleanUsername.includes('@') ? cleanUsername : '');

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

    const targetUserId = wallet?.user_id || cleanUsername;
    const targetEmail = wallet?.email || (cleanUsername.includes('@') ? cleanUsername : '');
    const debitRes = await atomicDebitBalance(targetUserId, numAmountPkr, targetEmail);

    const newBalPkr = parseFloat(debitRes.wallet?.balance !== undefined ? debitRes.wallet.balance : (currentBalPkr - numAmountPkr));
    const newBalCents = Math.round(newBalPkr * 100);
    const resolvedUid = resolveUserUuid(targetUserId, targetEmail) || targetUserId;

    // Record ledger transaction
    const txId = call_id || `sg-debit-${Date.now()}`;
    recordTransactionRecord({
      id: txId,
      tx_id: txId,
      user_id: resolvedUid,
      email: targetEmail,
      type: 'bet',
      amount: numAmountPkr,
      balance_after: newBalPkr,
      method: `SoftAggregator ${game_id || 'Casino'}`,
      notes: `SoftAggregator Bet | Game: ${game_id || 'Casino'} | Round: ${round_id || 'N/A'}`,
      metadata: { call_id, round_id, game_id, type, rb, source: 'softaggregator' }
    });

    // Record in bet_history table in Supabase
    supabase.from('bet_history').insert({
      user_id: resolvedUid,
      user_email: targetEmail,
      game_id: game_id || 'softaggregator',
      game_name: game_id ? `SoftAggregator (${game_id})` : 'Live Casino Game',
      bet_amount: numAmountPkr,
      win_amount: 0,
      result: 'pending',
      multiplier: 1.0,
      balance_before: currentBalPkr,
      balance_after: newBalPkr,
      status: 'completed'
    }).then(({ error }) => { if (error) console.error('bet_history debit error:', error.message); });

    if (call_id) seenCallIds.set(call_id, { timestamp: Date.now(), balance: newBalCents });

    return res.status(200).json({
      error: 0,
      balance: newBalCents
    });
  }

  // 5. action: credit (add win - can arrive with no matching debit e.g. Free Spins/Jackpot)
  if (action === 'credit') {
    const targetUserId = wallet?.user_id || cleanUsername;
    const targetEmail = wallet?.email || (cleanUsername.includes('@') ? cleanUsername : '');
    const creditRes = creditUserBalance(targetUserId, numAmountPkr, targetEmail, `SoftAggregator Win on ${game_id || 'Casino'}`);

    const newBalPkr = parseFloat(creditRes?.balance !== undefined ? creditRes.balance : (currentBalPkr + numAmountPkr));
    const newBalCents = Math.round(newBalPkr * 100);
    const resolvedUid = resolveUserUuid(targetUserId, targetEmail) || targetUserId;

    const txId = call_id || `sg-credit-${Date.now()}`;
    recordTransactionRecord({
      id: txId,
      tx_id: txId,
      user_id: resolvedUid,
      email: targetEmail,
      type: 'win',
      amount: numAmountPkr,
      balance_after: newBalPkr,
      method: `SoftAggregator Win ${game_id || 'Casino'}`,
      notes: `SoftAggregator Win | Game: ${game_id || 'Casino'} | Round: ${round_id || 'N/A'}`,
      metadata: { call_id, round_id, game_id, type, rb, source: 'softaggregator' }
    });

    // Record in bet_history table in Supabase
    supabase.from('bet_history').insert({
      user_id: resolvedUid,
      user_email: targetEmail,
      game_id: game_id || 'softaggregator',
      game_name: game_id ? `SoftAggregator (${game_id})` : 'Live Casino Game',
      bet_amount: 0,
      win_amount: numAmountPkr,
      result: 'win',
      multiplier: 1.0,
      balance_before: currentBalPkr,
      balance_after: newBalPkr,
      status: 'completed'
    }).then(({ error }) => { if (error) console.error('bet_history credit error:', error.message); });

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

import { atomicDebitBalance, creditUserBalance, recordTransactionRecord, getUserWallet, resolveUserUuid } from '../../../utils/walletStore';
import { updateWalletBalance, addTransaction } from '../../../utils/firebaseDb';
import { supabase } from '../../../utils/supabaseClient';
import {
  calculateCrashOutcome,
  calculateSuperAceSpin,
  calculateFortuneGemsSpin,
  calculateMinesOutcome,
  calculatePlinkoOutcome,
  calculateRouletteOutcome,
  calculateLimboOutcome,
  getRiskControls
} from '../../../utils/gameEngine/rtpGovernor';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { user_id, email = '', game, action = 'spin', betAmount = 10, params = {} } = req.body || {};

  if (!user_id && !email) {
    return res.status(400).json({ success: false, error: 'Missing user identifier' });
  }

  const parsedBet = parseFloat(betAmount);
  if (isNaN(parsedBet) || parsedBet <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid bet amount' });
  }

  // 1. Fetch Risk Controls
  const risk = getRiskControls();
  const isRestricted = (risk.restrictedUsers || []).includes(user_id);

  // 2. Atomic Debit Bet Amount (Synchronously updates Supabase PostgreSQL to prevent reversion)
  const debitRes = await atomicDebitBalance(user_id, parsedBet, email);
  if (!debitRes.success) {
    return res.status(400).json({
      success: false,
      error: debitRes.error || 'Insufficient wallet balance. Please deposit.'
    });
  }

  const resolvedUid = resolveUserUuid(user_id, email) || debitRes.wallet.user_id || user_id;

  // Record wager transaction
  recordTransactionRecord({
    user_id: resolvedUid,
    email,
    type: 'bet',
    amount: parsedBet,
    status: 'completed',
    method: `${game || 'Casino'} Bet`,
    notes: `Wager: Rs ${parsedBet.toFixed(2)} on ${game}`
  });

  try {
    updateWalletBalance(resolvedUid, debitRes.wallet.balance).catch(() => {});
    addTransaction({ user_id: resolvedUid, type: 'bet', amount: parsedBet, status: 'completed' }).catch(() => {});
  } catch (e) {}

  let gameResult = {};
  let finalPayout = 0;

  const normalizedGame = (game || '').toLowerCase().replace(/^winx-/, '');

  // 3. Execute Server-Side RNG Engine
  switch (normalizedGame) {
    case 'crash':
    case 'aviator':
    case 'aviator-pro':
    case 'spribe_aviator': {
      const crashMultiplier = risk.forceHouseEdge ? 1.00 : calculateCrashOutcome(normalizedGame);
      gameResult = {
        crashPoint: crashMultiplier,
        isCrashed: false
      };
      break;
    }

    case 'super-ace':
    case 'super-ace-deluxe':
    case 'mahjong-ways-gold':
    case 'wild-bounty-gold': {
      const spin = risk.forceHouseEdge
        ? { grid: [], goldenGrid: [], isWin: false, totalMultiplier: 0, payout: 0, cascades: [] }
        : calculateSuperAceSpin(parsedBet, normalizedGame);
      
      gameResult = spin;
      finalPayout = spin.payout || 0;
      break;
    }

    case 'fortune-gems':
    case 'fortune-gems-2': {
      const spin = risk.forceHouseEdge
        ? { grid: [], wheelMultiplier: 1, isWin: false, totalMultiplier: 0, payout: 0, winningLines: [] }
        : calculateFortuneGemsSpin(parsedBet, normalizedGame);

      gameResult = spin;
      finalPayout = spin.payout || 0;
      break;
    }

    case 'mines': {
      const minesCount = parseInt(params.mines) || 3;
      const roundOutcome = calculateMinesOutcome(parsedBet, minesCount, params.revealedTiles || 1);
      gameResult = roundOutcome;
      finalPayout = roundOutcome.payout || 0;
      break;
    }

    case 'plinko': {
      const rows = parseInt(params.rows) || 16;
      const riskLevel = params.riskLevel || 'medium';
      const outcome = calculatePlinkoOutcome(parsedBet, rows, riskLevel);
      gameResult = outcome;
      finalPayout = outcome.payout || 0;
      break;
    }

    case 'limbo': {
      const targetMult = parseFloat(params.targetMultiplier) || 2.0;
      const outcome = calculateLimboOutcome(parsedBet, targetMult);
      gameResult = outcome;
      finalPayout = outcome.payout || 0;
      break;
    }

    case 'roulette': {
      const outcome = calculateRouletteOutcome();
      const betType = params.betType || 'color';
      const betValue = params.betValue || 'red';
      let isWin = false;
      let mult = 0;

      if (betType === 'color' && outcome.color === betValue) {
        isWin = true;
        mult = 2.0;
      } else if (betType === 'number' && outcome.number === parseInt(betValue)) {
        isWin = true;
        mult = 36.0;
      }

      gameResult = { ...outcome, isWin };
      if (isWin) {
        finalPayout = parseFloat((parsedBet * mult).toFixed(2));
      }
      break;
    }

    default: {
      const spin = calculateSuperAceSpin(parsedBet, normalizedGame);
      gameResult = spin;
      finalPayout = spin.payout || 0;
    }
  }

  // 4. Enforce Max Win Cap
  if (finalPayout > 0) {
    if (finalPayout > risk.maxWinCap) {
      finalPayout = risk.maxWinCap;
      gameResult.capped = true;
    }

    // 5. Credit Payout to User (permanently updates Supabase)
    const creditRes = creditUserBalance(user_id, finalPayout, email, `Won in ${game}`);
    recordTransactionRecord({
      user_id: resolvedUid,
      email,
      type: 'payout',
      amount: finalPayout,
      status: 'completed',
      method: `${game} Payout`,
      notes: `Won Rs ${finalPayout.toFixed(2)} on ${game}`
    });

    // Record to bet_history
    supabase.from('bet_history').insert({
      user_id: resolvedUid,
      user_email: email,
      game_id: normalizedGame,
      game_name: game || 'Casino Game',
      bet_amount: parsedBet,
      win_amount: finalPayout,
      result: 'win',
      multiplier: parsedBet > 0 ? parseFloat((finalPayout / parsedBet).toFixed(2)) : 1.0,
      balance_before: parseFloat((debitRes.wallet.balance + parsedBet).toFixed(2)),
      balance_after: creditRes.balance,
      status: 'completed'
    }).then(({ error }) => { if (error) console.error('bet_history win error:', error.message); });

    try {
      updateWalletBalance(resolvedUid, creditRes.balance).catch(() => {});
      addTransaction({ user_id: resolvedUid, type: 'payout', amount: finalPayout, status: 'completed' }).catch(() => {});
    } catch (e) {}

    return res.status(200).json({
      success: true,
      game,
      betAmount: parsedBet,
      payout: finalPayout,
      new_balance: creditRes.balance,
      result: gameResult
    });
  }

  // Record Loss in bet_history
  supabase.from('bet_history').insert({
    user_id: resolvedUid,
    user_email: email,
    game_id: normalizedGame,
    game_name: game || 'Casino Game',
    bet_amount: parsedBet,
    win_amount: 0,
    result: 'loss',
    multiplier: 0,
    balance_before: parseFloat((debitRes.wallet.balance + parsedBet).toFixed(2)),
    balance_after: debitRes.wallet.balance,
    status: 'completed'
  }).then(({ error }) => { if (error) console.error('bet_history loss error:', error.message); });

  // Loss response
  const currentWallet = getUserWallet(user_id, email);
  return res.status(200).json({
    success: true,
    game,
    betAmount: parsedBet,
    payout: 0,
    new_balance: currentWallet ? currentWallet.balance : debitRes.wallet.balance,
    result: gameResult
  });
}

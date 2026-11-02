import { debitUserBalance, creditUserBalance, recordTransactionRecord, getUserWallet } from '../../../utils/walletStore';
import { updateWalletBalance, addTransaction } from '../../../utils/firebaseDb';
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

  const { user_id, game, action = 'spin', betAmount = 10, params = {} } = req.body || {};

  if (!user_id) {
    return res.status(400).json({ success: false, error: 'Missing user identifier' });
  }

  const parsedBet = parseFloat(betAmount);
  if (isNaN(parsedBet) || parsedBet <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid bet amount' });
  }

  // 1. Fetch Risk Controls
  const risk = getRiskControls();
  const isRestricted = (risk.restrictedUsers || []).includes(user_id);

  // 2. Debit Bet Amount
  const debitRes = debitUserBalance(user_id, parsedBet);
  if (!debitRes.success) {
    return res.status(400).json({
      success: false,
      error: debitRes.error || 'Insufficient wallet balance. Please deposit.'
    });
  }

  // Record wager transaction
  recordTransactionRecord({
    user_id,
    type: 'bet',
    amount: parsedBet,
    status: 'completed',
    method: `${game || 'Casino'} Bet`,
    notes: `Wager: Rs ${parsedBet.toFixed(2)} on ${game}`
  });

  try {
    updateWalletBalance(user_id, debitRes.wallet.balance).catch(() => {});
    addTransaction({ user_id, type: 'bet', amount: parsedBet, status: 'completed' }).catch(() => {});
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

    case 'mines':
    case 'stake-mines': {
      const totalMines = Number(params.mines || 3);
      const openedCount = Number(params.openedTiles || 1);
      const mult = calculateMinesOutcome(totalMines, openedCount, normalizedGame);
      gameResult = {
        multiplier: mult,
        safe: true
      };
      finalPayout = parseFloat((parsedBet * mult).toFixed(2));
      break;
    }

    case 'plinko':
    case 'stake-plinko': {
      const rows = Number(params.rows || 12);
      const riskLevel = params.risk || 'medium';
      const plinkoRes = calculatePlinkoOutcome(rows, riskLevel, normalizedGame);
      gameResult = plinkoRes;
      finalPayout = parseFloat((parsedBet * plinkoRes.multiplier).toFixed(2));
      break;
    }

    case 'limbo':
    case 'limbo-rocket': {
      const targetMult = parseFloat(params.targetMultiplier || 2.0);
      const limboRes = calculateLimboOutcome(targetMult, normalizedGame);
      gameResult = limboRes;
      if (limboRes.isWin) {
        finalPayout = parseFloat((parsedBet * targetMult).toFixed(2));
      }
      break;
    }

    case 'roulette':
    case 'roulette-pro': {
      const outcome = calculateRouletteOutcome(normalizedGame);
      const betType = params.betType || 'red';
      let isWin = false;
      let mult = 0;

      if (betType === outcome.color) {
        isWin = true;
        mult = 2.0;
      } else if (betType === 'even' && outcome.isEven) {
        isWin = true;
        mult = 2.0;
      } else if (Number(params.chosenNumber) === outcome.number) {
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

    // 5. Credit Payout to User
    const creditRes = creditUserBalance(user_id, finalPayout, '', `Won in ${game}`);
    recordTransactionRecord({
      user_id,
      type: 'payout',
      amount: finalPayout,
      status: 'completed',
      method: `${game} Payout`,
      notes: `Won Rs ${finalPayout.toFixed(2)} on ${game}`
    });

    try {
      updateWalletBalance(user_id, creditRes.balance).catch(() => {});
      addTransaction({ user_id, type: 'payout', amount: finalPayout, status: 'completed' }).catch(() => {});
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

  // Loss response
  const currentWallet = getUserWallet(user_id);
  return res.status(200).json({
    success: true,
    game,
    betAmount: parsedBet,
    payout: 0,
    new_balance: currentWallet ? currentWallet.balance : debitRes.wallet.balance,
    result: gameResult
  });
}

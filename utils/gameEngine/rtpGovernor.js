import { getSettings } from '../settingsStore.js';

/**
 * Return to Player (RTP) and Risk Engine Governor
 * Translates admin configured winning ratios into deterministic game math.
 */

// Default RTP fallbacks
const DEFAULT_GLOBAL_RTP = 92.0; // 92% RTP = 8% house edge

/**
 * Fetch current active RTP for a given game from settings store
 */
export function getGameRtp(gameSlug = '') {
  try {
    const settings = getSettings();
    const globalRtp = settings.global_rtp !== undefined ? Number(settings.global_rtp) : DEFAULT_GLOBAL_RTP;
    const rtpMap = settings.game_rtp_settings || {};

    const cleanSlug = String(gameSlug).toLowerCase().replace(/^winx-/, '');
    const specificRtp = rtpMap[cleanSlug] || rtpMap[gameSlug.toLowerCase()];
    if (specificRtp !== undefined && !isNaN(Number(specificRtp))) {
      return Number(specificRtp);
    }
    return globalRtp;
  } catch (e) {
    return DEFAULT_GLOBAL_RTP;
  }
}

/**
 * Check if house edge is forced or if max win cap is reached
 */
export function getRiskControls() {
  try {
    const settings = getSettings();
    return {
      globalRtp: settings.global_rtp !== undefined ? Number(settings.global_rtp) : DEFAULT_GLOBAL_RTP,
      maxWinCap: settings.max_win_cap !== undefined ? Number(settings.max_win_cap) : 5000.0,
      forceHouseEdge: Boolean(settings.force_house_edge),
      restrictedUsers: Array.isArray(settings.restricted_users) ? settings.restricted_users : []
    };
  } catch (e) {
    return {
      globalRtp: DEFAULT_GLOBAL_RTP,
      maxWinCap: 5000.0,
      forceHouseEdge: false,
      restrictedUsers: []
    };
  }
}

/**
 * CRASH / AVIATOR OUTCOME GENERATOR
 */
export function calculateCrashOutcome(gameSlug = 'crash') {
  const rtp = getGameRtp(gameSlug);
  const houseEdge = (100 - rtp) / 100;

  const rand = Math.random();
  if (rand < houseEdge) {
    return 1.00;
  }

  const uniform = Math.random();
  const rawMult = 0.99 / (1 - uniform * (rtp / 100));
  return Math.min(Math.max(1.01, parseFloat(rawMult.toFixed(2))), 150.0);
}

/**
 * SUPER ACE (JILI) SLOT SPIN GENERATOR
 */
const SUPER_ACE_SYMBOLS = [
  { id: 'A', name: 'Ace', payout: 2.5, color: '#ff3366', isRoyal: true },
  { id: 'K', name: 'King', payout: 1.8, color: '#ffaa00', isRoyal: true },
  { id: 'Q', name: 'Queen', payout: 1.2, color: '#00d2ff', isRoyal: true },
  { id: 'J', name: 'Jack', payout: 0.8, color: '#a855f7', isRoyal: true },
  { id: '10', name: 'Ten', payout: 0.5, color: '#00ff88', isRoyal: true },
  { id: 'SPADE', name: 'Spade', payout: 0.4, color: '#ffffff', isRoyal: false },
  { id: 'HEART', name: 'Heart', payout: 0.4, color: '#ff4444', isRoyal: false },
  { id: 'CLUB', name: 'Club', payout: 0.3, color: '#10b981', isRoyal: false },
  { id: 'DIAMOND', name: 'Diamond', payout: 0.3, color: '#38bdf8', isRoyal: false }
];

export function calculateSuperAceSpin(betAmount = 10, gameSlug = 'super-ace') {
  const rtp = getGameRtp(gameSlug);
  const winProbability = (rtp / 100) * 0.45;
  const isWin = Math.random() < winProbability;

  const grid = [];
  const goldenGrid = [];

  for (let c = 0; c < 5; c++) {
    const col = [];
    const goldCol = [];
    for (let r = 0; r < 3; r++) {
      const randomSymbol = SUPER_ACE_SYMBOLS[Math.floor(Math.random() * SUPER_ACE_SYMBOLS.length)];
      col.push(randomSymbol.id);
      goldCol.push(c >= 1 && c <= 3 && Math.random() < 0.18);
    }
    grid.push(col);
    goldenGrid.push(goldCol);
  }

  let totalMultiplier = 0;
  let cascades = [];

  if (isWin) {
    const winSymbol = SUPER_ACE_SYMBOLS[Math.floor(Math.random() * (SUPER_ACE_SYMBOLS.length - 2))];
    grid[0][1] = winSymbol.id;
    grid[1][1] = winSymbol.id;
    grid[2][1] = winSymbol.id;

    if (Math.random() < 0.35) {
      grid[3][1] = winSymbol.id;
    }

    const baseWin = winSymbol.payout * (grid[3][1] === winSymbol.id ? 2.5 : 1.0);
    const stepMult = Math.random() < 0.25 ? 2 : 1;
    totalMultiplier = baseWin * stepMult;

    cascades.push({
      step: 1,
      multiplier: stepMult,
      payout: parseFloat((betAmount * totalMultiplier).toFixed(2)),
      winningSymbol: winSymbol.id,
      positions: [[0, 1], [1, 1], [2, 1], ...(grid[3][1] === winSymbol.id ? [[3, 1]] : [])]
    });
  }

  const isScatterBonus = Math.random() < 0.025;
  if (isScatterBonus) {
    grid[0][0] = 'SCATTER';
    grid[2][0] = 'SCATTER';
    grid[4][0] = 'SCATTER';
  }

  return {
    grid,
    goldenGrid,
    isWin,
    totalMultiplier: parseFloat(totalMultiplier.toFixed(2)),
    payout: parseFloat((betAmount * totalMultiplier).toFixed(2)),
    cascades,
    freeSpinsAwarded: isScatterBonus ? 10 : 0
  };
}

/**
 * FORTUNE GEMS 2 (JILI) SLOT SPIN GENERATOR
 */
const FORTUNE_GEMS_SYMBOLS = [
  { id: 'GARUDA', name: 'Garuda Wild', payout: 5.0, color: '#f59e0b' },
  { id: 'RUBY', name: 'Red Ruby', payout: 3.5, color: '#ef4444' },
  { id: 'EMERALD', name: 'Green Emerald', payout: 2.5, color: '#10b981' },
  { id: 'SAPPHIRE', name: 'Blue Sapphire', payout: 2.0, color: '#3b82f6' },
  { id: 'A', name: 'Golden Ace', payout: 1.2, color: '#eab308' },
  { id: 'K', name: 'King', payout: 1.0, color: '#f97316' },
  { id: 'Q', name: 'Queen', payout: 0.8, color: '#06b6d4' },
  { id: 'J', name: 'Jack', payout: 0.5, color: '#8b5cf6' }
];

const WHEEL_MULTIPLIERS = [1, 1, 1, 2, 2, 2, 3, 3, 5, 8];

export function calculateFortuneGemsSpin(betAmount = 10, gameSlug = 'fortune-gems') {
  const rtp = getGameRtp(gameSlug);
  const winProbability = (rtp / 100) * 0.18;
  const isWin = Math.random() < winProbability;

  const grid = [];
  for (let c = 0; c < 3; c++) {
    const col = [];
    for (let r = 0; r < 3; r++) {
      const sym = FORTUNE_GEMS_SYMBOLS[Math.floor(Math.random() * FORTUNE_GEMS_SYMBOLS.length)];
      col.push(sym.id);
    }
    grid.push(col);
  }

  const wheelIndex = Math.floor(Math.random() * WHEEL_MULTIPLIERS.length);
  const wheelMultiplier = WHEEL_MULTIPLIERS[wheelIndex];

  let totalMultiplier = 0;
  let winningLines = [];

  if (isWin) {
    const winSym = FORTUNE_GEMS_SYMBOLS[Math.floor(Math.random() * FORTUNE_GEMS_SYMBOLS.length)];
    grid[0][1] = winSym.id;
    grid[1][1] = Math.random() < 0.25 ? 'GARUDA' : winSym.id;
    grid[2][1] = winSym.id;

    totalMultiplier = winSym.payout * wheelMultiplier;
    winningLines.push({
      line: 'middle',
      symbol: winSym.id,
      basePayout: winSym.payout,
      multiplier: wheelMultiplier,
      linePayout: parseFloat((betAmount * winSym.payout * wheelMultiplier).toFixed(2))
    });
  }

  return {
    grid,
    wheelMultiplier,
    isWin,
    totalMultiplier: parseFloat(totalMultiplier.toFixed(2)),
    payout: parseFloat((betAmount * totalMultiplier).toFixed(2)),
    winningLines
  };
}

/**
 * MINES (STAKE STYLE) STEP GENERATOR
 */
export function calculateMinesOutcome(totalMines = 3, openedTiles = 1, gameSlug = 'mines') {
  const rtp = getGameRtp(gameSlug);
  const totalTiles = 25;
  const safeTiles = totalTiles - totalMines;

  let multiplier = 1.0;
  for (let i = 0; i < openedTiles; i++) {
    multiplier *= (totalTiles - i) / (safeTiles - i);
  }
  const finalMultiplier = parseFloat((multiplier * (rtp / 100)).toFixed(2));
  return Math.max(1.05, finalMultiplier);
}

/**
 * PLINKO (STAKE STYLE) ROW DROP GENERATOR
 */
export function calculatePlinkoOutcome(rows = 12, risk = 'medium', gameSlug = 'plinko') {
  const rtp = getGameRtp(gameSlug);
  const probabilities = [];
  
  // Binomial distribution for peg bounce left vs right
  let path = [];
  let rightBounces = 0;
  for (let r = 0; r < rows; r++) {
    const goRight = Math.random() < 0.5;
    path.push(goRight ? 'R' : 'L');
    if (goRight) rightBounces++;
  }

  const slotIndex = rightBounces;
  const multipliers = {
    low: [5.6, 2.1, 1.3, 1.0, 0.7, 0.5, 0.7, 1.0, 1.3, 2.1, 5.6],
    medium: [13, 3, 1.5, 1.1, 0.4, 0.2, 0.4, 1.1, 1.5, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.1, 0.2, 0.3, 1.5, 4, 29]
  };

  const multList = multipliers[risk] || multipliers.medium;
  const safeIndex = Math.min(Math.max(slotIndex, 0), multList.length - 1);
  const rawMult = multList[safeIndex];
  const finalMult = parseFloat((rawMult * (rtp / 100)).toFixed(2));

  return {
    path,
    slotIndex: safeIndex,
    multiplier: Math.max(0.1, finalMult)
  };
}

/**
 * EUROPEAN ROULETTE (37 Pockets 0-36)
 */
export function calculateRouletteOutcome(gameSlug = 'roulette') {
  const number = Math.floor(Math.random() * 37); // 0 to 36
  const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  const color = number === 0 ? 'green' : (redNumbers.includes(number) ? 'red' : 'black');
  return {
    number,
    color,
    isEven: number !== 0 && number % 2 === 0,
    isHigh: number >= 19 && number <= 36
  };
}

/**
 * LIMBO ROCKET MULTIPLIER GENERATOR
 */
export function calculateLimboOutcome(targetMultiplier = 2.0, gameSlug = 'limbo') {
  const rtp = getGameRtp(gameSlug);
  const winProbability = (rtp / 100) / targetMultiplier;
  const isWin = Math.random() < winProbability;
  const multiplier = isWin 
    ? parseFloat((targetMultiplier + (Math.random() * targetMultiplier * 0.5)).toFixed(2))
    : parseFloat(((Math.random() * (targetMultiplier - 1.01)) + 1.00).toFixed(2));

  return {
    isWin,
    targetMultiplier,
    drawnMultiplier: multiplier
  };
}

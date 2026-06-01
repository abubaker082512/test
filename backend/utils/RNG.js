/**
 * RNG.js
 * Core Random Number Generator for the in-house games.
 * Configured to strictly enforce a 40% win rate across the platform initially.
 */

class RNG {
  /**
   * Determines if a game round should be a winning round based on a fixed percentage.
   * Requested by user: 40% win percentage initially.
   * @returns {boolean} True if it's a win, False if it's a loss.
   */
  static determineWin() {
    const winPercentage = 0.40; // 40% Win Rate
    const rand = Math.random();
    return rand <= winPercentage;
  }

  /**
   * Generates a crash multiplier based on the forced win rate.
   * If it's a forced loss (60%), crash immediately at 1.00x.
   * If it's a win (40%), generate a curve using inverse transform sampling (heavy tail).
   * @returns {number} The target crash multiplier (e.g., 2.34)
   */
  static generateCrashMultiplier() {
    const isWin = this.determineWin();
    
    if (!isWin) {
      // Forced loss: Crashes immediately at 1.00x so no players can win
      return 1.00;
    }

    // Win condition: Generate a random crash multiplier > 1.00x
    // Using standard crypto crash curve logic: e = 100 / (100 - random[0, 100])
    // The house edge is already handled by the 60% forced loss, so we can let this run natively.
    const e = 2 ** 32;
    const h = Math.floor(Math.random() * e);
    
    // To ensure it always goes above 1.00 since it's a "win" round, 
    // we clamp the minimum multiplier to 1.10x
    let m = Math.floor((100 * e - h) / (e - h)) / 100.0;
    return Math.max(1.10, m);
  }

  /**
   * Simulates a slot machine spin ensuring 40% hit rate.
   * @returns {object} Payout multiplier and the result symbols
   */
  static generateSlotResult() {
    const isWin = this.determineWin();
    
    if (!isWin) {
      // Loss: Return a 0x multiplier
      return { multiplier: 0, symbols: ['A', 'K', 'Q'] };
    }

    // Win: Determine payout (e.g., between 2x to 50x depending on rarity)
    const luck = Math.random();
    let multiplier = 2;
    let symbols = ['K', 'K', 'K'];

    if (luck > 0.95) {
      multiplier = 50; // Jackpot
      symbols = ['7', '7', '7'];
    } else if (luck > 0.80) {
      multiplier = 10;
      symbols = ['WILD', 'WILD', 'WILD'];
    } else {
      multiplier = 2;
      symbols = ['A', 'A', 'A'];
    }

    return { multiplier, symbols };
  }
}

module.exports = RNG;

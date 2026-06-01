/**
 * WalletManager.js
 * Handles safe atomic balance operations for the betting engine.
 * Ensures that users cannot double spend and balances are strictly enforced.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class WalletManager {
  /**
   * Deducts a bet from the user's wallet.
   * @param {string} userId - The user's ID
   * @param {number} amount - The amount to bet
   * @returns {boolean} - True if successful, false if insufficient funds
   */
  static async placeBet(userId, amount) {
    try {
      // Atomic transaction: Decrease balance only if current balance >= amount
      const result = await prisma.wallet.updateMany({
        where: {
          userId: userId,
          balance: { gte: amount }
        },
        data: {
          balance: { decrement: amount }
        }
      });
      return result.count > 0;
    } catch (e) {
      console.error("Error placing bet:", e);
      return false;
    }
  }

  /**
   * Adds winnings to the user's wallet.
   * @param {string} userId - The user's ID
   * @param {number} amount - The amount won
   */
  static async awardWin(userId, amount) {
    try {
      await prisma.wallet.update({
        where: { userId: userId },
        data: {
          balance: { increment: amount }
        }
      });
      return true;
    } catch (e) {
      console.error("Error awarding win:", e);
      return false;
    }
  }
}

module.exports = WalletManager;

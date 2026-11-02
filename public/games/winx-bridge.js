/**
 * WinX Pro Universal Wallet & Server RTP Bridge for Hosted GitHub Open-Source Games
 * Bridges standalone HTML5 / Phaser 3 / PixiJS / Matter.js builds to:
 *  - GET  /api/wallet/get-balance
 *  - POST /api/games/play (Server-Side RTP Governor)
 *  - POST /api/wallet/bet
 *  - POST /api/wallet/payout
 */
(function (global) {
  const params = new URLSearchParams(window.location.search);
  const state = {
    userId: params.get('user_id') || 'guest_player',
    email: params.get('email') || '',
    isDemo: params.get('demo') === 'true' || params.get('demo') === '1',
    balance: parseFloat(params.get('balance')) || 1000.0,
    currency: 'Rs ',
    listeners: []
  };

  function notifyListeners(newBal) {
    if (typeof newBal === 'number' && !isNaN(newBal)) {
      state.balance = parseFloat(newBal.toFixed(2));
    }
    state.listeners.forEach((fn) => {
      try {
        fn(state.balance);
      } catch (e) {}
    });
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage(
          {
            type: 'WINX_BALANCE_SYNC',
            balance: state.balance,
            isDemo: state.isDemo
          },
          '*'
        );
      } catch (e) {}
    }
  }

  // Listen for balance updates from parent frame
  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'WINX_INIT' || data.type === 'WINX_UPDATE_USER') {
      if (data.userId) state.userId = data.userId;
      if (data.email) state.email = data.email;
      if (typeof data.isDemo === 'boolean') state.isDemo = data.isDemo;
      if (typeof data.balance === 'number') {
        notifyListeners(data.balance);
      }
    }
  });

  async function fetchBalance() {
    if (state.isDemo || !state.userId || state.userId === 'guest_player') {
      notifyListeners(state.balance);
      return state.balance;
    }
    try {
      const res = await fetch(
        `/api/wallet/get-balance?user_id=${encodeURIComponent(state.userId)}&email=${encodeURIComponent(state.email)}`
      );
      const json = await res.json();
      if (json && json.success && json.wallet) {
        notifyListeners(parseFloat(json.wallet.balance) || 0);
      }
    } catch (e) {
      console.warn('[WinXBridge] Balance fetch error:', e);
    }
    return state.balance;
  }

  /**
   * Execute a full server-governed round via POST /api/games/play
   */
  async function playRound(gameSlug, betAmount, extraParams = {}) {
    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0) {
      return { success: false, error: 'Invalid bet amount' };
    }
    if (state.balance < bet) {
      return { success: false, error: 'Insufficient balance! Please deposit to continue.' };
    }

    if (state.isDemo || state.userId === 'guest_player') {
      // Still query /api/games/play if possible or simulate with RTP
      notifyListeners(state.balance - bet);
      try {
        const res = await fetch('/api/games/play', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: state.userId,
            game: gameSlug,
            betAmount: bet,
            params: extraParams
          })
        });
        const data = await res.json();
        if (data && data.success) {
          const payout = parseFloat(data.payout) || 0;
          notifyListeners(state.balance + payout);
          return {
            success: true,
            payout,
            new_balance: state.balance,
            result: data.result || {}
          };
        }
      } catch (e) {}
      return { success: true, payout: 0, new_balance: state.balance, result: {} };
    }

    try {
      const res = await fetch('/api/games/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: state.userId,
          game: gameSlug,
          betAmount: bet,
          params: extraParams
        })
      });
      const data = await res.json();
      if (data && data.success) {
        notifyListeners(parseFloat(data.new_balance));
        return data;
      }
      return { success: false, error: (data && data.error) || 'Round failed' };
    } catch (err) {
      return { success: false, error: err.message || 'Network error' };
    }
  }

  /**
   * Debit a bet for interactive multi-step games (Mines, Crash, Blackjack, Roulette, Plinko)
   */
  async function debitBet(betAmount) {
    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0) return { success: false, error: 'Invalid bet' };
    if (state.balance < bet) return { success: false, error: 'Insufficient balance' };

    if (state.isDemo || state.userId === 'guest_player') {
      notifyListeners(state.balance - bet);
      return { success: true, balance: state.balance };
    }

    try {
      const res = await fetch('/api/wallet/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: state.userId,
          amount: bet
        })
      });
      const data = await res.json();
      if (data && data.success) {
        const nextBal = data.wallet ? parseFloat(data.wallet.balance) : state.balance - bet;
        notifyListeners(nextBal);
        return { success: true, balance: state.balance };
      }
      return { success: false, error: (data && data.error) || 'Bet rejected' };
    } catch (e) {
      return { success: false, error: 'Network error placing bet' };
    }
  }

  /**
   * Credit a win payout for interactive games
   */
  async function creditPayout(betAmount, multiplier) {
    const bet = parseFloat(betAmount);
    const mult = parseFloat(multiplier);
    if (isNaN(bet) || isNaN(mult) || mult <= 0) return { success: false };

    const winAmount = parseFloat((bet * mult).toFixed(2));

    if (state.isDemo || state.userId === 'guest_player') {
      notifyListeners(state.balance + winAmount);
      return { success: true, payout: winAmount, balance: state.balance };
    }

    try {
      const res = await fetch('/api/wallet/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: state.userId,
          bet_amount: bet,
          multiplier: mult
        })
      });
      const data = await res.json();
      if (data && data.success) {
        const nextBal = data.wallet ? parseFloat(data.wallet.balance) : state.balance + winAmount;
        notifyListeners(nextBal);
        return { success: true, payout: winAmount, balance: state.balance };
      }
      return { success: false, error: (data && data.error) || 'Payout error' };
    } catch (e) {
      return { success: false, error: 'Network error crediting payout' };
    }
  }

  global.WinXBridge = {
    getState: () => ({ ...state }),
    getBalance: () => state.balance,
    fetchBalance,
    playRound,
    debitBet,
    creditPayout,
    onBalanceChange: (cb) => {
      if (typeof cb === 'function') state.listeners.push(cb);
    }
  };

  // Auto-fetch initial balance when DOM loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchBalance);
  } else {
    fetchBalance();
  }
})(window);

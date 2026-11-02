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
  const initialBalParam = parseFloat(params.get('balance'));
  const state = {
    userId: params.get('user_id') || 'guest_player',
    email: params.get('email') || '',
    isDemo: params.get('demo') === 'true' || params.get('demo') === '1',
    balance: !isNaN(initialBalParam) && initialBalParam >= 0 ? initialBalParam : 5000.0,
    currency: 'Rs ',
    listeners: []
  };

  function postToParent(bal) {
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage(
          {
            type: 'WINX_BALANCE_SYNC',
            balance: bal,
            isDemo: state.isDemo
          },
          '*'
        );
      } catch (e) {}
    }
  }

  function notifyListeners(newBal, syncParent = true) {
    if (typeof newBal === 'number' && !isNaN(newBal)) {
      state.balance = Math.max(0, parseFloat(newBal.toFixed(2)));
    }
    state.listeners.forEach((fn) => {
      try {
        fn(state.balance);
      } catch (e) {}
    });
    if (syncParent) {
      postToParent(state.balance);
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
      if (typeof data.balance === 'number' && !isNaN(data.balance)) {
        notifyListeners(data.balance, false);
      }
    }
  });

  async function fetchBalance(fallbackBalance) {
    if (
      typeof fallbackBalance === 'number' &&
      !isNaN(fallbackBalance) &&
      (state.isDemo || state.userId === 'guest_player')
    ) {
      if (isNaN(initialBalParam)) {
        state.balance = fallbackBalance;
      }
    }

    if (state.isDemo || (!state.userId && !state.email) || (state.userId === 'guest_player' && !state.email)) {
      notifyListeners(state.balance, true);
      return state.balance;
    }

    try {
      const res = await fetch(
        `/api/wallet/get-balance?user_id=${encodeURIComponent(state.userId)}&email=${encodeURIComponent(state.email)}`
      );
      const json = await res.json();
      if (json && json.success) {
        const fetchedBal =
          json.wallet && json.wallet.balance !== undefined
            ? parseFloat(json.wallet.balance)
            : parseFloat(json.balance);
        if (!isNaN(fetchedBal)) {
          notifyListeners(fetchedBal, true);
        }
      }
    } catch (e) {
      console.warn('[WinXBridge] Balance fetch error:', e);
    }
    return state.balance;
  }

  /**
   * Initialize bridge and return resolved balance (used by all open-source games on startup)
   */
  async function init(fallbackBalance) {
    return await fetchBalance(fallbackBalance);
  }

  /**
   * Simulate local RTP outcome when playing in Demo mode or as a Guest
   */
  function simulateLocalRound(bet) {
    const roll = Math.random();
    let multiplier = 0;
    if (roll < 0.03) {
      multiplier = parseFloat((10 + Math.random() * 25).toFixed(2));
    } else if (roll < 0.14) {
      multiplier = parseFloat((3 + Math.random() * 6).toFixed(2));
    } else if (roll < 0.38) {
      multiplier = parseFloat((1.2 + Math.random() * 1.8).toFixed(2));
    }
    const payout = parseFloat((bet * multiplier).toFixed(2));
    return {
      isWin: payout > 0,
      multiplier,
      payout
    };
  }

  /**
   * Execute a full server-governed round via POST /api/games/play
   */
  async function playServerGovernedRound(gameSlug, betAmount, extraParams = {}) {
    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0) {
      return {
        ok: false,
        success: false,
        error: 'Invalid bet amount',
        isWin: false,
        payout: 0,
        multiplier: 0,
        newBalance: state.balance,
        new_balance: state.balance
      };
    }
    if (state.balance + 0.001 < bet) {
      return {
        ok: false,
        success: false,
        error: 'Insufficient balance! Please deposit to continue.',
        isWin: false,
        payout: 0,
        multiplier: 0,
        newBalance: state.balance,
        new_balance: state.balance
      };
    }

    // Optimistic debit so parent header reflects the wager immediately
    const postDebitBalance = Math.max(0, parseFloat((state.balance - bet).toFixed(2)));
    notifyListeners(postDebitBalance, true);

    if (state.isDemo || (state.userId === 'guest_player' && !state.email)) {
      const sim = simulateLocalRound(bet);
      const nextBal = parseFloat((postDebitBalance + sim.payout).toFixed(2));
      notifyListeners(nextBal, true);
      return {
        ok: true,
        success: true,
        isWin: sim.isWin,
        multiplier: sim.multiplier,
        payout: sim.payout,
        newBalance: state.balance,
        new_balance: state.balance,
        balance: state.balance,
        result: sim
      };
    }

    try {
      const res = await fetch('/api/games/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: state.userId,
          email: state.email,
          game: gameSlug || 'slot',
          betAmount: bet,
          params: extraParams
        })
      });
      const data = await res.json();
      if (data && data.success) {
        const payout = parseFloat(data.payout) || 0;
        const mult =
          data.result && data.result.totalMultiplier !== undefined
            ? parseFloat(data.result.totalMultiplier)
            : data.result && data.result.multiplier !== undefined
            ? parseFloat(data.result.multiplier)
            : bet > 0
            ? parseFloat((payout / bet).toFixed(2))
            : 0;
        const nextBal =
          data.new_balance !== undefined && !isNaN(parseFloat(data.new_balance))
            ? parseFloat(data.new_balance)
            : parseFloat((postDebitBalance + payout).toFixed(2));

        notifyListeners(nextBal, true);
        return {
          ok: true,
          success: true,
          isWin: payout > 0,
          multiplier: mult,
          payout,
          newBalance: state.balance,
          new_balance: state.balance,
          balance: state.balance,
          result: data.result || {}
        };
      }
      // Restore optimistic debit if rejected by server
      notifyListeners(postDebitBalance + bet, true);
      return {
        ok: false,
        success: false,
        error: (data && data.error) || 'Round failed',
        isWin: false,
        payout: 0,
        multiplier: 0,
        newBalance: state.balance,
        new_balance: state.balance
      };
    } catch (err) {
      const sim = simulateLocalRound(bet);
      const nextBal = parseFloat((postDebitBalance + sim.payout).toFixed(2));
      notifyListeners(nextBal, true);
      return {
        ok: true,
        success: true,
        isWin: sim.isWin,
        multiplier: sim.multiplier,
        payout: sim.payout,
        newBalance: state.balance,
        new_balance: state.balance,
        balance: state.balance,
        result: sim
      };
    }
  }

  /**
   * Debit a bet for interactive multi-step games (Mines, Crash, Aviator, Blackjack, Roulette, Plinko)
   * Supports both debitBet(amount) and debitBet(gameSlug, amount)
   */
  async function debitBet(arg1, arg2) {
    const hasGameSlug = arg2 !== undefined;
    const gameSlug = hasGameSlug ? String(arg1 || 'casino') : 'casino';
    const bet = parseFloat(hasGameSlug ? arg2 : arg1);

    if (isNaN(bet) || bet <= 0) {
      return { ok: false, success: false, error: 'Invalid bet', balance: state.balance, newBalance: state.balance };
    }
    if (state.balance + 0.001 < bet) {
      return { ok: false, success: false, error: 'Insufficient balance', balance: state.balance, newBalance: state.balance };
    }

    const optimisticBal = Math.max(0, parseFloat((state.balance - bet).toFixed(2)));
    notifyListeners(optimisticBal, true);

    if (state.isDemo || (state.userId === 'guest_player' && !state.email)) {
      return {
        ok: true,
        success: true,
        balance: state.balance,
        newBalance: state.balance,
        new_balance: state.balance
      };
    }

    try {
      const res = await fetch('/api/wallet/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: state.userId,
          email: state.email,
          amount: bet,
          game: gameSlug
        })
      });
      const data = await res.json();
      if (data && data.success) {
        const nextBal =
          data.new_balance !== undefined
            ? parseFloat(data.new_balance)
            : data.wallet && data.wallet.balance !== undefined
            ? parseFloat(data.wallet.balance)
            : optimisticBal;
        notifyListeners(nextBal, true);
        return {
          ok: true,
          success: true,
          balance: state.balance,
          newBalance: state.balance,
          new_balance: state.balance
        };
      }
      return {
        ok: true,
        success: true,
        balance: state.balance,
        newBalance: state.balance,
        new_balance: state.balance
      };
    } catch (e) {
      return {
        ok: true,
        success: true,
        balance: state.balance,
        newBalance: state.balance,
        new_balance: state.balance
      };
    }
  }

  /**
   * Credit a win amount directly for interactive games
   * Supports creditWin(gameSlug, winAmount, multiplier) or creditWin(winAmount, multiplier)
   */
  async function creditWin(arg1, arg2, arg3) {
    const firstIsSlug = typeof arg1 === 'string' && isNaN(Number(arg1));
    const gameSlug = firstIsSlug ? arg1 : 'casino';
    const winAmount = parseFloat(firstIsSlug ? arg2 : arg1);
    const mult = parseFloat(firstIsSlug ? arg3 : arg2) || 1;

    if (isNaN(winAmount) || winAmount <= 0) {
      return { ok: false, success: false, balance: state.balance, newBalance: state.balance };
    }

    const cleanWin = parseFloat(winAmount.toFixed(2));
    const optimisticBal = parseFloat((state.balance + cleanWin).toFixed(2));
    notifyListeners(optimisticBal, true);

    if (state.isDemo || (state.userId === 'guest_player' && !state.email)) {
      return {
        ok: true,
        success: true,
        payout: cleanWin,
        balance: state.balance,
        newBalance: state.balance,
        new_balance: state.balance
      };
    }

    try {
      const res = await fetch('/api/wallet/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: state.userId,
          email: state.email,
          bet_amount: cleanWin,
          win_amount: cleanWin,
          multiplier: mult,
          game: gameSlug
        })
      });
      const data = await res.json();
      if (data && data.success) {
        const nextBal =
          data.new_balance !== undefined
            ? parseFloat(data.new_balance)
            : data.wallet && data.wallet.balance !== undefined
            ? parseFloat(data.wallet.balance)
            : optimisticBal;
        notifyListeners(nextBal, true);
      }
    } catch (e) {}

    return {
      ok: true,
      success: true,
      payout: cleanWin,
      balance: state.balance,
      newBalance: state.balance,
      new_balance: state.balance
    };
  }

  /**
   * Credit a payout calculated from (betAmount * multiplier)
   */
  async function creditPayout(betAmount, multiplier) {
    const bet = parseFloat(betAmount);
    const mult = parseFloat(multiplier);
    if (isNaN(bet) || isNaN(mult) || mult <= 0) {
      return { ok: false, success: false, balance: state.balance, newBalance: state.balance };
    }
    const winAmount = parseFloat((bet * mult).toFixed(2));
    return await creditWin('casino', winAmount, mult);
  }

  global.WinXBridge = {
    init,
    getState: () => ({ ...state }),
    getBalance: () => state.balance,
    fetchBalance,
    playRound: playServerGovernedRound,
    playServerGovernedRound,
    debitBet,
    creditWin,
    creditPayout,
    onBalanceChange: (cb) => {
      if (typeof cb === 'function') state.listeners.push(cb);
    }
  };

  // Auto-fetch initial balance when DOM loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => fetchBalance());
  } else {
    fetchBalance();
  }
})(window);

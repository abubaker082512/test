import React, { useState, useEffect } from 'react';
import { casinoAudio } from '../../utils/casinoAudio';

export default function MinesweeperGame({ user, wallet, fetchWallet, isDemoMode, demoBalance, spendDemoBalance, addDemoBalance }) {
  const [grid, setGrid] = useState(Array(25).fill(null));
  const [bombs, setBombs] = useState([]);
  const [mineCount, setMineCount] = useState(3);
  const [active, setActive] = useState(false);
  const [betAmount, setBetAmount] = useState(20);
  const [multiplier, setMultiplier] = useState(1.0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [message, setMessage] = useState(null);
  const [processing, setProcessing] = useState(false);

  const calculateNextMultiplier = (mines, currentRevealed) => {
    let mult = 1.0;
    const totalTiles = 25;
    const safeTiles = totalTiles - mines;
    for (let i = 0; i < currentRevealed + 1; i++) {
      mult *= (totalTiles - i) / (safeTiles - i);
    }
    return Math.max(1.05, parseFloat((mult * 0.94).toFixed(2))); // 94% RTP
  };

  const startGame = async () => {
    casinoAudio.init();
    const currentBal = isDemoMode ? demoBalance : (wallet ? parseFloat(wallet.balance) : 0);
    if (currentBal < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit to continue.' });
    }

    setProcessing(true);
    setMessage(null);

    if (isDemoMode && spendDemoBalance) {
      spendDemoBalance(betAmount);
    } else if (user) {
      try {
        const res = await fetch('/api/wallet/bet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id || user.uid, amount: betAmount })
        });
        const data = await res.json();
        if (!data.success) {
          setProcessing(false);
          return setMessage({ type: 'error', text: data.error || 'Failed to place bet.' });
        }
        if (fetchWallet) fetchWallet();
      } catch (e) {
        setProcessing(false);
        return setMessage({ type: 'error', text: 'Network error placing wager' });
      }
    }

    // Generate random bomb positions
    const positions = [];
    while (positions.length < mineCount) {
      const idx = Math.floor(Math.random() * 25);
      if (!positions.includes(idx)) positions.push(idx);
    }

    setBombs(positions);
    setGrid(Array(25).fill(null));
    setMultiplier(1.0);
    setRevealedCount(0);
    setActive(true);
    setProcessing(false);
    casinoAudio.playReelTick();
  };

  const reveal = (idx) => {
    if (!active || grid[idx] !== null || processing) return;

    casinoAudio.init();
    const isBomb = bombs.includes(idx);
    const newGrid = [...grid];

    if (isBomb) {
      newGrid[idx] = 'BOMB';
      bombs.forEach(bIdx => {
        newGrid[bIdx] = 'BOMB';
      });
      setGrid(newGrid);
      setActive(false);
      casinoAudio.playCrashBoom();
      setMessage({ type: 'error', text: '💥 BOOM! You hit a mine. Better luck next time!' });
    } else {
      newGrid[idx] = 'GEM';
      setGrid(newGrid);
      const nextRevealed = revealedCount + 1;
      setRevealedCount(nextRevealed);

      const nextMult = calculateNextMultiplier(mineCount, revealedCount);
      setMultiplier(nextMult);
      casinoAudio.playWinChime(nextRevealed);

      // Check if all safe gems revealed
      if (nextRevealed === 25 - mineCount) {
        triggerCashout(nextMult);
      }
    }
  };

  const triggerCashout = async (overrideMult) => {
    if (!active || revealedCount === 0 || processing) return;
    setProcessing(true);
    setActive(false);

    const finalMult = overrideMult || multiplier;
    const rawPayout = parseFloat((betAmount * finalMult).toFixed(2));

    if (isDemoMode) {
      if (addDemoBalance) addDemoBalance(rawPayout);
      casinoAudio.playBigWin();
      setMessage({ type: 'success', text: `💰 Cashed Out Demo! +Rs ${rawPayout.toFixed(2)} (${finalMult}x)` });
      setProcessing(false);
      return;
    }

    try {
      const res = await fetch('/api/wallet/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id || user.uid,
          bet_amount: betAmount,
          multiplier: finalMult
        })
      });
      const data = await res.json();
      if (data.success) {
        casinoAudio.playBigWin();
        setMessage({ type: 'success', text: `💰 Successfully Cashed Out! +Rs ${rawPayout.toFixed(2)} (${finalMult}x)` });
        if (fetchWallet) fetchWallet();
      } else {
        setMessage({ type: 'error', text: data.error || 'Payout error' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Payout connection error' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'radial-gradient(ellipse at top, #0f1c24 0%, #060c10 70%, #000 100%)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      padding: '8px 12px 16px',
      boxSizing: 'border-box',
      overflowY: 'auto',
      userSelect: 'none'
    }}>

      {/* Header bar */}
      <div style={{
        background: 'rgba(0, 229, 255, 0.08)',
        border: '1px solid rgba(0, 229, 255, 0.25)',
        borderRadius: '12px',
        padding: '8px 14px',
        marginBottom: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>💣</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '900', color: '#00e5ff', letterSpacing: '0.5px' }}>
              MINES • STAKE ORIGINALS
            </div>
            <div style={{ fontSize: '10px', color: '#aaa' }}>
              {mineCount} Mines Hidden • {25 - mineCount} Safe Gems
            </div>
          </div>
        </div>

        {active && revealedCount > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #00ff88, #00bb66)',
            color: '#000',
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '900'
          }}>
            {multiplier}x (Rs {(betAmount * multiplier).toFixed(2)})
          </div>
        )}
      </div>

      {/* 5x5 Obsidian Mine Grid */}
      <div style={{
        flex: 1,
        minHeight: '270px',
        background: '#090e14',
        border: '2px solid rgba(0, 229, 255, 0.3)',
        borderRadius: '16px',
        padding: '10px',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '6px',
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 8px 30px rgba(0,0,0,0.7)'
      }}>
        {grid.map((cell, idx) => {
          const isRevealed = cell !== null;
          const isGem = cell === 'GEM';
          const isBomb = cell === 'BOMB';

          return (
            <button
              key={idx}
              onClick={() => reveal(idx)}
              disabled={!active || isRevealed || processing}
              style={{
                borderRadius: '8px',
                border: isRevealed
                  ? (isGem ? '2px solid #00ff88' : '2px solid #ff1744')
                  : '1px solid rgba(255, 255, 255, 0.08)',
                background: isRevealed
                  ? (isGem ? 'radial-gradient(circle, #003318 0%, #001a0c 100%)' : 'radial-gradient(circle, #4a0000 0%, #200000 100%)')
                  : (active ? 'linear-gradient(180deg, #1b2633 0%, #111a24 100%)' : 'rgba(255,255,255,0.03)'),
                boxShadow: isGem ? '0 0 12px rgba(0, 255, 136, 0.5)' : (isBomb ? '0 0 12px rgba(255, 23, 68, 0.7)' : 'none'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                cursor: active && !isRevealed ? 'pointer' : 'default',
                transform: isRevealed ? 'scale(0.96)' : 'scale(1)',
                transition: 'all 0.15s ease'
              }}
            >
              {isGem && '💎'}
              {isBomb && '💣'}
              {!isRevealed && ''}
            </button>
          );
        })}
      </div>

      {/* Messages */}
      {message && (
        <div style={{
          margin: '8px 0',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 'bold',
          textAlign: 'center',
          background: message.type === 'error' ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 255, 136, 0.2)',
          color: message.type === 'error' ? '#ff6666' : '#00ff88',
          border: `1px solid ${message.type === 'error' ? '#ff4444' : '#00ff88'}`
        }}>
          {message.text}
        </div>
      )}

      {/* Controls */}
      <div style={{
        marginTop: '10px',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Mine Count Selector (Only when not active) */}
        {!active && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: '#aaa' }}>MINES:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 3, 5, 10, 24].map(count => (
                <button
                  key={count}
                  onClick={() => setMineCount(count)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: mineCount === count ? '#00e5ff' : 'rgba(255, 255, 255, 0.08)',
                    color: mineCount === count ? '#000' : '#fff',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Button: Start or Cashout */}
        {active ? (
          <button
            onClick={() => triggerCashout()}
            disabled={revealedCount === 0 || processing}
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: revealedCount > 0 ? 'linear-gradient(135deg, #00ff88, #00bb66)' : '#444',
              color: revealedCount > 0 ? '#000' : '#888',
              fontWeight: '900',
              fontSize: '14px',
              border: 'none',
              cursor: revealedCount > 0 ? 'pointer' : 'not-allowed',
              boxShadow: revealedCount > 0 ? '0 4px 18px rgba(0, 255, 136, 0.4)' : 'none'
            }}
          >
            {revealedCount > 0 ? `💰 CASH OUT Rs ${(betAmount * multiplier).toFixed(2)} (${multiplier}x)` : 'Pick a Tile to Begin'}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[10, 20, 50, 100].map(amt => (
                <button
                  key={amt}
                  onClick={() => setBetAmount(amt)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: betAmount === amt ? 'var(--accent)' : 'rgba(255, 255, 255, 0.08)',
                    color: betAmount === amt ? '#000' : '#fff',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  {amt}
                </button>
              ))}
            </div>
            <button
              onClick={startGame}
              disabled={processing}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #00e5ff, #0091ea)',
                color: '#000',
                fontWeight: '900',
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(0, 229, 255, 0.4)'
              }}
            >
              {processing ? 'STARTING...' : '⚡ BET & START'}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

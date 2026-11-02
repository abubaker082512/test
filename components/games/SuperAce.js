import React, { useState, useEffect, useRef } from 'react';
import { casinoAudio } from '../../utils/casinoAudio';

const SYMBOL_DEFINITIONS = {
  'A': {
    name: 'Ace',
    title: 'ACE',
    gradient: 'linear-gradient(135deg, #ff1744 0%, #b71c1c 100%)',
    border: '#ff5252',
    icon: '👑',
    sub: '♠',
    basePayout: 2.5
  },
  'K': {
    name: 'King',
    title: 'KING',
    gradient: 'linear-gradient(135deg, #ff9100 0%, #e65100 100%)',
    border: '#ffab40',
    icon: '⚜️',
    sub: '♥',
    basePayout: 1.8
  },
  'Q': {
    name: 'Queen',
    title: 'QUEEN',
    gradient: 'linear-gradient(135deg, #00e5ff 0%, #006064 100%)',
    border: '#18ffff',
    icon: '💎',
    sub: '♦',
    basePayout: 1.2
  },
  'J': {
    name: 'Jack',
    title: 'JACK',
    gradient: 'linear-gradient(135deg, #d500f9 0%, #4a148c 100%)',
    border: '#e040fb',
    icon: '⚔️',
    sub: '♣',
    basePayout: 0.8
  },
  '10': {
    name: 'Ten',
    title: '10',
    gradient: 'linear-gradient(135deg, #00e676 0%, #1b5e20 100%)',
    border: '#69f0ae',
    icon: '🔟',
    sub: '★',
    basePayout: 0.5
  },
  'SPADE': {
    name: 'Spade',
    title: '♠',
    gradient: 'linear-gradient(135deg, #37474f 0%, #212121 100%)',
    border: '#90a4ae',
    icon: '♠',
    sub: 'Royal',
    basePayout: 0.4
  },
  'HEART': {
    name: 'Heart',
    title: '♥',
    gradient: 'linear-gradient(135deg, #d32f2f 0%, #880e4f 100%)',
    border: '#ff5252',
    icon: '♥',
    sub: 'Royal',
    basePayout: 0.4
  },
  'CLUB': {
    name: 'Club',
    title: '♣',
    gradient: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
    border: '#4caf50',
    icon: '♣',
    sub: 'Royal',
    basePayout: 0.3
  },
  'DIAMOND': {
    name: 'Diamond',
    title: '♦',
    gradient: 'linear-gradient(135deg, #0288d1 0%, #01579b 100%)',
    border: '#29b6f6',
    icon: '♦',
    sub: 'Royal',
    basePayout: 0.3
  },
  'WILD': {
    name: 'Golden Wild',
    title: 'WILD',
    gradient: 'linear-gradient(135deg, #ffd700 0%, #ff8f00 50%, #b8860b 100%)',
    border: '#fff',
    icon: '🃏',
    sub: 'WILD',
    basePayout: 5.0
  },
  'SCATTER': {
    name: 'Scatter',
    title: 'FREE',
    gradient: 'linear-gradient(135deg, #7c4dff 0%, #311b92 100%)',
    border: '#b388ff',
    icon: '🎰',
    sub: 'BONUS',
    basePayout: 10.0
  }
};

const DEFAULT_SYMBOL_IDS = ['A', 'K', 'Q', 'J', '10', 'SPADE', 'HEART', 'CLUB', 'DIAMOND'];

export default function SuperAce({ user, wallet, fetchWallet, isDemoMode, demoBalance, spendDemoBalance, addDemoBalance }) {
  const [betAmount, setBetAmount] = useState(20);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState([]); // 5 columns x 3 rows
  const [goldenGrid, setGoldenGrid] = useState([]); // Golden card status
  const [multiplier, setMultiplier] = useState(1);
  const [isFreeSpins, setIsFreeSpins] = useState(false);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [message, setMessage] = useState(null);

  // Big Win and visual celebration
  const [winningCells, setWinningCells] = useState([]);
  const [bigWinAmount, setBigWinAmount] = useState(0);
  const [showBigWin, setShowBigWin] = useState(false);

  // Initialize starting grid
  useEffect(() => {
    generateInitialGrid();
  }, []);

  const generateInitialGrid = () => {
    const newReels = [];
    const newGold = [];
    for (let c = 0; c < 5; c++) {
      const col = [];
      const goldCol = [];
      for (let r = 0; r < 3; r++) {
        const randId = DEFAULT_SYMBOL_IDS[Math.floor(Math.random() * DEFAULT_SYMBOL_IDS.length)];
        col.push(randId);
        goldCol.push(c >= 1 && c <= 3 && Math.random() < 0.2);
      }
      newReels.push(col);
      newGold.push(goldCol);
    }
    setReels(newReels);
    setGoldenGrid(newGold);
  };

  const multiplierSteps = isFreeSpins ? [2, 4, 6, 10] : [1, 2, 3, 5];

  const triggerSpin = async () => {
    if (spinning) return;
    casinoAudio.init();

    const currentBal = isDemoMode ? demoBalance : (wallet ? parseFloat(wallet.balance) : 0);
    if (currentBal < betAmount && freeSpinsLeft <= 0) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit to continue.' });
    }

    setMessage(null);
    setSpinning(true);
    setWinningCells([]);
    setShowBigWin(false);
    casinoAudio.playReelTick();

    // Deduct bet if not free spin
    if (freeSpinsLeft <= 0) {
      if (isDemoMode) {
        if (spendDemoBalance) spendDemoBalance(betAmount);
      }
    }

    // Call Server RTP Engine
    let serverResult = null;
    try {
      if (!isDemoMode && user) {
        const res = await fetch('/api/games/play', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id || user.uid,
            game: 'super-ace',
            action: 'spin',
            betAmount: freeSpinsLeft > 0 ? 0 : betAmount
          })
        });
        const data = await res.json();
        if (data.success && data.result) {
          serverResult = data.result;
          if (fetchWallet) fetchWallet();
        }
      }
    } catch (e) {
      console.warn('Server spin call error, using local fallback:', e);
    }

    // Reel spin animation (fast symbol cycling with tick sounds)
    let ticks = 0;
    const spinInterval = setInterval(() => {
      ticks++;
      if (ticks % 2 === 0) casinoAudio.playReelTick();

      setReels(prev => {
        return prev.map(col => {
          return col.map(() => {
            return DEFAULT_SYMBOL_IDS[Math.floor(Math.random() * DEFAULT_SYMBOL_IDS.length)];
          });
        });
      });

      if (ticks >= 12) {
        clearInterval(spinInterval);
        finalizeSpin(serverResult);
      }
    }, 60);
  };

  const finalizeSpin = (serverResult) => {
    setSpinning(false);

    if (serverResult && serverResult.grid && serverResult.grid.length === 5) {
      setReels(serverResult.grid);
      if (serverResult.goldenGrid) setGoldenGrid(serverResult.goldenGrid);

      if (serverResult.isWin && serverResult.payout > 0) {
        setMultiplier(serverResult.totalMultiplier > 1 ? 2 : 1);
        casinoAudio.playWinChime(2);

        if (serverResult.payout >= betAmount * 5) {
          setBigWinAmount(serverResult.payout);
          setShowBigWin(true);
          casinoAudio.playBigWin();
        }

        setMessage({
          type: 'success',
          text: `🎉 WIN! +Rs ${serverResult.payout.toFixed(2)} (${serverResult.totalMultiplier}x)`
        });
      } else {
        setMultiplier(1);
      }

      if (serverResult.freeSpinsAwarded > 0) {
        setIsFreeSpins(true);
        setFreeSpinsLeft(prev => prev + serverResult.freeSpinsAwarded);
        setMessage({
          type: 'success',
          text: `🎰 FREE SPINS TRIGGERED! +${serverResult.freeSpinsAwarded} Free Rounds!`
        });
        casinoAudio.playBigWin();
      }
    } else {
      // Local fallback calculation for demo
      const win = Math.random() < 0.35;
      if (win) {
        const mult = Math.random() < 0.2 ? 3 : 1.5;
        const payout = parseFloat((betAmount * mult).toFixed(2));
        if (isDemoMode && addDemoBalance) addDemoBalance(payout);
        casinoAudio.playWinChime(1);
        setMessage({ type: 'success', text: `✨ Demo Win! +Rs ${payout.toFixed(2)}` });
      }
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'radial-gradient(ellipse at top, #1a0826 0%, #080310 70%, #000 100%)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      padding: '8px 12px 16px',
      boxSizing: 'border-box',
      overflowY: 'auto',
      userSelect: 'none'
    }}>

      {/* Top Banner / Consecutive Multiplier Meter */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.15) 0%, rgba(20, 10, 30, 0.9) 100%)',
        border: '1px solid rgba(255, 215, 0, 0.35)',
        borderRadius: '12px',
        padding: '8px 14px',
        marginBottom: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🃏</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '900', color: '#ffd700', letterSpacing: '0.5px' }}>
              SUPER ACE • JILI
            </div>
            <div style={{ fontSize: '10px', color: '#aaa' }}>
              {isFreeSpins ? `🔥 FREE SPINS: ${freeSpinsLeft} LEFT` : 'Consecutive Elimination Multiplier'}
            </div>
          </div>
        </div>

        {/* Multiplier Pills */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {multiplierSteps.map((step, idx) => {
            const isActive = multiplier >= (idx + 1);
            return (
              <div
                key={idx}
                style={{
                  background: isActive ? 'linear-gradient(135deg, #ffd700, #ff8800)' : 'rgba(255, 255, 255, 0.08)',
                  color: isActive ? '#000' : '#888',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '900',
                  border: isActive ? '1px solid #fff' : '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: isActive ? '0 0 10px rgba(255, 215, 0, 0.6)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                {step}x
              </div>
            );
          })}
        </div>
      </div>

      {/* Main 5x3 Reel Stage */}
      <div style={{
        flex: 1,
        minHeight: '260px',
        background: 'linear-gradient(180deg, #10051d 0%, #0a0212 100%)',
        border: '2px solid rgba(255, 215, 0, 0.4)',
        borderRadius: '16px',
        padding: '8px',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '6px',
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 8px 30px rgba(0,0,0,0.7)',
        position: 'relative'
      }}>
        {reels.map((col, cIdx) => (
          <div key={cIdx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {col.map((symId, rIdx) => {
              const def = SYMBOL_DEFINITIONS[symId] || SYMBOL_DEFINITIONS['A'];
              const isGold = goldenGrid[cIdx] && goldenGrid[cIdx][rIdx];

              return (
                <div
                  key={rIdx}
                  style={{
                    flex: 1,
                    minHeight: '74px',
                    borderRadius: '10px',
                    background: isGold
                      ? 'linear-gradient(135deg, #ffd700 0%, #ff8f00 40%, #5e3b00 100%)'
                      : def.gradient,
                    border: isGold ? '2px solid #fff' : `1px solid ${def.border}`,
                    boxShadow: isGold
                      ? '0 0 12px rgba(255, 215, 0, 0.7), inset 0 0 8px rgba(255,255,255,0.4)'
                      : 'inset 0 1px 2px rgba(255,255,255,0.2), 0 2px 6px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    transform: spinning ? 'scale(0.96)' : 'scale(1)',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  {/* Golden Card Badge */}
                  {isGold && (
                    <div style={{
                      position: 'absolute',
                      top: '2px',
                      right: '3px',
                      fontSize: '8px',
                      background: '#000',
                      color: '#ffd700',
                      padding: '1px 3px',
                      borderRadius: '3px',
                      fontWeight: '900'
                    }}>
                      GOLD
                    </div>
                  )}

                  {/* 3D Icon Graphic */}
                  <span style={{ fontSize: '26px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}>
                    {def.icon}
                  </span>

                  {/* Symbol Label */}
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '900',
                    color: isGold ? '#000' : '#fff',
                    letterSpacing: '0.5px',
                    marginTop: '2px'
                  }}>
                    {def.title}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Big Win Pop-Up Overlay */}
        {showBigWin && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            animation: 'pulse 0.8s infinite alternate'
          }}>
            <div style={{ fontSize: '42px', marginBottom: '8px' }}>👑 💰 👑</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#ffd700', textShadow: '0 0 20px #ff8800' }}>
              MEGA WIN!
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#fff', marginTop: '6px' }}>
              Rs {bigWinAmount.toFixed(2)}
            </div>
            <button
              onClick={() => setShowBigWin(false)}
              style={{
                marginTop: '16px',
                padding: '6px 18px',
                borderRadius: '8px',
                background: '#ffd700',
                color: '#000',
                fontWeight: '900',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              COLLECT
            </button>
          </div>
        )}
      </div>

      {/* Notifications / Win Message */}
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

      {/* Control Panel: Bet Selection & Spin */}
      <div style={{
        marginTop: '10px',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        {/* Bet Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: '#aaa' }}>BET:</span>
          {[10, 20, 50, 100, 500].map(amt => (
            <button
              key={amt}
              onClick={() => { setBetAmount(amt); casinoAudio.playReelTick(); }}
              style={{
                padding: '5px 9px',
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

        {/* Spin Button */}
        <button
          onClick={triggerSpin}
          disabled={spinning}
          style={{
            flex: 1,
            minWidth: '120px',
            padding: '12px 24px',
            borderRadius: '10px',
            background: spinning
              ? '#444'
              : 'linear-gradient(135deg, #ffd700 0%, #ff8f00 50%, #e65100 100%)',
            color: spinning ? '#888' : '#000',
            fontWeight: '900',
            fontSize: '15px',
            border: 'none',
            cursor: spinning ? 'not-allowed' : 'pointer',
            boxShadow: spinning ? 'none' : '0 4px 18px rgba(255, 179, 0, 0.4)',
            letterSpacing: '0.5px'
          }}
        >
          {spinning ? 'SPINNING...' : '⚡ SPIN'}
        </button>
      </div>

    </div>
  );
}

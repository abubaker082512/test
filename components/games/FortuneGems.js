import React, { useState, useEffect } from 'react';
import { casinoAudio } from '../../utils/casinoAudio';

const GEM_SYMBOLS = {
  'GARUDA': {
    name: 'Garuda Wild',
    title: 'WILD',
    icon: '🦅',
    gradient: 'linear-gradient(135deg, #ffd700 0%, #ff8f00 50%, #d84315 100%)',
    border: '#fff',
    glow: 'rgba(255, 215, 0, 0.8)',
    payout: 25.0
  },
  'RUBY': {
    name: 'Red Ruby',
    title: 'RUBY',
    icon: '💎',
    gradient: 'linear-gradient(135deg, #ff1744 0%, #d50000 60%, #4a0000 100%)',
    border: '#ff5252',
    glow: 'rgba(255, 23, 68, 0.6)',
    payout: 15.0
  },
  'EMERALD': {
    name: 'Emerald',
    title: 'EMERALD',
    icon: '🟢',
    gradient: 'linear-gradient(135deg, #00e676 0%, #00c853 60%, #003300 100%)',
    border: '#69f0ae',
    glow: 'rgba(0, 230, 118, 0.6)',
    payout: 10.0
  },
  'SAPPHIRE': {
    name: 'Sapphire',
    title: 'SAPPHIRE',
    icon: '🔷',
    gradient: 'linear-gradient(135deg, #00b0ff 0%, #0091ea 60%, #002171 100%)',
    border: '#40c4ff',
    glow: 'rgba(0, 176, 255, 0.6)',
    payout: 8.0
  },
  'A': {
    name: 'Ace',
    title: 'A',
    icon: '👑',
    gradient: 'linear-gradient(135deg, #ffab00 0%, #ff6d00 100%)',
    border: '#ffd54f',
    glow: 'rgba(255, 171, 0, 0.4)',
    payout: 3.0
  },
  'K': {
    name: 'King',
    title: 'K',
    icon: '⚜️',
    gradient: 'linear-gradient(135deg, #ff9100 0%, #e65100 100%)',
    border: '#ffb74d',
    glow: 'rgba(255, 145, 0, 0.3)',
    payout: 2.0
  },
  'Q': {
    name: 'Queen',
    title: 'Q',
    icon: '♦',
    gradient: 'linear-gradient(135deg, #00e5ff 0%, #006064 100%)',
    border: '#80deea',
    glow: 'rgba(0, 229, 255, 0.3)',
    payout: 1.5
  },
  'J': {
    name: 'Jack',
    title: 'J',
    icon: '♣',
    gradient: 'linear-gradient(135deg, #d500f9 0%, #4a148c 100%)',
    border: '#ea80fc',
    glow: 'rgba(213, 0, 249, 0.3)',
    payout: 1.0
  }
};

const GEM_KEYS = ['GARUDA', 'RUBY', 'EMERALD', 'SAPPHIRE', 'A', 'K', 'Q', 'J'];
const WHEEL_STEPS = [1, 2, 3, 5, 8, 10, 15];

export default function FortuneGems({ user, wallet, fetchWallet, isDemoMode, demoBalance, spendDemoBalance, addDemoBalance }) {
  const [betAmount, setBetAmount] = useState(20);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState([
    ['RUBY', 'A', 'K'],
    ['GARUDA', 'RUBY', 'EMERALD'],
    ['SAPPHIRE', 'Q', 'J']
  ]);
  const [wheelMultiplier, setWheelMultiplier] = useState(1);
  const [message, setMessage] = useState(null);
  const [bigWin, setBigWin] = useState(null);

  const triggerSpin = async () => {
    if (spinning) return;
    casinoAudio.init();

    const currentBal = isDemoMode ? demoBalance : (wallet ? parseFloat(wallet.balance) : 0);
    if (currentBal < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit to continue.' });
    }

    setMessage(null);
    setBigWin(null);
    setSpinning(true);
    casinoAudio.playReelTick();

    if (isDemoMode && spendDemoBalance) {
      spendDemoBalance(betAmount);
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
            game: 'fortune-gems-2',
            action: 'spin',
            betAmount
          })
        });
        const data = await res.json();
        if (data.success && data.result) {
          serverResult = data.result;
          if (fetchWallet) fetchWallet();
        }
      }
    } catch (e) {
      console.warn('Fortune Gems server spin call failed:', e);
    }

    // Spin animation
    let ticks = 0;
    const spinInterval = setInterval(() => {
      ticks++;
      if (ticks % 2 === 0) casinoAudio.playReelTick();

      setReels(prev => {
        return prev.map(col => {
          return col.map(() => GEM_KEYS[Math.floor(Math.random() * GEM_KEYS.length)]);
        });
      });

      setWheelMultiplier(WHEEL_STEPS[Math.floor(Math.random() * WHEEL_STEPS.length)]);

      if (ticks >= 12) {
        clearInterval(spinInterval);
        finalizeSpin(serverResult);
      }
    }, 60);
  };

  const finalizeSpin = (serverResult) => {
    setSpinning(false);

    if (serverResult && serverResult.grid) {
      setReels(serverResult.grid);
      setWheelMultiplier(serverResult.wheelMultiplier || 1);

      if (serverResult.isWin && serverResult.payout > 0) {
        casinoAudio.playWinChime(2);

        if (serverResult.payout >= betAmount * 5) {
          setBigWin(serverResult.payout);
          casinoAudio.playBigWin();
        }

        setMessage({
          type: 'success',
          text: `💎 FORTUNE WIN! +Rs ${serverResult.payout.toFixed(2)} (${serverResult.wheelMultiplier}x Wheel Multiplier)`
        });
      }
    } else {
      // Demo mode fallback
      const isWin = Math.random() < 0.35;
      if (isWin) {
        const mult = WHEEL_STEPS[Math.floor(Math.random() * 4)];
        setWheelMultiplier(mult);
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
      background: 'radial-gradient(ellipse at top, #2b1704 0%, #100800 70%, #000 100%)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      padding: '8px 12px 16px',
      boxSizing: 'border-box',
      overflowY: 'auto',
      userSelect: 'none'
    }}>

      {/* Header Bar */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(255, 171, 0, 0.2) 0%, rgba(30, 15, 0, 0.9) 100%)',
        border: '1px solid rgba(255, 215, 0, 0.4)',
        borderRadius: '12px',
        padding: '8px 14px',
        marginBottom: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>💎</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '900', color: '#ffd700', letterSpacing: '0.5px' }}>
              FORTUNE GEMS 2 • JILI
            </div>
            <div style={{ fontSize: '10px', color: '#ffb74d' }}>
              4th Multiplier Wheel System • Up to 15x
            </div>
          </div>
        </div>

        {/* Wheel Indicator Badge */}
        <div style={{
          background: 'linear-gradient(135deg, #ffd700, #ff8800)',
          color: '#000',
          padding: '4px 10px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '900',
          boxShadow: '0 0 12px rgba(255, 215, 0, 0.7)'
        }}>
          WHEEL: {wheelMultiplier}x
        </div>
      </div>

      {/* Main Game Stage: 3x3 Reels + 4th Multiplier Wheel Column */}
      <div style={{
        flex: 1,
        minHeight: '260px',
        background: 'linear-gradient(180deg, #180d00 0%, #0a0500 100%)',
        border: '2px solid rgba(255, 193, 7, 0.5)',
        borderRadius: '16px',
        padding: '8px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr) 0.8fr',
        gap: '6px',
        boxShadow: 'inset 0 0 24px rgba(0,0,0,0.8), 0 8px 30px rgba(0,0,0,0.7)',
        position: 'relative'
      }}>
        {/* 3x3 Reels */}
        {reels.map((col, cIdx) => (
          <div key={cIdx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {col.map((symId, rIdx) => {
              const sym = GEM_SYMBOLS[symId] || GEM_SYMBOLS['RUBY'];
              return (
                <div
                  key={rIdx}
                  style={{
                    flex: 1,
                    minHeight: '74px',
                    borderRadius: '10px',
                    background: sym.gradient,
                    border: `1.5px solid ${sym.border}`,
                    boxShadow: `0 0 12px ${sym.glow}, inset 0 1px 3px rgba(255,255,255,0.4)`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: spinning ? 'scale(0.96)' : 'scale(1)',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '28px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.7))' }}>
                    {sym.icon}
                  </span>
                  <div style={{ fontSize: '10px', fontWeight: '900', color: '#fff', marginTop: '2px', letterSpacing: '0.5px' }}>
                    {sym.title}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* 4th Reel: Golden Multiplier Wheel */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.15) 0%, rgba(0, 0, 0, 0.6) 100%)',
          borderRadius: '10px',
          border: '1.5px solid #ffd700',
          padding: '4px',
          justifyContent: 'space-around',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '9px', fontWeight: '900', color: '#ffd700' }}>MULTIPLIER</div>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ffd700 0%, #ff6f00 100%)',
            color: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: '900',
            boxShadow: '0 0 16px rgba(255, 215, 0, 0.8), inset 0 0 4px #fff',
            animation: spinning ? 'spin 0.4s linear infinite' : 'none'
          }}>
            {wheelMultiplier}x
          </div>
          <div style={{ fontSize: '8px', color: '#aaa', textAlign: 'center' }}>4TH REEL</div>
        </div>

        {/* Big Win Pop-Up */}
        {bigWin && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}>
            <div style={{ fontSize: '40px' }}>💎 💰 💎</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#ffd700' }}>SUPER WIN!</div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#fff', marginTop: '6px' }}>
              Rs {bigWin.toFixed(2)}
            </div>
            <button
              onClick={() => setBigWin(null)}
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

      {/* Bottom Controls */}
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
        {/* Bet Selection */}
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
          {spinning ? 'SPINNING...' : '💎 SPIN'}
        </button>
      </div>

    </div>
  );
}

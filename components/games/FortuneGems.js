import React, { useState, useEffect, useRef, useCallback } from 'react'
import { casinoAudio } from '../../utils/casinoAudio'

// Authentic JILI Fortune Gems Symbols
const GEM_SYMBOLS = {
  'GARUDA': {
    name: 'Garuda Wild',
    title: 'WILD',
    icon: '🦅',
    gradient: 'linear-gradient(135deg, #ffd700 0%, #ff8f00 50%, #d84315 100%)',
    border: '#fef08a',
    glow: 'rgba(255, 215, 0, 0.85)',
    payout: 25.0,
    isWild: true
  },
  'RUBY': {
    name: 'Red Ruby',
    title: 'RUBY',
    icon: '💎',
    gradient: 'linear-gradient(135deg, #ff1744 0%, #d50000 60%, #4a0000 100%)',
    border: '#ff5252',
    glow: 'rgba(255, 23, 68, 0.7)',
    payout: 15.0
  },
  'EMERALD': {
    name: 'Green Emerald',
    title: 'EMERALD',
    icon: '🟢',
    gradient: 'linear-gradient(135deg, #00e676 0%, #00c853 60%, #003300 100%)',
    border: '#69f0ae',
    glow: 'rgba(0, 230, 118, 0.7)',
    payout: 10.0
  },
  'SAPPHIRE': {
    name: 'Blue Sapphire',
    title: 'SAPPHIRE',
    icon: '🔷',
    gradient: 'linear-gradient(135deg, #00b0ff 0%, #0091ea 60%, #002171 100%)',
    border: '#40c4ff',
    glow: 'rgba(0, 176, 255, 0.7)',
    payout: 8.0
  },
  'A': {
    name: 'Ace',
    title: 'A',
    icon: '👑',
    gradient: 'linear-gradient(135deg, #ffab00 0%, #ff6d00 100%)',
    border: '#ffd54f',
    glow: 'rgba(255, 171, 0, 0.45)',
    payout: 3.0
  },
  'K': {
    name: 'King',
    title: 'K',
    icon: '⚜️',
    gradient: 'linear-gradient(135deg, #ff9100 0%, #e65100 100%)',
    border: '#ffb74d',
    glow: 'rgba(255, 145, 0, 0.4)',
    payout: 2.0
  },
  'Q': {
    name: 'Queen',
    title: 'Q',
    icon: '♦',
    gradient: 'linear-gradient(135deg, #00e5ff 0%, #006064 100%)',
    border: '#80deea',
    glow: 'rgba(0, 229, 255, 0.4)',
    payout: 1.5
  },
  'J': {
    name: 'Jack',
    title: 'J',
    icon: '♣',
    gradient: 'linear-gradient(135deg, #d500f9 0%, #4a148c 100%)',
    border: '#ea80fc',
    glow: 'rgba(213, 0, 249, 0.4)',
    payout: 1.0
  }
}

const SYMBOL_KEYS = ['GARUDA', 'RUBY', 'EMERALD', 'SAPPHIRE', 'A', 'K', 'Q', 'J']
const MULTIPLIER_ITEMS = [1, 2, 3, 5, 8, 10, 15, 500]
const BET_OPTIONS = [10, 20, 50, 100, 200, 500]

// 5 Paylines across 3x3 grid: [row0, row1, row2]
const PAYLINES = [
  { name: 'Center Line', coords: [[0, 1], [1, 1], [2, 1]] },
  { name: 'Top Line', coords: [[0, 0], [1, 0], [2, 0]] },
  { name: 'Bottom Line', coords: [[0, 2], [1, 2], [2, 2]] },
  { name: 'Diagonal ↘', coords: [[0, 0], [1, 1], [2, 2]] },
  { name: 'Diagonal ↗', coords: [[0, 2], [1, 1], [2, 0]] }
]

export default function FortuneGems({
  user,
  wallet,
  fetchWallet,
  isDemoMode,
  demoBalance,
  spendDemoBalance,
  addDemoBalance
}) {
  const [betAmount, setBetAmount] = useState(20)
  const [spinning, setSpinning] = useState(false)
  const [reels, setReels] = useState([
    ['RUBY', 'GARUDA', 'EMERALD'],
    ['GARUDA', 'GARUDA', 'GARUDA'],
    ['SAPPHIRE', 'RUBY', 'A']
  ])
  const [multiplierWheel, setMultiplierWheel] = useState([2, 5, 1]) // 3 visible slots on 4th reel, center is active
  const [winningLines, setWinningLines] = useState([])
  const [roundWin, setRoundWin] = useState(0)
  const [bigWinOverlay, setBigWinOverlay] = useState(null)
  const [turboMode, setTurboMode] = useState(false)
  const [autoSpin, setAutoSpin] = useState(false)
  const [statusMessage, setStatusMessage] = useState('TAP SPIN TO SEEK THE 500x GARUDA')

  const autoSpinRef = useRef(autoSpin)
  autoSpinRef.current = autoSpin
  const spinningRef = useRef(spinning)
  spinningRef.current = spinning

  const playSound = useCallback((type) => {
    try {
      if (typeof window === 'undefined') return
      const ctx = casinoAudio.ctx || (window.AudioContext && new (window.AudioContext || window.webkitAudioContext)())
      if (!ctx) return
      if (ctx.state === 'suspended') ctx.resume()

      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      if (type === 'spin') {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(300, now)
        osc.frequency.linearRampToValueAtTime(150, now + 0.12)
        gain.gain.setValueAtTime(0.08, now)
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12)
        osc.start(now)
        osc.stop(now + 0.12)
      } else if (type === 'wheel-lock') {
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(440, now)
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.18)
        gain.gain.setValueAtTime(0.18, now)
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2)
        osc.start(now)
        osc.stop(now + 0.2)
      } else if (type === 'win') {
        const chord = [440, 554.37, 659.25, 880]
        chord.forEach((f, i) => {
          const o = ctx.createOscillator()
          const g = ctx.createGain()
          o.connect(g)
          g.connect(ctx.destination)
          o.type = 'sine'
          o.frequency.setValueAtTime(f, now + i * 0.06)
          g.gain.setValueAtTime(0.12, now + i * 0.06)
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.3)
          o.start(now + i * 0.06)
          o.stop(now + i * 0.06 + 0.3)
        })
      } else if (type === 'bigwin') {
        casinoAudio.playBigWin()
      }
    } catch (e) {}
  }, [])

  // Evaluate the 5 paylines against the 3x3 grid
  const evaluateLines = (grid, activeMult) => {
    const hits = []
    let totalPayout = 0

    PAYLINES.forEach(line => {
      const sym0 = grid[line.coords[0][0]][line.coords[0][1]]
      const sym1 = grid[line.coords[1][0]][line.coords[1][1]]
      const sym2 = grid[line.coords[2][0]][line.coords[2][1]]

      // Check wild substitution
      const isWild = (s) => s === 'GARUDA'
      let matchTarget = null

      if (!isWild(sym0)) matchTarget = sym0
      else if (!isWild(sym1)) matchTarget = sym1
      else if (!isWild(sym2)) matchTarget = sym2
      else matchTarget = 'GARUDA'

      const match0 = sym0 === matchTarget || isWild(sym0)
      const match1 = sym1 === matchTarget || isWild(sym1)
      const match2 = sym2 === matchTarget || isWild(sym2)

      if (match0 && match1 && match2) {
        const baseMul = GEM_SYMBOLS[matchTarget]?.payout || 1.0
        const lineWin = (betAmount / 5) * baseMul * activeMult
        hits.push({
          lineName: line.name,
          coords: line.coords,
          symbol: matchTarget,
          lineWin
        })
        totalPayout += lineWin
      }
    })

    return { hits, totalPayout }
  }

  const handleSpin = async () => {
    if (spinningRef.current) return

    const currentBal = isDemoMode ? demoBalance : (wallet ? parseFloat(wallet.balance) : 0)
    if (currentBal < betAmount) {
      setStatusMessage('⚠️ Insufficient Balance! Please Top-Up.')
      setAutoSpin(false)
      return
    }

    setSpinning(true)
    setWinningLines([])
    setRoundWin(0)
    setBigWinOverlay(null)
    setStatusMessage('SPINNING FORTUNE GEMS & 4TH WHEEL...')
    playSound('spin')

    // Debit Bet
    if (isDemoMode) {
      spendDemoBalance(betAmount)
    } else {
      try {
        await fetch('/api/wallet/bet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user?.id || user?.uid || 'guest_player',
            email: user?.email || '',
            amount: betAmount,
            game: 'JILI Fortune Gems 500x'
          })
        })
        if (fetchWallet) fetchWallet()
        window.dispatchEvent(new Event('wallet-updated'))
      } catch (e) {}
    }

    // Spin animation ticks
    const spinTicks = turboMode ? 5 : 9
    let ticks = 0
    const timer = setInterval(() => {
      ticks++
      setReels(prev => prev.map(col => col.map(() => SYMBOL_KEYS[Math.floor(Math.random() * SYMBOL_KEYS.length)])))
      setMultiplierWheel([
        MULTIPLIER_ITEMS[Math.floor(Math.random() * MULTIPLIER_ITEMS.length)],
        MULTIPLIER_ITEMS[Math.floor(Math.random() * MULTIPLIER_ITEMS.length)],
        MULTIPLIER_ITEMS[Math.floor(Math.random() * MULTIPLIER_ITEMS.length)]
      ])

      if (ticks >= spinTicks) {
        clearInterval(timer)
        finalizeSpin()
      }
    }, 50)
  }

  const finalizeSpin = () => {
    // Generate fresh final 3x3 grid
    const finalGrid = []
    for (let c = 0; c < 3; c++) {
      const col = []
      for (let r = 0; r < 3; r++) {
        // High roller weighting
        const rand = Math.random()
        let sym = 'J'
        if (rand < 0.12) sym = 'GARUDA'
        else if (rand < 0.22) sym = 'RUBY'
        else if (rand < 0.34) sym = 'EMERALD'
        else if (rand < 0.46) sym = 'SAPPHIRE'
        else if (rand < 0.60) sym = 'A'
        else if (rand < 0.74) sym = 'K'
        else if (rand < 0.88) sym = 'Q'
        else sym = 'J'
        col.push(sym)
      }
      finalGrid.push(col)
    }

    // 4th Reel Multiplier: Center slot is active!
    // Weighted selection for realistic RTP
    const multRoll = Math.random()
    let centerMult = 1
    if (multRoll < 0.45) centerMult = 1
    else if (multRoll < 0.70) centerMult = 2
    else if (multRoll < 0.85) centerMult = 3
    else if (multRoll < 0.94) centerMult = 5
    else if (multRoll < 0.98) centerMult = 10
    else if (multRoll < 0.995) centerMult = 15
    else centerMult = 500 // Jackpot!

    const topMult = MULTIPLIER_ITEMS[Math.floor(Math.random() * MULTIPLIER_ITEMS.length)]
    const botMult = MULTIPLIER_ITEMS[Math.floor(Math.random() * MULTIPLIER_ITEMS.length)]
    const finalWheel = [topMult, centerMult, botMult]

    setReels(finalGrid)
    setMultiplierWheel(finalWheel)
    playSound('wheel-lock')

    // Evaluate
    const evalResult = evaluateLines(finalGrid, centerMult)
    setSpinning(false)

    if (evalResult.hits.length > 0 && evalResult.totalPayout > 0) {
      setWinningLines(evalResult.hits)
      setRoundWin(evalResult.totalPayout)
      playSound('win')
      setStatusMessage(`💎 FORTUNE WIN! +Rs ${evalResult.totalPayout.toFixed(2)} (${centerMult}x Multiplier Reel)`)

      // Payout
      if (isDemoMode) {
        addDemoBalance(evalResult.totalPayout)
      } else {
        fetch('/api/wallet/payout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user?.id || user?.uid || 'guest_player',
            email: user?.email || '',
            bet_amount: betAmount,
            win_amount: evalResult.totalPayout,
            multiplier: Number((evalResult.totalPayout / betAmount).toFixed(2)),
            game: 'JILI Fortune Gems 500x'
          })
        }).then(() => {
          if (fetchWallet) fetchWallet()
          window.dispatchEvent(new Event('wallet-updated'))
        }).catch(() => {})
      }

      if (evalResult.totalPayout >= betAmount * 5) {
        setBigWinOverlay(evalResult.totalPayout)
        playSound('bigwin')
      }
    } else {
      setStatusMessage('NO WIN • SPIN AGAIN TO ALIGN THE GEMS')
    }

    // Auto spin continuation
    if (autoSpinRef.current) {
      setTimeout(() => {
        handleSpin()
      }, turboMode ? 450 : 800)
    }
  }

  const activeCenterMultiplier = multiplierWheel[1]

  return (
    <div style={{
      width: '100%',
      maxWidth: '480px',
      margin: '0 auto',
      background: 'radial-gradient(ellipse at 50% 0%, #2b1502 0%, #100600 70%, #030100 100%)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      padding: '8px 10px 18px',
      boxSizing: 'border-box',
      userSelect: 'none',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>

      {/* Top Brand & Garuda Multiplier Header */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.22) 0%, rgba(20, 8, 2, 0.95) 100%)',
        border: '1.5px solid rgba(245, 158, 11, 0.5)',
        borderRadius: '12px',
        padding: '8px 12px',
        marginBottom: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.7)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            boxShadow: '0 0 12px rgba(251, 191, 36, 0.5)'
          }}>
            🦅
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#fbbf24', letterSpacing: '0.04em' }}>
              FORTUNE GEMS • JILI
            </div>
            <div style={{ fontSize: '10px', color: '#fed7aa', fontWeight: 600 }}>
              4th Multiplier Wheel System • Up to 500x
            </div>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
          color: '#000',
          padding: '4px 10px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 900,
          boxShadow: '0 0 12px rgba(251, 191, 36, 0.7)',
          letterSpacing: '0.04em'
        }}>
          {activeCenterMultiplier}x MULT
        </div>
      </div>

      {/* Main 3x3 Reels + 4th Multiplier Wheel Column */}
      <div style={{
        background: 'linear-gradient(180deg, #180902 0%, #0c0401 100%)',
        border: '2px solid rgba(245, 158, 11, 0.55)',
        borderRadius: '16px',
        padding: '8px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr) 0.85fr',
        gap: '6px',
        boxShadow: 'inset 0 0 24px rgba(0,0,0,0.85), 0 8px 32px rgba(0,0,0,0.7)',
        position: 'relative',
        minHeight: '270px'
      }}>
        {/* 3 Base Reels */}
        {reels.map((col, cIdx) => (
          <div key={cIdx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {col.map((symKey, rIdx) => {
              const def = GEM_SYMBOLS[symKey] || GEM_SYMBOLS['RUBY']
              const isHitCell = winningLines.some(hit =>
                hit.coords.some(([c, r]) => c === cIdx && r === rIdx)
              )

              return (
                <div
                  key={rIdx}
                  style={{
                    flex: 1,
                    minHeight: '82px',
                    borderRadius: '10px',
                    background: def.gradient,
                    border: isHitCell ? '2.5px solid #fff' : `1.5px solid ${def.border}`,
                    boxShadow: isHitCell
                      ? '0 0 18px #fff, inset 0 0 10px #fbbf24'
                      : `0 0 10px ${def.glow}, inset 0 1px 3px rgba(255,255,255,0.4)`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: isHitCell ? 'scale(1.06)' : spinning ? 'scale(0.97)' : 'scale(1)',
                    transition: 'transform 0.15s ease, box-shadow 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <span style={{ fontSize: '30px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}>
                    {def.icon}
                  </span>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 900,
                    color: '#fff',
                    marginTop: '2px',
                    letterSpacing: '0.04em',
                    textShadow: '0 1px 3px rgba(0,0,0,0.9)'
                  }}>
                    {def.title}
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        {/* 4th Column: The Legendary Multiplier Wheel Reel */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.14) 0%, rgba(0, 0, 0, 0.7) 100%)',
          borderRadius: '10px',
          border: '2px solid #fbbf24',
          padding: '4px 3px',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'inset 0 0 12px rgba(245, 158, 11, 0.3)',
          position: 'relative'
        }}>
          {/* Top Multiplier Position */}
          <div style={{
            fontSize: '12px',
            fontWeight: 800,
            color: '#94a3b8',
            opacity: 0.6
          }}>
            {multiplierWheel[0]}x
          </div>

          {/* ACTIVE Center Multiplier Position with Golden Frame */}
          <div style={{
            width: '100%',
            height: '72px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
            border: '2px solid #fff',
            boxShadow: '0 0 16px rgba(251, 191, 36, 0.8), inset 0 0 6px #fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            transform: spinning ? 'scale(0.95)' : 'scale(1)',
            transition: 'transform 0.15s ease'
          }}>
            <div style={{ fontSize: '8px', fontWeight: 900, letterSpacing: '0.04em' }}>ACTIVE</div>
            <div style={{ fontSize: '20px', fontWeight: 900, lineHeight: 1 }}>
              {activeCenterMultiplier}x
            </div>
            <div style={{ fontSize: '7.5px', fontWeight: 800 }}>WHEEL</div>
          </div>

          {/* Bottom Multiplier Position */}
          <div style={{
            fontSize: '12px',
            fontWeight: 800,
            color: '#94a3b8',
            opacity: 0.6
          }}>
            {multiplierWheel[2]}x
          </div>
        </div>

        {/* Big Win Pop-Up Overlay */}
        {bigWinOverlay && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(10, 4, 1, 0.92)',
            borderRadius: '14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 40,
            animation: 'fadeIn 0.25s ease'
          }}>
            <div style={{ fontSize: '42px', marginBottom: '6px' }}>🦅 💎 💰</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#fbbf24', letterSpacing: '0.06em' }}>
              GARUDA MEGA FORTUNE!
            </div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#f8fafc', marginTop: '6px', fontFamily: 'monospace' }}>
              Rs {bigWinOverlay.toFixed(2)}
            </div>
            <button
              type="button"
              onClick={() => setBigWinOverlay(null)}
              style={{
                marginTop: '16px',
                background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                color: '#000',
                border: 'none',
                padding: '8px 24px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              CLAIM REWARD
            </button>
          </div>
        )}
      </div>

      {/* Real-Time Live Status Bar */}
      <div style={{
        marginTop: '8px',
        padding: '7px 12px',
        borderRadius: '8px',
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '11px',
        fontWeight: 800,
        color: roundWin > 0 ? '#34d399' : '#e2e8f0',
        textAlign: 'center',
        letterSpacing: '0.03em'
      }}>
        {statusMessage}
      </div>

      {/* Bet Amount Selector Chips */}
      <div style={{
        marginTop: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '6px'
      }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8' }}>
          BET CHIP:
        </div>
        <div style={{ display: 'flex', gap: '5px', overflowX: 'auto' }}>
          {BET_OPTIONS.map(amt => (
            <button
              key={amt}
              type="button"
              disabled={spinning}
              onClick={() => setBetAmount(amt)}
              style={{
                background: betAmount === amt
                  ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)'
                  : 'rgba(255, 255, 255, 0.06)',
                color: betAmount === amt ? '#000' : '#e2e8f0',
                border: betAmount === amt ? '1px solid #fef08a' : '1px solid rgba(255, 255, 255, 0.1)',
                padding: '4px 8px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 900,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Rs {amt}
            </button>
          ))}
        </div>
      </div>

      {/* Controls & Spin Action */}
      <div style={{
        marginTop: '12px',
        display: 'grid',
        gridTemplateColumns: 'auto auto 1fr',
        gap: '8px',
        alignItems: 'center'
      }}>
        {/* Turbo Mode Toggle */}
        <button
          type="button"
          onClick={() => setTurboMode(!turboMode)}
          style={{
            background: turboMode ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.06)',
            border: turboMode ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.12)',
            color: turboMode ? '#ef4444' : '#94a3b8',
            padding: '12px 10px',
            borderRadius: '10px',
            fontSize: '11px',
            fontWeight: 900,
            cursor: 'pointer'
          }}
        >
          ⚡ {turboMode ? 'TURBO ON' : 'TURBO'}
        </button>

        {/* Auto Spin Toggle */}
        <button
          type="button"
          onClick={() => {
            if (autoSpin) {
              setAutoSpin(false)
            } else {
              setAutoSpin(true)
              if (!spinning) handleSpin()
            }
          }}
          style={{
            background: autoSpin ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.06)',
            border: autoSpin ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
            color: autoSpin ? '#38bdf8' : '#94a3b8',
            padding: '12px 10px',
            borderRadius: '10px',
            fontSize: '11px',
            fontWeight: 900,
            cursor: 'pointer'
          }}
        >
          🔁 {autoSpin ? 'STOP' : 'AUTO'}
        </button>

        {/* Main Spin CTA Button */}
        <button
          type="button"
          disabled={spinning}
          onClick={handleSpin}
          style={{
            height: '46px',
            background: spinning
              ? 'rgba(100, 116, 139, 0.3)'
              : 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
            border: spinning ? '1px solid #475569' : '1px solid #fef08a',
            color: spinning ? '#64748b' : '#000',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 900,
            letterSpacing: '0.06em',
            cursor: spinning ? 'not-allowed' : 'pointer',
            boxShadow: spinning ? 'none' : '0 4px 18px rgba(245, 158, 11, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>💎</span>
          <span>SPIN • Rs {betAmount}</span>
        </button>
      </div>
    </div>
  )
}

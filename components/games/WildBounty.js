import React, { useState, useEffect, useRef, useCallback } from 'react'
import { casinoAudio } from '../../utils/casinoAudio'

// Authentic PG Soft Wild Bounty Showdown Symbols & Rows
// Stepped 6-reel row heights: Reel 0=3, Reel 1=4, Reel 2=5, Reel 3=5, Reel 4=4, Reel 5=3
const REEL_HEIGHTS = [3, 4, 5, 5, 4, 3]

const WESTERN_SYMBOLS = {
  'BANDIT': {
    name: 'Female Bandit',
    icon: '🤠',
    color: '#ffb74d',
    border: '#ffb74d',
    payout: 6.0,
    isHigh: true
  },
  'GUN': {
    name: 'Gold Revolver',
    icon: '🔫',
    color: '#fbbf24',
    border: '#fbbf24',
    payout: 5.0,
    isHigh: true
  },
  'HAT': {
    name: 'Cowboy Hat',
    icon: '👒',
    color: '#f97316',
    border: '#f97316',
    payout: 4.0
  },
  'WHISKEY': {
    name: 'Whiskey Bottle',
    icon: '🥃',
    color: '#f59e0b',
    border: '#f59e0b',
    payout: 3.0
  },
  'STAR': {
    name: 'Sheriff Star',
    icon: '⭐',
    color: '#eab308',
    border: '#eab308',
    payout: 2.0
  },
  'BOOTS': {
    name: 'Cowboy Boots',
    icon: '👢',
    color: '#a855f7',
    border: '#a855f7',
    payout: 1.5
  },
  'WILD': {
    name: 'Wanted Wild',
    icon: '🔥',
    color: '#ef4444',
    border: '#ef4444',
    payout: 10.0,
    isWild: true
  },
  'SCATTER': {
    name: 'Gold Bar Scatter',
    icon: '💰',
    color: '#ffd700',
    border: '#fef08a',
    payout: 20.0,
    isScatter: true
  }
}

const REGULAR_KEYS = ['BANDIT', 'GUN', 'HAT', 'WHISKEY', 'STAR', 'BOOTS']
const MULTIPLIER_LADDER = [1, 2, 4, 8, 16, 32, 64, 1024]
const BET_OPTIONS = [10, 20, 50, 100, 200, 500]

export default function WildBounty({
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
  const [multiplierIdx, setMultiplierIdx] = useState(0) // 0=1x, 1=2x, 2=4x, 3=8x...
  const [reels, setReels] = useState([
    ['GUN', 'BANDIT', 'HAT'],
    ['WHISKEY', 'STAR', 'GUN', 'BANDIT'],
    ['BANDIT', 'GUN', 'HAT', 'WHISKEY', 'STAR'],
    ['STAR', 'BANDIT', 'GUN', 'WHISKEY', 'HAT'],
    ['HAT', 'GUN', 'STAR', 'WHISKEY'],
    ['BANDIT', 'HAT', 'STAR']
  ])
  const [goldPlatedGrid, setGoldPlatedGrid] = useState([
    [false, false, false],
    [false, true, false, false],
    [false, false, true, false, false],
    [false, true, false, false, false],
    [false, false, true, false],
    [false, false, false]
  ])
  const [winningCells, setWinningCells] = useState([])
  const [isFreeSpins, setIsFreeSpins] = useState(false)
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0)
  const [totalRoundWin, setTotalRoundWin] = useState(0)
  const [bigWinOverlay, setBigWinOverlay] = useState(null)
  const [turboMode, setTurboMode] = useState(false)
  const [autoSpin, setAutoSpin] = useState(false)
  const [statusMessage, setStatusMessage] = useState('TAP SPIN FOR WESTERN SHOWDOWN')

  const autoSpinRef = useRef(autoSpin)
  autoSpinRef.current = autoSpin
  const spinningRef = useRef(spinning)
  spinningRef.current = spinning

  const activeMultiplier = MULTIPLIER_LADDER[Math.min(multiplierIdx, MULTIPLIER_LADDER.length - 1)]

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

      if (type === 'gunshot') {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(400, now)
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15)
        gain.gain.setValueAtTime(0.25, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
        osc.start(now)
        osc.stop(now + 0.15)
      } else if (type === 'spin') {
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(260, now)
        osc.frequency.linearRampToValueAtTime(130, now + 0.1)
        gain.gain.setValueAtTime(0.08, now)
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1)
        osc.start(now)
        osc.stop(now + 0.1)
      } else if (type === 'win') {
        const chord = [349.23, 440.00, 523.25, 698.46]
        chord.forEach((f, i) => {
          const o = ctx.createOscillator()
          const g = ctx.createGain()
          o.connect(g)
          g.connect(ctx.destination)
          o.type = 'triangle'
          o.frequency.setValueAtTime(f, now + i * 0.06)
          g.gain.setValueAtTime(0.12, now + i * 0.06)
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25)
          o.start(now + i * 0.06)
          o.stop(now + i * 0.06 + 0.25)
        })
      } else if (type === 'bigwin') {
        casinoAudio.playBigWin()
      }
    } catch (e) {}
  }, [])

  const getRandomSymbol = useCallback((colIdx) => {
    if (Math.random() < 0.03) return { key: 'SCATTER', isGold: false }
    if (Math.random() < 0.025) return { key: 'WILD', isGold: false }

    const randKey = REGULAR_KEYS[Math.floor(Math.random() * REGULAR_KEYS.length)]
    // Golden frames appear on middle reels 1, 2, 3, 4
    const isGold = (colIdx >= 1 && colIdx <= 4) && (Math.random() < 0.22)
    return { key: randKey, isGold }
  }, [])

  // Evaluate adjacent left-to-right matches across the 6 stepped reels
  const evaluateGrid = useCallback((grid) => {
    const hits = []
    let totalPayout = 0
    const matchedCoords = []

    for (const symKey of REGULAR_KEYS) {
      let consecutiveCols = 0
      const waysPerCol = []
      const symCoords = []

      for (let c = 0; c < 6; c++) {
        let countInCol = 0
        const h = REEL_HEIGHTS[c]
        for (let r = 0; r < h; r++) {
          const cell = grid[c][r]
          if (cell === symKey || cell === 'WILD') {
            countInCol++
            symCoords.push({ c, r })
          }
        }
        if (countInCol > 0) {
          consecutiveCols++
          waysPerCol.push(countInCol)
        } else {
          break
        }
      }

      if (consecutiveCols >= 3) {
        const baseMul = WESTERN_SYMBOLS[symKey]?.payout || 0.5
        const totalWays = waysPerCol.reduce((a, b) => a * b, 1)
        const payout = baseMul * totalWays

        hits.push({
          symKey,
          cols: consecutiveCols,
          ways: totalWays,
          payout
        })
        totalPayout += payout
        matchedCoords.push(...symCoords)
      }
    }

    let scatterCount = 0
    for (let c = 0; c < 6; c++) {
      const h = REEL_HEIGHTS[c]
      for (let r = 0; r < h; r++) {
        if (grid[c][r] === 'SCATTER') scatterCount++
      }
    }

    return { hits, totalPayout, matchedCoords, scatterCount }
  }, [])

  const handleSpin = async () => {
    if (spinningRef.current) return

    const currentBal = isDemoMode ? demoBalance : (wallet ? parseFloat(wallet.balance) : 0)
    const isFree = freeSpinsLeft > 0

    if (!isFree && currentBal < betAmount) {
      setStatusMessage('⚠️ Insufficient Balance! Please Top-Up.')
      setAutoSpin(false)
      return
    }

    setSpinning(true)
    setMultiplierIdx(0)
    setWinningCells([])
    setTotalRoundWin(0)
    setBigWinOverlay(null)
    setStatusMessage('OUTLAW SHOWDOWN SPINNING...')
    playSound('spin')

    if (!isFree) {
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
              game: 'PG Soft Wild Bounty'
            })
          })
          if (fetchWallet) fetchWallet()
          window.dispatchEvent(new Event('wallet-updated'))
        } catch (e) {}
      }
    } else {
      setFreeSpinsLeft(prev => prev - 1)
    }

    // Spin animation ticks
    const spinTicks = turboMode ? 4 : 8
    let ticks = 0
    const timer = setInterval(() => {
      ticks++
      setReels(prev => prev.map((col, cIdx) => {
        const h = REEL_HEIGHTS[cIdx]
        const newCol = []
        for (let r = 0; r < h; r++) {
          newCol.push(getRandomSymbol(cIdx).key)
        }
        return newCol
      }))

      if (ticks >= spinTicks) {
        clearInterval(timer)
        finalizeBaseGrid()
      }
    }, 50)
  }

  const finalizeBaseGrid = () => {
    const newGrid = []
    const newGold = []

    for (let c = 0; c < 6; c++) {
      const h = REEL_HEIGHTS[c]
      const col = []
      const goldCol = []
      for (let r = 0; r < h; r++) {
        const item = getRandomSymbol(c)
        col.push(item.key)
        goldCol.push(item.isGold)
      }
      newGrid.push(col)
      newGold.push(goldCol)
    }

    setReels(newGrid)
    setGoldPlatedGrid(newGold)
    playSound('gunshot')

    processCascade(newGrid, newGold, 0, 0)
  }

  const processCascade = (currentGrid, currentGold, step, accumulatedWin) => {
    const evalResult = evaluateGrid(currentGrid)

    if (step === 0 && evalResult.scatterCount >= 3) {
      setIsFreeSpins(true)
      const awarded = 10
      setFreeSpinsLeft(prev => prev + awarded)
      playSound('bigwin')
      setStatusMessage(`💰 WANTED FREE SPINS! +${awarded} FREE ROUNDS!`)
    }

    if (evalResult.hits.length > 0) {
      // In Wild Bounty, multiplier DOUBLES on each cascade (1x -> 2x -> 4x -> 8x -> 16x... up to 1024x!)
      const levelMult = MULTIPLIER_LADDER[Math.min(step, MULTIPLIER_LADDER.length - 1)]
      const stepWin = evalResult.totalPayout * (betAmount / 20) * levelMult
      const nextAccumulated = accumulatedWin + stepWin

      setMultiplierIdx(step)
      setTotalRoundWin(nextAccumulated)
      setWinningCells(evalResult.matchedCoords)
      playSound('win')
      setStatusMessage(`💥 BOUNTY WIN ${levelMult}x! +Rs ${stepWin.toFixed(2)}`)

      // Golden frames turn to Wilds & cascade drop
      setTimeout(() => {
        const nextGrid = currentGrid.map(col => [...col])
        const nextGold = currentGold.map(col => [...col])

        evalResult.matchedCoords.forEach(({ c, r }) => {
          if (nextGold[c][r]) {
            nextGrid[c][r] = 'WILD'
            nextGold[c][r] = false
          } else {
            nextGrid[c][r] = null
          }
        })

        // Drop surviving down
        for (let c = 0; c < 6; c++) {
          const h = REEL_HEIGHTS[c]
          const surviving = []
          const survivingGold = []

          for (let r = h - 1; r >= 0; r--) {
            if (nextGrid[c][r] !== null) {
              surviving.unshift(nextGrid[c][r])
              survivingGold.unshift(nextGold[c][r])
            }
          }

          while (surviving.length < h) {
            const fresh = getRandomSymbol(c)
            surviving.unshift(fresh.key)
            survivingGold.unshift(fresh.isGold)
          }

          nextGrid[c] = surviving
          nextGold[c] = survivingGold
        }

        setReels(nextGrid)
        setGoldPlatedGrid(nextGold)
        setWinningCells([])
        playSound('gunshot')

        setTimeout(() => {
          processCascade(nextGrid, nextGold, step + 1, nextAccumulated)
        }, turboMode ? 260 : 420)

      }, turboMode ? 350 : 550)

    } else {
      setSpinning(false)
      setWinningCells([])

      if (accumulatedWin > 0) {
        if (isDemoMode) {
          addDemoBalance(accumulatedWin)
        } else {
          fetch('/api/wallet/payout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user?.id || user?.uid || 'guest_player',
              email: user?.email || '',
              bet_amount: betAmount,
              win_amount: accumulatedWin,
              multiplier: Number((accumulatedWin / betAmount).toFixed(2)),
              game: 'PG Soft Wild Bounty'
            })
          }).then(() => {
            if (fetchWallet) fetchWallet()
            window.dispatchEvent(new Event('wallet-updated'))
          }).catch(() => {})
        }

        if (accumulatedWin >= betAmount * 5) {
          setBigWinOverlay(accumulatedWin)
          playSound('bigwin')
        }
        setStatusMessage(`🎉 TOTAL BOUNTY: Rs ${accumulatedWin.toFixed(2)}!`)
      } else {
        setStatusMessage(freeSpinsLeft > 0 ? `FREE SPIN REMAINING: ${freeSpinsLeft}` : 'GOOD LUCK! SPIN AGAIN')
      }

      if (freeSpinsLeft > 0 || autoSpinRef.current) {
        setTimeout(() => {
          handleSpin()
        }, turboMode ? 400 : 700)
      }
    }
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '480px',
      margin: '0 auto',
      background: 'radial-gradient(ellipse at 50% 0%, #2b1103 0%, #120600 70%, #000 100%)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      padding: '8px 10px 18px',
      boxSizing: 'border-box',
      userSelect: 'none',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>

      {/* Top Doubling Multiplier Bar (1x -> 1024x) */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.22) 0%, rgba(25, 10, 0, 0.95) 100%)',
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
            background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            boxShadow: '0 0 12px rgba(245, 158, 11, 0.5)'
          }}>
            🤠
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#fcd34d', letterSpacing: '0.04em' }}>
              WILD BOUNTY • PG SOFT
            </div>
            <div style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 600 }}>
              {isFreeSpins ? `🔥 FREE SPINS (${freeSpinsLeft} LEFT)` : 'Doubling Multipliers Up to 1024x'}
            </div>
          </div>
        </div>

        {/* Active Multiplier Pill */}
        <div style={{
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
          color: '#000',
          padding: '4px 10px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 900,
          boxShadow: '0 0 12px rgba(251, 191, 36, 0.7)'
        }}>
          {activeMultiplier}x MULT
        </div>
      </div>

      {/* Stepped 6-Reel Western Grid (3-4-5-5-4-3) */}
      <div style={{
        background: 'linear-gradient(180deg, #180901 0%, #0b0400 100%)',
        border: '2px solid rgba(245, 158, 11, 0.5)',
        borderRadius: '16px',
        padding: '8px 4px',
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '4px',
        boxShadow: 'inset 0 0 24px rgba(0,0,0,0.85), 0 8px 32px rgba(0,0,0,0.7)',
        position: 'relative',
        minHeight: '290px',
        alignItems: 'center'
      }}>
        {reels.map((col, cIdx) => (
          <div key={cIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
            {col.map((symKey, rIdx) => {
              const def = WESTERN_SYMBOLS[symKey] || WESTERN_SYMBOLS['BANDIT']
              const isGold = goldPlatedGrid[cIdx] && goldPlatedGrid[cIdx][rIdx]
              const isHit = winningCells.some(cell => cell.c === cIdx && cell.r === rIdx)

              return (
                <div
                  key={rIdx}
                  style={{
                    height: '52px',
                    borderRadius: '8px',
                    background: isGold
                      ? 'linear-gradient(145deg, #ffd700 0%, #b45309 60%, #78350f 100%)'
                      : 'linear-gradient(180deg, #2b1103 0%, #150801 100%)',
                    border: isHit
                      ? '2px solid #fff'
                      : isGold
                        ? '2px solid #fef08a'
                        : `1.5px solid ${def.border}`,
                    boxShadow: isHit
                      ? '0 0 14px #fff, inset 0 0 6px #fbbf24'
                      : isGold
                        ? '0 0 10px rgba(250, 204, 21, 0.8)'
                        : `0 0 6px rgba(245, 158, 11, 0.25)`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px',
                    transform: isHit ? 'scale(1.08)' : spinning ? 'scale(0.96)' : 'scale(1)',
                    transition: 'transform 0.15s ease, box-shadow 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <span style={{ fontSize: '20px', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.7))' }}>
                    {def.icon}
                  </span>
                  <div style={{
                    fontSize: '6.5px',
                    fontWeight: 900,
                    color: isGold ? '#000' : '#fed7aa',
                    letterSpacing: '0.02em',
                    marginTop: '1px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}>
                    {def.isWild ? 'WILD' : def.isScatter ? 'SCATTER' : def.name.split(' ')[0]}
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        {/* Big Win Pop-Up Overlay */}
        {bigWinOverlay && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(15, 6, 0, 0.94)',
            borderRadius: '14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 40,
            animation: 'fadeIn 0.25s ease'
          }}>
            <div style={{ fontSize: '42px', marginBottom: '6px' }}>🤠 💰 🔫</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#fbbf24', letterSpacing: '0.06em' }}>
              WILD BOUNTY SHOWDOWN!
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
              COLLECT BOUNTY
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
        color: totalRoundWin > 0 ? '#34d399' : '#e2e8f0',
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
          <span>🤠</span>
          <span>{freeSpinsLeft > 0 ? `FREE SPIN (${freeSpinsLeft})` : `SPIN • Rs ${betAmount}`}</span>
        </button>
      </div>
    </div>
  )
}

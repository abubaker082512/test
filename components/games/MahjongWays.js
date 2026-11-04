import React, { useState, useEffect, useRef, useCallback } from 'react'
import { casinoAudio } from '../../utils/casinoAudio'

// Authentic PG Soft Mahjong Ways Tiles
const MAHJONG_TILES = {
  'FA': {
    char: '發',
    sub: 'GREEN DRAGON',
    color: '#00e676',
    border: '#00e676',
    payout: 5.0,
    isHigh: true
  },
  'ZHONG': {
    char: '中',
    sub: 'RED DRAGON',
    color: '#ff1744',
    border: '#ff1744',
    payout: 4.0,
    isHigh: true
  },
  'BAI': {
    char: '白',
    sub: 'WHITE BOARD',
    color: '#38bdf8',
    border: '#38bdf8',
    payout: 3.0,
    isHigh: true
  },
  'BAMBOO': {
    char: '🀐',
    sub: 'BAMBOO 8',
    color: '#10b981',
    border: '#10b981',
    payout: 2.0
  },
  'DOT': {
    char: '🀙',
    sub: 'DOT 5',
    color: '#ab47bc',
    border: '#ab47bc',
    payout: 1.5
  },
  'CHAR5': {
    char: '伍',
    sub: 'WAN 5',
    color: '#f59e0b',
    border: '#f59e0b',
    payout: 1.0
  },
  'CHAR2': {
    char: '貳',
    sub: 'WAN 2',
    color: '#f97316',
    border: '#f97316',
    payout: 0.8
  },
  'WILD': {
    char: '元宝',
    sub: 'GOLD WILD',
    color: '#fbbf24',
    border: '#fbbf24',
    payout: 10.0,
    isWild: true
  },
  'SCATTER': {
    char: '🀄',
    sub: 'SCATTER',
    color: '#ef4444',
    border: '#fbbf24',
    payout: 15.0,
    isScatter: true
  }
}

const REGULAR_KEYS = ['FA', 'ZHONG', 'BAI', 'BAMBOO', 'DOT', 'CHAR5', 'CHAR2']
const BET_OPTIONS = [10, 20, 50, 100, 200, 500]

export default function MahjongWays({
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
  const [multiplierStep, setMultiplierStep] = useState(0) // 0=1x, 1=2x, 2=3x, 3=5x
  const [reels, setReels] = useState([
    ['FA', 'BAMBOO', 'DOT', 'CHAR5'],
    ['ZHONG', 'BAI', 'CHAR2', 'FA'],
    ['BAI', 'FA', 'BAMBOO', 'DOT'],
    ['DOT', 'CHAR5', 'FA', 'ZHONG'],
    ['CHAR2', 'BAMBOO', 'BAI', 'FA']
  ])
  const [goldPlatedGrid, setGoldPlatedGrid] = useState([
    [false, false, false, false],
    [false, true, false, false],
    [false, false, true, false],
    [true, false, false, false],
    [false, false, false, false]
  ])
  const [winningCells, setWinningCells] = useState([])
  const [isFreeSpins, setIsFreeSpins] = useState(false)
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0)
  const [totalRoundWin, setTotalRoundWin] = useState(0)
  const [bigWinOverlay, setBigWinOverlay] = useState(null)
  const [turboMode, setTurboMode] = useState(false)
  const [autoSpin, setAutoSpin] = useState(false)
  const [statusMessage, setStatusMessage] = useState('TAP SPIN TO DROP MAHJONG TILES')

  const autoSpinRef = useRef(autoSpin)
  autoSpinRef.current = autoSpin
  const spinningRef = useRef(spinning)
  spinningRef.current = spinning

  const normalSteps = [1, 2, 3, 5]
  const freeSteps = [2, 4, 6, 10]
  const currentLadder = isFreeSpins ? freeSteps : normalSteps
  const activeMultiplier = currentLadder[Math.min(multiplierStep, currentLadder.length - 1)]

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

      if (type === 'tile-click') {
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(800, now)
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.05)
        gain.gain.setValueAtTime(0.14, now)
        gain.gain.linearRampToValueAtTime(0.01, now + 0.05)
        osc.start(now)
        osc.stop(now + 0.05)
      } else if (type === 'gong') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(220, now)
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.4)
        gain.gain.setValueAtTime(0.2, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
        osc.start(now)
        osc.stop(now + 0.4)
      } else if (type === 'win') {
        const chord = [392.00, 493.88, 587.33, 783.99]
        chord.forEach((f, i) => {
          const o = ctx.createOscillator()
          const g = ctx.createGain()
          o.connect(g)
          g.connect(ctx.destination)
          o.type = 'triangle'
          o.frequency.setValueAtTime(f, now + i * 0.07)
          g.gain.setValueAtTime(0.12, now + i * 0.07)
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.25)
          o.start(now + i * 0.07)
          o.stop(now + i * 0.07 + 0.25)
        })
      } else if (type === 'bigwin') {
        casinoAudio.playBigWin()
      }
    } catch (e) {}
  }, [])

  // Random tile generator (columns 1, 2, 3 can spawn golden plated tiles)
  const getRandomTile = useCallback((colIdx) => {
    if (Math.random() < 0.035) return { key: 'SCATTER', isGold: false }
    if (Math.random() < 0.025) return { key: 'WILD', isGold: false }

    const randKey = REGULAR_KEYS[Math.floor(Math.random() * REGULAR_KEYS.length)]
    const isGold = (colIdx >= 1 && colIdx <= 3) && (Math.random() < 0.22)
    return { key: randKey, isGold }
  }, [])

  // Evaluate adjacent matching symbols from reel 0
  const evaluateGrid = useCallback((grid) => {
    const hits = []
    let totalPayout = 0
    const matchedCoords = []

    for (const symKey of REGULAR_KEYS) {
      let consecutiveCols = 0
      const waysPerCol = []
      const symCoords = []

      for (let c = 0; c < 5; c++) {
        let countInCol = 0
        for (let r = 0; r < 4; r++) {
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
        const baseMul = MAHJONG_TILES[symKey]?.payout || 0.5
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
    for (let c = 0; c < 5; c++) {
      for (let r = 0; r < 4; r++) {
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
    setMultiplierStep(0)
    setWinningCells([])
    setTotalRoundWin(0)
    setBigWinOverlay(null)
    setStatusMessage('DROPPING MAHJONG TILES...')
    playSound('gong')

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
              game: 'PG Soft Mahjong Ways'
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
      setReels(prev => prev.map((col, cIdx) => col.map(() => getRandomTile(cIdx).key)))
      if (ticks >= spinTicks) {
        clearInterval(timer)
        finalizeBaseGrid()
      }
    }, 50)
  }

  const finalizeBaseGrid = () => {
    const newGrid = []
    const newGold = []

    for (let c = 0; c < 5; c++) {
      const col = []
      const goldCol = []
      for (let r = 0; r < 4; r++) {
        const item = getRandomTile(c)
        col.push(item.key)
        goldCol.push(item.isGold)
      }
      newGrid.push(col)
      newGold.push(goldCol)
    }

    setReels(newGrid)
    setGoldPlatedGrid(newGold)
    playSound('tile-click')

    processCascade(newGrid, newGold, 0, 0)
  }

  const processCascade = (currentGrid, currentGold, step, accumulatedWin) => {
    const evalResult = evaluateGrid(currentGrid)

    if (step === 0 && evalResult.scatterCount >= 3) {
      setIsFreeSpins(true)
      const awarded = 12
      setFreeSpinsLeft(prev => prev + awarded)
      playSound('bigwin')
      setStatusMessage(`🀄 FREE SPINS TRIGGERED! +${awarded} FREE ROUNDS!`)
    }

    if (evalResult.hits.length > 0) {
      const levelMult = currentLadder[Math.min(step, currentLadder.length - 1)]
      const stepWin = evalResult.totalPayout * betAmount * levelMult
      const nextAccumulated = accumulatedWin + stepWin

      setMultiplierStep(step)
      setTotalRoundWin(nextAccumulated)
      setWinningCells(evalResult.matchedCoords)
      playSound('win')
      setStatusMessage(`✨ MAHJONG WIN ${levelMult}x! +Rs ${stepWin.toFixed(2)}`)

      // Gold transformation into Wild Ingots & drop
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
        for (let c = 0; c < 5; c++) {
          const surviving = []
          const survivingGold = []

          for (let r = 3; r >= 0; r--) {
            if (nextGrid[c][r] !== null) {
              surviving.unshift(nextGrid[c][r])
              survivingGold.unshift(nextGold[c][r])
            }
          }

          while (surviving.length < 4) {
            const fresh = getRandomTile(c)
            surviving.unshift(fresh.key)
            survivingGold.unshift(fresh.isGold)
          }

          nextGrid[c] = surviving
          nextGold[c] = survivingGold
        }

        setReels(nextGrid)
        setGoldPlatedGrid(nextGold)
        setWinningCells([])
        playSound('tile-click')

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
              game: 'PG Soft Mahjong Ways'
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
        setStatusMessage(`🎉 TOTAL WIN: Rs ${accumulatedWin.toFixed(2)}!`)
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
      background: 'radial-gradient(ellipse at 50% 0%, #1c0a00 0%, #0c0400 70%, #000 100%)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      padding: '8px 10px 18px',
      boxSizing: 'border-box',
      userSelect: 'none',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>

      {/* Top Chinese Dragon Multiplier Bar */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.22) 0%, rgba(20, 5, 0, 0.95) 100%)',
        border: '1.5px solid rgba(239, 68, 68, 0.5)',
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
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            boxShadow: '0 0 12px rgba(239, 68, 68, 0.5)'
          }}>
            🀄
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#fca5a5', letterSpacing: '0.04em' }}>
              MAHJONG WAYS • PG SOFT
            </div>
            <div style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 600 }}>
              {isFreeSpins ? `🔥 FREE SPINS (${freeSpinsLeft} LEFT)` : 'Cascading Tile Multipliers'}
            </div>
          </div>
        </div>

        {/* Multiplier Ladder */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {currentLadder.map((step, idx) => {
            const isActive = activeMultiplier >= step
            return (
              <div
                key={idx}
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)'
                    : 'rgba(255, 255, 255, 0.06)',
                  color: isActive ? '#000' : '#64748b',
                  padding: '4px 7px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 900,
                  border: isActive ? '1px solid #fff' : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: isActive ? '0 0 10px rgba(251, 191, 36, 0.7)' : 'none',
                  transition: 'all 0.25s ease'
                }}
              >
                {step}x
              </div>
            )
          })}
        </div>
      </div>

      {/* Main 5-Reel x 4-Row Mahjong Tile Board */}
      <div style={{
        background: 'linear-gradient(180deg, #160a02 0%, #0a0400 100%)',
        border: '2px solid rgba(251, 191, 36, 0.5)',
        borderRadius: '16px',
        padding: '8px',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '5px',
        boxShadow: 'inset 0 0 24px rgba(0,0,0,0.85), 0 8px 32px rgba(0,0,0,0.7)',
        position: 'relative',
        minHeight: '290px'
      }}>
        {reels.map((col, cIdx) => (
          <div key={cIdx} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {col.map((tileKey, rIdx) => {
              const def = MAHJONG_TILES[tileKey] || MAHJONG_TILES['FA']
              const isGold = goldPlatedGrid[cIdx] && goldPlatedGrid[cIdx][rIdx]
              const isHit = winningCells.some(cell => cell.c === cIdx && cell.r === rIdx)

              return (
                <div
                  key={rIdx}
                  style={{
                    flex: 1,
                    minHeight: '66px',
                    borderRadius: '8px',
                    background: isGold
                      ? 'linear-gradient(145deg, #ffd700 0%, #b45309 60%, #78350f 100%)'
                      : 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 60%, #e2e8f0 100%)',
                    border: isHit
                      ? '2.5px solid #ef4444'
                      : isGold
                        ? '2px solid #fef08a'
                        : '1.5px solid #cbd5e1',
                    boxShadow: isHit
                      ? '0 0 16px #ef4444, inset 0 0 8px #fbbf24'
                      : isGold
                        ? '0 0 12px rgba(250, 204, 21, 0.8), inset 0 1px 3px rgba(255,255,255,0.7)'
                        : '0 4px 8px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '3px',
                    transform: isHit ? 'scale(1.06)' : spinning ? 'scale(0.97)' : 'scale(1)',
                    transition: 'transform 0.15s ease, box-shadow 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {isGold && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      background: '#fff',
                      color: '#000',
                      fontSize: '6.5px',
                      fontWeight: 900,
                      padding: '1px 3px',
                      borderBottomLeftRadius: '4px'
                    }}>
                      GOLD
                    </div>
                  )}

                  <div style={{
                    fontSize: def.char.length > 1 ? '16px' : '26px',
                    fontWeight: 900,
                    color: isGold ? '#fff' : def.color,
                    lineHeight: 1,
                    textShadow: isGold ? '0 2px 4px rgba(0,0,0,0.8)' : 'none'
                  }}>
                    {def.char}
                  </div>

                  <div style={{
                    fontSize: '7px',
                    fontWeight: 900,
                    color: isGold ? '#000' : '#475569',
                    letterSpacing: '0.02em',
                    marginTop: '2px',
                    lineHeight: 1
                  }}>
                    {def.sub}
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
            background: 'rgba(15, 5, 0, 0.94)',
            borderRadius: '14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 40,
            animation: 'fadeIn 0.25s ease'
          }}>
            <div style={{ fontSize: '42px', marginBottom: '6px' }}>🀄 🐉 🀄</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#fbbf24', letterSpacing: '0.06em' }}>
              MAHJONG MEGA JACKPOT!
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
              TAKE WINNINGS
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
                  ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
                  : 'rgba(255, 255, 255, 0.06)',
                color: '#fff',
                border: betAmount === amt ? '1px solid #fca5a5' : '1px solid rgba(255, 255, 255, 0.1)',
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
              : 'linear-gradient(180deg, #ef4444 0%, #dc2626 50%, #991b1b 100%)',
            border: spinning ? '1px solid #475569' : '1px solid #fca5a5',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 900,
            letterSpacing: '0.06em',
            cursor: spinning ? 'not-allowed' : 'pointer',
            boxShadow: spinning ? 'none' : '0 4px 18px rgba(239, 68, 68, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>🀄</span>
          <span>{freeSpinsLeft > 0 ? `FREE SPIN (${freeSpinsLeft})` : `SPIN • Rs ${betAmount}`}</span>
        </button>
      </div>
    </div>
  )
}

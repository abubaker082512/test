import React, { useState, useEffect, useRef, useCallback } from 'react'
import { casinoAudio } from '../../utils/casinoAudio'

// Authentic JILI Super Ace Symbols & Payout Multipliers (1024 Ways)
const SYMBOL_DEFS = {
  'A': {
    name: 'Ace of Spades',
    label: 'A',
    suit: '♠',
    suitColor: '#38bdf8',
    gradient: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
    border: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.4)',
    payouts: { 3: 1.0, 4: 2.0, 5: 5.0 }
  },
  'K': {
    name: 'King of Hearts',
    label: 'K',
    suit: '♥',
    suitColor: '#f43f5e',
    gradient: 'linear-gradient(145deg, #2a0812 0%, #150308 100%)',
    border: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.4)',
    payouts: { 3: 0.8, 4: 1.6, 5: 4.0 }
  },
  'Q': {
    name: 'Queen of Clubs',
    label: 'Q',
    suit: '♣',
    suitColor: '#10b981',
    gradient: 'linear-gradient(145deg, #062618 0%, #02120a 100%)',
    border: '#10b981',
    glow: 'rgba(16, 185, 129, 0.4)',
    payouts: { 3: 0.6, 4: 1.2, 5: 3.0 }
  },
  'J': {
    name: 'Jack of Diamonds',
    label: 'J',
    suit: '♦',
    suitColor: '#f59e0b',
    gradient: 'linear-gradient(145deg, #2b1803 0%, #140b01 100%)',
    border: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.4)',
    payouts: { 3: 0.4, 4: 0.8, 5: 2.0 }
  },
  'SPADE': {
    name: 'Spade',
    label: '♠',
    suit: '♠',
    suitColor: '#94a3b8',
    gradient: 'linear-gradient(145deg, #1e222d 0%, #0c0e14 100%)',
    border: '#64748b',
    glow: 'rgba(100, 116, 139, 0.25)',
    payouts: { 3: 0.2, 4: 0.5, 5: 1.0 }
  },
  'HEART': {
    name: 'Heart',
    label: '♥',
    suit: '♥',
    suitColor: '#ef4444',
    gradient: 'linear-gradient(145deg, #240a0f 0%, #120306 100%)',
    border: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.25)',
    payouts: { 3: 0.2, 4: 0.5, 5: 1.0 }
  },
  'CLUB': {
    name: 'Club',
    label: '♣',
    suit: '♣',
    suitColor: '#10b981',
    gradient: 'linear-gradient(145deg, #092015 0%, #030d08 100%)',
    border: '#10b981',
    glow: 'rgba(16, 185, 129, 0.25)',
    payouts: { 3: 0.15, 4: 0.4, 5: 0.8 }
  },
  'DIAMOND': {
    name: 'Diamond',
    label: '♦',
    suit: '♦',
    suitColor: '#0ea5e9',
    gradient: 'linear-gradient(145deg, #08212e 0%, #030e14 100%)',
    border: '#0ea5e9',
    glow: 'rgba(14, 165, 233, 0.25)',
    payouts: { 3: 0.15, 4: 0.4, 5: 0.8 }
  },
  'JOKER': {
    name: 'JILI Golden Joker',
    label: 'WILD',
    suit: '🃏',
    suitColor: '#ffd700',
    gradient: 'linear-gradient(145deg, #451a03 0%, #78350f 50%, #b45309 100%)',
    border: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.85)',
    isWild: true,
    payouts: { 3: 2.0, 4: 5.0, 5: 10.0 }
  },
  'SCATTER': {
    name: 'Free Game Scatter',
    label: 'SCATTER',
    suit: '👑',
    suitColor: '#fbbf24',
    gradient: 'linear-gradient(145deg, #3b0764 0%, #581c87 50%, #7e22ce 100%)',
    border: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.8)',
    isScatter: true,
    payouts: { 3: 5.0, 4: 15.0, 5: 50.0 }
  }
}

const REGULAR_KEYS = ['A', 'K', 'Q', 'J', 'SPADE', 'HEART', 'CLUB', 'DIAMOND']
const BET_OPTIONS = [10, 20, 50, 100, 200, 500]

export default function SuperAce({
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
  const [cascadeLevel, setCascadeLevel] = useState(0) // 0, 1, 2, 3
  const [reels, setReels] = useState([
    ['A', 'K', 'Q'],
    ['K', 'SPADE', 'J'],
    ['A', 'HEART', 'Q'],
    ['CLUB', 'K', 'A'],
    ['DIAMOND', 'Q', 'K']
  ])
  const [goldenGrid, setGoldenGrid] = useState([
    [false, false, false],
    [false, true, false],
    [false, false, true],
    [true, false, false],
    [false, false, false]
  ])
  const [winningCells, setWinningCells] = useState([])
  const [isFreeSpins, setIsFreeSpins] = useState(false)
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0)
  const [totalRoundWin, setTotalRoundWin] = useState(0)
  const [bigWinOverlay, setBigWinOverlay] = useState(null)
  const [turboMode, setTurboMode] = useState(false)
  const [autoSpin, setAutoSpin] = useState(false)
  const [statusMessage, setStatusMessage] = useState('TAP SPIN TO DEAL JILI CARDS')

  const autoSpinRef = useRef(autoSpin)
  autoSpinRef.current = autoSpin
  const spinningRef = useRef(spinning)
  spinningRef.current = spinning

  const normalMultipliers = [1, 2, 3, 5]
  const freeMultipliers = [2, 4, 6, 10]
  const currentMultipliers = isFreeSpins ? freeMultipliers : normalMultipliers
  const activeMultiplier = currentMultipliers[Math.min(cascadeLevel, currentMultipliers.length - 1)]

  // Safe sound synthesizer helper
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
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(220, now)
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.1)
        gain.gain.setValueAtTime(0.08, now)
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1)
        osc.start(now)
        osc.stop(now + 0.1)
      } else if (type === 'card-drop') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(320, now)
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.08)
        gain.gain.setValueAtTime(0.12, now)
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08)
        osc.start(now)
        osc.stop(now + 0.08)
      } else if (type === 'golden-transform') {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(520, now)
        osc.frequency.linearRampToValueAtTime(1040, now + 0.22)
        gain.gain.setValueAtTime(0.18, now)
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25)
        osc.start(now)
        osc.stop(now + 0.25)
      } else if (type === 'win') {
        osc.type = 'sine'
        const freqs = [523.25, 659.25, 783.99, 1046.50]
        freqs.forEach((f, i) => {
          const o = ctx.createOscillator()
          const g = ctx.createGain()
          o.connect(g)
          g.connect(ctx.destination)
          o.type = 'triangle'
          o.frequency.setValueAtTime(f, now + i * 0.07)
          g.gain.setValueAtTime(0.12, now + i * 0.07)
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.2)
          o.start(now + i * 0.07)
          o.stop(now + i * 0.07 + 0.2)
        })
      } else if (type === 'bigwin') {
        casinoAudio.playBigWin()
      }
    } catch (e) {}
  }, [])

  // Random symbol generator (columns 1, 2, 3 can spawn golden cards)
  const getRandomSymbol = useCallback((colIdx) => {
    // 3% chance of scatter
    if (Math.random() < 0.035) return { key: 'SCATTER', isGold: false }
    // 3% chance of direct Wild
    if (Math.random() < 0.03) return { key: 'JOKER', isGold: false }

    const randKey = REGULAR_KEYS[Math.floor(Math.random() * REGULAR_KEYS.length)]
    // Golden cards only appear on reels 2, 3, 4 (0-indexed: 1, 2, 3)
    const isGold = (colIdx >= 1 && colIdx <= 3) && (Math.random() < 0.22)
    return { key: randKey, isGold }
  }, [])

  // Evaluate 1024-ways wins on the 5x3 grid
  const evaluateWins = useCallback((grid) => {
    const wins = []
    let totalWinPayout = 0
    const matchedCellCoords = []

    // Check each regular symbol
    for (const symKey of REGULAR_KEYS) {
      let consecutiveCols = 0
      const waysPerCol = []
      const symCoords = []

      for (let c = 0; c < 5; c++) {
        let countInCol = 0
        for (let r = 0; r < 3; r++) {
          const cellKey = grid[c][r]
          if (cellKey === symKey || cellKey === 'JOKER') {
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
        const def = SYMBOL_DEFS[symKey]
        const baseMul = def?.payouts?.[consecutiveCols] || 0
        const totalWays = waysPerCol.reduce((a, b) => a * b, 1)
        const payout = baseMul * totalWays

        wins.push({
          symKey,
          cols: consecutiveCols,
          ways: totalWays,
          payout
        })
        totalWinPayout += payout
        matchedCellCoords.push(...symCoords)
      }
    }

    // Check Scatters anywhere on the board
    let scatterCount = 0
    const scatterCoords = []
    for (let c = 0; c < 5; c++) {
      for (let r = 0; r < 3; r++) {
        if (grid[c][r] === 'SCATTER') {
          scatterCount++
          scatterCoords.push({ c, r })
        }
      }
    }

    return {
      wins,
      totalWinPayout,
      matchedCellCoords,
      scatterCount,
      scatterCoords
    }
  }, [])

  // Execute a single spin and handle cascading eliminations
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
    setCascadeLevel(0)
    setWinningCells([])
    setTotalRoundWin(0)
    setBigWinOverlay(null)
    setStatusMessage('SPINNING JILI REELS...')
    playSound('spin')

    // Deduct bet if not free spins
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
              game: 'JILI Super Ace Gold'
            })
          })
          if (fetchWallet) fetchWallet()
          window.dispatchEvent(new Event('wallet-updated'))
        } catch (e) {}
      }
    } else {
      setFreeSpinsLeft(prev => prev - 1)
    }

    // Quick reel blur animation
    const spinTicks = turboMode ? 4 : 8
    let ticks = 0
    const timer = setInterval(() => {
      ticks++
      setReels(prev => prev.map((col, cIdx) => col.map(() => getRandomSymbol(cIdx).key)))
      if (ticks >= spinTicks) {
        clearInterval(timer)
        finalizeBaseGrid()
      }
    }, 45)
  }

  // Finalize spin and initiate cascade chain
  const finalizeBaseGrid = () => {
    // Generate fresh authentic grid
    const newGrid = []
    const newGold = []

    for (let c = 0; c < 5; c++) {
      const col = []
      const goldCol = []
      for (let r = 0; r < 3; r++) {
        const item = getRandomSymbol(c)
        col.push(item.key)
        goldCol.push(item.isGold)
      }
      newGrid.push(col)
      newGold.push(goldCol)
    }

    setReels(newGrid)
    setGoldenGrid(newGold)
    playSound('card-drop')

    // Start cascade loop at step 0
    processCascade(newGrid, newGold, 0, 0)
  }

  // Recursive cascading engine
  const processCascade = (currentGrid, currentGold, step, accumulatedWin) => {
    const evalResult = evaluateWins(currentGrid)

    // Check Free Spins trigger on first drop
    if (step === 0 && evalResult.scatterCount >= 3) {
      setIsFreeSpins(true)
      const awarded = evalResult.scatterCount === 3 ? 10 : 15
      setFreeSpinsLeft(prev => prev + awarded)
      playSound('bigwin')
      setStatusMessage(`👑 FREE GAME TRIGGERED! +${awarded} FREE SPINS!`)
    }

    if (evalResult.wins.length > 0) {
      // We have winning lines!
      const levelMult = (isFreeSpins ? freeMultipliers : normalMultipliers)[Math.min(step, 3)]
      const stepWin = evalResult.totalWinPayout * betAmount * levelMult
      const nextAccumulated = accumulatedWin + stepWin

      setCascadeLevel(step)
      setTotalRoundWin(nextAccumulated)
      setWinningCells(evalResult.matchedCellCoords)
      playSound('win')
      setStatusMessage(`✨ ELIMINATION ${levelMult}x! +Rs ${stepWin.toFixed(2)}`)

      // Animate Golden Card transforms to Joker Wilds & drop
      setTimeout(() => {
        // Clone grid
        const nextGrid = currentGrid.map(col => [...col])
        const nextGold = currentGold.map(col => [...col])
        let transformedAny = false

        // 1. Convert any winning golden card into JILI Joker Wild!
        evalResult.matchedCellCoords.forEach(({ c, r }) => {
          if (nextGold[c][r]) {
            nextGrid[c][r] = 'JOKER'
            nextGold[c][r] = false
            transformedAny = true
          } else {
            nextGrid[c][r] = null // eliminated
          }
        })

        if (transformedAny) {
          playSound('golden-transform')
        }

        // 2. Cascade: drop remaining cards down and fill top with new symbols
        for (let c = 0; c < 5; c++) {
          const surviving = []
          const survivingGold = []

          for (let r = 2; r >= 0; r--) {
            if (nextGrid[c][r] !== null) {
              surviving.unshift(nextGrid[c][r])
              survivingGold.unshift(nextGold[c][r])
            }
          }

          while (surviving.length < 3) {
            const fresh = getRandomSymbol(c)
            surviving.unshift(fresh.key)
            survivingGold.unshift(fresh.isGold)
          }

          nextGrid[c] = surviving
          nextGold[c] = survivingGold
        }

        setReels(nextGrid)
        setGoldenGrid(nextGold)
        setWinningCells([])
        playSound('card-drop')

        // Recursive call with incremented step
        setTimeout(() => {
          processCascade(nextGrid, nextGold, step + 1, nextAccumulated)
        }, turboMode ? 260 : 420)

      }, turboMode ? 350 : 550)

    } else {
      // Cascade ended
      setSpinning(false)
      setWinningCells([])

      if (accumulatedWin > 0) {
        // Payout to wallet
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
              game: 'JILI Super Ace Gold'
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

      // Check auto spin or free spins continuation
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
      background: 'radial-gradient(ellipse at 50% 0%, #1a0828 0%, #07030d 75%, #020105 100%)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      padding: '8px 10px 18px',
      boxSizing: 'border-box',
      userSelect: 'none',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>

      {/* Top Elimination Multiplier Banner */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(251, 191, 36, 0.18) 0%, rgba(15, 6, 23, 0.95) 100%)',
        border: '1.5px solid rgba(251, 191, 36, 0.45)',
        borderRadius: '12px',
        padding: '8px 12px',
        marginBottom: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.65)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: '#000',
            fontWeight: 900,
            boxShadow: '0 0 12px rgba(251, 191, 36, 0.5)'
          }}>
            ♠
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#fbbf24', letterSpacing: '0.04em' }}>
              SUPER ACE • JILI
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>
              {isFreeSpins ? `🔥 FREE SPINS (${freeSpinsLeft} LEFT)` : 'Consecutive Elimination 1024 Ways'}
            </div>
          </div>
        </div>

        {/* Multiplier Step Badges */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {currentMultipliers.map((mult, idx) => {
            const isActive = activeMultiplier >= mult
            return (
              <div
                key={idx}
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
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
                {mult}x
              </div>
            )
          })}
        </div>
      </div>

      {/* Main 5-Reel x 3-Row JILI Card Grid */}
      <div style={{
        background: 'linear-gradient(180deg, #130722 0%, #090312 100%)',
        border: '2px solid rgba(251, 191, 36, 0.5)',
        borderRadius: '16px',
        padding: '8px',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '6px',
        boxShadow: 'inset 0 0 24px rgba(0,0,0,0.85), 0 8px 32px rgba(0,0,0,0.7)',
        position: 'relative',
        minHeight: '270px'
      }}>
        {reels.map((col, cIdx) => (
          <div key={cIdx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {col.map((symKey, rIdx) => {
              const def = SYMBOL_DEFS[symKey] || SYMBOL_DEFS['A']
              const isGold = goldenGrid[cIdx] && goldenGrid[cIdx][rIdx]
              const isWinCell = winningCells.some(cell => cell.c === cIdx && cell.r === rIdx)

              return (
                <div
                  key={rIdx}
                  style={{
                    flex: 1,
                    minHeight: '82px',
                    borderRadius: '10px',
                    background: isGold
                      ? 'linear-gradient(145deg, #ffd700 0%, #b45309 60%, #78350f 100%)'
                      : def.gradient,
                    border: isWinCell
                      ? '2px solid #fff'
                      : isGold
                        ? '2px solid #fef08a'
                        : `1.5px solid ${def.border}`,
                    boxShadow: isWinCell
                      ? '0 0 16px #fff, inset 0 0 10px #fbbf24'
                      : isGold
                        ? '0 0 14px rgba(250, 204, 21, 0.8), inset 0 1px 3px rgba(255,255,255,0.7)'
                        : `0 0 8px ${def.glow}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '5px 4px',
                    transform: isWinCell ? 'scale(1.06)' : spinning ? 'scale(0.97)' : 'scale(1)',
                    transition: 'transform 0.15s ease, box-shadow 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Golden Card Ribbon */}
                  {isGold && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      background: '#fff',
                      color: '#000',
                      fontSize: '7px',
                      fontWeight: 900,
                      padding: '1px 4px',
                      borderBottomLeftRadius: '5px',
                      letterSpacing: '0.04em'
                    }}>
                      GOLD
                    </div>
                  )}

                  {/* Corner Suit */}
                  <div style={{
                    alignSelf: 'flex-start',
                    fontSize: '11px',
                    fontWeight: 900,
                    color: isGold ? '#000' : def.suitColor,
                    lineHeight: 1
                  }}>
                    {def.label}
                  </div>

                  {/* Center Big Icon */}
                  <div style={{
                    fontSize: '24px',
                    lineHeight: 1,
                    filter: isGold ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' : 'none',
                    color: isGold ? '#fff' : def.suitColor
                  }}>
                    {def.suit}
                  </div>

                  {/* Bottom Subtitle / Multiplier Hint */}
                  <div style={{
                    fontSize: '8px',
                    fontWeight: 900,
                    color: isGold ? '#1e1b4b' : '#cbd5e1',
                    letterSpacing: '0.02em',
                    lineHeight: 1
                  }}>
                    {def.isWild ? 'JOKER' : def.isScatter ? 'FREE' : def.label}
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
            background: 'rgba(5, 2, 10, 0.92)',
            borderRadius: '14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 40,
            animation: 'fadeIn 0.25s ease'
          }}>
            <div style={{ fontSize: '42px', marginBottom: '6px' }}>👑 🃏 👑</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#fbbf24', letterSpacing: '0.06em' }}>
              SUPER ACE MEGA WIN!
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
              COLLECT PRIZE
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
          <span>🃏</span>
          <span>{freeSpinsLeft > 0 ? `FREE SPIN (${freeSpinsLeft})` : `SPIN • Rs ${betAmount}`}</span>
        </button>
      </div>
    </div>
  )
}

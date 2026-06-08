import React, { useState, useEffect } from 'react'

const SYMBOLS = {
  'A': { char: 'A', color: '#ff4444', value: 10 },
  'K': { char: 'K', color: '#ffbb00', value: 6 },
  'Q': { char: 'Q', color: '#33b5e5', value: 4 },
  'J': { char: 'J', color: '#ffbb00', value: 2 },
  '10': { char: '10', color: '#2bbbad', value: 1 },
  '♠': { char: '♠', color: '#ffffff', value: 1.5 },
  '♥': { char: '♥', color: '#ff4444', value: 1.5 },
  '♣': { char: '♣', color: '#00c851', value: 1.2 },
  '♦': { char: '♦', color: '#33b5e5', value: 1.2 },
  'WILD': { char: '★', color: 'var(--accent)', value: 0 },
  'SCATTER': { char: '🃏', color: '#aa66cc', value: 0 }
}

const SYMBOL_KEYS = ['A', 'K', 'Q', 'J', '10', '♠', '♥', '♣', '♦']

export default function SuperAce({ user, wallet, fetchWallet }) {
  const [betAmount, setBetAmount] = useState(10)
  const [spinning, setSpinning] = useState(false)
  const [reels, setReels] = useState([]) // 5 columns x 3 rows grid
  const [goldenGrid, setGoldenGrid] = useState([]) // Track which spots are golden
  const [multiplier, setMultiplier] = useState(1) // 1, 2, 3, 5 (doubled in free spins)
  const [isFreeSpins, setIsFreeSpins] = useState(false)
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0)
  const [message, setMessage] = useState(null)
  
  // Visual effects
  const [winningCells, setWinningCells] = useState([]) // indices of winning cells
  const [bigWinAmount, setBigWinAmount] = useState(0)
  const [showBigWin, setShowBigWin] = useState(false)
  const [spinReelStates, setSpinReelStates] = useState([false, false, false, false, false])

  // Set initial screen
  useEffect(() => {
    generateInitialGrid()
  }, [])

  const generateInitialGrid = () => {
    const newReels = []
    const newGold = []
    for (let col = 0; col < 5; col++) {
      const column = []
      const goldCol = []
      for (let row = 0; row < 3; row++) {
        const keys = Object.keys(SYMBOLS).filter(k => k !== 'WILD')
        column.push(keys[Math.floor(Math.random() * keys.length)])
        goldCol.push(Math.random() < 0.2) // 20% chance golden
      }
      newReels.push(column)
      newGold.push(goldCol)
    }
    setReels(newReels)
    setGoldenGrid(newGold)
  }

  const getMultiplierSteps = () => {
    if (isFreeSpins) return [2, 4, 6, 10]
    return [1, 2, 3, 5]
  }

  const triggerSpin = async () => {
    if (spinning) return
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit.' })
    }

    setMessage(null)
    setSpinning(true)
    setWinningCells([])
    setBigWinAmount(0)
    setShowBigWin(false)

    // Deduct bet
    const res = await fetch('/api/wallet/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, amount: betAmount })
    })
    const data = await res.json()
    if (!data.success) {
      setSpinning(false)
      return setMessage({ type: 'error', text: data.error || 'Failed to place bet.' })
    }
    fetchWallet()

    // 1. Reel spin animation sequence (reels stop one by one)
    setSpinReelStates([true, true, true, true, true])
    
    // Simulate a reel spin effect by randomly changing symbols
    let timer = 0
    const interval = setInterval(() => {
      setReels(prev => {
        return prev.map((col, cIdx) => {
          if (!spinReelStates[cIdx]) return col
          return col.map(() => {
            const keys = Object.keys(SYMBOLS)
            return keys[Math.floor(Math.random() * keys.length)]
          })
        })
      })
      timer += 100
    }, 100)

    // Stop reels sequentially
    for (let cIdx = 0; cIdx < 5; cIdx++) {
      await new Promise(resolve => setTimeout(resolve, 300))
      setSpinReelStates(prev => {
        const next = [...prev]
        next[cIdx] = false
        return next
      })
    }

    clearInterval(interval)

    // 2. Generate final spin results
    const finalReels = []
    const finalGold = []
    for (let col = 0; col < 5; col++) {
      const column = []
      const goldCol = []
      for (let row = 0; row < 3; row++) {
        // High chance of standard symbols, lower of wild/scatter
        let symbol = 'A'
        const rand = Math.random()
        if (rand < 0.06) symbol = 'SCATTER'
        else if (rand < 0.1) symbol = 'WILD'
        else {
          symbol = SYMBOL_KEYS[Math.floor(Math.random() * SYMBOL_KEYS.length)]
        }
        column.push(symbol)
        goldCol.push(symbol !== 'WILD' && symbol !== 'SCATTER' && Math.random() < 0.25)
      }
      finalReels.push(column)
      finalGold.push(goldCol)
    }

    setReels(finalReels)
    setGoldenGrid(finalGold)
    setSpinning(false)

    // Evaluate payouts and cascades
    evaluateRound(finalReels, finalGold, 1)
  }

  const evaluateRound = async (currentGrid, currentGold, cascadeCount) => {
    // Math logic for Super Ace (Ways to Win matching):
    // Match same symbols in adjacent columns starting from column 0 (reels 1, 2, 3, etc.)
    const matches = {}
    
    // Scan column 0
    currentGrid[0].forEach(sym => {
      matches[sym] = [1] // 1 match in col 0
    })

    // Scan columns 1 to 4
    for (let col = 1; col < 5; col++) {
      const colSymbols = currentGrid[col]
      Object.keys(matches).forEach(sym => {
        // Count occurrences of symbol or WILD in this column
        const occurrences = colSymbols.filter(s => s === sym || s === 'WILD').length
        if (occurrences > 0) {
          matches[sym].push(occurrences)
        } else {
          // If no match in this column, check if we had scatters
        }
      })
    }

    let totalPayout = 0
    const winCells = [] // format: `${col}-${row}`
    const scattersCount = currentGrid.flat().filter(s => s === 'SCATTER').length

    // Evaluate matches of length >= 3
    Object.entries(matches).forEach(([sym, colCounts]) => {
      if (sym === 'WILD' || sym === 'SCATTER') return
      
      const matchLength = colCounts.length
      if (matchLength >= 3) {
        // Calculate ways: multiply column occurrence counts
        let ways = 1
        for (let i = 0; i < matchLength; i++) {
          ways *= colCounts[i]
        }

        // Payout = ways * symbol value * length multiplier
        const symVal = SYMBOLS[sym].value
        const lengthMult = matchLength === 3 ? 1 : matchLength === 4 ? 2 : 4
        totalPayout += ways * symVal * lengthMult

        // Identify cells for animation
        for (let c = 0; c < matchLength; c++) {
          currentGrid[c].forEach((gridSym, r) => {
            if (gridSym === sym || gridSym === 'WILD') {
              winCells.push(`${c}-${r}`)
            }
          })
        }
      }
    })

    // Scatter Free Spins check
    let triggerFreeSpins = false
    if (scattersCount >= 3) {
      triggerFreeSpins = true
      // Visual flash scatters
      currentGrid.forEach((col, c) => {
        col.forEach((sym, r) => {
          if (sym === 'SCATTER') winCells.push(`${c}-${r}`)
        })
      })
    }

    if (winCells.length > 0) {
      setWinningCells(winCells)
      // Flash winning cells
      await new Promise(resolve => setTimeout(resolve, 800))

      // Calculate multiplied payout
      const steps = getMultiplierSteps()
      const currentMultIndex = Math.min(cascadeCount - 1, 3)
      const activeMult = steps[currentMultIndex]
      setMultiplier(activeMult)

      const finalWin = totalPayout * betAmount * activeMult * 0.1 // Scaled
      
      if (finalWin > 0) {
        // Payout to database
        await fetch('/api/wallet/payout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, bet_amount: betAmount, multiplier: (finalWin / betAmount) })
        })
        fetchWallet()

        if (finalWin >= betAmount * 10) {
          setBigWinAmount(finalWin)
          setShowBigWin(true)
        } else {
          setMessage({ type: 'success', text: `Cascade win! +₱${finalWin.toFixed(2)} (${activeMult}x Mult)` })
        }
      }

      // Cascade / Tumble sequence:
      // Golden cards that won transform into WILDs
      // Others explode (become empty)
      // Empty spots fall down, and new symbols fall from top
      const nextGrid = currentGrid.map((col, c) => {
        return col.map((sym, r) => {
          const isWinning = winCells.includes(`${c}-${r}`)
          if (isWinning) {
            const isGold = currentGold[c][r]
            if (isGold) return 'WILD' // Golden card turns to WILD
            return 'EMPTY'
          }
          return sym
        })
      })

      // Clean gold status for exploded spots
      const nextGold = currentGold.map((col, c) => {
        return col.map((gold, r) => {
          const isWinning = winCells.includes(`${c}-${r}`)
          if (isWinning) return false
          return gold
        })
      })

      // Fall down physics
      for (let c = 0; c < 5; c++) {
        const col = nextGrid[c]
        const gold = nextGold[c]
        
        // Extract non-empty symbols
        const activeSyms = []
        const activeGolds = []
        for (let r = 2; r >= 0; r--) {
          if (col[r] !== 'EMPTY') {
            activeSyms.unshift(col[r])
            activeGolds.unshift(gold[r])
          }
        }

        // Fill remaining top spots with random new symbols
        while (activeSyms.length < 3) {
          const sym = SYMBOL_KEYS[Math.floor(Math.random() * SYMBOL_KEYS.length)]
          activeSyms.unshift(sym)
          activeGolds.unshift(Math.random() < 0.25)
        }

        nextGrid[c] = activeSyms
        nextGold[c] = activeGolds
      }

      setReels(nextGrid)
      setGoldenGrid(nextGold)
      setWinningCells([])

      // Check if Free Spins triggered
      if (triggerFreeSpins) {
        setIsFreeSpins(true)
        setFreeSpinsLeft(prev => prev + 10)
        setMessage({ type: 'success', text: '🃏 SCATTER MULTIPLIER! 10 FREE SPINS TRIGGERED!' })
        await new Promise(resolve => setTimeout(resolve, 1500))
      }

      // Continue cascading
      setTimeout(() => {
        evaluateRound(nextGrid, nextGold, cascadeCount + 1)
      }, 800)

    } else {
      // End of cascade rounds
      setMultiplier(getMultiplierSteps()[0])
      
      // If we are in Free Spins, decrease free spins count and auto-trigger next spin
      if (isFreeSpins && freeSpinsLeft > 0) {
        const nextSpins = freeSpinsLeft - 1
        setFreeSpinsLeft(nextSpins)
        if (nextSpins === 0) {
          setIsFreeSpins(false)
          setMessage({ type: 'success', text: 'Free spins bonus round finished!' })
        } else {
          setTimeout(() => {
            autoTriggerFreeSpin()
          }, 1000)
        }
      }
    }
  }

  const autoTriggerFreeSpin = () => {
    // Trigger spin without checking balance (already paid for)
    setSpinning(true)
    setWinningCells([])
    setSpinReelStates([true, true, true, true, true])
    
    let timer = 0
    const interval = setInterval(() => {
      setReels(prev => {
        return prev.map((col, cIdx) => {
          if (!spinReelStates[cIdx]) return col
          return col.map(() => {
            const keys = Object.keys(SYMBOLS)
            return keys[Math.floor(Math.random() * keys.length)]
          })
        })
      })
      timer += 100
    }, 100)

    setTimeout(async () => {
      clearInterval(interval)
      setSpinReelStates([false, false, false, false, false])
      
      // Generate spin results
      const finalReels = []
      const finalGold = []
      for (let col = 0; col < 5; col++) {
        const column = []
        const goldCol = []
        for (let row = 0; row < 3; row++) {
          let symbol = 'A'
          const rand = Math.random()
          if (rand < 0.08) symbol = 'SCATTER'
          else if (rand < 0.12) symbol = 'WILD'
          else {
            symbol = SYMBOL_KEYS[Math.floor(Math.random() * SYMBOL_KEYS.length)]
          }
          column.push(symbol)
          goldCol.push(symbol !== 'WILD' && symbol !== 'SCATTER' && Math.random() < 0.25)
        }
        finalReels.push(column)
        finalGold.push(goldCol)
      }

      setReels(finalReels)
      setGoldenGrid(finalGold)
      setSpinning(false)
      evaluateRound(finalReels, finalGold, 1)
    }, 1200)
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'linear-gradient(180deg, #1f0505 0%, #080202 100%)',
      width: '100%',
      minHeight: '100%',
      position: 'relative',
      overflowY: 'auto'
    }}>
      {/* Golden/Red header board */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: '420px',
        marginBottom: '10px'
      }}>
        <div style={{
          fontSize: '20px',
          fontWeight: '900',
          fontStyle: 'italic',
          background: 'linear-gradient(to right, #ff0000, #ffaa00)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 2px 10px rgba(255,0,0,0.3)'
        }}>
          SUPER ACE
        </div>
        
        {isFreeSpins && (
          <div style={{
            background: 'linear-gradient(90deg, #ff007f, #aa00ff)',
            color: '#fff',
            fontSize: '11px',
            fontWeight: '900',
            padding: '4px 10px',
            borderRadius: '12px',
            boxShadow: '0 0 10px rgba(255,0,127,0.5)',
            animation: 'pulse-danger 1s infinite'
          }}>
            🎰 FREE SPINS: {freeSpinsLeft} LEFT
          </div>
        )}
      </div>

      {/* Multiplier steps bar */}
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div className="multiplier-bar-container">
          {getMultiplierSteps().map((mult, idx) => {
            const steps = getMultiplierSteps()
            const activeStep = steps.indexOf(multiplier)
            const isActive = idx === activeStep
            return (
              <div 
                key={mult} 
                className={`multiplier-step ${isActive ? 'active' : ''}`}
              >
                x{mult}
              </div>
            )
          })}
        </div>
      </div>

      {/* Main 5x3 Reels Grid */}
      <div style={{
        background: '#151515',
        border: '3px solid #f5c242',
        borderRadius: '16px',
        padding: '8px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(245, 194, 66, 0.2)',
        width: '100%',
        maxWidth: '420px',
        aspectRatio: '5/3.5',
        display: 'flex',
        gap: '6px',
        position: 'relative'
      }}>
        {reels.map((column, colIdx) => (
          <div key={colIdx} style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            {column.map((symKey, rowIdx) => {
              const sym = SYMBOLS[symKey]
              const isGold = goldenGrid[colIdx]?.[rowIdx]
              const isWinning = winningCells.includes(`${colIdx}-${rowIdx}`)
              const isSpinningCol = spinReelStates[colIdx]

              return (
                <div 
                  key={rowIdx} 
                  style={{
                    flex: 1,
                    background: isWinning ? '#00e67615' : isGold ? 'linear-gradient(135deg, #443c08 0%, #1a1502 100%)' : '#222',
                    border: isWinning ? '2px solid #00e676' : isGold ? '2px solid #f5c242' : '1px solid #333',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    transition: 'all 0.15s ease',
                    boxShadow: isGold ? 'inset 0 0 10px rgba(245,194,66,0.3)' : 'none',
                    overflow: 'hidden'
                  }}
                  className={isSpinningCol ? 'reel-blur' : ''}
                >
                  <span style={{
                    fontSize: symKey === '10' ? '18px' : '22px',
                    fontWeight: '900',
                    color: isGold ? '#f5c242' : sym?.color || '#fff',
                    textShadow: symKey === 'WILD' || symKey === 'SCATTER' ? '0 0 10px rgba(255,255,255,0.4)' : 'none'
                  }}>
                    {sym?.char || symKey}
                  </span>
                  
                  {isGold && (
                    <span style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '3px',
                      fontSize: '7px',
                      color: '#f5c242',
                      fontWeight: 'bold'
                    }}>GOLD</span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Control / Feedback Messages */}
      {message && (
        <div style={{
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          marginTop: '12px',
          background: message.type === 'error' ? 'rgba(255, 23, 68, 0.15)' : 'rgba(0, 230, 118, 0.15)',
          color: message.type === 'error' ? '#ff6666' : '#00ff88',
          border: `1px solid ${message.type === 'error' ? '#ff174433' : '#00e67633'}`,
          maxWidth: '380px',
          textAlign: 'center'
        }}>
          {message.text}
        </div>
      )}

      {/* Betting panel Controls */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '100%',
        maxWidth: '420px',
        marginTop: '16px',
        background: 'rgba(0,0,0,0.5)',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid var(--border)'
      }}>
        {/* Bet Chips Selector */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[10, 50, 100, 500].map(amt => (
            <button 
              key={amt} 
              className="btn" 
              onClick={() => setBetAmount(amt)}
              disabled={spinning || isFreeSpins}
              style={{
                flex: 1,
                padding: '8px',
                fontSize: '12px',
                background: betAmount === amt ? 'var(--accent)' : '#000',
                color: betAmount === amt ? '#000' : '#fff',
                borderColor: betAmount === amt ? 'var(--accent)' : '#333'
              }}
            >
              ₱{amt}
            </button>
          ))}
        </div>

        {/* Action Spin trigger */}
        <button 
          className="btn primary"
          onClick={triggerSpin}
          disabled={spinning || isFreeSpins}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '18px',
            fontWeight: '900',
            letterSpacing: '1px',
            background: isFreeSpins ? 'linear-gradient(90deg, #ff007f, #aa00ff)' : 'linear-gradient(135deg, var(--accent) 0%, #e6a100 100%)',
            color: isFreeSpins ? '#fff' : 'var(--text-primary)'
          }}
        >
          {spinning ? 'SPINNING...' : isFreeSpins ? `FREE SPIN MODE (${freeSpinsLeft})` : `SPIN - ₱${betAmount}`}
        </button>
      </div>

      {/* Big Win Modal Overlay */}
      {showBigWin && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div 
            className="pulse-glow"
            style={{
              background: 'linear-gradient(135deg, #2b1800 0%, #140800 100%)',
              border: '4px solid var(--accent)',
              borderRadius: '24px',
              padding: '40px',
              textAlign: 'center',
              width: '90%',
              maxWidth: '380px',
              boxShadow: '0 0 40px rgba(245,194,66,0.6)'
            }}
          >
            <div style={{ fontSize: '72px', animation: 'bounce-slow 2s infinite' }}>🏆</div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '950',
              fontStyle: 'italic',
              background: 'linear-gradient(to bottom, #fff, var(--accent))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '10px'
            }}>
              MEGA WIN!
            </h1>
            <div style={{
              fontSize: '38px',
              fontWeight: 'bold',
              color: '#fff',
              fontFamily: 'monospace',
              textShadow: '0 0 10px rgba(255,255,255,0.4)',
              margin: '20px 0'
            }}>
              +₱{bigWinAmount.toFixed(2)}
            </div>
            <button 
              className="btn primary"
              style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              onClick={() => setShowBigWin(false)}
            >
              AWESOME
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

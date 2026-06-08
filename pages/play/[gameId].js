import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../../utils/supabase'
import { useAuth } from '../../context/AuthContext'
import AuthModal from '../../components/AuthModal'
import CrashEngine from '../../components/CrashEngine'

// ==========================================
// 🟢 PLINKO ENGINE
// ==========================================
function PlinkoEngine({ user, wallet, fetchWallet }) {
  const canvasRef = useRef(null)
  const [betAmount, setBetAmount] = useState(10)
  const [dropping, setDropping] = useState(false)
  const [message, setMessage] = useState(null)
  
  const multipliers = [10.0, 5.0, 2.0, 0.5, 0.2, 0.5, 2.0, 5.0, 10.0]
  const colors = ['#FF1744', '#FF9100', '#FFEA00', '#00E676', '#00E5FF', '#00E676', '#FFEA00', '#FF9100', '#FF1744']

  const pegRows = 8
  const pegRadius = 4
  const ballRadius = 6

  // Canvas dimensions
  const width = 360
  const height = 400

  // Draw board pegs
  const drawBoard = (ctx) => {
    ctx.clearRect(0, 0, width, height)

    // Draw background grid glow
    ctx.fillStyle = '#0f1118'
    ctx.fillRect(0, 0, width, height)

    // Draw slots at bottom
    const slotWidth = width / multipliers.length
    for (let i = 0; i < multipliers.length; i++) {
      const x = i * slotWidth
      ctx.fillStyle = colors[i] + '15' // translucent
      ctx.fillRect(x, height - 40, slotWidth, 40)

      // Border lines
      ctx.strokeStyle = '#222736'
      ctx.strokeRect(x, height - 40, slotWidth, 40)

      // Draw text
      ctx.fillStyle = colors[i]
      ctx.font = 'bold 11px Courier New'
      ctx.textAlign = 'center'
      ctx.fillText(`${multipliers[i]}x`, x + slotWidth / 2, height - 15)
    }

    // Draw pegs (triangle structure)
    ctx.fillStyle = '#7E8B9E'
    for (let r = 0; r < pegRows; r++) {
      const count = r + 3
      const rowY = 50 + r * 35
      const rowWidth = (count - 1) * 30
      const startX = (width - rowWidth) / 2

      for (let c = 0; c < count; c++) {
        const x = startX + c * 30
        ctx.beginPath()
        ctx.arc(x, rowY, pegRadius, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    drawBoard(ctx)
  }, [])

  const dropBall = async () => {
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit first.' })
    }

    setMessage(null)
    setDropping(true)

    // Deduct bet
    const res = await fetch('/api/wallet/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, amount: betAmount })
    })
    const data = await res.json()

    if (!data.success) {
      setDropping(false)
      return setMessage({ type: 'error', text: data.error })
    }

    fetchWallet()

    // Precalculate ball path decisions (8 levels, left: -1, right: +1)
    const decisions = []
    let currentColumn = 1 // starts at index 1 of top row (which has 3 pegs: indices 0, 1, 2)
    const pathPoints = [{ x: width / 2, y: 20 }]

    for (let r = 0; r < pegRows; r++) {
      const count = r + 3
      const rowY = 50 + r * 35
      const rowWidth = (count - 1) * 30
      const startX = (width - rowWidth) / 2

      const step = Math.random() < 0.5 ? 0 : 1 // choose left/right peg collision
      currentColumn += step

      const x = startX + currentColumn * 30
      pathPoints.push({ x, y: rowY })
    }

    // Determine final landed slot index (0 to 8)
    const finalSlot = currentColumn
    const multiplier = multipliers[finalSlot]

    // Animation physics loop
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let currentStep = 0
    let progress = 0

    const animate = () => {
      if (currentStep >= pathPoints.length - 1) {
        // Ball reached slot
        finishDrop(multiplier)
        return
      }

      const p0 = pathPoints[currentStep]
      const p1 = pathPoints[currentStep + 1]

      // Cosine interpolation for organic drop bounce curve
      progress += 0.08
      if (progress >= 1.0) {
        progress = 0
        currentStep++
        // Animate peg flash if hit
      }

      const t = progress
      // Interpolate coordinates
      const tCosine = (1 - Math.cos(t * Math.PI)) / 2
      const x = p0.x + (p1.x - p0.x) * tCosine
      // Add a slight arc/bounce upwards in the middle of step
      const y = p0.y + (p1.y - p0.y) * t + Math.sin(t * Math.PI) * -6

      // Redraw board
      drawBoard(ctx)

      // Draw falling ball with neon glow
      ctx.shadowBlur = 8
      ctx.shadowColor = '#00ff88'
      ctx.fillStyle = '#00ff88'
      ctx.beginPath()
      ctx.arc(x, y, ballRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0 // reset

      requestAnimationFrame(animate)
    }

    animate()
  }

  const finishDrop = async (multiplier) => {
    // Credit payout
    const payRes = await fetch('/api/wallet/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, bet_amount: betAmount, multiplier })
    })
    const payData = await payRes.json()

    if (payData.success) {
      if (multiplier >= 1) {
        setMessage({ type: 'success', text: `🎉 Landed! +₱${(betAmount * multiplier).toFixed(2)} (${multiplier}x Payout!)` })
      } else {
        setMessage({ type: 'error', text: `😭 Landed in ${multiplier}x slot.` })
      }
    }
    setDropping(false)
    fetchWallet()
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '16px' }}>
      <h2>Plinko Peg Engine</h2>

      <div style={{ position: 'relative', background: '#0a0b0f', padding: '10px', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <canvas ref={canvasRef} width={width} height={height} style={{ borderRadius: '12px', display: 'block' }} />
      </div>

      {message && (
        <div style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', background: message.type === 'error' ? '#ff000022' : '#00ff8822', color: message.type === 'error' ? '#ff6666' : '#00ff88', border: `1px solid ${message.type === 'error' ? '#ff000033' : '#00ff8833'}` }}>
          {message.text}
        </div>
      )}

      {/* Bet selector */}
      <div style={{ display: 'flex', gap: '8px', width: '280px' }}>
        {[10, 50, 100, 500].map(amt => (
          <button key={amt} className="btn" onClick={() => setBetAmount(amt)} style={{ flex: 1, padding: '8px', fontSize: '12px', background: betAmount === amt ? 'var(--accent)' : '#000', color: betAmount === amt ? '#000' : '#fff', borderColor: betAmount === amt ? 'var(--accent)' : '#333' }} disabled={dropping}>
            ₱{amt}
          </button>
        ))}
      </div>

      <button className="btn primary" onClick={dropBall} disabled={dropping} style={{ width: '80%', maxWidth: '300px', padding: '16px', background: 'var(--accent)', color: '#000', fontWeight: 'bold' }}>
        {dropping ? '⚽ DROP ACTIVE...' : `Drop Ball - ₱${betAmount}`}
      </button>
    </div>
  )
}

// ==========================================
// 🃏 BLACKJACK ENGINE
// ==========================================
function BlackjackEngine({ user, wallet, fetchWallet }) {
  const [deck, setDeck] = useState([])
  const [playerHand, setPlayerHand] = useState([])
  const [dealerHand, setDealerHand] = useState([])
  const [gameStage, setGameStage] = useState('idle') // 'idle' | 'player-turn' | 'ended'
  const [betAmount, setBetAmount] = useState(10)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  // Standard deck creation
  const createDeck = () => {
    const suits = ['♠', '♥', '♦', '♣']
    const values = [
      { name: '2', score: 2 }, { name: '3', score: 3 }, { name: '4', score: 4 },
      { name: '5', score: 5 }, { name: '6', score: 6 }, { name: '7', score: 7 },
      { name: '8', score: 8 }, { name: '9', score: 9 }, { name: '10', score: 10 },
      { name: 'J', score: 10 }, { name: 'Q', score: 10 }, { name: 'K', score: 10 },
      { name: 'A', score: 11 }
    ]
    let newDeck = []
    suits.forEach(suit => {
      values.forEach(val => {
        newDeck.push({ suit, name: val.name, score: val.score })
      })
    })
    
    // Shuffle
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]]
    }
    return newDeck
  }

  // Calculate hand score with aces adjustment
  const calculateScore = (hand) => {
    let score = hand.reduce((acc, curr) => acc + curr.score, 0)
    let aces = hand.filter(c => c.name === 'A').length
    while (score > 21 && aces > 0) {
      score -= 10
      aces--
    }
    return score
  }

  const startGame = async () => {
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit first.' })
    }
    setLoading(true)
    setMessage(null)

    // Deduct bet
    const res = await fetch('/api/wallet/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, amount: betAmount })
    })
    const data = await res.json()

    if (!data.success) {
      setLoading(false)
      return setMessage({ type: 'error', text: data.error })
    }

    fetchWallet()

    // Deal cards
    const shufDeck = createDeck()
    const pHand = [shufDeck.pop(), shufDeck.pop()]
    const dHand = [shufDeck.pop(), shufDeck.pop()]

    setPlayerHand(pHand)
    setDealerHand(dHand)
    setDeck(shufDeck)
    
    const pScore = calculateScore(pHand)
    if (pScore === 21) {
      // Immediate blackjack win!
      finishGame(pHand, dHand, 'blackjack')
    } else {
      setGameStage('player-turn')
    }
    setLoading(false)
  }

  const hit = () => {
    if (gameStage !== 'player-turn') return
    const newDeck = [...deck]
    const nextCard = newDeck.pop()
    const newHand = [...playerHand, nextCard]

    setPlayerHand(newHand)
    setDeck(newDeck)

    const score = calculateScore(newHand)
    if (score > 21) {
      finishGame(newHand, dealerHand, 'bust')
    }
  }

  const stand = () => {
    if (gameStage !== 'player-turn') return
    setGameStage('ended')
    setLoading(true)

    // Dealer turn loop (must hit until 17)
    let dHand = [...dealerHand]
    let newDeck = [...deck]

    while (calculateScore(dHand) < 17) {
      dHand.push(newDeck.pop())
    }

    setDealerHand(dHand)
    setDeck(newDeck)

    const pScore = calculateScore(playerHand)
    const dScore = calculateScore(dHand)

    if (dScore > 21) {
      finishGame(playerHand, dHand, 'dealer-bust')
    } else if (pScore > dScore) {
      finishGame(playerHand, dHand, 'win')
    } else if (pScore === dScore) {
      finishGame(playerHand, dHand, 'push')
    } else {
      finishGame(playerHand, dHand, 'lose')
    }
    setLoading(false)
  }

  const finishGame = async (pHand, dHand, result) => {
    setGameStage('ended')
    
    let multiplier = 0
    let outcomeMsg = ''
    let isWin = false

    if (result === 'blackjack') {
      multiplier = 2.5 // Blackjack pays 3:2 (2.5x total payout)
      outcomeMsg = `🃏 Blackjack! +₱${(betAmount * 2.5).toFixed(2)}`
      isWin = true
    } else if (result === 'win' || result === 'dealer-bust') {
      multiplier = 2.0 // Win pays 1:1 (2.0x total payout)
      outcomeMsg = result === 'dealer-bust' ? `Dealer Busted! +₱${(betAmount * 2).toFixed(2)}` : `You Won! +₱${(betAmount * 2).toFixed(2)}`
      isWin = true
    } else if (result === 'push') {
      multiplier = 1.0 // Return bet
      outcomeMsg = 'Push! Bet refunded.'
      isWin = true
    } else if (result === 'bust') {
      outcomeMsg = `Bust! You score ${calculateScore(pHand)}. Lost bet.`
    } else if (result === 'lose') {
      outcomeMsg = `Lost! Dealer scores ${calculateScore(dHand)}. Lost bet.`
    }

    if (multiplier > 0) {
      const payRes = await fetch('/api/wallet/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, bet_amount: betAmount, multiplier })
      })
      await payRes.json()
    }

    setMessage({ type: isWin ? 'success' : 'error', text: outcomeMsg })
    fetchWallet()
  }

  const renderCard = (card, hidden = false) => {
    if (hidden) return (
      <div style={{ width: '60px', height: '90px', background: 'linear-gradient(135deg, #1f1200 0%, #3a2200 100%)', border: '2px solid var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: 'var(--accent)' }}>
        🎰
      </div>
    )

    const isRed = ['♥', '♦'].includes(card.suit)
    return (
      <div style={{ width: '60px', height: '90px', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: isRed ? 'red' : 'black', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px', lineHeight: 1 }}>{card.name}</div>
        <div style={{ alignSelf: 'center', fontSize: '24px', lineHeight: 1 }}>{card.suit}</div>
        <div style={{ alignSelf: 'flex-end', fontWeight: 'bold', fontSize: '14px', lineHeight: 1, transform: 'rotate(180deg)' }}>{card.name}</div>
      </div>
    )
  }

  const pScore = calculateScore(playerHand)
  const dScore = calculateScore(dealerHand)

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '16px' }}>
      <h2>Classic Blackjack</h2>

      {gameStage !== 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '360px', background: '#0a0b0f', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          {/* Dealer Hand */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '13px', marginBottom: '8px' }}>
              <span>Dealer Score: {gameStage === 'player-turn' ? '?' : dScore}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {dealerHand.map((c, i) => (
                <div key={i}>
                  {renderCard(c, gameStage === 'player-turn' && i === 1)}
                </div>
              ))}
            </div>
          </div>

          {/* Player Hand */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '13px', marginBottom: '8px' }}>
              <span>Your Score: {pScore}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {playerHand.map((c, i) => (
                <div key={i}>{renderCard(c)}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {message && (
        <div style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', background: message.type === 'error' ? '#ff000022' : '#00ff8822', color: message.type === 'error' ? '#ff6666' : '#00ff88', border: `1px solid ${message.type === 'error' ? '#ff000033' : '#00ff8833'}` }}>
          {message.text}
        </div>
      )}

      {gameStage === 'idle' || gameStage === 'ended' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '280px' }}>
          {/* Bet size */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[10, 50, 100, 500].map(amt => (
              <button key={amt} className="btn" onClick={() => setBetAmount(amt)} style={{ flex: 1, padding: '8px', fontSize: '12px', background: betAmount === amt ? 'var(--accent)' : '#000', color: betAmount === amt ? '#000' : '#fff', borderColor: betAmount === amt ? 'var(--accent)' : '#333' }} disabled={loading}>
                ₱{amt}
              </button>
            ))}
          </div>
          <button className="btn primary" onClick={startGame} style={{ padding: '16px', fontSize: '16px', fontWeight: 'bold' }} disabled={loading}>
            {loading ? 'Dealing...' : `BET ₱${betAmount} & DEAL`}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '280px' }}>
          <button className="btn primary" onClick={hit} style={{ flex: 1, padding: '14px', background: 'var(--accent)', color: '#000', fontWeight: 'bold' }}>Hit</button>
          <button className="btn" onClick={stand} style={{ flex: 1, padding: '14px' }}>Stand</button>
        </div>
      )}
    </div>
  )
}

// ==========================================
// 🎰 SLOTS ENGINE (Gold Slots, Super Ace, Fortune Gems)
// ==========================================
function SlotsEngine({ title, icon, symbolsPool, borderCol, user, wallet, fetchWallet }) {
  const [spinning, setSpinning] = useState(false)
  const [symbols, setSymbols] = useState([icon, icon, icon])
  const [betAmount, setBetAmount] = useState(10)
  const [message, setMessage] = useState(null)

  const spin = async () => {
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit first.' })
    }
    setMessage(null)
    setSpinning(true)

    // Deduct bet
    const betRes = await fetch('/api/wallet/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, amount: betAmount })
    })
    const betData = await betRes.json()

    if (!betData.success) {
      setSpinning(false)
      return setMessage({ type: 'error', text: betData.error || 'Failed to place bet.' })
    }

    // Update wallet locally for immediate feedback
    fetchWallet()

    // Spin animation delay
    setTimeout(async () => {
      setSpinning(false)
      const rolledSymbols = [
        symbolsPool[Math.floor(Math.random() * symbolsPool.length)],
        symbolsPool[Math.floor(Math.random() * symbolsPool.length)],
        symbolsPool[Math.floor(Math.random() * symbolsPool.length)]
      ]
      setSymbols(rolledSymbols)

      // Win evaluation
      const uniqueCount = new Set(rolledSymbols).size
      let multiplier = 0

      if (uniqueCount === 1) {
        multiplier = 10 // 3 matching symbols = 10x payout
      } else if (uniqueCount === 2) {
        multiplier = 2  // 2 matching symbols = 2x payout
      }

      if (multiplier > 0) {
        // Credit payout
        const payoutRes = await fetch('/api/wallet/payout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, bet_amount: betAmount, multiplier })
        })
        const payoutData = await payoutRes.json()
        if (payoutData.success) {
          setMessage({ type: 'success', text: `🎉 WINNER! +₱${(betAmount * multiplier).toFixed(2)} (${multiplier}x Payout!)` })
        }
      } else {
        setMessage({ type: 'error', text: '😭 Lost! Try again!' })
      }
      fetchWallet()
    }, 1500)
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '16px' }}>
      <div style={{ fontSize: '64px', animation: spinning ? 'spin-anim 0.2s linear infinite' : 'none' }}>{icon}</div>
      <h2>{title} Engine</h2>
      
      <div style={{ padding: '24px', border: `2px solid ${borderCol}`, borderRadius: '16px', background: '#111', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '48px', margin: '16px 0', background: '#000', padding: '16px', borderRadius: '8px', border: '1px solid #222' }}>
          <span className={spinning ? 'spin-anim' : ''}>{symbols[0]}</span>
          <span className={spinning ? 'spin-anim' : ''}>{symbols[1]}</span>
          <span className={spinning ? 'spin-anim' : ''}>{symbols[2]}</span>
        </div>

        {message && (
          <div style={{ padding: '8px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', background: message.type === 'error' ? '#ff000022' : '#00ff8822', color: message.type === 'error' ? '#ff6666' : '#00ff88' }}>
            {message.text}
          </div>
        )}

        {/* Bet Selectors */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {[10, 50, 100, 500].map(amt => (
            <button key={amt} className="btn" onClick={() => setBetAmount(amt)} style={{ flex: 1, padding: '8px', fontSize: '12px', background: betAmount === amt ? 'var(--accent)' : '#000', color: betAmount === amt ? '#000' : '#fff', borderColor: betAmount === amt ? 'var(--accent)' : '#333' }}>
              ₱{amt}
            </button>
          ))}
        </div>

        <button 
          className="btn primary" 
          onClick={spin}
          style={{ width: '100%', padding: '16px', fontSize: '20px', background: 'var(--accent)', color: '#000', fontWeight: 'bold' }}
          disabled={spinning}
        >
          {spinning ? 'SPINNING...' : `SPIN - ₱${betAmount}`}
        </button>
      </div>
    </div>
  )
}

// ==========================================
// 💣 MINESWEEPER ENGINE
// ==========================================
function MinesweeperEngine({ user, wallet, fetchWallet }) {
  const [grid, setGrid] = useState(Array(25).fill('❓'))
  const [bombs, setBombs] = useState([])
  const [active, setActive] = useState(false)
  const [betAmount, setBetAmount] = useState(10)
  const [multiplier, setMultiplier] = useState(1.0)
  const [revealedCount, setRevealedCount] = useState(0)
  const [message, setMessage] = useState(null)
  const [processing, setProcessing] = useState(false)

  const startGame = async () => {
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit first.' })
    }
    setProcessing(true)
    setMessage(null)

    // Deduct bet
    const res = await fetch('/api/wallet/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, amount: betAmount })
    })
    const data = await res.json()

    if (!data.success) {
      setProcessing(false)
      return setMessage({ type: 'error', text: data.error || 'Failed to place bet.' })
    }

    // Set 4 random bomb positions out of 25
    const positions = []
    while (positions.length < 4) {
      const idx = Math.floor(Math.random() * 25)
      if (!positions.includes(idx)) positions.push(idx)
    }

    setBombs(positions)
    setGrid(Array(25).fill('❓'))
    setMultiplier(1.0)
    setRevealedCount(0)
    setActive(true)
    setProcessing(false)
    fetchWallet()
  }

  const reveal = (idx) => {
    if (!active || grid[idx] !== '❓' || processing) return
    
    const isBomb = bombs.includes(idx)
    const newGrid = [...grid]
    
    if (isBomb) {
      newGrid[idx] = '💣'
      // Reveal all bombs
      bombs.forEach(b => { newGrid[b] = '💣' })
      setGrid(newGrid)
      setActive(false)
      setMessage({ type: 'error', text: '💥 BOOM! You hit a bomb and lost your bet!' })
      fetchWallet()
    } else {
      newGrid[idx] = '💎'
      setGrid(newGrid)
      
      const newCount = revealedCount + 1
      setRevealedCount(newCount)
      
      // Calculate multiplier curve based on number of gems found
      let nextMult = 1.2
      if (newCount === 2) nextMult = 1.5
      else if (newCount === 3) nextMult = 2.0
      else if (newCount === 4) nextMult = 3.0
      else if (newCount === 5) nextMult = 5.0
      else if (newCount > 5) nextMult = parseFloat((5.0 + (newCount - 5) * 1.5).toFixed(1))
      
      setMultiplier(nextMult)
    }
  }

  const cashOut = async () => {
    if (!active || processing) return
    setProcessing(true)

    const res = await fetch('/api/wallet/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        bet_amount: betAmount,
        multiplier: multiplier
      })
    })
    const data = await res.json()

    if (data.success) {
      setActive(false)
      setMessage({ type: 'success', text: `💰 Successfully Cashed Out! +₱${(betAmount * multiplier).toFixed(2)}` })
    }
    setProcessing(false)
    fetchWallet()
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '16px' }}>
      <h2>Minesweeper Engine (4 Bombs)</h2>
      {active && (
        <div style={{ fontSize: '18px', color: 'var(--accent)', fontWeight: 'bold' }}>
          Current Cash Out: ₱{(betAmount * multiplier).toFixed(2)} ({multiplier}x)
        </div>
      )}
      
      {message && (
        <div style={{ padding: '10px 16px', borderRadius: '8px', fontSize: '14px', background: message.type === 'error' ? '#ff000022' : '#00ff8822', color: message.type === 'error' ? '#ff6666' : '#00ff88' }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', background: '#111', padding: '16px', borderRadius: '12px', border: '1px solid #333' }}>
        {grid.map((cell, i) => (
          <div key={i} onClick={() => reveal(i)} style={{ width: '50px', height: '50px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', cursor: active ? 'pointer' : 'default', borderRadius: '8px', border: '1px solid #222', transition: 'all 0.15s' }}>
            {cell}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', width: '260px' }}>
        {!active ? (
          <>
            <select value={betAmount} onChange={e => setBetAmount(Number(e.target.value))} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#000', color: '#fff', fontSize: '14px', flex: 1 }}>
              <option value="10">₱10</option>
              <option value="50">₱50</option>
              <option value="100">₱100</option>
              <option value="500">₱500</option>
            </select>
            <button className="btn primary" onClick={startGame} style={{ padding: '16px', flex: 2 }} disabled={processing}>
              {processing ? 'Loading...' : `BET ₱${betAmount}`}
            </button>
          </>
        ) : (
          <button className="btn primary" onClick={cashOut} style={{ width: '100%', padding: '16px', background: '#00ff88', color: '#000', fontWeight: 'bold' }} disabled={processing}>
            {processing ? 'Collecting...' : `CASH OUT ₱${(betAmount * multiplier).toFixed(2)}`}
          </button>
        )}
      </div>
    </div>
  )
}

// ==========================================
// 🐠 FISHING JOY ENGINE
// ==========================================
function FishingEngine({ user, wallet, fetchWallet }) {
  const [ammo, setAmmo] = useState(0)
  const [sessionWin, setSessionWin] = useState(0)
  const [lasers, setLasers] = useState([])
  const [hits, setHits] = useState([])
  const [betAmount] = useState(10) // ₱10 to buy 10 shots
  const [message, setMessage] = useState(null)
  const [processing, setProcessing] = useState(false)
  
  const buyAmmo = async () => {
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit first.' })
    }
    setProcessing(true)
    setMessage(null)

    const res = await fetch('/api/wallet/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, amount: betAmount })
    })
    const data = await res.json()

    if (data.success) {
      setAmmo(10)
      setSessionWin(0)
      setMessage({ type: 'success', text: '🔋 Ammo loaded! Tap the screen to shoot nets!' })
    } else {
      setMessage({ type: 'error', text: data.error })
    }
    setProcessing(false)
    fetchWallet()
  }

  const collectWinnings = async () => {
    if (sessionWin <= 0 || processing) return
    setProcessing(true)

    // Calculate multiplier (sessionWin / betAmount)
    const multiplier = parseFloat((sessionWin / betAmount).toFixed(4))

    const res = await fetch('/api/wallet/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        bet_amount: betAmount,
        multiplier: multiplier
      })
    })
    const data = await res.json()

    if (data.success) {
      setMessage({ type: 'success', text: `🎉 Payout collected! +₱${sessionWin.toFixed(2)} added to wallet.` })
      setSessionWin(0)
      setAmmo(0)
    }
    setProcessing(false)
    fetchWallet()
  }

  const shoot = (e) => {
    if (ammo <= 0 || processing) return
    
    // Decrement ammo
    setAmmo(a => a - 1)

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Add laser/net shot animation
    const id = Date.now()
    setLasers(l => [...l, { id, x, y }])
    setTimeout(() => setLasers(l => l.filter(laser => laser.id !== id)), 300)

    // Hit chance (40%)
    const isHit = Math.random() < 0.40
    if (isHit) {
      const payout = Math.floor(Math.random() * 5) + 1 // Earn ₱1 to ₱5 per hit
      setSessionWin(s => s + payout)
      
      // Floating hit text
      setHits(h => [...h, { id, x, y, payout }])
      setTimeout(() => setHits(h => h.filter(hit => hit.id !== id)), 1000)
    }
  }

  // Auto collect if ammo is 0 and they have winnings pending
  useEffect(() => {
    if (ammo === 0 && sessionWin > 0 && !processing) {
      collectWinnings()
    }
  }, [ammo])

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '16px' }}>
      <h2>Fishing Joy Engine</h2>
      
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', color: 'var(--accent)', fontWeight: 'bold' }}>
        <span>🔋 Ammo: {ammo} Shots</span>
        <span>💵 Current Win: ₱{sessionWin.toFixed(2)}</span>
      </div>

      {message && (
        <div style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', background: message.type === 'error' ? '#ff000022' : '#00ff8822', color: message.type === 'error' ? '#ff6666' : '#00ff88' }}>
          {message.text}
        </div>
      )}

      <div style={{ position: 'relative', width: '300px', height: '360px', background: 'linear-gradient(to bottom, #001f3f, #0074D9)', borderRadius: '16px', overflow: 'hidden', border: '2px solid #00aaff', cursor: ammo > 0 ? 'crosshair' : 'not-allowed' }} onClick={shoot}>
        
        {/* Mock floating fish */}
        <div style={{ position: 'absolute', top: '80px', left: '80px', fontSize: '32px' }}>🐠</div>
        <div style={{ position: 'absolute', top: '180px', left: '160px', fontSize: '48px' }}>🦈</div>
        <div style={{ position: 'absolute', top: '260px', left: '40px', fontSize: '24px' }}>🦐</div>
        
        {/* Lasers */}
        {lasers.map(l => (
          <div key={l.id} style={{ position: 'absolute', left: '150px', bottom: '0', width: '2px', height: '360px', background: 'yellow', transformOrigin: 'bottom', transform: `rotate(${Math.atan2(l.x - 150, 360 - l.y) * 180 / Math.PI}deg)`, opacity: 0.8, pointerEvents: 'none' }} />
        ))}

        {/* Hits */}
        {hits.map(h => (
          <div key={h.id} style={{ position: 'absolute', left: h.x - 20, top: h.y - 20, color: '#00ff88', fontWeight: 'bold', fontSize: '20px', pointerEvents: 'none', zIndex: 20 }}>
            +₱{h.payout}
          </div>
        ))}
        
        {ammo === 0 && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
            No Ammo! Buy Pack to play!
          </div>
        )}
      </div>

      <div>
        {ammo === 0 ? (
          <button className="btn primary" onClick={buyAmmo} style={{ padding: '16px', background: 'var(--accent)', color: '#000', fontWeight: 'bold' }} disabled={processing}>
            {processing ? 'Loading...' : `🔋 BUY 10 AMMO — ₱${betAmount}`}
          </button>
        ) : (
          <button className="btn" onClick={collectWinnings} style={{ padding: '16px', borderColor: '#00ff88', color: '#00ff88' }} disabled={processing || sessionWin <= 0}>
            {processing ? 'Collecting...' : `📥 Collect Payout ₱${sessionWin.toFixed(2)}`}
          </button>
        )}
      </div>
    </div>
  )
}

// ==========================================
// 🪙 COIN FLIP ENGINE
// ==========================================
function CoinFlipEngine({ user, wallet, fetchWallet }) {
  const [flipping, setFlipping] = useState(false)
  const [result, setResult] = useState(null)
  const [betAmount, setBetAmount] = useState(10)
  const [message, setMessage] = useState(null)

  const flip = async (choice) => {
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit first.' })
    }
    setMessage(null)
    setResult(null)
    setFlipping(true)

    // Deduct bet
    const res = await fetch('/api/wallet/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, amount: betAmount })
    })
    const data = await res.json()

    if (!data.success) {
      setFlipping(false)
      return setMessage({ type: 'error', text: data.error })
    }

    fetchWallet()

    // Flip animation
    setTimeout(async () => {
      setFlipping(false)
      const isWin = Math.random() < 0.46 // Enforce 46% win rate (house edge)
      const rolled = isWin ? choice : (choice === 'Heads' ? 'Tails' : 'Heads')
      setResult(rolled)

      if (isWin) {
        // Credit payout 2x
        const payRes = await fetch('/api/wallet/payout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, bet_amount: betAmount, multiplier: 2.0 })
        })
        const payData = await payRes.json()
        if (payData.success) {
          setMessage({ type: 'success', text: `🎉 WINNER! Double Cash! +₱${(betAmount * 2).toFixed(2)}` })
        }
      } else {
        setMessage({ type: 'error', text: `😭 Lost! Landed on ${rolled}` })
      }
      fetchWallet()
    }, 1500)
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '16px' }}>
      <h2>Coin Flip Engine</h2>
      <div className={flipping ? 'coin-spin' : ''} style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(45deg, #ffd700, #ffaa00)', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '56px', margin: '16px 0', boxShadow: '0 0 20px rgba(240, 192, 89, 0.4)' }}>
        {result === 'Heads' ? '👤' : (result === 'Tails' ? '🦅' : '🪙')}
      </div>
      
      {message && (
        <div style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', background: message.type === 'error' ? '#ff000022' : '#00ff8822', color: message.type === 'error' ? '#ff6666' : '#00ff88' }}>
          {message.text}
        </div>
      )}

      {/* Bet Selectors */}
      <div style={{ display: 'flex', gap: '8px', width: '220px', marginBottom: '8px' }}>
        {[10, 50, 100, 500].map(amt => (
          <button key={amt} className="btn" onClick={() => setBetAmount(amt)} style={{ flex: 1, padding: '6px', fontSize: '12px', background: betAmount === amt ? 'var(--accent)' : '#000', color: betAmount === amt ? '#000' : '#fff', borderColor: betAmount === amt ? 'var(--accent)' : '#333' }}>
            ₱{amt}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '16px', width: '100%', maxWidth: '300px' }}>
        <button className="btn primary" style={{ flex: 1, background: 'var(--accent)', color: '#000', fontWeight: 'bold' }} onClick={() => flip('Heads')} disabled={flipping}>Bet Heads</button>
        <button className="btn primary" style={{ flex: 1, background: 'var(--accent)', color: '#000', fontWeight: 'bold' }} onClick={() => flip('Tails')} disabled={flipping}>Bet Tails</button>
      </div>
    </div>
  )
}

// ==========================================
// 🎲 DICE ENGINE
// ==========================================
function DiceEngine({ user, wallet, fetchWallet }) {
  const [target, setTarget] = useState(50)
  const [roll, setRoll] = useState(null)
  const [betAmount, setBetAmount] = useState(10)
  const [message, setMessage] = useState(null)
  const [rolling, setRolling] = useState(false)
  
  const play = async () => {
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit first.' })
    }
    setMessage(null)
    setRolling(true)
    setRoll(null)

    // Deduct bet
    const res = await fetch('/api/wallet/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, amount: betAmount })
    })
    const data = await res.json()

    if (!data.success) {
      setRolling(false)
      return setMessage({ type: 'error', text: data.error })
    }

    fetchWallet()

    // Roll delay
    setTimeout(async () => {
      setRolling(false)
      const rolledVal = Math.floor(Math.random() * 100) + 1
      setRoll(rolledVal)

      const isWin = rolledVal < target
      if (isWin) {
        const multiplier = parseFloat((100 / target * 0.98).toFixed(2))
        const payRes = await fetch('/api/wallet/payout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, bet_amount: betAmount, multiplier })
        })
        const payData = await payRes.json()
        if (payData.success) {
          setMessage({ type: 'success', text: `🎉 WINNER! Rolled ${rolledVal} (Under ${target})! +₱${(betAmount * multiplier).toFixed(2)}` })
        }
      } else {
        setMessage({ type: 'error', text: `😭 Lost! Rolled ${rolledVal} (Over/Equal ${target})` })
      }
      fetchWallet()
    }, 1000)
  }

  const multiplierVal = (100 / target * 0.98).toFixed(2)

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '16px' }}>
      <h2>Crypto Dice Engine</h2>
      <div style={{ fontSize: '64px', margin: '16px 0', color: rolling ? '#555' : roll === null ? '#fff' : (roll < target ? '#00ff88' : '#ff4444'), animation: rolling ? 'spin-anim 0.2s linear infinite' : 'none' }}>
        {rolling ? '🎲' : roll === null ? '🎲' : roll}
      </div>

      {message && (
        <div style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', background: message.type === 'error' ? '#ff000022' : '#00ff8822', color: message.type === 'error' ? '#ff6666' : '#00ff88' }}>
          {message.text}
        </div>
      )}

      <div style={{ width: '90%', maxWidth: '400px', background: '#111', padding: '24px', borderRadius: '16px', border: '1px solid #222' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>Roll Under {target}</span>
          <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{multiplierVal}x Payout</span>
        </div>
        <input type="range" min="5" max="95" value={target} onChange={e => setTarget(Number(e.target.value))} style={{ width: '100%', marginBottom: '20px' }} disabled={rolling} />
        
        {/* Bet Selectors */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {[10, 50, 100, 500].map(amt => (
            <button key={amt} className="btn" onClick={() => setBetAmount(amt)} style={{ flex: 1, padding: '8px', fontSize: '12px', background: betAmount === amt ? 'var(--accent)' : '#000', color: betAmount === amt ? '#000' : '#fff', borderColor: betAmount === amt ? 'var(--accent)' : '#333' }} disabled={rolling}>
              ₱{amt}
            </button>
          ))}
        </div>

        <button className="btn primary" onClick={play} style={{ width: '100%', padding: '16px', background: 'var(--accent)', color: '#000', fontWeight: 'bold' }} disabled={rolling}>
          {rolling ? 'ROLLING...' : `Roll Dice — Bet ₱${betAmount}`}
        </button>
      </div>
    </div>
  )
}

// ==========================================
// 🎡 MINI ROULETTE ENGINE
// ==========================================
function RouletteEngine({ user, wallet, fetchWallet }) {
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const [betAmount, setBetAmount] = useState(10)
  const [betChoice, setBetChoice] = useState('red') // 'red' | 'black' | 'green'
  const [message, setMessage] = useState(null)
  
  const play = async () => {
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit first.' })
    }
    setMessage(null)
    setResult(null)
    setSpinning(true)

    // Deduct bet
    const res = await fetch('/api/wallet/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, amount: betAmount })
    })
    const data = await res.json()

    if (!data.success) {
      setSpinning(false)
      return setMessage({ type: 'error', text: data.error })
    }

    fetchWallet()

    // Slide/Spin delay
    setTimeout(async () => {
      setSpinning(false)
      
      const num = Math.floor(Math.random() * 13)
      let landed = 'red'
      if (num === 0) landed = 'green'
      else if (num % 2 === 0) landed = 'black'

      setResult(landed)

      const isWin = landed === betChoice
      if (isWin) {
        const multiplier = betChoice === 'green' ? 12.0 : 2.0 
        const payRes = await fetch('/api/wallet/payout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, bet_amount: betAmount, multiplier })
        })
        const payData = await payRes.json()
        if (payData.success) {
          setMessage({ type: 'success', text: `🎉 WINNER! Landed on ${landed.toUpperCase()}! +₱${(betAmount * multiplier).toFixed(2)}` })
        }
      } else {
        setMessage({ type: 'error', text: `😭 Lost! Landed on ${landed.toUpperCase()}` })
      }
      fetchWallet()
    }, 2000)
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '16px' }}>
      <h2>Mini Roulette Engine</h2>
      <div style={{ width: '180px', height: '180px', borderRadius: '50%', border: '6px solid #333', background: `conic-gradient(#ff4444 0% 46%, #44ff44 46% 54%, #111 54% 100%)`, position: 'relative', animation: spinning ? 'spin-anim 0.4s linear infinite' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(0,0,0,0.6)' }}>
        <div style={{ width: '130px', height: '130px', borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
           {result === 'red' ? '🔴' : (result === 'black' ? '⚫' : (result === 'green' ? '🟢' : '🎡'))}
        </div>
      </div>

      {message && (
        <div style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', background: message.type === 'error' ? '#ff000022' : '#00ff8822', color: message.type === 'error' ? '#ff6666' : '#00ff88' }}>
          {message.text}
        </div>
      )}

      {/* Bet Choice selection */}
      <div style={{ display: 'flex', gap: '8px', width: '280px', justifyContent: 'center' }}>
        {['red', 'black', 'green'].map(c => (
          <button key={c} onClick={() => setBetChoice(c)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: c === 'red' ? '#ff4444' : c === 'black' ? '#222' : '#00ff88', color: c === 'green' ? '#000' : '#fff', fontWeight: 'bold', cursor: 'pointer', outline: betChoice === c ? '3px solid #fff' : 'none', opacity: betChoice === c ? 1 : 0.6 }}>
            {c === 'red' ? '🔴 Red (2x)' : c === 'black' ? '⚫ Black (2x)' : '🟢 Green (12x)'}
          </button>
        ))}
      </div>

      {/* Bet Selectors */}
      <div style={{ display: 'flex', gap: '8px', width: '280px', marginTop: '4px' }}>
        {[10, 50, 100, 500].map(amt => (
          <button key={amt} className="btn" onClick={() => setBetAmount(amt)} style={{ flex: 1, padding: '8px', fontSize: '12px', background: betAmount === amt ? 'var(--accent)' : '#000', color: betAmount === amt ? '#000' : '#fff', borderColor: betAmount === amt ? 'var(--accent)' : '#333' }} disabled={spinning}>
            ₱{amt}
          </button>
        ))}
      </div>

      <button className="btn primary" onClick={play} disabled={spinning} style={{ width: '80%', maxWidth: '300px', padding: '16px', background: 'var(--accent)', color: '#000', fontWeight: 'bold', marginTop: '8px' }}>
        {spinning ? 'SPINNING...' : `Spin Wheel — Bet ₱${betAmount}`}
      </button>
    </div>
  )
}

// ==========================================
// 🛡️ MAIN PLAY GAME ROUTER PAGE
// ==========================================
export default function PlayGame() {
  const router = useRouter()
  const { gameId } = router.query
  const { user, loading } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const fetchWallet = async () => {
    if (!user) return
    const { data } = await supabase.from('wallets').select('*').eq('user_id', user.id).single()
    setWallet(data)
  }

  useEffect(() => {
    if (user) fetchWallet()
  }, [user])

  if (loading) return <div style={{ color: 'white', padding: '40px', textAlign: 'center' }}>Loading Game...</div>

  if (!user) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔒</div>
        <h2>Authentication Required</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>You must log in to play {gameId} and manage your wallet.</p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="btn primary" onClick={() => setIsAuthModalOpen(true)}>Log In / Sign Up</button>
          <Link href="/"><button className="btn">Back to Home</button></Link>
        </div>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </div>
    )
  }

  const renderGame = () => {
    const props = { user, wallet, fetchWallet }
    switch (gameId) {
      case 'crash': return <CrashEngine />
      case 'plinko': return <PlinkoEngine {...props} />
      case 'blackjack': return <BlackjackEngine {...props} />
      case 'gold-slots': return <SlotsEngine title="Gold Slots" icon="🎰" symbolsPool={['🍒', '🍋', '🔔', '💎', '7️⃣']} borderCol="var(--accent)" {...props} />
      case 'super-ace': return <SlotsEngine title="Super Ace" icon="🂡" symbolsPool={['♠️', '♥️', '♣️', '♦️', '🃏']} borderCol="#ff4444" {...props} />
      case 'fortune-gems': return <SlotsEngine title="Fortune Gems" icon="💎" symbolsPool={['💎', '🟢', '🔴', '🔵', '🟣']} borderCol="#44ff44" {...props} />
      case 'minesweeper': return <MinesweeperEngine {...props} />
      case 'fishing-joy': return <FishingEngine {...props} />
      case 'coin-flip': return <CoinFlipEngine {...props} />
      case 'crypto-dice': return <DiceEngine {...props} />
      case 'mini-roulette': return <RouletteEngine {...props} />
      default: return <div style={{ padding: '40px' }}>Game "{gameId}" not found.</div>
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      
      {/* Premium Game Navigation Header with Live Wallet Display */}
      <div style={{ padding: '12px 20px', background: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
        <div style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '18px' }}>
          🎮 {gameId?.toUpperCase().replace('-', ' ')}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {wallet && (
            <div style={{ background: '#1c1c1c', border: '1px solid #333', padding: '6px 16px', borderRadius: '16px', fontSize: '14px', fontWeight: 'bold' }}>
              💰 Wallet: <span style={{ color: 'var(--accent)' }}>₱{parseFloat(wallet.balance).toFixed(2)}</span>
            </div>
          )}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button className="btn small">Exit</button>
          </Link>
        </div>
      </div>
      
      {renderGame()}
    </div>
  )
}

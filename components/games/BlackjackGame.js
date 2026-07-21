import React, { useState, useEffect } from 'react'

export default function BlackjackGame({ user, wallet, fetchWallet }) {
  const [deck, setDeck] = useState([])
  const [playerHand, setPlayerHand] = useState([])
  const [dealerHand, setDealerHand] = useState([])
  const [gameStage, setGameStage] = useState('idle') // 'idle' | 'player-turn' | 'dealer-turn' | 'ended'
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
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit.' })
    }
    setLoading(true)
    setMessage(null)
    setPlayerHand([])
    setDealerHand([])

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

    // Slide-in animations for dealt cards
    const shufDeck = createDeck()
    const cardP1 = shufDeck.pop()
    const cardD1 = shufDeck.pop()
    const cardP2 = shufDeck.pop()
    const cardD2 = shufDeck.pop()

    // Deal slowly for high quality visual dealer feel
    setTimeout(() => setPlayerHand([cardP1]), 150)
    setTimeout(() => setDealerHand([cardD1]), 300)
    setTimeout(() => setPlayerHand(prev => [...prev, cardP2]), 450)
    setTimeout(() => {
      setDealerHand(prev => [...prev, cardD2])
      
      const pScore = calculateScore([cardP1, cardP2])
      if (pScore === 21) {
        finishGame([cardP1, cardP2], [cardD1, cardD2], 'blackjack')
      } else {
        setGameStage('player-turn')
      }
      setLoading(false)
    }, 600)

    setDeck(shufDeck)
  }

  const hit = () => {
    if (gameStage !== 'player-turn' || loading) return
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

  const stand = async () => {
    if (gameStage !== 'player-turn' || loading) return
    setGameStage('dealer-turn')
    setLoading(true)

    // Dynamic dealer deal delay simulation
    let dHand = [...dealerHand]
    let newDeck = [...deck]

    const dealerHitLoop = () => {
      if (calculateScore(dHand) < 17) {
        setTimeout(() => {
          dHand.push(newDeck.pop())
          setDealerHand([...dHand])
          setDeck([...newDeck])
          dealerHitLoop()
        }, 800) // 800ms delay between cards
      } else {
        resolveDealerStage(dHand)
      }
    }

    dealerHitLoop()
  }

  const resolveDealerStage = (finalDHand) => {
    const pScore = calculateScore(playerHand)
    const dScore = calculateScore(finalDHand)

    if (dScore > 21) {
      finishGame(playerHand, finalDHand, 'dealer-bust')
    } else if (pScore > dScore) {
      finishGame(playerHand, finalDHand, 'win')
    } else if (pScore === dScore) {
      finishGame(playerHand, finalDHand, 'push')
    } else {
      finishGame(playerHand, finalDHand, 'lose')
    }
    setLoading(false)
  }

  const finishGame = async (pHand, dHand, result) => {
    setGameStage('ended')
    
    let multiplier = 0
    let outcomeMsg = ''
    let isWin = false

    if (result === 'blackjack') {
      multiplier = 2.5
      outcomeMsg = `🃏 Blackjack! Double Cash! +₱${(betAmount * 2.5).toFixed(2)}`
      isWin = true
    } else if (result === 'win' || result === 'dealer-bust') {
      multiplier = 2.0
      outcomeMsg = result === 'dealer-bust' ? `Dealer Busted! You Won! +₱${(betAmount * 2).toFixed(2)}` : `You Won! +₱${(betAmount * 2).toFixed(2)}`
      isWin = true
    } else if (result === 'push') {
      multiplier = 1.0
      outcomeMsg = 'Push! Bet refunded.'
      isWin = true
    } else if (result === 'bust') {
      outcomeMsg = `Bust! You score ${calculateScore(pHand)}. Lost bet.`
    } else if (result === 'lose') {
      outcomeMsg = `Lost! Dealer scores ${calculateScore(dHand)}. Lost bet.`
    }

    if (multiplier > 0) {
      await fetch('/api/wallet/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, bet_amount: betAmount, multiplier })
      })
    }

    setMessage({ type: isWin ? 'success' : 'error', text: outcomeMsg })
    fetchWallet()
  }

  const renderCard = (card, idx, isDealerHidden = false) => {
    if (isDealerHidden) {
      return (
        <div 
          key={idx}
          className="card-dealing"
          style={{ 
            width: '64px', 
            height: '96px', 
            background: 'linear-gradient(135deg, #1f1200 0%, #3a2200 100%)', 
            border: '2px solid var(--accent)', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '24px', 
            color: 'var(--accent)',
            boxShadow: '0 4px 10px rgba(0,0,0,0.4)'
          }}
        >
          🎰
        </div>
      )
    }

    const isRed = ['♥', '♦'].includes(card.suit)
    return (
      <div 
        key={idx}
        className="card-dealing"
        style={{ 
          width: '64px', 
          height: '96px', 
          background: '#fff', 
          border: '1px solid #ddd', 
          borderRadius: '10px', 
          padding: '8px', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between', 
          color: isRed ? 'red' : 'black', 
          boxShadow: '0 6px 12px rgba(0,0,0,0.3)',
          position: 'relative'
        }}
      >
        <div style={{ fontWeight: 'bold', fontSize: '13px', lineHeight: 1 }}>{card.name}</div>
        <div style={{ alignSelf: 'center', fontSize: '26px', lineHeight: 1 }}>{card.suit}</div>
        <div style={{ alignSelf: 'flex-end', fontWeight: 'bold', fontSize: '13px', lineHeight: 1, transform: 'rotate(180deg)' }}>{card.name}</div>
      </div>
    )
  }

  const pScore = calculateScore(playerHand)
  const dScore = calculateScore(dealerHand)

  return (
    <div className="game-screen-wrapper" style={{ background: 'radial-gradient(circle at center, #0a2517 0%, #030f09 100%) !important' }}>
      <div className="game-glass-panel" style={{ maxWidth: '400px', border: '1px solid rgba(0, 230, 118, 0.25)', background: 'rgba(5, 17, 10, 0.7) !important' }}>
        <h2 className="game-title-neon" style={{
          color: '#00e676',
          textShadow: '0 0 15px rgba(0, 230, 118, 0.6), 0 2px 4px #000'
        }}>
          🃏 BETPK BLACKJACK
        </h2>

        {/* Main Table Hands Grid */}
        {(playerHand.length > 0 || dealerHand.length > 0) && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            width: '100%',
            background: 'rgba(0, 0, 0, 0.65)',
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)',
            marginBottom: '20px',
            position: 'relative'
          }}>
            {/* Dealer Hand */}
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                Dealer Hand {gameStage !== 'player-turn' && dScore > 0 ? `(${dScore})` : ''}
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', minHeight: '84px', alignItems: 'center' }}>
                {dealerHand.map((card, i) => (
                  <div 
                    key={i} 
                    className="card-dealing"
                    style={{
                      width: '56px',
                      height: '80px',
                      background: card.hidden ? 'linear-gradient(135deg, #d84315 0%, #bf360c 100%)' : '#fff',
                      borderRadius: '8px',
                      border: card.hidden ? '2px solid #fff' : 'none',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: card.hidden ? '24px' : '22px',
                      color: card.hidden ? '#fff' : (card.suit === '♥' || card.suit === '♦' ? '#ff1744' : '#000'),
                      position: 'relative'
                    }}
                  >
                    {!card.hidden ? (
                      <>
                        <span style={{ position: 'absolute', top: '4px', left: '6px', fontSize: '11px', fontWeight: 'bold' }}>{card.name}</span>
                        <span>{card.suit}</span>
                      </>
                    ) : '🃏'}
                  </div>
                ))}
              </div>
            </div>

            {/* Player Hand */}
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                Your Hand ({pScore})
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', minHeight: '84px', alignItems: 'center' }}>
                {playerHand.map((card, i) => (
                  <div 
                    key={i} 
                    className="card-dealing"
                    style={{
                      width: '56px',
                      height: '80px',
                      background: '#fff',
                      borderRadius: '8px',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      color: card.suit === '♥' || card.suit === '♦' ? '#ff1744' : '#000',
                      position: 'relative'
                    }}
                  >
                    <span style={{ position: 'absolute', top: '4px', left: '6px', fontSize: '11px', fontWeight: 'bold' }}>{card.name}</span>
                    <span>{card.suit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message HUD */}
        {message && (
          <div style={{
            padding: '10px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            marginBottom: '16px',
            background: message.type === 'error' ? 'rgba(255, 23, 68, 0.1)' : 'rgba(0, 230, 118, 0.1)',
            color: message.type === 'error' ? '#ff1744' : '#00e676',
            border: `1px solid ${message.type === 'error' ? 'rgba(255, 23, 68, 0.2)' : 'rgba(0, 230, 118, 0.2)'}`,
            fontWeight: 'bold'
          }}>
            {message.text}
          </div>
        )}

        {/* Action controllers */}
        {gameStage === 'idle' || gameStage === 'ended' ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '12px',
            width: '100%'
          }}>
            {/* Bet Chips Selector */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {[10, 50, 100, 500].map(amt => (
                <button 
                  key={amt} 
                  className={`premium-chip-btn ${betAmount === amt ? 'active' : ''}`}
                  onClick={() => setBetAmount(amt)}
                  disabled={loading}
                  style={{
                    background: betAmount === amt 
                      ? 'linear-gradient(135deg, #00e676 0%, #00a152 100%)' 
                      : 'linear-gradient(135deg, #131b26 0%, #080c10 100%)',
                    border: betAmount === amt ? '2px solid #ffea00' : '2.5px dashed rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  ₱{amt}
                </button>
              ))}
            </div>

            <button 
              className="game-btn-primary" 
              onClick={startGame} 
              disabled={loading}
              style={{
                background: 'linear-gradient(90deg, #00e676 0%, #00a152 100%)',
                boxShadow: '0 4px 20px rgba(0, 230, 118, 0.4)',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'DEALING CARDS...' : `PLACE BET : ₱${betAmount}`}
            </button>
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            width: '100%'
          }}>
            <button 
              className="game-btn-primary" 
              onClick={hit} 
              disabled={loading || gameStage !== 'player-turn'}
              style={{ 
                flex: 1, 
                background: 'linear-gradient(90deg, #29b6f6 0%, #01579b 100%)', 
                color: '#fff !important',
                boxShadow: '0 4px 15px rgba(41, 182, 246, 0.4)',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 'bold'
              }}
            >
              Hit
            </button>
            <button 
              className="game-btn-primary" 
              onClick={stand} 
              disabled={loading || gameStage !== 'player-turn'}
              style={{ 
                flex: 1, 
                background: 'linear-gradient(90deg, #ff9100 0%, #ff6d00 100%)', 
                color: '#000 !important',
                boxShadow: '0 4px 15px rgba(255, 145, 0, 0.4)',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 'bold'
              }}
            >
              Stand
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

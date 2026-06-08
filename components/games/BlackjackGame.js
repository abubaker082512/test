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
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'radial-gradient(circle at center, #072e17 0%, #03150b 100%)',
      width: '100%',
      minHeight: '100%',
      position: 'relative',
      overflowY: 'auto'
    }} className="felt-table">
      <h2 style={{
        fontSize: '22px',
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#fff',
        textShadow: '0 2px 10px rgba(0,0,0,0.5)',
        marginBottom: '20px'
      }}>
        BETPK BLACKJACK
      </h2>

      {/* Main Table Hands Grid */}
      {(playerHand.length > 0 || dealerHand.length > 0) && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '30px',
          width: '100%',
          maxWidth: '360px',
          background: 'rgba(0, 0, 0, 0.4)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          position: 'relative'
        }}>
          {/* Dealer Hand */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '12px', marginBottom: '8px', fontWeight: 'bold' }}>
              <span>DEALER {gameStage === 'player-turn' ? '(?)' : `(${dScore})`}</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {dealerHand.map((c, i) => renderCard(c, i, gameStage === 'player-turn' && i === 1))}
            </div>
          </div>

          {/* Player Hand */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '12px', marginBottom: '8px', fontWeight: 'bold' }}>
              <span>YOUR HAND ({pScore})</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {playerHand.map((c, i) => renderCard(c, i, false))}
            </div>
          </div>
        </div>
      )}

      {/* Message feedback */}
      {message && (
        <div style={{
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          marginTop: '12px',
          background: message.type === 'error' ? 'rgba(255, 23, 68, 0.2)' : 'rgba(0, 230, 118, 0.2)',
          color: message.type === 'error' ? '#ff6666' : '#00ff88',
          border: `1px solid ${message.type === 'error' ? '#ff174433' : '#00e67633'}`,
          maxWidth: '360px',
          textAlign: 'center',
          boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
          zIndex: 5
        }}>
          {message.text}
        </div>
      )}

      {/* Bottom control panel */}
      {gameStage === 'idle' || gameStage === 'ended' ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          maxWidth: '300px',
          marginTop: '20px',
          zIndex: 5
        }}>
          {/* Bet Chips Selector */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[10, 50, 100, 500].map(amt => (
              <button 
                key={amt} 
                className="btn" 
                onClick={() => setBetAmount(amt)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '8px',
                  fontSize: '12px',
                  background: betAmount === amt ? 'var(--accent)' : '#000',
                  color: betAmount === amt ? '#000' : '#fff',
                  borderColor: betAmount === amt ? 'var(--accent)' : '#333',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                }}
              >
                ₱{amt}
              </button>
            ))}
          </div>

          <button 
            className="btn primary" 
            onClick={startGame} 
            disabled={loading}
            style={{ 
              padding: '16px', 
              fontSize: '16px', 
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(245, 194, 66, 0.3)' 
            }}
          >
            {loading ? 'DEALING CARDS...' : `BET ₱${betAmount} & DEAL`}
          </button>
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          width: '100%', 
          maxWidth: '280px', 
          marginTop: '20px',
          zIndex: 5 
        }}>
          <button 
            className="btn primary" 
            onClick={hit} 
            disabled={loading || gameStage !== 'player-turn'}
            style={{ flex: 1, padding: '14px', background: 'var(--accent)', color: '#000', fontWeight: 'bold' }}
          >
            Hit
          </button>
          <button 
            className="btn" 
            onClick={stand} 
            disabled={loading || gameStage !== 'player-turn'}
            style={{ flex: 1, padding: '14px', background: '#000', border: '1px solid #333' }}
          >
            Stand
          </button>
        </div>
      )}
    </div>
  )
}

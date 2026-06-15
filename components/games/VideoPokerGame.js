import React, { useState, useEffect } from 'react'

const CARDS_DECK = [
  { suit: '♠', value: 'A', rank: 14, color: '#fff' },
  { suit: '♠', value: '2', rank: 2, color: '#fff' },
  { suit: '♠', value: '3', rank: 3, color: '#fff' },
  { suit: '♠', value: '4', rank: 4, color: '#fff' },
  { suit: '♠', value: '5', rank: 5, color: '#fff' },
  { suit: '♠', value: '6', rank: 6, color: '#fff' },
  { suit: '♠', value: '7', rank: 7, color: '#fff' },
  { suit: '♠', value: '8', rank: 8, color: '#fff' },
  { suit: '♠', value: '9', rank: 9, color: '#fff' },
  { suit: '♠', value: '10', rank: 10, color: '#fff' },
  { suit: '♠', value: 'J', rank: 11, color: '#fff' },
  { suit: '♠', value: 'Q', rank: 12, color: '#fff' },
  { suit: '♠', value: 'K', rank: 13, color: '#fff' },
  { suit: '♥', value: 'A', rank: 14, color: '#ff1744' },
  { suit: '♥', value: '2', rank: 2, color: '#ff1744' },
  { suit: '♥', value: '3', rank: 3, color: '#ff1744' },
  { suit: '♥', value: '4', rank: 4, color: '#ff1744' },
  { suit: '♥', value: '5', rank: 5, color: '#ff1744' },
  { suit: '♥', value: '6', rank: 6, color: '#ff1744' },
  { suit: '♥', value: '7', rank: 7, color: '#ff1744' },
  { suit: '♥', value: '8', rank: 8, color: '#ff1744' },
  { suit: '♥', value: '9', rank: 9, color: '#ff1744' },
  { suit: '♥', value: '10', rank: 10, color: '#ff1744' },
  { suit: '♥', value: 'J', rank: 11, color: '#ff1744' },
  { suit: '♥', value: 'Q', rank: 12, color: '#ff1744' },
  { suit: '♥', value: 'K', rank: 13, color: '#ff1744' },
  { suit: '♣', value: 'A', rank: 14, color: '#fff' },
  { suit: '♣', value: '2', rank: 2, color: '#fff' },
  { suit: '♣', value: '3', rank: 3, color: '#fff' },
  { suit: '♣', value: '4', rank: 4, color: '#fff' },
  { suit: '♣', value: '5', rank: 5, color: '#fff' },
  { suit: '♣', value: '6', rank: 6, color: '#fff' },
  { suit: '♣', value: '7', rank: 7, color: '#fff' },
  { suit: '♣', value: '8', rank: 8, color: '#fff' },
  { suit: '♣', value: '9', rank: 9, color: '#fff' },
  { suit: '♣', value: '10', rank: 10, color: '#fff' },
  { suit: '♣', value: 'J', rank: 11, color: '#fff' },
  { suit: '♣', value: 'Q', rank: 12, color: '#fff' },
  { suit: '♣', value: 'K', rank: 13, color: '#fff' },
  { suit: '♦', value: 'A', rank: 14, color: '#ff1744' },
  { suit: '♦', value: '2', rank: 2, color: '#ff1744' },
  { suit: '♦', value: '3', rank: 3, color: '#ff1744' },
  { suit: '♦', value: '4', rank: 4, color: '#ff1744' },
  { suit: '♦', value: '5', rank: 5, color: '#ff1744' },
  { suit: '♦', value: '6', rank: 6, color: '#ff1744' },
  { suit: '♦', value: '7', rank: 7, color: '#ff1744' },
  { suit: '♦', value: '8', rank: 8, color: '#ff1744' },
  { suit: '♦', value: '9', rank: 9, color: '#ff1744' },
  { suit: '♦', value: '10', rank: 10, color: '#ff1744' },
  { suit: '♦', value: 'J', rank: 11, color: '#ff1744' },
  { suit: '♦', value: 'Q', rank: 12, color: '#ff1744' },
  { suit: '♦', value: 'K', rank: 13, color: '#ff1744' }
]

export default function VideoPokerGame({ user, wallet, fetchWallet }) {
  const [betAmount, setBetAmount] = useState(10)
  const [gameState, setGameState] = useState('idle') // 'idle' | 'deal1'
  const [cards, setCards] = useState([]) // 5 cards
  const [held, setHeld] = useState([false, false, false, false, false])
  const [message, setMessage] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [finalResultName, setFinalResultName] = useState(null)

  const handleBetChange = (amount) => {
    if (gameState !== 'idle') return
    setBetAmount(Math.max(1, amount))
  }

  const toggleHold = (idx) => {
    if (gameState !== 'deal1' || processing) return
    const nextHeld = [...held]
    nextHeld[idx] = !nextHeld[idx]
    setHeld(nextHeld)
  }

  // Draw 5 unique cards
  const drawCards = (deck, count, exclude = []) => {
    const pool = deck.filter(c => !exclude.some(ex => ex.suit === c.suit && ex.value === c.value))
    const drawn = []
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length)
      drawn.push(pool.splice(idx, 1)[0])
    }
    return drawn
  }

  const dealFirstHand = async () => {
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit.' })
    }

    setProcessing(true)
    setMessage(null)
    setFinalResultName(null)
    setHeld([false, false, false, false, false])

    // 1. Place bet
    try {
      const res = await fetch('/api/wallet/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, amount: betAmount })
      })
      const data = await res.json()
      if (!data.success) {
        setProcessing(false)
        return setMessage({ type: 'error', text: data.error || 'Bet failed.' })
      }
      fetchWallet()
    } catch (e) {
      setProcessing(false)
      return setMessage({ type: 'error', text: 'Network connection issue.' })
    }

    // 2. Draw 5 initial cards
    const initialCards = drawCards(CARDS_DECK, 5)
    setCards(initialCards)
    setGameState('deal1')
    setProcessing(false)
  }

  const drawSecondHand = async () => {
    setProcessing(true)
    setMessage(null)

    // 1. Keep held cards, replace others
    const keptCards = cards.filter((_, idx) => held[idx])
    const needed = 5 - keptCards.length
    const replacements = drawCards(CARDS_DECK, needed, cards)
    
    let replacementIdx = 0
    const finalHand = cards.map((c, idx) => {
      if (held[idx]) return c
      const rep = replacements[replacementIdx]
      replacementIdx++
      return rep
    })

    setCards(finalHand)

    // Evaluate result
    const rankResult = evaluatePokerHand(finalHand)
    setFinalResultName(rankResult.name)

    const payoutMultiplier = rankResult.multiplier

    if (payoutMultiplier > 0) {
      try {
        const payRes = await fetch('/api/wallet/payout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            bet_amount: betAmount,
            multiplier: payoutMultiplier
          })
        })
        const payData = await payRes.json()
        if (payData.success) {
          setMessage({
            type: 'success',
            text: `🎉 WIN! Hand: ${rankResult.name}. Won ₱${(betAmount * payoutMultiplier).toFixed(2)}!`
          })
        }
      } catch (e) {
        setMessage({ type: 'error', text: 'Payout error.' })
      }
    } else {
      setMessage({
        type: 'error',
        text: '💥 No Winning Combination. Try another hand!'
      })
    }

    setGameState('idle')
    setProcessing(false)
    fetchWallet()
  }

  // Evaluates a 5-card poker hand
  const evaluatePokerHand = (hand) => {
    // Sort ranks ascending
    const sorted = [...hand].sort((a, b) => a.rank - b.rank)
    const suits = hand.map(c => c.suit)
    const ranks = hand.map(c => c.rank)

    const isFlush = suits.every(s => s === suits[0])
    
    // Check straight
    let isStraight = false
    const uniqueRanks = Array.from(new Set(ranks)).sort((a, b) => a - b)
    if (uniqueRanks.length === 5) {
      if (uniqueRanks[4] - uniqueRanks[0] === 4) {
        isStraight = true
      }
      // Ace low straight: A, 2, 3, 4, 5 (ranks: 14, 2, 3, 4, 5)
      if (ranks.includes(14) && ranks.includes(2) && ranks.includes(3) && ranks.includes(4) && ranks.includes(5)) {
        isStraight = true
      }
    }

    // Counts of each rank
    const counts = {}
    ranks.forEach(r => { counts[r] = (counts[r] || 0) + 1 })
    const countVals = Object.values(counts).sort((a, b) => b - a)

    // Royal Flush
    if (isFlush && isStraight && sorted[4].rank === 14 && sorted[0].rank === 10) {
      return { name: 'Royal Flush 👑', multiplier: 250 }
    }
    // Straight Flush
    if (isFlush && isStraight) {
      return { name: 'Straight Flush 🌈', multiplier: 50 }
    }
    // Four of a kind
    if (countVals[0] === 4) {
      return { name: 'Four of a Kind 💥', multiplier: 25 }
    }
    // Full house
    if (countVals[0] === 3 && countVals[1] === 2) {
      return { name: 'Full House 🏡', multiplier: 9 }
    }
    // Flush
    if (isFlush) {
      return { name: 'Flush 🌊', multiplier: 6 }
    }
    // Straight
    if (isStraight) {
      return { name: 'Straight 📈', multiplier: 4 }
    }
    // Three of a kind
    if (countVals[0] === 3) {
      return { name: 'Three of a Kind ✨', multiplier: 3 }
    }
    // Two Pair
    if (countVals[0] === 2 && countVals[1] === 2) {
      return { name: 'Two Pair 🃏', multiplier: 2 }
    }
    // Pair of Jacks or Better
    if (countVals[0] === 2) {
      // Find the pair rank
      const pairRank = parseInt(Object.keys(counts).find(k => counts[k] === 2))
      if (pairRank >= 11) { // Jack is 11, Queen 12, King 13, Ace 14
        return { name: 'Jacks or Better 🃏', multiplier: 1 }
      }
    }

    return { name: 'High Card', multiplier: 0 }
  }

  const renderPokerCard = (card, idx) => {
    if (!card) {
      return (
        <div style={{
          width: '70px',
          height: '100px',
          background: '#041008',
          border: '1px dashed #243049',
          borderRadius: '6px'
        }}></div>
      )
    }

    return (
      <div 
        onClick={() => toggleHold(idx)}
        style={{
          width: '70px',
          height: '100px',
          background: '#fff',
          border: held[idx] ? '3px solid #ffea00' : '1px solid #ccc',
          borderRadius: '6px',
          boxShadow: held[idx] ? '0 0 12px rgba(255, 234, 0, 0.6)' : '0 4px 8px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '6px',
          color: card.color === '#fff' ? '#222' : card.color,
          cursor: gameState === 'deal1' ? 'pointer' : 'default',
          transform: held[idx] ? 'translateY(-6px)' : 'none',
          transition: 'transform 0.1s, border-color 0.1s',
          position: 'relative'
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: '1' }}>
          {card.value}
          <div style={{ fontSize: '10px' }}>{card.suit}</div>
        </div>

        <div style={{ fontSize: '28px', textAlign: 'center', margin: 'auto 0' }}>
          {card.suit}
        </div>

        <div style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'right', transform: 'rotate(180deg)', lineHeight: '1' }}>
          {card.value}
          <div style={{ fontSize: '10px' }}>{card.suit}</div>
        </div>

        {gameState === 'deal1' && held[idx] && (
          <div style={{
            position: 'absolute',
            bottom: '-22px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#ffea00',
            color: '#000',
            fontSize: '9px',
            fontWeight: '900',
            padding: '2px 6px',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            HELD
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'linear-gradient(180deg, #1b0a2a 0%, #08030d 100%)', // Retro Purple arcade feel
      width: '100%',
      minHeight: '100%',
      overflowY: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        background: '#12071f',
        border: '3px solid #ab47bc',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 0 25px rgba(171, 71, 188, 0.4)',
        textAlign: 'center'
      }}>
        {/* Title logo */}
        <h2 style={{
          fontSize: '22px',
          fontWeight: '900',
          color: '#ffea00',
          letterSpacing: '1px',
          textShadow: '0 0 10px rgba(255, 234, 0, 0.3)',
          marginBottom: '14px'
        }}>👾 RETRO JACKS OR BETTER</h2>

        {/* Video Poker Paytable chart */}
        <div style={{
          background: '#08030d',
          border: '1px solid #ab47bc',
          borderRadius: '8px',
          padding: '8px',
          fontSize: '9px',
          fontFamily: 'monospace',
          color: '#ccc',
          textAlign: 'left',
          marginBottom: '16px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px'
        }}>
          <div>👑 Royal Flush: <span style={{ color: '#ffea00' }}>250x</span></div>
          <div>🏡 Full House: <span style={{ color: '#ffea00' }}>9x</span></div>
          <div>🌈 Straight Flush: <span style={{ color: '#ffea00' }}>50x</span></div>
          <div>🌊 Flush: <span style={{ color: '#ffea00' }}>6x</span></div>
          <div>💥 Four of a Kind: <span style={{ color: '#ffea00' }}>25x</span></div>
          <div>📈 Straight: <span style={{ color: '#ffea00' }}>4x</span></div>
          <div>✨ Three of a Kind: <span style={{ color: '#ffea00' }}>3x</span></div>
          <div>🃏 Two Pair: <span style={{ color: '#ffea00' }}>2x</span></div>
          <div style={{ gridColumn: 'span 2' }}>🃏 Jacks or Better: <span style={{ color: '#ffea00' }}>1x</span> (J, Q, K, A)</div>
        </div>

        {/* Card deal deck area */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.5)',
          borderRadius: '12px',
          padding: '24px 10px',
          marginBottom: '28px',
          minHeight: '130px'
        }}>
          {cards.length > 0 ? (
            cards.map((c, idx) => (
              <React.Fragment key={idx}>
                {renderPokerCard(c, idx)}
              </React.Fragment>
            ))
          ) : (
            Array(5).fill(null).map((_, idx) => (
              <div key={idx} style={{
                width: '70px',
                height: '100px',
                background: '#08030d',
                border: '1px dashed #ab47bc',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ab47bc',
                fontSize: '18px'
              }}>
                ?
              </div>
            ))
          )}
        </div>

        {/* Result & messaging banner */}
        {finalResultName && (
          <div style={{
            fontSize: '16px',
            color: '#ffea00',
            fontWeight: 'bold',
            marginBottom: '12px',
            textShadow: '0 0 10px rgba(255,234,0,0.5)'
          }}>
            HAND: {finalResultName.toUpperCase()}
          </div>
        )}

        {message && (
          <div style={{
            background: message.type === 'success' ? 'rgba(0,230,118,0.1)' : 'rgba(255,23,68,0.1)',
            border: `1px solid ${message.type === 'success' ? 'rgba(0,230,118,0.2)' : 'rgba(255,23,68,0.2)'}`,
            padding: '10px',
            borderRadius: '6px',
            color: message.type === 'success' ? '#00e676' : '#ff1744',
            fontSize: '11px',
            fontWeight: 'bold',
            marginBottom: '16px'
          }}>
            {message.text}
          </div>
        )}

        {/* Controls cabinet panel */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {gameState === 'idle' ? (
            <>
              {/* Bet controls */}
              <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                <button
                  disabled={processing}
                  onClick={() => handleBetChange(betAmount - 10)}
                  style={{ width: '32px', height: '32px', borderRadius: '4px', background: '#301242', color: '#fff', border: '1px solid #ab47bc', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  -
                </button>
                <div style={{
                  flex: 1,
                  background: '#08030d',
                  border: '1px solid #ab47bc',
                  borderRadius: '4px',
                  color: '#fff',
                  lineHeight: '30px',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}>
                  ₱{betAmount}
                </div>
                <button
                  disabled={processing}
                  onClick={() => handleBetChange(betAmount + 10)}
                  style={{ width: '32px', height: '32px', borderRadius: '4px', background: '#301242', color: '#fff', border: '1px solid #ab47bc', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  +
                </button>
              </div>

              <button
                onClick={dealFirstHand}
                disabled={processing}
                style={{
                  flex: 1.2,
                  background: 'linear-gradient(90deg, #ffea00 0%, #ab47bc 100%)',
                  color: '#000',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  fontWeight: '950',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                DEAL HAND
              </button>
            </>
          ) : (
            <button
              onClick={drawSecondHand}
              disabled={processing}
              style={{
                width: '100%',
                background: 'linear-gradient(90deg, #00e676 0%, #00b0ff 100%)',
                color: '#000',
                border: 'none',
                padding: '12px',
                borderRadius: '6px',
                fontWeight: '950',
                fontSize: '13px',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              DRAW REPLACEMENTS [HELD {held.filter(Boolean).length}/5]
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

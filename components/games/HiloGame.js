import React, { useState } from 'react'

const CARD_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const CARD_SUITS = ['♠', '♥', '♣', '♦']

export default function HiloGame({ user, wallet, fetchWallet }) {
  const [betAmount, setBetAmount] = useState(10)
  const [active, setActive] = useState(false)
  const [currentCard, setCurrentCard] = useState(null)
  const [nextCard, setNextCard] = useState(null)
  const [roundMultiplier, setRoundMultiplier] = useState(1.0)
  const [message, setMessage] = useState(null)
  const [processing, setProcessing] = useState(false)

  const drawRandomCard = () => {
    const rankIdx = Math.floor(Math.random() * 13)
    const suitIdx = Math.floor(Math.random() * 4)
    return {
      rankIdx,
      rank: CARD_RANKS[rankIdx],
      suit: CARD_SUITS[suitIdx]
    }
  }

  const startGame = async () => {
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit.' })
    }

    setProcessing(true)
    setMessage(null)
    setNextCard(null)

    // Deduct bet
    try {
      const res = await fetch('/api/wallet/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, amount: betAmount })
      })
      const data = await res.json()
      if (!data.success) {
        setProcessing(false)
        return setMessage({ type: 'error', text: data.error })
      }
      fetchWallet()
    } catch (e) {
      setProcessing(false)
      return setMessage({ type: 'error', text: 'Server connection failed.' })
    }

    const card = drawRandomCard()
    setCurrentCard(card)
    setRoundMultiplier(1.0)
    setActive(true)
    setProcessing(false)
  }

  // Calculate probabilities and dynamic multipliers
  // 1 is low (A), 13 is high (K)
  const getMultipliers = () => {
    if (!currentCard) return { higher: 1.5, lower: 1.5, same: 12.0 }
    
    const idx = currentCard.rankIdx
    const cardsHigher = 12 - idx
    const cardsLower = idx
    
    // Higher: 12 / cardsHigher
    const higherMult = cardsHigher > 0 ? parseFloat((12 / cardsHigher * 1.1).toFixed(2)) : 12.0
    // Lower: 12 / cardsLower
    const lowerMult = cardsLower > 0 ? parseFloat((12 / cardsLower * 1.1).toFixed(2)) : 12.0
    
    return {
      higher: Math.max(1.1, Math.min(15.0, higherMult)),
      lower: Math.max(1.1, Math.min(15.0, lowerMult)),
      same: 12.5
    }
  }

  const makeGuess = async (guess) => {
    if (!active || processing) return
    setProcessing(true)
    setMessage(null)

    const card = drawRandomCard()
    setNextCard(card)

    // Animate Card deal delay
    await new Promise(r => setTimeout(r, 600))

    const currentIdx = currentCard.rankIdx
    const nextIdx = card.rankIdx
    const mults = getMultipliers()

    let isWin = false
    let chosenMult = 1.0

    if (guess === 'higher') {
      isWin = nextIdx > currentIdx
      chosenMult = mults.higher
    } else if (guess === 'lower') {
      isWin = nextIdx < currentIdx
      chosenMult = mults.lower
    } else if (guess === 'same') {
      isWin = nextIdx === currentIdx
      chosenMult = mults.same
    }

    if (isWin) {
      const newMult = parseFloat((roundMultiplier * chosenMult).toFixed(2))
      setRoundMultiplier(newMult)
      setCurrentCard(card)
      setNextCard(null)
      setMessage({ type: 'success', text: `🎯 Correct Guess! Next card was ${card.rank}${card.suit}. Round Multiplier: ${newMult}x` })
    } else {
      setActive(false)
      setMessage({ type: 'lose', text: `💥 BUSTED! Dealt ${card.rank}${card.suit}. Lost guess bet!` })
      fetchWallet()
    }
    setProcessing(false)
  }

  const cashOut = async () => {
    if (!active || processing) return
    setProcessing(true)

    try {
      const res = await fetch('/api/wallet/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          bet_amount: betAmount,
          multiplier: roundMultiplier
        })
      })
      const data = await res.json()
      if (data.success) {
        setActive(false)
        setMessage({ type: 'success', text: `💰 Cashed Out Safely! +₱${(betAmount * roundMultiplier).toFixed(2)} (${roundMultiplier}x)` })
        window.dispatchEvent(new Event('wallet-updated'))
      }
    } catch (err) {
      console.error(err)
    }
    setProcessing(false)
    fetchWallet()
  }

  const getCardStyle = (card) => {
    if (!card) return {}
    const isRed = card.suit === '♥' || card.suit === '♦'
    return {
      color: isRed ? '#ff1744' : '#000',
      fontSize: '32px',
      fontWeight: 'bold'
    }
  }

  const mults = getMultipliers()

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'linear-gradient(180deg, #180922 0%, #08030b 100%)',
      width: '100%',
      minHeight: '100%',
      overflowY: 'auto'
    }}>
      <h2 style={{
        fontSize: '22px',
        fontWeight: '950',
        fontStyle: 'italic',
        background: 'linear-gradient(to right, #aa00ff, #00b0ff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '20px',
        textShadow: '0 2px 15px rgba(170, 0, 255, 0.25)'
      }}>
        HILO CASINO
      </h2>

      {active && (
        <div style={{
          fontSize: '16px',
          color: '#00ff88',
          fontWeight: 'bold',
          marginBottom: '16px',
          fontFamily: 'monospace',
          textShadow: '0 0 10px rgba(0,255,136,0.3)'
        }}>
          ROUND MULTIPLIER: {roundMultiplier}x [₱{(betAmount * roundMultiplier).toFixed(2)}]
        </div>
      )}

      {/* Main card dealing table */}
      <div style={{
        display: 'flex',
        gap: '20px',
        marginBottom: '24px',
        minHeight: '136px',
        alignItems: 'center'
      }}>
        {/* Current Card */}
        {currentCard ? (
          <div style={{
            width: '90px',
            height: '130px',
            background: '#fff',
            borderRadius: '10px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '8px',
            position: 'relative',
            border: '2px solid var(--accent)'
          }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold', alignSelf: 'flex-start', ...getCardStyle(currentCard) }}>
              {currentCard.rank}
            </span>
            <span style={{ alignSelf: 'center', ...getCardStyle(currentCard) }}>
              {currentCard.suit}
            </span>
            <span style={{ fontSize: '18px', fontWeight: 'bold', alignSelf: 'flex-end', ...getCardStyle(currentCard), transform: 'rotate(180deg)' }}>
              {currentCard.rank}
            </span>
          </div>
        ) : (
          <div style={{
            width: '90px',
            height: '130px',
            background: '#0d131a',
            border: '2px dashed #333',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#444',
            fontSize: '48px'
          }}>
            🃏
          </div>
        )}

        {/* Arrow Indicator */}
        {active && <div style={{ fontSize: '24px', color: 'rgba(255,255,255,0.2)' }}>➡️</div>}

        {/* Next Card preview */}
        {active && (
          <div style={{
            width: '90px',
            height: '130px',
            background: nextCard ? '#fff' : 'rgba(0,0,0,0.3)',
            border: nextCard ? 'none' : '2px dashed rgba(255,255,255,0.08)',
            borderRadius: '10px',
            boxShadow: nextCard ? '0 8px 20px rgba(0,0,0,0.6)' : 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '8px',
            position: 'relative'
          }}>
            {nextCard ? (
              <>
                <span style={{ fontSize: '18px', fontWeight: 'bold', alignSelf: 'flex-start', ...getCardStyle(nextCard) }}>
                  {nextCard.rank}
                </span>
                <span style={{ alignSelf: 'center', ...getCardStyle(nextCard) }}>
                  {nextCard.suit}
                </span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', alignSelf: 'flex-end', ...getCardStyle(nextCard), transform: 'rotate(180deg)' }}>
                  {nextCard.rank}
                </span>
              </>
            ) : (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.15)',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                ?
              </div>
            )}
          </div>
        )}
      </div>

      {/* Feedback Messages */}
      {message && (
        <div style={{
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          marginBottom: '20px',
          background: message.type === 'error' ? 'rgba(255, 23, 68, 0.15)' : message.type === 'lose' ? 'rgba(255,255,255,0.05)' : 'rgba(0, 230, 118, 0.15)',
          color: message.type === 'error' ? '#ff6666' : message.type === 'lose' ? '#aaa' : '#00ff88',
          border: `1px solid ${message.type === 'error' ? '#ff174433' : message.type === 'lose' ? '#333' : '#00e67633'}`,
          maxWidth: '320px',
          textAlign: 'center'
        }}>
          {message.text}
        </div>
      )}

      {/* Game controls */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '100%',
        maxWidth: '300px'
      }}>
        {!active ? (
          <>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[10, 50, 100, 500].map(amt => (
                <button
                  key={amt}
                  className="btn"
                  onClick={() => setBetAmount(amt)}
                  disabled={processing}
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
            <button
              className="btn primary"
              onClick={startGame}
              disabled={processing}
              style={{ padding: '14px', fontWeight: 'bold' }}
            >
              {processing ? 'DEALING CARD...' : `START GAME — ₱${betAmount}`}
            </button>
          </>
        ) : (
          <>
            {/* Higher / Lower action bets */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn primary"
                onClick={() => makeGuess('higher')}
                disabled={processing || (currentCard && currentCard.rank === 'K')}
                style={{
                  flex: 1,
                  padding: '12px 6px',
                  background: 'linear-gradient(135deg, #00b0ff 0%, #007bb3 100%)',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px'
                }}
              >
                🔺 HIGHER
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '2px', color: '#ffb300' }}>
                  {mults.higher}x
                </div>
              </button>

              <button
                className="btn primary"
                onClick={() => makeGuess('lower')}
                disabled={processing || (currentCard && currentCard.rank === 'A')}
                style={{
                  flex: 1,
                  padding: '12px 6px',
                  background: 'linear-gradient(135deg, #ff1744 0%, #b3002d 100%)',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px'
                }}
              >
                🔻 LOWER
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '2px', color: '#ffb300' }}>
                  {mults.lower}x
                </div>
              </button>
            </div>

            <button
              className="btn"
              onClick={() => makeGuess('same')}
              disabled={processing}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '12px',
                background: '#151b27',
                border: '1px solid #333'
              }}
            >
              🔹 SAME (12.5x)
            </button>

            {/* Cash Out */}
            <button
              className="btn primary"
              onClick={cashOut}
              disabled={processing}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #00e676 0%, #00c851 100%)',
                color: '#000',
                fontWeight: '900',
                boxShadow: '0 4px 15px rgba(0, 230, 118, 0.3)',
                marginTop: '10px'
              }}
            >
              {processing ? 'COLLECTING...' : `SAFE CASH OUT — ₱${(betAmount * roundMultiplier).toFixed(2)}`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

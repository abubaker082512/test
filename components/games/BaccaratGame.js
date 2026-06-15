import React, { useState } from 'react'

const CARDS_DECK = [
  { suit: '♠', val: 'A', score: 1 }, { suit: '♠', val: '2', score: 2 }, { suit: '♠', val: '3', score: 3 },
  { suit: '♠', val: '4', score: 4 }, { suit: '♠', val: '5', score: 5 }, { suit: '♠', val: '6', score: 6 },
  { suit: '♠', val: '7', score: 7 }, { suit: '♠', val: '8', score: 8 }, { suit: '♠', val: '9', score: 9 },
  { suit: '♠', val: '10', score: 0 }, { suit: '♠', val: 'J', score: 0 }, { suit: '♠', val: 'Q', score: 0 }, { suit: '♠', val: 'K', score: 0 },
  { suit: '♥', val: 'A', score: 1 }, { suit: '♥', val: '2', score: 2 }, { suit: '♥', val: '3', score: 3 },
  { suit: '♥', val: '4', score: 4 }, { suit: '♥', val: '5', score: 5 }, { suit: '♥', val: '6', score: 6 },
  { suit: '♥', val: '7', score: 7 }, { suit: '♥', val: '8', score: 8 }, { suit: '♥', val: '9', score: 9 },
  { suit: '♥', val: '10', score: 0 }, { suit: '♥', val: 'J', score: 0 }, { suit: '♥', val: 'Q', score: 0 }, { suit: '♥', val: 'K', score: 0 },
  { suit: '♣', val: 'A', score: 1 }, { suit: '♣', val: '2', score: 2 }, { suit: '♣', val: '3', score: 3 },
  { suit: '♣', val: '4', score: 4 }, { suit: '♣', val: '5', score: 5 }, { suit: '♣', val: '6', score: 6 },
  { suit: '♣', val: '7', score: 7 }, { suit: '♣', val: '8', score: 8 }, { suit: '♣', val: '9', score: 9 },
  { suit: '♣', val: '10', score: 0 }, { suit: '♣', val: 'J', score: 0 }, { suit: '♣', val: 'Q', score: 0 }, { suit: '♣', val: 'K', score: 0 },
  { suit: '♦', val: 'A', score: 1 }, { suit: '♦', val: '2', score: 2 }, { suit: '♦', val: '3', score: 3 },
  { suit: '♦', val: '4', score: 4 }, { suit: '♦', val: '5', score: 5 }, { suit: '♦', val: '6', score: 6 },
  { suit: '♦', val: '7', score: 7 }, { suit: '♦', val: '8', score: 8 }, { suit: '♦', val: '9', score: 9 },
  { suit: '♦', val: '10', score: 0 }, { suit: '♦', val: 'J', score: 0 }, { suit: '♦', val: 'Q', score: 0 }, { suit: '♦', val: 'K', score: 0 }
]

export default function BaccaratGame({ user, wallet, fetchWallet }) {
  const [betSide, setBetSide] = useState(null) // 'player' | 'banker' | 'tie'
  const [betAmount, setBetAmount] = useState(10)
  const [dealing, setDealing] = useState(false)
  const [playerCards, setPlayerCards] = useState([])
  const [bankerCards, setBankerCards] = useState([])
  const [playerScore, setPlayerScore] = useState(0)
  const [bankerScore, setBankerScore] = useState(0)
  const [outcome, setOutcome] = useState(null) // 'player' | 'banker' | 'tie'
  const [message, setMessage] = useState(null)

  const calcBaccaratScore = (cards) => {
    const sum = cards.reduce((s, c) => s + c.score, 0)
    return sum % 10
  }

  const dealRound = async () => {
    if (dealing) return
    if (!betSide) {
      return setMessage({ type: 'error', text: 'Select a side to bet on first (Player, Banker, or Tie).' })
    }
    if (!wallet || wallet.balance < betAmount) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit.' })
    }

    setDealing(true)
    setMessage(null)
    setOutcome(null)
    setPlayerCards([])
    setBankerCards([])

    // Deduct Bet
    try {
      const res = await fetch('/api/wallet/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, amount: betAmount })
      })
      const data = await res.json()
      if (!data.success) {
        setDealing(false)
        return setMessage({ type: 'error', text: data.error })
      }
      fetchWallet()
    } catch (e) {
      setDealing(false)
      return setMessage({ type: 'error', text: 'Server connection failed.' })
    }

    // Deal Sequence
    const deck = [...CARDS_DECK].sort(() => Math.random() - 0.5)
    
    // Initial 2 cards each
    const p1 = deck.pop()
    const b1 = deck.pop()
    const p2 = deck.pop()
    const b2 = deck.pop()

    const pHand = [p1, p2]
    const bHand = [b1, b2]

    // Animate Card 1
    await new Promise(r => setTimeout(r, 600))
    setPlayerCards([p1])
    setPlayerScore(calcBaccaratScore([p1]))

    await new Promise(r => setTimeout(r, 600))
    setBankerCards([b1])
    setBankerScore(calcBaccaratScore([b1]))

    await new Promise(r => setTimeout(r, 600))
    setPlayerCards([p1, p2])
    setPlayerScore(calcBaccaratScore(pHand))

    await new Promise(r => setTimeout(r, 600))
    setBankerCards([b1, b2])
    const bScoreVal = calcBaccaratScore(bHand)
    setBankerScore(bScoreVal)

    // Evaluate Third Card rules
    let pScore = calcBaccaratScore(pHand)
    let bScore = bScoreVal

    // Natural 8 or 9 ends round immediately
    const isNatural = pScore >= 8 || bScore >= 8

    if (!isNatural) {
      let pThirdCard = null
      
      // Player draws third card if score is 0-5
      if (pScore <= 5) {
        await new Promise(r => setTimeout(r, 800))
        pThirdCard = deck.pop()
        pHand.push(pThirdCard)
        setPlayerCards([...pHand])
        pScore = calcBaccaratScore(pHand)
        setPlayerScore(pScore)
      }

      // Banker draws third card based on Player's third card value
      let bDraws = false
      if (pThirdCard) {
        const p3Val = pThirdCard.score
        if (bScore <= 2) bDraws = true
        else if (bScore === 3 && p3Val !== 8) bDraws = true
        else if (bScore === 4 && [2, 3, 4, 5, 6, 7].includes(p3Val)) bDraws = true
        else if (bScore === 5 && [4, 5, 6, 7].includes(p3Val)) bDraws = true
        else if (bScore === 6 && [6, 7].includes(p3Val)) bDraws = true
      } else {
        // Player did not draw (stood on 6 or 7). Banker draws on 0-5.
        if (bScore <= 5) bDraws = true
      }

      if (bDraws) {
        await new Promise(r => setTimeout(r, 800))
        const bThirdCard = deck.pop()
        bHand.push(bThirdCard)
        setBankerCards([...bHand])
        bScore = calcBaccaratScore(bHand)
        setBankerScore(bScore)
      }
    }

    // Determine Outcome
    let winner = 'tie'
    if (pScore > bScore) winner = 'player'
    else if (bScore > pScore) winner = 'banker'

    setOutcome(winner)
    setDealing(false)

    // Check Payouts
    const won = betSide === winner
    if (won) {
      let payoutMult = 1.0 // Net multiplier (excl. original bet)
      if (winner === 'player') payoutMult = 2.0 // 1:1 payout
      else if (winner === 'banker') payoutMult = 1.95 // 0.95:1 payout (5% commission)
      else if (winner === 'tie') payoutMult = 9.0 // 8:1 payout

      try {
        const payRes = await fetch('/api/wallet/payout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            bet_amount: betAmount,
            multiplier: payoutMult
          })
        })
        const payData = await payRes.json()
        if (payData.success) {
          setMessage({
            type: 'success',
            text: `🎉 WINNER! Handed ${winner.toUpperCase()} (${pScore} vs ${bScore}). Payout: +₱${(betAmount * payoutMult).toFixed(2)}`
          })
          window.dispatchEvent(new Event('wallet-updated'))
        }
      } catch (err) {
        console.error(err)
      }
    } else {
      setMessage({
        type: 'lose',
        text: `😭 Lost bet. Hand is ${winner.toUpperCase()} (${pScore} vs ${bScore}).`
      })
    }
    fetchWallet()
  }

  const getBaccaratCardStyle = (suit) => {
    const isRed = suit === '♥' || suit === '♦'
    return {
      color: isRed ? '#ff1744' : '#000',
      fontSize: '24px',
      fontWeight: 'bold'
    }
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'linear-gradient(180deg, #021a30 0%, #000710 100%)',
      width: '100%',
      minHeight: '100%',
      overflowY: 'auto'
    }}>
      <h2 style={{
        fontSize: '22px',
        fontWeight: '950',
        fontStyle: 'italic',
        background: 'linear-gradient(to right, #00b0ff, #00ff88)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '20px',
        textShadow: '0 2px 15px rgba(0, 176, 255, 0.25)'
      }}>
        CASINO BACCARAT
      </h2>

      {/* Blue Felt Table Layout */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'radial-gradient(circle, #003666 0%, #001a33 100%)',
        border: '4px solid #5a3c10',
        borderRadius: '24px',
        padding: '16px 8px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.8), inset 0 0 40px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        position: 'relative'
      }}>
        {/* Deal representation areas */}
        <div style={{ display: 'flex', justifyContent: 'space-around', gap: '8px' }}>
          {/* Player Hand */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#00ff88', fontWeight: 'bold' }}>
              PLAYER {playerCards.length > 0 && `(${playerScore})`}
            </h4>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '6px',
              minHeight: '82px',
              background: 'rgba(0,0,0,0.25)',
              borderRadius: '12px',
              padding: '6px',
              border: '1px dashed rgba(255,255,255,0.1)'
            }}>
              {playerCards.map((card, idx) => (
                <div 
                  key={idx} 
                  style={{
                    width: '46px',
                    height: '70px',
                    background: '#fff',
                    borderRadius: '6px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '4px',
                    animation: 'slide-in 0.3s ease-out'
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 'bold', alignSelf: 'flex-start', ...getBaccaratCardStyle(card.suit) }}>
                    {card.val}
                  </span>
                  <span style={{ alignSelf: 'center', ...getBaccaratCardStyle(card.suit) }}>
                    {card.suit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Banker Hand */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#ffb300', fontWeight: 'bold' }}>
              BANKER {bankerCards.length > 0 && `(${bankerScore})`}
            </h4>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '6px',
              minHeight: '82px',
              background: 'rgba(0,0,0,0.25)',
              borderRadius: '12px',
              padding: '6px',
              border: '1px dashed rgba(255,255,255,0.1)'
            }}>
              {bankerCards.map((card, idx) => (
                <div 
                  key={idx} 
                  style={{
                    width: '46px',
                    height: '70px',
                    background: '#fff',
                    borderRadius: '6px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '4px',
                    animation: 'slide-in 0.3s ease-out'
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 'bold', alignSelf: 'flex-start', ...getBaccaratCardStyle(card.suit) }}>
                    {card.val}
                  </span>
                  <span style={{ alignSelf: 'center', ...getBaccaratCardStyle(card.suit) }}>
                    {card.suit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic outcome label */}
        {outcome && (
          <div style={{
            position: 'absolute',
            top: '44%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: outcome === 'tie' ? '#8e24aa' : outcome === 'player' ? '#00b0ff' : '#ffb300',
            color: '#fff',
            fontWeight: '950',
            padding: '6px 20px',
            borderRadius: '16px',
            fontSize: '15px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
            zIndex: 10,
            textTransform: 'uppercase'
          }}>
            🎉 {outcome} wins
          </div>
        )}

        {/* Felt Betting Zones */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '8px',
          borderTop: '2px solid rgba(255,255,255,0.08)',
          paddingTop: '20px'
        }}>
          {/* Player betting zone */}
          <div 
            onClick={() => !dealing && setBetSide('player')}
            style={{
              flex: 1.2,
              height: '80px',
              border: '2px solid #00b0ff',
              borderRadius: '16px',
              background: betSide === 'player' ? 'rgba(0,176,255,0.15)' : 'rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: dealing ? 'not-allowed' : 'pointer',
              position: 'relative',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: '11px', color: '#00b0ff', fontWeight: 'bold' }}>PLAYER</span>
            <span style={{ fontSize: '14px', color: '#fff', fontWeight: '900', marginTop: '4px' }}>2.0x</span>
            {betSide === 'player' && (
              <div style={{ position: 'absolute', bottom: '-8px', background: 'var(--accent)', color: '#000', borderRadius: '50%', padding: '2px 8px', fontSize: '9px', fontWeight: '950', border: '1px solid #fff' }}>
                ₱{betAmount}
              </div>
            )}
          </div>

          {/* Tie betting zone */}
          <div 
            onClick={() => !dealing && setBetSide('tie')}
            style={{
              flex: 1,
              height: '80px',
              border: '2px solid #8e24aa',
              borderRadius: '16px',
              background: betSide === 'tie' ? 'rgba(142,36,170,0.15)' : 'rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: dealing ? 'not-allowed' : 'pointer',
              position: 'relative',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: '11px', color: '#e040fb', fontWeight: 'bold' }}>TIE</span>
            <span style={{ fontSize: '14px', color: '#fff', fontWeight: '900', marginTop: '4px' }}>9.0x</span>
            {betSide === 'tie' && (
              <div style={{ position: 'absolute', bottom: '-8px', background: 'var(--accent)', color: '#000', borderRadius: '50%', padding: '2px 8px', fontSize: '9px', fontWeight: '950', border: '1px solid #fff' }}>
                ₱{betAmount}
              </div>
            )}
          </div>

          {/* Banker betting zone */}
          <div 
            onClick={() => !dealing && setBetSide('banker')}
            style={{
              flex: 1.2,
              height: '80px',
              border: '2px solid #ffb300',
              borderRadius: '16px',
              background: betSide === 'banker' ? 'rgba(255,179,0,0.15)' : 'rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: dealing ? 'not-allowed' : 'pointer',
              position: 'relative',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: '11px', color: '#ffb300', fontWeight: 'bold' }}>BANKER</span>
            <span style={{ fontSize: '14px', color: '#fff', fontWeight: '900', marginTop: '4px' }}>1.95x</span>
            {betSide === 'banker' && (
              <div style={{ position: 'absolute', bottom: '-8px', background: 'var(--accent)', color: '#000', borderRadius: '50%', padding: '2px 8px', fontSize: '9px', fontWeight: '950', border: '1px solid #fff' }}>
                ₱{betAmount}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message feedback */}
      {message && (
        <div style={{
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          marginTop: '16px',
          background: message.type === 'error' ? 'rgba(255, 23, 68, 0.15)' : message.type === 'lose' ? 'rgba(255,255,255,0.05)' : 'rgba(0, 230, 118, 0.15)',
          color: message.type === 'error' ? '#ff6666' : message.type === 'lose' ? '#aaa' : '#00ff88',
          border: `1px solid ${message.type === 'error' ? '#ff174433' : message.type === 'lose' ? '#333' : '#00e67633'}`,
          maxWidth: '360px',
          textAlign: 'center'
        }}>
          {message.text}
        </div>
      )}

      {/* Betting control chips */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '100%',
        maxWidth: '400px',
        marginTop: '16px',
        background: 'rgba(0,0,0,0.5)',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid var(--border)'
      }}>
        {/* Chip Size selector */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[10, 50, 100, 500].map(amt => (
            <button 
              key={amt} 
              className="btn" 
              onClick={() => setBetAmount(amt)}
              disabled={dealing}
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

        {/* Action button */}
        <button 
          className="btn primary"
          onClick={dealRound}
          disabled={dealing}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '18px',
            fontWeight: '900',
            letterSpacing: '1px',
            background: 'linear-gradient(135deg, var(--accent) 0%, #e6a100 100%)',
            color: '#000'
          }}
        >
          {dealing ? 'DEALING...' : `DEAL ROUND — ₱${betAmount}`}
        </button>
      </div>
    </div>
  )
}

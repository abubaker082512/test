import React, { useState, useEffect } from 'react'

const CARDS_DECK = [
  { suit: '♠', value: 'A', rank: 1, color: '#fff' },
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
  { suit: '♥', value: 'A', rank: 1, color: '#ff1744' },
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
  { suit: '♣', value: 'A', rank: 1, color: '#fff' },
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
  { suit: '♦', value: 'A', rank: 1, color: '#ff1744' },
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

export default function DragonTigerGame({ user, wallet, fetchWallet }) {
  const [selectedChip, setSelectedChip] = useState(10)
  const [bets, setBets] = useState({ Dragon: 0, Tiger: 0, Tie: 0 })
  const [dealing, setDealing] = useState(false)
  const [dragonCard, setDragonCard] = useState(null)
  const [tigerCard, setTigerCard] = useState(null)
  const [cardState, setCardState] = useState('none') // 'none' | 'back' | 'reveal'
  const [result, setResult] = useState(null) // 'Dragon' | 'Tiger' | 'Tie'
  const [message, setMessage] = useState(null)
  const [history, setHistory] = useState(['D', 'T', 'D', 'D', 'Tie', 'T', 'D'])
  const [processing, setProcessing] = useState(false)

  const placeBetOnZone = (zone) => {
    if (dealing) return
    const totalCurrentBets = Object.values(bets).reduce((a, b) => a + b, 0)
    const newTotal = totalCurrentBets + selectedChip
    if (!wallet || wallet.balance < newTotal) {
      return setMessage({ type: 'error', text: 'Insufficient balance to add bet!' })
    }
    setBets(prev => ({ ...prev, [zone]: prev[zone] + selectedChip }))
    setMessage(null)
  }

  const clearBets = () => {
    if (dealing) return
    setBets({ Dragon: 0, Tiger: 0, Tie: 0 })
    setMessage(null)
  }

  const dealRound = async () => {
    const totalBet = Object.values(bets).reduce((a, b) => a + b, 0)
    if (totalBet <= 0) {
      return setMessage({ type: 'error', text: 'Please place your bet chips first!' })
    }
    if (!wallet || wallet.balance < totalBet) {
      return setMessage({ type: 'error', text: 'Insufficient balance for these bets!' })
    }

    setDealing(true)
    setProcessing(true)
    setMessage(null)
    setResult(null)
    setDragonCard(null)
    setTigerCard(null)
    setCardState('back')

    // 1. Submit bet to API
    try {
      const res = await fetch('/api/wallet/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, amount: totalBet })
      })
      const data = await res.json()
      if (!data.success) {
        setDealing(false)
        setProcessing(false)
        return setMessage({ type: 'error', text: data.error || 'Bet submission failed.' })
      }
      fetchWallet()
    } catch (e) {
      setDealing(false)
      setProcessing(false)
      return setMessage({ type: 'error', text: 'Network connection issue.' })
    }

    // 2. Deal animation sequence
    setTimeout(() => {
      // Pick random cards
      const dCard = CARDS_DECK[Math.floor(Math.random() * CARDS_DECK.length)]
      let tCard = CARDS_DECK[Math.floor(Math.random() * CARDS_DECK.length)]
      // Prevent exact same card object reference
      while (dCard.suit === tCard.suit && dCard.value === tCard.value) {
        tCard = CARDS_DECK[Math.floor(Math.random() * CARDS_DECK.length)]
      }

      setDragonCard(dCard)
      setTigerCard(tCard)
      setCardState('reveal')

      // Determine outcome
      let winner = 'Tie'
      if (dCard.rank > tCard.rank) winner = 'Dragon'
      else if (tCard.rank > dCard.rank) winner = 'Tiger'
      
      setResult(winner)
      setHistory(prev => [winner === 'Dragon' ? 'D' : winner === 'Tiger' ? 'T' : 'Tie', ...prev].slice(0, 15))

      // 3. Payout logic
      let payoutMultiplier = 0
      
      if (winner === 'Dragon') {
        payoutMultiplier += (bets.Dragon * 2.0)
      } else if (winner === 'Tiger') {
        payoutMultiplier += (bets.Tiger * 2.0)
      } else {
        // Tie
        payoutMultiplier += (bets.Tie * 9.0) // 8 to 1 payout
        // Dragon and Tiger return 50% on Tie
        payoutMultiplier += (bets.Dragon * 0.5)
        payoutMultiplier += (bets.Tiger * 0.5)
      }

      setTimeout(async () => {
        if (payoutMultiplier > 0) {
          try {
            // Calculate final net multiplier relative to total bet
            const netMultiplier = parseFloat((payoutMultiplier / totalBet).toFixed(4))
            const payRes = await fetch('/api/wallet/payout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: user.id,
                bet_amount: totalBet,
                multiplier: netMultiplier
              })
            })
            const payData = await payRes.json()
            if (payData.success) {
              setMessage({
                type: 'success',
                text: `🎉 Round Over! ${winner} Wins! Payout: ₱${payoutMultiplier.toFixed(2)}`
              })
            }
          } catch (e) {
            setMessage({ type: 'error', text: 'Failed to credit winnings. Contact Admin.' })
          }
        } else {
          setMessage({
            type: 'error',
            text: `💥 Loss! ${winner} Wins. Better luck next hand!`
          })
        }
        
        setDealing(false)
        setProcessing(false)
        setBets({ Dragon: 0, Tiger: 0, Tie: 0 })
        fetchWallet()
      }, 1200)

    }, 1500)
  }

  const renderCard = (card) => {
    if (!card) return null
    if (cardState === 'back') {
      return (
        <div style={{
          width: '75px',
          height: '110px',
          background: 'linear-gradient(135deg, #d32f2f 0%, #7b1fa2 100%)',
          border: '2px solid #fff',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: '900',
          color: '#fff',
          animation: 'pulse 1s infinite alternate'
        }}>
          ♠
        </div>
      )
    }

    return (
      <div style={{
        width: '75px',
        height: '110px',
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '8px',
        color: card.color === '#fff' ? '#111' : card.color,
        position: 'relative',
        animation: 'flipIn 0.4s ease-out'
      }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', lineHeight: '1' }}>
          {card.value}
          <div style={{ fontSize: '12px' }}>{card.suit}</div>
        </div>
        
        <div style={{ fontSize: '32px', textAlign: 'center', margin: 'auto 0' }}>
          {card.suit}
        </div>
        
        <div style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'right', transform: 'rotate(180deg)', lineHeight: '1' }}>
          {card.value}
          <div style={{ fontSize: '12px' }}>{card.suit}</div>
        </div>
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
      background: 'linear-gradient(180deg, #034b22 0%, #011d0d 100%)', // Real Green Felt table color
      width: '100%',
      minHeight: '100%',
      overflowY: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '550px',
        textAlign: 'center',
        background: 'rgba(0, 0, 0, 0.45)',
        padding: '20px',
        borderRadius: '16px',
        border: '2px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
      }}>
        {/* Header Title */}
        <h2 style={{
          fontSize: '22px',
          fontWeight: '900',
          color: 'var(--accent)',
          letterSpacing: '1px',
          textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          marginBottom: '14px'
        }}>🐉 DRAGON vs TIGER 🐯</h2>

        {/* Live Dealer Bead Road History */}
        <div style={{
          display: 'flex',
          gap: '5px',
          justifyContent: 'center',
          marginBottom: '16px',
          background: '#04150a',
          padding: '6px',
          borderRadius: '8px',
          border: '1px solid #063c1a',
          overflowX: 'auto'
        }}>
          {history.map((h, i) => (
            <span key={i} style={{
              background: h === 'D' ? '#00e676' : h === 'T' ? '#ff1744' : '#ffea00',
              color: '#000',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              fontSize: '10px',
              fontWeight: '900',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {h}
            </span>
          ))}
        </div>

        {/* Card Arenas */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          background: '#041f0e',
          border: '2px dashed #093c1d',
          borderRadius: '12px',
          padding: '24px 12px',
          marginBottom: '20px',
          minHeight: '160px',
          position: 'relative'
        }}>
          {/* Dragon card block */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#00e676', fontWeight: 'bold', fontSize: '13px', letterSpacing: '1px' }}>DRAGON (DRAGON)</span>
            <div style={{ minHeight: '110px', width: '75px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#021208', borderRadius: '8px' }}>
              {renderCard(dragonCard)}
            </div>
            {dragonCard && cardState === 'reveal' && (
              <span style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>Rank: {dragonCard.rank}</span>
            )}
          </div>

          {/* VS Divider */}
          <div style={{ fontSize: '24px', fontWeight: '900', color: 'rgba(255,255,255,0.15)', fontStyle: 'italic' }}>VS</div>

          {/* Tiger card block */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#ff1744', fontWeight: 'bold', fontSize: '13px', letterSpacing: '1px' }}>TIGER (TIGER)</span>
            <div style={{ minHeight: '110px', width: '75px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#021208', borderRadius: '8px' }}>
              {renderCard(tigerCard)}
            </div>
            {tigerCard && cardState === 'reveal' && (
              <span style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>Rank: {tigerCard.rank}</span>
            )}
          </div>
        </div>

        {/* Betting Board Zones */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button 
            disabled={dealing}
            onClick={() => placeBetOnZone('Dragon')}
            style={{
              flex: 1,
              background: 'linear-gradient(to bottom, #00701a, #004d40)',
              border: '2px solid #00e676',
              borderRadius: '8px',
              padding: '12px 6px',
              cursor: 'pointer',
              color: '#fff',
              position: 'relative',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#00e676' }}>🐉 DRAGON</div>
            <div style={{ fontSize: '11px', color: '#ccc', marginTop: '2px' }}>Pays 1:1</div>
            {bets.Dragon > 0 && (
              <div style={{ position: 'absolute', top: '-10px', right: '-6px', background: '#00e676', color: '#000', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', border: '2px solid #fff' }}>
                ₱{bets.Dragon}
              </div>
            )}
          </button>

          <button 
            disabled={dealing}
            onClick={() => placeBetOnZone('Tie')}
            style={{
              flex: 1,
              background: 'linear-gradient(to bottom, #795548, #4e342e)',
              border: '2px solid #ffea00',
              borderRadius: '8px',
              padding: '12px 6px',
              cursor: 'pointer',
              color: '#fff',
              position: 'relative',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#ffea00' }}>🤝 TIE</div>
            <div style={{ fontSize: '11px', color: '#ccc', marginTop: '2px' }}>Pays 8:1</div>
            {bets.Tie > 0 && (
              <div style={{ position: 'absolute', top: '-10px', right: '-6px', background: '#ffea00', color: '#000', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', border: '2px solid #fff' }}>
                ₱{bets.Tie}
              </div>
            )}
          </button>

          <button 
            disabled={dealing}
            onClick={() => placeBetOnZone('Tiger')}
            style={{
              flex: 1,
              background: 'linear-gradient(to bottom, #7f0000, #3e2723)',
              border: '2px solid #ff1744',
              borderRadius: '8px',
              padding: '12px 6px',
              cursor: 'pointer',
              color: '#fff',
              position: 'relative',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#ff1744' }}>🐯 TIGER</div>
            <div style={{ fontSize: '11px', color: '#ccc', marginTop: '2px' }}>Pays 1:1</div>
            {bets.Tiger > 0 && (
              <div style={{ position: 'absolute', top: '-10px', right: '-6px', background: '#ff1744', color: '#000', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', border: '2px solid #fff' }}>
                ₱{bets.Tiger}
              </div>
            )}
          </button>
        </div>

        {/* Bets & Chip Selection Selector */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: '#041c0e', 
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '16px' 
        }}>
          <span style={{ fontSize: '12px', color: '#bbb' }}>Chips:</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[10, 50, 100, 500, 1000].map(val => (
              <button 
                key={val}
                disabled={dealing}
                onClick={() => setSelectedChip(val)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: selectedChip === val ? '3px solid #ffea00' : '1px solid #888',
                  background: val === 10 ? '#3f51b5' : val === 50 ? '#009688' : val === 100 ? '#4caf50' : val === 500 ? '#ff9800' : '#e91e63',
                  color: '#fff',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transform: selectedChip === val ? 'scale(1.15)' : 'none',
                  transition: 'transform 0.1s'
                }}
              >
                {val}
              </button>
            ))}
          </div>
          <button 
            disabled={dealing}
            onClick={clearBets}
            style={{ padding: '6px 12px', fontSize: '10px', background: '#5d4037', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
          >
            Clear
          </button>
        </div>

        {/* Display feedback messages */}
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

        {/* Deal button */}
        <button
          onClick={dealRound}
          disabled={dealing || processing}
          style={{
            width: '100%',
            background: 'linear-gradient(90deg, #ffea00 0%, #ff9800 100%)',
            color: '#000',
            border: 'none',
            padding: '14px',
            borderRadius: '8px',
            fontWeight: '900',
            fontSize: '15px',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          {dealing ? 'DEALING CARDS...' : 'START DEAL'}
        </button>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'

const NUMBERS = [
  { n: 0, color: 'green' }, { n: 32, color: 'red' }, { n: 15, color: 'black' },
  { n: 19, color: 'red' }, { n: 4, color: 'black' }, { n: 21, color: 'red' },
  { n: 2, color: 'black' }, { n: 25, color: 'red' }, { n: 17, color: 'black' },
  { n: 34, color: 'red' }, { n: 6, color: 'black' }, { n: 27, color: 'red' },
  { n: 13, color: 'black' }, { n: 36, color: 'red' }, { n: 11, color: 'black' },
  { n: 30, color: 'red' }, { n: 8, color: 'black' }, { n: 23, color: 'red' },
  { n: 10, color: 'black' }, { n: 5, color: 'red' }, { n: 24, color: 'black' },
  { n: 16, color: 'red' }, { n: 33, color: 'black' }, { n: 1, color: 'red' },
  { n: 20, color: 'black' }, { n: 14, color: 'red' }, { n: 31, color: 'black' },
  { n: 9, color: 'red' }, { n: 22, color: 'black' }, { n: 18, color: 'red' },
  { n: 29, color: 'black' }, { n: 7, color: 'red' }, { n: 28, color: 'black' },
  { n: 12, color: 'red' }, { n: 35, color: 'black' }, { n: 3, color: 'red' },
  { n: 26, color: 'black' }
]

export default function RouletteGame({ user, wallet, fetchWallet }) {
  const [selectedChips, setSelectedChips] = useState([]) // { type, value, amount }
  const [betSize, setBetSize] = useState(10) // Active placing chip size: 10, 50, 100, 500
  const [spinning, setSpinning] = useState(false)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [winningNumber, setWinningNumber] = useState(null)
  const [message, setMessage] = useState(null)
  const [payoutMsg, setPayoutMsg] = useState(null)

  const placeBet = (type, value) => {
    if (spinning) return
    setMessage(null)
    setPayoutMsg(null)

    // Calculate total proposed bet
    const totalBet = selectedChips.reduce((sum, c) => sum + c.amount, 0) + betSize
    if (!wallet || wallet.balance < totalBet) {
      return setMessage({ type: 'error', text: 'Insufficient balance for this bet!' })
    }

    // Add or merge chip
    setSelectedChips(prev => {
      const existingIdx = prev.findIndex(c => c.type === type && c.value === value)
      if (existingIdx > -1) {
        const next = [...prev]
        next[existingIdx].amount += betSize
        return next
      } else {
        return [...prev, { type, value, amount: betSize }]
      }
    })
  }

  const clearBets = () => {
    if (spinning) return
    setSelectedChips([])
    setMessage(null)
    setWinningNumber(null)
    setPayoutMsg(null)
  }

  const triggerSpin = async () => {
    if (spinning) return
    if (selectedChips.length === 0) {
      return setMessage({ type: 'error', text: 'Please place your chips on the layout first!' })
    }

    const totalBet = selectedChips.reduce((sum, c) => sum + c.amount, 0)
    if (!wallet || wallet.balance < totalBet) {
      return setMessage({ type: 'error', text: 'Insufficient balance!' })
    }

    setSpinning(true)
    setMessage(null)
    setWinningNumber(null)
    setPayoutMsg(null)

    // 1. Deduct total bet
    try {
      const res = await fetch('/api/wallet/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, amount: totalBet })
      })
      const data = await res.json()
      if (!data.success) {
        setSpinning(false)
        return setMessage({ type: 'error', text: data.error || 'Failed to place bet.' })
      }
      fetchWallet()
    } catch (e) {
      setSpinning(false)
      return setMessage({ type: 'error', text: 'Server connection failed.' })
    }

    // 2. Perform spin math and animation
    const winningIdx = Math.floor(Math.random() * 37)
    const targetObj = NUMBERS[winningIdx]
    
    // Each sector is 360 / 37 = 9.73 degrees
    const sectorDeg = 360 / 37
    const rotationOffset = 360 - (winningIdx * sectorDeg)
    
    // Spin 5 to 8 full rotations plus offset for deceleration visual
    const targetRotation = wheelRotation + (360 * 6) + rotationOffset
    setWheelRotation(targetRotation)

    setTimeout(async () => {
      setWinningNumber(targetObj)
      setSpinning(false)

      // 3. Evaluate winning chips
      let totalPayout = 0
      let details = []

      selectedChips.forEach(chip => {
        let isWin = false
        let payoutMult = 0

        if (chip.type === 'number' && Number(chip.value) === targetObj.n) {
          isWin = true
          payoutMult = 36 // 35:1 payout
        } else if (chip.type === 'color' && chip.value === targetObj.color) {
          isWin = true
          payoutMult = 2 // 1:1 payout
        } else if (chip.type === 'parity') {
          const isEven = targetObj.n !== 0 && targetObj.n % 2 === 0
          const isOdd = targetObj.n !== 0 && targetObj.n % 2 !== 0
          if ((chip.value === 'even' && isEven) || (chip.value === 'odd' && isOdd)) {
            isWin = true
            payoutMult = 2
          }
        }

        if (isWin) {
          totalPayout += chip.amount * payoutMult
          details.push(`₱${(chip.amount * payoutMult).toFixed(2)} on ${chip.value.toString().toUpperCase()}`)
        }
      })

      // 4. Send payout
      if (totalPayout > 0) {
        try {
          const payRes = await fetch('/api/wallet/payout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.id,
              bet_amount: totalBet,
              multiplier: (totalPayout / totalBet)
            })
          })
          const payData = await payRes.json()
          if (payData.success) {
            setPayoutMsg({
              type: 'success',
              text: `🎉 WINNER! Landed ${targetObj.color.toUpperCase()} ${targetObj.n}! Payout: +₱${totalPayout.toFixed(2)} (${details.join(', ')})`
            })
            // Dispatch client event for real-time NavBar balance sync
            window.dispatchEvent(new Event('wallet-updated'))
          }
        } catch (err) {
          console.error(err)
        }
      } else {
        setPayoutMsg({
          type: 'lose',
          text: `😭 Landed ${targetObj.color.toUpperCase()} ${targetObj.n}. Better luck next time!`
        })
      }
      fetchWallet()
    }, 4200) // Deceleration timing
  }

  const getBetOnZone = (type, value) => {
    const chip = selectedChips.find(c => c.type === type && c.value === value)
    return chip ? chip.amount : 0
  }

  const totalCurrentBet = selectedChips.reduce((sum, c) => sum + c.amount, 0)

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'linear-gradient(180deg, #051a0e 0%, #010603 100%)',
      width: '100%',
      minHeight: '100%',
      overflowY: 'auto'
    }}>
      <h2 style={{
        fontSize: '22px',
        fontWeight: '950',
        fontStyle: 'italic',
        background: 'linear-gradient(to right, #00e676, #f5c242)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '16px',
        textShadow: '0 2px 15px rgba(0, 230, 118, 0.25)'
      }}>
        EUROPEAN ROULETTE
      </h2>

      {/* Decelerating Circular Roulette Wheel */}
      <div style={{ position: 'relative', width: '190px', height: '190px', marginBottom: '20px' }}>
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '6px solid #5a3c10',
          background: '#0c0d10',
          boxShadow: '0 8px 25px rgba(0,0,0,0.8), 0 0 15px rgba(245,194,66,0.15)',
          position: 'relative',
          transition: spinning ? 'transform 4s cubic-bezier(0.1, 0.8, 0.1, 1)' : 'none',
          transform: `rotate(${wheelRotation}deg)`
        }}>
          {/* Central golden cone */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '40px',
            height: '40px',
            background: 'radial-gradient(circle, #f5c242 0%, #a67c00 100%)',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
            zIndex: 3
          }} />
          
          {/* Inner ring track */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '140px',
            height: '140px',
            border: '2px solid rgba(255,255,255,0.05)',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1
          }} />

          {/* Numbers sectors pointers representation */}
          {NUMBERS.map((val, idx) => {
            const angle = idx * (360 / 37)
            return (
              <div 
                key={idx} 
                style={{
                  position: 'absolute',
                  top: '0',
                  left: '50%',
                  height: '95px',
                  width: '14px',
                  transformOrigin: 'bottom center',
                  transform: `translateX(-50%) rotate(${angle}deg)`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  fontSize: '8px',
                  fontWeight: 'bold',
                  color: '#fff'
                }}
              >
                <div style={{
                  width: '100%',
                  height: '14px',
                  background: val.color === 'green' ? '#00e676' : val.color === 'red' ? '#ff1744' : '#212121',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '7px'
                }}>
                  {val.n}
                </div>
              </div>
            )
          })}
        </div>

        {/* Fixed ball pointer indicator at the top */}
        <div style={{
          position: 'absolute',
          top: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '14px',
          height: '14px',
          background: '#fff',
          borderRadius: '50%',
          boxShadow: '0 0 10px #fff, 0 2px 4px rgba(0,0,0,0.5)',
          zIndex: 5
        }} />
      </div>

      {/* Winning outcome overlay */}
      {winningNumber && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: '#131924',
          border: '1px solid var(--border)',
          padding: '8px 18px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '900',
          marginBottom: '16px',
          animation: 'bounce-slow 1s infinite'
        }}>
          🎯 LANDED: 
          <span style={{
            background: winningNumber.color === 'green' ? '#00e676' : winningNumber.color === 'red' ? '#ff1744' : '#000',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '15px'
          }}>
            {winningNumber.n}
          </span>
        </div>
      )}

      {/* Betting Chips Selectors */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: '#090d14', padding: '8px', borderRadius: '30px', border: '1px solid #1c2635' }}>
        {[10, 50, 100, 500].map(amt => (
          <button
            key={amt}
            onClick={() => setBetSize(amt)}
            disabled={spinning}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: betSize === amt ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
              color: betSize === amt ? '#000' : '#fff',
              border: betSize === amt ? '2px solid #fff' : '2px dashed rgba(255,255,255,0.2)',
              fontSize: '11px',
              fontWeight: '900',
              cursor: spinning ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: betSize === amt ? '0 0 10px var(--accent)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            ₱{amt}
          </button>
        ))}
      </div>

      {/* Roulette Layout Board */}
      <div style={{
        width: '100%',
        maxWidth: '360px',
        background: '#0d131a',
        border: '2px solid #5a3c10',
        borderRadius: '12px',
        padding: '8px',
        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)'
      }}>
        {/* Simple Outside Bets */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          <button 
            onClick={() => placeBet('color', 'red')} 
            disabled={spinning}
            className="menu-item-hover"
            style={{
              flex: 1,
              height: '42px',
              background: '#ff1744',
              color: '#fff',
              border: '1px solid #fff',
              borderRadius: '8px',
              fontWeight: '900',
              fontSize: '12px',
              position: 'relative',
              cursor: 'pointer'
            }}
          >
            🔴 RED (2x)
            {getBetOnZone('color', 'red') > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--accent)', color: '#000', borderRadius: '50%', padding: '2px 6px', fontSize: '9px', fontWeight: '900', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                ₱{getBetOnZone('color', 'red')}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => placeBet('color', 'black')} 
            disabled={spinning}
            className="menu-item-hover"
            style={{
              flex: 1,
              height: '42px',
              background: '#212121',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '8px',
              fontWeight: '900',
              fontSize: '12px',
              position: 'relative',
              cursor: 'pointer'
            }}
          >
            ⚫ BLACK (2x)
            {getBetOnZone('color', 'black') > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--accent)', color: '#000', borderRadius: '50%', padding: '2px 6px', fontSize: '9px', fontWeight: '900', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                ₱{getBetOnZone('color', 'black')}
              </span>
            )}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          <button 
            onClick={() => placeBet('parity', 'even')} 
            disabled={spinning}
            style={{
              flex: 1,
              height: '36px',
              background: 'rgba(255,255,255,0.04)',
              color: '#fff',
              border: '1px solid #222',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 'bold',
              position: 'relative',
              cursor: 'pointer'
            }}
          >
            EVEN (2x)
            {getBetOnZone('parity', 'even') > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--accent)', color: '#000', borderRadius: '50%', padding: '2px 6px', fontSize: '8px', fontWeight: '900' }}>
                ₱{getBetOnZone('parity', 'even')}
              </span>
            )}
          </button>

          <button 
            onClick={() => placeBet('parity', 'odd')} 
            disabled={spinning}
            style={{
              flex: 1,
              height: '36px',
              background: 'rgba(255,255,255,0.04)',
              color: '#fff',
              border: '1px solid #222',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 'bold',
              position: 'relative',
              cursor: 'pointer'
            }}
          >
            ODD (2x)
            {getBetOnZone('parity', 'odd') > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--accent)', color: '#000', borderRadius: '50%', padding: '2px 6px', fontSize: '8px', fontWeight: '900' }}>
                ₱{getBetOnZone('parity', 'odd')}
              </span>
            )}
          </button>
        </div>

        {/* Inside Single Numbers grid selector (0 to 36) */}
        <div style={{ borderTop: '1px dashed #333', paddingTop: '8px' }}>
          <div style={{ fontSize: '10px', color: 'var(--muted)', textAlign: 'center', marginBottom: '6px', fontWeight: 'bold' }}>
            🎯 Inside Number Bets (36x Multiplier)
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '5px'
          }}>
            {/* 0 Green cell */}
            <button
              onClick={() => placeBet('number', 0)}
              disabled={spinning}
              style={{
                gridColumn: 'span 6',
                background: '#00e676',
                color: '#000',
                fontWeight: '900',
                border: 'none',
                height: '32px',
                borderRadius: '6px',
                fontSize: '13px',
                position: 'relative',
                cursor: 'pointer'
              }}
            >
              0
              {getBetOnZone('number', 0) > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '4px', background: '#fff', color: '#000', borderRadius: '50%', padding: '1px 5px', fontSize: '8px', fontWeight: '900' }}>
                  ₱{getBetOnZone('number', 0)}
                </span>
              )}
            </button>

            {/* Numbers 1-36 */}
            {Array.from({ length: 36 }, (_, i) => i + 1).map(num => {
              const matches = NUMBERS.find(n => n.n === num)
              const color = matches ? matches.color : 'red'
              
              return (
                <button
                  key={num}
                  onClick={() => placeBet('number', num)}
                  disabled={spinning}
                  style={{
                    background: color === 'red' ? '#ff1744' : '#1d222d',
                    color: '#fff',
                    border: 'none',
                    height: '30px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    position: 'relative',
                    cursor: 'pointer',
                    boxShadow: 'inset 0 0 5px rgba(0,0,0,0.5)'
                  }}
                >
                  {num}
                  {getBetOnZone('number', num) > 0 && (
                    <span style={{ 
                      position: 'absolute', 
                      top: '-6px', 
                      right: '-4px', 
                      background: 'var(--accent)', 
                      color: '#000', 
                      borderRadius: '50%', 
                      width: '14px', 
                      height: '14px', 
                      fontSize: '7px', 
                      fontWeight: '900',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {getBetOnZone('number', num)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Warning/Success messages */}
      {message && (
        <div style={{
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          marginTop: '12px',
          background: 'rgba(255, 23, 68, 0.15)',
          color: '#ff6666',
          border: '1px solid rgba(255, 23, 68, 0.3)',
          maxWidth: '360px',
          textAlign: 'center'
        }}>
          ⚠️ {message.text}
        </div>
      )}

      {payoutMsg && (
        <div style={{
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '12.5px',
          marginTop: '12px',
          background: payoutMsg.type === 'success' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255,255,255,0.05)',
          color: payoutMsg.type === 'success' ? '#00ff88' : '#aaa',
          border: `1px solid ${payoutMsg.type === 'success' ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255,255,255,0.1)'}`,
          maxWidth: '360px',
          textAlign: 'center'
        }}>
          {payoutMsg.text}
        </div>
      )}

      {/* Control Actions */}
      <div style={{
        display: 'flex',
        gap: '10px',
        width: '100%',
        maxWidth: '360px',
        marginTop: '16px'
      }}>
        <button
          className="btn"
          onClick={clearBets}
          disabled={spinning || selectedChips.length === 0}
          style={{ flex: 1, padding: '14px', fontSize: '13px', background: '#000', border: '1px solid #333' }}
        >
          🗑️ CLEAR BETS
        </button>

        <button
          className="btn primary"
          onClick={triggerSpin}
          disabled={spinning || selectedChips.length === 0}
          style={{
            flex: 2,
            padding: '14px',
            fontSize: '15px',
            fontWeight: '900',
            background: 'linear-gradient(135deg, var(--accent) 0%, #e6a100 100%)',
            color: '#000',
            boxShadow: '0 4px 15px rgba(245, 194, 66, 0.25)'
          }}
        >
          {spinning ? 'SPINNING...' : `SPIN WHEEL — ₱${totalCurrentBet}`}
        </button>
      </div>
    </div>
  )
}

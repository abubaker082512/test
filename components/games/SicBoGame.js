import React, { useState, useEffect } from 'react'

export default function SicBoGame({ user, wallet, fetchWallet }) {
  const [selectedChip, setSelectedChip] = useState(10)
  const [bets, setBets] = useState({
    Small: 0,
    Big: 0,
    Odd: 0,
    Even: 0,
    AnyTriple: 0,
    Num1: 0,
    Num2: 0,
    Num3: 0,
    Num4: 0,
    Num5: 0,
    Num6: 0
  })
  const [shaking, setShaking] = useState(false)
  const [dice, setDice] = useState([1, 2, 3])
  const [resultSum, setResultSum] = useState(null)
  const [message, setMessage] = useState(null)
  const [history, setHistory] = useState([8, 12, 15, 6, 14, 10, 11])
  const [processing, setProcessing] = useState(false)

  const placeBet = (zone) => {
    if (shaking) return
    const totalCurrentBets = Object.values(bets).reduce((a, b) => a + b, 0)
    const newTotal = totalCurrentBets + selectedChip
    if (!wallet || wallet.balance < newTotal) {
      return setMessage({ type: 'error', text: 'Insufficient balance to place bet!' })
    }
    setBets(prev => ({ ...prev, [zone]: prev[zone] + selectedChip }))
    setMessage(null)
  }

  const clearBets = () => {
    if (shaking) return
    setBets({
      Small: 0,
      Big: 0,
      Odd: 0,
      Even: 0,
      AnyTriple: 0,
      Num1: 0,
      Num2: 0,
      Num3: 0,
      Num4: 0,
      Num5: 0,
      Num6: 0
    })
    setMessage(null)
  }

  const shakeDice = async () => {
    const totalBet = Object.values(bets).reduce((a, b) => a + b, 0)
    if (totalBet <= 0) {
      return setMessage({ type: 'error', text: 'Place chip bets on the layout first!' })
    }
    if (!wallet || wallet.balance < totalBet) {
      return setMessage({ type: 'error', text: 'Insufficient balance for these bets!' })
    }

    setShaking(true)
    setProcessing(true)
    setMessage(null)
    setResultSum(null)

    // 1. Submit bet to API
    try {
      const res = await fetch('/api/wallet/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, amount: totalBet })
      })
      const data = await res.json()
      if (!data.success) {
        setShaking(false)
        setProcessing(false)
        return setMessage({ type: 'error', text: data.error || 'Bet submission failed.' })
      }
      fetchWallet()
    } catch (e) {
      setShaking(false)
      setProcessing(false)
      return setMessage({ type: 'error', text: 'Network connection issue.' })
    }

    // 2. Shake animation timer
    let shakesCount = 0
    const interval = setInterval(() => {
      setDice([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ])
      shakesCount++
      if (shakesCount > 12) {
        clearInterval(interval)
        
        // Final roll
        const finalDice = [
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1
        ]
        setDice(finalDice)
        const sum = finalDice.reduce((a, b) => a + b, 0)
        setResultSum(sum)
        setHistory(prev => [sum, ...prev].slice(0, 15))

        // Analyze payouts
        const isTriple = finalDice[0] === finalDice[1] && finalDice[1] === finalDice[2]
        const isSmall = sum >= 4 && sum <= 10 && !isTriple
        const isBig = sum >= 11 && sum <= 17 && !isTriple
        const isOdd = sum % 2 !== 0 && !isTriple
        const isEven = sum % 2 === 0 && !isTriple

        let payoutAmount = 0

        // Small / Big bets payout 1:1
        if (isSmall) payoutAmount += (bets.Small * 2.0)
        if (isBig) payoutAmount += (bets.Big * 2.0)

        // Odd / Even payout 1:1
        if (isOdd) payoutAmount += (bets.Odd * 2.0)
        if (isEven) payoutAmount += (bets.Even * 2.0)

        // Any Triple pays 30:1
        if (isTriple) payoutAmount += (bets.AnyTriple * 31.0) // 30 to 1 pays 31x bet

        // Single numbers pay based on count of matches
        for (let num = 1; num <= 6; num++) {
          const matchCount = finalDice.filter(d => d === num).length
          if (matchCount > 0) {
            const betVal = bets[`Num${num}`]
            if (betVal > 0) {
              // 1 match pays 1:1, 2 matches pay 2:1, 3 matches pay 3:1
              payoutAmount += (betVal * (1.0 + matchCount))
            }
          }
        }

        setTimeout(async () => {
          if (payoutAmount > 0) {
            try {
              const netMultiplier = parseFloat((payoutAmount / totalBet).toFixed(4))
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
                  text: `🎉 Dice Result: [${finalDice.join(', ')}] Sum: ${sum}. Won ₱${payoutAmount.toFixed(2)}!`
                })
              }
            } catch (e) {
              setMessage({ type: 'error', text: 'Payout failed to credit.' })
            }
          } else {
            setMessage({
              type: 'error',
              text: `💥 Loss! Dice: [${finalDice.join(', ')}] Sum: ${sum}. Try another shake!`
            })
          }
          setShaking(false)
          setProcessing(false)
          setBets({
            Small: 0,
            Big: 0,
            Odd: 0,
            Even: 0,
            AnyTriple: 0,
            Num1: 0,
            Num2: 0,
            Num3: 0,
            Num4: 0,
            Num5: 0,
            Num6: 0
          })
          fetchWallet()
        }, 1000)
      }
    }, 100)
  }

  const renderDiceFace = (val) => {
    const dotsMap = {
      1: ['center'],
      2: ['top-left', 'bottom-right'],
      3: ['top-left', 'center', 'bottom-right'],
      4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
      6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right']
    }
    const dots = dotsMap[val] || []

    return (
      <div style={{
        width: '40px',
        height: '40px',
        background: '#fff',
        borderRadius: '6px',
        boxShadow: '0 3px 6px rgba(0,0,0,0.4)',
        position: 'relative',
        margin: '6px'
      }}>
        {dots.map((pos, idx) => {
          let styles = {
            position: 'absolute',
            width: '8px',
            height: '8px',
            background: val === 1 || val === 4 ? '#d32f2f' : '#222', // Standard asian style dice colored dots
            borderRadius: '50%'
          }
          if (pos === 'center') { styles.top = '16px'; styles.left = '16px' }
          if (pos === 'top-left') { styles.top = '5px'; styles.left = '5px' }
          if (pos === 'top-right') { styles.top = '5px'; styles.right = '5px' }
          if (pos === 'middle-left') { styles.top = '16px'; styles.left = '5px' }
          if (pos === 'middle-right') { styles.top = '16px'; styles.right = '5px' }
          if (pos === 'bottom-left') { styles.bottom = '5px'; styles.left = '5px' }
          if (pos === 'bottom-right') { styles.bottom = '5px'; styles.right = '5px' }

          return <div key={idx} style={styles} />
        })}
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
      background: 'linear-gradient(180deg, #11361c 0%, #03150a 100%)', // SicBo Green felt table
      width: '100%',
      minHeight: '100%',
      overflowY: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '540px',
        background: 'rgba(0, 0, 0, 0.5)',
        border: '2px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '22px',
          fontWeight: '900',
          color: '#00e676',
          letterSpacing: '1px',
          marginBottom: '14px',
          textShadow: '0 2px 8px rgba(0,230,118,0.2)'
        }}>🎲 CASINO SIC BO</h2>

        {/* Recent Road history */}
        <div style={{
          display: 'flex',
          gap: '6px',
          justifyContent: 'center',
          marginBottom: '16px',
          background: '#041008',
          padding: '6px',
          borderRadius: '8px',
          overflowX: 'auto',
          fontSize: '11px',
          color: '#aaa'
        }}>
          History:
          {history.map((h, i) => (
            <span key={i} style={{
              background: h <= 10 ? '#ff1744' : '#00e676',
              color: '#000',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 'bold',
              fontSize: '10px'
            }}>
              {h}
            </span>
          ))}
        </div>

        {/* Interactive Dice Dome container */}
        <div style={{
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #203a27 0%, #031207 100%)',
          border: '4px solid #ffea00',
          margin: '0 auto 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(0,230,118,0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Shaking glass shine dome visual */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 60%)',
            pointerEvents: 'none',
            borderRadius: '50%'
          }}></div>

          <div style={{
            display: 'flex',
            transform: shaking ? 'translateY(-5px) scale(0.95)' : 'none',
            animation: shaking ? 'spin-slow 0.1s linear infinite' : 'none',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {dice.map((d, i) => (
              <div key={i} style={{ transform: shaking ? `rotate(${Math.random() * 360}deg)` : 'none' }}>
                {renderDiceFace(d)}
              </div>
            ))}
          </div>
          
          {resultSum !== null && (
            <div style={{
              position: 'absolute',
              bottom: '8px',
              background: '#ffea00',
              color: '#000',
              fontWeight: '900',
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '10px'
            }}>
              SUM: {resultSum}
            </div>
          )}
        </div>

        {/* Layout betting blocks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {/* Big / Small, Odd / Even */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              disabled={shaking}
              onClick={() => placeBet('Small')}
              style={{
                flex: 1,
                background: '#04220e',
                border: '1px solid #00e676',
                borderRadius: '8px',
                padding: '10px 4px',
                color: '#fff',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <div style={{ fontWeight: 'bold', color: '#00e676', fontSize: '13px' }}>SMALL</div>
              <div style={{ fontSize: '9px', color: '#aaa' }}>4 - 10 (1:1)</div>
              {bets.Small > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-4px', background: '#00e676', color: '#000', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold' }}>₱{bets.Small}</span>}
            </button>

            <button
              disabled={shaking}
              onClick={() => placeBet('Odd')}
              style={{
                flex: 1,
                background: '#04220e',
                border: '1px solid #4a148c',
                borderRadius: '8px',
                padding: '10px 4px',
                color: '#fff',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <div style={{ fontWeight: 'bold', color: '#ab47bc', fontSize: '13px' }}>ODD</div>
              <div style={{ fontSize: '9px', color: '#aaa' }}>Single (1:1)</div>
              {bets.Odd > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-4px', background: '#ab47bc', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold' }}>₱{bets.Odd}</span>}
            </button>

            <button
              disabled={shaking}
              onClick={() => placeBet('Even')}
              style={{
                flex: 1,
                background: '#04220e',
                border: '1px solid #4a148c',
                borderRadius: '8px',
                padding: '10px 4px',
                color: '#fff',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <div style={{ fontWeight: 'bold', color: '#ab47bc', fontSize: '13px' }}>EVEN</div>
              <div style={{ fontSize: '9px', color: '#aaa' }}>Double (1:1)</div>
              {bets.Even > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-4px', background: '#ab47bc', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold' }}>₱{bets.Even}</span>}
            </button>

            <button
              disabled={shaking}
              onClick={() => placeBet('Big')}
              style={{
                flex: 1,
                background: '#04220e',
                border: '1px solid #ff1744',
                borderRadius: '8px',
                padding: '10px 4px',
                color: '#fff',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <div style={{ fontWeight: 'bold', color: '#ff1744', fontSize: '13px' }}>BIG</div>
              <div style={{ fontSize: '9px', color: '#aaa' }}>11 - 17 (1:1)</div>
              {bets.Big > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-4px', background: '#ff1744', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold' }}>₱{bets.Big}</span>}
            </button>
          </div>

          {/* Any Triple bet */}
          <button
            disabled={shaking}
            onClick={() => placeBet('AnyTriple')}
            style={{
              background: '#1a1401',
              border: '1px solid #ffea00',
              borderRadius: '8px',
              padding: '12px',
              color: '#ffea00',
              cursor: 'pointer',
              fontWeight: 'bold',
              position: 'relative'
            }}
          >
            🎰 ANY TRIPLE (PAYS 30:1)
            {bets.AnyTriple > 0 && <span style={{ position: 'absolute', top: '-6px', right: '10px', background: '#ffea00', color: '#000', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', border: '1px solid #fff' }}>₱{bets.AnyTriple}</span>}
          </button>

          {/* Single numbers 1 to 6 */}
          <div>
            <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px', textAlign: 'left', fontWeight: 'bold' }}>SINGLE NUMBERS (1 matches pays 1:1, 2 matches pays 2:1, 3 matches pays 3:1):</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
              {[1, 2, 3, 4, 5, 6].map(num => (
                <button
                  key={num}
                  disabled={shaking}
                  onClick={() => placeBet(`Num${num}`)}
                  style={{
                    background: '#041c0e',
                    border: '1px solid #2e7d32',
                    color: '#fff',
                    padding: '8px 4px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    position: 'relative',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  {num}
                  {bets[`Num${num}`] > 0 && <span style={{ position: 'absolute', top: '-10px', right: '-4px', background: '#2e7d32', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold' }}>₱{bets[`Num${num}`]}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chip Selectors */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#041208',
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <span style={{ fontSize: '12px', color: '#bbb' }}>Chips:</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[10, 50, 100, 500].map(val => (
              <button
                key={val}
                disabled={shaking}
                onClick={() => setSelectedChip(val)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: selectedChip === val ? '3px solid #ffea00' : '1px solid #888',
                  background: val === 10 ? '#3f51b5' : val === 50 ? '#009688' : val === 100 ? '#4caf50' : '#ff9800',
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
            disabled={shaking}
            onClick={clearBets}
            style={{ padding: '6px 12px', fontSize: '10px', background: '#5d4037', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
          >
            Clear
          </button>
        </div>

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

        <button
          onClick={shakeDice}
          disabled={shaking || processing}
          style={{
            width: '100%',
            background: 'linear-gradient(90deg, #00e676 0%, #00ff88 100%)',
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
          {shaking ? 'SHAKING DOME...' : 'ROLL SHAKE'}
        </button>
      </div>
    </div>
  )
}

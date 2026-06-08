import React, { useState, useEffect } from 'react'

const INITIAL_MATCHES = [
  { id: 1, sport: 'Soccer', league: 'UEFA Champions League', home: 'Real Madrid', away: 'Manchester City', score: '2 - 1', time: 64, odds: { home: 1.85, draw: 3.40, away: 4.10 } },
  { id: 2, sport: 'Soccer', league: 'Premier League', home: 'Arsenal', away: 'Chelsea', score: '0 - 0', time: 14, odds: { home: 1.55, draw: 3.80, away: 6.00 } },
  { id: 3, sport: 'Cricket', league: 'T20 World Cup', home: 'Pakistan', away: 'India', score: '142/4 (17.2 Ov)', time: 'Innings 1', odds: { home: 2.10, draw: null, away: 1.70 } },
  { id: 4, sport: 'Basketball', league: 'NBA Finals', home: 'LA Lakers', away: 'Boston Celtics', score: '88 - 92', time: 'Q4 3:15', odds: { home: 3.10, draw: null, away: 1.38 } }
]

export default function SportsBook({ user, wallet, fetchWallet }) {
  const [matches, setMatches] = useState(INITIAL_MATCHES)
  const [selectedMatch, setSelectedMatch] = useState(INITIAL_MATCHES[0])
  const [selectedBet, setSelectedBet] = useState(null) // { matchId, option: 'home'|'draw'|'away', odds }
  const [stake, setStake] = useState(100)
  const [message, setMessage] = useState(null)
  const [tickets, setTickets] = useState([])
  const [processing, setProcessing] = useState(false)

  // Track odds changes to flash green/red
  const [oddsFlash, setOddsFlash] = useState({}) // key: `${matchId}-${option}`, val: 'up' | 'down'

  // Live matches simulation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setMatches(prev => {
        return prev.map(m => {
          // 1. Tick time
          let nextTime = m.time
          let nextScore = m.score

          if (m.sport === 'Soccer') {
            if (typeof m.time === 'number') {
              nextTime = m.time + 1
              if (nextTime > 90) {
                nextTime = 'Full Time'
              }
              // Randomly update score (1.5% chance)
              if (Math.random() < 0.015 && typeof nextTime === 'number') {
                const parts = m.score.split(' - ')
                const scores = [parseInt(parts[0]), parseInt(parts[1])]
                if (Math.random() < 0.5) scores[0]++
                else scores[1]++
                nextScore = `${scores[0]} - ${scores[1]}`
              }
            }
          }

          // 2. Adjust odds randomly
          const newOdds = { ...m.odds }
          Object.keys(newOdds).forEach(key => {
            if (newOdds[key] === null) return
            
            if (Math.random() < 0.15) {
              const change = (Math.random() - 0.5) * 0.15
              const oldVal = newOdds[key]
              const newVal = parseFloat(Math.max(1.05, oldVal + change).toFixed(2))
              newOdds[key] = newVal

              // Trigger flashing state
              const flashKey = `${m.id}-${key}`
              setOddsFlash(prev => ({
                ...prev,
                [flashKey]: newVal > oldVal ? 'up' : 'down'
              }))
              // Clear flash after 800ms
              setTimeout(() => {
                setOddsFlash(prev => {
                  const next = { ...prev }
                  delete next[flashKey]
                  return next
                })
              }, 800)
            }
          })

          const updatedMatch = { ...m, time: nextTime, score: nextScore, odds: newOdds }
          
          // Keep selected match state updated
          if (selectedMatch && selectedMatch.id === m.id) {
            setSelectedMatch(updatedMatch)
          }

          return updatedMatch
        })
      })
    }, 4000) // update matches every 4 seconds

    return () => clearInterval(interval)
  }, [selectedMatch])

  const selectBetOption = (match, option, oddsValue) => {
    if (oddsValue === null) return
    setSelectedBet({
      matchId: match.id,
      matchName: `${match.home} vs ${match.away}`,
      option,
      label: option === 'home' ? match.home : option === 'draw' ? 'Draw' : match.away,
      odds: oddsValue
    })
    setMessage(null)
  }

  const placeSportsBet = async () => {
    if (!selectedBet) return
    if (!wallet || wallet.balance < stake) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Please deposit.' })
    }

    setProcessing(true)
    setMessage(null)

    // Deduct stake bet
    const res = await fetch('/api/wallet/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, amount: stake })
    })
    const data = await res.json()
    if (!data.success) {
      setProcessing(false)
      return setMessage({ type: 'error', text: data.error })
    }
    fetchWallet()

    // Create ticket receipt
    const ticketId = Date.now()
    const newTicket = {
      id: ticketId,
      match: selectedBet.matchName,
      pick: selectedBet.label,
      odds: selectedBet.odds,
      stake,
      payout: parseFloat((stake * selectedBet.odds).toFixed(2)),
      status: 'Open'
    }

    setTickets(prev => [newTicket, ...prev])
    setSelectedBet(null)
    setMessage({ type: 'success', text: '🎫 Sports Bet slip submitted successfully!' })
    setProcessing(false)

    // Simulate match settlement after 10 seconds (concept loop)
    setTimeout(async () => {
      // 55% chance ticket wins for exciting gameplay feel
      const isWin = Math.random() < 0.55
      
      setTickets(prev => {
        return prev.map(t => {
          if (t.id === ticketId) {
            return { ...t, status: isWin ? 'Won' : 'Lost' }
          }
          return t
        })
      })

      if (isWin) {
        // Payout to user wallet
        await fetch('/api/wallet/payout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, bet_amount: stake, multiplier: newTicket.odds })
        })
        fetchWallet()
      }
    }, 10000)
  }

  const potentialPayout = selectedBet ? (stake * selectedBet.odds).toFixed(2) : '0.00'

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px',
      background: 'linear-gradient(180deg, #091216 0%, #030608 100%)',
      width: '100%',
      minHeight: '100%',
      overflowY: 'auto'
    }}>
      <h2 style={{
        fontSize: '22px',
        fontWeight: '900',
        fontStyle: 'italic',
        background: 'linear-gradient(to right, #00d2ff, #f5c242)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '14px'
      }}>
        BETPK SPORTSBOOK
      </h2>

      {/* Main sports display split view */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        maxWidth: '420px'
      }}>
        {/* Live Matches List */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
        }}>
          <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
            🟢 Live Matches Feeds
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {matches.map(m => {
              const isSelected = selectedMatch && selectedMatch.id === m.id
              return (
                <div 
                  key={m.id} 
                  onClick={() => setSelectedMatch(m)}
                  style={{
                    background: isSelected ? 'rgba(245, 194, 66, 0.05)' : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: '10px',
                    padding: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--muted)', fontWeight: 'bold', marginBottom: '4px' }}>
                    <span>{m.league}</span>
                    <span style={{ color: 'var(--success)' }}>{m.time}'</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>
                      {m.home} vs {m.away}
                    </div>
                    <div style={{ background: '#000', padding: '2px 8px', borderRadius: '4px', color: 'var(--accent)', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '12px' }}>
                      {m.score}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Match Odds grid */}
        {selectedMatch && (
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Match Winner Odds
              </span>
              <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 'bold' }}>
                ⚽ {selectedMatch.home} vs {selectedMatch.away}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {/* Home odd */}
              <button 
                onClick={() => selectBetOption(selectedMatch, 'home', selectedMatch.odds.home)}
                className={`odds-btn ${oddsFlash[`${selectedMatch.id}-home`] === 'up' ? 'odds-up' : oddsFlash[`${selectedMatch.id}-home`] === 'down' ? 'odds-down' : ''}`}
                style={{
                  flex: 1,
                  background: '#0a0d14',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer',
                  color: '#fff'
                }}
              >
                <div style={{ fontSize: '9px', color: 'var(--muted)', marginBottom: '2px' }}>1 ({selectedMatch.home})</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent)' }}>{selectedMatch.odds.home}</div>
              </button>

              {/* Draw odd */}
              {selectedMatch.odds.draw !== null && (
                <button 
                  onClick={() => selectBetOption(selectedMatch, 'draw', selectedMatch.odds.draw)}
                  className={`odds-btn ${oddsFlash[`${selectedMatch.id}-draw`] === 'up' ? 'odds-up' : oddsFlash[`${selectedMatch.id}-draw`] === 'down' ? 'odds-down' : ''}`}
                  style={{
                    flex: 1,
                    background: '#0a0d14',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    color: '#fff'
                  }}
                >
                  <div style={{ fontSize: '9px', color: 'var(--muted)', marginBottom: '2px' }}>X (Draw)</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent)' }}>{selectedMatch.odds.draw}</div>
                </button>
              )}

              {/* Away odd */}
              <button 
                onClick={() => selectBetOption(selectedMatch, 'away', selectedMatch.odds.away)}
                className={`odds-btn ${oddsFlash[`${selectedMatch.id}-away`] === 'up' ? 'odds-up' : oddsFlash[`${selectedMatch.id}-away`] === 'down' ? 'odds-down' : ''}`}
                style={{
                  flex: 1,
                  background: '#0a0d14',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer',
                  color: '#fff'
                }}
              >
                <div style={{ fontSize: '9px', color: 'var(--muted)', marginBottom: '2px' }}>2 ({selectedMatch.away})</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent)' }}>{selectedMatch.odds.away}</div>
              </button>
            </div>
          </div>
        )}

        {/* Message feedback */}
        {message && (
          <div style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            background: message.type === 'error' ? 'rgba(255, 23, 68, 0.15)' : 'rgba(0, 230, 118, 0.15)',
            color: message.type === 'error' ? '#ff6666' : '#00ff88',
            border: `1px solid ${message.type === 'error' ? '#ff174433' : '#00e67633'}`,
            textAlign: 'center'
          }}>
            {message.text}
          </div>
        )}

        {/* Bet Slip Drawer panel */}
        {selectedBet && (
          <div style={{
            background: 'linear-gradient(135deg, #1c1d24 0%, #0a0b0e 100%)',
            border: '2px solid var(--accent)',
            borderRadius: '16px',
            padding: '14px',
            boxShadow: '0 8px 24px rgba(245,194,66,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>🎫 Active Slip Bet</span>
              <button 
                onClick={() => setSelectedBet(null)}
                style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{selectedBet.matchName}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', marginTop: '2px' }}>
                <span style={{ color: 'var(--accent)' }}>{selectedBet.label}</span>
                <span style={{ color: '#fff' }}>Odds: {selectedBet.odds}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '9px', color: 'var(--muted)', display: 'block', marginBottom: '2px' }}>STAKE (₱)</span>
                <input 
                  type="number" 
                  value={stake} 
                  onChange={e => setStake(Math.max(10, Number(e.target.value)))} 
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: '#000',
                    color: '#fff',
                    fontSize: '13px',
                    width: '100%'
                  }}
                />
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <span style={{ fontSize: '9px', color: 'var(--muted)', display: 'block', marginBottom: '2px' }}>POTENTIAL PAYOUT</span>
                <span style={{ fontSize: '16px', fontWeight: '900', color: 'var(--success)', fontFamily: 'monospace' }}>
                  ₱{potentialPayout}
                </span>
              </div>
            </div>

            <button 
              className="btn primary" 
              onClick={placeSportsBet}
              disabled={processing}
              style={{ width: '100%', padding: '12px', fontWeight: 'bold' }}
            >
              {processing ? 'SUBMITTING...' : `PLACE SLIP BET — ₱${stake}`}
            </button>
          </div>
        )}

        {/* Bets tickets history */}
        {tickets.length > 0 && (
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '12px'
          }}>
            <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
              Open / Settled Tickets
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '110px', overflowY: 'auto' }}>
              {tickets.map(t => (
                <div 
                  key={t.id} 
                  style={{
                    background: '#0a0d14',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '8px',
                    fontSize: '11px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ color: '#fff', fontWeight: 'bold' }}>{t.pick} ({t.odds}x)</div>
                    <div style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '2px' }}>{t.match}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: t.status === 'Won' ? 'var(--success)' : t.status === 'Lost' ? 'var(--danger)' : 'var(--accent)' }}>
                      {t.status === 'Won' ? `+₱${t.payout}` : t.status === 'Lost' ? `₱${t.stake} Lost` : `₱${t.stake}`}
                    </div>
                    <div style={{ fontSize: '9px', color: t.status === 'Won' ? 'var(--success)' : t.status === 'Lost' ? 'var(--danger)' : '#aaa', fontWeight: 'bold', marginTop: '2px' }}>
                      {t.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

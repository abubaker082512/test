import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'
import { americanToDecimal } from '../utils/betstackClient'

export default function Sportsbook() {
  const { user } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [activeSport, setActiveSport] = useState('all')
  const [lines, setLines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Bet Slip state
  const [selectedBet, setSelectedBet] = useState(null)
  const [stake, setStake] = useState('100')
  const [placingBet, setPlacingBet] = useState(false)
  const [betSuccessMsg, setBetSuccessMsg] = useState(null)
  const [betErrorMsg, setBetErrorMsg] = useState(null)
  
  // Tab state: 'markets' or 'mybets'
  const [activeTab, setActiveTab] = useState('markets')
  const [myBets, setMyBets] = useState([])

  const sportsList = [
    { key: 'all', name: 'All Sports', icon: '🔥' },
    { key: 'soccer', name: 'Soccer', icon: '⚽', filterKey: 'soccer' },
    { key: 'cricket', name: 'Cricket', icon: '🏏', filterKey: 'cricket' },
    { key: 'basketball', name: 'Basketball', icon: '🏀', filterKey: 'basketball' },
    { key: 'americanfootball', name: 'Football (NFL)', icon: '🏈', filterKey: 'americanfootball' },
    { key: 'baseball', name: 'Baseball (MLB)', icon: '⚾', filterKey: 'baseball' },
    { key: 'tennis', name: 'Tennis', icon: '🎾', filterKey: 'tennis' },
    { key: 'mma', name: 'MMA & Boxing', icon: '🥊', filterKey: 'mma' },
    { key: 'icehockey', name: 'Ice Hockey (NHL)', icon: '🏒', filterKey: 'icehockey' }
  ]

  const fetchSportsLines = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/sports/lines?north_american=true')
      const data = await res.json()
      if (data.success && Array.isArray(data.lines)) {
        setLines(data.lines)
      } else {
        throw new Error(data.error || 'Failed to load sports lines')
      }
    } catch (err) {
      console.error('Failed to load sports lines:', err)
      setError('Unable to load live odds. Please try refreshing.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSportsLines()
    const interval = setInterval(fetchSportsLines, 60000)
    return () => clearInterval(interval)
  }, [])

  // Filter lines by selected sport
  const filteredLines = lines.filter(item => {
    if (activeSport === 'all') return true
    const leagueKey = item.event?.league?.key?.toLowerCase() || ''
    const sportName = item.event?.league?.name?.toLowerCase() || ''
    const target = sportsList.find(s => s.key === activeSport)?.filterKey || ''
    return leagueKey.includes(target) || sportName.includes(target)
  })

  // Select a bet odd
  const handleSelectOdd = (item, marketType, selection, oddsValue) => {
    if (!oddsValue) return
    const decimalOdd = americanToDecimal(oddsValue)
    setSelectedBet({
      eventId: item.event_id || item.event?.id,
      matchTitle: `${item.event?.home_team} vs ${item.event?.away_team}`,
      league: item.event?.league?.name || 'Pro League',
      marketType,
      selection,
      americanOdd: oddsValue,
      decimalOdd,
      item
    })
    setBetSuccessMsg(null)
    setBetErrorMsg(null)
  }

  // Quick Stake handler
  const handleAddStake = (val) => {
    const current = parseFloat(stake) || 0
    setStake((current + val).toString())
  }

  // Place bet action
  const handlePlaceBet = async () => {
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }
    if (!selectedBet) return
    const stakeNum = parseFloat(stake)
    if (isNaN(stakeNum) || stakeNum <= 0) {
      setBetErrorMsg('Please enter a valid stake amount in Pi.')
      return
    }

    setPlacingBet(true)
    setBetErrorMsg(null)
    setBetSuccessMsg(null)

    try {
      const potentialPayout = (stakeNum * selectedBet.decimalOdd).toFixed(2)
      const res = await fetch('/api/sports/place-bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          event_id: selectedBet.eventId,
          match_title: selectedBet.matchTitle,
          selection: `${selectedBet.selection} (${selectedBet.marketType})`,
          odds: `${selectedBet.americanOdd} (${selectedBet.decimalOdd}x)`,
          stake: stakeNum,
          potential_payout: potentialPayout,
          market_type: selectedBet.marketType
        })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setBetSuccessMsg(`🎉 Bet Placed! Stake: Pi ${stakeNum.toFixed(2)} | Potential Win: Pi ${potentialPayout}`)
        if (data.bet) {
          setMyBets(prev => [data.bet, ...prev])
        }
        window.dispatchEvent(new Event('wallet-updated'))
      } else {
        setBetErrorMsg(data.error || 'Failed to place bet')
      }
    } catch (err) {
      setBetErrorMsg('Network error. Failed to place bet.')
    } finally {
      setPlacingBet(false)
    }
  }

  return (
    <div className="app">
      <Head>
        <title>Sportsbook - Live Betting Odds | BetStack</title>
      </Head>

      <NavBar />

      <main style={{ paddingBottom: '90px' }}>
        {/* Sports Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1f0b3b 0%, #0d021a 100%)',
          padding: '20px 16px',
          borderBottom: '1px solid var(--border)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '24px' }}>⚡</span>
                <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#fff', margin: 0 }}>
                  Sportsbook <span style={{ color: 'var(--accent)' }}>Live Odds</span>
                </h1>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                Powered by BetStack consensus odds engine. NFL, MLB, NBA, Soccer, Cricket & more.
              </p>
            </div>
            <button
              onClick={fetchSportsLines}
              style={{
                background: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid var(--accent)',
                color: 'var(--accent)',
                borderRadius: '20px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Markets vs My Bets) */}
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => setActiveTab('markets')}
            style={{
              flex: 1,
              padding: '12px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'markets' ? '3px solid var(--accent)' : '3px solid transparent',
              color: activeTab === 'markets' ? 'var(--accent)' : 'var(--muted)',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            🏟️ Live & Upcoming Matches ({filteredLines.length})
          </button>
          <button
            onClick={() => setActiveTab('mybets')}
            style={{
              flex: 1,
              padding: '12px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'mybets' ? '3px solid var(--accent)' : '3px solid transparent',
              color: activeTab === 'mybets' ? 'var(--accent)' : 'var(--muted)',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            📋 My Wagers ({myBets.length})
          </button>
        </div>

        {activeTab === 'markets' && (
          <>
            {/* Sports Category Chips */}
            <div className="category-bar" style={{ position: 'sticky', top: '60px', zIndex: 30, background: 'var(--bg-tertiary)', paddingBottom: '10px' }}>
              {sportsList.map(sport => (
                <button
                  key={sport.key}
                  className={`category-chip ${activeSport === sport.key ? 'active' : ''}`}
                  onClick={() => setActiveSport(sport.key)}
                >
                  <span>{sport.icon}</span>
                  <span>{sport.name}</span>
                </button>
              ))}
            </div>

            {/* Match List */}
            <div style={{ padding: '16px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
                  <div className="coin-spin" style={{ fontSize: '32px', marginBottom: '12px' }}>⚽</div>
                  <div>Loading real-time BetStack lines & match odds...</div>
                </div>
              ) : error ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '12px', color: '#ff8080' }}>
                  <div>{error}</div>
                  <button onClick={fetchSportsLines} className="btn primary" style={{ marginTop: '12px', padding: '6px 16px', fontSize: '12px' }}>
                    Try Again
                  </button>
                </div>
              ) : filteredLines.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏟️</div>
                  <div>No open betting lines right now for {sportsList.find(s => s.key === activeSport)?.name}.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {filteredLines.map(item => {
                    const event = item.event || {}
                    const moneyline = item.moneyline || {}
                    const spread = item.spread || {}
                    const total = item.total || {}

                    const homeML = moneyline.home
                    const awayML = moneyline.away
                    const drawML = moneyline.draw

                    return (
                      <div
                        key={item.id || item.event_id}
                        style={{
                          background: 'linear-gradient(180deg, #230c45 0%, #150529 100%)',
                          border: '1px solid var(--border)',
                          borderRadius: '14px',
                          padding: '14px',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
                          position: 'relative'
                        }}
                      >
                        {/* League Header & Time */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '10px', background: 'var(--accent)', color: '#000', fontWeight: '900', padding: '2px 6px', borderRadius: '4px' }}>
                              {event.league?.name || 'SPORTS'}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 'bold' }}>
                              Consensus Odds
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#00e676', fontWeight: 'bold' }}>
                            {event.commence_time ? new Date(event.commence_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'LIVE'}
                          </div>
                        </div>

                        {/* Match Teams */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: '900', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>🏠</span> {event.home_team || 'Home Team'}
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '900', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                              <span>✈️</span> {event.away_team || 'Away Team'}
                            </div>
                          </div>
                        </div>

                        {/* Betting Markets Matrix */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                          {/* Home Moneyline */}
                          <button
                            onClick={() => handleSelectOdd(item, 'Moneyline', `${event.home_team} (Home Win)`, homeML)}
                            disabled={!homeML}
                            style={{
                              background: selectedBet?.eventId === (item.event_id || event.id) && selectedBet?.selection.includes(event.home_team) ? 'linear-gradient(135deg, var(--accent) 0%, #cc8800 100%)' : 'rgba(255,255,255,0.05)',
                              color: selectedBet?.eventId === (item.event_id || event.id) && selectedBet?.selection.includes(event.home_team) ? '#000' : '#fff',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px',
                              padding: '8px 6px',
                              cursor: homeML ? 'pointer' : 'default',
                              textAlign: 'center'
                            }}
                          >
                            <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '2px' }}>1 (Home)</div>
                            <div style={{ fontSize: '12px', fontWeight: '900' }}>
                              {homeML ? `${homeML} (${americanToDecimal(homeML)}x)` : '-'}
                            </div>
                          </button>

                          {/* Draw / Total */}
                          {drawML ? (
                            <button
                              onClick={() => handleSelectOdd(item, 'Moneyline', 'Draw (Tie)', drawML)}
                              style={{
                                background: selectedBet?.eventId === (item.event_id || event.id) && selectedBet?.selection.includes('Draw') ? 'linear-gradient(135deg, var(--accent) 0%, #cc8800 100%)' : 'rgba(255,255,255,0.05)',
                                color: selectedBet?.eventId === (item.event_id || event.id) && selectedBet?.selection.includes('Draw') ? '#000' : '#fff',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                padding: '8px 6px',
                                cursor: 'pointer',
                                textAlign: 'center'
                              }}
                            >
                              <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '2px' }}>X (Draw)</div>
                              <div style={{ fontSize: '12px', fontWeight: '900' }}>
                                {`${drawML} (${americanToDecimal(drawML)}x)`}
                              </div>
                            </button>
                          ) : total.number ? (
                            <button
                              onClick={() => handleSelectOdd(item, 'Total Over', `Over ${total.number} Pts`, total.over)}
                              style={{
                                background: selectedBet?.eventId === (item.event_id || event.id) && selectedBet?.selection.includes('Over') ? 'linear-gradient(135deg, var(--accent) 0%, #cc8800 100%)' : 'rgba(255,255,255,0.05)',
                                color: selectedBet?.eventId === (item.event_id || event.id) && selectedBet?.selection.includes('Over') ? '#000' : '#fff',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                padding: '8px 6px',
                                cursor: 'pointer',
                                textAlign: 'center'
                              }}
                            >
                              <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '2px' }}>Over {total.number}</div>
                              <div style={{ fontSize: '12px', fontWeight: '900' }}>
                                {total.over ? `${total.over} (${americanToDecimal(total.over)}x)` : '-'}
                              </div>
                            </button>
                          ) : (
                            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '8px 6px', textAlign: 'center' }}>
                              <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Spread</div>
                              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{spread.home?.point || '-'}</div>
                            </div>
                          )}

                          {/* Away Moneyline */}
                          <button
                            onClick={() => handleSelectOdd(item, 'Moneyline', `${event.away_team} (Away Win)`, awayML)}
                            disabled={!awayML}
                            style={{
                              background: selectedBet?.eventId === (item.event_id || event.id) && selectedBet?.selection.includes(event.away_team) ? 'linear-gradient(135deg, var(--accent) 0%, #cc8800 100%)' : 'rgba(255,255,255,0.05)',
                              color: selectedBet?.eventId === (item.event_id || event.id) && selectedBet?.selection.includes(event.away_team) ? '#000' : '#fff',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px',
                              padding: '8px 6px',
                              cursor: awayML ? 'pointer' : 'default',
                              textAlign: 'center'
                            }}
                          >
                            <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '2px' }}>2 (Away)</div>
                            <div style={{ fontSize: '12px', fontWeight: '900' }}>
                              {awayML ? `${awayML} (${americanToDecimal(awayML)}x)` : '-'}
                            </div>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* My Bets Tab */}
        {activeTab === 'mybets' && (
          <div style={{ padding: '16px' }}>
            {myBets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📑</div>
                <div>No active sports bets placed in this session yet.</div>
                <button onClick={() => setActiveTab('markets')} className="btn primary" style={{ marginTop: '16px', padding: '8px 16px' }}>
                  Explore Live Matches →
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myBets.map((bet, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '14px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Ticket: {bet.id}</span>
                      <span style={{ fontSize: '11px', color: '#00e676', fontWeight: 'bold' }}>ACTIVE</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{bet.match_title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--accent)', marginTop: '2px', fontWeight: 'bold' }}>{bet.selection}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', fontSize: '12px' }}>
                      <span>Stake: <strong style={{ color: '#fff' }}>Pi {bet.stake}</strong></span>
                      <span>Potential Win: <strong style={{ color: '#00e676' }}>Pi {bet.potential_payout}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Floating Interactive Bet Slip Drawer */}
        {selectedBet && (
          <div style={{
            position: 'fixed',
            bottom: '56px',
            left: 0,
            right: 0,
            background: 'linear-gradient(180deg, #1b0733 0%, #0c0217 100%)',
            borderTop: '2px solid var(--accent)',
            boxShadow: '0 -8px 30px rgba(0,0,0,0.8)',
            padding: '14px 16px',
            zIndex: 90
          }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '16px' }}>🎟️</span>
                  <strong style={{ fontSize: '13px', color: '#fff' }}>Bet Slip Selection</strong>
                </div>
                <button
                  onClick={() => setSelectedBet(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '16px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {/* Selection details */}
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '8px 12px', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>{selectedBet.selection}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{selectedBet.matchTitle} ({selectedBet.league})</div>
                <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 'bold', marginTop: '2px' }}>
                  Odds: {selectedBet.americanOdd} ({selectedBet.decimalOdd}x)
                </div>
              </div>

              {/* Quick Stake buttons */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                {[50, 100, 500, 1000, 5000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setStake(amt.toString())}
                    style={{
                      flex: 1,
                      padding: '4px 0',
                      background: stake === amt.toString() ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                      color: stake === amt.toString() ? '#000' : '#fff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    +{amt}
                  </button>
                ))}
              </div>

              {/* Stake input & Place button */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)', fontWeight: 'bold', fontSize: '12px' }}>Pi</span>
                  <input
                    type="number"
                    value={stake}
                    onChange={(e) => setStake(e.target.value)}
                    placeholder="Stake"
                    style={{
                      width: '100%',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '8px 10px 8px 30px',
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  onClick={handlePlaceBet}
                  disabled={placingBet}
                  className="btn primary"
                  style={{
                    flex: 1.5,
                    padding: '8px 12px',
                    fontSize: '13px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ fontWeight: '900' }}>{placingBet ? 'Placing...' : 'Place Bet'}</span>
                  <span style={{ fontSize: '10px', opacity: 0.9 }}>
                    Win Pi {((parseFloat(stake) || 0) * selectedBet.decimalOdd).toFixed(2)}
                  </span>
                </button>
              </div>

              {/* Alert messages */}
              {betSuccessMsg && (
                <div style={{ marginTop: '8px', color: '#00e676', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>
                  {betSuccessMsg}
                </div>
              )}
              {betErrorMsg && (
                <div style={{ marginTop: '8px', color: '#ff5252', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>
                  {betErrorMsg}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
      {isAuthModalOpen && <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />}
    </div>
  )
}

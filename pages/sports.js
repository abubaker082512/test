import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'
import { americanToDecimal } from '../utils/betstackClient'

export default function Sportsbook() {
  const { user, isDemoMode, demoBalance, toggleDemoMode, spendDemoBalance, addDemoBalance } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [activeSport, setActiveSport] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [lines, setLines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wallet, setWallet] = useState(null)
  
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
    { key: 'all', name: 'All Sports', icon: '🔥', filterKey: '' },
    { key: 'cricket', name: 'Cricket (PSL / IPL)', icon: '🏏', filterKey: 'cricket' },
    { key: 'soccer', name: 'Soccer (EPL / UCL)', icon: '⚽', filterKey: 'soccer' },
    { key: 'basketball', name: 'Basketball (NBA)', icon: '🏀', filterKey: 'basketball' },
    { key: 'tennis', name: 'Tennis (ATP)', icon: '🎾', filterKey: 'tennis' },
    { key: 'mma', name: 'MMA & Boxing', icon: '🥊', filterKey: 'mma' },
    { key: 'baseball', name: 'Baseball (MLB)', icon: '⚾', filterKey: 'baseball' },
    { key: 'americanfootball', name: 'Football (NFL)', icon: '🏈', filterKey: 'americanfootball' },
    { key: 'icehockey', name: 'Ice Hockey (NHL)', icon: '🏒', filterKey: 'icehockey' }
  ]

  // Load saved bets from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('akw_sports_my_bets')
      if (saved) {
        setMyBets(JSON.parse(saved))
      }
    } catch (e) {}
  }, [])

  // Save bets to localStorage
  const saveMyBets = (bets) => {
    setMyBets(bets)
    try {
      localStorage.setItem('akw_sports_my_bets', JSON.stringify(bets))
    } catch (e) {}
  }

  // Fetch real wallet
  const fetchWallet = async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/wallet/get-balance?user_id=${encodeURIComponent(user.id || user.uid || '')}&email=${encodeURIComponent(user.email || '')}`)
      const json = await res.json()
      if (json.success && json.wallet) {
        setWallet(json.wallet)
      }
    } catch (e) {}
  }

  useEffect(() => {
    if (user) fetchWallet()
  }, [user])

  const activeBalance = isDemoMode ? demoBalance : (wallet ? parseFloat(wallet.balance) : 100.0)

  // Fetch live sports lines from API
  const fetchSportsLines = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/sports/lines')
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
    const interval = setInterval(fetchSportsLines, 30000)
    return () => clearInterval(interval)
  }, [])

  // Filter lines by selected sport and search term
  const filteredLines = lines.filter(item => {
    const leagueKey = item.event?.league?.key?.toLowerCase() || ''
    const sportName = item.event?.league?.name?.toLowerCase() || ''
    const homeTeam = item.event?.home_team?.toLowerCase() || ''
    const awayTeam = item.event?.away_team?.toLowerCase() || ''
    
    // Sport category match
    if (activeSport !== 'all') {
      const target = sportsList.find(s => s.key === activeSport)?.filterKey || ''
      const matchesSport = leagueKey.includes(target) || sportName.includes(target) || 
        (target === 'cricket' && (sportName.includes('psl') || sportName.includes('ipl'))) ||
        (target === 'soccer' && (sportName.includes('premier') || sportName.includes('champions') || sportName.includes('liga')))
      if (!matchesSport) return false
    }

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      return homeTeam.includes(q) || awayTeam.includes(q) || sportName.includes(q)
    }

    return true
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
  const handleSetStake = (val) => {
    if (val === 'MAX') {
      setStake(Math.floor(activeBalance).toString())
      return
    }
    const current = parseFloat(stake) || 0
    setStake((current + val).toString())
  }

  // Place bet action
  const handlePlaceBet = async () => {
    if (!selectedBet) return
    const stakeNum = parseFloat(stake)
    if (isNaN(stakeNum) || stakeNum <= 0) {
      setBetErrorMsg('Please enter a valid stake amount in Pi.')
      return
    }

    if (stakeNum > activeBalance) {
      setBetErrorMsg(`Insufficient balance! You have Pi ${activeBalance.toFixed(2)}, stake is Pi ${stakeNum.toFixed(2)}.`)
      return
    }

    setPlacingBet(true)
    setBetErrorMsg(null)
    setBetSuccessMsg(null)

    const potentialPayout = (stakeNum * selectedBet.decimalOdd).toFixed(2)

    try {
      if (isDemoMode) {
        // Handle Demo Mode Bet
        const success = spendDemoBalance(stakeNum)
        if (!success) {
          setBetErrorMsg('Insufficient demo balance!')
          setPlacingBet(false)
          return
        }

        const demoBet = {
          id: 'SP-DEMO-' + Date.now().toString(36).toUpperCase(),
          match_title: selectedBet.matchTitle,
          selection: `${selectedBet.selection} (${selectedBet.marketType})`,
          odds: `${selectedBet.americanOdd} (${selectedBet.decimalOdd}x)`,
          stake: stakeNum,
          potential_payout: potentialPayout,
          placed_at: new Date().toISOString(),
          is_demo: true,
          status: 'ACTIVE'
        }

        const updated = [demoBet, ...myBets]
        saveMyBets(updated)
        setBetSuccessMsg(`🎉 Demo Bet Placed! Stake: Pi ${stakeNum.toFixed(2)} | Potential Win: Pi ${potentialPayout}`)
        setSelectedBet(null)
      } else {
        // Handle Real Wallet Bet
        if (!user) {
          setIsAuthModalOpen(true)
          setPlacingBet(false)
          return
        }

        const res = await fetch('/api/sports/place-bet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id || user.uid || user.email,
            email: user.email || '',
            event_id: selectedBet.eventId,
            match_title: selectedBet.matchTitle,
            selection: `${selectedBet.selection} (${selectedBet.marketType})`,
            odds: `${selectedBet.americanOdd} (${selectedBet.decimalOdd}x)`,
            stake: stakeNum,
            potential_payout: potentialPayout,
            market_type: selectedBet.marketType,
            is_demo: false
          })
        })

        const data = await res.json()
        if (res.ok && data.success) {
          setBetSuccessMsg(`🎉 Real Bet Placed! Stake: Pi ${stakeNum.toFixed(2)} | Potential Win: Pi ${potentialPayout}`)
          if (data.bet) {
            const updated = [data.bet, ...myBets]
            saveMyBets(updated)
          }
          fetchWallet()
          window.dispatchEvent(new Event('wallet-updated'))
          setSelectedBet(null)
        } else {
          setBetErrorMsg(data.error || 'Failed to place bet')
        }
      }
    } catch (err) {
      setBetErrorMsg('Network error. Failed to place bet.')
    } finally {
      setPlacingBet(false)
    }
  }

  // Cash out an active bet
  const handleCashout = (betId) => {
    const targetBet = myBets.find(b => b.id === betId)
    if (!targetBet || targetBet.status !== 'ACTIVE') return

    const cashoutValue = parseFloat(((targetBet.stake * 0.9) + (parseFloat(targetBet.potential_payout) * 0.4)).toFixed(2))

    if (targetBet.is_demo) {
      addDemoBalance(cashoutValue)
    } else if (user) {
      fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id || user.uid || user.email,
          email: user.email || '',
          amount: cashoutValue,
          type: 'sports_cashout',
          notes: `Cashout on ${targetBet.match_title}`
        })
      }).then(() => fetchWallet()).catch(() => {})
    }

    const updated = myBets.map(b => {
      if (b.id === betId) {
        return { ...b, status: 'CASHED_OUT', cashout_amount: cashoutValue }
      }
      return b
    })
    saveMyBets(updated)
  }

  return (
    <div className="app">
      <Head>
        <title>Sportsbook - Live Betting Odds | WinxPro</title>
      </Head>

      <NavBar />

      <main style={{ paddingBottom: '100px' }}>
        {/* Sports Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1f0b3b 0%, #0d021a 100%)',
          padding: '16px',
          borderBottom: '1px solid var(--border)',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '24px' }}>⚡</span>
                <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#fff', margin: 0 }}>
                  Sportsbook <span style={{ color: 'var(--accent)' }}>Live Odds</span>
                </h1>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                Live Consensus Multi-Sport Feed (Cricket, PSL, Soccer, Champions League, NBA, Tennis & NFL)
              </p>
            </div>

            {/* Demo / Real Balance Toggle & Refresh */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div 
                onClick={() => toggleDemoMode(!isDemoMode)}
                style={{ 
                  background: isDemoMode ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 215, 0, 0.15)', 
                  border: `1px solid ${isDemoMode ? '#00e676' : 'var(--accent)'}`, 
                  padding: '5px 10px', 
                  borderRadius: '14px', 
                  fontSize: '12px', 
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Click to toggle Demo/Real Mode"
              >
                <span>{isDemoMode ? '🎮 DEMO' : '💰 REAL'}</span>
                <span style={{ color: isDemoMode ? '#00e676' : 'var(--accent)' }}>
                  Pi {activeBalance.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <button
                onClick={fetchSportsLines}
                style={{
                  background: 'rgba(255, 215, 0, 0.1)',
                  border: '1px solid var(--accent)',
                  color: 'var(--accent)',
                  borderRadius: '14px',
                  padding: '5px 10px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Markets vs My Bets) */}
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => setActiveTab('markets')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'markets' ? 'rgba(255, 215, 0, 0.1)' : 'none',
              border: 'none',
              borderBottom: activeTab === 'markets' ? '2px solid var(--accent)' : 'none',
              color: activeTab === 'markets' ? 'var(--accent)' : 'var(--muted)',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            🏟️ Live Match Fixtures ({filteredLines.length})
          </button>
          <button
            onClick={() => setActiveTab('mybets')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'mybets' ? 'rgba(255, 215, 0, 0.1)' : 'none',
              border: 'none',
              borderBottom: activeTab === 'mybets' ? '2px solid var(--accent)' : 'none',
              color: activeTab === 'mybets' ? 'var(--accent)' : 'var(--muted)',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            📑 My Bets ({myBets.length})
          </button>
        </div>

        {activeTab === 'markets' && (
          <>
            {/* Search Bar */}
            <div style={{ padding: '12px 16px 0 16px' }}>
              <input
                type="text"
                placeholder="Search team, player, or tournament (e.g. Lahore, Real Madrid, Pakistan)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: '#131926',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Sports Horizontal Filter Chips */}
            <div style={{
              display: 'flex',
              overflowX: 'auto',
              gap: '8px',
              padding: '12px 16px',
              scrollbarWidth: 'none'
            }}>
              {sportsList.map(sport => {
                const isActive = activeSport === sport.key
                return (
                  <button
                    key={sport.key}
                    onClick={() => setActiveSport(sport.key)}
                    style={{
                      background: isActive ? 'var(--accent)' : 'var(--bg-secondary)',
                      color: isActive ? '#000' : '#fff',
                      border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: '20px',
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 0 10px rgba(255, 215, 0, 0.3)' : 'none'
                    }}
                  >
                    <span>{sport.icon}</span>
                    <span>{sport.name}</span>
                  </button>
                )
              })}
            </div>

            {/* Live Lines Grid / List */}
            <div style={{ padding: '0 16px 16px 16px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--muted)' }}>
                  <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,215,0,0.2)', borderTop: '3px solid var(--accent)', borderRadius: '50%', margin: '0 auto 12px auto', animation: 'spin 1s linear infinite' }} />
                  <div>Fetching Live Multi-Sport Consensus Lines & Odds...</div>
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
                  <div>No open betting lines found for your search.</div>
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

                    const isLive = event.status === 'LIVE' || !event.commence_time || new Date(event.commence_time) <= new Date()

                    return (
                      <div
                        key={item.id || item.event_id}
                        style={{
                          background: 'linear-gradient(180deg, #200d3b 0%, #110424 100%)',
                          border: '1px solid var(--border)',
                          borderRadius: '14px',
                          padding: '14px',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
                          position: 'relative'
                        }}
                      >
                        {/* League Header & Status */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '10px', background: 'var(--accent)', color: '#000', fontWeight: '900', padding: '2px 6px', borderRadius: '4px' }}>
                              {event.league?.name || 'PRO SPORTS'}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 'bold' }}>
                              {item.bookmaker?.name || 'BetStack Consensus'}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isLive ? (
                              <span style={{ fontSize: '10px', background: '#e53935', color: '#fff', fontWeight: '900', padding: '2px 6px', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}>
                                🔴 LIVE
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#00e676', fontWeight: 'bold' }}>
                                ⏰ {event.commence_time ? new Date(event.commence_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'UPCOMING'}
                              </span>
                            )}
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
                          {/* Home Win */}
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

                          {/* Draw / Over */}
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
                              onClick={() => handleSelectOdd(item, 'Total Over', `Over ${total.number} Runs/Pts`, total.over)}
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

                          {/* Away Win */}
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
                <div>No sports bets placed in your history yet.</div>
                <button onClick={() => setActiveTab('markets')} className="btn primary" style={{ marginTop: '16px', padding: '8px 16px' }}>
                  Explore Live Matches →
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myBets.map((bet, idx) => (
                  <div
                    key={bet.id || idx}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '14px',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Ticket: {bet.id}</span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '900',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: bet.status === 'CASHED_OUT' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(0, 230, 118, 0.2)',
                        color: bet.status === 'CASHED_OUT' ? '#ff9800' : '#00e676'
                      }}>
                        {bet.status === 'CASHED_OUT' ? `CASHED OUT (Pi ${bet.cashout_amount})` : '🟢 LIVE ACTIVE'}
                      </span>
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{bet.match_title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--accent)', marginTop: '2px', fontWeight: 'bold' }}>{bet.selection}</div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', fontSize: '12px' }}>
                      <div>
                        <span>Stake: <strong style={{ color: '#fff' }}>Pi {bet.stake}</strong></span>
                        <span style={{ marginLeft: '12px' }}>Potential Win: <strong style={{ color: '#00e676' }}>Pi {bet.potential_payout}</strong></span>
                      </div>

                      {bet.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleCashout(bet.id)}
                          style={{
                            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                            color: '#000',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '900',
                            cursor: 'pointer'
                          }}
                        >
                          ⚡ Cash Out (Pi {parseFloat(((bet.stake * 0.9) + (parseFloat(bet.potential_payout) * 0.4)).toFixed(2))})
                        </button>
                      )}
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
                  <span style={{ fontSize: '10px', background: isDemoMode ? '#00e676' : 'var(--accent)', color: '#000', padding: '1px 5px', borderRadius: '4px', fontWeight: '900' }}>
                    {isDemoMode ? 'DEMO' : 'REAL'}
                  </span>
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
                    onClick={() => handleSetStake(amt)}
                    style={{
                      flex: 1,
                      padding: '5px 0',
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
                <button
                  onClick={() => handleSetStake('MAX')}
                  style={{
                    flex: 1,
                    padding: '5px 0',
                    background: 'rgba(255, 215, 0, 0.2)',
                    color: 'var(--accent)',
                    border: '1px solid var(--accent)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '900',
                    cursor: 'pointer'
                  }}
                >
                  MAX
                </button>
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
                  <span style={{ fontWeight: '900' }}>{placingBet ? 'Placing...' : `Place ${isDemoMode ? 'Demo' : 'Real'} Bet`}</span>
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

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'

export default function Offers() {
  const router = useRouter()
  const { user } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [loadingCheckin, setLoadingCheckin] = useState(false)
  const [loadingDepositBonus, setLoadingDepositBonus] = useState(false)
  
  const [checkedInToday, setCheckedInToday] = useState(false)
  const [claimedDepositBonus, setClaimedDepositBonus] = useState(false)
  const [depositBonusQualifies, setDepositBonusQualifies] = useState(false)
  const [statusLoading, setStatusLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // 9 First Recharge Bonus Tiers matching Screenshot 2
  const bonusTiers = [
    { depositReq: 200, bonus: 20 },
    { depositReq: 1000, bonus: 50 },
    { depositReq: 3000, bonus: 100 },
    { depositReq: 10000, bonus: 500 },
    { depositReq: 30000, bonus: 1000 },
    { depositReq: 50000, bonus: 2000 },
    { depositReq: 100000, bonus: 5000 },
    { depositReq: 50000, bonus: 20000 },
    { depositReq: 1000000, bonus: 50000 },
  ]

  const fetchStatus = async () => {
    if (!user) {
      setStatusLoading(false)
      return
    }
    
    try {
      const activeUid = user.id || user.uid || ''
      const activeEmail = user.email || ''
      const res = await fetch(`/api/wallet/get-balance?user_id=${encodeURIComponent(activeUid)}&email=${encodeURIComponent(activeEmail)}`)
      const json = await res.json()

      if (json.success && Array.isArray(json.transactions)) {
        const txs = json.transactions
        const todayStr = new Date().toISOString().split('T')[0]

        const hasCheckin = txs.some(t => t.notes && t.notes.includes('Daily Check-in Bonus') && t.created_at && t.created_at.startsWith(todayStr))
        setCheckedInToday(hasCheckin)

        const hasBonus = txs.some(t => t.notes && t.notes.includes('First Deposit Match Bonus'))
        setClaimedDepositBonus(hasBonus)

        const hasCompletedDeposit = txs.some(t => t.type === 'deposit' && t.status === 'completed')
        setDepositBonusQualifies(hasCompletedDeposit)
      }
    } catch (err) {
      console.error('Failed to fetch offer status', err)
    } finally {
      setStatusLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [user])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchStatus()
    setTimeout(() => setRefreshing(false), 800)
  }

  const handleCheckIn = async () => {
    if (!user) return setIsAuthModalOpen(true)
    setLoadingCheckin(true)
    setMessage(null)

    try {
      const res = await fetch('/api/wallet/claim-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id || user.uid, email: user.email })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: '🎉 Daily Check-in claimed! +Rs 5.00 added to your balance.' })
        setCheckedInToday(true)
        window.dispatchEvent(new Event('wallet-updated'))
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoadingCheckin(false)
    }
  }

  return (
    <div className="app">
      {/* Top Header matching Screenshot 2 */}
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(11, 14, 20, 0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <button 
          onClick={() => router.back()} 
          style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          ‹
        </button>
        <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', letterSpacing: '0.3px' }}>First recharge bonus</div>
        <button 
          onClick={() => router.push('/wallet')} 
          style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
        >
          History
        </button>
      </div>

      <div style={{ padding: '14px 16px 90px', maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Top Hero Banner matching Screenshot 2 */}
        <div style={{
          background: 'radial-gradient(circle at 10% 50%, rgba(0, 230, 91, 0.25) 0%, rgba(20, 26, 36, 0.95) 70%)',
          borderRadius: '20px',
          border: '1px solid rgba(0, 230, 91, 0.35)',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 8px 30px rgba(0, 230, 91, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Badge */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            background: 'linear-gradient(90deg, #00E65B 0%, #00B345 100%)',
            color: '#07090D',
            fontSize: '9.5px',
            fontWeight: 900,
            padding: '3px 12px 3px 10px',
            borderBottomRightRadius: '12px',
            boxShadow: '0 2px 6px rgba(0, 230, 91, 0.3)'
          }}>
            First deposit reward
          </div>

          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ fontSize: '42px', filter: 'drop-shadow(0 4px 12px rgba(0, 230, 91, 0.4))' }}>
              🎁
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#00E65B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>🎁</span> Maximum bonus <span>🎁</span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#FFB800', textShadow: '0 0 16px rgba(255, 184, 0, 0.4)', marginTop: '2px' }}>
                50,000
              </div>
            </div>
          </div>
        </div>

        {/* Rewards Section Header (Screenshot 2) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🎁</span> Rewards
            </div>
            <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px' }}>
              First deposit reward after registration
            </div>
          </div>

          <button 
            onClick={handleRefresh}
            style={{
              background: 'none',
              border: 'none',
              color: '#00E65B',
              fontSize: '11px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <span className={refreshing ? 'coin-spin' : ''}>🔄</span> Refresh
          </button>
        </div>

        {/* Reward Tiers List (Screenshot 2) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {bonusTiers.map((tier, idx) => (
            <div
              key={idx}
              className="glass-panel"
              style={{
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.15s'
              }}
            >
              {/* Left requirement */}
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#E2E8F0' }}>
                First Deposit ≥ <strong style={{ color: '#fff' }}>{tier.depositReq.toLocaleString()}</strong>
              </div>

              {/* Middle bonus badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '14px' }}>🪙</span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 900,
                  color: '#FFB800',
                  background: 'rgba(255, 184, 0, 0.12)',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 184, 0, 0.3)'
                }}>
                  {tier.bonus.toLocaleString()} Bonus
                </span>
              </div>

              {/* Right Deposit CTA Button */}
              <button 
                onClick={() => router.push('/wallet')}
                className="glass-btn-orange"
                style={{
                  padding: '6px 16px',
                  borderRadius: '10px',
                  fontSize: '11.5px',
                  cursor: 'pointer'
                }}
              >
                Deposit
              </button>
            </div>
          ))}
        </div>

        {/* Daily Check-in Glass Card */}
        <div className="glass-panel" style={{ borderRadius: '16px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📅</span> Daily Check-in Reward
            </div>
            <span style={{
              fontSize: '9.5px',
              fontWeight: 900,
              padding: '2px 8px',
              borderRadius: '6px',
              background: checkedInToday ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 230, 91, 0.15)',
              color: checkedInToday ? '#64748B' : '#00E65B',
              border: checkedInToday ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 230, 91, 0.4)'
            }}>
              {checkedInToday ? 'CLAIMED TODAY' : 'AVAILABLE NOW'}
            </span>
          </div>

          <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '12px' }}>
            Check-in daily to claim <strong>Rs 5.00 free</strong> into your gaming balance.
          </div>

          <button 
            onClick={handleCheckIn}
            disabled={loadingCheckin || checkedInToday}
            className={checkedInToday ? '' : 'glass-btn-emerald'}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '12px',
              border: 'none',
              background: checkedInToday ? 'rgba(255, 255, 255, 0.05)' : undefined,
              color: checkedInToday ? '#64748B' : undefined,
              fontSize: '13px',
              fontWeight: 900,
              cursor: checkedInToday ? 'not-allowed' : 'pointer'
            }}
          >
            {loadingCheckin ? 'Processing...' : checkedInToday ? 'Checked in today' : 'Claim Daily Rs 5.00'}
          </button>
        </div>

        {message && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 700,
            background: message.type === 'success' ? 'rgba(0, 230, 91, 0.15)' : 'rgba(255, 51, 102, 0.15)',
            border: `1px solid ${message.type === 'success' ? '#00E65B' : '#FF3366'}`,
            color: message.type === 'success' ? '#00E65B' : '#FF3366'
          }}>
            {message.text}
          </div>
        )}

      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <BottomNav />
    </div>
  )
}

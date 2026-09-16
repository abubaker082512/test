import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'

export default function Offers() {
  const { user } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [loadingCheckin, setLoadingCheckin] = useState(false)
  const [loadingDepositBonus, setLoadingDepositBonus] = useState(false)
  
  const [checkedInToday, setCheckedInToday] = useState(false)
  const [claimedDepositBonus, setClaimedDepositBonus] = useState(false)
  const [depositBonusQualifies, setDepositBonusQualifies] = useState(false)
  const [statusLoading, setStatusLoading] = useState(true)
  const [message, setMessage] = useState(null)

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
        setMessage({ type: 'success', text: '🎉 Daily Check-in claimed! +Pi 5.00 added to your wallet.' })
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

  const handleClaimDepositBonus = async () => {
    if (!user) return setIsAuthModalOpen(true)
    setLoadingDepositBonus(true)
    setMessage(null)

    try {
      const res = await fetch('/api/wallet/claim-deposit-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id || user.uid, email: user.email })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: `🎉 Match Bonus claimed! +Pi ${(data.bonus_amount || 0).toFixed(2)} added to your wallet.` })
        setClaimedDepositBonus(true)
        window.dispatchEvent(new Event('wallet-updated'))
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoadingDepositBonus(false)
    }
  }

  return (
    <div className="app">
      <NavBar />
      <div style={{ padding: '24px 16px 80px', maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ color: 'var(--accent)', marginTop: 0, fontSize: '28px' }}>🎁 Special Promotions & Rewards</h1>
        
        {message && (
          <div style={{ 
            padding: '14px', 
            borderRadius: '10px', 
            marginBottom: '20px', 
            fontSize: '14px', 
            background: message.type === 'success' ? '#00ff8822' : '#ff444422',
            color: message.type === 'success' ? '#00ff88' : '#ff6666',
            border: `1px solid ${message.type === 'success' ? '#00ff8844' : '#ff444444'}`
          }}>
            {message.text}
          </div>
        )}

        {/* Universal Referral Bonus Promotion Card */}
        <Link href="/invite" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #18092a 0%, #3b0764 50%, #09090b 100%)',
            padding: '22px',
            borderRadius: '16px',
            border: '1px solid rgba(0, 230, 118, 0.4)',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 8px 30px rgba(0, 230, 118, 0.15)',
            cursor: 'pointer'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '32px' }}>💸</div>
              <div style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 900, background: '#00e676', color: '#000' }}>
                HOT REWARD • RS 600
              </div>
            </div>
            <div>
              <h2 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#fff' }}>Referral & Agent Program</h2>
              <p style={{ margin: 0, color: '#d4d4d8', fontSize: '13px', lineHeight: '1.5' }}>
                Earn <strong style={{ color: '#00e676' }}>Pi 155.55 Cash</strong> instantly for every friend you invite + <strong style={{ color: '#ffd700' }}>5% lifetime betting commissions</strong>!
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
              <span style={{ fontSize: '12px', color: '#00e676', fontWeight: 800 }}>👉 Open Referral Center & Share Link</span>
              <span style={{ color: '#ffd700', fontSize: '16px' }}>➔</span>
            </div>
          </div>
        </Link>

        {/* Daily Check-in Card */}
        <div style={{ background: 'var(--card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '32px' }}>📅</div>
            <div style={{ 
              padding: '4px 10px', 
              borderRadius: '12px', 
              fontSize: '12px', 
              fontWeight: 'bold', 
              background: checkedInToday ? '#222' : '#00ff8822', 
              color: checkedInToday ? '#555' : '#00ff88' 
            }}>
              {checkedInToday ? 'CLAIMED TODAY' : 'AVAILABLE NOW'}
            </div>
          </div>
          <div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#fff' }}>Daily Loyalty Check-in</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px', lineHeight: '1.5' }}>
              Check-in once every day to receive <strong>Pi 5.00</strong> absolutely free. Keep playing to earn more rewards.
            </p>
          </div>
          <button 
            className="btn primary" 
            onClick={handleCheckIn} 
            disabled={loadingCheckin || checkedInToday || (user && statusLoading)}
            style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '10px', background: checkedInToday ? '#222' : 'var(--accent)', color: checkedInToday ? '#555' : '#000', borderColor: checkedInToday ? '#333' : 'var(--accent)', cursor: checkedInToday ? 'not-allowed' : 'pointer' }}
          >
            {loadingCheckin ? '⏳ Processing check-in...' : checkedInToday ? '✅ Checked In Today' : '📅 Check In Now & Claim Pi 5'}
          </button>
        </div>

        {/* First Deposit Match Card */}
        <div style={{ background: 'var(--card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '32px' }}>🔥</div>
            <div style={{ 
              padding: '4px 10px', 
              borderRadius: '12px', 
              fontSize: '12px', 
              fontWeight: 'bold', 
              background: claimedDepositBonus ? '#222' : depositBonusQualifies ? '#00ff8822' : '#ff444422', 
              color: claimedDepositBonus ? '#555' : depositBonusQualifies ? '#00ff88' : '#ff6666' 
            }}>
              {claimedDepositBonus ? 'CLAIMED' : depositBonusQualifies ? 'QUALIFIED' : 'PENDING DEPOSIT'}
            </div>
          </div>
          <div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#fff' }}>First Deposit 100% Match</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px', lineHeight: '1.5' }}>
              Get a **100% matched deposit bonus** on your first completed deposit up to **Pi 5,000.00**. 
              Double your funds to start playing with double the power!
            </p>
          </div>
          
          {user && !statusLoading && !depositBonusQualifies && !claimedDepositBonus && (
            <div style={{ background: '#ff444411', border: '1px solid #ff444422', borderRadius: '8px', padding: '10px', color: '#ff6666', fontSize: '13px' }}>
              ⚠️ You do not have a completed deposit yet. Go to your wallet to make a deposit first!
            </div>
          )}

          <button 
            className="btn primary" 
            onClick={handleClaimDepositBonus} 
            disabled={loadingDepositBonus || claimedDepositBonus || (user && statusLoading) || (user && !depositBonusQualifies)}
            style={{ 
              width: '100%', 
              padding: '14px', 
              fontSize: '15px', 
              marginTop: '10px', 
              background: claimedDepositBonus ? '#222' : (user && !depositBonusQualifies) ? '#1a1a1a' : 'var(--accent)', 
              color: claimedDepositBonus ? '#555' : (user && !depositBonusQualifies) ? '#555' : '#000', 
              borderColor: claimedDepositBonus ? '#333' : (user && !depositBonusQualifies) ? '#222' : 'var(--accent)', 
              cursor: (claimedDepositBonus || (user && !depositBonusQualifies)) ? 'not-allowed' : 'pointer' 
            }}
          >
            {loadingDepositBonus ? '⏳ Processing bonus...' : claimedDepositBonus ? '✅ Bonus Claimed' : '🔥 Claim 100% Matched Bonus'}
          </button>
        </div>

      </div>
      
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <BottomNav />
    </div>
  )
}

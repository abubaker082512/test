import React, { useState, useEffect } from 'react'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import AuthModal from '../components/AuthModal'

export default function Offers() {
  const { user } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [loadingCheckin, setLoadingCheckin] = useState(false)
  const [loadingDepositBonus, setLoadingDepositBonus] = useState(false)
  
  // Checking user claim status
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
      const todayStr = new Date().toISOString().split('T')[0]
      const checkinNote = `Daily Check-in Bonus - ${todayStr}`
      const bonusNote = 'First Deposit Match Bonus'

      // Check daily check-in
      const { data: checkins } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('notes', checkinNote)
        .limit(1)
      
      setCheckedInToday(checkins && checkins.length > 0)

      // Check matched deposit bonus
      const { data: claimed } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('notes', bonusNote)
        .limit(1)

      setClaimedDepositBonus(claimed && claimed.length > 0)

      // Check if user has a completed deposit
      const { data: deposits } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'deposit')
        .eq('status', 'completed')
        .limit(1)

      setDepositBonusQualifies(deposits && deposits.length > 0)
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
        body: JSON.stringify({ user_id: user.id })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: `🎉 Daily Check-in claimed! +₱5.00 added to your wallet.` })
        setCheckedInToday(true)
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
        body: JSON.stringify({ user_id: user.id })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: `🎉 Match Bonus claimed! +₱${data.bonus_amount.toFixed(2)} added to your wallet.` })
        setClaimedDepositBonus(true)
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
      <div style={{ padding: '24px 16px', maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ color: 'var(--accent)', marginTop: 0, fontSize: '28px' }}>🎁 Special Promotions</h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>
          Boost your balance with our exclusive rewards and daily incentives.
        </p>

        {message && (
          <div style={{ 
            padding: '12px 16px', 
            borderRadius: '10px', 
            marginBottom: '20px', 
            fontSize: '14px', 
            background: message.type === 'error' ? '#ff000022' : '#00ff8822', 
            color: message.type === 'error' ? '#ff6666' : '#00ff88',
            border: `1px solid ${message.type === 'error' ? '#ff000033' : '#00ff8833'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
          </div>
        )}

        {/* Check-In Card */}
        <div style={{ background: 'var(--card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '32px' }}>📅</div>
            <div style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', background: checkedInToday ? '#00ff8822' : '#ff990022', color: checkedInToday ? '#00ff88' : '#ff9900' }}>
              {checkedInToday ? 'CLAIMED TODAY' : 'AVAILABLE'}
            </div>
          </div>
          <div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#fff' }}>Daily Loyalty Check-in</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px', lineHeight: '1.5' }}>
              Check-in once every day to receive <strong>₱5.00</strong> absolutely free. Keep playing to earn more rewards.
            </p>
          </div>
          <button 
            className="btn primary" 
            onClick={handleCheckIn} 
            disabled={loadingCheckin || checkedInToday || (user && statusLoading)}
            style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '10px', background: checkedInToday ? '#222' : 'var(--accent)', color: checkedInToday ? '#555' : '#000', borderColor: checkedInToday ? '#333' : 'var(--accent)', cursor: checkedInToday ? 'not-allowed' : 'pointer' }}
          >
            {loadingCheckin ? '⏳ Processing check-in...' : checkedInToday ? '✅ Checked In Today' : '📅 Check In Now & Claim ₱5'}
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
              Get a **100% matched deposit bonus** on your first completed deposit up to **₱5,000.00**. 
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

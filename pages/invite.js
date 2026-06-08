import React, { useState, useEffect } from 'react'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import AuthModal from '../components/AuthModal'

export default function Invite() {
  const { user } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Referral Stats State
  const [referralsList, setReferralsList] = useState([])
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [loadingStats, setLoadingStats] = useState(true)

  const emailPrefix = user?.email ? user.email.split('@')[0] : 'GUEST'
  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/signup?ref=${user?.email || ''}`
    : `https://betpk.com/signup?ref=${user?.email || ''}`

  const fetchReferralStats = async () => {
    if (!user) {
      setLoadingStats(false)
      return
    }

    try {
      // Query completed transactions for referral payouts
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'payout')
        .eq('status', 'completed')
        .like('notes', 'Referral Reward: Invited %')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setReferralsList(data)
        const sum = data.reduce((acc, curr) => acc + parseFloat(curr.amount), 0)
        setTotalEarnings(sum)
      }
    } catch (err) {
      console.error('Failed to query referrals:', err)
    } finally {
      setLoadingStats(false)
    }
  }

  useEffect(() => {
    fetchReferralStats()
  }, [user])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="app">
      <NavBar />
      <div style={{ padding: '24px 16px', maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Banner */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ color: 'var(--accent)', marginTop: 0, fontSize: '28px' }}>💸 Invite & Earn</h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.5' }}>
            Invite your friends to register. Receive a massive reward of <strong style={{ color: 'var(--accent)' }}>₱155.55</strong> instantly in your wallet for every friend who joins!
          </p>
        </div>

        {user ? (
          <div>
            {/* Referral Code details */}
            <div style={{ background: 'var(--card)', padding: '24px', borderRadius: '16px', border: '1px dashed var(--accent)', textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Personal Invite Code</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', letterSpacing: '2px', color: '#fff', margin: '8px 0' }}>{emailPrefix}</div>
              
              <div style={{ borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '16px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '8px' }}>Referral Link</div>
                <div style={{ background: '#000', padding: '10px', borderRadius: '8px', fontSize: '12px', color: 'var(--accent)', wordBreak: 'break-all', border: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{referralLink}</span>
                  <button onClick={handleCopyLink} style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', flexShrink: 0 }}>
                    {copied ? 'Copied! ✅' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            {/* Dashboard stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '4px' }}>FRIENDS REFERRED</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)' }}>
                  {loadingStats ? '...' : referralsList.length}
                </div>
              </div>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '4px' }}>TOTAL REWARDS EARNED</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00ff88' }}>
                  ₱{loadingStats ? '...' : totalEarnings.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Friends list */}
            <h2 style={{ fontSize: '18px', color: '#fff', marginBottom: '12px' }}>👥 Referred Friends</h2>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              {loadingStats ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#555' }}>Loading referral records...</div>
              ) : referralsList.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#555' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🦊</div>
                  No referrals yet. Share your code to get started!
                </div>
              ) : (
                referralsList.map(item => {
                  const referredEmail = item.notes.replace('Referral Reward: Invited ', '')
                  return (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{referredEmail}</div>
                        <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>Joined {new Date(item.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '14px' }}>
                        +₱{parseFloat(item.amount).toFixed(2)}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--card)', padding: '40px', borderRadius: '16px', border: '1px solid var(--border)', textAlign: 'center', marginTop: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
            <h2 style={{ marginTop: 0 }}>Login Required</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>You must log in to access your custom invite code and track referral rewards.</p>
            <button className="btn primary" onClick={() => setIsAuthModalOpen(true)} style={{ width: '100%', padding: '14px' }}>Log In / Sign Up</button>
          </div>
        )}

      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <BottomNav />
    </div>
  )
}

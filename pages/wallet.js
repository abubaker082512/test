import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import { db } from '../utils/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import AuthModal from '../components/AuthModal'
import CurrencyFlag from '../components/CurrencyFlag'
import BottomNav from '../components/BottomNav'

export default function WalletPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('deposit') // 'deposit' | 'withdraw' | 'history'
  const [depositTab, setDepositTab] = useState('online') // 'online' | 'crypto'
  const [refreshing, setRefreshing] = useState(false)

  // Exchange Rates & Gateway settings
  const [rates, setRates] = useState({
    pkr_rate: 1.0,
    usd_rate: 280.0,
    directpay_enabled: true,
    jazzcash_mode: 'directpay',
    easypaisa_mode: 'directpay',
    card_mode: 'directpay'
  })

  // Selected Payment Method & Channel
  const [selectedChannel, setSelectedChannel] = useState('JazzCash') // 'JazzCash' | 'EasyPaisa' | 'JazzCash 2' | 'EasyPaisa 2'
  const [dpAmount, setDpAmount] = useState('1000')
  const [dpPhone, setDpPhone] = useState('')
  const [dpName, setDpName] = useState('')
  const [dpLoading, setDpLoading] = useState(false)
  const [dpMsg, setDpMsg] = useState(null)

  // Withdraw form
  const [witAmount, setWitAmount] = useState('')
  const [witMethod, setWitMethod] = useState('EasyPaisa')
  const [witAccount, setWitAccount] = useState('')
  const [witMsg, setWitMsg] = useState(null)

  // Promotion countdown timer state
  const [timeLeft, setTimeLeft] = useState('02:05:50.8')

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const hours = String(23 - now.getHours()).padStart(2, '0')
      const minutes = String(59 - now.getMinutes()).padStart(2, '0')
      const seconds = String(59 - now.getSeconds()).padStart(2, '0')
      const tenths = Math.floor(Math.random() * 9)
      setTimeLeft(`${hours}:${minutes}:${seconds}.${tenths}`)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchRates = async () => {
    try {
      const res = await fetch('/api/settings/get')
      const data = await res.json()
      if (data.success) {
        setRates(prev => ({
          ...prev,
          pkr_rate: data.pkr_rate || 1.0,
          usd_rate: data.usd_rate || 280.0,
          directpay_enabled: data.directpay_enabled !== false,
          jazzcash_mode: data.jazzcash_mode || 'directpay',
          easypaisa_mode: data.easypaisa_mode || 'directpay',
          card_mode: data.card_mode || 'directpay'
        }))
      }
    } catch (e) {}
  }

  const fetchData = async () => {
    const activeUid = user?.id || user?.uid || ''
    const activeEmail = user?.email || ''
    if (!activeUid && !activeEmail) return

    try {
      const res = await fetch(`/api/wallet/get-balance?user_id=${encodeURIComponent(activeUid)}&email=${encodeURIComponent(activeEmail)}`)
      const json = await res.json()
      if (json.success) {
        if (json.wallet) setWallet(json.wallet)
        if (Array.isArray(json.transactions)) setTransactions(json.transactions)
      }
    } catch (e) {}

    try {
      if (user?.id) {
        const { data: t } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
        if (t && t.length > 0) {
          setTransactions(prev => {
            const map = new Map()
            for (const item of [...(prev || []), ...t]) {
              const k = item.id || item.tx_id
              if (k) map.set(k, item)
            }
            return Array.from(map.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          })
        }
      }
    } catch (e) {}
  }

  useEffect(() => {
    fetchRates()
    fetchData()
    const pollInterval = setInterval(() => { fetchData() }, 5000)
    return () => clearInterval(pollInterval)
  }, [user])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setTimeout(() => setRefreshing(false), 800)
  }

  // Handle return redirect from DirectPay, JazzCash, EasyPaisa
  useEffect(() => {
    if (!router.isReady) return
    const { directpay_status, jazzcash_status, easypaisa_status, txn_id, orderRefNum, amount } = router.query
    const resolvedTxnId = txn_id || orderRefNum

    if (directpay_status === 'success' && resolvedTxnId) {
      setDpMsg({ type: 'success', text: `🎉 Deposit successful! Credited Rs ${amount || ''} to balance.` })
      fetchData()
      window.dispatchEvent(new Event('wallet-updated'))
    } else if (directpay_status === 'failed') {
      setDpMsg({ type: 'error', text: 'Transaction was cancelled or failed. Please try again.' })
    }
  }, [router.isReady, router.query])

  // Payment Channels list matching Screenshot 3
  const paymentChannels = [
    { id: 'JazzCash', name: 'JazzCash', badge: '+0.3%', tag: 'HOT', icon: '🔴' },
    { id: 'EasyPaisa', name: 'EasyPaisa', badge: null, tag: 'HOT', icon: '🟢' },
    { id: 'JazzCash 2', name: 'JazzCash 2', badge: '+0.3%', tag: 'HOT', icon: '🔴' },
    { id: 'EasyPaisa 2', name: 'EasyPaisa 2', badge: null, tag: 'HOT', icon: '🟢' },
  ]

  // Quick Amount Options with Golden Bonuses matching Screenshot 3
  const quickAmounts = [
    { amount: 100, bonus: 100.00 },
    { amount: 500, bonus: 130.00 },
    { amount: 1000, bonus: 160.00 },
    { amount: 5000, bonus: 240.00 },
    { amount: 10000, bonus: 520.00 },
    { amount: 30000, bonus: 850.00 },
    { amount: 50000, bonus: 1500.00 },
    { amount: 100000, bonus: 5700.00 },
  ]

  const handleDepositSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }

    setDpLoading(true)
    setDpMsg(null)

    const resolvedMethod = selectedChannel.includes('JazzCash') ? 'JazzCash' : 'Easypaisa'
    const activeUserId = user.id || user.uid || 'guest'
    const activeEmail = user.email || `${activeUserId}@winxpro.com`
    const activePhone = dpPhone || user.phone || '03001234567'
    const activeName = dpName || user.email?.split('@')[0] || 'WinX Player'

    try {
      const res = await fetch('/api/payments/directpay/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: activeUserId,
          amountInPKR: Number(dpAmount),
          payer_name: activeName,
          email: activeEmail,
          msisdn: activePhone,
          currency: 'PKR',
          payment_method: resolvedMethod
        })
      })
      const data = await res.json().catch(() => ({}))
      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl
        return
      }
      setDpMsg({ type: 'error', text: data.error || `Failed to connect to ${resolvedMethod} gateway.` })
      setDpLoading(false)
    } catch (err) {
      setDpMsg({ type: 'error', text: err.message || 'Payment service unavailable. Try again.' })
      setDpLoading(false)
    }
  }

  const handleWithdraw = async (e) => {
    e.preventDefault()
    if (!user) return setIsAuthModalOpen(true)
    setWitMsg(null)

    if (Number(witAmount) < 500) {
      return setWitMsg({ type: 'error', text: 'Minimum withdrawal is Rs 500.' })
    }

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          amount: Number(witAmount),
          notes: `Withdrawal to ${witMethod} Account: ${witAccount}`
        })
      })
      const data = await res.json()
      if (data.success) {
        setWitMsg({ type: 'success', text: `✅ Payout request submitted! Rs ${witAmount} will arrive shortly.` })
        setWitAmount('')
        fetchData()
        window.dispatchEvent(new Event('wallet-updated'))
      } else {
        setWitMsg({ type: 'error', text: data.error || 'Failed to request payout.' })
      }
    } catch (err) {
      setWitMsg({ type: 'error', text: err.message })
    }
  }

  return (
    <div className="app">
      {/* Sleek Top Header matching Screenshot 3 */}
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
        <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', letterSpacing: '0.3px' }}>Deposit</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.push('/support')} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '18px', cursor: 'pointer' }}>
            🎧
          </button>
          <button onClick={() => setActiveTab(activeTab === 'history' ? 'deposit' : 'history')} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '18px', cursor: 'pointer' }}>
            🧾
          </button>
        </div>
      </div>

      <div style={{ padding: '14px 16px 90px', maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Balance Bar (Screenshot 3) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#94A3B8' }}>Balance</div>
          <div style={{
            background: 'rgba(20, 26, 36, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '4px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '15px' }}>🇵🇰</span>
            <span style={{ fontSize: '14px', fontWeight: 900, color: '#FFB800' }}>
              {wallet ? parseFloat(wallet.balance).toFixed(2) : '0.00'}
            </span>
            <button 
              onClick={handleRefresh}
              style={{ background: 'none', border: 'none', color: '#00E65B', cursor: 'pointer', fontSize: '12px' }}
              className={refreshing ? 'coin-spin' : ''}
            >
              🔄
            </button>
          </div>
        </div>

        {/* Deposit / Withdraw / History Navigation Pills */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(20, 26, 36, 0.5)', padding: '4px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <button 
            onClick={() => setActiveTab('deposit')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'deposit' ? 'rgba(0, 230, 91, 0.15)' : 'transparent',
              color: activeTab === 'deposit' ? '#00E65B' : '#94A3B8',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              border: activeTab === 'deposit' ? '1px solid rgba(0, 230, 91, 0.5)' : '1px solid transparent'
            }}
          >
            Deposit
          </button>
          <button 
            onClick={() => setActiveTab('withdraw')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'withdraw' ? 'rgba(0, 230, 91, 0.15)' : 'transparent',
              color: activeTab === 'withdraw' ? '#00E65B' : '#94A3B8',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              border: activeTab === 'withdraw' ? '1px solid rgba(0, 230, 91, 0.5)' : '1px solid transparent'
            }}
          >
            Withdraw
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'history' ? 'rgba(0, 230, 91, 0.15)' : 'transparent',
              color: activeTab === 'history' ? '#00E65B' : '#94A3B8',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              border: activeTab === 'history' ? '1px solid rgba(0, 230, 91, 0.5)' : '1px solid transparent'
            }}
          >
            History
          </button>
        </div>

        {activeTab === 'deposit' && (
          <>
            {/* Tabs: Online deposit & Crypto (Screenshot 3) */}
            <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              <div 
                onClick={() => setDepositTab('online')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  position: 'relative',
                  paddingBottom: '8px',
                  color: depositTab === 'online' ? '#00E65B' : '#64748B',
                  fontWeight: 800,
                  fontSize: '14px'
                }}
              >
                <span>📲</span>
                <span>Online deposit</span>
                {depositTab === 'online' && (
                  <div style={{ position: 'absolute', bottom: '-9px', left: 0, right: 0, height: '2.5px', background: '#00E65B', borderRadius: '2px', boxShadow: '0 0 8px #00E65B' }} />
                )}
              </div>

              <div 
                onClick={() => setDepositTab('crypto')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  position: 'relative',
                  paddingBottom: '8px',
                  color: depositTab === 'crypto' ? '#00E65B' : '#64748B',
                  fontWeight: 800,
                  fontSize: '14px'
                }}
              >
                <span>🪙</span>
                <span>Crypto</span>
                {depositTab === 'crypto' && (
                  <div style={{ position: 'absolute', bottom: '-9px', left: 0, right: 0, height: '2.5px', background: '#00E65B', borderRadius: '2px', boxShadow: '0 0 8px #00E65B' }} />
                )}
              </div>
            </div>

            {/* Payment Method Section (Screenshot 3) */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', marginBottom: '10px' }}>
                Payment method
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {paymentChannels.map((channel) => {
                  const isSelected = selectedChannel === channel.id
                  return (
                    <div
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel.id)}
                      style={{
                        background: 'rgba(20, 26, 36, 0.75)',
                        backdropFilter: 'blur(12px)',
                        border: isSelected ? '1.5px solid #00E65B' : '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: isSelected ? '0 0 16px rgba(0, 230, 91, 0.25)' : 'none',
                        borderRadius: '12px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s'
                      }}
                    >
                      {channel.badge && (
                        <span style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '12px',
                          background: '#FF3366',
                          color: '#fff',
                          fontSize: '8.5px',
                          fontWeight: 900,
                          padding: '1px 5px',
                          borderRadius: '6px',
                          boxShadow: '0 2px 6px rgba(255, 51, 102, 0.5)'
                        }}>
                          {channel.badge}
                        </span>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>{channel.icon}</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: isSelected ? '#00E65B' : '#fff' }}>
                          {channel.name}
                        </span>
                      </div>

                      <span style={{
                        fontSize: '9px',
                        fontWeight: 900,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isSelected ? 'rgba(0, 230, 91, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                        color: isSelected ? '#00E65B' : '#64748B',
                        border: isSelected ? '1px solid rgba(0, 230, 91, 0.5)' : '1px solid transparent'
                      }}>
                        {channel.tag}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Deposit Amount Input (Screenshot 3) */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', marginBottom: '10px' }}>
                Deposit amount
              </div>

              <div style={{
                background: 'rgba(20, 26, 36, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
              }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#94A3B8' }}>Rs</span>
                <input 
                  type="number"
                  placeholder="Min 100~Max 100,000"
                  value={dpAmount}
                  onChange={(e) => setDpAmount(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 700,
                    width: '100%'
                  }}
                  min={100}
                  max={100000}
                />
              </div>
            </div>

            {/* Quick Amount Selector Grid (Screenshot 3) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {quickAmounts.map((opt) => {
                const isSelected = Number(dpAmount) === opt.amount
                return (
                  <div
                    key={opt.amount}
                    onClick={() => setDpAmount(String(opt.amount))}
                    style={{
                      background: 'rgba(20, 26, 36, 0.75)',
                      backdropFilter: 'blur(10px)',
                      border: isSelected ? '1.5px solid #00E65B' : '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: isSelected ? '0 0 12px rgba(0, 230, 91, 0.25)' : 'none',
                      borderRadius: '10px',
                      padding: '8px 4px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#fff' }}>
                      {opt.amount.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: '#FFB800', marginTop: '2px' }}>
                      +{opt.bonus.toFixed(2)}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Deposit Promotion Card (Screenshot 3) */}
            <div className="glass-panel" style={{ borderRadius: '16px', padding: '12px 14px', border: '1px solid rgba(255, 184, 0, 0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '16px' }}>🎁</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#fff' }}>Deposit promotion</span>
                </div>
                <div style={{
                  background: 'linear-gradient(90deg, #FF5722 0%, #FF9800 100%)',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  fontSize: '9.5px',
                  fontWeight: 900,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>⚡ LT</span> {timeLeft}
                </div>
              </div>

              <div style={{ fontSize: '9.5px', color: '#64748B', textAlign: 'center', marginBottom: '10px' }}>
                ----- Automatically participated in the following activities -----
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94A3B8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🎁</span> <span>Reward 10.00-100.00</span>
                  </div>
                  <span style={{ color: '#E2E8F0', fontWeight: 700 }}>First Deposit ≥ 100</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94A3B8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🎁</span> <span>Bonus 20.00</span>
                  </div>
                  <span style={{ color: '#E2E8F0', fontWeight: 700 }}>First Deposit ≥ 300</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94A3B8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🎁</span> <span>Bonus 10.00</span>
                  </div>
                  <span style={{ color: '#E2E8F0', fontWeight: 700 }}>Total deposit ≥ 300</span>
                </div>
              </div>

              <div style={{
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '10px',
                fontWeight: 800,
                color: '#FFB800',
                textAlign: 'right'
              }}>
                Deposit again 300 to receive bonuses ›
              </div>
            </div>

            {dpMsg && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                background: dpMsg.type === 'error' ? 'rgba(255, 51, 102, 0.15)' : 'rgba(0, 230, 91, 0.15)',
                border: `1px solid ${dpMsg.type === 'error' ? '#FF3366' : '#00E65B'}`,
                color: dpMsg.type === 'error' ? '#FF3366' : '#00E65B'
              }}>
                {dpMsg.text}
              </div>
            )}

            {/* Action Submit Button */}
            <button 
              onClick={handleDepositSubmit}
              disabled={dpLoading}
              style={{
                background: 'var(--cta-deposit)',
                color: '#fff',
                border: 'none',
                padding: '13px',
                borderRadius: '14px',
                fontSize: '14px',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(255, 87, 34, 0.4)',
                transition: 'all 0.2s',
                marginTop: '4px'
              }}
            >
              {dpLoading ? 'Connecting to Gateway...' : `Deposit Rs ${Number(dpAmount || 0).toLocaleString()} via ${selectedChannel}`}
            </button>
          </>
        )}

        {activeTab === 'withdraw' && (
          <div className="glass-panel" style={{ borderRadius: '18px', padding: '16px' }}>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
              Request Payout / Withdrawal
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '16px' }}>
              Minimum withdrawal: Rs 500. Direct payout to JazzCash or EasyPaisa in minutes.
            </div>

            {witMsg && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                marginBottom: '14px',
                background: witMsg.type === 'error' ? 'rgba(255, 51, 102, 0.15)' : 'rgba(0, 230, 91, 0.15)',
                border: `1px solid ${witMsg.type === 'error' ? '#FF3366' : '#00E65B'}`,
                color: witMsg.type === 'error' ? '#FF3366' : '#00E65B'
              }}>
                {witMsg.text}
              </div>
            )}

            <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
                  Payout Method
                </label>
                <select 
                  value={witMethod} 
                  onChange={e => setWitMethod(e.target.value)} 
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(20, 26, 36, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700
                  }}
                >
                  <option value="EasyPaisa">EasyPaisa</option>
                  <option value="JazzCash">JazzCash</option>
                  <option value="Bank Transfer">Bank Transfer (1LINK)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
                  Account Mobile / IBAN Number
                </label>
                <input 
                  type="text" 
                  placeholder="03xxxxxxxxx or Bank IBAN" 
                  value={witAccount} 
                  onChange={e => setWitAccount(e.target.value)} 
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(20, 26, 36, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
                  Amount in PKR (Min 500)
                </label>
                <input 
                  type="number" 
                  placeholder="e.g. 1000" 
                  value={witAmount} 
                  onChange={e => setWitAmount(e.target.value)} 
                  required
                  min={500}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(20, 26, 36, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                />
              </div>

              <button 
                type="submit"
                style={{
                  background: 'var(--cta-claim)',
                  color: '#07090D',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  marginTop: '8px',
                  boxShadow: '0 4px 16px rgba(0, 230, 91, 0.3)'
                }}
              >
                Submit Payout Request
              </button>
            </form>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="glass-panel" style={{ borderRadius: '18px', padding: '16px' }}>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '14px' }}>
              Transaction History
            </div>

            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#64748B', fontSize: '12px' }}>
                No recorded transactions yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {transactions.map(tx => (
                  <div 
                    key={tx.id || tx.tx_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#fff' }}>
                        {tx.type === 'deposit' ? '🟢 Deposit' : '🔴 Withdrawal'} ({tx.method || 'Auto Gateway'})
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>
                        {new Date(tx.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 900,
                        color: tx.type === 'deposit' ? '#00E65B' : '#FF3366'
                      }}>
                        {tx.type === 'deposit' ? '+' : '-'}Rs {parseFloat(tx.amount).toFixed(2)}
                      </div>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '6px',
                        background: tx.status === 'completed' ? 'rgba(0, 230, 91, 0.15)' : 'rgba(255, 184, 0, 0.15)',
                        color: tx.status === 'completed' ? '#00E65B' : '#FFB800'
                      }}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <BottomNav />
    </div>
  )
}

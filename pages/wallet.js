import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import { db } from '../utils/firebase'
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
  const [copiedField, setCopiedField] = useState(null)

  // Receiving Accounts & Gateway Settings from Admin
  const [rates, setRates] = useState({
    pkr_rate: 1.0,
    usd_rate: 280.0,
    min_deposit: 200,
    max_deposit: 100000,
    min_withdraw: 500,
    max_withdraw: 50000,
    manual_jazzcash_title: 'WinX Pro Official',
    manual_jazzcash_no: '03112235935',
    manual_jazzcash2_title: 'WinX Pro VIP',
    manual_jazzcash2_no: '03001234567',
    manual_easypaisa_title: 'WinX Pro Official',
    manual_easypaisa_no: '03493530916',
    manual_easypaisa2_title: 'WinX Pro VIP',
    manual_easypaisa2_no: '03451234567',
    manual_crypto_network: 'USDT (TRC20)',
    manual_crypto_address: '',
    deposit_instructions: 'Please transfer the exact amount to the account shown above, then enter your Transaction ID (TID) to get credited.'
  })

  // Selected Payment Method & Channel
  const [selectedChannel, setSelectedChannel] = useState('JazzCash') // 'JazzCash' | 'EasyPaisa' | 'JazzCash 2' | 'EasyPaisa 2'
  const [dpAmount, setDpAmount] = useState('200') // Minimum deposit is 200
  const [dpPhone, setDpPhone] = useState('')
  const [dpTid, setDpTid] = useState('')
  const [dpLoading, setDpLoading] = useState(false)
  const [dpMsg, setDpMsg] = useState(null)

  // Crypto Deposit state
  const [cryptoAmount, setCryptoAmount] = useState('10')
  const [cryptoTxid, setCryptoTxid] = useState('')

  // Withdraw form
  const [witAmount, setWitAmount] = useState('')
  const [witMethod, setWitMethod] = useState('EasyPaisa')
  const [witAccount, setWitAccount] = useState('')
  const [witTitle, setWitTitle] = useState('')
  const [witMsg, setWitMsg] = useState(null)
  const [witLoading, setWitLoading] = useState(false)

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
          min_deposit: data.min_deposit || 200,
          max_deposit: data.max_deposit || 100000,
          min_withdraw: data.min_withdraw || 500,
          max_withdraw: data.max_withdraw || 50000,
          manual_jazzcash_title: data.manual_jazzcash_title || 'WinX Pro Official',
          manual_jazzcash_no: data.manual_jazzcash_no || '03112235935',
          manual_jazzcash2_title: data.manual_jazzcash2_title || 'WinX Pro VIP',
          manual_jazzcash2_no: data.manual_jazzcash2_no || '03001234567',
          manual_easypaisa_title: data.manual_easypaisa_title || 'WinX Pro Official',
          manual_easypaisa_no: data.manual_easypaisa_no || '03493530916',
          manual_easypaisa2_title: data.manual_easypaisa2_title || 'WinX Pro VIP',
          manual_easypaisa2_no: data.manual_easypaisa2_no || '03451234567',
          manual_crypto_network: data.manual_crypto_network || 'USDT (TRC20)',
          manual_crypto_address: data.manual_crypto_address || '',
          deposit_instructions: data.deposit_instructions || prev.deposit_instructions
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

  // Payment Channels list matching Screenshot 3
  const paymentChannels = [
    { id: 'JazzCash', name: 'JazzCash', badge: '+0.3%', tag: 'HOT', icon: '🔴' },
    { id: 'EasyPaisa', name: 'EasyPaisa', badge: '+0.3%', tag: 'HOT', icon: '🟢' },
    { id: 'JazzCash 2', name: 'JazzCash 2', badge: null, tag: 'VIP', icon: '🔴' },
    { id: 'EasyPaisa 2', name: 'EasyPaisa 2', badge: null, tag: 'VIP', icon: '🟢' },
  ]

  // Resolve currently selected admin receiving account
  const getAdminAccount = () => {
    if (selectedChannel === 'JazzCash') {
      return {
        title: rates.manual_jazzcash_title || 'WinX Pro Official',
        no: rates.manual_jazzcash_no || '03112235935',
        type: 'JazzCash'
      }
    }
    if (selectedChannel === 'JazzCash 2') {
      return {
        title: rates.manual_jazzcash2_title || 'WinX Pro VIP',
        no: rates.manual_jazzcash2_no || '03001234567',
        type: 'JazzCash VIP'
      }
    }
    if (selectedChannel === 'EasyPaisa') {
      return {
        title: rates.manual_easypaisa_title || 'WinX Pro Official',
        no: rates.manual_easypaisa_no || '03493530916',
        type: 'EasyPaisa'
      }
    }
    if (selectedChannel === 'EasyPaisa 2') {
      return {
        title: rates.manual_easypaisa2_title || 'WinX Pro VIP',
        no: rates.manual_easypaisa2_no || '03451234567',
        type: 'EasyPaisa VIP'
      }
    }
    return {
      title: rates.manual_jazzcash_title || 'WinX Pro Official',
      no: rates.manual_jazzcash_no || '03112235935',
      type: 'JazzCash'
    }
  }

  // Quick Amount Options with Golden Bonuses matching Screenshot 3 & 2 (Minimum 200)
  const quickAmounts = [
    { amount: 200, bonus: 20.00 },
    { amount: 500, bonus: 130.00 },
    { amount: 1000, bonus: 160.00 },
    { amount: 3000, bonus: 100.00 },
    { amount: 5000, bonus: 240.00 },
    { amount: 10000, bonus: 520.00 },
    { amount: 30000, bonus: 850.00 },
    { amount: 50000, bonus: 1500.00 },
    { amount: 100000, bonus: 5700.00 },
  ]

  const copyToClipboard = (text, fieldName) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Handle Direct Manual Deposit Submission (Zero 3rd-party fees)
  const handleDepositSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }

    const minDeposit = Number(rates.min_deposit || 200)
    const maxDeposit = Number(rates.max_deposit || 100000)
    const numAmount = Number(dpAmount)

    if (isNaN(numAmount) || numAmount < minDeposit) {
      setDpMsg({ type: 'error', text: `Minimum deposit amount is Rs ${minDeposit.toLocaleString()}` })
      return
    }
    if (numAmount > maxDeposit) {
      setDpMsg({ type: 'error', text: `Maximum deposit amount is Rs ${maxDeposit.toLocaleString()}` })
      return
    }

    if (!dpTid || dpTid.trim().length < 6) {
      setDpMsg({ type: 'error', text: 'Please enter a valid Transaction ID (TID / TRX ID) from your payment receipt.' })
      return
    }

    setDpLoading(true)
    setDpMsg(null)

    const activeUserId = user.id || user.uid || 'guest'
    const activeEmail = user.email || `${activeUserId}@winxpro.com`
    const activePhone = dpPhone || user.phone || ''

    // Calculate eligible bonus from quickAmounts
    const matchedOpt = quickAmounts.find(q => q.amount === numAmount)
    const bonusAmount = matchedOpt ? matchedOpt.bonus : 0

    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: activeUserId,
          email: activeEmail,
          amount: numAmount,
          channel: selectedChannel,
          sender_phone: activePhone,
          tid: dpTid.trim(),
          bonus_amount: bonusAmount
        })
      })
      const data = await res.json()
      if (data.success) {
        setDpMsg({ 
          type: 'success', 
          text: `✅ Deposit of Rs ${numAmount.toLocaleString()} submitted! TID: ${dpTid.trim()}. Your balance will be credited upon verification in under 2 minutes.` 
        })
        setDpTid('')
        fetchData()
        window.dispatchEvent(new Event('wallet-updated'))
      } else {
        setDpMsg({ type: 'error', text: data.error || 'Failed to submit deposit request.' })
      }
    } catch (err) {
      setDpMsg({ type: 'error', text: err.message || 'Network error. Please try again.' })
    } finally {
      setDpLoading(false)
    }
  }

  // Handle Crypto USDT Deposit Submission
  const handleCryptoSubmit = async (e) => {
    e.preventDefault()
    if (!user) return setIsAuthModalOpen(true)

    if (!cryptoTxid || cryptoTxid.trim().length < 10) {
      setDpMsg({ type: 'error', text: 'Please enter a valid USDT (TRC20) Transaction Hash (TXID).' })
      return
    }

    setDpLoading(true)
    setDpMsg(null)

    const pkrEquivalent = Math.round(Number(cryptoAmount) * Number(rates.usd_rate || 280))
    const activeUserId = user.id || user.uid || 'guest'

    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: activeUserId,
          email: user.email || '',
          amount: pkrEquivalent,
          channel: 'USDT (TRC20)',
          sender_phone: 'Crypto Wallet',
          tid: cryptoTxid.trim(),
          bonus_amount: 0
        })
      })
      const data = await res.json()
      if (data.success) {
        setDpMsg({ 
          type: 'success', 
          text: `✅ Crypto deposit of ${cryptoAmount} USDT (~Rs ${pkrEquivalent.toLocaleString()}) submitted! Hash: ${cryptoTxid.slice(0, 16)}... Status: PENDING.` 
        })
        setCryptoTxid('')
        fetchData()
      } else {
        setDpMsg({ type: 'error', text: data.error || 'Failed to submit crypto deposit.' })
      }
    } catch (err) {
      setDpMsg({ type: 'error', text: err.message || 'Network error.' })
    } finally {
      setDpLoading(false)
    }
  }

  // Handle Withdrawal Request
  const handleWithdraw = async (e) => {
    e.preventDefault()
    if (!user) return setIsAuthModalOpen(true)
    setWitMsg(null)

    const minWithdraw = Number(rates.min_withdraw || 500)
    const numAmount = Number(witAmount)

    if (isNaN(numAmount) || numAmount < minWithdraw) {
      return setWitMsg({ type: 'error', text: `Minimum withdrawal is Rs ${minWithdraw.toLocaleString()}.` })
    }

    setWitLoading(true)
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id || user.uid,
          amount: numAmount,
          notes: `Withdrawal to ${witMethod} | Title: ${witTitle || 'N/A'} | Number: ${witAccount}`
        })
      })
      const data = await res.json()
      if (data.success) {
        setWitMsg({ type: 'success', text: `✅ Payout request of Rs ${numAmount.toLocaleString()} submitted! Admin will send payment to your account shortly.` })
        setWitAmount('')
        setWitAccount('')
        setWitTitle('')
        fetchData()
        window.dispatchEvent(new Event('wallet-updated'))
      } else {
        setWitMsg({ type: 'error', text: data.error || 'Failed to request payout.' })
      }
    } catch (err) {
      setWitMsg({ type: 'error', text: err.message })
    } finally {
      setWitLoading(false)
    }
  }

  const currentAdmin = getAdminAccount()

  return (
    <div className="app">
      {/* Sleek Top Header matching Screenshot 3 */}
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(11, 14, 20, 0.96)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>
        <button 
          onClick={() => router.back()} 
          style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          ‹
        </button>
        <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', letterSpacing: '0.3px' }}>
          {activeTab === 'withdraw' ? 'Withdrawal' : activeTab === 'history' ? 'History' : 'Deposit'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.push('/support')} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '18px', cursor: 'pointer' }}>
            🎧
          </button>
          <button onClick={() => setActiveTab(activeTab === 'history' ? 'deposit' : 'history')} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '18px', cursor: 'pointer' }}>
            🧾
          </button>
        </div>
      </div>

      <div style={{ padding: '14px 16px 90px', maxWidth: '480px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px', boxSizing: 'border-box' }}>
        
        {/* Balance Bar (Screenshot 3) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#94A3B8' }}>Balance</div>
          <div style={{
            background: 'rgba(20, 26, 36, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '5px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px' }}>🇵🇰</span>
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#00E65B' }}>
              {wallet ? parseFloat(wallet.balance).toFixed(2) : '0.00'}
            </span>
            <button 
              onClick={handleRefresh}
              style={{ background: 'none', border: 'none', color: '#00E65B', cursor: 'pointer', fontSize: '13px', padding: '2px' }}
              className={refreshing ? 'coin-spin' : ''}
              title="Refresh Balance"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Deposit / Withdraw / History Navigation Pills */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(20, 26, 36, 0.8)', padding: '4px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <button 
            onClick={() => setActiveTab('deposit')}
            style={{
              flex: 1,
              padding: '9px',
              borderRadius: '10px',
              border: activeTab === 'deposit' ? '1px solid rgba(0, 230, 91, 0.5)' : '1px solid transparent',
              background: activeTab === 'deposit' ? 'rgba(0, 230, 91, 0.15)' : 'transparent',
              color: activeTab === 'deposit' ? '#00E65B' : '#94A3B8',
              fontWeight: 800,
              fontSize: '12.5px',
              cursor: 'pointer'
            }}
          >
            Deposit
          </button>
          <button 
            onClick={() => setActiveTab('withdraw')}
            style={{
              flex: 1,
              padding: '9px',
              borderRadius: '10px',
              border: activeTab === 'withdraw' ? '1px solid rgba(0, 230, 91, 0.5)' : '1px solid transparent',
              background: activeTab === 'withdraw' ? 'rgba(0, 230, 91, 0.15)' : 'transparent',
              color: activeTab === 'withdraw' ? '#00E65B' : '#94A3B8',
              fontWeight: 800,
              fontSize: '12.5px',
              cursor: 'pointer'
            }}
          >
            Withdraw
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            style={{
              flex: 1,
              padding: '9px',
              borderRadius: '10px',
              border: activeTab === 'history' ? '1px solid rgba(0, 230, 91, 0.5)' : '1px solid transparent',
              background: activeTab === 'history' ? 'rgba(0, 230, 91, 0.15)' : 'transparent',
              color: activeTab === 'history' ? '#00E65B' : '#94A3B8',
              fontWeight: 800,
              fontSize: '12.5px',
              cursor: 'pointer'
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

            {depositTab === 'online' ? (
              <>
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
                            background: '#141A24',
                            border: isSelected ? '1.5px solid #00E65B' : '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: isSelected ? '0 0 16px rgba(0, 230, 91, 0.25)' : 'none',
                            borderRadius: '12px',
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'all 0.15s'
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

                {/* Direct Admin Receiving Account Card (Official Details) */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(20, 26, 36, 0.95) 0%, rgba(14, 18, 26, 0.98) 100%)',
                  border: '1px solid rgba(0, 230, 91, 0.35)',
                  borderRadius: '16px',
                  padding: '14px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>🏦</span>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
                        Deposit to {currentAdmin.type}
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#00E65B', background: 'rgba(0, 230, 91, 0.15)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                      Official Admin Account
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0, 0, 0, 0.3)', padding: '10px 12px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>Account Title:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#fff' }}>{currentAdmin.title}</span>
                        <button 
                          onClick={() => copyToClipboard(currentAdmin.title, 'title')}
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: copiedField === 'title' ? '#00E65B' : '#94A3B8',
                            borderRadius: '6px',
                            padding: '2px 6px',
                            fontSize: '10px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          {copiedField === 'title' ? '✓ Copied' : '📋 Copy'}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>Account Number:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 900, color: '#00E65B', letterSpacing: '0.5px' }}>{currentAdmin.no}</span>
                        <button 
                          onClick={() => copyToClipboard(currentAdmin.no, 'no')}
                          style={{
                            background: 'rgba(0, 230, 91, 0.15)',
                            border: '1px solid rgba(0, 230, 91, 0.4)',
                            color: copiedField === 'no' ? '#00FF66' : '#00E65B',
                            borderRadius: '6px',
                            padding: '2px 8px',
                            fontSize: '11px',
                            fontWeight: 900,
                            cursor: 'pointer'
                          }}
                        >
                          {copiedField === 'no' ? '✓ Copied' : '📋 Copy'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '8px', lineHeight: 1.4 }}>
                    💡 Transfer Rs {Number(dpAmount || 200).toLocaleString()} to the account above via your {selectedChannel.includes('JazzCash') ? 'JazzCash' : 'EasyPaisa'} App, then enter your Transaction ID (TID) below.
                  </div>
                </div>

                {/* Deposit Amount Input (Screenshot 3) */}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
                    Deposit amount (Minimum Rs {rates.min_deposit || 200})
                  </div>

                  <div style={{
                    background: 'rgba(20, 26, 36, 0.95)',
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
                      placeholder={`Min ${rates.min_deposit || 200}~Max 100,000`}
                      value={dpAmount}
                      onChange={(e) => setDpAmount(e.target.value)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#fff',
                        fontSize: '15px',
                        fontWeight: 800,
                        width: '100%'
                      }}
                      min={rates.min_deposit || 200}
                      max={rates.max_deposit || 100000}
                    />
                  </div>
                </div>

                {/* Quick Amount Selector Grid (Screenshot 3 - Minimum 200) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {quickAmounts.map((opt) => {
                    const isSelected = Number(dpAmount) === opt.amount
                    return (
                      <div
                        key={opt.amount}
                        onClick={() => setDpAmount(String(opt.amount))}
                        style={{
                          background: '#141A24',
                          border: isSelected ? '1.5px solid #00E65B' : '1px solid rgba(255, 255, 255, 0.08)',
                          boxShadow: isSelected ? '0 0 12px rgba(0, 230, 91, 0.25)' : 'none',
                          borderRadius: '10px',
                          padding: '8px 4px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
                          {opt.amount.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#FFB800', marginTop: '2px' }}>
                          +{opt.bonus.toFixed(2)}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Sender Details & Transaction ID Input (Manual Verification) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                      Your Sender Mobile Number
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. 03xxxxxxxxx (account sent from)"
                      value={dpPhone}
                      onChange={e => setDpPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: 'rgba(20, 26, 36, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: 700,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#00E65B', display: 'block', marginBottom: '4px' }}>
                      Transaction ID (TID / TRX ID) *
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. 028472918349 (from SMS/App Receipt)"
                      value={dpTid}
                      onChange={e => setDpTid(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: 'rgba(20, 26, 36, 0.95)',
                        border: '1.5px solid rgba(0, 230, 91, 0.5)',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 800,
                        letterSpacing: '0.5px',
                        boxSizing: 'border-box'
                      }}
                    />
                    <span style={{ fontSize: '9.5px', color: '#64748B', marginTop: '3px', display: 'block' }}>
                      Enter the 11-12 digit TID received in your JazzCash/EasyPaisa confirmation SMS.
                    </span>
                  </div>
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
                        <span>🎁</span> <span>Bonus 20.00</span>
                      </div>
                      <span style={{ color: '#E2E8F0', fontWeight: 700 }}>First Deposit ≥ 200</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94A3B8' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🎁</span> <span>Bonus 130.00</span>
                      </div>
                      <span style={{ color: '#E2E8F0', fontWeight: 700 }}>First Deposit ≥ 500</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94A3B8' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🎁</span> <span>Bonus 160.00</span>
                      </div>
                      <span style={{ color: '#E2E8F0', fontWeight: 700 }}>Total deposit ≥ 1,000</span>
                    </div>
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

                {/* Submit Button */}
                <button 
                  onClick={handleDepositSubmit}
                  disabled={dpLoading}
                  className="glass-btn-orange"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '14px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    marginTop: '4px'
                  }}
                >
                  {dpLoading ? 'Submitting Deposit...' : `Submit Rs ${Number(dpAmount || 200).toLocaleString()} Deposit`}
                </button>
              </>
            ) : (
              /* Crypto Tab */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{
                  background: '#141A24',
                  borderRadius: '16px',
                  padding: '16px',
                  border: '1px solid rgba(0, 230, 91, 0.3)'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
                    USDT (TRC20 Network Only)
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '12px' }}>
                    Exchange Rate: 1 USDT = Rs {rates.usd_rate || 280}
                  </div>

                  <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '12px', borderRadius: '10px', wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '12px', color: '#00E65B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{rates.manual_crypto_address || 'TP2B4tFxxxxxxxxxxxxxxxxxxxxTRC20'}</span>
                    <button 
                      onClick={() => copyToClipboard(rates.manual_crypto_address, 'crypto')}
                      style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', flexShrink: 0 }}
                    >
                      {copiedField === 'crypto' ? '✓ Copied' : '📋 Copy'}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    USDT Amount
                  </label>
                  <input 
                    type="number"
                    value={cryptoAmount}
                    onChange={e => setCryptoAmount(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: '#141A24', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '11px', color: '#00E65B', marginTop: '4px', display: 'block', fontWeight: 700 }}>
                    ~ Rs {Math.round(Number(cryptoAmount) * Number(rates.usd_rate || 280)).toLocaleString()} balance
                  </span>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#00E65B', display: 'block', marginBottom: '4px' }}>
                    Transaction Hash (TXID) *
                  </label>
                  <input 
                    type="text"
                    placeholder="Paste TRC20 TXID hash here"
                    value={cryptoTxid}
                    onChange={e => setCryptoTxid(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: '#141A24', border: '1.5px solid rgba(0, 230, 91, 0.5)', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  />
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

                <button 
                  onClick={handleCryptoSubmit}
                  disabled={dpLoading}
                  className="glass-btn-emerald"
                  style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '14px', cursor: 'pointer' }}
                >
                  {dpLoading ? 'Submitting...' : `Submit ${cryptoAmount} USDT Deposit`}
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'withdraw' && (
          <div className="glass-panel" style={{ borderRadius: '18px', padding: '16px' }}>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
              Request Payout / Withdrawal
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '16px' }}>
              Minimum withdrawal: Rs {rates.min_withdraw || 500}. Direct payout to JazzCash, EasyPaisa or Bank in minutes.
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
                    background: 'rgba(20, 26, 36, 0.95)',
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
                  Account Title (Recipient Name)
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Muhammad Ali" 
                  value={witTitle} 
                  onChange={e => setWitTitle(e.target.value)} 
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(20, 26, 36, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
                  Account Mobile / IBAN Number
                </label>
                <input 
                  type="text" 
                  placeholder="03xxxxxxxxx or Bank Account Number" 
                  value={witAccount} 
                  onChange={e => setWitAccount(e.target.value)} 
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(20, 26, 36, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
                  Amount in PKR (Min {rates.min_withdraw || 500})
                </label>
                <input 
                  type="number" 
                  placeholder="e.g. 1000" 
                  value={witAmount} 
                  onChange={e => setWitAmount(e.target.value)} 
                  required
                  min={rates.min_withdraw || 500}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(20, 26, 36, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button 
                type="submit"
                disabled={witLoading}
                className="glass-btn-emerald"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                {witLoading ? 'Submitting Request...' : 'Submit Payout Request'}
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
                        {tx.type === 'deposit' ? '🟢 Deposit' : '🔴 Withdrawal'} ({tx.method || tx.metadata?.channel || 'Manual P2P'})
                      </div>
                      {tx.metadata?.tid && (
                        <div style={{ fontSize: '10px', color: '#00E65B', marginTop: '2px', fontFamily: 'monospace' }}>
                          TID: {tx.metadata.tid}
                        </div>
                      )}
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
                        background: tx.status === 'completed' ? 'rgba(0, 230, 91, 0.15)' : tx.status === 'failed' ? 'rgba(255, 51, 102, 0.15)' : 'rgba(255, 184, 0, 0.15)',
                        color: tx.status === 'completed' ? '#00E65B' : tx.status === 'failed' ? '#FF3366' : '#FFB800'
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

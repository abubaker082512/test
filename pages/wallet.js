import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import AuthModal from '../components/AuthModal'
import BottomNav from '../components/BottomNav'

// Recharge Methods matching Screenshots 1 & 2
const RECHARGE_METHODS = [
  { id: 'qr', name: 'QR', isHot: true },
  { id: 'jazzcash', name: 'JazzCash' },
  { id: 'easypaisa', name: 'Easypaisa' },
  { id: 'usdt', name: 'USDT', badge: '+3%' },
  { id: 'jazzcash_qr', name: 'JAZZCASH_QR' }
]

// Recharge Amounts matching Screenshots 1 & 2
const RECHARGE_AMOUNTS = [100, 300, 1000, 2000, 3000, 5000, 10000]

export default function WalletPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('deposit') // 'deposit' | 'withdraw' | 'history'
  const [refreshing, setRefreshing] = useState(false)
  const [copiedField, setCopiedField] = useState(null)

  // Deposit States matching Screenshots 1 & 2
  const [rechargeMethod, setRechargeMethod] = useState('qr')
  const [rechargeChannel, setRechargeChannel] = useState('qr_code') // 'qr_code' | 'transfer'
  const [amount, setAmount] = useState('100')
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Payment Form States
  const [senderPhone, setSenderPhone] = useState('')
  const [tid, setTid] = useState('')
  const [cryptoTxid, setCryptoTxid] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [depositMsg, setDepositMsg] = useState(null)

  // Withdrawal States
  const [witAmount, setWitAmount] = useState('')
  const [witMethod, setWitMethod] = useState('EasyPaisa')
  const [witAccount, setWitAccount] = useState('')
  const [witTitle, setWitTitle] = useState('')
  const [witMsg, setWitMsg] = useState(null)
  const [witLoading, setWitLoading] = useState(false)

  // Gateway Settings
  const [rates, setRates] = useState({
    pkr_rate: 1.0,
    usd_rate: 280.0,
    min_deposit: 100,
    max_deposit: 20000,
    min_withdraw: 500,
    max_withdraw: 50000,
    manual_jazzcash_title: 'WinX Pro Official',
    manual_jazzcash_no: '03112235935',
    manual_easypaisa_title: 'WinX Pro Official',
    manual_easypaisa_no: '03493530916',
    manual_crypto_network: 'USDT (TRC20)',
    manual_crypto_address: 'TP2B4tF9qK8jZ1sL5vN8mM9eR7wX4yP1aB'
  })

  // Handle Query Parameters
  useEffect(() => {
    if (!router.isReady) return
    const { tab } = router.query
    if (tab === 'withdraw') setActiveTab('withdraw')
    else if (tab === 'history') setActiveTab('history')
    else if (tab === 'crypto') setRechargeMethod('usdt')
  }, [router.isReady, router.query])

  const fetchRates = async () => {
    try {
      const res = await fetch('/api/settings/get')
      const data = await res.json()
      if (data.success) {
        setRates(prev => ({
          ...prev,
          pkr_rate: data.pkr_rate || 1.0,
          usd_rate: data.usd_rate || 280.0,
          min_deposit: data.min_deposit || 100,
          max_deposit: data.max_deposit || 20000,
          min_withdraw: data.min_withdraw || 500,
          max_withdraw: data.max_withdraw || 50000,
          manual_jazzcash_title: data.manual_jazzcash_title || prev.manual_jazzcash_title,
          manual_jazzcash_no: data.manual_jazzcash_no || prev.manual_jazzcash_no,
          manual_easypaisa_title: data.manual_easypaisa_title || prev.manual_easypaisa_title,
          manual_easypaisa_no: data.manual_easypaisa_no || prev.manual_easypaisa_no,
          manual_crypto_address: data.manual_crypto_address || prev.manual_crypto_address
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
        const { data: t } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(25)
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
    const poll = setInterval(fetchData, 5000)
    return () => clearInterval(poll)
  }, [user])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setTimeout(() => setRefreshing(false), 800)
  }

  const copyToClipboard = (text, fieldName) => {
    if (!text) return
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 1800)
    }
  }

  // Calculate Bonus and "You can get" display
  const numAmount = parseFloat(amount) || 0
  let bonusRate = 0
  if (rechargeMethod === 'usdt') {
    bonusRate = 0.03
  } else if (numAmount >= 10000) {
    bonusRate = 0.10
  } else if (numAmount >= 3000) {
    bonusRate = 0.08
  } else if (numAmount >= 1000) {
    bonusRate = 0.05
  }
  const calculatedTotal = numAmount * (1 + bonusRate)

  // Handle Deposit Initiation
  const handleInitiateDeposit = () => {
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }
    const val = parseFloat(amount)
    if (isNaN(val) || val < 100) {
      alert('Minimum deposit amount is Rs 100.')
      return
    }
    setDepositMsg(null)
    setShowPaymentModal(true)
  }

  const handleConfirmDeposit = async (e) => {
    if (e) e.preventDefault()
    if (!user) return

    if (rechargeMethod === 'usdt') {
      if (!cryptoTxid || cryptoTxid.trim().length < 8) {
        setDepositMsg({ type: 'error', text: 'Please enter a valid USDT TRC20 Transaction Hash (TXID).' })
        return
      }
    } else {
      if (!tid || tid.trim().length < 6) {
        setDepositMsg({ type: 'error', text: 'Please enter the 11-12 digit Transaction ID (TID) from your payment receipt.' })
        return
      }
    }

    setIsSubmitting(true)
    setDepositMsg(null)

    const activeUserId = user.id || user.uid || 'guest'
    const activeEmail = user.email || `${activeUserId}@winxpro.com`
    const isCrypto = rechargeMethod === 'usdt'

    try {
      const payload = isCrypto ? {
        user_id: activeUserId,
        email: activeEmail,
        amount: numAmount,
        currency: 'USDT',
        method: 'USDT (TRC20)',
        transaction_id: cryptoTxid.trim(),
        notes: `USDT Deposit +3% Bonus | TXID: ${cryptoTxid.trim()}`
      } : {
        user_id: activeUserId,
        email: activeEmail,
        amount: numAmount,
        currency: 'PKR',
        method: rechargeMethod.toUpperCase(),
        sender_phone: senderPhone || user.phone || '03xxxxxxxxx',
        transaction_id: tid.trim(),
        notes: `${rechargeMethod.toUpperCase()} | Channel: ${rechargeChannel} | TID: ${tid.trim()}`
      }

      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()

      if (data.success) {
        setDepositMsg({
          type: 'success',
          text: `✅ Deposit of Rs ${numAmount.toLocaleString()} submitted! Verification is instant.`
        })
        setTid('')
        setCryptoTxid('')
        fetchData()
        window.dispatchEvent(new Event('wallet-updated'))
        setTimeout(() => {
          setShowPaymentModal(false)
        }, 2200)
      } else {
        setDepositMsg({ type: 'error', text: data.error || 'Failed to submit deposit. Please check your TID.' })
      }
    } catch (err) {
      setDepositMsg({ type: 'error', text: err.message || 'Network error occurred.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Withdrawal Request
  const handleWithdraw = async (e) => {
    e.preventDefault()
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }

    const currentBal = wallet ? parseFloat(wallet.balance) : 0
    const val = parseFloat(witAmount)

    if (isNaN(val) || val < (rates.min_withdraw || 500)) {
      setWitMsg({ type: 'error', text: `Minimum withdrawal is Rs ${(rates.min_withdraw || 500).toLocaleString()}` })
      return
    }
    if (val > currentBal) {
      setWitMsg({ type: 'error', text: 'Insufficient wallet balance.' })
      return
    }
    if (!witAccount || witAccount.trim().length < 8) {
      setWitMsg({ type: 'error', text: 'Please enter a valid mobile or account number.' })
      return
    }

    setWitLoading(true)
    setWitMsg(null)

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id || user.uid,
          amount: val,
          notes: `Withdrawal to ${witMethod} | Title: ${witTitle || 'N/A'} | Number: ${witAccount}`
        })
      })
      const data = await res.json()
      if (data.success) {
        setWitMsg({ type: 'success', text: `✅ Payout request of Rs ${val.toLocaleString()} submitted successfully!` })
        setWitAmount('')
        setWitAccount('')
        setWitTitle('')
        fetchData()
        window.dispatchEvent(new Event('wallet-updated'))
      } else {
        setWitMsg({ type: 'error', text: data.error || 'Withdrawal failed.' })
      }
    } catch (err) {
      setWitMsg({ type: 'error', text: err.message })
    } finally {
      setWitLoading(false)
    }
  }

  // Active Admin Details
  const activeAdminNo = rechargeMethod === 'easypaisa'
    ? rates.manual_easypaisa_no
    : rates.manual_jazzcash_no
  const activeAdminTitle = rechargeMethod === 'easypaisa'
    ? rates.manual_easypaisa_title
    : rates.manual_jazzcash_title

  // Dynamic QR Image URL for payment
  const qrDataText = encodeURIComponent(`pkr:${activeAdminNo}?amount=${numAmount}&title=${activeAdminTitle}`)
  const dynamicQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${qrDataText}&color=081a0b`

  return (
    <div className="app bbr-deposit-page">
      {/* 1. Header (matching Screenshots 1 & 2: ← Deposit 📋) */}
      <div style={{
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#0d1510',
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
          onClick={() => activeTab !== 'deposit' ? setActiveTab('deposit') : router.back()}
          style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          ←
        </button>
        <div style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.2px' }}>
          {activeTab === 'withdraw' ? 'Withdrawal' : activeTab === 'history' ? 'Deposit Records' : 'Deposit'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setActiveTab(activeTab === 'history' ? 'deposit' : 'history')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'history' ? '#6dff38' : '#ffd54f',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Deposit Records"
          >
            📋
          </button>
        </div>
      </div>

      <div style={{
        padding: '14px 16px 90px',
        maxWidth: '480px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxSizing: 'border-box'
      }}>

        {/* 2. Top Balance Card (Screenshots 1 & 2) */}
        <div style={{
          background: 'linear-gradient(135deg, #16261d 0%, #101c15 100%)',
          border: '1px solid rgba(109, 255, 56, 0.16)',
          borderRadius: '16px',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Wallet with Coins Icon */}
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ff4081 0%, #ff80ab 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 12px rgba(255, 64, 129, 0.3)'
            }}>
              👛
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#9bb0a2' }}>Balance</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffd54f', letterSpacing: '0.3px', marginTop: '2px' }}>
                Rs {wallet ? parseFloat(wallet.balance).toFixed(2) : '0.00'}
              </div>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6dff38',
              fontSize: '15px',
              cursor: 'pointer'
            }}
            className={refreshing ? 'coin-spin' : ''}
            title="Refresh Balance"
          >
            🔄
          </button>
        </div>

        {/* Tab Switcher if on Withdraw / History */}
        {activeTab !== 'deposit' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('deposit')}
              style={{
                flex: 1,
                padding: '9px',
                borderRadius: '10px',
                border: '1px solid #6dff38',
                background: 'rgba(109, 255, 56, 0.15)',
                color: '#6dff38',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              ← Back to Deposit
            </button>
          </div>
        )}

        {/* MAIN DEPOSIT SCREEN (Screenshots 1 & 2) */}
        {activeTab === 'deposit' && (
          <>
            {/* 3. Recharge Method Section */}
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#ffffff', marginBottom: '10px' }}>
                Recharge Method:
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px'
              }}>
                {RECHARGE_METHODS.map(m => {
                  const isActive = rechargeMethod === m.id
                  return (
                    <div
                      key={m.id}
                      onClick={() => setRechargeMethod(m.id)}
                      style={{
                        position: 'relative',
                        background: isActive ? '#70e434' : '#1c261f',
                        border: isActive ? '1.5px solid #85f34b' : '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '12px',
                        padding: '12px 6px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        boxShadow: isActive ? '0 0 16px rgba(112, 228, 52, 0.45)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Top-left Badge (e.g. +3% on USDT) */}
                      {m.badge && (
                        <span style={{
                          position: 'absolute',
                          top: '-6px',
                          left: '6px',
                          background: '#70e434',
                          color: '#081a0b',
                          fontSize: '9px',
                          fontWeight: 900,
                          padding: '1px 5px',
                          borderRadius: '999px',
                          border: '1px solid #081a0b',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
                        }}>
                          {m.badge}
                        </span>
                      )}

                      {/* Icon */}
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px'
                      }}>
                        {m.id === 'qr' && (
                          <div style={{
                            width: '28px',
                            height: '28px',
                            background: '#ffffff',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px'
                          }}>
                            🏁
                          </div>
                        )}
                        {m.id === 'jazzcash' && (
                          <div style={{
                            width: '28px',
                            height: '28px',
                            background: '#d61a20',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffeb3b',
                            fontSize: '15px',
                            fontWeight: 900
                          }}>
                            🔥
                          </div>
                        )}
                        {m.id === 'easypaisa' && (
                          <div style={{
                            width: '28px',
                            height: '28px',
                            background: '#00a852',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontSize: '16px',
                            fontWeight: 900
                          }}>
                            e
                          </div>
                        )}
                        {m.id === 'usdt' && (
                          <div style={{
                            width: '28px',
                            height: '28px',
                            background: '#26a17b',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontSize: '16px',
                            fontWeight: 900
                          }}>
                            ₮
                          </div>
                        )}
                        {m.id === 'jazzcash_qr' && (
                          <div style={{
                            width: '28px',
                            height: '28px',
                            background: '#d61a20',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontSize: '14px',
                            position: 'relative'
                          }}>
                            🔥
                            <span style={{ position: 'absolute', bottom: -2, right: -2, fontSize: '9px' }}>📱</span>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 900,
                        color: isActive ? '#081a0b' : '#ffffff',
                        textAlign: 'center',
                        lineHeight: 1.1
                      }}>
                        {m.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 4. Recharge Channel Section (Screenshots 1 & 2) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <span style={{ fontSize: '16px' }}>🏁</span>
                <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#ffffff' }}>Recharge Channel:</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setRechargeChannel('qr_code')}
                  style={{
                    background: rechargeChannel === 'qr_code' ? '#70e434' : '#1c261f',
                    border: rechargeChannel === 'qr_code' ? '1.5px solid #85f34b' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '10px 8px',
                    cursor: 'pointer',
                    boxShadow: rechargeChannel === 'qr_code' ? '0 0 14px rgba(112, 228, 52, 0.35)' : 'none'
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 900, color: rechargeChannel === 'qr_code' ? '#081a0b' : '#ffffff', lineHeight: 1.3 }}>
                    {rechargeMethod === 'usdt' ? 'USDT TRC20' : 'JazzCash / Easypaisa'}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: rechargeChannel === 'qr_code' ? '#081a0b' : '#94a3b8' }}>
                    {rechargeMethod === 'usdt' ? '(Instant 3% Bonus)' : 'QR code'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRechargeChannel('transfer')}
                  style={{
                    background: rechargeChannel === 'transfer' ? '#70e434' : '#1c261f',
                    border: rechargeChannel === 'transfer' ? '1.5px solid #85f34b' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '10px 8px',
                    cursor: 'pointer',
                    boxShadow: rechargeChannel === 'transfer' ? '0 0 14px rgba(112, 228, 52, 0.35)' : 'none'
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 900, color: rechargeChannel === 'transfer' ? '#081a0b' : '#ffffff', lineHeight: 1.3 }}>
                    {rechargeMethod === 'usdt' ? 'USDT BEP20' : 'QR Code'}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: rechargeChannel === 'transfer' ? '#081a0b' : '#94a3b8' }}>
                    {rechargeMethod === 'usdt' ? '(Binance Smart Chain)' : 'Use transfer'}
                  </div>
                </button>
              </div>
            </div>

            {/* 5. Recharge Amount Section (Screenshots 1 & 2) */}
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#ffffff', marginBottom: '10px' }}>
                Recharge Amount:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {RECHARGE_AMOUNTS.map(amt => {
                  const isSelected = String(amt) === String(amount)
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(String(amt))}
                      style={{
                        background: isSelected ? 'rgba(112, 228, 52, 0.15)' : '#1c261f',
                        border: isSelected ? '1.5px solid #70e434' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '12px 6px',
                        color: isSelected ? '#70e434' : '#ffffff',
                        fontSize: '14px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 0 12px rgba(112, 228, 52, 0.25)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {amt.toLocaleString()}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 6. "You can get" Calculation Capsule (Screenshots 1 & 2) */}
            <div style={{
              background: '#222d26',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#c4d7ca' }}>
                You can get
              </span>
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#ffd54f', letterSpacing: '0.3px' }}>
                Rs {calculatedTotal.toFixed(2)}
              </span>
            </div>

            {/* 7. Amount Input Field with Clear Button (Screenshots 1 & 2) */}
            <div style={{
              background: '#121c16',
              border: '1.5px solid rgba(109, 255, 56, 0.25)',
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#6dff38' }}>Rs</span>
                <input
                  type="number"
                  placeholder="Rs 100 ~ 20000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 800,
                    width: '100%'
                  }}
                  min="100"
                  max="20000"
                />
              </div>
              {amount && (
                <button
                  type="button"
                  onClick={() => setAmount('')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* 8. Full-Width Vibrant Green Deposit Button (Screenshots 1 & 2) */}
            <button
              type="button"
              onClick={handleInitiateDeposit}
              style={{
                background: 'linear-gradient(90deg, #5ec831 0%, #43a31e 100%)',
                border: 'none',
                borderRadius: '999px',
                padding: '15px 20px',
                color: '#081a0b',
                fontSize: '16.5px',
                fontWeight: 900,
                letterSpacing: '0.4px',
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(94, 200, 49, 0.45)',
                transition: 'transform 0.15s, opacity 0.15s'
              }}
            >
              Deposit
            </button>
          </>
        )}

        {/* WITHDRAWAL TAB */}
        {activeTab === 'withdraw' && (
          <div style={{
            background: '#152219',
            border: '1px solid rgba(109, 255, 56, 0.2)',
            borderRadius: '16px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
              Instant Withdrawal Request
            </div>
            <div style={{ fontSize: '11px', color: '#9bb0a2', marginBottom: '14px' }}>
              Minimum withdrawal: Rs {rates.min_withdraw || 500}. Direct payout in minutes.
            </div>

            {witMsg && (
              <div style={{
                padding: '10px 12px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                marginBottom: '12px',
                background: witMsg.type === 'error' ? 'rgba(255, 51, 102, 0.15)' : 'rgba(109, 255, 56, 0.15)',
                border: `1px solid ${witMsg.type === 'error' ? '#ff3366' : '#6dff38'}`,
                color: witMsg.type === 'error' ? '#ff3366' : '#6dff38'
              }}>
                {witMsg.text}
              </div>
            )}

            <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#9bb0a2', display: 'block', marginBottom: '4px' }}>
                  Payout Method
                </label>
                <select
                  value={witMethod}
                  onChange={e => setWitMethod(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    borderRadius: '10px',
                    background: '#101a14',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 800
                  }}
                >
                  <option value="EasyPaisa">EasyPaisa</option>
                  <option value="JazzCash">JazzCash</option>
                  <option value="Bank Transfer">Bank Transfer (1LINK)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#9bb0a2', display: 'block', marginBottom: '4px' }}>
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
                    padding: '11px 12px',
                    borderRadius: '10px',
                    background: '#101a14',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#9bb0a2', display: 'block', marginBottom: '4px' }}>
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
                    padding: '11px 12px',
                    borderRadius: '10px',
                    background: '#101a14',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#9bb0a2', display: 'block', marginBottom: '4px' }}>
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
                    padding: '11px 12px',
                    borderRadius: '10px',
                    background: '#101a14',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={witLoading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '999px',
                  background: 'linear-gradient(90deg, #5ec831 0%, #43a31e 100%)',
                  border: 'none',
                  color: '#081a0b',
                  fontSize: '15px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  marginTop: '6px'
                }}
              >
                {witLoading ? 'Submitting Request...' : 'Submit Payout Request'}
              </button>
            </form>
          </div>
        )}

        {/* DEPOSIT RECORDS / HISTORY TAB */}
        {activeTab === 'history' && (
          <div style={{
            background: '#152219',
            border: '1px solid rgba(109, 255, 56, 0.2)',
            borderRadius: '16px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', marginBottom: '14px' }}>
              Transaction History
            </div>

            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#7a8f82', fontSize: '12px' }}>
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
                      padding: '12px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                        {tx.type === 'deposit' ? '🟢 Deposit' : '🔴 Withdrawal'} ({tx.method || tx.metadata?.channel || 'QR / P2P'})
                      </div>
                      {tx.metadata?.tid && (
                        <div style={{ fontSize: '11px', color: '#6dff38', marginTop: '3px', fontFamily: 'monospace' }}>
                          TID: {tx.metadata.tid}
                        </div>
                      )}
                      <div style={{ fontSize: '10px', color: '#7a8f82', marginTop: '2px' }}>
                        {new Date(tx.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '13.5px',
                        fontWeight: 900,
                        color: tx.type === 'deposit' ? '#6dff38' : '#ff3366'
                      }}>
                        {tx.type === 'deposit' ? '+' : '-'}Rs {parseFloat(tx.amount).toFixed(2)}
                      </div>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 900,
                        padding: '2px 7px',
                        borderRadius: '6px',
                        background: tx.status === 'completed' ? 'rgba(109, 255, 56, 0.15)' : 'rgba(255, 184, 0, 0.15)',
                        color: tx.status === 'completed' ? '#6dff38' : '#ffd54f'
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

      {/* PAYMENT MODAL (Step 1 to 4 QR & TID Submission matching Screenshot 1) */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#121e16',
            border: '1.5px solid #6dff38',
            borderRadius: '20px',
            maxWidth: '440px',
            width: '100%',
            padding: '20px 18px',
            boxShadow: '0 0 30px rgba(109, 255, 56, 0.35)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff' }}>
                {rechargeMethod === 'usdt' ? 'USDT TRC20 Deposit' : 'QR Payment Confirmation'}
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#ffffff',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontWeight: 900
                }}
              >
                ✕
              </button>
            </div>

            {/* 4-Step QR Tutorial Graphic or Details (matching Screenshot 1) */}
            {rechargeMethod !== 'usdt' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* QR Code Container */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <img
                    src={dynamicQrCodeUrl}
                    alt="Payment QR"
                    style={{ width: '180px', height: '180px', borderRadius: '10px' }}
                  />
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#081a0b', textAlign: 'center' }}>
                    Scan &amp; Pay: Rs {numAmount.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#55665b' }}>
                    Receiver: {activeAdminTitle} ({activeAdminNo})
                  </div>
                </div>

                {/* Account Details with Copy Buttons */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#9bb0a2' }}>Account Number:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 900, color: '#6dff38' }}>{activeAdminNo}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(activeAdminNo, 'no')}
                        style={{
                          background: '#6dff38',
                          border: 'none',
                          color: '#081a0b',
                          fontSize: '10px',
                          fontWeight: 900,
                          borderRadius: '6px',
                          padding: '2px 8px',
                          cursor: 'pointer'
                        }}
                      >
                        {copiedField === 'no' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#9bb0a2' }}>Account Title:</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>{activeAdminTitle}</span>
                  </div>
                </div>

                {/* Form Inputs: Sender Mobile & TID */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#9bb0a2', display: 'block', marginBottom: '4px' }}>
                      Your Sender Mobile Number
                    </label>
                    <input
                      type="text"
                      placeholder="03xxxxxxxxx (account sent from)"
                      value={senderPhone}
                      onChange={e => setSenderPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: '#101a14',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#6dff38', display: 'block', marginBottom: '4px' }}>
                      Transaction ID (TID / TRX ID) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 028472918349 (from SMS receipt)"
                      value={tid}
                      onChange={e => setTid(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: '#101a14',
                        border: '1.5px solid #6dff38',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: 900,
                        letterSpacing: '0.5px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* USDT Flow */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.45)',
                  padding: '12px',
                  borderRadius: '14px',
                  border: '1px solid rgba(38, 161, 123, 0.4)'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#6dff38', marginBottom: '6px' }}>
                    USDT (TRC20 Network) Address
                  </div>
                  <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '12.5px', color: '#ffffff', marginBottom: '8px' }}>
                    {rates.manual_crypto_address}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(rates.manual_crypto_address, 'usdt')}
                    style={{
                      background: '#26a17b',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 900,
                      cursor: 'pointer'
                    }}
                  >
                    {copiedField === 'usdt' ? '✓ Address Copied' : '📋 Copy TRC20 Address'}
                  </button>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#6dff38', display: 'block', marginBottom: '4px' }}>
                    Transaction Hash (TXID) *
                  </label>
                  <input
                    type="text"
                    placeholder="Paste TRC20 TXID hash here"
                    value={cryptoTxid}
                    onChange={e => setCryptoTxid(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: '#101a14',
                      border: '1.5px solid #6dff38',
                      color: '#ffffff',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            )}

            {depositMsg && (
              <div style={{
                marginTop: '12px',
                padding: '10px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 800,
                background: depositMsg.type === 'error' ? 'rgba(255, 51, 102, 0.15)' : 'rgba(109, 255, 56, 0.15)',
                border: `1px solid ${depositMsg.type === 'error' ? '#ff3366' : '#6dff38'}`,
                color: depositMsg.type === 'error' ? '#ff3366' : '#6dff38'
              }}>
                {depositMsg.text}
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirmDeposit}
              disabled={isSubmitting}
              style={{
                width: '100%',
                marginTop: '14px',
                padding: '14px',
                borderRadius: '999px',
                background: 'linear-gradient(90deg, #5ec831 0%, #43a31e 100%)',
                border: 'none',
                color: '#081a0b',
                fontSize: '15px',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(94, 200, 49, 0.4)'
              }}
            >
              {isSubmitting ? 'Submitting Payment...' : `Confirm & Submit Deposit`}
            </button>
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <BottomNav />
    </div>
  )
}

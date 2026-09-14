import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import AuthModal from '../components/AuthModal'

export default function WalletPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Sub-tabs for Deposit
  const [depositMode, setDepositMode] = useState('directpay') // 'directpay' | 'manual'

  // Exchange Rates State
  const [rates, setRates] = useState({ pkr_rate: 1.0, usd_rate: 280.0, directpay_enabled: true })
  const [ratesLoading, setRatesLoading] = useState(true)

  // DirectPay Auto Deposit form
  const [dpAmount, setDpAmount] = useState('')
  const [dpPhone, setDpPhone] = useState('')
  const [dpName, setDpName] = useState('')
  const [dpLoading, setDpLoading] = useState(false)
  const [dpMsg, setDpMsg] = useState(null)

  // Manual Deposit form
  const [depAmount, setDepAmount] = useState('')
  const [depCurrency, setDepCurrency] = useState('pkr') // 'pkr' | 'usd'
  const [depMethod, setDepMethod] = useState('Mobile Money A (Easypaisa)')
  const [depTxId, setDepTxId] = useState('')
  const [depMsg, setDepMsg] = useState(null)

  // Withdraw form
  const [witAmount, setWitAmount] = useState('') // In-game Pi amount
  const [witCurrency, setWitCurrency] = useState('pkr') // 'pkr' | 'usd'
  const [witMethod, setWitMethod] = useState('Easypaisa')
  const [witAccount, setWitAccount] = useState('')
  const [witMsg, setWitMsg] = useState(null)

  const fetchRates = async () => {
    try {
      const res = await fetch('/api/settings/get')
      const data = await res.json()
      if (data.success) {
        setRates({
          pkr_rate: data.pkr_rate || 1.0,
          usd_rate: data.usd_rate || 280.0,
          directpay_enabled: data.directpay_enabled !== false
        })
      }
    } catch (e) {
      console.error('Failed to load exchange rates', e)
    } finally {
      setRatesLoading(false)
    }
  }

  const fetchData = async () => {
    if (!user) return
    const { data: w } = await supabase.from('wallets').select('*').eq('user_id', user.id).single()
    setWallet(w)
    const { data: t } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
    setTransactions(t || [])
  }

  useEffect(() => {
    fetchRates()
    fetchData()
  }, [user])

  // Handle return redirect from DirectPay
  useEffect(() => {
    if (!router.isReady) return

    const { directpay_status, txn_id, amount } = router.query

    if (directpay_status === 'success' && txn_id) {
      // Auto verify and credit
      fetch('/api/payments/directpay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txn_id, user_id: user?.id })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setDpMsg({ type: 'success', text: data.message || `Payment verified! Credited Pi ${amount || ''} to your balance.` })
          } else {
            setDpMsg({ type: 'success', text: `Payment received! Processing transaction ID: ${txn_id}` })
          }
          fetchData()
          window.dispatchEvent(new Event('wallet-updated'))
        })
        .catch(() => {
          setDpMsg({ type: 'success', text: `Payment completed! Transaction ${txn_id} is pending verification.` })
          fetchData()
        })
    } else if (directpay_status === 'failed') {
      setDpMsg({ type: 'error', text: 'DirectPay transaction was cancelled or failed. Please try again.' })
    }
  }, [router.isReady, router.query, user])

  // DirectPay Auto Pay Flow
  const handleDirectPaySubmit = async (e) => {
    e.preventDefault()
    setDpMsg(null)
    setDpLoading(true)

    try {
      const res = await fetch('/api/payments/directpay/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          amountInPKR: Number(dpAmount),
          payer_name: dpName || user.email?.split('@')[0] || 'Player',
          email: user.email || 'player@betpk.com',
          msisdn: dpPhone,
          currency: 'PKR'
        })
      })

      const data = await res.json()

      if (data.success && data.paymentUrl) {
        // Redirect directly to DirectPay PWA payment portal
        window.location.href = data.paymentUrl
      } else {
        setDpMsg({ type: 'error', text: data.error || 'Failed to initiate DirectPay payment.' })
        setDpLoading(false)
      }
    } catch (err) {
      setDpMsg({ type: 'error', text: err.message || 'Connection error with payment gateway.' })
      setDpLoading(false)
    }
  }

  const handleDeposit = async (e) => {
    e.preventDefault()
    setDepMsg(null)

    const rawAmount = Number(depAmount)
    const rate = depCurrency === 'pkr' ? rates.pkr_rate : rates.usd_rate
    const inGameAmount = parseFloat((rawAmount * rate).toFixed(2))

    if (inGameAmount < 10) {
      return setDepMsg({ type: 'error', text: `Minimum deposit value must be at least Pi 10.00` })
    }

    const notesStr = `Deposit of ${depCurrency === 'pkr' ? 'Fiat' : '$'} ${rawAmount} ${depCurrency.toUpperCase()} via ${depMethod}. Rate: 1 ${depCurrency.toUpperCase()} = ${rate} Pi.`

    const res = await fetch('/api/wallet/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        amount: inGameAmount,
        method: `${depMethod} (${depCurrency.toUpperCase()})`,
        tx_id: depTxId,
        notes: notesStr
      })
    })
    const data = await res.json()
    setDepMsg({ type: data.success ? 'success' : 'error', text: data.message || data.error })
    if (data.success) {
      setDepAmount('')
      setDepTxId('')
      fetchData()
      window.dispatchEvent(new Event('wallet-updated'))
    }
  }

  const handleWithdraw = async (e) => {
    e.preventDefault()
    setWitMsg(null)

    const rawInGameAmount = Number(witAmount)

    if (rawInGameAmount < 500) {
      return setWitMsg({ type: 'error', text: 'Minimum withdrawal is Pi 500' })
    }

    if (!wallet || wallet.balance < rawInGameAmount) {
      return setWitMsg({ type: 'error', text: 'Insufficient balance' })
    }

    const rate = witCurrency === 'pkr' ? rates.pkr_rate : rates.usd_rate
    const payoutAmount = parseFloat((rawInGameAmount / rate).toFixed(2))
    const currencyLabel = witCurrency === 'pkr' ? 'Fiat' : 'USD'
    const symbolLabel = witCurrency === 'pkr' ? 'Pi' : '$'

    const notesStr = `Withdrawal to ${witMethod} account ${witAccount}. Net Payout: ${symbolLabel} ${payoutAmount} ${currencyLabel} (Rate: 1 ${currencyLabel} = ${rate} Pi).`

    const res = await fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        amount: rawInGameAmount,
        method: `${witMethod} (${currencyLabel})`,
        account_number: witAccount,
        notes: notesStr
      })
    })
    const data = await res.json()
    setWitMsg({ type: data.success ? 'success' : 'error', text: data.message || data.error })
    if (data.success) {
      setWitAmount('')
      setWitAccount('')
      fetchData()
      window.dispatchEvent(new Event('wallet-updated'))
    }
  }

  if (loading) return <div style={{ color: '#fff', padding: '40px', textAlign: 'center' }}>Loading...</div>

  if (!user) return (
    <div style={{ width: '100vw', height: '100vh', background: 'var(--bg)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '64px' }}>🔒</div>
      <h2>Login Required</h2>
      <button className="btn primary" onClick={() => setIsAuthModalOpen(true)}>Log In / Sign Up</button>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  )

  const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: '#fff', boxSizing: 'border-box', marginBottom: '12px', fontSize: '14px' }
  const cardStyle = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }
  const msgStyle = (type) => ({ padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px', background: type === 'error' ? '#ff000022' : '#00ff8822', border: `1px solid ${type === 'error' ? '#ff4444' : '#00e676'}`, color: type === 'error' ? '#ff6666' : '#00ff88' })

  // Calculated Preview Computations
  const computedDpCreditedVal = dpAmount ? (Number(dpAmount) * rates.pkr_rate).toFixed(2) : '0.00'
  const computedCreditedVal = depAmount ? (Number(depAmount) * (depCurrency === 'pkr' ? rates.pkr_rate : rates.usd_rate)).toFixed(2) : '0.00'
  const computedWithdrawVal = witAmount ? (Number(witAmount) / (witCurrency === 'pkr' ? rates.pkr_rate : rates.usd_rate)).toFixed(2) : '0.00'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: '#fff', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'var(--accent)', fontWeight: 'bold', fontSize: '18px' }}>← Back to Lobby</Link>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>💰 Wallet & Payments</h1>
        <div />
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Balance Card */}
        <div style={{ ...cardStyle, background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--card) 100%)', border: '2px solid var(--accent)', textAlign: 'center', boxShadow: '0 8px 32px rgba(255, 215, 0, 0.15)' }}>
          <div style={{ fontSize: '13px', color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>AVAILABLE IN-GAME BALANCE</div>
          <div style={{ fontSize: '52px', fontWeight: 900, color: 'var(--accent)', textShadow: '0 0 20px rgba(255, 215, 0, 0.4)' }}>
            Pi {wallet ? parseFloat(wallet.balance).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </div>
        </div>

        {/* Deposit Section */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, color: 'var(--accent)', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💳 Deposit Funds
            </h2>

            {/* Sub-tab toggle */}
            <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border)' }}>
              <button
                onClick={() => setDepositMode('directpay')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: depositMode === 'directpay' ? 'var(--accent)' : 'transparent',
                  color: depositMode === 'directpay' ? '#000' : '#fff',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                ⚡ Auto Gateway
              </button>
              <button
                onClick={() => setDepositMode('manual')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: depositMode === 'manual' ? 'var(--accent)' : 'transparent',
                  color: depositMode === 'manual' ? '#000' : '#fff',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                📝 Manual TxID
              </button>
            </div>
          </div>

          {/* Mode A: DirectPay (Easypaisa, JazzCash, Card Auto Gateway) */}
          {depositMode === 'directpay' && (
            <div>
              <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px' }}>⚡</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>DirectPay Instant Checkout</span>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>
                  Instant, automatic deposit via <strong>Easypaisa</strong>, <strong>JazzCash</strong>, and <strong>Debit/Credit Cards</strong>. You will be redirected to the secure DirectPay payment page.
                </p>
                <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--accent)' }}>
                  Exchange Rate: <strong>1 Fiat = {rates.pkr_rate} Pi</strong> (Instant Credit)
                </div>
              </div>

              {dpMsg && <div style={msgStyle(dpMsg.type)}>{dpMsg.text}</div>}

              <form onSubmit={handleDirectPaySubmit}>
                <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                  Deposit Amount in Fiat (PKR / Local):
                </label>
                <input 
                  type="number" 
                  placeholder="e.g. 500 (Min 10, Max 50,000)" 
                  value={dpAmount} 
                  onChange={e => setDpAmount(e.target.value)} 
                  style={inputStyle} 
                  required 
                  min={10}
                  max={50000}
                />

                <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                  Mobile Number (Easypaisa / JazzCash Account):
                </label>
                <input 
                  type="text" 
                  placeholder="03xxxxxxxxx (11 digits starting with 03)" 
                  value={dpPhone} 
                  onChange={e => setDpPhone(e.target.value)} 
                  pattern="^03\d{9}$"
                  title="Must be 11 digits starting with 03 (e.g. 03001234567)"
                  style={inputStyle} 
                  required 
                />

                <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                  Payer Full Name:
                </label>
                <input 
                  type="text" 
                  placeholder="Your Full Name on Account" 
                  value={dpName} 
                  onChange={e => setDpName(e.target.value)} 
                  style={inputStyle} 
                  required 
                />

                {dpAmount && (
                  <div style={{ background: 'rgba(0, 230, 118, 0.1)', border: '1px solid rgba(0, 230, 118, 0.3)', borderRadius: '8px', padding: '12px', color: '#00e676', fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>
                    🎉 You will receive: Pi {computedDpCreditedVal} in-game balance
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn primary" 
                  disabled={dpLoading}
                  style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {dpLoading ? 'Connecting to DirectPay...' : '🚀 Pay Now via DirectPay (Instant)'}
                </button>
              </form>
            </div>
          )}

          {/* Mode B: Manual Transfer with TxID Verification */}
          {depositMode === 'manual' && (
            <div>
              <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '12px', color: 'var(--muted)', lineHeight: '1.6' }}>
                Manual transfer to official accounts:<br />
                <strong style={{ color: '#fff' }}>🟢 Easypaisa:</strong> 0300-0000000 (BetPK Official)<br />
                <strong style={{ color: '#fff' }}>🔴 JazzCash:</strong> 0300-0000000 (BetPK Official)<br />
                <strong style={{ color: '#fff' }}>🌐 Binance / USDT:</strong> usd-official-wallet-address<br />
                <div style={{ borderTop: '1px solid var(--border)', marginTop: '8px', paddingTop: '8px', color: 'var(--accent)' }}>
                  Rates: <strong>1 Fiat = {rates.pkr_rate} Pi</strong> | <strong>1 USD = {rates.usd_rate} Pi</strong>
                </div>
              </div>

              {depMsg && <div style={msgStyle(depMsg.type)}>{depMsg.text}</div>}

              <form onSubmit={handleDeposit}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <select value={depCurrency} onChange={e => setDepCurrency(e.target.value)} style={{ ...inputStyle, marginBottom: 0, flex: 1 }}>
                    <option value="pkr">Fiat (PKR)</option>
                    <option value="usd">USD ($)</option>
                  </select>
                  <select value={depMethod} onChange={e => { setDepMethod(e.target.value); if (e.target.value === 'binance') setDepCurrency('usd'); else setDepCurrency('pkr') }} style={{ ...inputStyle, marginBottom: 0, flex: 2 }}>
                    <option value="Easypaisa">Easypaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="Debit / Credit Card">Debit / Credit Card</option>
                    <option value="binance">Binance Pay (Crypto)</option>
                  </select>
                </div>
                
                <input 
                  type="number" 
                  placeholder={`Deposit Amount in ${depCurrency.toUpperCase()}`} 
                  value={depAmount} 
                  onChange={e => setDepAmount(e.target.value)} 
                  style={inputStyle} 
                  required 
                  min={1} 
                />

                {depAmount && (
                  <div style={{ background: 'rgba(0, 230, 118, 0.1)', border: '1px solid rgba(0, 230, 118, 0.3)', borderRadius: '8px', padding: '12px', color: '#00e676', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', textAlign: 'center' }}>
                    🎉 You will receive: Pi {computedCreditedVal} in-game currency
                  </div>
                )}

                <input type="text" placeholder="Transaction ID (from Bank/Wallet SMS/Receipt)" value={depTxId} onChange={e => setDepTxId(e.target.value)} style={inputStyle} required />
                <button type="submit" className="btn primary" style={{ width: '100%', padding: '14px', fontSize: '14px' }}>Submit Manual Deposit Request</button>
              </form>
            </div>
          )}
        </div>

        {/* Withdraw Section */}
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: '#ffaa00', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏧 Request Payout / Withdrawal
          </h2>
          <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '12px', color: 'var(--muted)', lineHeight: '1.5' }}>
            Minimum withdrawal: <strong>500 Pi</strong>. Fast 24/7 processing to Easypaisa, JazzCash, Bank, or USDT.
          </div>

          {witMsg && <div style={msgStyle(witMsg.type)}>{witMsg.text}</div>}

          <form onSubmit={handleWithdraw}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <select value={witCurrency} onChange={e => setWitCurrency(e.target.value)} style={{ ...inputStyle, marginBottom: 0, flex: 1 }}>
                <option value="pkr">Fiat (PKR)</option>
                <option value="usd">USD ($)</option>
              </select>
              <select value={witMethod} onChange={e => setWitMethod(e.target.value)} style={{ ...inputStyle, marginBottom: 0, flex: 2 }}>
                <option value="Easypaisa">Easypaisa</option>
                <option value="JazzCash">JazzCash</option>
                <option value="Bank Transfer">Bank Transfer (1LINK)</option>
                <option value="Debit / Credit Card">Debit / Credit Card</option>
                <option value="binance">Binance Pay (Crypto)</option>
              </select>
            </div>
            
            <input type="text" placeholder="Your Payout Account Number / Mobile / Address" value={witAccount} onChange={e => setWitAccount(e.target.value)} style={inputStyle} required />
            
            <input 
              type="number" 
              placeholder="Withdrawal Amount (in Pi, min 500)" 
              value={witAmount} 
              onChange={e => setWitAmount(e.target.value)} 
              style={inputStyle} 
              required 
              min={500} 
            />

            {witAmount && (
              <div style={{ background: 'rgba(255, 170, 0, 0.1)', border: '1px solid rgba(255, 170, 0, 0.3)', borderRadius: '8px', padding: '12px', color: '#ffaa00', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', textAlign: 'center' }}>
                💰 Net Payout: {witCurrency === 'pkr' ? 'Fiat ' : '$'} {computedWithdrawVal} {witCurrency.toUpperCase()}
              </div>
            )}

            <button type="submit" className="btn" style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #ffaa00 0%, #cc7700 100%)', color: '#000', fontWeight: 'bold', fontSize: '14px' }}>
              Submit Payout Request
            </button>
          </form>
        </div>

        {/* Transaction History */}
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, fontSize: '18px', color: 'var(--accent)' }}>📋 Transaction History</h2>
          {transactions.length === 0 && <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '24px' }}>No transactions recorded yet.</div>}
          {transactions.map(tx => (
            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 'bold', textTransform: 'capitalize', fontSize: '14px' }}>
                  {tx.type === 'deposit' ? '🟢 Deposit' : '🔴 Withdrawal'} ({tx.method || 'System'})
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                  {new Date(tx.created_at).toLocaleString()} {tx.tx_id && `• TxID: ${tx.tx_id}`}
                </div>
                {tx.notes && <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>{tx.notes}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', color: tx.type === 'deposit' ? '#00e676' : '#ff5555', fontSize: '15px' }}>
                  {tx.type === 'deposit' ? '+' : '-'}Pi {parseFloat(tx.amount).toFixed(2)}
                </div>
                <span style={{ 
                  fontSize: '10px', 
                  padding: '2px 8px', 
                  borderRadius: '10px', 
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  background: tx.status === 'completed' ? 'rgba(0, 230, 118, 0.2)' : tx.status === 'pending' ? 'rgba(255, 170, 0, 0.2)' : 'rgba(255, 68, 68, 0.2)',
                  color: tx.status === 'completed' ? '#00e676' : tx.status === 'pending' ? '#ffaa00' : '#ff4444'
                }}>
                  {tx.status}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  )
}

import React, { useState, useRef, useEffect } from 'react'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../context/AuthContext'

export default function Support() {
  const { user } = useAuth()
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState([
    { sender: 'agent', text: '👋 Hello! I am John from BetPK Support. How can I assist you with your wallet deposits, withdrawals, or gameplay today?' }
  ])
  const [userInput, setUserInput] = useState('')
  const [typing, setTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (chatOpen) scrollToBottom()
  }, [messages, chatOpen])

  const handleSend = (e) => {
    e.preventDefault()
    if (!userInput.trim()) return

    const userText = userInput.trim()
    setMessages(prev => [...prev, { sender: 'user', text: userText }])
    setUserInput('')
    setTyping(true)

    // Simulate agent response
    setTimeout(() => {
      let reply = "I understand your query. Let me look into that for you. Could you please provide your registered email or Transaction ID (if relating to a deposit/withdrawal)?"
      
      const textLower = userText.toLowerCase()
      if (textLower.includes('deposit') || textLower.includes('recharge') || textLower.includes('jazzcash') || textLower.includes('easypaisa') || textLower.includes('payment')) {
        reply = "💳 For deposit inquiries: Please verify that you sent the exact funds to the official accounts listed in your Wallet page, and then entered the correct Transaction ID. Our admin team manually reviews and approves all deposits within 10 to 30 minutes! Please share your Transaction ID if you'd like me to double-check its status."
      } else if (textLower.includes('withdraw') || textLower.includes('withdrawal') || textLower.includes('cashout') || textLower.includes('refund')) {
        reply = "🏧 For withdrawal inquiries: Minimum withdrawal is ₱500. Requests are processed manually within 24 hours. If your withdrawal request is rejected, the funds are instantly refunded back to your in-game balance. Please check your account details and try again."
      } else if (textLower.includes('game') || textLower.includes('crash') || textLower.includes('slots') || textLower.includes('dice') || textLower.includes('cheat') || textLower.includes('win')) {
        reply = "🎮 For game inquiries: All games on BetPK are built on verified, cryptographically secure Random Number Generators (RNG). Multipliers and spins are fully transparent and provably fair. Good luck with your bets!"
      } else if (textLower.includes('pkr') || textLower.includes('usd') || textLower.includes('exchange') || textLower.includes('dollar') || textLower.includes('rupee') || textLower.includes('rate')) {
        reply = "💵 For exchange rates: Rates can be adjusted dynamically in the Admin Panel by the site administrator. Deposits and withdrawals automatically display live conversion calculators before submission!"
      } else if (textLower.includes('hello') || textLower.includes('hi') || textLower.includes('hey') || textLower.includes('support')) {
        reply = "👋 Hi there! I am John. How can I help you today? Ask me about deposits, withdrawals, or games!"
      }

      setMessages(prev => [...prev, { sender: 'agent', text: reply }])
      setTyping(false)
    }, 1500)
  }

  return (
    <div className="app">
      <NavBar />
      
      <div style={{ padding: '24px 16px', maxWidth: '600px', margin: '0 auto', minHeight: 'calc(100vh - 140px)' }}>
        
        {!chatOpen ? (
          <div>
            <h1 style={{ color: 'var(--accent)', marginTop: 0, fontSize: '28px' }}>🎧 Customer Support</h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>
              Have questions or need assistance? Our support team is online 24/7 to help you resolve payment or technical issues.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
              <button 
                className="btn primary" 
                onClick={() => setChatOpen(true)}
                style={{ padding: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', background: 'var(--accent)', color: '#000', fontWeight: 'bold' }}
              >
                <span>💬</span> Open 24/7 Live Chat
              </button>
              
              <a href="mailto:support@betpk.com" style={{ textDecoration: 'none', width: '100%' }}>
                <button className="btn" style={{ padding: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%' }}>
                  <span>📧</span> Email Support (support@betpk.com)
                </button>
              </a>

              <a href="https://t.me/betpk_official" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', width: '100%' }}>
                <button className="btn" style={{ padding: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%' }}>
                  <span>📱</span> Connect on Telegram
                </button>
              </a>
            </div>

            <div style={{ marginTop: '40px', background: 'var(--card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>💡 Frequently Asked Questions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px', marginTop: '12px' }}>
                <div>
                  <strong style={{ color: 'var(--accent)' }}>Q: How long do deposits take?</strong>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--muted)' }}>Deposits are verified manually by administrators and typically credited within 10 to 30 minutes after submitting your Transaction ID.</p>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <strong style={{ color: 'var(--accent)' }}>Q: What is the minimum withdrawal?</strong>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--muted)' }}>The minimum withdrawal is ₱500.00. Withdrawal requests are processed to your Easypaisa, JazzCash, or Binance account within 24 hours.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Real-time Simulated Chat Window */
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
            
            {/* Chat Header */}
            <div style={{ background: 'var(--bg-tertiary)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '10px', height: '10px', background: '#00ff88', borderRadius: '50%', boxShadow: '0 0 8px #00ff88' }} />
                <strong style={{ color: '#fff' }}>Support Agent John</strong>
              </div>
              <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: '#ff4444', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                ❌ Close Chat
              </button>
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map((m, i) => (
                <div key={i} style={{
                  maxWidth: '80%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  background: m.sender === 'user' ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: m.sender === 'user' ? '#000' : '#fff',
                  border: m.sender === 'user' ? 'none' : '1px solid var(--border)',
                  borderBottomRightRadius: m.sender === 'user' ? '2px' : '12px',
                  borderBottomLeftRadius: m.sender === 'agent' ? '2px' : '12px'
                }}>
                  {m.text}
                </div>
              ))}
              {typing && (
                <div style={{ alignSelf: 'flex-start', color: 'var(--muted)', fontSize: '12px', background: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: '12px', border: '1px solid var(--border)', fontStyle: 'italic' }}>
                  Agent John is typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', padding: '12px', background: 'var(--bg-tertiary)', borderTop: '1px solid var(--border)' }}>
              <input 
                type="text" 
                placeholder="Type your message here..."
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: '#000', color: '#fff', fontSize: '14px' }}
                disabled={typing}
              />
              <button 
                type="submit" 
                className="btn primary" 
                disabled={typing || !userInput.trim()}
                style={{ padding: '0 20px', background: 'var(--accent)', color: '#000', fontWeight: 'bold' }}
              >
                Send
              </button>
            </form>

          </div>
        )}

      </div>

      <BottomNav />
    </div>
  )
}

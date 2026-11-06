import React, { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../context/AuthContext'

export default function Support() {
  const { user } = useAuth()
  const [chatOpen, setChatOpen] = useState(false)
  
  const userKey = user ? (user.email || user.id || user.uid || 'guest') : 'guest'

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'agent',
      text: '👋 Assalam-o-Alaikum! Welcome to WinX Pro Official 24/7 VIP Support. How can we help you with your deposits, withdrawals, or games today?',
      time: 'Just now'
    }
  ])
  const [userInput, setUserInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordDuration, setRecordDuration] = useState(0)

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerIntervalRef = useRef(null)

  // Load persistent chat history from server & localStorage
  const fetchServerMessages = async () => {
    if (!userKey) return
    try {
      const res = await fetch(`/api/support/messages?user_key=${encodeURIComponent(userKey)}`)
      const data = await res.json()
      if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
        setMessages(data.messages)
        try {
          localStorage.setItem(`winx_support_messages_${userKey}`, JSON.stringify(data.messages))
        } catch (e) {}
      }
    } catch (e) {}
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`winx_support_messages_${userKey}`)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed)
          }
        }
      } catch (e) {}
    }
    fetchServerMessages()
    const poll = setInterval(fetchServerMessages, 3500)
    return () => clearInterval(poll)
  }, [userKey])

  // Save persistent chat history on change
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 1) {
      try {
        localStorage.setItem(`winx_support_messages_${userKey}`, JSON.stringify(messages))
      } catch (e) {}
    }
  }, [messages, userKey])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (chatOpen) scrollToBottom()
  }, [messages, chatOpen])

  // Handle Image Upload
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result
      if (base64) {
        setSelectedImage(base64)
      }
    }
    reader.readAsDataURL(file)
  }

  // Handle Voice Note Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64Audio = reader.result
          sendVoiceMessage(base64Audio, recordDuration)
        }
        reader.readAsDataURL(audioBlob)

        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordDuration(0)

      timerIntervalRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1)
      }, 1000)
    } catch (err) {
      alert('Microphone access is required to record voice notes. Please allow microphone permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(timerIntervalRef.current)
    }
  }

  const sendVoiceMessage = async (audioUrl, duration) => {
    const tempId = `msg-${Date.now()}`
    const newMsg = {
      id: tempId,
      sender: 'user',
      type: 'audio',
      audioUrl,
      audio: audioUrl,
      duration: duration || 1,
      audio_duration: duration || 1,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setMessages(prev => [...prev, newMsg])

    try {
      await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_key: userKey,
          email: user?.email || userKey,
          name: user?.user_metadata?.full_name || user?.email || userKey,
          audio: audioUrl,
          audio_duration: duration || 1
        })
      })
    } catch (e) {}

    triggerAgentReply('voice note')
  }

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!userInput.trim() && !selectedImage) return

    const userText = userInput.trim()
    const imgToSend = selectedImage

    const tempId = `msg-${Date.now()}`
    const newMsg = {
      id: tempId,
      sender: 'user',
      type: imgToSend ? 'image' : 'text',
      text: userText || (imgToSend ? 'Sent an image attachment' : ''),
      imageUrl: imgToSend || null,
      image: imgToSend || null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, newMsg])
    setUserInput('')
    setSelectedImage(null)

    try {
      await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_key: userKey,
          email: user?.email || userKey,
          name: user?.user_metadata?.full_name || user?.email || userKey,
          text: userText,
          image: imgToSend
        })
      })
    } catch (e) {}

    triggerAgentReply(userText)
  }

  const triggerAgentReply = (queryText) => {
    setTyping(true)

    setTimeout(() => {
      let reply = "Thank you for reaching out to WinX Official Support. Our 24/7 senior agent has received your request and is reviewing your account details."
      
      const textLower = (queryText || '').toLowerCase()
      if (textLower.includes('deposit') || textLower.includes('recharge') || textLower.includes('jazzcash') || textLower.includes('easypaisa') || textLower.includes('qr')) {
        reply = "💳 Deposit Status: JazzCash & Easypaisa QR deposits are credited instantly once verified. Please share the 11-digit Transaction ID (TID) from your receipt slip if you need us to speed up manual approval!"
      } else if (textLower.includes('withdraw') || textLower.includes('bank') || textLower.includes('payout')) {
        reply = "🏧 Withdrawal Inquiry: Minimum withdrawal is Rs 500. All Bank Transfer (1LINK), JazzCash, and Easypaisa requests are debited immediately and settled to your account within 10 to 60 minutes."
      } else if (textLower.includes('bonus') || textLower.includes('free') || textLower.includes('claim')) {
        reply = "🎁 Bonus & Rewards: Daily check-in gives Rs 5.00 everyday, first deposit gets a +35% instant bonus, and referring friends awards Rs 100 per friend! All bonuses credit directly into your PKR balance."
      } else if (textLower.includes('game') || textLower.includes('aviator') || textLower.includes('jili') || textLower.includes('pg') || textLower.includes('pragmatic')) {
        reply = "🎰 Game Support: Over 11,200 games from JILI, PG Soft, Spribe Aviator, and Pragmatic Play are fully operational with real-time PKR wallet balance sync!"
      } else if (textLower.includes('voice note') || textLower.includes('image')) {
        reply = "🎧 We have received your attachment/voice note! Our technical team is reviewing it right now."
      }

      setMessages(prev => [
        ...prev,
        {
          id: `reply-${Date.now()}`,
          sender: 'agent',
          type: 'text',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
      setTyping(false)
    }, 1400)
  }

  const clearChatHistory = () => {
    if (confirm('Clear support conversation history?')) {
      const reset = [
        {
          id: 'welcome',
          sender: 'agent',
          text: '👋 Assalam-o-Alaikum! Welcome to WinX Pro Official 24/7 VIP Support. How can we help you today?',
          time: 'Just now'
        }
      ]
      setMessages(reset)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`winx_support_messages_${userKey}`)
      }
    }
  }

  return (
    <div className="app bbr-theme-app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#070a14' }}>
      <Head>
        <title>24/7 Official Live Support | WinX Pro</title>
      </Head>

      <NavBar />
      
      <div style={{ flex: 1, padding: '16px 14px 80px', maxWidth: '480px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {!chatOpen ? (
          <div>
            <div style={{
              background: 'linear-gradient(135deg, #0e1e14 0%, #173622 60%, #0a140d 100%)',
              borderRadius: '20px',
              padding: '22px 18px',
              border: '1.5px solid #6dff38',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7), 0 0 24px rgba(109, 255, 56, 0.2)',
              marginBottom: '20px',
              textAlign: 'center',
              position: 'relative'
            }}>
              <span style={{ fontSize: '38px' }}>🎧</span>
              <h1 style={{ color: '#ffffff', margin: '8px 0 4px', fontSize: '22px', fontWeight: 900 }}>
                Customer Support 24/7
              </h1>
              <p style={{ color: '#cbd5e1', fontSize: '12.5px', margin: '0 auto', maxWidth: '360px', lineHeight: 1.5 }}>
                Have questions or need assistance? Our verified official team is online 24/7 to resolve deposits, payouts, or technical queries.
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <button 
                type="button"
                onClick={() => setChatOpen(true)}
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #6dff38 0%, #46bd1f 100%)',
                  border: 'none',
                  color: '#081a0b',
                  fontWeight: 900,
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 8px 24px rgba(109, 255, 56, 0.4)'
                }}
              >
                <span style={{ fontSize: '20px' }}>💬</span>
                <span>Open 24/7 Live Chat</span>
              </button>
              
              <a href="mailto:support@winxpro.com.pk" style={{ textDecoration: 'none' }}>
                <button
                  type="button"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    background: '#121c15',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>📧</span>
                  <span>Email Support (support@winxpro.com.pk)</span>
                </button>
              </a>

              <a href="https://t.me/winxpro_official" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <button
                  type="button"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    background: '#121c15',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>📱</span>
                  <span>Connect on Telegram (@winxpro_official)</span>
                </button>
              </a>
            </div>

            {/* FAQs */}
            <div style={{ background: '#121c15', padding: '18px 16px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 900, color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>💡</span>
                <span>Frequently Asked Questions</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                <div>
                  <strong style={{ color: '#6dff38' }}>Q: How long do JazzCash &amp; Easypaisa deposits take?</strong>
                  <p style={{ margin: '3px 0 0', color: '#94a3b8' }}>Deposits submitted with a valid Transaction ID are verified and credited within 10 to 30 minutes.</p>
                </div>
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px' }}>
                  <strong style={{ color: '#6dff38' }}>Q: What is the minimum withdrawal?</strong>
                  <p style={{ margin: '3px 0 0', color: '#94a3b8' }}>Minimum withdrawal is Rs 500. Payouts are made directly to Bank Transfer (1LINK), JazzCash, or Easypaisa.</p>
                </div>
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px' }}>
                  <strong style={{ color: '#6dff38' }}>Q: How do I claim the VIP referral bonus?</strong>
                  <p style={{ margin: '3px 0 0', color: '#94a3b8' }}>Share your invite link from the Invite tab to earn Rs 100 signup reward per friend plus 5% daily commission.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* AKHUWAT-GRADE 24/7 INTERACTIVE LIVE CHAT ROOM */
          <div style={{
            background: '#0d1510',
            border: '1.5px solid #6dff38',
            borderRadius: '18px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 150px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(109, 255, 56, 0.2)'
          }}>
            {/* Verified Support Header */}
            <div style={{
              background: 'linear-gradient(180deg, #16261d 0%, #0e1712 100%)',
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(109, 255, 56, 0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '18px',
                    cursor: 'pointer',
                    padding: '2px 4px'
                  }}
                >
                  ←
                </button>
                
                {/* WinX Pro Logo & Verified Badge */}
                <div style={{ position: 'relative' }}>
                  <img
                    src="/winx-logo.png"
                    alt="WinX Pro"
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      border: '1.5px solid #6dff38',
                      background: '#070a14',
                      objectFit: 'contain'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    width: '10px',
                    height: '10px',
                    background: '#6dff38',
                    borderRadius: '50%',
                    border: '1.5px solid #0d1510',
                    boxShadow: '0 0 8px #6dff38'
                  }} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: 900, color: '#ffffff' }}>WinX Pro Official</span>
                    {/* Blue Verified Checkmark */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: '#38bdf8',
                      color: '#081a0b',
                      fontSize: '9px',
                      fontWeight: 900
                    }}>
                      ✓
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#6dff38', fontWeight: 700 }}>
                    ● Online 24/7 Dedicated Support
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={clearChatHistory}
                  title="Clear conversation"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    color: '#94a3b8',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '16px',
                    cursor: 'pointer',
                    fontWeight: 900
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick Action Assistance Chips */}
            <div style={{
              background: '#09100b',
              padding: '8px 10px',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              {['💳 Deposit Help', '🏧 Withdrawal Status', '🎁 Bonus Details', '🎰 Game Issue'].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setUserInput(chip)
                    setTimeout(() => handleSend(), 50)
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#cbd5e1',
                    borderRadius: '12px',
                    padding: '4px 10px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Messages Stream */}
            <div style={{
              flex: 1,
              padding: '14px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: '#09100b'
            }}>
              {messages.map((m) => {
                const isUser = m.sender === 'user'
                return (
                  <div
                    key={m.id}
                    style={{
                      maxWidth: '82%',
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: '14px',
                      fontSize: '13px',
                      lineHeight: '1.45',
                      background: isUser ? 'linear-gradient(135deg, #6dff38 0%, #46bd1f 100%)' : '#142218',
                      color: isUser ? '#081a0b' : '#ffffff',
                      fontWeight: isUser ? 700 : 500,
                      border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderBottomRightRadius: isUser ? '2px' : '14px',
                      borderBottomLeftRadius: isUser ? '14px' : '2px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                    }}>
                      {/* Agent / Admin Name Header */}
                      {!isUser && m.admin_name && (
                        <div style={{ fontSize: '10.5px', color: '#6dff38', fontWeight: 800, marginBottom: '4px' }}>
                          🛡️ {m.admin_name}
                        </div>
                      )}

                      {/* Text */}
                      {m.text && <div>{m.text}</div>}

                      {/* Image Attachment */}
                      {(m.imageUrl || m.image) && (
                        <div style={{ marginTop: m.text ? '8px' : 0 }}>
                          <img
                            src={m.imageUrl || m.image}
                            alt="Attachment"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '180px',
                              borderRadius: '8px',
                              display: 'block'
                            }}
                          />
                        </div>
                      )}

                      {/* Voice Note Audio Player */}
                      {(m.audioUrl || m.audio) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '160px', marginTop: '4px' }}>
                          <span style={{ fontSize: '18px' }}>🎙</span>
                          <audio controls src={m.audioUrl || m.audio} style={{ width: '180px', height: '32px' }} />
                        </div>
                      )}
                    </div>

                    <div style={{
                      fontSize: '9.5px',
                      color: '#64748b',
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      padding: '0 4px'
                    }}>
                      {m.time}
                    </div>
                  </div>
                )
              })}

              {typing && (
                <div style={{
                  alignSelf: 'flex-start',
                  color: '#6dff38',
                  fontSize: '11.5px',
                  background: '#142218',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(109, 255, 56, 0.2)',
                  fontStyle: 'italic',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>✍️</span> WinX Agent is typing...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Selected Image Preview Toolbar */}
            {selectedImage && (
              <div style={{
                background: '#101a13',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src={selectedImage} alt="Preview" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                  <span style={{ fontSize: '11px', color: '#6dff38', fontWeight: 700 }}>Image Ready to Send</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '16px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Recording Active Status Bar */}
            {isRecording && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                borderTop: '1px solid #ef4444',
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 800, fontSize: '12px' }}>
                  <span style={{ animation: 'pulse 1s infinite' }}>🔴</span>
                  <span>Recording Voice Note ({recordDuration}s)</span>
                </div>
                <button
                  type="button"
                  onClick={stopRecording}
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Done / Send
                </button>
              </div>
            )}

            {/* Chat Input Toolbar with Text, Voice & Image Upload */}
            <form onSubmit={handleSend} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px',
              background: '#0e1712',
              borderTop: '1px solid rgba(109, 255, 56, 0.2)'
            }}>
              {/* Image Attachment Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageSelect}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach Deposit Receipt or Screenshot"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                📷
              </button>

              {/* Voice Note Recorder Button */}
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                title={isRecording ? 'Stop Recording' : 'Record Voice Note'}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: isRecording ? '#ef4444' : 'rgba(255, 255, 255, 0.06)',
                  border: isRecording ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.12)',
                  color: isRecording ? '#ffffff' : '#6dff38',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                🎙
              </button>

              {/* Text Input */}
              <input 
                type="text" 
                placeholder="Type your message here..."
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: '#070c08',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none'
                }}
                disabled={typing || isRecording}
              />

              {/* Send Button */}
              <button 
                type="submit" 
                disabled={typing || isRecording || (!userInput.trim() && !selectedImage)}
                style={{
                  width: '38px',
                  height: '36px',
                  borderRadius: '10px',
                  background: (!userInput.trim() && !selectedImage)
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'linear-gradient(135deg, #6dff38 0%, #46bd1f 100%)',
                  border: 'none',
                  color: '#081a0b',
                  fontWeight: 900,
                  fontSize: '16px',
                  cursor: (!userInput.trim() && !selectedImage) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                ✈️
              </button>
            </form>
          </div>
        )}

      </div>

      <BottomNav />
    </div>
  )
}

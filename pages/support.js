import React, { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../context/AuthContext'

export default function Support() {
  const { user } = useAuth()
  const [chatOpen, setChatOpen] = useState(true)
  
  const resolveUserKey = () => {
    if (user?.email) return user.email.toLowerCase().trim()
    if (user?.id) return String(user.id).trim()
    if (user?.uid) return String(user.uid).trim()
    if (typeof window !== 'undefined') {
      let guestId = localStorage.getItem('winx_guest_user_key')
      if (!guestId) {
        guestId = 'guest_' + Math.random().toString(36).substring(2, 9)
        localStorage.setItem('winx_guest_user_key', guestId)
      }
      return guestId
    }
    return 'guest'
  }

  const [userKey, setUserKey] = useState('guest')

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'agent',
      admin_name: 'WinX Pro Official VIP Support',
      text: '👋 Assalam-o-Alaikum! Welcome to WinX Pro Official 24/7 VIP Support. How can we help you with your deposits, withdrawals, or games today?',
      time: 'Just now',
      timestamp: Date.now()
    }
  ])
  const [userInput, setUserInput] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordDuration, setRecordDuration] = useState(0)

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerIntervalRef = useRef(null)

  // Keep userKey synced
  useEffect(() => {
    const k = resolveUserKey()
    setUserKey(k)
  }, [user])

  // Bidirectional self-healing sync
  const fetchServerMessages = async (targetKey = null) => {
    const activeKey = targetKey || resolveUserKey()
    if (!activeKey) return
    try {
      const res = await fetch(`/api/support/messages?user_key=${encodeURIComponent(activeKey)}`)
      const data = await res.json()
      if (data.success && Array.isArray(data.messages)) {
        setMessages(prev => {
          const serverMap = new Map()
          for (const m of data.messages) {
            if (m && m.id) serverMap.set(m.id, m)
          }

          let localHasUnsynced = false
          const merged = [...data.messages]
          for (const m of prev) {
            if (m && m.id && !serverMap.has(m.id)) {
              merged.push(m)
              localHasUnsynced = true
            }
          }
          merged.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))

          // Heal server if server restarted/cold start
          if (localHasUnsynced && merged.length > data.messages.length) {
            fetch('/api/support/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'sync',
                user_key: activeKey,
                email: user?.email || activeKey,
                name: user?.user_metadata?.full_name || user?.displayName || user?.email || activeKey,
                messages: merged
              })
            }).catch(() => {})
          }

          try {
            localStorage.setItem(`winx_support_messages_${activeKey}`, JSON.stringify(merged))
          } catch (e) {}
          return merged
        })
      }
    } catch (e) {}
  }

  // Load cached messages immediately on mount
  useEffect(() => {
    const k = resolveUserKey()
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`winx_support_messages_${k}`)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed)
          }
        }
      } catch (e) {}
    }
    fetchServerMessages(k)
    const poll = setInterval(() => fetchServerMessages(k), 2200)
    return () => clearInterval(poll)
  }, [user])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (chatOpen) {
      scrollToBottom()
    }
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

        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordDuration(0)

      timerIntervalRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1)
      }, 1000)
    } catch (err) {
      alert('Microphone access is required to record voice notes. Please allow microphone permissions in your browser.')
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
    if (!audioUrl) return
    const activeKey = resolveUserKey()
    const tempId = `temp_${Date.now()}`
    const timeNow = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const newMsg = {
      id: tempId,
      sender: 'user',
      type: 'audio',
      audioUrl,
      audio: audioUrl,
      duration: duration || 1,
      audio_duration: duration || 1,
      time: timeNow,
      timestamp: Date.now()
    }
    setMessages(prev => {
      const updated = [...prev, newMsg]
      try {
        localStorage.setItem(`winx_support_messages_${activeKey}`, JSON.stringify(updated))
      } catch (e) {}
      return updated
    })

    try {
      const res = await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_key: activeKey,
          email: user?.email || activeKey,
          name: user?.user_metadata?.full_name || user?.displayName || user?.email || activeKey,
          audio: audioUrl,
          audio_duration: duration || 1
        })
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages)
        try {
          localStorage.setItem(`winx_support_messages_${activeKey}`, JSON.stringify(data.messages))
        } catch (e) {}
      }
    } catch (e) {
      console.error('Error sending voice message:', e)
    }
  }

  const handleSend = async (e, textOverride = null) => {
    if (e) e.preventDefault()
    const userText = textOverride !== null ? String(textOverride).trim() : userInput.trim()
    const imgToSend = selectedImage

    if (!userText && !imgToSend) return

    const activeKey = resolveUserKey()
    const tempId = `temp_${Date.now()}`
    const timeNow = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const newMsg = {
      id: tempId,
      sender: 'user',
      type: imgToSend ? 'image' : 'text',
      text: userText || (imgToSend ? 'Sent an image attachment' : ''),
      imageUrl: imgToSend || null,
      image: imgToSend || null,
      time: timeNow,
      timestamp: Date.now()
    }

    setMessages(prev => {
      const updated = [...prev, newMsg]
      try {
        localStorage.setItem(`winx_support_messages_${activeKey}`, JSON.stringify(updated))
      } catch (e) {}
      return updated
    })
    setUserInput('')
    setSelectedImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setSending(true)

    try {
      const res = await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_key: activeKey,
          email: user?.email || activeKey,
          name: user?.user_metadata?.full_name || user?.displayName || user?.email || activeKey,
          text: userText,
          image: imgToSend
        })
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages)
        try {
          localStorage.setItem(`winx_support_messages_${activeKey}`, JSON.stringify(data.messages))
        } catch (e) {}
      }
    } catch (e) {
      console.error('Failed to post support message:', e)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="app bbr-theme-app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#070a14', overflow: 'hidden' }}>
      <Head>
        <title>24/7 Live Support | WinX Pro Official</title>
      </Head>

      <NavBar />
      
      {/* Main Support Viewport Container (Perfect fit between NavBar and BottomNav) */}
      <div style={{
        flex: 1,
        padding: '6px 8px 0',
        maxWidth: '480px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
        height: 'calc(100vh - 65px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {!chatOpen ? (
          <div style={{ overflowY: 'auto', paddingBottom: '70px' }}>
            {/* Header Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #0e1e14 0%, #173622 60%, #0a140d 100%)',
              borderRadius: '18px',
              padding: '20px 16px',
              border: '1.5px solid #25d366',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7), 0 0 24px rgba(37, 211, 102, 0.2)',
              marginBottom: '16px',
              textAlign: 'center',
              position: 'relative'
            }}>
              <span style={{ fontSize: '36px' }}>🎧</span>
              <h1 style={{ color: '#ffffff', margin: '8px 0 4px', fontSize: '20px', fontWeight: 900 }}>
                Customer Support 24/7
              </h1>
              <p style={{ color: '#cbd5e1', fontSize: '12px', margin: '0 auto', maxWidth: '340px', lineHeight: 1.5 }}>
                Have questions or need assistance? Our verified official team is online 24/7 to resolve deposits, payouts, or technical queries.
              </p>
            </div>
            
            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <button 
                type="button"
                onClick={() => setChatOpen(true)}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 8px 20px rgba(37, 211, 102, 0.35)'
                }}
              >
                <span style={{ fontSize: '20px' }}>💬</span>
                <span>Open 24/7 Live WhatsApp Chat</span>
              </button>
              
              <a href="mailto:support@winxpro.com.pk" style={{ textDecoration: 'none' }}>
                <button 
                  type="button"
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '12px',
                    background: '#131b26',
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
                  <span style={{ fontSize: '16px' }}>📧</span>
                  <span>Email Support (support@winxpro.com.pk)</span>
                </button>
              </a>

              <a href="https://t.me/winxpro_official" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <button 
                  type="button"
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '12px',
                    background: '#131b26',
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
                  <span style={{ fontSize: '16px' }}>📱</span>
                  <span>Connect on Telegram</span>
                </button>
              </a>
            </div>

            {/* FAQs */}
            <div style={{
              background: '#0d1520',
              borderRadius: '14px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 900, color: '#ffffff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>💡</span>
                <span>Frequently Asked Questions</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11.5px' }}>
                <div>
                  <strong style={{ color: '#25d366' }}>Q: How long do JazzCash &amp; Easypaisa deposits take?</strong>
                  <p style={{ margin: '3px 0 0', color: '#94a3b8' }}>Deposits submitted with a valid Transaction ID are verified and credited within 10 to 30 minutes.</p>
                </div>
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px' }}>
                  <strong style={{ color: '#25d366' }}>Q: What is the minimum withdrawal?</strong>
                  <p style={{ margin: '3px 0 0', color: '#94a3b8' }}>Minimum withdrawal is Rs 500. Payouts are made directly to Bank Transfer (1LINK), JazzCash, or Easypaisa.</p>
                </div>
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px' }}>
                  <strong style={{ color: '#25d366' }}>Q: How do I claim the VIP referral bonus?</strong>
                  <p style={{ margin: '3px 0 0', color: '#94a3b8' }}>Share your invite link from the Invite tab to earn Rs 100 signup reward per friend plus 5% daily commission.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================
             WHATSAPP-STYLE VERIFIED LIVE SUPPORT CHAT ROOM
             (Strictly fits within mobile frame without overflowing)
             ========================================================= */
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 128px)',
            maxHeight: 'calc(100vh - 128px)',
            background: '#0b141a',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(37, 211, 102, 0.25)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7)'
          }}>
            {/* WhatsApp Top Navigation Bar */}
            <div style={{
              background: '#1f2c34',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  title="View FAQ & Contact info"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#aebac1',
                    fontSize: '20px',
                    cursor: 'pointer',
                    padding: '0 4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  ←
                </button>
                
                {/* Official Circular Avatar with Green Online Dot */}
                <div style={{ position: 'relative' }}>
                  <img
                    src="/winx-logo.png"
                    alt="WinX Pro"
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: '#111b21',
                      border: '1.5px solid #25d366',
                      objectFit: 'contain'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    width: '10px',
                    height: '10px',
                    background: '#25d366',
                    borderRadius: '50%',
                    border: '1.5px solid #1f2c34',
                    boxShadow: '0 0 6px #25d366'
                  }} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#e9edef' }}>WinX Pro Official</span>
                    {/* Blue Verified Tick */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: '#00a884',
                      color: '#ffffff',
                      fontSize: '9px',
                      fontWeight: 900
                    }}>
                      ✓
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#25d366', fontWeight: 600 }}>
                    online
                  </div>
                </div>
              </div>

              {/* Status Pill */}
              <div style={{
                background: 'rgba(37, 211, 102, 0.1)',
                border: '1px solid rgba(37, 211, 102, 0.3)',
                padding: '3px 8px',
                borderRadius: '999px',
                fontSize: '10.5px',
                color: '#25d366',
                fontWeight: 700
              }}>
                24/7 VIP
              </div>
            </div>

            {/* Quick Action Chips Toolbar */}
            <div style={{
              background: '#111b21',
              padding: '6px 8px',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              flexShrink: 0
            }}>
              {[
                { label: '💳 Deposit Help', query: 'I need assistance regarding my deposit / recharge.' },
                { label: '🏧 Withdrawal Status', query: 'Please check the status of my withdrawal request.' },
                { label: '🎁 VIP Bonus Details', query: 'How do I claim my VIP bonus or daily check-in reward?' },
                { label: '🎰 Game Issue', query: 'I need help with a casino/slots game.' }
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(null, chip.query)}
                  style={{
                    background: '#182229',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#8696a0',
                    borderRadius: '16px',
                    padding: '4px 10px',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* WhatsApp Scrollable Messages Area */}
            <div style={{
              flex: 1,
              padding: '12px 10px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              background: '#0b141a',
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 0)',
              backgroundSize: '16px 16px'
            }}>
              {/* WhatsApp Date Chip */}
              <div style={{
                alignSelf: 'center',
                background: '#182229',
                color: '#8696a0',
                fontSize: '10.5px',
                fontWeight: 700,
                padding: '3px 12px',
                borderRadius: '8px',
                marginBottom: '6px',
                textTransform: 'uppercase',
                boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}>
                TODAY
              </div>

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
                      gap: '2px'
                    }}
                  >
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      fontSize: '13px',
                      lineHeight: '1.4',
                      background: isUser ? '#005c4b' : '#202c33',
                      color: '#e9edef',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
                      position: 'relative'
                    }}>
                      {/* Agent / Admin Name Header on incoming messages */}
                      {!isUser && (
                        <div style={{ fontSize: '10.5px', color: '#25d366', fontWeight: 800, marginBottom: '3px' }}>
                          🛡️ {m.admin_name || 'WinX Support Specialist'}
                        </div>
                      )}

                      {/* Text */}
                      {m.text && <div style={{ wordBreak: 'break-word' }}>{m.text}</div>}

                      {/* Image Attachment (Clickable) */}
                      {(m.imageUrl || m.image) && (
                        <div style={{ marginTop: m.text ? '6px' : 0 }}>
                          <a href={m.imageUrl || m.image} target="_blank" rel="noreferrer">
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
                          </a>
                        </div>
                      )}

                      {/* Voice Note Audio Player */}
                      {(m.audioUrl || m.audio) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '160px', marginTop: '4px' }}>
                          <span style={{ fontSize: '16px' }}>🎙</span>
                          <audio controls src={m.audioUrl || m.audio} style={{ width: '180px', height: '30px' }} />
                        </div>
                      )}

                      {/* WhatsApp Time & Double Checkmark */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '3px',
                        fontSize: '9.5px',
                        color: isUser ? 'rgba(233, 237, 239, 0.65)' : '#8696a0',
                        marginTop: '3px'
                      }}>
                        <span>{m.time}</span>
                        {isUser && (
                          <span style={{ color: '#53bdeb', fontSize: '11px', fontWeight: 900, letterSpacing: '-1.5px' }}>
                            ✓✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Selected Image Preview Bar */}
            {selectedImage && (
              <div style={{
                background: '#182229',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src={selectedImage} alt="Preview" style={{ width: '34px', height: '34px', borderRadius: '4px', objectFit: 'cover' }} />
                  <span style={{ fontSize: '11px', color: '#25d366', fontWeight: 700 }}>Image ready to send</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  style={{ background: 'none', border: 'none', color: '#ea4335', fontSize: '16px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Recording Active Status Bar */}
            {isRecording && (
              <div style={{
                background: 'rgba(234, 67, 53, 0.15)',
                borderTop: '1px solid #ea4335',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ea4335', fontWeight: 800, fontSize: '11px' }}>
                  <span>🔴</span>
                  <span>Recording Voice Note ({recordDuration}s)</span>
                </div>
                <button
                  type="button"
                  onClick={stopRecording}
                  style={{
                    background: '#ea4335',
                    color: '#ffffff',
                    border: 'none',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '10.5px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            )}

            {/* WhatsApp Bottom Input Bar (Fixed inside frame right above BottomNav) */}
            <form onSubmit={handleSend} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 10px',
              background: '#1f2c34',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              flexShrink: 0
            }}>
              {/* Camera Button */}
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
                title="Attach photo"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8696a0',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                📷
              </button>

              {/* WhatsApp Voice Recorder Button */}
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                title={isRecording ? 'Stop Recording' : 'Record Voice Note'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isRecording ? '#ea4335' : '#8696a0',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                🎙
              </button>

              {/* WhatsApp Pill Input Field */}
              <input 
                type="text" 
                placeholder="Type a message..."
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  borderRadius: '24px',
                  border: 'none',
                  background: '#2a3942',
                  color: '#e9edef',
                  fontSize: '13.5px',
                  outline: 'none'
                }}
                disabled={isRecording}
              />

              {/* Circular WhatsApp Green Send Button */}
              <button 
                type="submit" 
                disabled={isRecording || sending || (!userInput.trim() && !selectedImage)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: (!userInput.trim() && !selectedImage)
                    ? '#2a3942'
                    : '#00a884',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '16px',
                  cursor: (!userInput.trim() && !selectedImage) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.2s',
                  boxShadow: (!userInput.trim() && !selectedImage) ? 'none' : '0 2px 6px rgba(0, 168, 132, 0.4)'
                }}
              >
                ➤
              </button>
            </form>
          </div>
        )}

      </div>

      <BottomNav />
    </div>
  )
}

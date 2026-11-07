import fs from 'fs'
import path from 'path'

const CHATS_FILE = path.join(process.cwd(), 'data', 'support_chats.json')
const TMP_CHATS_FILE = path.join('/tmp', 'winxpro_support_chats.json')

let memoryChats = {}

function mergeThreads(target, source) {
  if (!source || typeof source !== 'object') return target
  for (const [k, thread] of Object.entries(source)) {
    if (!thread || typeof thread !== 'object') continue
    if (!target[k]) {
      target[k] = { ...thread, messages: Array.isArray(thread.messages) ? [...thread.messages] : [] }
    } else {
      const existingIds = new Set(target[k].messages.map(m => m.id))
      const sourceMessages = Array.isArray(thread.messages) ? thread.messages : []
      for (const m of sourceMessages) {
        if (!existingIds.has(m.id)) {
          target[k].messages.push(m)
          existingIds.add(m.id)
        }
      }
      target[k].messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
      target[k].updated_at = thread.updated_at || target[k].updated_at
      if (thread.email) target[k].email = thread.email
      if (thread.name) target[k].name = thread.name
      if (thread.unread_admin !== undefined) target[k].unread_admin = thread.unread_admin
      if (thread.unread_user !== undefined) target[k].unread_user = thread.unread_user
    }
  }
  return target
}

function loadChats() {
  try {
    if (fs.existsSync(CHATS_FILE)) {
      const data = JSON.parse(fs.readFileSync(CHATS_FILE, 'utf8'))
      mergeThreads(memoryChats, data)
    }
  } catch (e) {}

  try {
    if (fs.existsSync(TMP_CHATS_FILE)) {
      const data = JSON.parse(fs.readFileSync(TMP_CHATS_FILE, 'utf8'))
      mergeThreads(memoryChats, data)
    }
  } catch (e) {}
}

function persistChats() {
  // Always write to /tmp first so it succeeds reliably on serverless environments
  try {
    fs.writeFileSync(TMP_CHATS_FILE, JSON.stringify(memoryChats, null, 2), 'utf8')
  } catch (err) {}

  // Also write to local project directory if writable
  try {
    const dir = path.dirname(CHATS_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(CHATS_FILE, JSON.stringify(memoryChats, null, 2), 'utf8')
  } catch (e) {}
}

// Initial load
loadChats()

export function getChatThread(userKey) {
  loadChats()
  const key = (userKey || 'guest').toLowerCase().trim()
  if (!memoryChats[key]) {
    memoryChats[key] = {
      user_key: key,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      unread_admin: 0,
      unread_user: 0,
      messages: [
        {
          id: 'welcome',
          sender: 'agent',
          text: '👋 Assalam-o-Alaikum! Welcome to WinX Pro Official 24/7 VIP Support. How can we help you with your deposits, withdrawals, or games today?',
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now()
        }
      ]
    }
    persistChats()
  }
  return memoryChats[key]
}

export function saveChatMessage(userKey, msg) {
  loadChats()
  const key = (userKey || 'guest').toLowerCase().trim()
  const thread = getChatThread(key)

  const newMsg = {
    id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    sender: msg.sender || 'user', // 'user' | 'agent' | 'admin'
    text: msg.text || '',
    image: msg.image || null,
    audio: msg.audio || null,
    audio_duration: msg.audio_duration || 0,
    time: msg.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
    admin_name: msg.admin_name || (msg.sender === 'admin' ? 'WinX Pro Support Agent' : null)
  }

  thread.messages.push(newMsg)
  thread.updated_at = new Date().toISOString()
  if (msg.sender === 'user') {
    thread.unread_admin = (thread.unread_admin || 0) + 1
  } else {
    thread.unread_user = (thread.unread_user || 0) + 1
  }

  if (msg.email) thread.email = msg.email
  if (msg.name) thread.name = msg.name

  memoryChats[key] = thread
  persistChats()
  return { success: true, message: newMsg, thread }
}

export function syncClientMessages(userKey, clientMessages, email = '', name = '') {
  loadChats()
  const key = (userKey || 'guest').toLowerCase().trim()
  const thread = getChatThread(key)
  const existingIds = new Set(thread.messages.map(m => m.id))
  let added = false
  if (Array.isArray(clientMessages)) {
    for (const m of clientMessages) {
      if (m && m.id && !existingIds.has(m.id)) {
        thread.messages.push(m)
        existingIds.add(m.id)
        added = true
      }
    }
  }
  if (added) {
    thread.messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    thread.updated_at = new Date().toISOString()
  }
  if (email) thread.email = email
  if (name) thread.name = name
  memoryChats[key] = thread
  persistChats()
  return thread
}

export function syncThreads(incomingThreads) {
  loadChats()
  if (Array.isArray(incomingThreads)) {
    for (const t of incomingThreads) {
      if (t && t.user_key) {
        mergeThreads(memoryChats, { [t.user_key]: t })
      }
    }
  } else if (incomingThreads && typeof incomingThreads === 'object') {
    mergeThreads(memoryChats, incomingThreads)
  }
  persistChats()
  return memoryChats
}

export function getAllChatThreads() {
  loadChats()
  const threads = Object.values(memoryChats).map(t => {
    const lastMsg = t.messages && t.messages.length > 0 ? t.messages[t.messages.length - 1] : null
    return {
      user_key: t.user_key,
      email: t.email || t.user_key,
      name: t.name || t.user_key,
      updated_at: t.updated_at || t.created_at,
      unread_admin: t.unread_admin || 0,
      total_messages: t.messages?.length || 0,
      last_message: lastMsg ? {
        sender: lastMsg.sender,
        text: lastMsg.text || (lastMsg.audio ? '🎤 Voice message' : lastMsg.image ? '📷 Image attachment' : ''),
        time: lastMsg.time,
        timestamp: lastMsg.timestamp
      } : null
    }
  })

  // Sort latest updated first
  return threads.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
}

export function markThreadAsRead(userKey, reader = 'admin') {
  loadChats()
  const key = (userKey || 'guest').toLowerCase().trim()
  if (memoryChats[key]) {
    if (reader === 'admin') {
      memoryChats[key].unread_admin = 0
    } else {
      memoryChats[key].unread_user = 0
    }
    persistChats()
    return true
  }
  return false
}

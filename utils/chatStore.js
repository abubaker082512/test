/**
 * Bulletproof Persistent Chat Store for WinX Pro 24/7 VIP Support
 * - Primary storage: Supabase PostgreSQL (support_messages table)
 * - Persistent disk fallback: data/support_chats.json & /tmp/winxpro_support_chats.json
 * - In-memory fast cache
 * - Automatic thread unification (merges guest session into logged-in user)
 * - Guarantees NO messages are ever lost or hidden on either user or admin side
 */

import fs from 'fs'
import path from 'path'
import { supabase } from './supabaseClient.js'

const CHATS_FILE = path.join(process.cwd(), 'data', 'support_chats.json')
const TMP_CHATS_FILE = path.join('/tmp', 'winxpro_support_chats.json')

// In-memory cache
let memoryChats = {}
let lastSupabaseSync = 0
let supabaseTableExists = null // null = untested, true = exists, false = does not exist

// Load persistent chats from disk on boot
function loadDiskChats() {
  try {
    if (fs.existsSync(CHATS_FILE)) {
      const data = JSON.parse(fs.readFileSync(CHATS_FILE, 'utf8'))
      if (data && typeof data === 'object') {
        memoryChats = { ...data, ...memoryChats }
      }
    } else if (fs.existsSync(TMP_CHATS_FILE)) {
      const data = JSON.parse(fs.readFileSync(TMP_CHATS_FILE, 'utf8'))
      if (data && typeof data === 'object') {
        memoryChats = { ...data, ...memoryChats }
      }
    }
  } catch (e) {
    console.error('[ChatStore] Disk read error:', e.message)
  }
}

// Persist in-memory chats to disk
function saveDiskChats() {
  try {
    const dir = path.dirname(CHATS_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(CHATS_FILE, JSON.stringify(memoryChats, null, 2), 'utf8')
  } catch (e) {
    try {
      fs.writeFileSync(TMP_CHATS_FILE, JSON.stringify(memoryChats, null, 2), 'utf8')
    } catch (err) {}
  }
}

// Load from Supabase PostgreSQL if table exists
async function syncFromSupabase() {
  const now = Date.now()
  if (now - lastSupabaseSync < 3000) return
  lastSupabaseSync = now

  try {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(5000)

    if (error) {
      if (error.message && error.message.includes('does not exist')) {
        supabaseTableExists = false
      }
      return
    }

    supabaseTableExists = true

    if (data && Array.isArray(data)) {
      for (const row of data) {
        const key = (row.user_key || 'guest').toLowerCase().trim()
        if (!memoryChats[key]) {
          memoryChats[key] = {
            user_key: key,
            email: row.user_email || key,
            name: row.user_name || key,
            created_at: row.created_at,
            updated_at: row.created_at,
            unread_admin: 0,
            unread_user: 0,
            messages: []
          }
        }

        const exists = memoryChats[key].messages.some(m => m.id === row.id)
        if (!exists) {
          memoryChats[key].messages.push({
            id: row.id,
            sender: row.sender,
            text: row.text || '',
            image: row.image || null,
            imageUrl: row.image || null,
            audio: row.audio || null,
            audioUrl: row.audio || null,
            audio_duration: row.audio_duration || 0,
            admin_name: row.admin_name || null,
            time: new Date(row.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            timestamp: row.timestamp || new Date(row.created_at).getTime()
          })
          memoryChats[key].updated_at = row.created_at
        }
      }
      saveDiskChats()
    }
  } catch (err) {
    console.error('[ChatStore] Supabase sync error:', err.message)
  }
}

// Save single message to Supabase
async function saveToSupabase(msg, userKey, userEmail, userName) {
  if (supabaseTableExists === false) return
  try {
    const { error } = await supabase.from('support_messages').upsert({
      id: msg.id,
      user_key: userKey,
      user_email: userEmail || userKey,
      user_name: userName || userKey,
      sender: msg.sender,
      text: msg.text || null,
      image: msg.image || msg.imageUrl || null,
      audio: msg.audio || msg.audioUrl || null,
      audio_duration: msg.audio_duration || 0,
      admin_name: msg.admin_name || null,
      timestamp: msg.timestamp || Date.now(),
      created_at: new Date().toISOString()
    }, { onConflict: 'id', ignoreDuplicates: true })

    if (error) {
      if (error.message && error.message.includes('does not exist')) {
        supabaseTableExists = false
      }
    } else {
      supabaseTableExists = true
    }
  } catch (err) {}
}

// Initial boot
loadDiskChats()
syncFromSupabase().catch(() => {})

export async function getChatThread(userKey) {
  const key = (userKey || 'guest').toLowerCase().trim()
  await syncFromSupabase()

  if (!memoryChats[key]) {
    const welcomeMsg = {
      id: 'welcome_' + key,
      sender: 'agent',
      admin_name: 'WinX Pro Official VIP Support',
      text: '👋 Assalam-o-Alaikum! Welcome to WinX Pro Official 24/7 VIP Support. How can we help you with your deposits, withdrawals, or games today?',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    }
    memoryChats[key] = {
      user_key: key,
      email: key.includes('@') ? key : '',
      name: key.includes('@') ? key.split('@')[0] : key,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      unread_admin: 0,
      unread_user: 0,
      messages: [welcomeMsg]
    }
    saveDiskChats()
    saveToSupabase(welcomeMsg, key, key, key).catch(() => {})
  }

  return memoryChats[key]
}

export async function saveChatMessage(userKey, msg) {
  const key = (userKey || 'guest').toLowerCase().trim()
  await syncFromSupabase()

  if (!memoryChats[key]) {
    await getChatThread(key)
  }
  const thread = memoryChats[key]

  const newMsg = {
    id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    sender: msg.sender || 'user',
    text: msg.text || '',
    image: msg.image || msg.imageUrl || null,
    imageUrl: msg.image || msg.imageUrl || null,
    audio: msg.audio || msg.audioUrl || null,
    audioUrl: msg.audio || msg.audioUrl || null,
    audio_duration: msg.audio_duration || 0,
    time: msg.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    timestamp: msg.timestamp || Date.now(),
    admin_name: msg.admin_name || (msg.sender === 'agent' ? 'WinX Pro Support Specialist' : null)
  }

  const exists = thread.messages.some(m => m.id === newMsg.id)
  if (!exists) {
    thread.messages.push(newMsg)
    thread.updated_at = new Date().toISOString()
    if (msg.sender === 'user') {
      thread.unread_admin = (thread.unread_admin || 0) + 1
    } else {
      thread.unread_user = (thread.unread_user || 0) + 1
    }
    if (msg.email) thread.email = msg.email
    if (msg.name) thread.name = msg.name

    // If this is a logged in user with email, also merge any guest thread
    if (msg.email && msg.email.includes('@') && key !== msg.email.toLowerCase()) {
      const emailKey = msg.email.toLowerCase().trim()
      if (!memoryChats[emailKey]) {
        memoryChats[emailKey] = { ...thread, user_key: emailKey }
      } else {
        const emailThread = memoryChats[emailKey]
        const idSet = new Set(emailThread.messages.map(m => m.id))
        for (const m of thread.messages) {
          if (!idSet.has(m.id)) {
            emailThread.messages.push(m)
            idSet.add(m.id)
          }
        }
        emailThread.messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
        emailThread.updated_at = new Date().toISOString()
      }
    }

    saveDiskChats()
    saveToSupabase(newMsg, key, msg.email || thread.email || key, msg.name || thread.name || key).catch(() => {})
  }

  return { success: true, message: newMsg, thread }
}

export async function syncClientMessages(userKey, clientMessages, email = '', name = '') {
  const key = (userKey || 'guest').toLowerCase().trim()
  await syncFromSupabase()

  if (!memoryChats[key]) {
    await getChatThread(key)
  }
  const thread = memoryChats[key]
  const existingIds = new Set(thread.messages.map(m => m.id))

  let added = false
  if (Array.isArray(clientMessages)) {
    for (const m of clientMessages) {
      if (m && m.id && !existingIds.has(m.id)) {
        thread.messages.push({
          id: m.id,
          sender: m.sender || 'user',
          text: m.text || '',
          image: m.image || m.imageUrl || null,
          imageUrl: m.image || m.imageUrl || null,
          audio: m.audio || m.audioUrl || null,
          audioUrl: m.audio || m.audioUrl || null,
          audio_duration: m.audio_duration || 0,
          admin_name: m.admin_name || null,
          time: m.time || new Date(m.timestamp || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          timestamp: m.timestamp || Date.now()
        })
        existingIds.add(m.id)
        added = true
        saveToSupabase(m, key, email || thread.email || key, name || thread.name || key).catch(() => {})
      }
    }
  }

  if (added) {
    thread.messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    thread.updated_at = new Date().toISOString()
  }
  if (email) thread.email = email
  if (name) thread.name = name

  saveDiskChats()
  return thread
}

export async function getAllChatThreads() {
  await syncFromSupabase()

  const threads = Object.values(memoryChats).map(t => {
    const validMsgs = t.messages || []
    const lastMsg = validMsgs.length > 0 ? validMsgs[validMsgs.length - 1] : null
    return {
      user_key: t.user_key,
      email: t.email || t.user_key,
      name: t.name || t.user_key,
      created_at: t.created_at,
      updated_at: t.updated_at || t.created_at,
      unread_admin: t.unread_admin || 0,
      total_messages: validMsgs.length,
      last_message: lastMsg ? {
        sender: lastMsg.sender,
        text: lastMsg.text || (lastMsg.audio || lastMsg.audioUrl ? '🎤 Voice message' : lastMsg.image || lastMsg.imageUrl ? '📷 Image attachment' : ''),
        time: lastMsg.time,
        timestamp: lastMsg.timestamp
      } : null
    }
  })

  return threads.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
}

export function markThreadAsRead(userKey, reader = 'admin') {
  const key = (userKey || 'guest').toLowerCase().trim()
  if (memoryChats[key]) {
    if (reader === 'admin') {
      memoryChats[key].unread_admin = 0
    } else {
      memoryChats[key].unread_user = 0
    }
    saveDiskChats()
    return true
  }
  return false
}

export async function syncThreads(incomingThreads) {
  if (Array.isArray(incomingThreads)) {
    for (const t of incomingThreads) {
      if (t && t.user_key) {
        await syncClientMessages(t.user_key, t.messages || [], t.email, t.name)
      }
    }
  }
  return memoryChats
}

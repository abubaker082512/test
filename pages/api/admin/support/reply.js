import { saveChatMessage, getChatThread, markThreadAsRead } from '../../../../utils/chatStore'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_key, text, image, audio, audio_duration, admin_name } = req.body
  if (!user_key) return res.status(400).json({ error: 'Missing user_key' })

  if (!text && !image && !audio) {
    return res.status(400).json({ error: 'Message content cannot be empty' })
  }

  const result = await saveChatMessage(user_key, {
    sender: 'agent',
    admin_name: admin_name || 'WinX Pro VIP Support Agent',
    text,
    image,
    audio,
    audio_duration
  })

  markThreadAsRead(user_key, 'admin')

  return res.status(200).json({ success: true, message: result.message, thread: result.thread, messages: result.thread.messages })
}

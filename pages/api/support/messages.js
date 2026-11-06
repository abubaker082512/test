import { getChatThread, saveChatMessage, markThreadAsRead } from '../../../utils/chatStore'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { user_key } = req.query
    if (!user_key) return res.status(400).json({ error: 'Missing user_key' })
    const thread = getChatThread(user_key)
    markThreadAsRead(user_key, 'user')
    return res.status(200).json({ success: true, thread, messages: thread.messages })
  }

  if (req.method === 'POST') {
    const { user_key, email, name, text, image, audio, audio_duration } = req.body
    if (!user_key) return res.status(400).json({ error: 'Missing user_key' })

    if (!text && !image && !audio) {
      return res.status(400).json({ error: 'Empty message' })
    }

    const result = saveChatMessage(user_key, {
      sender: 'user',
      email: email || user_key,
      name: name || user_key,
      text,
      image,
      audio,
      audio_duration
    })

    return res.status(200).json({ success: true, message: result.message, messages: result.thread.messages })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

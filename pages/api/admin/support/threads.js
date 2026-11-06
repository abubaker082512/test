import { getAllChatThreads, getChatThread, markThreadAsRead } from '../../../../utils/chatStore'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { user_key } = req.query
    if (user_key) {
      const thread = getChatThread(user_key)
      markThreadAsRead(user_key, 'admin')
      return res.status(200).json({ success: true, thread, messages: thread.messages })
    }

    const threads = getAllChatThreads()
    return res.status(200).json({ success: true, threads })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

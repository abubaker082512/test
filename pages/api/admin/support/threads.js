import { getAllChatThreads, getChatThread, markThreadAsRead, syncThreads } from '../../../../utils/chatStore'

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
    if (user_key) {
      const thread = await getChatThread(user_key)
      markThreadAsRead(user_key, 'admin')
      return res.status(200).json({ success: true, thread, messages: thread.messages })
    }

    const threads = await getAllChatThreads()
    return res.status(200).json({ success: true, threads })
  }

  if (req.method === 'POST') {
    const { sync_threads } = req.body
    if (Array.isArray(sync_threads) || (sync_threads && typeof sync_threads === 'object')) {
      await syncThreads(sync_threads)
    }
    const threads = await getAllChatThreads()
    return res.status(200).json({ success: true, threads })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

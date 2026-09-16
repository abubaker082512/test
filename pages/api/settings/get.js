import { getPersistedSettings } from '../../../utils/settingsStore'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const settings = getPersistedSettings()
  return res.status(200).json({
    success: true,
    ...settings
  })
}

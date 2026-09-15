import { betstack } from '../../../utils/betstackClient'

export default async function handler(req, res) {
  try {
    const active = req.query.active !== 'false';
    const sports = await betstack.getSports(active);
    return res.status(200).json({ success: true, sports });
  } catch (error) {
    console.error('BetStack Sports API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

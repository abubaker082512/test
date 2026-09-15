import { betstack } from '../../../utils/betstackClient'

export default async function handler(req, res) {
  try {
    const params = {};
    if (req.query.league_key) params.league_key = req.query.league_key;
    if (req.query.status) params.status = req.query.status;
    if (req.query.north_american) params.north_american = req.query.north_american;
    if (req.query.date) params.date = req.query.date;

    const events = await betstack.getEvents(params);
    return res.status(200).json({ success: true, events });
  } catch (error) {
    console.error('BetStack Events API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

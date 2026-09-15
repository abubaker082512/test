import { betstack } from '../../../utils/betstackClient'

export default async function handler(req, res) {
  try {
    const params = {};
    if (req.query.event_id) params.event_id = req.query.event_id;
    if (req.query.league_key) params.league_key = req.query.league_key;
    if (req.query.north_american) params.north_american = req.query.north_american;
    if (req.query.bookmaker_key) params.bookmaker_key = req.query.bookmaker_key;
    if (req.query.date) params.date = req.query.date;

    const lines = await betstack.getLines(params);
    return res.status(200).json({ success: true, lines });
  } catch (error) {
    console.error('BetStack Lines API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

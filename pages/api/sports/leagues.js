import { betstack } from '../../../utils/betstackClient'

export default async function handler(req, res) {
  try {
    const params = {};
    if (req.query.sport_id) params.sport_id = req.query.sport_id;
    if (req.query.active) params.active = req.query.active;
    if (req.query.north_american) params.north_american = req.query.north_american;

    const leagues = await betstack.getLeagues(params);
    return res.status(200).json({ success: true, leagues });
  } catch (error) {
    console.error('BetStack Leagues API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

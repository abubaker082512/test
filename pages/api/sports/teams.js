import { betstack } from '../../../utils/betstackClient'

export default async function handler(req, res) {
  try {
    const params = {};
    if (req.query.league_key) params.league_key = req.query.league_key;
    if (req.query.active !== undefined) params.active = req.query.active;

    const teams = await betstack.getTeams(params);
    return res.status(200).json({ success: true, teams });
  } catch (error) {
    console.error('BetStack Teams API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

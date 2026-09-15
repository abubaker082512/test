import RainbowRichesClient from '../../../utils/rainbowRichesClient.js';

const RR = new RainbowRichesClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { game_id } = req.query;
  try {
    const data = await RR.getGameInfo(game_id || 'rr-pots-of-gold');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

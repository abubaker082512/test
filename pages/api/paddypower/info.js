import PaddyPowerClient from '../../../utils/paddyPowerClient';

const PADDY = new PaddyPowerClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { game_id } = req.query;
  if (!game_id) {
    return res.status(400).json({ error: 'Missing game_id parameter' });
  }

  try {
    const info = await PADDY.getGameInfo(game_id);
    return res.status(200).json({
      ok: true,
      data: info
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

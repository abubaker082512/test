import RainbowRichesClient from '../../../utils/rainbowRichesClient.js';

const RR = new RainbowRichesClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const games = await RR.getGameList();
    return res.status(200).json({
      ok: true,
      provider: 'RainbowRiches',
      games
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

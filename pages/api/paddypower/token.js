import PaddyPowerClient from '../../../utils/paddyPowerClient';

const PADDY = new PaddyPowerClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const data = await PADDY.getToken();
    return res.status(200).json({
      ok: true,
      data
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

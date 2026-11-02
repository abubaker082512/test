import { getFreeToGameDetails } from '../../../utils/freeToGameClient';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ ok: false, success: false, error: 'Missing game ID parameter' });
  }

  try {
    const game = await getFreeToGameDetails(id);

    if (!game) {
      return res.status(404).json({ ok: false, success: false, error: 'Game not found' });
    }

    return res.status(200).json({
      ok: true,
      success: true,
      data: game,
      game
    });
  } catch (error) {
    console.error(`Error fetching game ${id}:`, error);
    return res.status(500).json({
      ok: false,
      success: false,
      error: 'Failed to retrieve game details'
    });
  }
}

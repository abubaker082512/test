import { getFreeToGames } from '../../../utils/freeToGameClient';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');

  const { platform, category, sortBy, search, limit = 36, page = 1 } = req.query;

  try {
    const allGames = await getFreeToGames({
      platform: platform ? String(platform) : undefined,
      category: category ? String(category) : undefined,
      sortBy: sortBy ? String(sortBy) : undefined,
      search: search ? String(search) : undefined
    });

    const parsedLimit = Math.min(Math.max(Number(limit) || 36, 1), 200);
    const parsedPage = Math.max(Number(page) || 1, 1);
    const startIndex = (parsedPage - 1) * parsedLimit;
    const paginated = allGames.slice(startIndex, startIndex + parsedLimit);

    return res.status(200).json({
      ok: true,
      success: true,
      count: paginated.length,
      total: allGames.length,
      page: parsedPage,
      data: paginated,
      games: paginated
    });
  } catch (error) {
    console.error('Error serving FreeToGame games:', error);
    return res.status(500).json({
      ok: false,
      success: false,
      error: 'Failed to retrieve FreeToGame games'
    });
  }
}

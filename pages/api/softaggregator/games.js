// API Endpoint: /api/softaggregator/games
// Returns cached list of SoftAggregator games with optional filtering by provider or game_type

import { getGameList } from '../../../utils/softAggregatorClient.js';

export default async function handler(req, res) {
  const { provider, game_type, search, limit = 60, offset = 0, featured = false } = req.query;

  try {
    const listRes = await getGameList(false);
    if (!listRes || listRes.error !== 0 || !Array.isArray(listRes.response)) {
      return res.status(200).json({
        success: false,
        error: listRes?.message || 'Failed to fetch games from SoftAggregator',
        games: []
      });
    }

    let games = listRes.response;

    // Filter by provider
    if (provider && provider !== 'all') {
      const pLower = provider.toLowerCase();
      games = games.filter(g => g.provider && g.provider.toLowerCase() === pLower);
    }

    // Filter by game_type (slots, live, crash, table, instant, etc.)
    if (game_type && game_type !== 'all') {
      const tLower = game_type.toLowerCase();
      games = games.filter(g => g.game_type && g.game_type.toLowerCase() === tLower);
    }

    // Filter by search query
    if (search && search.trim()) {
      const sLower = search.trim().toLowerCase();
      games = games.filter(g =>
        (g.name && g.name.toLowerCase().includes(sLower)) ||
        (g.provider_name && g.provider_name.toLowerCase().includes(sLower)) ||
        (g.id_hash && g.id_hash.toLowerCase().includes(sLower))
      );
    }

    const total = games.length;
    const start = parseInt(offset, 10) || 0;
    const count = parseInt(limit, 10) || 60;
    const paged = games.slice(start, start + count);

    return res.status(200).json({
      success: true,
      total,
      count: paged.length,
      offset: start,
      games: paged.map(g => ({
        id: g.id_hash,
        id_hash: g.id_hash,
        title: g.name,
        name: g.name,
        provider: g.provider,
        provider_name: g.provider_name,
        provider_logo: g.provider_logo,
        game_type: g.game_type,
        category: g.game_type || g.category,
        imageUrl: g.image_portrait || g.image || g.image_square,
        image: g.image,
        image_portrait: g.image_portrait,
        image_square: g.image_square,
        play_for_fun: g.play_for_fun_supported
      }))
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      games: []
    });
  }
}

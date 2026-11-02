import betnexCatalog from '../../data/betnexCatalog.json';
import freeToGameCatalog from '../../data/freeToGameCatalog.json';

const COMBINED_CATALOG = [...betnexCatalog, ...freeToGameCatalog];

export default async function handler(req, res) {
  // Edge cache for 1 hour, stale-while-revalidate for 24 hours
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  const { category, provider, search, limit = 36, page = 1 } = req.query;

  let filtered = COMBINED_CATALOG;

  if (category) {
    const catLower = String(category).toLowerCase();
    if (catLower === 'hot') {
      filtered = COMBINED_CATALOG.filter(g => g.recommended || g.badge === 'Top Pick' || g.badge === 'Hot' || g.badge === '⚡ Instant');
    } else if (catLower === 'free games' || catLower === 'free' || catLower === 'freetogame') {
      filtered = freeToGameCatalog;
    } else if (catLower === 'slots') {
      filtered = betnexCatalog.filter(g => g.category === 'Slots');
    } else if (catLower === 'live') {
      filtered = betnexCatalog.filter(g => g.category === 'Live');
    } else if (catLower === 'crash') {
      filtered = betnexCatalog.filter(g => g.category === 'Crash');
    } else if (catLower === 'mini games' || catLower === 'mini') {
      filtered = COMBINED_CATALOG.filter(g => g.category === 'Mini Games' || g.category === 'Crash' || (g.isFreeGame && g.platform && g.platform.includes('Browser')));
    } else if (catLower === 'fishing') {
      filtered = betnexCatalog.filter(g => g.category === 'Fishing');
    } else if (catLower === 'cards') {
      filtered = COMBINED_CATALOG.filter(g => g.category === 'Cards' || (g.genre && g.genre.toLowerCase().includes('card')));
    } else if (catLower === 'sports') {
      filtered = COMBINED_CATALOG.filter(g => g.category === 'Sports' || (g.genre && g.genre.toLowerCase().includes('sports')));
    } else if (catLower === 'strategy') {
      filtered = freeToGameCatalog.filter(g => (g.genre && g.genre.toLowerCase().includes('strategy')));
    } else if (catLower === 'shooter') {
      filtered = freeToGameCatalog.filter(g => (g.genre && g.genre.toLowerCase().includes('shooter')));
    } else {
      filtered = COMBINED_CATALOG.filter(g => (g.category && g.category.toLowerCase() === catLower) || (g.genre && g.genre.toLowerCase() === catLower));
    }
  }

  if (provider) {
    const provLower = String(provider).toLowerCase();
    filtered = filtered.filter(g => 
      (g.provider && g.provider.toLowerCase().includes(provLower)) || 
      (g.rawProvider && g.rawProvider.toLowerCase().includes(provLower))
    );
  }

  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(g => 
      (g.title && g.title.toLowerCase().includes(q)) || 
      (g.provider && g.provider.toLowerCase().includes(q)) ||
      (g.genre && g.genre.toLowerCase().includes(q))
    );
  }

  const parsedLimit = Math.min(Math.max(Number(limit) || 36, 1), 200);
  const parsedPage = Math.max(Number(page) || 1, 1);
  const startIndex = (parsedPage - 1) * parsedLimit;
  const paginated = filtered.slice(startIndex, startIndex + parsedLimit);

  res.status(200).json({
    ok: true,
    success: true,
    count: paginated.length,
    total: filtered.length,
    page: parsedPage,
    data: paginated,
    games: paginated
  });
}

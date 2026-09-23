import betnexCatalog from '../../data/betnexCatalog.json';

export default async function handler(req, res) {
  // Edge cache for 1 hour, stale-while-revalidate for 24 hours
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  const { category, provider, search, limit = 36, page = 1 } = req.query;

  let filtered = betnexCatalog;

  if (category) {
    const catLower = String(category).toLowerCase();
    if (catLower === 'hot') {
      filtered = betnexCatalog.filter(g => g.recommended || g.badge === 'Top Pick' || g.badge === 'Hot');
    } else if (catLower === 'slots') {
      filtered = betnexCatalog.filter(g => g.category === 'Slots');
    } else if (catLower === 'live') {
      filtered = betnexCatalog.filter(g => g.category === 'Live');
    } else if (catLower === 'crash') {
      filtered = betnexCatalog.filter(g => g.category === 'Crash');
    } else if (catLower === 'mini games' || catLower === 'mini') {
      filtered = betnexCatalog.filter(g => g.category === 'Mini Games' || g.category === 'Crash');
    } else if (catLower === 'fishing') {
      filtered = betnexCatalog.filter(g => g.category === 'Fishing');
    } else if (catLower === 'cards') {
      filtered = betnexCatalog.filter(g => g.category === 'Cards');
    } else if (catLower === 'sports') {
      filtered = betnexCatalog.filter(g => g.category === 'Sports');
    } else {
      filtered = betnexCatalog.filter(g => g.category.toLowerCase() === catLower);
    }
  }

  if (provider) {
    const provLower = String(provider).toLowerCase();
    filtered = filtered.filter(g => 
      g.provider.toLowerCase().includes(provLower) || 
      (g.rawProvider && g.rawProvider.toLowerCase().includes(provLower))
    );
  }

  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(g => 
      g.title.toLowerCase().includes(q) || 
      g.provider.toLowerCase().includes(q)
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

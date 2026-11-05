// Unified /api/games endpoint powered exclusively by SoftAggregator 11,200+ Games
import softCatalog from '../../data/softaggregator_catalog.json';

// Build a unified flat list of SoftAggregator games
const ALL_SOFT_GAMES = [
  ...(softCatalog?.hots || []),
  ...(softCatalog?.jili || []),
  ...(softCatalog?.pgsoft || []),
  ...(softCatalog?.spribe || []),
  ...(softCatalog?.pragmaticplay || []),
  ...(softCatalog?.hacksawgaming || []),
  ...(softCatalog?.nolimitcity || []),
  ...(softCatalog?.playngo || []),
  ...(softCatalog?.kagaming || []),
  ...(softCatalog?.relaxgaming || []),
  ...(softCatalog?.greentube || []),
  ...(softCatalog?.egt || []),
  ...(softCatalog?.netent || [])
].map(g => ({
  id: g.id_hash,
  slug: g.id_hash,
  id_hash: g.id_hash,
  title: g.name,
  name: g.name,
  provider: g.provider_name || g.provider || 'SoftAggregator',
  rawProvider: g.provider || '',
  imageUrl: g.image_portrait || g.image || g.image_square,
  img: g.image_portrait || g.image || g.image_square,
  category: g.game_type || 'Slots',
  badge: 'Hot'
}));

// Deduplicate by ID
const UNIQUE_GAMES = [];
const seenIds = new Set();
for (const g of ALL_SOFT_GAMES) {
  if (g.id && !seenIds.has(g.id)) {
    seenIds.add(g.id);
    UNIQUE_GAMES.push(g);
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  const { category, provider, search, limit = 36, page = 1 } = req.query;

  let filtered = UNIQUE_GAMES;

  if (provider) {
    const provLower = String(provider).toLowerCase();
    filtered = filtered.filter(g =>
      (g.provider && g.provider.toLowerCase().includes(provLower)) ||
      (g.rawProvider && g.rawProvider.toLowerCase().includes(provLower))
    );
  }

  if (category) {
    const catLower = String(category).toLowerCase().trim();
    if (catLower === 'hot' || catLower === 'hots') {
      filtered = softCatalog?.hots?.map(g => ({
        id: g.id_hash,
        slug: g.id_hash,
        id_hash: g.id_hash,
        title: g.name,
        name: g.name,
        provider: g.provider_name || g.provider,
        imageUrl: g.image_portrait || g.image,
        category: g.game_type || 'Slots',
        badge: 'Hot'
      })) || filtered;
    } else if (catLower === 'crash') {
      filtered = filtered.filter(g => (g.category && g.category.toLowerCase().includes('crash')) || (g.rawProvider && g.rawProvider.includes('spribe')));
    } else if (catLower === 'slots') {
      filtered = filtered.filter(g => !g.category || g.category.toLowerCase().includes('slot'));
    }
  }

  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(g =>
      (g.title && g.title.toLowerCase().includes(q)) ||
      (g.provider && g.provider.toLowerCase().includes(q))
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

import ourGamesCatalog from '../../data/ourGamesCatalog.json';
import betnexCatalog from '../../data/betnexCatalog.json';
import freeToGameCatalog from '../../data/freeToGameCatalog.json';

const COMBINED_CATALOG = [...ourGamesCatalog, ...betnexCatalog, ...freeToGameCatalog];

export default async function handler(req, res) {
  // Edge cache for 1 hour, stale-while-revalidate for 24 hours
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  const { category, provider, search, limit = 36, page = 1 } = req.query;

  let filtered = COMBINED_CATALOG;

  if (category) {
    const catLower = String(category).toLowerCase().trim();
    if (catLower === 'hot') {
      filtered = COMBINED_CATALOG.filter(g => g.recommended || g.isOurGame || g.badge === 'Top Pick' || g.badge === 'Hot' || g.badge === '⚡ Instant');
    } else if (catLower === 'our games' || catLower === 'our-games' || catLower === 'originals' || catLower === 'winx') {
      filtered = ourGamesCatalog;
    } else if (catLower === 'free games' || catLower === 'free' || catLower === 'freetogame') {
      filtered = freeToGameCatalog;
    } else if (catLower === 'slots') {
      filtered = [
        ...ourGamesCatalog.filter(g => g.gameType === 'slots'),
        ...betnexCatalog.filter(g => g.category === 'Slots')
      ];
    } else if (catLower === 'live') {
      filtered = [
        ...ourGamesCatalog.filter(g => g.gameType === 'roulette' || g.gameType === 'baccarat' || g.gameType === 'wheel'),
        ...betnexCatalog.filter(g => g.category === 'Live')
      ];
    } else if (catLower === 'crash') {
      filtered = [
        ...ourGamesCatalog.filter(g => g.gameType === 'crash' || g.gameType === 'limbo'),
        ...betnexCatalog.filter(g => g.category === 'Crash')
      ];
    } else if (catLower === 'mini games' || catLower === 'mini') {
      filtered = [
        ...ourGamesCatalog.filter(g => g.gameType === 'mines' || g.gameType === 'plinko' || g.gameType === 'coinflip' || g.gameType === 'limbo' || g.gameType === 'hilo'),
        ...COMBINED_CATALOG.filter(g => g.category === 'Mini Games' || (g.isFreeGame && g.platform && g.platform.includes('Browser')))
      ];
    } else if (catLower === 'fishing') {
      filtered = [
        ...ourGamesCatalog.filter(g => g.gameType === 'fishing'),
        ...betnexCatalog.filter(g => g.category === 'Fishing')
      ];
    } else if (catLower === 'cards') {
      filtered = [
        ...ourGamesCatalog.filter(g => g.gameType === 'blackjack' || g.gameType === 'dragontiger' || g.gameType === 'baccarat' || g.gameType === 'videopoker' || g.gameType === 'hilo'),
        ...COMBINED_CATALOG.filter(g => g.category === 'Cards' || (g.genre && g.genre.toLowerCase().includes('card')))
      ];
    } else if (catLower === 'sports') {
      filtered = [
        ...ourGamesCatalog.filter(g => g.gameType === 'penalty' || g.gameType === 'derby'),
        ...COMBINED_CATALOG.filter(g => g.category === 'Sports' || (g.genre && g.genre.toLowerCase().includes('sports')))
      ];
    } else if (catLower === 'strategy') {
      filtered = freeToGameCatalog.filter(g => (g.genre && g.genre.toLowerCase().includes('strategy')));
    } else if (catLower === 'shooter') {
      filtered = freeToGameCatalog.filter(g => (g.genre && g.genre.toLowerCase().includes('shooter')));
    } else {
      filtered = COMBINED_CATALOG.filter(g => 
        (g.category && g.category.toLowerCase() === catLower) || 
        (g.genre && g.genre.toLowerCase() === catLower)
      );
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

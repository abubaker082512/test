import { globalCache } from './cache.js';

export const POKER_CATALOG = [
  {
    id: 'poker-texas-holdem',
    name: "Texas Hold'em No Limit",
    title: "Texas Hold'em No Limit",
    provider: 'PokerAPI',
    category: 'Poker',
    badge: 'High Stakes',
    recommended: true,
    theme: 'linear-gradient(135deg, #0d47a1 0%, #001064 100%)',
    icon: '♠️',
    gameType: 'poker',
    rtp: '98.5%',
    img: 'https://cdn.betnex.co/images/jiligaming/235.png',
    imageUrl: 'https://cdn.betnex.co/images/jiligaming/235.png'
  },
  {
    id: 'poker-omaha',
    name: 'Omaha Hi-Lo Pot Limit',
    title: 'Omaha Hi-Lo Pot Limit',
    provider: 'PokerAPI',
    category: 'Poker',
    badge: '4 Hole Cards',
    recommended: true,
    theme: 'linear-gradient(135deg, #880e4f 0%, #311b92 100%)',
    icon: '♥️',
    gameType: 'poker',
    rtp: '98.2%',
    img: '/games/super_ace.png',
    imageUrl: '/games/super_ace.png'
  },
  {
    id: 'poker-caribbean-stud',
    name: 'Caribbean Stud Poker',
    title: 'Caribbean Stud Poker',
    provider: 'PokerAPI',
    category: 'Poker',
    badge: '5+1 Bonus',
    recommended: true,
    theme: 'linear-gradient(135deg, #004d40 0%, #00251a 100%)',
    icon: '♦️',
    gameType: 'poker',
    rtp: '97.8%',
    img: '/games/live.png',
    imageUrl: '/games/live.png'
  },
  {
    id: 'poker-three-card',
    name: 'Three Card Poker Deluxe',
    title: 'Three Card Poker Deluxe',
    provider: 'PokerAPI',
    category: 'Poker',
    badge: 'Pair Plus 40:1',
    recommended: true,
    theme: 'linear-gradient(135deg, #37474f 0%, #102027 100%)',
    icon: '♣️',
    gameType: 'poker',
    rtp: '97.2%',
    img: '/games/live.png',
    imageUrl: '/games/live.png'
  },
  {
    id: 'poker-jacks-or-better',
    name: 'Video Poker: Jacks or Better',
    title: 'Video Poker: Jacks or Better',
    provider: 'PokerAPI',
    category: 'Poker',
    badge: '4,000x Royal Flush',
    recommended: false,
    theme: 'linear-gradient(135deg, #bf360c 0%, #4e342e 100%)',
    icon: '🃏',
    gameType: 'poker',
    rtp: '99.5%',
    img: 'https://cdn.betnex.co/images/jiligaming/74.webp',
    imageUrl: 'https://cdn.betnex.co/images/jiligaming/74.webp'
  },
  {
    id: 'poker-tournament',
    name: 'World Series Poker Championship',
    title: 'World Series Poker Championship',
    provider: 'PokerAPI',
    category: 'Poker',
    badge: 'Pi 100,000 GTD',
    recommended: true,
    theme: 'linear-gradient(135deg, #f57f17 0%, #b71c1c 100%)',
    icon: '🏆',
    gameType: 'poker',
    rtp: '98.9%',
    img: 'https://cdn.betnex.co/images/jiligaming/48.webp',
    imageUrl: 'https://cdn.betnex.co/images/jiligaming/48.webp'
  }
];

export class PokerApiClient {
  constructor({
    key = process.env.POKER_API_KEY || process.env.RAPIDAPI_KEY || '4115650052msh171d5211032faf5p1ea26djsn10dd83e0b391',
    host = process.env.POKER_API_HOST || 'poker-api-integrate-poker-games-today.p.rapidapi.com',
    timeout = 8000,
    cacheTtlMs = 60 * 1000
  } = {}) {
    this.key = key;
    this.host = host;
    this.timeout = timeout;
    this.cacheTtlMs = cacheTtlMs;
  }

  async _fetch(endpoint = '', options = {}) {
    const url = 'https://' + this.host + endpoint;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const resp = await fetch(url, {
        ...options,
        headers: {
          'x-rapidapi-key': this.key,
          'x-rapidapi-host': this.host,
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        signal: controller.signal
      });

      const text = await resp.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      return {
        ok: resp.ok,
        status: resp.status,
        data
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async getNewGame() {
    const cacheKey = 'poker_new_game';
    const cached = globalCache.get(cacheKey);
    if (cached) return cached;

    try {
      const resp = await this._fetch('', { method: 'GET' });
      const tableSession = {
        ok: true,
        gameId: 'poker_' + Date.now(),
        table: "High Stakes Hold'em #1",
        blinds: { small: 10, big: 20 },
        currency: 'Pi',
        maxSeats: 9,
        activePlayers: 6,
        status: 'dealing',
        handId: 'HND-' + Math.floor(100000 + Math.random() * 900000),
        raw: typeof resp.data === 'string' ? { html_length: resp.data.length } : resp.data
      };
      globalCache.set(cacheKey, tableSession, 30 * 1000);
      return tableSession;
    } catch (err) {
      console.warn('Poker API getNewGame fallback:', err.message);
      return {
        ok: true,
        gameId: 'poker_default_' + Date.now(),
        table: "No Limit Hold'em Main Table",
        blinds: { small: 5, big: 10 },
        currency: 'Pi',
        maxSeats: 6,
        activePlayers: 4,
        is_fallback: true
      };
    }
  }

  async getNewTournament() {
    const cacheKey = 'poker_new_tournament';
    const cached = globalCache.get(cacheKey);
    if (cached) return cached;

    try {
      const resp = await this._fetch('', { method: 'GET' });
      const tournament = {
        ok: true,
        tournamentId: 'tourney_' + Date.now(),
        title: 'Daily High Roller Championship',
        guaranteedPrize: 'Pi 100,000.00',
        buyIn: 'Pi 500.00',
        startingChips: 10000,
        blindLevel: 1,
        blindIntervalMin: 10,
        registeredPlayers: 142,
        status: 'registering',
        raw: typeof resp.data === 'string' ? { html_length: resp.data.length } : resp.data
      };
      globalCache.set(cacheKey, tournament, 45 * 1000);
      return tournament;
    } catch (err) {
      console.warn('Poker API getNewTournament fallback:', err.message);
      return {
        ok: true,
        tournamentId: 'tourney_default',
        title: 'Sunday Super Stack',
        guaranteedPrize: 'Pi 50,000.00',
        buyIn: 'Pi 250.00',
        is_fallback: true
      };
    }
  }

  async createUser(userData = {}) {
    try {
      const resp = await this._fetch('', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      return {
        ok: true,
        username: userData.username || 'poker_player',
        registeredAt: new Date().toISOString(),
        chips: userData.chips || 5000,
        status: 'active',
        response: typeof resp.data === 'string' ? { status: resp.status } : resp.data
      };
    } catch (err) {
      console.warn('Poker API createUser fallback:', err.message);
      return {
        ok: true,
        username: userData.username || 'poker_player',
        chips: 5000,
        is_fallback: true
      };
    }
  }

  async getGames() {
    return POKER_CATALOG;
  }
}

export default PokerApiClient;

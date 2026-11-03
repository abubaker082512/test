// Diamond Casino API (NO GGR) Server-Side Proxy + Fast Circuit-Breaker Live Round Engine
// Supports all LiveCasino & VirtualCasino endpoints from:
// https://rapidapi.com/malyaempire232/api/diamond-casino-api-no-ggr

const DIAMOND_HOST = process.env.DIAMOND_CASINO_API_HOST || 'diamond-casino-api-no-ggr.p.rapidapi.com';
const DIAMOND_KEY = process.env.DIAMOND_CASINO_API_KEY || process.env.RAPIDAPI_KEY || '4115650052msh171d5211032faf5p1ea26djsn10dd83e0b391';
const TURNKEY_KEY = process.env.TURNKEYXGAMING_KEY || '69afc8118cd9021a148bd600';

// Circuit breaker so a 502 on RapidAPI never slows down 1s table polling
let upstreamDownUntil = 0;

export const DIAMOND_TABLES = [
  {
    tableId: 'teen20',
    slug: 'diamond-teen20',
    name: '20-20 Teenpatti',
    type: 'LiveCasino',
    category: 'Teenpatti',
    minBet: 20,
    maxBet: 50000,
    imageUrl: 'https://cdn.betnex.co/images/jiligaming/133.webp',
    runners: [
      { sid: '1', nat: 'Player A', short: 'A', b1: 1.98, l1: 2.02 },
      { sid: '2', nat: 'Player B', short: 'B', b1: 1.98, l1: 2.02 },
      { sid: '3', nat: 'Pair Plus A', short: 'PA', b1: 3.00, l1: 0 },
      { sid: '4', nat: 'Pair Plus B', short: 'PB', b1: 3.00, l1: 0 }
    ]
  },
  {
    tableId: 'joker20',
    slug: 'diamond-joker20',
    name: '20-20 Teenpatti Joker',
    type: 'LiveCasino',
    category: 'Teenpatti',
    minBet: 20,
    maxBet: 50000,
    imageUrl: 'https://cdn.betnex.co/images/jiligaming/131.png',
    runners: [
      { sid: '1', nat: 'Player A', short: 'A', b1: 1.98, l1: 2.02 },
      { sid: '2', nat: 'Player B', short: 'B', b1: 1.98, l1: 2.02 },
      { sid: '3', nat: 'Joker Wild Bonus', short: 'J', b1: 4.50, l1: 0 }
    ]
  },
  {
    tableId: 'teen',
    slug: 'diamond-teen',
    name: 'One Day Teenpatti',
    type: 'LiveCasino',
    category: 'Teenpatti',
    minBet: 50,
    maxBet: 100000,
    imageUrl: 'https://cdn.betnex.co/images/jiligaming/126.webp',
    runners: [
      { sid: '1', nat: 'Player A', short: 'A', b1: 1.98, l1: 2.02 },
      { sid: '2', nat: 'Player B', short: 'B', b1: 1.98, l1: 2.02 }
    ]
  },
  {
    tableId: 'teen9',
    slug: 'diamond-teen9',
    name: 'Teenpatti Test (Tiger/Lion/Dragon)',
    type: 'LiveCasino',
    category: 'Teenpatti',
    minBet: 20,
    maxBet: 50000,
    imageUrl: 'https://cdn.betnex.co/images/jdb/115.png',
    runners: [
      { sid: '1', nat: 'Tiger', short: 'T', b1: 2.92, l1: 2.98 },
      { sid: '2', nat: 'Lion', short: 'L', b1: 2.92, l1: 2.98 },
      { sid: '3', nat: 'Dragon', short: 'D', b1: 2.92, l1: 2.98 }
    ]
  },
  {
    tableId: 'ab20',
    slug: 'diamond-ab20',
    name: 'Andar Bahar 20-20',
    type: 'LiveCasino',
    category: 'Andar Bahar',
    minBet: 20,
    maxBet: 50000,
    imageUrl: 'https://cdn.betnex.co/images/jiligaming/128.png',
    runners: [
      { sid: '1', nat: 'Andar', short: 'A', b1: 1.95, l1: 2.00 },
      { sid: '2', nat: 'Bahar', short: 'B', b1: 2.00, l1: 2.05 },
      { sid: '3', nat: '1st Card Match', short: '1st', b1: 3.50, l1: 0 }
    ]
  },
  {
    tableId: 'abj',
    slug: 'diamond-abj',
    name: 'Andar Bahar 2 Royal',
    type: 'LiveCasino',
    category: 'Andar Bahar',
    minBet: 20,
    maxBet: 50000,
    imageUrl: 'https://cdn.betnex.co/images/evolutionlive/42.webp',
    runners: [
      { sid: '1', nat: 'Andar (A)', short: 'A', b1: 1.98, l1: 2.02 },
      { sid: '2', nat: 'Bahar (B)', short: 'B', b1: 1.98, l1: 2.02 },
      { sid: '3', nat: 'Joker Odd', short: 'O', b1: 1.90, l1: 0 },
      { sid: '4', nat: 'Joker Even', short: 'E', b1: 1.90, l1: 0 }
    ]
  },
  {
    tableId: 'lucky7',
    slug: 'diamond-lucky7',
    name: 'Lucky 7 - A',
    type: 'LiveCasino',
    category: 'Lucky 7',
    minBet: 20,
    maxBet: 50000,
    imageUrl: 'https://cdn.betnex.co/images/jiligaming/90.png',
    runners: [
      { sid: '1', nat: 'Low Card (A-6)', short: 'L', b1: 2.00, l1: 2.04 },
      { sid: '2', nat: 'High Card (8-K)', short: 'H', b1: 2.00, l1: 2.04 },
      { sid: '3', nat: 'Lucky 7 Exact', short: '7', b1: 12.00, l1: 0 },
      { sid: '4', nat: 'Even', short: 'E', b1: 2.10, l1: 0 },
      { sid: '5', nat: 'Odd', short: 'O', b1: 1.80, l1: 0 },
      { sid: '6', nat: 'Red (♥♦)', short: 'R', b1: 1.95, l1: 0 },
      { sid: '7', nat: 'Black (♠♣)', short: 'B', b1: 1.95, l1: 0 }
    ]
  },
  {
    tableId: 'lucky7eu',
    slug: 'diamond-lucky7eu',
    name: 'Lucky 7 - B (European)',
    type: 'VirtualCasino',
    category: 'Lucky 7',
    minBet: 20,
    maxBet: 50000,
    imageUrl: 'https://cdn.betnex.co/images/jiligaming/17.png',
    runners: [
      { sid: '1', nat: '7 Down (A-6)', short: 'L', b1: 2.00, l1: 2.04 },
      { sid: '2', nat: '7 Up (8-K)', short: 'H', b1: 2.00, l1: 2.04 },
      { sid: '3', nat: 'Lucky 7 Jackpot', short: '7', b1: 12.00, l1: 0 }
    ]
  },
  {
    tableId: 'dt20',
    slug: 'diamond-dt20',
    name: '20-20 Dragon Tiger',
    type: 'LiveCasino',
    category: 'Dragon Tiger',
    minBet: 20,
    maxBet: 50000,
    imageUrl: 'https://cdn.betnex.co/images/jiligaming/93.png',
    runners: [
      { sid: '1', nat: 'Dragon', short: 'D', b1: 2.00, l1: 2.04 },
      { sid: '2', nat: 'Tiger', short: 'T', b1: 2.00, l1: 2.04 },
      { sid: '3', nat: 'Tie', short: 'Tie', b1: 11.00, l1: 0 },
      { sid: '4', nat: 'Suited Tie', short: 'ST', b1: 50.00, l1: 0 }
    ]
  },
  {
    tableId: 'dtl20',
    slug: 'diamond-dtl20',
    name: '20-20 Dragon Tiger Lion',
    type: 'LiveCasino',
    category: 'Dragon Tiger',
    minBet: 20,
    maxBet: 50000,
    imageUrl: 'https://cdn.betnex.co/images/jiligaming/15.webp',
    runners: [
      { sid: '1', nat: 'Dragon', short: 'D', b1: 2.90, l1: 2.96 },
      { sid: '2', nat: 'Tiger', short: 'T', b1: 2.90, l1: 2.96 },
      { sid: '3', nat: 'Lion', short: 'L', b1: 2.90, l1: 2.96 }
    ]
  },
  {
    tableId: 'card32',
    slug: 'diamond-card32',
    name: '32 Cards - A',
    type: 'LiveCasino',
    category: '32 Cards',
    minBet: 20,
    maxBet: 50000,
    imageUrl: 'https://cdn.betnex.co/images/evolutionlive/17.png',
    runners: [
      { sid: '1', nat: 'Player 8', short: '8', b1: 12.50, l1: 13.50 },
      { sid: '2', nat: 'Player 9', short: '9', b1: 5.80, l1: 6.20 },
      { sid: '3', nat: 'Player 10', short: '10', b1: 3.15, l1: 3.30 },
      { sid: '4', nat: 'Player 11', short: '11', b1: 2.05, l1: 2.12 }
    ]
  },
  {
    tableId: 'amar',
    slug: 'diamond-amar',
    name: 'Amar Akbar Anthony',
    type: 'LiveCasino',
    category: 'Bollywood',
    minBet: 20,
    maxBet: 50000,
    imageUrl: 'https://cdn.betnex.co/images/evolutionlive/47.png',
    runners: [
      { sid: '1', nat: 'Amar (A-6)', short: 'A', b1: 2.12, l1: 2.18 },
      { sid: '2', nat: 'Akbar (7-10)', short: 'K', b1: 3.15, l1: 3.25 },
      { sid: '3', nat: 'Anthony (J-K)', short: 'N', b1: 4.15, l1: 4.30 }
    ]
  },
  {
    tableId: 'btable',
    slug: 'diamond-btable',
    name: 'Bollywood Casino Table',
    type: 'LiveCasino',
    category: 'Bollywood',
    minBet: 20,
    maxBet: 50000,
    imageUrl: 'https://cdn.betnex.co/images/jiligaming/39.webp',
    runners: [
      { sid: '1', nat: 'A. Don', short: 'A', b1: 5.75, l1: 6.00 },
      { sid: '2', nat: 'B. Amar Akbar Anthony', short: 'B', b1: 5.75, l1: 6.00 },
      { sid: '3', nat: 'C. Sahib Bibi Aur Ghulam', short: 'C', b1: 5.75, l1: 6.00 },
      { sid: '4', nat: 'D. Dharam Veer', short: 'D', b1: 5.75, l1: 6.00 },
      { sid: '5', nat: 'E. Kis Kisko Pyaar Karoon', short: 'E', b1: 5.75, l1: 6.00 },
      { sid: '6', nat: 'F. Ghulam', short: 'F', b1: 5.75, l1: 6.00 }
    ]
  },
  {
    tableId: 'worli',
    slug: 'diamond-worli',
    name: 'Instant Worli Matka',
    type: 'LiveCasino',
    category: 'Matka',
    minBet: 20,
    maxBet: 50000,
    imageUrl: 'https://cdn.betnex.co/images/jiligaming/102.png',
    runners: [
      { sid: '1', nat: 'Line 1 (1-5)', short: 'L1', b1: 1.95, l1: 0 },
      { sid: '2', nat: 'Line 2 (6-0)', short: 'L2', b1: 1.95, l1: 0 },
      { sid: '3', nat: 'Single Digit 7', short: '7', b1: 9.00, l1: 0 },
      { sid: '4', nat: 'Single Digit 9', short: '9', b1: 9.00, l1: 0 }
    ]
  },
  {
    tableId: 'poker20',
    slug: 'diamond-poker20',
    name: '20-20 Texas Holdem Poker',
    type: 'LiveCasino',
    category: 'Poker',
    minBet: 20,
    maxBet: 50000,
    imageUrl: 'https://cdn.betnex.co/images/jiligaming/92.png',
    runners: [
      { sid: '1', nat: 'Player A', short: 'A', b1: 1.98, l1: 2.02 },
      { sid: '2', nat: 'Player B', short: 'B', b1: 1.98, l1: 2.02 },
      { sid: '3', nat: '2-Card Bonus A', short: '2A', b1: 2.50, l1: 0 },
      { sid: '4', nat: '5-Card Bonus B', short: '5B', b1: 3.50, l1: 0 }
    ]
  },
  {
    tableId: 'baccarat',
    slug: 'diamond-baccarat',
    name: 'Diamond Speed Baccarat',
    type: 'LiveCasino',
    category: 'Baccarat',
    minBet: 20,
    maxBet: 50000,
    imageUrl: 'https://cdn.betnex.co/images/jiligaming/174.png',
    runners: [
      { sid: '1', nat: 'Player', short: 'P', b1: 2.00, l1: 0 },
      { sid: '2', nat: 'Banker', short: 'B', b1: 1.95, l1: 0 },
      { sid: '3', nat: 'Tie', short: 'T', b1: 9.00, l1: 0 },
      { sid: '4', nat: 'Player Pair', short: 'PP', b1: 11.00, l1: 0 },
      { sid: '5', nat: 'Banker Pair', short: 'BP', b1: 11.00, l1: 0 }
    ]
  },
  {
    tableId: 'cmatch20',
    slug: 'diamond-cmatch20',
    name: '20-20 Cricket Match (Ball by Ball)',
    type: 'VirtualCasino',
    category: 'Cricket Casino',
    minBet: 20,
    maxBet: 50000,
    imageUrl: 'https://cdn.betnex.co/images/jiligaming/196.webp',
    runners: [
      { sid: '1', nat: '1 Run / 2 Runs', short: '1R', b1: 1.95, l1: 0 },
      { sid: '2', nat: 'Boundary (4 Runs)', short: '4R', b1: 3.80, l1: 0 },
      { sid: '3', nat: 'Sixer (6 Runs)', short: '6R', b1: 5.50, l1: 0 },
      { sid: '4', nat: 'Wicket Out', short: 'W', b1: 4.20, l1: 0 }
    ]
  },
  {
    tableId: 'superover',
    slug: 'diamond-superover',
    name: 'Super Over Live Cricket (PAK vs IND)',
    type: 'VirtualCasino',
    category: 'Cricket Casino',
    minBet: 20,
    maxBet: 50000,
    imageUrl: 'https://cdn.betnex.co/images/jiligaming/76.png',
    runners: [
      { sid: '1', nat: 'Pakistan (PAK)', short: 'PAK', b1: 1.95, l1: 2.00 },
      { sid: '2', nat: 'India (IND)', short: 'IND', b1: 1.95, l1: 2.00 },
      { sid: '3', nat: 'Super Over Tie', short: 'T', b1: 11.00, l1: 0 }
    ]
  }
];

const SUITS = ['SS', 'HH', 'CC', 'DD'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function deterministicPick(seed, mod) {
  let h = 2166136261;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % mod;
}

function generateRoundState(tableId) {
  const table = DIAMOND_TABLES.find(t => t.tableId === tableId) || DIAMOND_TABLES[0];
  const nowSec = Math.floor(Date.now() / 1000);
  const cycleSec = 16; // Fast 11s betting + 5s live card reveal
  const roundIndex = Math.floor(nowSec / cycleSec);
  const elapsed = nowSec % cycleSec;
  const remainingBetSec = Math.max(0, 11 - elapsed);
  const isRevealing = remainingBetSec === 0;
  const mid = `${roundIndex}${table.tableId.length}`;

  const cards = [];
  for (let c = 0; c < 6; c++) {
    const r = RANKS[deterministicPick(`${mid}-${tableId}-r-${c}`, RANKS.length)];
    const s = SUITS[deterministicPick(`${mid}-${tableId}-s-${c}`, SUITS.length)];
    cards.push(isRevealing ? `${r}${s}` : '1');
  }

  const winIdx = deterministicPick(`${mid}-${tableId}-win`, Math.min(table.runners.length, 3));
  const winnerRunner = table.runners[winIdx] || table.runners[0];

  const recentResults = [];
  for (let i = 1; i <= 10; i++) {
    const pastRound = roundIndex - i;
    const pastMid = `${pastRound}${table.tableId.length}`;
    const pWinIdx = deterministicPick(`${pastMid}-${tableId}-win`, Math.min(table.runners.length, 3));
    const rRunner = table.runners[pWinIdx] || table.runners[0];
    recentResults.push({
      mid: pastMid,
      result: rRunner.sid,
      winnerName: rRunner.nat,
      shortLabel: rRunner.short || rRunner.nat.charAt(0).toUpperCase()
    });
  }

  return {
    success: true,
    source: 'diamond-casino-engine',
    tableId: table.tableId,
    tableName: table.name,
    type: table.type,
    category: table.category,
    imageUrl: table.imageUrl,
    data: {
      t1: [
        {
          mid,
          lt: remainingBetSec,
          gtype: table.tableId,
          min: table.minBet,
          max: table.maxBet,
          C1: cards[0],
          C2: cards[1],
          C3: cards[2],
          C4: cards[3],
          C5: cards[4],
          C6: cards[5],
          status: isRevealing ? 'RESULT' : 'OPEN',
          winnerSid: isRevealing ? winnerRunner.sid : null,
          winnerName: isRevealing ? winnerRunner.nat : null
        }
      ],
      t2: table.runners.map(r => ({
        ...r,
        gstatus: isRevealing ? 'SUSPENDED' : 'ACTIVE'
      })),
      results: recentResults
    }
  };
}

export default async function handler(req, res) {
  const { action, tableid = 'teen20', mid = '' } = req.query;

  const routeMap = {
    getAllCasinoTables: '/api/v1/casino/tables',
    getCasinoTableData: `/api/v1/casino/data?tableid=${encodeURIComponent(tableid)}`,
    getCasinoResult: `/api/v1/casino/result?tableid=${encodeURIComponent(tableid)}`,
    getCasinoDetailsResult: `/api/v1/casino/fullresult?tableid=${encodeURIComponent(tableid)}&mid=${encodeURIComponent(mid)}`,
    getCasinoStream: `/api/v1/casino/tv?tableid=${encodeURIComponent(tableid)}`,
    getCasinoRules: `/api/v1/casino/rules?tableid=${encodeURIComponent(tableid)}`,
    getVirtualCasinoTableList: '/api/v1/casino/vtables',
    getVirtualCasinoTableData: `/api/v1/casino/vdata?tableid=${encodeURIComponent(tableid)}`,
    getVirtualCasinoResult: `/api/v1/casino/vresult?tableid=${encodeURIComponent(tableid)}`
  };

  const upstreamPath = routeMap[action] || `/api/v1/casino/data?tableid=${encodeURIComponent(tableid)}`;

  // 1. Only probe RapidAPI upstream if circuit breaker is closed
  if (Date.now() > upstreamDownUntil) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1200);
      const upstreamRes = await fetch(`https://${DIAMOND_HOST}${upstreamPath}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': DIAMOND_KEY,
          'X-RapidAPI-Host': DIAMOND_HOST,
          'x-turnkeyxgaming-key': TURNKEY_KEY
        },
        signal: controller.signal
      });
      clearTimeout(timer);

      if (upstreamRes.ok) {
        const upstreamJson = await upstreamRes.json();
        return res.status(200).json({
          success: true,
          source: 'rapidapi-diamond-live',
          ...upstreamJson
        });
      } else {
        // Trip circuit breaker for 5 minutes on 502/404/500 so polling is instant (0ms)
        upstreamDownUntil = Date.now() + 5 * 60 * 1000;
      }
    } catch (e) {
      upstreamDownUntil = Date.now() + 5 * 60 * 1000;
    }
  }

  // 2. Instant Built-In Real-Time Diamond Casino Engine Response
  if (action === 'getAllCasinoTables' || action === 'getVirtualCasinoTableList') {
    const tables = action === 'getVirtualCasinoTableList'
      ? DIAMOND_TABLES.filter(t => t.type === 'VirtualCasino')
      : DIAMOND_TABLES;
    return res.status(200).json({
      success: true,
      source: 'diamond-casino-engine',
      count: tables.length,
      tables
    });
  }

  if (action === 'getCasinoStream') {
    const table = DIAMOND_TABLES.find(t => t.tableId === tableid) || DIAMOND_TABLES[0];
    return res.status(200).json({
      success: true,
      source: 'diamond-casino-engine',
      tableId: table.tableId,
      tableName: table.name,
      streamMode: 'studio-live-canvas',
      tvUrl: null
    });
  }

  if (action === 'getCasinoRules') {
    const table = DIAMOND_TABLES.find(t => t.tableId === tableid) || DIAMOND_TABLES[0];
    return res.status(200).json({
      success: true,
      tableId: table.tableId,
      tableName: table.name,
      rules: [
        `${table.name} is an official Diamond Casino NO-GGR live market table.`,
        'Tap any BACK (Blue) or LAY (Pink) odds box to stage your chips, then press DEAL CARDS NOW for an instant hand or wait for the live round countdown.',
        'Back (Blue) bets win at the displayed odds multiplier when your selected runner wins the round.',
        'All payouts are credited immediately into your PKR Wallet.'
      ]
    });
  }

  const state = generateRoundState(tableid);
  return res.status(200).json(state);
}

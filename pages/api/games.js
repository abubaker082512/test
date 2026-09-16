// Universal API endpoint for game catalog across providers
export default function handler(req, res) {
  const games = [
    { id: 'super-ace', name: 'Super Ace Deluxe', title: 'Super Ace Deluxe', category: 'Slots', provider: 'JILI', badge: 'Golden Cards', img: '/games/super_ace.png', rtp: '97.2%' },
    { id: 'fortune-gems', name: 'Fortune Gems 2', title: 'Fortune Gems 2', category: 'Slots', provider: 'JILI', badge: 'Lucky Wheel', img: '/games/fortune_gems.png', rtp: '97.0%' },
    { id: 'mahjong-ways-2', name: 'Mahjong Ways 2', title: 'Mahjong Ways 2', category: 'Slots', provider: 'PG Soft', badge: 'Golden Dragon', img: 'https://cdn.betnex.co/images/jiligaming/74.webp', rtp: '96.95%' },
    { id: 'wild-bounty', name: 'Wild Bounty Showdown', title: 'Wild Bounty Showdown', category: 'Slots', provider: 'PG Soft', badge: '1024 Ways', img: '/games/super_ace.png', rtp: '96.75%' },
    { id: 'spribe_aviator', name: 'Aviator Crash', title: 'Aviator Crash', category: 'Crash', provider: 'Spribe', badge: '10,000x', img: '/games/crash.png', rtp: '97.0%' },
    { id: 'fishing-joy', name: 'Royal Fishing Frenzy', title: 'Royal Fishing Frenzy', category: 'Fishing', provider: 'JILI', badge: 'Fish Hunter', img: '/games/fishing.png', rtp: '97.5%' },
    { id: 'evo_lightning_roulette', name: 'Lightning Roulette Live', title: 'Lightning Roulette Live', category: 'Live', provider: 'Evolution Gaming', badge: '500x Multiplier', img: '/games/live.png', rtp: '97.3%' },
    { id: 'blackjack-live', name: 'Blackjack VIP Platinum', title: 'Blackjack VIP Platinum', category: 'Live', provider: 'Evolution Gaming', badge: 'VIP Table', img: '/games/super_ace.png', rtp: '99.5%' },
    { id: 'baccarat', name: 'Speed Baccarat VIP', title: 'Speed Baccarat VIP', category: 'Live', provider: 'Evolution Gaming', badge: 'Zero Commission', img: '/games/live.png', rtp: '98.9%' },
    { id: 'dragon-tiger', name: 'Live Dragon Tiger', title: 'Live Dragon Tiger', category: 'Live', provider: 'Evolution Gaming', badge: 'Fast Action', img: '/games/super_ace.png', rtp: '96.3%' },
    { id: 'poker-texas-holdem', name: 'Texas Hold\'em No Limit', title: 'Texas Hold\'em No Limit', category: 'Poker', provider: 'PokerAPI', badge: 'Ring Game', img: '/games/super_ace.png', rtp: '98.6%' },
    { id: 'plinko', name: 'Neon Plinko Drop', title: 'Neon Plinko Drop', category: 'Mini Games', provider: 'JILI', badge: '1000x Pins', img: '/games/fortune_gems.png', rtp: '99.0%' },
    { id: 'mines', name: 'Mine Rush VIP', title: 'Mine Rush VIP', category: 'Mini Games', provider: 'JILI', badge: 'Custom Mines', img: '/games/fortune_gems.png', rtp: '98.5%' },
    { id: 'dice', name: 'Mega Dice Roll', title: 'Mega Dice Roll', category: 'Mini Games', provider: 'Spribe', badge: '99% RTP', img: '/games/crash.png', rtp: '99.0%' },
    { id: 'betstack-sports', name: 'Live Sports Consensus', title: 'Live Sports Consensus', category: 'Sports', provider: 'BetStack', badge: 'Live 1X2', img: '/games/live.png', rtp: '96.5%' }
  ];

  res.status(200).json({ ok: true, success: true, count: games.length, data: games });
}


import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'
import GameCard from '../components/GameCard'

const mockGames = [
  // Poker API - Complete Texas Hold'em & Tournaments
  { id: 'poker-texas-holdem', title: "Texas Hold'em No Limit", provider: 'PokerAPI', badge: 'High Stakes', recommended: true, theme: 'linear-gradient(135deg, #0d47a1 0%, #001064 100%)', icon: '♠️', slug: 'poker-texas-holdem', category: 'Poker', imageUrl: 'https://cdn.betnex.co/images/jiligaming/235.png' },
  { id: 'poker-omaha', title: 'Omaha Hi-Lo Pot Limit', provider: 'PokerAPI', badge: '4 Hole Cards', recommended: true, theme: 'linear-gradient(135deg, #880e4f 0%, #311b92 100%)', icon: '♥️', slug: 'poker-omaha', category: 'Poker', imageUrl: '/games/super_ace.png' },
  { id: 'poker-caribbean-stud', title: 'Caribbean Stud Poker', provider: 'PokerAPI', badge: '5+1 Bonus', recommended: true, theme: 'linear-gradient(135deg, #004d40 0%, #00251a 100%)', icon: '♦️', slug: 'poker-caribbean-stud', category: 'Poker', imageUrl: '/games/live.png' },
  { id: 'poker-three-card', title: 'Three Card Poker Deluxe', provider: 'PokerAPI', badge: 'Pair Plus 40:1', recommended: true, theme: 'linear-gradient(135deg, #37474f 0%, #102027 100%)', icon: '♣️', slug: 'poker-three-card', category: 'Poker', imageUrl: '/games/live.png' },
  { id: 'poker-jacks-or-better', title: 'Video Poker: Jacks or Better', provider: 'PokerAPI', badge: '4,000x Royal Flush', recommended: false, theme: 'linear-gradient(135deg, #bf360c 0%, #4e342e 100%)', icon: '🃏', slug: 'poker-jacks-or-better', category: 'Poker', imageUrl: 'https://cdn.betnex.co/images/jiligaming/74.webp' },
  { id: 'poker-tournament', title: 'World Series Poker Championship', provider: 'PokerAPI', badge: 'Pi 100,000 GTD', recommended: true, theme: 'linear-gradient(135deg, #f57f17 0%, #b71c1c 100%)', icon: '🏆', slug: 'poker-tournament', category: 'Poker', imageUrl: 'https://cdn.betnex.co/images/jiligaming/48.webp' },

  // Paddy Power Flagships & Exclusives
  { id: 'Chests-of-Plenty', title: 'Chests of Plenty', provider: 'PaddyPower', badge: 'Jackpot', recommended: true, theme: 'linear-gradient(135deg, #1b5e20 0%, #003300 100%)', icon: '🏴‍☠️', slug: 'Chests-of-Plenty', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/235.png' },
  { id: 'paddy-fishin-frenzy', title: "Fishin' Frenzy Big Catch", provider: 'PaddyPower', badge: 'Popular', recommended: true, theme: 'linear-gradient(135deg, #01579b 0%, #002f6c 100%)', icon: '🎣', slug: 'paddy-fishin-frenzy', category: 'Slots', imageUrl: '/games/fishing.png' },
  { id: 'paddy-roulette-live', title: 'Paddy Power Live Roulette', provider: 'PaddyPower', badge: 'Live HD', recommended: true, theme: 'linear-gradient(135deg, #311b92 0%, #12005e 100%)', icon: '🎡', slug: 'paddy-roulette-live', category: 'Live', imageUrl: '/games/live.png' },
  { id: 'paddy-blackjack-exclusive', title: 'Exclusive Blackjack', provider: 'PaddyPower', badge: 'VIP Table', recommended: true, theme: 'linear-gradient(135deg, #004d40 0%, #00251a 100%)', icon: '🃏', slug: 'paddy-blackjack-exclusive', category: 'Cards', imageUrl: '/games/live.png' },
  { id: 'paddy-age-of-gods', title: 'Age of the Gods', provider: 'PaddyPower', badge: '4 Jackpots', recommended: true, theme: 'linear-gradient(135deg, #4a148c 0%, #12005e 100%)', icon: '⚡', slug: 'paddy-age-of-gods', category: 'Jackpots', imageUrl: '/games/super_ace.png' },
  { id: 'paddy-mega-fire-blaze', title: 'Mega Fire Blaze Roulette', provider: 'PaddyPower', badge: '10,000x', recommended: true, theme: 'linear-gradient(135deg, #bf360c 0%, #3e2723 100%)', icon: '🔥', slug: 'paddy-mega-fire-blaze', category: 'Live', imageUrl: '/games/live.png' },
  { id: 'paddy-rainbow-riches', title: 'Rainbow Riches Leprechauns', provider: 'PaddyPower', badge: 'Mega Wilds', recommended: true, theme: 'linear-gradient(135deg, #2e7d32 0%, #005005 100%)', icon: '🍀', slug: 'paddy-rainbow-riches', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/48.webp' },

  // Rainbow Riches Casino Series
  { id: 'rr-pots-of-gold', title: 'Rainbow Riches: Pots of Gold', provider: 'RainbowRiches', badge: 'Mega Jackpot', recommended: true, theme: 'linear-gradient(135deg, #1b5e20 0%, #003300 100%)', icon: '🌈', slug: 'rr-pots-of-gold', category: 'Jackpots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/74.webp' },
  { id: 'rr-megaways', title: 'Rainbow Riches: Megaways', provider: 'RainbowRiches', badge: '117,649 Ways', recommended: true, theme: 'linear-gradient(135deg, #2e7d32 0%, #005005 100%)', icon: '🍀', slug: 'rr-megaways', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/48.webp' },
  { id: 'rr-reels-of-gold', title: 'Rainbow Riches: Reels of Gold', provider: 'RainbowRiches', badge: 'Colossal Reels', recommended: true, theme: 'linear-gradient(135deg, #f57f17 0%, #bc5100 100%)', icon: '💰', slug: 'rr-reels-of-gold', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/38.webp' },
  { id: 'rr-pick-n-mix', title: "Rainbow Riches: Pick 'n' Mix", provider: 'RainbowRiches', badge: '5 Bonus Games', recommended: true, theme: 'linear-gradient(135deg, #00838f 0%, #005662 100%)', icon: '🎩', slug: 'rr-pick-n-mix', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/37.png' },
  { id: 'rr-drop-of-gold', title: 'Rainbow Riches: Drops of Gold', provider: 'RainbowRiches', badge: 'Drop Wilds', recommended: false, theme: 'linear-gradient(135deg, #ff8f00 0%, #c56000 100%)', icon: '🪙', slug: 'rr-drop-of-gold', category: 'Jackpots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/47.webp' },
  { id: 'rr-live-roulette', title: 'Rainbow Riches: Live Roulette', provider: 'RainbowRiches', badge: 'Live Stream', recommended: true, theme: 'linear-gradient(135deg, #311b92 0%, #12005e 100%)', icon: '🎡', slug: 'rr-live-roulette', category: 'Live', imageUrl: '/games/live.png' },

  // ScorpioPlay / Pragmatic Play & Spribe
  { id: 'vswaysdogs', title: 'The Dog House Megaways', provider: 'Pragmatic Play', badge: '117,649 Ways', recommended: true, theme: 'linear-gradient(135deg, #b71c1c 0%, #4a148c 100%)', icon: '🐶', slug: 'vswaysdogs', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/48.webp' },
  { id: 'vs20olympgate', title: 'Gates of Olympus 1000', provider: 'Pragmatic Play', badge: '5,000x Max', recommended: true, theme: 'linear-gradient(135deg, #ffd600 0%, #e65100 100%)', icon: '⚡', slug: 'vs20olympgate', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/74.webp' },
  { id: 'vs20sweetbonz', title: 'Sweet Bonanza 1000', provider: 'Pragmatic Play', badge: 'Tumble 100x', recommended: true, theme: 'linear-gradient(135deg, #e91e63 0%, #880e4f 100%)', icon: '🍭', slug: 'vs20sweetbonz', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/38.webp' },
  { id: 'evo_lightning_roulette', title: 'Lightning Roulette Live', provider: 'Evolution Gaming', badge: '500x Multiplier', recommended: true, theme: 'linear-gradient(135deg, #f57f17 0%, #212121 100%)', icon: '⚡', slug: 'evo_lightning_roulette', category: 'Live', imageUrl: '/games/live.png' },
  { id: 'evo_crazy_time', title: 'Crazy Time Live Show', provider: 'Evolution Gaming', badge: '4 Bonus Games', recommended: true, theme: 'linear-gradient(135deg, #e91e63 0%, #1a237e 100%)', icon: '🎪', slug: 'evo_crazy_time', category: 'Live', imageUrl: '/games/live.png' },
  { id: 'spribe_aviator', title: 'Aviator Crash Game', provider: 'Spribe', badge: '10,000x Crash', recommended: true, theme: 'linear-gradient(135deg, #d32f2f 0%, #000 100%)', icon: '🚀', slug: 'spribe_aviator', category: 'Crash', imageUrl: '/games/crash.png' },

  // JILI & Flagship Favorites
  { id: 'super-ace', title: 'Super Ace Deluxe', provider: 'JILI', badge: 'Golden Cards', recommended: true, theme: 'linear-gradient(135deg, #e53935 0%, #b71c1c 100%)', icon: '🃏', slug: 'super-ace', category: 'Slots', imageUrl: '/games/super_ace.png' },
  { id: 'fortune-gems', title: 'Fortune Gems 2', provider: 'JILI', badge: 'Lucky Wheel', recommended: true, theme: 'linear-gradient(135deg, #ffb300 0%, #f57f17 100%)', icon: '💎', slug: 'fortune-gems', category: 'Slots', imageUrl: '/games/fortune_gems.png' },

  // BetStack Sportsbook Live Matches
  { id: 'betstack-nfl-live', title: 'NFL Football Live Odds', provider: 'BetStack', badge: 'Consensus', recommended: true, theme: 'linear-gradient(135deg, #0d47a1 0%, #000a12 100%)', icon: '🏈', slug: 'sports', category: 'Sports', imageUrl: '/games/crash.png' },
  { id: 'betstack-mlb-live', title: 'MLB Baseball Matchups', provider: 'BetStack', badge: 'In-Play', recommended: true, theme: 'linear-gradient(135deg, #b71c1c 0%, #311b92 100%)', icon: '⚾', slug: 'sports', category: 'Sports', imageUrl: '/games/fortune_gems.png' },
  { id: 'betstack-nba-live', title: 'NBA Basketball Pro Odds', provider: 'BetStack', badge: 'High Limits', recommended: true, theme: 'linear-gradient(135deg, #e65100 0%, #ff8f00 100%)', icon: '🏀', slug: 'sports', category: 'Sports', imageUrl: '/games/super_ace.png' },
  { id: 'betstack-soccer-live', title: 'Premier League Soccer', provider: 'BetStack', badge: '1X2 Live', recommended: true, theme: 'linear-gradient(135deg, #1b5e20 0%, #003300 100%)', icon: '⚽', slug: 'sports', category: 'Sports', imageUrl: '/games/live.png' }
]

// Scrolling live winner events
const winEvents = [
  { name: 'ali***77', game: 'Texas Holdem NL', amount: 'Pi 24,150.00', provider: 'PokerAPI', avatar: '♠️' },
  { name: 'zain***88', game: 'Rainbow Riches Pots', amount: 'Pi 12,850.00', provider: 'RainbowRiches', avatar: '🌈' },
  { name: 'pak***01', game: 'Chests of Plenty', amount: 'Pi 18,279.20', provider: 'PaddyPower', avatar: '☘️' },
  { name: 'jill***00', game: 'World Series Poker', amount: 'Pi 48,033.00', provider: 'PokerAPI', avatar: '🏆' },
  { name: 'asif***99', game: 'Gates of Olympus', amount: 'Pi 15,900.00', provider: 'Pragmatic', avatar: '⚡' },
  { name: 'ahmed***10', game: 'Aviator Crash', amount: 'Pi 35,500.00', provider: 'Spribe', avatar: '🚀' },
]

export default function Home() {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState('Hot')
  const { user } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  // Floating widget states
  const [showLeftWidget, setShowLeftWidget] = useState(true)
  const [showRightWidget, setShowRightWidget] = useState(true)
  
  // Interactive mini game popups
  const [showWheelPopup, setShowWheelPopup] = useState(false)
  const [spinningWheel, setSpinningWheel] = useState(false)
  const [wheelPrize, setWheelPrize] = useState(null)
  const [wheelError, setWheelError] = useState(null)
  
  // Grid expansion state
  const [expandedCats, setExpandedCats] = useState({})

  const [apiGames, setApiGames] = useState([])
  const [apiLoaded, setApiLoaded] = useState(false)

  // Sync active tab with router query if provided
  useEffect(() => {
    if (!router.isReady) return
    const { tab, search } = router.query
    if (tab) {
      const tabMap = {
        'hot': 'Hot',
        'slot': 'Slots',
        'slots': 'Slots',
        'mini': 'Mini Games',
        'cards': 'Cards',
        'fishing': 'Fishing',
        'live': 'Live',
        'sports': 'Sports',
        'poker': 'Poker',
        'crash': 'Crash',
        'recent': 'Recent',
        'favorites': 'Favorites'
      }
      if (tabMap[tab.toLowerCase()]) {
        setActiveCategory(tabMap[tab.toLowerCase()])
      }
    }
  }, [router.isReady, router.query])

  useEffect(() => {
    let isMounted = true;
    const fetchCatalogGames = async () => {
      try {
        const [paddyRes, rrRes, pokerRes, scorpioRes, sportsRes] = await Promise.all([
          fetch('/api/paddypower/games'),
          fetch('/api/rainbowriches/games'),
          fetch('/api/poker/games'),
          fetch('/api/scorpioplay/games'),
          fetch('/api/sports/lines?north_american=true')
        ]);
        const allFetched = [];

        if (paddyRes.ok) {
          const data = await paddyRes.json();
          const gamesList = data.games || data.data;
          if (gamesList && Array.isArray(gamesList)) {
            allFetched.push(...gamesList.map(g => ({
              id: g.id || g.slug,
              title: g.name || g.title,
              provider: 'PaddyPower',
              category: g.category || 'Slots',
              imageUrl: g.img || g.imageUrl || '/games/fortune_gems.png',
              badge: g.badge || 'Popular',
              recommended: g.recommended || false,
              theme: g.theme || 'linear-gradient(135deg, #1b5e20 0%, #003300 100%)',
              slug: g.id || g.slug
            })));
          }
        }

        if (rrRes.ok) {
          const data = await rrRes.json();
          const gamesList = data.games || data.data;
          if (gamesList && Array.isArray(gamesList)) {
            allFetched.push(...gamesList.map(g => ({
              id: g.id || g.slug,
              title: g.name || g.title,
              provider: 'RainbowRiches',
              category: g.category || 'Slots',
              imageUrl: g.img || g.imageUrl || 'https://cdn.betnex.co/images/jiligaming/74.webp',
              badge: g.badge || 'Popular',
              recommended: g.recommended || false,
              theme: g.theme || 'linear-gradient(135deg, #1b5e20 0%, #003300 100%)',
              slug: g.id || g.slug
            })));
          }
        }

        if (pokerRes.ok) {
          const data = await pokerRes.json();
          const gamesList = data.games || data.data;
          if (gamesList && Array.isArray(gamesList)) {
            allFetched.push(...gamesList.map(g => ({
              id: g.id || g.slug,
              title: g.name || g.title,
              provider: 'PokerAPI',
              category: 'Poker',
              imageUrl: g.img || g.imageUrl || 'https://cdn.betnex.co/images/jiligaming/235.png',
              badge: g.badge || 'Poker Table',
              recommended: g.recommended || false,
              theme: g.theme || 'linear-gradient(135deg, #0d47a1 0%, #001064 100%)',
              slug: g.id || g.slug
            })));
          }
        }

        if (scorpioRes.ok) {
          const data = await scorpioRes.json();
          const gamesList = data.games || data.data;
          if (gamesList && Array.isArray(gamesList)) {
            allFetched.push(...gamesList.map(g => ({
              id: g.gameID || g.gameCode || g.id,
              title: g.gameName || g.name || g.title,
              provider: g.provider || 'ScorpioPlay',
              category: g.category || (g.gameType === 1 ? 'Live' : g.gameType === 2 ? 'Crash' : 'Slots'),
              imageUrl: g.gameImage || g.img || g.imageUrl || '/games/fortune_gems.png',
              badge: g.badge || 'Scorpio Pick',
              recommended: true,
              theme: 'linear-gradient(135deg, #b71c1c 0%, #311b92 100%)',
              slug: g.gameID || g.gameCode || g.id
            })));
          }
        }

        if (sportsRes && sportsRes.ok) {
          const data = await sportsRes.json();
          const linesList = data.lines || data.data;
          if (linesList && Array.isArray(linesList)) {
            allFetched.push(...linesList.slice(0, 15).map(line => {
              const ev = line.event || {};
              return {
                id: 'sports-' + (line.id || ev.id || Math.random()),
                title: `${ev.home_team || 'Home'} vs ${ev.away_team || 'Away'}`,
                provider: 'BetStack',
                category: 'Sports',
                imageUrl: '/games/crash.png',
                badge: ev.league?.name || 'Live Match',
                recommended: true,
                theme: 'linear-gradient(135deg, #0d47a1 0%, #000a12 100%)',
                slug: 'sports'
              };
            }));
          }
        }

        if (isMounted) {
          setApiGames(allFetched);
          setApiLoaded(true);
        }
      } catch (err) {
        console.error('Failed to fetch catalog games for home', err);
      }
    };
    fetchCatalogGames();
    return () => { isMounted = false; }
  }, []);


  // Auto-scrolling promo banners
  const promoBanners = [
    {
      title: 'Join VIP Unlimited Rewards',
      desc: 'Upgrade bonus + monthly bonus, Daily bonus + weekly bonus. Member account equals your private wallet.',
      image: '/banners/vip.png',
      emoji: '👑'
    },
    {
      title: 'Double Your First Deposit',
      desc: 'Get 100% matched bonus up to Pi 5,000.00 on your first completed transaction. Instant verification!',
      image: '/banners/deposit.png',
      emoji: '🎁'
    },
    {
      title: 'Refer & Earn Pi 155.55 Cash',
      desc: 'Invite friends using your unique referral code. Get paid immediately upon their sign up!',
      image: '/banners/invite.png',
      emoji: '💸'
    }
  ]

  useEffect(() => {
    const slideInt = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % promoBanners.length)
    }, 4500)
    return () => clearInterval(slideInt)
  }, [])

  const toggleExpand = (category) => {
    setExpandedCats(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  // Interactive Spin Wheel trigger
  const spinWheel = async () => {
    if (spinningWheel) return
    if (!user) {
      setShowWheelPopup(false)
      setIsAuthModalOpen(true)
      return
    }

    setSpinningWheel(true)
    setWheelPrize(null)
    setWheelError(null)

    try {
      const res = await fetch('/api/wallet/claim-spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      })
      const data = await res.json()

      if (data.success) {
        setTimeout(() => {
          setWheelPrize(data.prizeText)
          setSpinningWheel(false)
          window.dispatchEvent(new Event('wallet-updated'))
        }, 3000)
      } else {
        setSpinningWheel(false)
        setWheelError(data.error || 'Failed to spin. Try again!')
      }
    } catch (err) {
      setSpinningWheel(false)
      setWheelError('Connection error. Failed to spin.')
    }
  }

  // Categories list covering all integrated providers matching Drawer
  const categoriesList = [
    { name: 'Hot', label: '🔥 Hot', icon: '🔥' },
    { name: 'Slots', label: '🎰 Slots', icon: '🎰' },
    { name: 'Mini Games', label: '💠 Mini Games', icon: '💠' },
    { name: 'Cards', label: '🃏 Cards', icon: '🃏' },
    { name: 'Fishing', label: '🦈 Fishing', icon: '🦈' },
    { name: 'Live', label: '💃 Live Casino', icon: '💃' },
    { name: 'Sports', label: '⚽ Sportsbook', icon: '⚽' },
    { name: 'Poker', label: '♠️ Poker', icon: '♠️' },
    { name: 'Crash', label: '🚀 Crash', icon: '🚀' },
    { name: 'Favorites', label: '⭐ Favorites', icon: '⭐' }
  ]

  // Filter games based on selected tab
  const getFilteredGames = (category) => {
    const combined = [...mockGames, ...apiGames];
    const unique = [];
    const seen = new Set();
    for (const g of combined) {
      if (!seen.has(g.id)) {
        seen.add(g.id);
        unique.push(g);
      }
    }

    if (category === 'Hot') return unique;
    if (category === 'Sports') return unique.filter(g => g.category === 'Sports' || g.provider === 'BetStack' || g.id?.includes('sports') || g.id?.startsWith('betstack-'));
    if (category === 'Poker') return unique.filter(g => g.category === 'Poker' || g.provider === 'PokerAPI' || g.id?.includes('poker') || g.title?.toLowerCase().includes('poker') || g.title?.toLowerCase().includes('hold\'em') || g.title?.toLowerCase().includes('omaha'));
    if (category === 'Slots') return unique.filter(g => g.category?.toLowerCase().includes('slot') || g.provider === 'RainbowRiches' || g.provider === 'PaddyPower' || g.provider === 'Pragmatic Play' || g.provider === 'JILI' || g.gameType === 0 || g.gameType === 'slot');
    if (category === 'Mini Games') return unique.filter(g => g.category?.toLowerCase().includes('mini') || g.category?.toLowerCase().includes('crash') || g.id?.includes('crash') || g.id?.includes('aviator') || g.id?.includes('gems') || g.id?.includes('plinko'));
    if (category === 'Fishing') return unique.filter(g => g.title?.toLowerCase().includes('fish') || g.id?.toLowerCase().includes('fish') || g.category?.toLowerCase().includes('fish'));
    if (category === 'Live') return unique.filter(g => g.category?.toLowerCase().includes('live') || g.provider === 'Evolution Gaming' || g.gameType === 1 || g.gameType === 'live');
    if (category === 'Cards') return unique.filter(g => g.category?.toLowerCase().includes('card') || g.category === 'Poker' || g.provider === 'PokerAPI' || g.title?.toLowerCase().includes('blackjack') || g.category?.toLowerCase().includes('table'));
    if (category === 'Crash') return unique.filter(g => g.category?.toLowerCase().includes('crash') || g.id?.includes('crash') || g.id?.includes('aviator') || g.gameType === 2);
    if (category === 'Favorites') return unique.slice(0, 10);
    if (category === 'Recent') return unique.slice(0, 8);
    if (category === 'Rainbow') return unique.filter(g => g.provider === 'RainbowRiches' || g.id?.startsWith('rr-'));
    if (category === 'Paddy') return unique.filter(g => g.provider === 'PaddyPower' || g.id?.startsWith('paddy-') || g.id === 'Chests-of-Plenty');
    if (category === 'Jackpots') return unique.filter(g => g.category?.toLowerCase().includes('jackpot') || g.badge?.toLowerCase().includes('jackpot'));
    return unique.filter(g => g.category === category);
  }

  const activeTabGames = getFilteredGames(activeCategory);

  return (
    <div className="app">
      <NavBar />

      {/* Dynamic Image/Promo Banner Carousel */}
      <div className="banner-carousel">
        <div 
          className="carousel-track" 
          style={{ transform: `translate3d(-${currentSlide * 100}%, 0, 0)` }}
        >
          {promoBanners.map((banner, idx) => (
            <div key={idx} className="carousel-slide" style={{ backgroundImage: `url(${banner.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div 
                className="carousel-overlay" 
                style={{ background: 'rgba(0,0,0,0.65)' }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{banner.emoji}</div>
                <h2 className="carousel-title">{banner.title}</h2>
                <p className="carousel-desc">{banner.desc}</p>
                <button 
                  onClick={() => {
                    if (idx === 0) router.push('/offers')
                    else if (idx === 1) router.push('/wallet')
                    else if (idx === 2) router.push('/invite')
                    else if (!user) setIsAuthModalOpen(true)
                    else router.push('/offers')
                  }}
                  className="btn primary" 
                  style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: '11px' }}
                >
                  {idx === 2 ? 'Invite Friends' : idx === 1 ? 'Deposit Now' : 'Claim Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="carousel-dots">
          {promoBanners.map((_, idx) => (
            <button 
              key={idx}
              className={`carousel-dot ${currentSlide === idx ? 'active' : ''}`}
              onClick={() => setCurrentSlide(idx)}
            />
          ))}
        </div>
      </div>

      {/* Announcements Marquee Ticker */}
      <div className="announcement-bar">
        <span className="announcement-icon">🔊</span>
        <div className="announcement-marquee">
          <span className="announcement-text">
            🌟 Welcome to WinX Pro Official! Play Paddy Power exclusive slots, live tables, Poker Room & Rainbow Riches. Withdrawals in under 2 minutes!
          </span>
        </div>
        <div className="announcement-mail" onClick={() => alert("Inbox: 2 new promotional messages loaded.")}>
          ✉️
          <span className="mail-badge">2</span>
        </div>
      </div>

      {/* Infinite Top Winners Scroll Ticker */}
      <div className="winners-ticker-container">
        <div className="winners-ticker-title">
          🏆 Top Winning Live Ticker
        </div>
        <div className="winners-ticker-track">
          {[...winEvents, ...winEvents].map((win, idx) => (
            <div key={idx} className="winner-card">
              <span className="winner-avatar">{win.avatar}</span>
              <div className="winner-info">
                <div className="winner-name">{win.name} win</div>
                <div className="winner-payout">{win.amount}</div>
                <div className="winner-game">{win.game} ({win.provider})</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Tabs chip navigation */}
      <div className="category-bar" style={{ position: 'sticky', top: '60px', zIndex: 40, background: 'var(--bg-tertiary)', paddingBottom: '10px' }}>
        {categoriesList.map(cat => (
          <button 
            key={cat.name}
            className={`category-chip ${activeCategory === cat.name ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.name)}
          >
            <span>{cat.icon}</span>
            <span>{cat.label || cat.name}</span>
          </button>
        ))}
      </div>

      {/* Games List Container */}
      <div className="all-games-container" style={{ paddingBottom: '24px' }}>
        {activeCategory !== 'Hot' ? (
          <section style={{ padding: '20px 16px 0' }}>
            <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="title-left" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: '900' }}>
                <span>{categoriesList.find(c => c.name === activeCategory)?.icon}</span> {categoriesList.find(c => c.name === activeCategory)?.label} ({activeTabGames.length})
              </div>
              <button 
                onClick={() => setActiveCategory('Hot')}
                style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: '12px', cursor: 'pointer' }}
              >
                View All Categories →
              </button>
            </div>

            <div className="games-grid">
              {activeTabGames.map(game => (
                <GameCard 
                  key={game.id}
                  id={game.id}
                  title={game.title}
                  provider={game.provider}
                  badge={game.badge}
                  recommended={game.recommended}
                  theme={game.theme}
                  icon={game.icon}
                  slug={game.slug}
                  imageType={game.imageType}
                  imageUrl={game.imageUrl}
                />
              ))}
            </div>
          </section>
        ) : (
          categoriesList.filter(c => c.name !== 'Hot').map(cat => {
            const catGames = getFilteredGames(cat.name);
            if (catGames.length === 0) return null;

            return (
              <section key={cat.name} id={'section-' + cat.name} style={{ padding: '24px 16px 0' }} aria-label={`${cat.label || cat.name} Catalog`}>
                <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div className="title-left" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: '900' }}>
                    <span>{cat.icon}</span> {cat.label || cat.name} ({catGames.length})
                  </div>
                  <button 
                    onClick={() => setActiveCategory(cat.name)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Explore All {cat.label} →
                  </button>
                </div>

                <div className="games-grid">
                  {catGames.map(game => (
                    <GameCard 
                      key={game.id}
                      id={game.id}
                      title={game.title}
                      provider={game.provider}
                      badge={game.badge}
                      recommended={game.recommended}
                      theme={game.theme}
                      icon={game.icon}
                      slug={game.slug}
                      imageType={game.imageType}
                      imageUrl={game.imageUrl}
                    />
                  ))}
                </div>
              </section>
            )
          })
        )}
      </div>
      
{/* Partners section */}
      <section style={{ padding: '24px 16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <div className="partners-title">Verified Platform Partners</div>
        <div className="partners-row">
          <span className="partner-logo" style={{ color: '#00e676', borderColor: '#00e676', textShadow: '0 0 10px rgba(0,230,118,0.4)' }}>PADDY POWER</span>
          <span className="partner-logo" style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>PG SOFT</span>
          <span className="partner-logo" style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}>JILI</span>
          <span className="partner-logo">EVOLUTION</span>
          <span className="partner-logo">PRAGMATIC</span>
          <span className="partner-logo" style={{ opacity: 0.8 }}>JDB</span>
          <span className="partner-logo">FC CASINO</span>
        </div>
      </section>

      {/* Official Channel & Disclaimer Regulatory Footer */}
      <footer className="footer">
        <div className="social-channels-title">Official Community Channels</div>
        <div className="social-icons-row">
          <button className="social-icon-btn fb" onClick={() => alert("FB community: facebook.com/betpk")}>📘</button>
          <button className="social-icon-btn tg" onClick={() => alert("Telegram support: t.me/betpk_official")}>✈️</button>
          <button className="social-icon-btn wa" onClick={() => alert("WhatsApp channel: chat.whatsapp.com/betpk")}>💬</button>
          <button className="social-icon-btn yt" onClick={() => alert("YouTube streams: youtube.com/betpk")}>🎬</button>
          <button className="social-icon-btn ig" onClick={() => alert("Instagram photos: instagram.com/betpk")}>📸</button>
          <button className="social-icon-btn tw" onClick={() => alert("X community: twitter.com/betpk")}>𝕏</button>
          <div className="social-icon-btn r21" title="Responsible Gaming: 21+ only">21+</div>
        </div>

        <p className="footer-disclaimer">
          Gambling involves risk. Winnings are not guaranteed. For <strong>21+ only</strong>. Please play responsibly. Gambling can be addictive - visit support for help resources.
          <br /><br />
          <strong>WinX Pro Group</strong> is one of the most famous international online casino operating companies, providing slots, cards, live dealers, sportsbook, and cockfights. Authorized and regulated by the Government of Curacao under licensing authority Antillephone, issued to 8048/JAZ.
        </p>
      </footer>

      {/* Interactive Floating Widget Left (Lucky Spin Wheel) */}
      {showLeftWidget && (
        <div className="floating-widget-left">
          <button className="widget-close-btn" onClick={() => setShowLeftWidget(false)}>✕</button>
          <div className="widget-wheel-container" onClick={() => setShowWheelPopup(true)}>
            <span className="widget-wheel-graphic">🎡</span>
            <span className="widget-wheel-text">Pi 8,888.00</span>
          </div>
        </div>
      )}

      {/* Interactive Floating Widget Right (Referral Invite & Earn) */}
      {showRightWidget && (
        <div className="floating-widget-right">
          <button className="widget-close-btn" onClick={() => setShowRightWidget(false)}>✕</button>
          <div className="widget-wheel-container" style={{ borderColor: 'var(--success)', boxShadow: '0 0 15px rgba(0, 230, 118, 0.4)' }} onClick={() => alert("Invite Friends: Copy your unique referral code from the Invite tab in the footer menu to earn Pi 155.55 instantly per sign-up!")}>
            <span className="widget-wheel-graphic" style={{ animationDelay: '-5s' }}>🤝</span>
            <span className="widget-wheel-text" style={{ background: 'var(--success)' }}>Pi 155.55</span>
          </div>
        </div>
      )}

      {/* Back to top scroll button */}
      <button className="top-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        TOP
      </button>

      {/* Lucky Wheel Modal Popup */}
      {showWheelPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #1f0a38 0%, #0c0317 100%)', 
            border: '2px solid var(--accent)', 
            padding: '24px', 
            borderRadius: '16px', 
            width: '90%', 
            maxWidth: '360px', 
            textAlign: 'center',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowWheelPopup(false)}
              style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', color: '#ff4444', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
            <h3 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '20px' }}>👑 WinX Pro Lucky Wheel</h3>
            <p style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '20px' }}>
              Spin the lucky wheel once every day for free to claim massive rewards up to Pi 8,888.00!
            </p>

            <div style={{ 
              width: '140px', 
              height: '140px', 
              margin: '0 auto 20px', 
              borderRadius: '50%', 
              border: '4px solid var(--accent)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '64px',
              background: 'var(--bg-secondary)',
              animation: spinningWheel ? 'spin 0.2s linear infinite' : 'none',
              boxShadow: '0 0 20px rgba(245,194,66,0.3)'
            }}>
              🎡
            </div>

            {wheelPrize && (
              <div style={{ 
                background: 'rgba(0, 230, 118, 0.15)', 
                color: 'var(--success)', 
                padding: '10px', 
                borderRadius: '8px', 
                fontWeight: 'bold', 
                fontSize: '14px', 
                marginBottom: '16px',
                border: '1px solid rgba(0, 230, 118, 0.3)'
              }}>
                🎉 Won: {wheelPrize}
              </div>
            )}

            {wheelError && (
              <div style={{ 
                background: 'rgba(255, 23, 68, 0.15)', 
                color: 'var(--danger)', 
                padding: '10px', 
                borderRadius: '8px', 
                fontWeight: 'bold', 
                fontSize: '12px', 
                marginBottom: '16px',
                border: '1px solid rgba(255, 23, 68, 0.3)'
              }}>
                ⚠️ {wheelError}
              </div>
            )}

            <button 
              className="btn primary" 
              style={{ width: '80%', padding: '12px', fontWeight: 'bold' }}
              disabled={spinningWheel}
              onClick={spinWheel}
            >
              {spinningWheel ? 'SPINNING...' : 'SPIN FOR FREE'}
            </button>
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <BottomNav />
    </div>
  )
}

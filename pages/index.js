import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'
import GameCard from '../components/GameCard'

const mockGames = [
  // Hot / Real JILI Games
  { id: 'e794bf5717aca371152df192341fe68b', title: 'Royal Fishing', provider: 'JILI', badge: 'Live API', recommended: true, theme: 'linear-gradient(135deg, #004b9b 0%, #001f40 100%)', icon: '🦈', slug: 'e794bf5717aca371152df192341fe68b', category: 'Hot', imageUrl: 'https://cdn.betnex.co/images/jiligaming/0.webp' },
  { id: 'bdfb23c974a2517198c5443adeea77a8', title: 'Super Ace', provider: 'JILI', badge: '1500x', recommended: true, theme: 'linear-gradient(135deg, #4b0000 0%, #150000 100%)', icon: '🂡', slug: 'super-ace', category: 'Hot', imageUrl: '/games/super_ace.png' },
  { id: 'a990de177577a2e6a889aaac5f57b429', title: 'Fortune Gems', provider: 'JILI', badge: '375x', recommended: true, theme: 'linear-gradient(135deg, #004b12 0%, #001203 100%)', icon: '💎', slug: 'fortune-gems', category: 'Hot', imageUrl: '/games/fortune_gems.png' },
  { id: '3cf4a85cb6dcf4d8836c982c359cd72d', title: 'Jackpot Fishing', provider: 'JILI', badge: 'Popular', recommended: true, theme: 'linear-gradient(135deg, #006699 0%, #002b40 100%)', icon: '🐠', slug: '3cf4a85cb6dcf4d8836c982c359cd72d', category: 'Hot', imageUrl: 'https://cdn.betnex.co/images/jiligaming/3.webp' },
  { id: '981f5f9675002fbeaaf24c4128b938d7', title: 'Boxing King', provider: 'JILI', badge: '2000x', recommended: true, theme: 'linear-gradient(135deg, #00224b 0%, #000a15 100%)', icon: '🥊', slug: 'boxing-king', category: 'Hot', imageUrl: '/games/super_ace.png' },
  { id: 'e333695bcff28acdbecc641ae6ee2b23', title: 'Bombing Fishing', provider: 'JILI', badge: 'Live API', recommended: true, theme: 'linear-gradient(135deg, #1b263b 0%, #0d131f 100%)', icon: '🦈', slug: 'e333695bcff28acdbecc641ae6ee2b23', category: 'Hot', imageUrl: 'https://cdn.betnex.co/images/jiligaming/1.webp' },
  { id: 'b4af506243cafae52908e8fa266f8ff6', title: 'Speed Roulette', provider: 'Evolution', badge: 'Live Stream', recommended: true, theme: 'linear-gradient(135deg, #311b92 0%, #12005e 100%)', icon: '🎡', slug: 'b4af506243cafae52908e8fa266f8ff6', category: 'Hot', imageUrl: 'https://cdn.betnex.co/images/evolutionlive/3.png' },
  { id: '87a7f4550407f5ed73c3353a54a11187', title: 'Blackjack VIP 12', provider: 'Evolution', badge: 'Live HD', recommended: true, theme: 'linear-gradient(135deg, #004d40 0%, #00251a 100%)', icon: '🃏', slug: '87a7f4550407f5ed73c3353a54a11187', category: 'Hot', imageUrl: 'https://cdn.betnex.co/images/evolutionlive/4.webp' },
  { id: 'ba2adf72179e1ead9e3dae8f0a7d4c07', title: 'Mahjong Ways 2', provider: 'PG', badge: 'Ways 2', recommended: true, theme: 'linear-gradient(135deg, #003c1e 0%, #001207 100%)', icon: '🀄', slug: 'mahjong-ways-2', category: 'Hot', imageUrl: '/games/super_ace.png' },

  // PaddyPower (RapidAPI Integration)
  { id: 'paddy-rainbow-riches', title: 'Rainbow Riches', provider: 'PaddyPower', badge: 'Jackpot', recommended: true, theme: 'linear-gradient(135deg, #1b5e20 0%, #003300 100%)', icon: '🌈', slug: 'super-ace', category: 'PaddyPower', imageUrl: '/games/fortune_gems.png' },
  { id: 'paddy-fishin-frenzy', title: 'Fishin\' Frenzy', provider: 'PaddyPower', badge: 'Popular', recommended: true, theme: 'linear-gradient(135deg, #01579b 0%, #002f6c 100%)', icon: '🎣', slug: 'fortune-gems', category: 'PaddyPower', imageUrl: '/games/fishing.png' },
  { id: 'paddy-roulette-live', title: 'Paddy Roulette Live', provider: 'PaddyPower', badge: 'Live HD', recommended: true, theme: 'linear-gradient(135deg, #311b92 0%, #12005e 100%)', icon: '🎡', slug: 'mini-roulette', category: 'PaddyPower', imageUrl: '/games/live.png' },
  { id: 'paddy-blackjack-exclusive', title: 'Exclusive Blackjack', provider: 'PaddyPower', badge: 'VIP Table', recommended: true, theme: 'linear-gradient(135deg, #004d40 0%, #00251a 100%)', icon: '🃏', slug: 'blackjack-live', category: 'PaddyPower', imageUrl: '/games/live.png' },
  { id: 'paddy-age-of-gods', title: 'Age of the Gods', provider: 'PaddyPower', badge: '4 Jackpots', recommended: true, theme: 'linear-gradient(135deg, #4a148c 0%, #12005e 100%)', icon: '⚡', slug: 'super-ace-deluxe', category: 'PaddyPower', imageUrl: '/games/super_ace.png' },
  { id: 'paddy-mega-fire-blaze', title: 'Mega Fire Blaze', provider: 'PaddyPower', badge: '10,000x', recommended: true, theme: 'linear-gradient(135deg, #bf360c 0%, #3e2723 100%)', icon: '🔥', slug: 'mini-roulette', category: 'PaddyPower', imageUrl: '/games/live.png' },

  // Slots
  { id: 'slots-pg', title: 'Slots', provider: 'PG', badge: '', recommended: false, theme: 'linear-gradient(135deg, #2b3040 0%, #0f1118 100%)', icon: '🎰', slug: 'slots-pg', category: 'Slots', imageUrl: '/games/super_ace.png' },
  { id: 'jili-slots', title: 'JILI Slots', provider: 'JILI', badge: '', recommended: false, theme: 'linear-gradient(135deg, #302610 0%, #120e05 100%)', icon: '🎰', slug: 'jili-slots', category: 'Slots', imageUrl: '/games/fortune_gems.png' },
  { id: 'wg-slots', title: 'WG Slots', provider: 'WG', badge: '', recommended: false, theme: 'linear-gradient(135deg, #0d361b 0%, #031207 100%)', icon: '🎰', slug: 'wg-slots', category: 'Slots', imageUrl: '/games/fortune_gems.png' },
  { id: 'fc-slots', title: 'FC Slots', provider: 'FC', badge: '', recommended: false, theme: 'linear-gradient(135deg, #2b0b30 0%, #0d0310 100%)', icon: '🎰', slug: 'fc-slots', category: 'Slots', imageUrl: '/games/super_ace.png' },
  { id: 'jdb-slots', title: 'JDB Slots', provider: 'JDB', badge: '', recommended: false, theme: 'linear-gradient(135deg, #101c3c 0%, #050a17 100%)', icon: '🎰', slug: 'jdb-slots', category: 'Slots', imageUrl: '/games/fortune_gems.png' },
  { id: 'pp-slots', title: 'PP Slots', provider: 'PP', badge: '', recommended: false, theme: 'linear-gradient(135deg, #22361b 0%, #0b1509 100%)', icon: '🎰', slug: 'pp-slots', category: 'Slots', imageUrl: '/games/super_ace.png' },
  { id: 'mg-slots', title: 'MG Slots', provider: 'MG', badge: '', recommended: false, theme: 'linear-gradient(135deg, #3c0000 0%, #120000 100%)', icon: '🎰', slug: 'mg-slots', category: 'Slots', imageUrl: '/games/fortune_gems.png' },
  { id: 'cq9-slots', title: 'CQ9 Slots', provider: 'CQ9', badge: '', recommended: false, theme: 'linear-gradient(135deg, #4b004b 0%, #150015 100%)', icon: '🎰', slug: 'cq9-slots', category: 'Slots', imageUrl: '/games/super_ace.png' },
  { id: 'bng-slots', title: 'BNG Slots', provider: 'BNG', badge: '', recommended: false, theme: 'linear-gradient(135deg, #00224b 0%, #000a15 100%)', icon: '🎱', slug: 'bng-slots', category: 'Slots', imageUrl: '/games/plinko.png' },

  // Live
  { id: 'pp-live', title: 'PP Live', provider: 'PP', badge: '', recommended: false, theme: 'linear-gradient(135deg, #1a2e3b 0%, #070e14 100%)', icon: '💃', slug: 'mini-roulette', category: 'Live', imageUrl: '/games/live.png' },
  { id: 'sexy-live', title: 'SEXY Live', provider: 'SEXY', badge: 'Hot', recommended: true, theme: 'linear-gradient(135deg, #4b0d2d 0%, #17030e 100%)', icon: '💃', slug: 'sexy-live', category: 'Live', imageUrl: '/games/live.png' },
  { id: 'blackjack-live', title: 'Blackjack Live', provider: 'Evolution', badge: 'Classic', recommended: true, theme: 'linear-gradient(135deg, #0d361b 0%, #031207 100%)', icon: '🃏', slug: 'blackjack-live', category: 'Live', imageUrl: '/games/live.png' },

  // Fishing
  { id: 'jdb-fishing', title: 'JDB Fishing', provider: 'JDB', badge: '', recommended: false, theme: 'linear-gradient(135deg, #004b9b 0%, #001f40 100%)', icon: '🦈', slug: 'jdb-fishing', category: 'Fishing', imageUrl: '/games/fishing.png' },
  { id: 'jili-fishing', title: 'JILI Fishing', provider: 'JILI', badge: 'Hot', recommended: true, theme: 'linear-gradient(135deg, #006699 0%, #002b40 100%)', icon: '🐠', slug: 'fishing-joy', category: 'Fishing', imageUrl: '/games/fishing.png' },
  { id: 'fc-fishing', title: 'FC Fishing', provider: 'FC', badge: '', recommended: false, theme: 'linear-gradient(135deg, #002b40 0%, #001017 100%)', icon: '🐟', slug: 'fishing-joy', category: 'Fishing', imageUrl: '/games/fishing.png' },
  { id: 'ka-fishing', title: 'KA Fishing', provider: 'KA', badge: '', recommended: false, theme: 'linear-gradient(135deg, #1a2e3b 0%, #070e14 100%)', icon: '🐙', slug: 'ka-fishing', category: 'Fishing', imageUrl: '/games/fishing.png' },
  { id: 'ky-fishing', title: 'KY Fishing', provider: 'KY', badge: '', recommended: false, theme: 'linear-gradient(135deg, #0d361b 0%, #031207 100%)', icon: '🦀', slug: 'fishing-joy', category: 'Fishing', imageUrl: '/games/fishing.png' },
  { id: 'baison-fishing', title: 'Baison Fishing', provider: 'Baison', badge: '', recommended: false, theme: 'linear-gradient(135deg, #2b0b30 0%, #0d0310 100%)', icon: '🐳', slug: 'baison-fishing', category: 'Fishing', imageUrl: '/games/fishing.png' },
  { id: 'wg-fishing', title: 'WG Fishing', provider: 'WG', badge: '', recommended: false, theme: 'linear-gradient(135deg, #101c3c 0%, #050a17 100%)', icon: '🦈', slug: 'fishing-joy', category: 'Fishing', imageUrl: '/games/fishing.png' },
  { id: 'cq9-fishing', title: 'CQ9 Fishing', provider: 'CQ9', badge: '', recommended: false, theme: 'linear-gradient(135deg, #22361b 0%, #0b1509 100%)', icon: '🐡', slug: 'cq9-fishing', category: 'Fishing', imageUrl: '/games/fishing.png' },
  { id: 'yellowbat-fishing', title: 'YellowBat Fishing', provider: 'YellowBat', badge: '', recommended: false, theme: 'linear-gradient(135deg, #3c0000 0%, #120000 100%)', icon: '🐋', slug: 'fishing-joy', category: 'Fishing', imageUrl: '/games/fishing.png' },

  // Cards
  { id: 'hilo-orig', title: 'Hi-Lo Cards', provider: 'Originals', badge: 'Streak', recommended: true, theme: 'linear-gradient(135deg, #12003c 0%, #030012 100%)', icon: '🃏', slug: 'hilo', category: 'Cards', imageUrl: '/games/live.png' },
  { id: 'baccarat-orig', title: 'Classic Baccarat', provider: 'Originals', badge: 'Table', recommended: true, theme: 'linear-gradient(135deg, #003c1e 0%, #001207 100%)', icon: '👑', slug: 'baccarat', category: 'Cards', imageUrl: '/games/live.png' },
  { id: 'jili-cards', title: 'JILI Cards', provider: 'JILI', badge: '', recommended: false, theme: 'linear-gradient(135deg, #4b3600 0%, #151000 100%)', icon: '🃏', slug: 'jili-cards', category: 'Cards', imageUrl: '/games/live.png' },
  { id: 'kingmidas-cards', title: 'KingMidas Cards', provider: 'KingMidas', badge: '', recommended: false, theme: 'linear-gradient(135deg, #4b2600 0%, #150a00 100%)', icon: '🃏', slug: 'kingmidas-cards', category: 'Cards', imageUrl: '/games/live.png' },
  { id: 'wg-cards', title: 'WG Cards', provider: 'WG', badge: '', recommended: false, theme: 'linear-gradient(135deg, #004b4b 0%, #001515 100%)', icon: '🃏', slug: 'wg-cards', category: 'Cards', imageUrl: '/games/live.png' },

  // Blockchain
  { id: 'crypto-dice-orig', title: 'Crypto Dice', provider: 'Originals', badge: '98% RTP', recommended: true, theme: 'linear-gradient(135deg, #004b12 0%, #001f0a 100%)', icon: '🎲', slug: 'dice', category: 'Blockchain', imageUrl: '/games/crash.png' },
  { id: 'wheel-orig', title: 'Lucky Wheel', provider: 'Originals', badge: '10x Mult', recommended: true, theme: 'linear-gradient(135deg, #4b3600 0%, #151000 100%)', icon: '🎡', slug: 'wheel', category: 'Blockchain', imageUrl: '/games/crash.png' },
  { id: 'keno-orig', title: 'Keno Classic', provider: 'Originals', badge: '80 Balls', recommended: true, theme: 'linear-gradient(135deg, #2b0b30 0%, #0d0310 100%)', icon: '🎱', slug: 'keno', category: 'Blockchain', imageUrl: '/games/plinko.png' },
  { id: 'crash-blockchain', title: 'JILI Blockchain', provider: 'JILI', badge: 'Multi', recommended: true, theme: 'linear-gradient(135deg, #4b004b 0%, #150015 100%)', icon: '🚀', slug: 'crash', category: 'Blockchain', imageUrl: '/games/crash.png' },
  { id: 'xgame-blockchain', title: 'XGAME Blockchain', provider: 'XGAME', badge: '', recommended: false, theme: 'linear-gradient(135deg, #003c1e 0%, #001207 100%)', icon: '🚀', slug: 'xgame-blockchain', category: 'Blockchain', imageUrl: '/games/crash.png' },
  { id: 'wg-blockchain', title: 'WG Blockchain', provider: 'WG', badge: '', recommended: false, theme: 'linear-gradient(135deg, #00224b 0%, #000a15 100%)', icon: '🚀', slug: 'wg-blockchain', category: 'Blockchain', imageUrl: '/games/crash.png' },
  { id: 'plinko-orig', title: 'Plinko', provider: 'Originals', badge: 'Physics', recommended: true, theme: 'linear-gradient(135deg, #12003c 0%, #030012 100%)', icon: '🟢', slug: 'plinko', category: 'Blockchain', imageUrl: '/games/plinko.png' },
  { id: 'minesweeper-orig', title: 'Minesweeper', provider: 'Originals', badge: 'Gems', recommended: true, theme: 'linear-gradient(135deg, #004b12 0%, #001203 100%)', icon: '💣', slug: 'minesweeper', category: 'Blockchain', imageUrl: '/games/plinko.png' },

  // Cockfight
  { id: 'ds88-cockfight', title: 'DS88 Cockfight', provider: 'DS88', badge: 'Live Fight', recommended: true, theme: 'linear-gradient(135deg, #3c0000 0%, #120000 100%)', icon: '🐓', slug: 'ds88-cockfight', category: 'Cockfight', imageUrl: '/games/live.png' },

  // Sports
  { id: 'crown-sports', title: 'Crown Sports', provider: 'Crown', badge: 'CR7 Live', recommended: true, theme: 'linear-gradient(135deg, #0d361b 0%, #031207 100%)', icon: '⚽', slug: 'crown-sports', category: 'Sports', imageType: 'ronaldo' },
  { id: 'wg-sports', title: 'WG Sports', provider: 'WG', badge: 'Messi Live', recommended: true, theme: 'linear-gradient(135deg, #2b0b30 0%, #0d0310 100%)', icon: '⚽', slug: 'wg-sports', category: 'Sports', imageType: 'messi' },
  { id: 'ug-sports', title: 'UG Sports', provider: 'UG', badge: 'Live Odds', recommended: false, theme: 'linear-gradient(135deg, #101c3c 0%, #050a17 100%)', icon: '⚽', slug: 'ug-sports', category: 'Sports' },
  { id: 'poly-sports', title: 'Poly Sports', provider: 'Poly', badge: '', recommended: false, theme: 'linear-gradient(135deg, #22361b 0%, #0b1509 100%)', icon: '⚽', slug: 'poly-sports', category: 'Sports' },
  { id: '3sing-sports', title: '3 SING Sports', provider: '3 SING', badge: '', recommended: false, theme: 'linear-gradient(135deg, #302610 0%, #120e05 100%)', icon: '⚽', slug: '3-sing-sports', category: 'Sports' },
  { id: 'fb-sports', title: 'FB Sports', provider: 'FB', badge: '', recommended: false, theme: 'linear-gradient(135deg, #122240 0%, #050d1a 100%)', icon: '⚽', slug: 'fb-sports', category: 'Sports' },
]

// Scrolling live winner events
const winEvents = [
  { name: 'ali***77', game: 'Super Ace', amount: 'Rs 4,150.00', provider: 'JILI', avatar: '👨‍💻' },
  { name: 'zain***88', game: 'Mahjong Ways 2', amount: 'Rs 2,850.00', provider: 'WG', avatar: '👩‍⚕️' },
  { name: 'pak***01', game: 'Pinata Wins', amount: 'Rs 1,279.20', provider: 'PG', avatar: '🦁' },
  { name: 'jill***00', game: 'Super Ace', amount: 'Rs 1,033.00', provider: 'JILI', avatar: '🐱' },
  { name: 'asif***99', game: 'DS88 Cockfight', amount: 'Rs 8,900.00', provider: 'DS88', avatar: '🦅' },
  { name: 'messi***10', game: 'WG Sports', amount: 'Rs 12,500.00', provider: 'Sports', avatar: '⚽' },
  { name: 'cr7***77', game: 'Crown Sports', amount: 'Rs 18,200.00', provider: 'Sports', avatar: '🏃' },
  { name: 'user***82', game: 'Plinko', amount: 'Rs 670.00', provider: 'Originals', avatar: '🐸' },
]

export default function Home() {
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
      desc: 'Get 100% matched bonus up to Rs 5,000.00 on your first completed transaction. Instant verification!',
      image: '/banners/deposit.png',
      emoji: '🎁'
    },
    {
      title: 'Refer & Earn Rs 155.55 Cash',
      desc: 'Invite friends using your unique referral code. Get paid immediately upon their sign up!',
      image: '/banners/invite.png',
      emoji: '💸'
    }
  ]

  useEffect(() => {
    // Auto banner transition every 4.5 seconds
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

  // Categories list matching visual screenshots
  const categoriesList = [
    { name: 'Hot', icon: '🔥' },
    { name: 'JILI', icon: '🎰' },
    { name: 'Evolution', icon: '💃' },
    { name: 'PaddyPower', icon: '☘️' },
    { name: 'Slots', icon: '🍒' },
    { name: 'Live', icon: '💎' },
    { name: 'Fishing', icon: '🦈' },
    { name: 'Cards', icon: '🃏' },
    { name: 'Blockchain', icon: '🧊' },
    { name: 'Cockfight', icon: '🐓' },
    { name: 'Sports', icon: '⚽' },
  ]

  // Filter games based on selected tab
  const getFilteredGames = (category) => {
    if (category === 'Hot') {
      return mockGames.filter(g => g.category === 'Hot')
    }
    if (category === 'JILI') {
      return mockGames.filter(g => g.provider === 'JILI')
    }
    if (category === 'Evolution') {
      return mockGames.filter(g => g.provider === 'Evolution')
    }
    if (category === 'PaddyPower') {
      return mockGames.filter(g => g.provider === 'PaddyPower')
    }
    return mockGames.filter(g => g.category === category)
  }

  const filteredGames = getFilteredGames(activeCategory)
  
  // Display all games in the horizontal scrolling row
  const displayedGames = filteredGames

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
                  onClick={() => user ? alert("VIP Rewards Active!") : setIsAuthModalOpen(true)}
                  className="btn primary" 
                  style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: '11px' }}
                >
                  Claim Now
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
            🌟 Welcome to BETPK Official! Earn Rs 155.55 instantly for every friend you refer. Double your first deposit with a 100% Match Bonus up to Rs 5,000.00! Withdrawals are completed in under 2 minutes via Easypaisa and JazzCash! Play JILI slots, Cockfight, and Sportsbook now!
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
          {/* Double list contents for seamless looping */}
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
      <div className="category-bar">
        {categoriesList.map(cat => (
          <button 
            key={cat.name}
            className={`category-chip ${activeCategory === cat.name ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.name)}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Games List Grid Section */}
      <section aria-label="Casino Catalog">
        <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="title-left">
            <span>{activeCategory} Games</span>
          </div>
          <Link href="/casino" style={{ textDecoration: 'none' }}>
            <button style={{
              background: 'linear-gradient(135deg, #00e676 0%, #00897b 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              color: '#000',
              fontWeight: '900',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(0,230,118,0.3)'
            }}>
              <span>🎰</span>
              <span>127+ LIVE PROVIDERS LOBBY →</span>
            </button>
          </Link>
        </div>

        {filteredGames.length > 0 ? (
          <div className="games-grid">
            {displayedGames.map(game => (
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
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--muted)', fontSize: '13px' }}>
            No games found in this category.
          </div>
        )}
      </section>

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
          <strong>BETPK Group</strong> is one of the most famous international online casino operating companies, providing slots, cards, live dealers, sportsbook, and cockfights. Authorized and regulated by the Government of Curacao under licensing authority Antillephone, issued to 8048/JAZ.
        </p>
      </footer>

      {/* Interactive Floating Widget Left (Lucky Spin Wheel) */}
      {showLeftWidget && (
        <div className="floating-widget-left">
          <button className="widget-close-btn" onClick={() => setShowLeftWidget(false)}>✕</button>
          <div className="widget-wheel-container" onClick={() => setShowWheelPopup(true)}>
            <span className="widget-wheel-graphic">🎡</span>
            <span className="widget-wheel-text">Rs 8,888.00</span>
          </div>
        </div>
      )}

      {/* Interactive Floating Widget Right (Referral Invite & Earn) */}
      {showRightWidget && (
        <div className="floating-widget-right">
          <button className="widget-close-btn" onClick={() => setShowRightWidget(false)}>✕</button>
          <div className="widget-wheel-container" style={{ borderColor: 'var(--success)', boxShadow: '0 0 15px rgba(0, 230, 118, 0.4)' }} onClick={() => alert("Invite Friends: Copy your unique referral code from the Invite tab in the footer menu to earn Rs 155.55 instantly per sign-up!")}>
            <span className="widget-wheel-graphic" style={{ animationDelay: '-5s' }}>🤝</span>
            <span className="widget-wheel-text" style={{ background: 'var(--success)' }}>Rs 155.55</span>
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
            background: 'linear-gradient(135deg, #1b1602 0%, #07080c 100%)', 
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
            <h3 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '20px' }}>👑 BETPK Lucky Wheel</h3>
            <p style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '20px' }}>
              Spin the lucky wheel once every day for free to claim massive rewards up to Rs 8,888.00!
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
              background: '#131722',
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

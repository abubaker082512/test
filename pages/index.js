import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'
import GameCard from '../components/GameCard'
import ourGamesCatalog from '../data/ourGamesCatalog.json'

// Curated Hots section matching bbrssms1.com Screenshot 4
const HOTS_GAMES = [
  { id: 'bdfb23c974a2517198c5443adeea77a8', slug: 'winx-theme-super-ace', title: 'Super Ace', provider: 'JILI', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/37.png' },
  { id: 'a990de177577a2e6a889aaac5f57b429', slug: 'winx-theme-fortune-gems', title: 'Fortune Gems 500', provider: 'JILI', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/48.webp' },
  { id: '80aad2a10ae6a95068b50160d6c78897', slug: 'winx-theme-super-ace', title: 'Super Ace Deluxe', provider: 'JILI', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/143.png' },
  { id: '1189baca156e1bbbecc3b26651a63565', slug: 'winx-theme-mahjong-ways', title: 'Mahjong Ways', provider: 'PG', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/pgsoft/0.webp' },
  { id: 'c98bb64436826fe9a2c62955ff70cba9', slug: 'winx-theme-wild-bounty', title: 'Wild Bounty Showdown', provider: 'PG', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/pgsoft/16.png' },
  { id: '490096198e28f770a3f85adb6ee49e0f', slug: '490096198e28f770a3f85adb6ee49e0f', title: 'Golden Empire', provider: 'JILI', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/47.webp' },
  { id: 'db249defce63610fccabfa829a405232', slug: 'winx-theme-money-coming', title: 'Money Coming', provider: 'JILI', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/38.webp' },
  { id: 'a04d1f3eb8ccec8a4823bdf18e3f0e84', slug: 'aviator-pro', title: 'Aviator', provider: 'Spribe', category: 'Crash', imageUrl: 'https://cdn.betnex.co/images/spribe/0.png' },
  { id: 'f08cc025e23ee049b570517867c74be0', slug: 'f08cc025e23ee049b570517867c74be0', title: 'Pinata Wins', provider: 'PG', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/pgsoft/123.png' },
  { id: '981f5f9675002fbeaaf24c4128b938d7', slug: '981f5f9675002fbeaaf24c4128b938d7', title: 'Boxing King', provider: 'JILI', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/41.webp' },
  { id: '8c62471fd4e28c084a61811a3958f7a1', slug: 'classic-slots-neon', title: 'Crazy 777', provider: 'JILI', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/26.png' },
  { id: '6acff19b2d911a8c695ba24371964807', slug: '6acff19b2d911a8c695ba24371964807', title: 'Aztec Priestess', provider: 'JILI', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/82.webp' }
]

// JILI Section with Bento 2x2 Featured #1 Card matching Screenshot 4
const JILI_GAMES = [
  { id: '664fba4da609ee82b78820b1f570f4ad', slug: 'winx-theme-fortune-gems', title: 'Fortune Gems 500x', provider: 'JILI', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/74.webp', featuredBento: true },
  { id: '3a557646c3abb12201c0b8810a8c0966', slug: 'winx-theme-money-coming', title: 'Money Coming Expand', provider: 'JILI', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/163.webp' },
  { id: 'c7a3c072d2330f0eb602ccc6016cff4b', slug: 'winx-theme-classic-slots', title: 'Crazy 777 II', provider: 'JILI', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/211.png' },
  { id: 'bdfb23c974a2517198c5443adeea77a8', slug: 'winx-theme-super-ace', title: 'Super Ace', provider: 'JILI', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/37.png' },
  { id: '984615c9385c42b3dad0db4a9ef89070', slug: '984615c9385c42b3dad0db4a9ef89070', title: 'Charge Buffalo', provider: 'JILI', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/35.webp' },
  { id: '490096198e28f770a3f85adb6ee49e0f', slug: '490096198e28f770a3f85adb6ee49e0f', title: 'Golden Empire', provider: 'JILI', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/47.webp' },
  { id: '63927e939636f45e9d6d0b3717b3b1c1', slug: 'winx-theme-fortune-gems', title: 'Fortune Gems 3', provider: 'JILI', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/142.png' },
  { id: 'eba92b1d3abd5f0d37dfbe112abdf0e2', slug: 'winx-theme-super-ace', title: 'Mega Ace', provider: 'JILI', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/55.png' },
  { id: '6a7e156ceec5c581cd6b9251854fe504', slug: 'mystical-forest-slot', title: 'Fortune Tree', provider: 'JILI', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/14.webp' }
]

// PG Section with Bento 2x2 Featured #1 Card matching Screenshot 4
const PG_GAMES = [
  { id: 'c98bb64436826fe9a2c62955ff70cba9', slug: 'winx-theme-wild-bounty', title: 'Wild Bounty Showdown', provider: 'PG', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/pgsoft/16.png', featuredBento: true },
  { id: 'c268154a85669eea35aa46387834ac76', slug: 'galaxy-slots', title: 'Anubis Wrath', provider: 'PG', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/pgsoft/125.png' },
  { id: 'ba2adf72179e1ead9e3dae8f0a7d4c07', slug: 'winx-theme-mahjong-ways', title: 'Mahjong Ways 2', provider: 'PG', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/pgsoft/1.webp' },
  { id: '1189baca156e1bbbecc3b26651a63565', slug: 'winx-theme-mahjong-ways', title: 'Mahjong Ways', provider: 'PG', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/pgsoft/0.webp' },
  { id: 'e1b4c6b95746d519228744771f15fe4b', slug: 'e1b4c6b95746d519228744771f15fe4b', title: 'Lucky Neko', provider: 'PG', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/pgsoft/4.png' },
  { id: '2fa9a84d096d6ff0bab53f81b79876c8', slug: '2fa9a84d096d6ff0bab53f81b79876c8', title: 'Treasures of Aztec', provider: 'PG', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/pgsoft/2.webp' },
  { id: '95fc290bb05c07b5aad1a054eba4dcc4', slug: '95fc290bb05c07b5aad1a054eba4dcc4', title: 'Wild Bandito', provider: 'PG', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/pgsoft/7.png' },
  { id: 'fedfca553a97a791a3a41c4f1e3bff58', slug: 'fedfca553a97a791a3a41c4f1e3bff58', title: 'Ways of the Qilin', provider: 'PG', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/pgsoft/8.webp' },
  { id: '4afef91d3addb9ce5107abaf3342b9a5', slug: '4afef91d3addb9ce5107abaf3342b9a5', title: 'Dragon Hatch', provider: 'PG', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/pgsoft/9.png' }
]

// IN-OUT / Crash & Instant Originals matching Screenshot 4
const INOUT_GAMES = [
  { id: 'winx-aviator-pro', slug: 'aviator-pro', title: 'Aviator Flight', provider: 'IN-OUT', category: 'Crash', imageUrl: 'https://cdn.betnex.co/images/spribe/0.png' },
  { id: 'winx-stake-plinko', slug: 'stake-plinko', title: 'Plinko 1000x', provider: 'IN-OUT', category: 'Crash', imageUrl: 'https://cdn.betnex.co/images/spribe/8.png' },
  { id: 'winx-stake-mines', slug: 'stake-mines', title: 'Mines Pro 25', provider: 'IN-OUT', category: 'Crash', imageUrl: 'https://cdn.betnex.co/images/spribe/6.png' },
  { id: 'winx-stake-crash', slug: 'stake-crash', title: 'Crash Rocket', provider: 'IN-OUT', category: 'Crash', imageUrl: 'https://cdn.betnex.co/images/spribe/9.png' },
  { id: 'winx-limbo-rocket', slug: 'limbo-rocket', title: 'Limbo 10,000x', provider: 'IN-OUT', category: 'Crash', imageUrl: 'https://cdn.betnex.co/images/spribe/4.png' },
  { id: 'winx-hilo-streak', slug: 'hilo-streak', title: 'Hi-Lo Streak', provider: 'IN-OUT', category: 'Crash', imageUrl: 'https://cdn.betnex.co/images/spribe/3.png' },
  { id: 'winx-keno-neon', slug: 'keno-neon', title: 'Keno 40-Tile', provider: 'IN-OUT', category: 'Crash', imageUrl: 'https://cdn.betnex.co/images/spribe/5.png' },
  { id: 'winx-coin-flip-3d', slug: 'coin-flip-3d', title: 'Cyber Dice', provider: 'IN-OUT', category: 'Crash', imageUrl: 'https://cdn.betnex.co/images/spribe/1.png' },
  { id: 'winx-theme-penalty', slug: 'penalty-shootout-pro', title: 'Goal Shootout', provider: 'IN-OUT', category: 'Crash', imageUrl: 'https://cdn.betnex.co/images/spribe/2.png' }
]

// Pragmatic Play / Amigo Slots Section matching Screenshot 4
const PP_SLOTS = [
  { id: 'e30cd08c54817096e863975e309bb457', slug: 'e30cd08c54817096e863975e309bb457', title: 'Gates of Olympus', provider: 'PP', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/pragmaticslots/0.webp' },
  { id: '8a0b30eb466a8a07027cbddc19369d0f', slug: '8a0b30eb466a8a07027cbddc19369d0f', title: 'Sweet Bonanza', provider: 'PP', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/pragmaticslots/1.webp' },
  { id: '259ad8e105ef217dad404bffe0fff257', slug: '259ad8e105ef217dad404bffe0fff257', title: 'Mahjong Wins', provider: 'PP', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/pragmaticslots/9.png' },
  { id: 'd1f8f611d448510a487271b818eabe2f', slug: 'wheel-of-fortune', title: 'Blitz Super Wheel', provider: 'PP', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/pragmaticslots/26.png' },
  { id: 'ba3dc54ad1f451262910dda6c61001ce', slug: 'ba3dc54ad1f451262910dda6c61001ce', title: 'Aztec Gems', provider: 'PP', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/pragmaticslots/47.png' },
  { id: '44ab0ddf84f32cc79f6bdcf6309b9710', slug: 'winx-theme-wheel', title: "Wheel O'Gold", provider: 'PP', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/pragmaticslots/138.webp' }
]

// Fishing / Top Player Section matching Screenshot 4
const FISHING_GAMES = [
  { id: 'e794bf5717aca371152df192341fe68b', slug: 'fishing-joy-cannon', title: 'Royal Fishing', provider: 'JILI', category: 'Fishing', imageUrl: 'https://cdn.betnex.co/images/jiligaming/0.webp' },
  { id: 'e333695bcff28acdbecc641ae6ee2b23', slug: 'fishing-joy-cannon', title: 'Bombing Fishing', provider: 'JILI', category: 'Fishing', imageUrl: 'https://cdn.betnex.co/images/jiligaming/1.webp' },
  { id: 'eef3e28f0e3e7b72cbca61e7924d00f1', slug: 'fishing-joy-cannon', title: 'Dinosaur Tycoon', provider: 'JILI', category: 'Fishing', imageUrl: 'https://cdn.betnex.co/images/jiligaming/2.png' },
  { id: '3cf4a85cb6dcf4d8836c982c359cd72d', slug: 'fishing-joy-cannon', title: 'Jackpot Fishing', provider: 'JILI', category: 'Fishing', imageUrl: 'https://cdn.betnex.co/images/jiligaming/3.webp' },
  { id: '1200b82493e4788d038849bca884d773', slug: 'fishing-joy-cannon', title: 'Dragon Fortune', provider: 'JILI', category: 'Fishing', imageUrl: 'https://cdn.betnex.co/images/jiligaming/4.webp' },
  { id: 'caacafe3f64a6279e10a378ede09ff38', slug: 'fishing-joy-cannon', title: 'Mega Fishing', provider: 'JILI', category: 'Fishing', imageUrl: 'https://cdn.betnex.co/images/jiligaming/5.png' }
]

// Cards & Live Casino Section matching Screenshot 4
const CARDS_LIVE_GAMES = [
  { id: 'winx-blackjack-pro', slug: 'blackjack-pro', title: 'Blackjack 21 VIP', provider: 'WINX', category: 'Cards', imageUrl: 'https://cdn.betnex.co/images/jiligaming/137.webp' },
  { id: 'winx-baccarat-royale', slug: 'baccarat-royale', title: 'Macau VIP Baccarat', provider: 'WINX', category: 'Cards', imageUrl: 'https://cdn.betnex.co/images/pgsoft/46.webp' },
  { id: 'winx-theme-dragon-tiger', slug: 'dragon-tiger-pro', title: 'Dragon Tiger Arena', provider: 'WINX', category: 'Cards', imageUrl: 'https://cdn.betnex.co/images/pgsoft/57.webp' },
  { id: 'winx-video-poker', slug: 'video-poker', title: 'Video Poker Royal', provider: 'WINX', category: 'Cards', imageUrl: 'https://cdn.betnex.co/images/jiligaming/188.png' },
  { id: 'winx-euro-roulette', slug: 'euro-roulette', title: 'European Roulette', provider: 'WINX', category: 'Live', imageUrl: 'https://cdn.betnex.co/images/jiligaming/115.webp' },
  { id: 'winx-theme-sicbo', slug: 'winx-theme-sicbo', title: 'Super Sic Bo Macau', provider: 'EVO', category: 'Live', imageUrl: 'https://cdn.betnex.co/images/evolutionlive/16.webp' }
]

// Sports Section matching Screenshot 4
const SPORT_GAMES = [
  { id: 'winx-theme-penalty', slug: 'penalty-shootout-pro', title: 'World Cup Penalty', provider: 'SPORT', category: 'Our Games', imageUrl: 'https://cdn.betnex.co/images/spribe/2.png' },
  { id: 'winx-theme-derby', slug: 'royal-derby', title: 'Royal Horse Derby', provider: 'SPORT', category: 'Our Games', imageUrl: 'https://cdn.betnex.co/images/jiligaming/172.webp' },
  { id: 'sports-soccer-live', slug: 'sports-soccer-live', title: 'Premier League 1X2', provider: 'SPORT', category: 'Sports', imageUrl: 'https://cdn.betnex.co/images/jiligaming/181.png' }
]

// 3-Tab Welcome Promotional Modal Data (matching Screenshots 1, 2, 3)
const PROMO_MODAL_TABS = [
  {
    id: 'qr',
    label: 'Added QR code top-up',
    image: '/banners/promo-qr.png',
    href: '/wallet'
  },
  {
    id: 'usdt',
    label: 'Added USDT deposit channel',
    image: '/banners/promo-usdt.png',
    href: '/wallet'
  },
  {
    id: 'invite',
    label: 'Get a bonus of 1,500 + 800 + 2,000 immediately.',
    image: '/banners/promo-invite.png',
    href: '/invite'
  }
]

// Left Sticky Vertical Sidebar Categories (matching Screenshot 4)
const SIDEBAR_CATEGORIES = [
  { id: 'hots', label: 'Hots', icon: '🔥', sectionId: 'sec-hots' },
  { id: 'jili', label: 'JILI', icon: '🎰', sectionId: 'sec-jili' },
  { id: 'pg', label: 'PG Soft', icon: '🎮', sectionId: 'sec-pg' },
  { id: 'inout', label: 'IN-OUT', icon: '✈️', sectionId: 'sec-inout' },
  { id: 'diamond', label: 'Diamond', icon: '💎', sectionId: 'sec-diamond' },
  { id: 'slot', label: 'PP Slots', icon: '🍒', sectionId: 'sec-slot' },
  { id: 'our', label: 'Originals', icon: '👑', sectionId: 'sec-our' },
  { id: 'fish', label: 'Fishing', icon: '🐟', sectionId: 'sec-fish' },
  { id: 'cards', label: 'Cards', icon: '🃏', sectionId: 'sec-cards' }
]

export default function Home() {
  const router = useRouter()
  const { user } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [activeSidebar, setActiveSidebar] = useState('hots')
  const [expandedSections, setExpandedSections] = useState({ our: false })

  // 3-Tab Welcome Promo Popup Modal state (Screenshots 1, 2, 3)
  const [showPromoModal, setShowPromoModal] = useState(false)
  const [activePromoTab, setActivePromoTab] = useState(0)

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem('winx_bbr_promo_seen')
      if (!seen) {
        setShowPromoModal(true)
        sessionStorage.setItem('winx_bbr_promo_seen', '1')
      }
    } catch (e) {
      setShowPromoModal(true)
    }
  }, [])

  // Auto-Scrollspy to highlight active sidebar item as user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200
      for (let i = SIDEBAR_CATEGORIES.length - 1; i >= 0; i--) {
        const item = SIDEBAR_CATEGORIES[i]
        const el = document.getElementById(item.sectionId)
        if (el && el.offsetTop <= scrollPos) {
          setActiveSidebar(item.id)
          break
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle ?tab= query parameter (e.g., ?tab=our-games)
  useEffect(() => {
    if (!router.isReady) return
    const { tab } = router.query
    if (tab) {
      const t = String(tab).toLowerCase()
      if (t.includes('our')) {
        setActiveSidebar('our')
        setExpandedSections(prev => ({ ...prev, our: true }))
        setTimeout(() => {
          const el = document.getElementById('sec-our')
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 150)
      }
    }
  }, [router.isReady, router.query])

  const handleSidebarClick = (item) => {
    setActiveSidebar(item.id)
    if (item.id === 'our') {
      setExpandedSections(prev => ({ ...prev, our: true }))
    }
    const el = document.getElementById(item.sectionId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const toggleExpandSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Prepare Diamond Casino & Our Games lists with #1 as 2x2 Bento Featured Card when not expanded
  const diamondCatalog = ourGamesCatalog.filter(g => g.id && g.id.startsWith('diamond-'))
  const visibleDiamondGames = expandedSections.diamond ? diamondCatalog : diamondCatalog.slice(0, 9)
  const visibleOurGames = expandedSections.our ? ourGamesCatalog : ourGamesCatalog.slice(0, 9)

  return (
    <div className="app bbr-theme-app">
      <NavBar onOpenPromoModal={() => setShowPromoModal(true)} />

      {/* Hero Banner with 3D Artwork & 4 Gold Deposit Tier Badges (matching Screenshot 4) */}
      <div className="bbr-hero-banner" onClick={() => router.push('/wallet')}>
        <div className="bbr-hero-top-row">
          <div className="bbr-hero-content">
            <span className="bbr-hero-badge">👑 WINX VIP RECHARGE</span>
            <div className="bbr-hero-headline">
              RECHARGE 100<br />
              <span style={{ color: '#6dff38' }}>GRAB RS 100</span>
            </div>
            <div className="bbr-hero-sub">
              ⚡ Instant QR &amp; USDT Deposit Bonus
            </div>
          </div>
          <div className="bbr-hero-char-wrap">
            <img src="/banners/down_banner.png" alt="Casino Mascot" className="bbr-hero-char-img" />
          </div>
        </div>
        <div className="bbr-hero-tiers-grid">
          <div className="bbr-tier-pill">
            <span className="bbr-tier-label">1ST DEPOSIT</span>
            <span className="bbr-tier-val">+35%</span>
          </div>
          <div className="bbr-tier-pill">
            <span className="bbr-tier-label">2ND DEPOSIT</span>
            <span className="bbr-tier-val">+25%</span>
          </div>
          <div className="bbr-tier-pill">
            <span className="bbr-tier-label">3RD DEPOSIT</span>
            <span className="bbr-tier-val">+25%</span>
          </div>
          <div className="bbr-tier-pill">
            <span className="bbr-tier-label">4TH DEPOSIT</span>
            <span className="bbr-tier-val">+35%</span>
          </div>
        </div>
      </div>

      {/* Dual Action Bar Directly Below Hero Banner (matching Screenshot 4 / bbrssms1.com) */}
      <div className="bbr-dual-cta-bar">
        {!user ? (
          <>
            <button
              type="button"
              className="bbr-cta-outline"
              onClick={() => setIsAuthModalOpen(true)}
            >
              Log in
            </button>
            <button
              type="button"
              className="bbr-cta-lime"
              onClick={() => setIsAuthModalOpen(true)}
            >
              Sign Up
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="bbr-cta-lime"
              onClick={() => router.push('/wallet')}
            >
              💳 Deposit
            </button>
            <button
              type="button"
              className="bbr-cta-outline"
              onClick={() => router.push('/wallet?tab=withdraw')}
            >
              🏧 Withdraw
            </button>
          </>
        )}
      </div>

      {/* Rounded Emerald Speaker Marquee Bar (matching Screenshot 4) */}
      <div className="bbr-marquee-pill" onClick={() => setShowPromoModal(true)}>
        <span className="bbr-marquee-speaker">🔊</span>
        <div className="bbr-marquee-track-wrap">
          <span className="bbr-marquee-scroll">
            Welcome to WINX Official! JazzCash &amp; Easypaisa QR instant top-up is live • USDT-TRC20 deposits get +3% instant bonus • Invite friends to claim Rs 1,500 + 800 + 2,000 immediately!
          </span>
        </div>
      </div>

      {/* Two-Column Split Lobby: Left Sticky Vertical Category Sidebar + Right Game Sections (matching Screenshot 4) */}
      <div className="bbr-lobby-split">
        {/* Left Sticky Vertical Sidebar */}
        <aside className="bbr-left-sidebar">
          {SIDEBAR_CATEGORIES.map(item => (
            <button
              key={item.id}
              type="button"
              className={`bbr-side-btn ${activeSidebar === item.id ? 'active' : ''}`}
              onClick={() => handleSidebarClick(item)}
            >
              <span className="bbr-side-icon">{item.icon}</span>
              <span className="bbr-side-label">{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Right Scrollable Game Grid Sections */}
        <main className="bbr-right-sections">
          {/* 1. HOTS SECTION */}
          <section id="sec-hots" className="bbr-provider-section">
            <div className="bbr-sec-header">
              <div className="bbr-sec-title">
                <span className="bbr-sec-icon">🔥</span>
                <span>Hots</span>
                <span className="bbr-sec-count">{HOTS_GAMES.length}</span>
              </div>
              <div className="bbr-sec-actions">
                <button type="button" className="bbr-sec-more" onClick={() => handleSidebarClick({ id: 'jili', sectionId: 'sec-jili' })}>
                  More ›
                </button>
              </div>
            </div>
            <div className="bbr-poster-grid">
              {HOTS_GAMES.map(game => (
                <GameCard key={game.id} {...game} />
              ))}
            </div>
          </section>

          {/* 2. JILI SECTION (Bento 2x2 Featured #1 Fortune Gems 500x matching Screenshot 4) */}
          <section id="sec-jili" className="bbr-provider-section">
            <div className="bbr-sec-header">
              <div className="bbr-sec-title">
                <span className="bbr-sec-badge-pill jili">JILI</span>
                <span>JILI Gaming</span>
                <span className="bbr-sec-count">{JILI_GAMES.length}</span>
              </div>
              <div className="bbr-sec-actions">
                <span className="bbr-sec-nav-pill">&lt;</span>
                <span className="bbr-sec-nav-pill">&gt;</span>
                <button type="button" className="bbr-sec-more" onClick={() => handleSidebarClick({ id: 'pg', sectionId: 'sec-pg' })}>
                  More ›
                </button>
              </div>
            </div>
            <div className="bbr-poster-grid">
              {JILI_GAMES.map(game => (
                <GameCard key={game.id} {...game} />
              ))}
            </div>
          </section>

          {/* 3. PG SECTION (Bento 2x2 Featured #1 Wild Bounty Showdown matching Screenshot 4) */}
          <section id="sec-pg" className="bbr-provider-section">
            <div className="bbr-sec-header">
              <div className="bbr-sec-title">
                <span className="bbr-sec-badge-pill pg">PG</span>
                <span>PG Soft</span>
                <span className="bbr-sec-count">{PG_GAMES.length}</span>
              </div>
              <div className="bbr-sec-actions">
                <span className="bbr-sec-nav-pill">&lt;</span>
                <span className="bbr-sec-nav-pill">&gt;</span>
                <button type="button" className="bbr-sec-more" onClick={() => handleSidebarClick({ id: 'inout', sectionId: 'sec-inout' })}>
                  More ›
                </button>
              </div>
            </div>
            <div className="bbr-poster-grid">
              {PG_GAMES.map(game => (
                <GameCard key={game.id} {...game} />
              ))}
            </div>
          </section>

          {/* 4. IN-OUT / SPRIBE CRASH SECTION */}
          <section id="sec-inout" className="bbr-provider-section">
            <div className="bbr-sec-header">
              <div className="bbr-sec-title">
                <span className="bbr-sec-badge-pill inout">IN-OUT</span>
                <span>Crash &amp; Instant</span>
                <span className="bbr-sec-count">{INOUT_GAMES.length}</span>
              </div>
              <div className="bbr-sec-actions">
                <span className="bbr-sec-nav-pill">&lt;</span>
                <span className="bbr-sec-nav-pill">&gt;</span>
                <button type="button" className="bbr-sec-more" onClick={() => handleSidebarClick({ id: 'diamond', sectionId: 'sec-diamond' })}>
                  More ›
                </button>
              </div>
            </div>
            <div className="bbr-poster-grid">
              {INOUT_GAMES.map(game => (
                <GameCard key={game.id} {...game} />
              ))}
            </div>
          </section>

          {/* 5. DIAMOND CASINO (NO GGR) LIVE & VIRTUAL TABLES SECTION */}
          <section id="sec-diamond" className="bbr-provider-section">
            <div className="bbr-sec-header">
              <div className="bbr-sec-title">
                <span className="bbr-sec-badge-pill diamond">DIAMOND</span>
                <span>Diamond Live Casino</span>
                <span className="bbr-sec-count">{diamondCatalog.length}</span>
              </div>
              <div className="bbr-sec-actions">
                <button
                  type="button"
                  className="bbr-sec-more"
                  onClick={() => toggleExpandSection('diamond')}
                >
                  {expandedSections.diamond ? 'Show Less' : `More (${diamondCatalog.length}) ›`}
                </button>
              </div>
            </div>
            <div className="bbr-poster-grid">
              {visibleDiamondGames.map((game, idx) => (
                <GameCard
                  key={game.id}
                  {...game}
                  featuredBento={!expandedSections.diamond && idx === 0}
                />
              ))}
            </div>
            {!expandedSections.diamond && (
              <button
                type="button"
                className="bbr-load-more-bar"
                onClick={() => toggleExpandSection('diamond')}
              >
                View All {diamondCatalog.length} Diamond Casino Tables ▾
              </button>
            )}
          </section>

          {/* 6. PP / PRAGMATIC PLAY SLOTS SECTION */}
          <section id="sec-slot" className="bbr-provider-section">
            <div className="bbr-sec-header">
              <div className="bbr-sec-title">
                <span className="bbr-sec-badge-pill pp">PP</span>
                <span>Pragmatic Play</span>
                <span className="bbr-sec-count">{PP_SLOTS.length}</span>
              </div>
              <div className="bbr-sec-actions">
                <span className="bbr-sec-nav-pill">&lt;</span>
                <span className="bbr-sec-nav-pill">&gt;</span>
                <button type="button" className="bbr-sec-more" onClick={() => handleSidebarClick({ id: 'our', sectionId: 'sec-our' })}>
                  More ›
                </button>
              </div>
            </div>
            <div className="bbr-poster-grid">
              {PP_SLOTS.map(game => (
                <GameCard key={game.id} {...game} />
              ))}
            </div>
          </section>

          {/* 7. OUR GAMES / WINX ORIGINALS SECTION (36 Playable Games with Bento 2x2 Featured #1) */}
          <section id="sec-our" className="bbr-provider-section">
            <div className="bbr-sec-header">
              <div className="bbr-sec-title">
                <span className="bbr-sec-badge-pill winx">WINX</span>
                <span>WinX Originals</span>
                <span className="bbr-sec-count">{ourGamesCatalog.length}</span>
              </div>
              <div className="bbr-sec-actions">
                <button
                  type="button"
                  className="bbr-sec-more"
                  onClick={() => toggleExpandSection('our')}
                >
                  {expandedSections.our ? 'Show Less' : `More (${ourGamesCatalog.length}) ›`}
                </button>
              </div>
            </div>
            <div className="bbr-poster-grid">
              {visibleOurGames.map((game, idx) => (
                <GameCard
                  key={game.id}
                  {...game}
                  featuredBento={!expandedSections.our && idx === 0}
                />
              ))}
            </div>
            {!expandedSections.our && (
              <button
                type="button"
                className="bbr-load-more-bar"
                onClick={() => toggleExpandSection('our')}
              >
                View All {ourGamesCatalog.length} Our Games ▾
              </button>
            )}
          </section>

          {/* 8. FISHING JOY SECTION */}
          <section id="sec-fish" className="bbr-provider-section">
            <div className="bbr-sec-header">
              <div className="bbr-sec-title">
                <span className="bbr-sec-badge-pill fish">FISH</span>
                <span>Royal Fishing</span>
                <span className="bbr-sec-count">{FISHING_GAMES.length}</span>
              </div>
              <div className="bbr-sec-actions">
                <button type="button" className="bbr-sec-more" onClick={() => handleSidebarClick({ id: 'cards', sectionId: 'sec-cards' })}>
                  More ›
                </button>
              </div>
            </div>
            <div className="bbr-poster-grid">
              {FISHING_GAMES.map(game => (
                <GameCard key={game.id + game.title} {...game} />
              ))}
            </div>
          </section>

          {/* 9. CARDS & LIVE DEALER SECTION */}
          <section id="sec-cards" className="bbr-provider-section">
            <div className="bbr-sec-header">
              <div className="bbr-sec-title">
                <span className="bbr-sec-badge-pill cards">CARDS</span>
                <span>Cards &amp; Live Dealers</span>
                <span className="bbr-sec-count">{CARDS_LIVE_GAMES.length}</span>
              </div>
              <div className="bbr-sec-actions">
                <button type="button" className="bbr-sec-more" onClick={() => handleSidebarClick({ id: 'sport', sectionId: 'sec-sport' })}>
                  More ›
                </button>
              </div>
            </div>
            <div className="bbr-poster-grid">
              {CARDS_LIVE_GAMES.map(game => (
                <GameCard key={game.id} {...game} />
              ))}
            </div>
          </section>

          {/* 9. SPORT SECTION */}
          <section id="sec-sport" className="bbr-provider-section">
            <div className="bbr-sec-header">
              <div className="bbr-sec-title">
                <span className="bbr-sec-icon">⚽</span>
                <span>SPORT</span>
              </div>
              <div className="bbr-sec-actions">
                <Link href="/sports" className="bbr-sec-more" style={{ textDecoration: 'none' }}>
                  More
                </Link>
              </div>
            </div>
            <div className="bbr-poster-grid">
              {SPORT_GAMES.map(game => (
                <GameCard key={game.id} {...game} />
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* Rich Brand Footer matching bottom of Screenshot 4 */}
      <footer className="bbr-footer">
        <div className="bbr-footer-mascot-wrap">
          <img src="/banners/pdd_banner.png" alt="WINX Casino" className="bbr-footer-mascot" />
          <div className="bbr-footer-brand">WINX.COM</div>
        </div>

        <div className="bbr-social-row">
          <button type="button" className="bbr-social-circle fb" onClick={() => router.push('/support')}>f</button>
          <button type="button" className="bbr-social-circle tg" onClick={() => router.push('/support')}>✈</button>
          <button type="button" className="bbr-social-circle wa" onClick={() => router.push('/support')}>💬</button>
          <div className="bbr-social-circle age18">18+</div>
        </div>

        <div className="bbr-footer-copy">
          <p>
            <strong>WINX.COM</strong> is one of the best and most popular online slot websites in Pakistan and draws inspiration from classic casinos. An entertaining showcase, a safe, fun, different, thrilling, interactive, and benchmarked multiplayer game platform; we are committed and faithful to providing modern sensibilities to players seeking high-end and reliable online slot gaming experiences.
          </p>
          <ul>
            <li>1. This product is for users aged 18 and above only.</li>
            <li>2. This game contains in-app purchases.</li>
            <li>3. Winning in social casino games does not guarantee future success in real-money betting and related games.</li>
          </ul>
          <div className="bbr-copyright">Copyright © 2026 WINX Reserved</div>
        </div>
      </footer>

      {/* 3-Tab Welcome Promotional Modal Popup (matching Screenshots 1, 2, and 3) */}
      {showPromoModal && (
        <div className="bbr-modal-backdrop" onClick={() => setShowPromoModal(false)}>
          <div className="bbr-modal-wrapper" onClick={e => e.stopPropagation()}>
            <div className="bbr-modal-card">
              <div
                className="bbr-modal-art-box"
                onClick={() => {
                  const target = PROMO_MODAL_TABS[activePromoTab]?.href || '/wallet'
                  setShowPromoModal(false)
                  router.push(target)
                }}
              >
                <img
                  src={PROMO_MODAL_TABS[activePromoTab]?.image}
                  alt={PROMO_MODAL_TABS[activePromoTab]?.label}
                  className="bbr-modal-art-img"
                />
              </div>

              {/* 3-Tab Bottom Switcher matching Screenshots 1, 2, 3 */}
              <div className="bbr-modal-tabs">
                {PROMO_MODAL_TABS.map((tab, idx) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`bbr-modal-tab-btn ${activePromoTab === idx ? 'active' : ''}`}
                    onClick={() => setActivePromoTab(idx)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Circular Translucent Close Button Below Modal */}
            <button
              type="button"
              className="bbr-modal-close-circle"
              onClick={() => setShowPromoModal(false)}
              aria-label="Close promotional modal"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <BottomNav />
    </div>
  )
}

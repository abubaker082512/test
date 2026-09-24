import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'
import GameCard from '../components/GameCard'

// Light curated featured list for 0ms instant initial rendering (36 top picks)
const featuredGames = [
  // JILI Flagships
  { id: 'bdfb23c974a2517198c5443adeea77a8', slug: 'super-ace', title: 'Super Ace', provider: 'JILI', category: 'Slots', badge: 'Top Pick', recommended: true, theme: 'linear-gradient(135deg, #1f0a38 0%, #0c0317 100%)', imageUrl: 'https://cdn.betnex.co/images/jiligaming/48.webp' },
  { id: '664fba4da609ee82b78820b1f570f4ad', slug: 'fortune-gems-2', title: 'Fortune Gems 2', provider: 'JILI', category: 'Slots', badge: 'Top Pick', recommended: true, theme: 'linear-gradient(135deg, #1f0a38 0%, #0c0317 100%)', imageUrl: 'https://cdn.betnex.co/images/jiligaming/74.webp' },
  { id: 'e794bf5717aca371152df192341fe68b', slug: 'royal-fishing', title: 'Royal Fishing', provider: 'JILI', category: 'Fishing', badge: 'Fish Hunter', recommended: true, theme: 'linear-gradient(135deg, #1f0a38 0%, #0c0317 100%)', imageUrl: 'https://cdn.betnex.co/images/jiligaming/0.webp' },
  { id: '981f5f9675002fbeaaf24c4128b938d7', slug: 'boxing-king', title: 'Boxing King', provider: 'JILI', category: 'Slots', badge: 'Free Spins', recommended: true, theme: 'linear-gradient(135deg, #1f0a38 0%, #0c0317 100%)', imageUrl: 'https://cdn.betnex.co/images/jiligaming/235.png' },

  // PG Soft Flagships
  { id: 'ba2adf72179e1ead9e3dae8f0a7d4c07', slug: 'mahjong-ways-2', title: 'Mahjong Ways 2', provider: 'PG Soft', category: 'Slots', badge: 'Golden Dragon', recommended: true, theme: 'linear-gradient(135deg, #1f0a38 0%, #0c0317 100%)', imageUrl: 'https://cdn.betnex.co/images/pgsoft/0.webp' },
  { id: '2fa9a84d096d6ff0bab53f81b79876c8', slug: 'wild-bounty-showdown', title: 'Wild Bounty Showdown', provider: 'PG Soft', category: 'Slots', badge: '1024 Ways', recommended: true, theme: 'linear-gradient(135deg, #1f0a38 0%, #0c0317 100%)', imageUrl: 'https://cdn.betnex.co/images/pgsoft/1.webp' },

  // Spribe Crash & Mini Games
  { id: 'a04d1f3eb8ccec8a4823bdf18e3f0e84', slug: 'spribe_aviator', title: 'Aviator', provider: 'Spribe', category: 'Crash', badge: '10,000x', recommended: true, theme: 'linear-gradient(135deg, #1f0a38 0%, #0c0317 100%)', imageUrl: 'https://cdn.betnex.co/images/spribe/0.png' },
  { id: '5c4a12fb0a9b296d9b0d5f9e1cd41d65', slug: 'mines', title: 'Mines', provider: 'Spribe', category: 'Mini Games', badge: 'Custom Mines', recommended: true, theme: 'linear-gradient(135deg, #1f0a38 0%, #0c0317 100%)', imageUrl: 'https://cdn.betnex.co/images/spribe/6.png' },
  { id: '6ab7a4fe5161936012d6b06143918223', slug: 'plinko', title: 'Plinko', provider: 'Spribe', category: 'Mini Games', badge: '1000x Pins', recommended: true, theme: 'linear-gradient(135deg, #1f0a38 0%, #0c0317 100%)', imageUrl: 'https://cdn.betnex.co/images/spribe/8.png' },

  // Pragmatic Play Flagships
  { id: 'e30cd08c54817096e863975e309bb457', slug: 'gates-of-olympus', title: 'Gates of Olympus 1000', provider: 'Pragmatic Play', category: 'Slots', badge: '5000x Max', recommended: true, theme: 'linear-gradient(135deg, #1f0a38 0%, #0c0317 100%)', imageUrl: 'https://cdn.betnex.co/images/pragmaticslots/0.webp' },
  { id: '8a0b30eb466a8a07027cbddc19369d0f', slug: 'sweet-bonanza', title: 'Sweet Bonanza 1000', provider: 'Pragmatic Play', category: 'Slots', badge: 'Tumble 100x', recommended: true, theme: 'linear-gradient(135deg, #1f0a38 0%, #0c0317 100%)', imageUrl: 'https://cdn.betnex.co/images/pragmaticslots/1.webp' },

  // Evolution Live Dealers
  { id: '36b1e71c6f51827e24261d06a22b1e31', slug: 'lightning-roulette', title: 'Lightning Roulette Live', provider: 'Evolution', category: 'Live', badge: '500x Multiplier', recommended: true, theme: 'linear-gradient(135deg, #1f0a38 0%, #0c0317 100%)', imageUrl: 'https://cdn.betnex.co/images/evolutionlive/0.webp' },
  { id: '917c0c51d248c33eb058e3210a2e7371', slug: 'crazy-time', title: 'Crazy Time Live Show', provider: 'Evolution', category: 'Live', badge: '4 Bonus Games', recommended: true, theme: 'linear-gradient(135deg, #1f0a38 0%, #0c0317 100%)', imageUrl: 'https://cdn.betnex.co/images/evolutionlive/1.webp' },
  { id: '3b502aee6c9e1ef0f698332ee1b76634', slug: 'blackjack-live', title: 'Blackjack VIP Platinum', provider: 'Evolution', category: 'Live', badge: 'VIP Table', recommended: true, theme: 'linear-gradient(135deg, #1f0a38 0%, #0c0317 100%)', imageUrl: 'https://cdn.betnex.co/images/evolutionlive/2.webp' },

  // BetStack Sportsbook
  { id: 'sports-nfl-live', slug: 'sports-nfl-live', title: 'NFL Football Live Odds', provider: 'BetStack Sports', category: 'Sports', badge: 'Live 1X2', recommended: true, theme: 'linear-gradient(135deg, #0d47a1 0%, #000a12 100%)', imageUrl: '/games/crash.png' },
  { id: 'sports-soccer-live', slug: 'sports-soccer-live', title: 'Premier League Soccer', provider: 'BetStack Sports', category: 'Sports', badge: '1X2 Live', recommended: true, theme: 'linear-gradient(135deg, #1b5e20 0%, #003300 100%)', imageUrl: '/games/live.png' }
]

// Scrolling live winner events
const winEvents = [
  { name: 'ali***77', game: 'Super Ace', amount: 'Pi 24,150.00', provider: 'JILI', avatar: '🃏' },
  { name: 'zain***88', game: 'Fortune Gems 2', amount: 'Pi 12,850.00', provider: 'JILI', avatar: '💎' },
  { name: 'pak***01', game: 'Mahjong Ways 2', amount: 'Pi 18,279.20', provider: 'PG Soft', avatar: '🐲' },
  { name: 'jill***00', game: 'Gates of Olympus', amount: 'Pi 48,033.00', provider: 'Pragmatic', avatar: '⚡' },
  { name: 'asif***99', game: 'Lightning Roulette', amount: 'Pi 15,900.00', provider: 'Evolution', avatar: '🎡' },
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
  const [showCouponBanner, setShowCouponBanner] = useState(true)
  
  // Interactive mini game popups
  const [showWheelPopup, setShowWheelPopup] = useState(false)
  const [spinningWheel, setSpinningWheel] = useState(false)
  const [wheelPrize, setWheelPrize] = useState(null)
  const [wheelError, setWheelError] = useState(null)

  // Category Cache & Async State
  const [categoryGames, setCategoryGames] = useState({})
  const [categoryLoading, setCategoryLoading] = useState(false)

  const scrollSection = (catName, direction) => {
    const el = document.getElementById('grid-' + catName)
    if (el) {
      const amount = direction === 'left' ? -260 : 260
      el.scrollBy({ left: amount, behavior: 'smooth' })
    }
  }

  // Fetch games lazily per category tab with local in-memory cache
  const loadCategory = async (catName) => {
    if (catName === 'Hot') return;
    if (categoryGames[catName]) return; // Already cached in memory

    setCategoryLoading(true);
    try {
      const res = await fetch(`/api/games?category=${encodeURIComponent(catName)}&limit=36`);
      if (res.ok) {
        const json = await res.json();
        const list = json.data || json.games || [];
        setCategoryGames(prev => ({
          ...prev,
          [catName]: list.map(g => ({
            id: g.id || g.slug,
            title: g.title || g.name,
            provider: g.provider,
            category: g.category || catName,
            imageUrl: g.imageUrl || g.img || 'https://cdn.betnex.co/images/jiligaming/0.webp',
            badge: g.badge || 'Hot',
            recommended: g.recommended || false,
            theme: g.theme || 'linear-gradient(135deg, #1f0a38 0%, #0c0317 100%)',
            slug: g.id || g.slug
          }))
        }));
      }
    } catch (e) {
      console.error('Failed to load category:', catName, e);
    } finally {
      setCategoryLoading(false);
    }
  };

  useEffect(() => {
    // Preload all categories so all homepage sections display 3-column vertical grids on top-to-bottom scroll
    const preloadAllCategories = async () => {
      const catsToLoad = ['Slots', 'Mini Games', 'Cards', 'Fishing', 'Live', 'Sports', 'Crash'];
      for (const cat of catsToLoad) {
        try {
          const res = await fetch(`/api/games?category=${encodeURIComponent(cat)}&limit=18`);
          if (res.ok) {
            const json = await res.json();
            const list = json.data || json.games || [];
            if (list.length > 0) {
              setCategoryGames(prev => ({
                ...prev,
                [cat]: list.map(g => ({
                  id: g.id || g.slug,
                  title: g.title || g.name,
                  provider: g.provider,
                  category: g.category || cat,
                  imageUrl: g.imageUrl || g.image || 'https://cdn.betnex.co/images/jiligaming/0.webp',
                  badge: g.badge || 'Hot',
                  recommended: g.recommended || false,
                  theme: g.theme || 'linear-gradient(135deg, #1f0a38 0%, #0c0317 100%)',
                  slug: g.id || g.slug
                }))
              }));
            }
          }
        } catch (e) {}
      }
    };
    preloadAllCategories();
  }, []);

  useEffect(() => {
    if (activeCategory !== 'Hot') {
      loadCategory(activeCategory);
    }
  }, [activeCategory]);

  // Sync active tab with router query if provided
  useEffect(() => {
    if (!router.isReady) return
    const { tab } = router.query
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
        'crash': 'Crash',
        'favorites': 'Favorites'
      }
      if (tabMap[tab.toLowerCase()]) {
        setActiveCategory(tabMap[tab.toLowerCase()])
      }
    }
  }, [router.isReady, router.query])

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
    { name: 'Crash', label: '🚀 Crash', icon: '🚀' },
    { name: 'Favorites', label: '⭐ Favorites', icon: '⭐' }
  ]

  // Filter games based on selected tab
  const getFilteredGames = (category) => {
    if (category === 'Hot') return featuredGames;
    if (categoryGames[category]) return categoryGames[category];
    return featuredGames.filter(g => g.category === category);
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
            🌟 Welcome to WinX Pro Official! Play official BetNex B2B slots, Spribe Aviator, JILI fishing & Evolution live tables. Withdrawals in under 2 minutes!
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
      <div className="all-games-container" style={{ paddingBottom: '32px' }}>
        {activeCategory !== 'Hot' ? (
          <section style={{ padding: '16px 12px 0' }}>
            <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', padding: '0 4px' }}>
              <div className="title-left" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: '900' }}>
                <span style={{ fontSize: '22px' }}>{categoriesList.find(c => c.name === activeCategory)?.icon}</span> 
                <span>{categoriesList.find(c => c.name === activeCategory)?.label} ({activeTabGames.length})</span>
              </div>
              <button 
                onClick={() => setActiveCategory('Hot')}
                style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ← View All Categories
              </button>
            </div>

            {/* 3-Column Grid for Selected Category */}
            {categoryLoading && activeTabGames.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                <div style={{ fontSize: '28px', animation: 'spin 1s linear infinite', marginBottom: '8px' }}>🎡</div>
                <div>Loading {activeCategory} catalog...</div>
              </div>
            ) : (
              <div className="games-grid-3col">
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
                    category={game.category}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          categoriesList.filter(c => c.name !== 'Hot').map(cat => {
            const catGames = getFilteredGames(cat.name);
            if (catGames.length === 0) return null;

            return (
              <section key={cat.name} id={'section-' + cat.name} style={{ padding: '20px 12px 0' }} aria-label={`${cat.label || cat.name} Catalog`}>
                <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
                  <div className="title-left" style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: '900' }}>
                    <span style={{ fontSize: '20px' }}>{cat.icon}</span> 
                    <span>{cat.name}</span>
                  </div>

                  <button 
                    onClick={() => setActiveCategory(cat.name)}
                    style={{ background: 'rgba(255, 215, 0, 0.1)', border: '1px solid var(--accent)', color: 'var(--accent)', fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px', cursor: 'pointer' }}
                  >
                    View All {cat.name} →
                  </button>
                </div>

                {/* Vertical 3-Column Grid for Section (3 Games Listed per Row on Scroll Down) */}
                <div className="games-grid-3col">
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
                      category={game.category}
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
          <span className="partner-logo" style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}>JILI</span>
          <span className="partner-logo" style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>PG SOFT</span>
          <span className="partner-logo">EVOLUTION</span>
          <span className="partner-logo">PRAGMATIC</span>
          <span className="partner-logo" style={{ color: '#00e676', borderColor: '#00e676', textShadow: '0 0 10px rgba(0,230,118,0.4)' }}>SPRIBE</span>
          <span className="partner-logo" style={{ opacity: 0.8 }}>JDB</span>
          <span className="partner-logo">FC CASINO</span>
          <span className="partner-logo">CQ9</span>
        </div>
      </section>

      {/* Official Channel & Disclaimer Regulatory Footer */}
      <footer className="footer">
        <div className="social-channels-title">Official Community Channels</div>
        <div className="social-icons-row">
          <button className="social-icon-btn fb" onClick={() => alert("FB community: facebook.com/winxpro")}>📘</button>
          <button className="social-icon-btn tg" onClick={() => alert("Telegram support: t.me/winxpro_official")}>✈️</button>
          <button className="social-icon-btn wa" onClick={() => alert("WhatsApp channel: chat.whatsapp.com/winxpro")}>💬</button>
          <button className="social-icon-btn yt" onClick={() => alert("YouTube streams: youtube.com/winxpro")}>🎬</button>
          <button className="social-icon-btn ig" onClick={() => alert("Instagram photos: instagram.com/winxpro")}>📸</button>
          <button className="social-icon-btn tw" onClick={() => alert("X community: twitter.com/winxpro")}>𝕏</button>
          <div className="social-icon-btn r21" title="Responsible Gaming: 21+ only">21+</div>
        </div>

        <p className="footer-disclaimer">
          Gambling involves risk. Winnings are not guaranteed. For <strong>21+ only</strong>. Please play responsibly. Gambling can be addictive - visit support for help resources.
          <br /><br />
          <strong>WinX Pro Group</strong> is an international online casino operating company, providing slots, cards, live dealers, sportsbook, and cockfights. Authorized and regulated by the Government of Curacao under licensing authority Antillephone, issued to 8048/JAZ.
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

      {/* Floating Deposit Coupon Expiring Ticker Banner */}
      {showCouponBanner && (
        <div className="coupon-ticker-banner">
          <div className="coupon-ticker-text" onClick={() => router.push('/offers')}>
            <span className="coupon-badge-icon">🎟️</span>
            <span>You have 2 deposit coupons expiring in 1d 07:20:50</span>
            <span className="coupon-arrow">›</span>
          </div>
          <button 
            className="coupon-close-btn"
            onClick={() => setShowCouponBanner(false)}
            title="Dismiss Coupon Notice"
          >
            ✕
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  )
}

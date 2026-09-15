import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'
import GameCard from '../components/GameCard'

const mockGames = [
  { id: 'Chests-of-Plenty', title: 'Chests of Plenty', provider: 'PaddyPower', badge: 'Jackpot', recommended: true, theme: 'linear-gradient(135deg, #1b5e20 0%, #003300 100%)', icon: '🏴‍☠️', slug: 'Chests-of-Plenty', category: 'Slots', imageUrl: 'https://cdn.betnex.co/images/jiligaming/235.png' },
  { id: 'paddy-rainbow-riches', title: 'Rainbow Riches', provider: 'PaddyPower', badge: 'Jackpot', recommended: true, theme: 'linear-gradient(135deg, #1b5e20 0%, #003300 100%)', icon: '🌈', slug: 'paddy-rainbow-riches', category: 'Slots', imageUrl: '/games/fortune_gems.png' },
  { id: 'paddy-fishin-frenzy', title: "Fishin' Frenzy Big Catch", provider: 'PaddyPower', badge: 'Popular', recommended: true, theme: 'linear-gradient(135deg, #01579b 0%, #002f6c 100%)', icon: '🎣', slug: 'paddy-fishin-frenzy', category: 'Slots', imageUrl: '/games/fishing.png' },
  { id: 'paddy-roulette-live', title: 'Paddy Power Live Roulette', provider: 'PaddyPower', badge: 'Live HD', recommended: true, theme: 'linear-gradient(135deg, #311b92 0%, #12005e 100%)', icon: '🎡', slug: 'paddy-roulette-live', category: 'Live', imageUrl: '/games/live.png' },
  { id: 'paddy-blackjack-exclusive', title: 'Exclusive Blackjack', provider: 'PaddyPower', badge: 'VIP Table', recommended: true, theme: 'linear-gradient(135deg, #004d40 0%, #00251a 100%)', icon: '🃏', slug: 'paddy-blackjack-exclusive', category: 'Cards', imageUrl: '/games/live.png' },
  { id: 'paddy-age-of-gods', title: 'Age of the Gods', provider: 'PaddyPower', badge: '4 Jackpots', recommended: true, theme: 'linear-gradient(135deg, #4a148c 0%, #12005e 100%)', icon: '⚡', slug: 'paddy-age-of-gods', category: 'Jackpots', imageUrl: '/games/super_ace.png' },
  { id: 'paddy-mega-fire-blaze', title: 'Mega Fire Blaze Roulette', provider: 'PaddyPower', badge: '10,000x', recommended: true, theme: 'linear-gradient(135deg, #bf360c 0%, #3e2723 100%)', icon: '🔥', slug: 'paddy-mega-fire-blaze', category: 'Live', imageUrl: '/games/live.png' }
]

// Scrolling live winner events
const winEvents = [
  { name: 'ali***77', game: 'Rainbow Riches', amount: 'Pi 4,150.00', provider: 'PaddyPower', avatar: '👨‍💻' },
  { name: 'zain***88', game: 'Fishin Frenzy', amount: 'Pi 2,850.00', provider: 'PaddyPower', avatar: '👩‍⚕️' },
  { name: 'pak***01', game: 'Chests of Plenty', amount: 'Pi 12,279.20', provider: 'PaddyPower', avatar: '🦁' },
  { name: 'jill***00', game: 'Paddy Live Roulette', amount: 'Pi 1,033.00', provider: 'PaddyPower', avatar: '🐱' },
  { name: 'asif***99', game: 'Age of the Gods', amount: 'Pi 8,900.00', provider: 'PaddyPower', avatar: '🦅' },
  { name: 'ahmed***10', game: 'Mega Fire Blaze', amount: 'Pi 15,500.00', provider: 'PaddyPower', avatar: '🔥' },
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

  const [apiGames, setApiGames] = useState([])
  const [apiLoaded, setApiLoaded] = useState(false)

  useEffect(() => {
    let isMounted = true;
    const fetchPaddyPowerGames = async () => {
      try {
        const res = await fetch('/api/paddypower/games');
        if (res.ok) {
          const data = await res.json();
          const gamesList = data.games || data.data;
          if (gamesList && Array.isArray(gamesList)) {
            const mapped = gamesList.map(g => ({
              id: g.id || g.slug,
              title: g.name || g.title,
              provider: 'PaddyPower',
              category: g.category || 'Slots',
              imageUrl: g.img || g.imageUrl || '/games/fortune_gems.png',
              badge: g.badge || 'Popular',
              recommended: g.recommended || false,
              theme: g.theme || 'linear-gradient(135deg, #1b5e20 0%, #003300 100%)',
              slug: g.id || g.slug
            }));
            if (isMounted) {
              setApiGames(mapped);
              setApiLoaded(true);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch Paddy Power API games for home', err);
      }
    };
    fetchPaddyPowerGames();
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

  // Categories list matching Paddy Power exclusive catalog
  const categoriesList = [
    { name: 'Hot', label: 'All Games', icon: '🔥' },
    { name: 'Slots', label: 'Slots', icon: '🎰' },
    { name: 'Live', label: 'Live Tables', icon: '🎡' },
    { name: 'Cards', label: 'Cards & Blackjack', icon: '🃏' },
    { name: 'Jackpots', label: 'Jackpots', icon: '⚡' },
  ]

  // Filter games based on selected tab
  const getFilteredGames = (category) => {
    const combined = [...mockGames, ...apiGames];
    // Deduplicate by id
    const unique = [];
    const seen = new Set();
    for (const g of combined) {
      if (!seen.has(g.id)) {
        seen.add(g.id);
        unique.push(g);
      }
    }

    if (category === 'Hot') return unique;
    if (category === 'Slots') return unique.filter(g => g.category === 'Slots' || g.category === 'slot');
    if (category === 'Live') return unique.filter(g => g.category === 'Live' || g.category === 'live');
    if (category === 'Cards') return unique.filter(g => g.category === 'Cards' || g.category === 'table');
    if (category === 'Jackpots') return unique.filter(g => g.category === 'Jackpots' || g.badge?.toLowerCase().includes('jackpot'));
    return unique.filter(g => g.category === category);
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
            🌟 Welcome to WinX Pro Official! Play Paddy Power exclusive slots, live tables & jackpots. Withdrawals are processed in under 2 minutes via Easypaisa, JazzCash, and Cards!
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

      
      {/* Category Tabs chip navigation (Anchor Links) */}
      <div className="category-bar" style={{ position: 'sticky', top: '60px', zIndex: 40, background: 'var(--bg-tertiary)', paddingBottom: '10px' }}>
        {categoriesList.map(cat => (
          <button 
            key={cat.name}
            className={`category-chip ${activeCategory === cat.name ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory(cat.name);
              const el = document.getElementById('section-' + cat.name);
              if (el) {
                const y = el.getBoundingClientRect().top + window.scrollY - 120;
                window.scrollTo({ top: y, behavior: 'smooth' });
              }
            }}
          >
            <span>{cat.icon}</span>
            <span>{cat.label || cat.name}</span>
          </button>
        ))}
      </div>

      {/* Games List Vertical Sections */}
      <div className="all-games-container" style={{ paddingBottom: '24px' }}>
        {categoriesList.map(cat => {
          const catGames = getFilteredGames(cat.name);
          if (catGames.length === 0) return null;

          return (
            <section key={cat.name} id={'section-' + cat.name} style={{ padding: '24px 16px 0' }} aria-label={`${cat.label || cat.name} Catalog`}>
              <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div className="title-left" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: '900' }}>
                  <span>{cat.icon}</span> {cat.label || cat.name}
                </div>
                
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
        })}
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

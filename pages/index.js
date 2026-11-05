import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'
import GameCard from '../components/GameCard'
import softCatalog from '../data/softaggregator_catalog.json'

// Curated SoftAggregator 11,200+ Games Feed
const HOTS_GAMES = (softCatalog?.hots || []).map(g => ({
  id: g.id_hash,
  slug: g.id_hash,
  title: g.name,
  provider: g.provider_name || g.provider,
  imageUrl: g.image_portrait || g.image || g.image_square,
  category: g.game_type || 'Slots'
}))

// JILI Section with Bento 2x2 Featured #1 Card
const JILI_GAMES = (softCatalog?.jili || []).map((g, idx) => ({
  id: g.id_hash,
  slug: g.id_hash,
  title: g.name,
  provider: 'JILI',
  imageUrl: g.image_portrait || g.image || g.image_square,
  category: 'Slots',
  featuredBento: idx === 0
}))

// PG Section with Bento 2x2 Featured #1 Card
const PG_GAMES = (softCatalog?.pgsoft || []).map((g, idx) => ({
  id: g.id_hash,
  slug: g.id_hash,
  title: g.name,
  provider: 'PG',
  imageUrl: g.image_portrait || g.image || g.image_square,
  category: 'Slots',
  featuredBento: idx === 0
}))

// IN-OUT / Crash & Instant (Aviator, Mines, Plinko)
const INOUT_GAMES = (softCatalog?.crash || []).map(g => ({
  id: g.id_hash,
  slug: g.id_hash,
  title: g.name,
  provider: g.provider === 'spribe' ? 'Spribe' : 'Crash',
  imageUrl: g.image_portrait || g.image || g.image_square,
  category: 'Crash'
}))

// Pragmatic Play Slots
const PP_SLOTS = (softCatalog?.pragmatic || []).map(g => ({
  id: g.id_hash,
  slug: g.id_hash,
  title: g.name,
  provider: 'PP',
  imageUrl: g.image_portrait || g.image || g.image_square,
  category: 'Slots'
}))

// Live Casino Games
const LIVE_GAMES = (softCatalog?.live || []).map(g => ({
  id: g.id_hash,
  slug: g.id_hash,
  title: g.name,
  provider: g.provider_name || 'Live',
  imageUrl: g.image_portrait || g.image || g.image_square,
  category: 'Live'
}))

// Table Games
const TABLE_GAMES = (softCatalog?.table || []).map(g => ({
  id: g.id_hash,
  slug: g.id_hash,
  title: g.name,
  provider: g.provider_name || 'Table',
  imageUrl: g.image_portrait || g.image || g.image_square,
  category: 'Table'
}))

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

// Left Sticky Vertical Sidebar Categories (matching bbrssms1.com)
const SIDEBAR_CATEGORIES = [
  { id: 'hots', label: 'Hots', icon: '🔥', sectionId: 'sec-hots' },
  { id: 'jili', label: 'JILI', icon: '🎰', sectionId: 'sec-jili' },
  { id: 'pg', label: 'PG Soft', icon: '🎮', sectionId: 'sec-pg' },
  { id: 'inout', label: 'IN-OUT', icon: '✈️', sectionId: 'sec-inout' },
  { id: 'slot', label: 'PP Slots', icon: '🍒', sectionId: 'sec-slot' },
  { id: 'live', label: 'Live Casino', icon: '💎', sectionId: 'sec-live' },
  { id: 'table', label: 'Table Games', icon: '🃏', sectionId: 'sec-table' }
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

          {/* 5. PP / PRAGMATIC PLAY SLOTS SECTION */}
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
                <button type="button" className="bbr-sec-more" onClick={() => handleSidebarClick({ id: 'live', sectionId: 'sec-live' })}>
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

          {/* 6. LIVE CASINO SECTION */}
          <section id="sec-live" className="bbr-provider-section">
            <div className="bbr-sec-header">
              <div className="bbr-sec-title">
                <span className="bbr-sec-badge-pill live">LIVE</span>
                <span>Live Casino</span>
                <span className="bbr-sec-count">{LIVE_GAMES.length}</span>
              </div>
              <div className="bbr-sec-actions">
                <button
                  type="button"
                  className="bbr-sec-more"
                  onClick={() => handleSidebarClick({ id: 'table', sectionId: 'sec-table' })}
                >
                  More ›
                </button>
              </div>
            </div>
            <div className="bbr-poster-grid">
              {LIVE_GAMES.map(game => (
                <GameCard key={game.id} {...game} />
              ))}
            </div>
          </section>

          {/* 7. TABLE GAMES SECTION */}
          <section id="sec-table" className="bbr-provider-section">
            <div className="bbr-sec-header">
              <div className="bbr-sec-title">
                <span className="bbr-sec-badge-pill cards">TABLE</span>
                <span>Table &amp; Card Games</span>
                <span className="bbr-sec-count">{TABLE_GAMES.length}</span>
              </div>
              <div className="bbr-sec-actions">
                <button type="button" className="bbr-sec-more" onClick={() => handleSidebarClick({ id: 'hots', sectionId: 'sec-hots' })}>
                  Top ▴
                </button>
              </div>
            </div>
            <div className="bbr-poster-grid">
              {TABLE_GAMES.map(game => (
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

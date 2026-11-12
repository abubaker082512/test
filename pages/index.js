import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'
import GameCard from '../components/GameCard'
import softCatalog from '../data/softaggregator_catalog.json'

// Top Providers List directly from SoftAggregator with official logos and catalog counts
const PROVIDERS_CONFIG = [
  {
    id: 'hots',
    label: 'Hots',
    icon: '🔥',
    sectionId: 'sec-hots',
    name: 'Hots',
    logo: null,
    badgeColor: '#f97316',
    games: (softCatalog?.hots || []).slice(0, 24)
  },
  {
    id: 'jili',
    label: 'JILI',
    icon: '🎰',
    sectionId: 'sec-jili',
    name: 'JILI Gaming',
    logo: 'https://cdn.imagesai.org/p/jili.png?v=20261014-1',
    badgeColor: '#eab308',
    games: (softCatalog?.jili || []).slice(0, 36)
  },
  {
    id: 'pgsoft',
    label: 'PG Soft',
    icon: '🎮',
    sectionId: 'sec-pgsoft',
    name: 'PG Soft',
    logo: 'https://cdn.imagesai.org/p/pgsoft.png?v=20261014-1',
    badgeColor: '#3b82f6',
    games: (softCatalog?.pgsoft || []).slice(0, 36)
  },
  {
    id: 'spribe',
    label: 'IN-OUT',
    icon: '✈️',
    sectionId: 'sec-spribe',
    name: 'Spribe Crash & Instant',
    logo: 'https://cdn.imagesai.org/p/spribe.png?v=20261014-1',
    badgeColor: '#ef4444',
    games: (softCatalog?.spribe || []).slice(0, 24)
  },
  {
    id: 'pragmaticplay',
    label: 'PP Slots',
    icon: '⚡',
    sectionId: 'sec-pragmaticplay',
    name: 'Pragmatic Play',
    logo: 'https://cdn.imagesai.org/p/pragmaticplay.png?v=20261014-1',
    badgeColor: '#eab308',
    games: (softCatalog?.pragmaticplay || []).slice(0, 36)
  },
  {
    id: 'hacksawgaming',
    label: 'Hacksaw',
    icon: '🪚',
    sectionId: 'sec-hacksawgaming',
    name: 'Hacksaw Gaming',
    logo: 'https://cdn.imagesai.org/p/hacksawgaming.png?v=20261014-1',
    badgeColor: '#f59e0b',
    games: (softCatalog?.hacksawgaming || []).slice(0, 30)
  },
  {
    id: 'nolimitcity',
    label: 'Nolimit',
    icon: '🧨',
    sectionId: 'sec-nolimitcity',
    name: 'Nolimit City',
    logo: null,
    badgeColor: '#dc2626',
    games: (softCatalog?.nolimitcity || []).slice(0, 30)
  },
  {
    id: 'playngo',
    label: "Play'n GO",
    icon: '👑',
    sectionId: 'sec-playngo',
    name: "Play'n GO",
    logo: 'https://cdn.imagesai.org/p/playngo.png?v=20261014-1',
    badgeColor: '#8b5cf6',
    games: (softCatalog?.playngo || []).slice(0, 30)
  },
  {
    id: 'kagaming',
    label: 'KA Gaming',
    icon: '🐉',
    sectionId: 'sec-kagaming',
    name: 'KA Gaming',
    logo: 'https://cdn.imagesai.org/p/kagaming.png?v=20261014-1',
    badgeColor: '#10b981',
    games: (softCatalog?.kagaming || []).slice(0, 30)
  },
  {
    id: 'relaxgaming',
    label: 'Relax',
    icon: '🚂',
    sectionId: 'sec-relaxgaming',
    name: 'Relax Gaming',
    logo: 'https://cdn.imagesai.org/p/relaxgaming.png?v=20261014-1',
    badgeColor: '#06b6d4',
    games: (softCatalog?.relaxgaming || []).slice(0, 30)
  },
  {
    id: 'greentube',
    label: 'Greentube',
    icon: '🏛',
    sectionId: 'sec-greentube',
    name: 'Greentube Novomatic',
    logo: 'https://cdn.imagesai.org/p/greentube.png?v=20261014-1',
    badgeColor: '#059669',
    games: (softCatalog?.greentube || []).slice(0, 30)
  },
  {
    id: 'egt',
    label: 'EGT',
    icon: '👑',
    sectionId: 'sec-egt',
    name: 'EGT Gaming',
    logo: 'https://cdn.imagesai.org/p/egt.png?v=20261014-1',
    badgeColor: '#d97706',
    games: (softCatalog?.egt || []).slice(0, 30)
  },
  {
    id: 'netent',
    label: 'NetEnt',
    icon: '💎',
    sectionId: 'sec-netent',
    name: 'NetEnt',
    logo: 'https://cdn.imagesai.org/p/netent.png?v=20261014-1',
    badgeColor: '#0284c7',
    games: (softCatalog?.netent || []).slice(0, 30)
  }
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

export default function Home() {
  const router = useRouter()
  const { user } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [activeSidebar, setActiveSidebar] = useState('hots')

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
      for (let i = PROVIDERS_CONFIG.length - 1; i >= 0; i--) {
        const item = PROVIDERS_CONFIG[i]
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

  const handleSidebarClick = (item) => {
    setActiveSidebar(item.id)
    const el = document.getElementById(item.sectionId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
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
            Welcome to WINX Official! 11,200+ Games live from SoftAggregator • JazzCash &amp; Easypaisa QR instant top-up is live • USDT-TRC20 deposits get +3% instant bonus • Invite friends to claim Rs 1,500 + 800 + 2,000 immediately!
          </span>
        </div>
      </div>

      {/* Two-Column Split Lobby: Left Sticky Vertical Category Sidebar + Right Game Sections (matching Screenshot 4) */}
      <div className="bbr-lobby-split">
        {/* Left Sticky Vertical Sidebar Listing SoftAggregator Providers */}
        <aside className="bbr-left-sidebar">
          {PROVIDERS_CONFIG.map(item => (
            <button
              key={item.id}
              type="button"
              className={`bbr-side-btn ${activeSidebar === item.id ? 'active' : ''}`}
              onClick={() => handleSidebarClick(item)}
            >
              {item.logo ? (
                <img
                  src={item.logo}
                  alt={item.label}
                  style={{
                    height: '16px',
                    maxWidth: '42px',
                    objectFit: 'contain',
                    filter: activeSidebar === item.id ? 'brightness(1.2)' : 'brightness(0.9)'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <span className="bbr-side-icon">{item.icon}</span>
              )}
              <span className="bbr-side-label">{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Right Scrollable Game Grid Sections for Each SoftAggregator Provider */}
        <main className="bbr-right-sections">
          {PROVIDERS_CONFIG.map((prov, pIdx) => {
            const nextProv = PROVIDERS_CONFIG[(pIdx + 1) % PROVIDERS_CONFIG.length]
            const prevProv = PROVIDERS_CONFIG[(pIdx - 1 + PROVIDERS_CONFIG.length) % PROVIDERS_CONFIG.length]

            return (
              <section key={prov.id} id={prov.sectionId} className="bbr-provider-section">
                <div className="bbr-sec-header">
                  <div className="bbr-sec-title">
                    {prov.logo ? (
                      <img
                        src={prov.logo}
                        alt={prov.name}
                        style={{ height: '20px', maxWidth: '64px', objectFit: 'contain' }}
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    ) : (
                      <span className="bbr-sec-icon">{prov.icon}</span>
                    )}
                    <span>{prov.name}</span>
                    <span className="bbr-sec-count">{prov.games.length}</span>
                  </div>
                  <div className="bbr-sec-actions">
                    <button
                      type="button"
                      className="bbr-sec-nav-pill"
                      onClick={() => handleSidebarClick(prevProv)}
                      title={`Go to ${prevProv.name}`}
                    >
                      &lt;
                    </button>
                    <button
                      type="button"
                      className="bbr-sec-nav-pill"
                      onClick={() => handleSidebarClick(nextProv)}
                      title={`Go to ${nextProv.name}`}
                    >
                      &gt;
                    </button>
                    <button
                      type="button"
                      className="bbr-sec-more"
                      onClick={() => handleSidebarClick(nextProv)}
                    >
                      More ›
                    </button>
                  </div>
                </div>

                <div className="bbr-poster-grid">
                  {prov.games.map((game, gIdx) => (
                    <GameCard
                      key={game.id_hash || game.id}
                      id={game.id_hash}
                      slug={game.id_hash}
                      title={game.name}
                      provider={game.provider_name || prov.label}
                      imageUrl={game.image_portrait || game.image || game.image_square}
                      category={game.game_type || 'Slots'}
                      featuredBento={prov.id !== 'hots' && gIdx === 0}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </main>
      </div>

      {/* Pakistan SEO Authority & Trust Section */}
      <section className="seo-authority-section" style={{
        margin: '24px 12px 16px',
        padding: '20px 16px',
        background: 'rgba(20, 26, 36, 0.7)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '12px',
        color: '#94A3B8',
        lineHeight: '1.6'
      }}>
        <h2 style={{ fontSize: '15px', color: '#FFF', fontWeight: 800, marginBottom: '8px' }}>
          🇵🇰 WinX Pro Pakistan — Official Online Gaming &amp; Cricket Betting
        </h2>
        <p style={{ marginBottom: '10px' }}>
          Welcome to <strong>WinX Pro (WINX.COM.PK)</strong>, Pakistan&apos;s premier platform for online slots, live casino tables, and PSL cricket betting. Enjoy 11,200+ certified titles including <em>Spribe Aviator, JILI Super Ace, Fortune Gems, Money Coming, PG Soft Mahjong Ways</em>, and Evolution Gaming live dealers.
        </p>

        <h3 style={{ fontSize: '13px', color: '#00E65B', fontWeight: 700, margin: '12px 0 6px' }}>
          ⚡ Instant Easypaisa, JazzCash &amp; Bank Transfers
        </h3>
        <p style={{ marginBottom: '10px' }}>
          Experience hassle-free PKR deposits and automated 2-minute withdrawals directly into your <strong>Easypaisa</strong>, <strong>JazzCash</strong>, or Pakistani bank account (Meezan, HBL, Allied, Alfalah). Enjoy zero processing fees, 24/7 dedicated Urdu &amp; English WhatsApp/Telegram live support, and exclusive daily cash bonuses.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
          <Link href="/download" style={{ color: '#00FF87', textDecoration: 'none', background: 'rgba(0, 230, 91, 0.12)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
            📲 Download Android APK
          </Link>
          <Link href="/offers" style={{ color: '#FFB800', textDecoration: 'none', background: 'rgba(255, 184, 0, 0.12)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
            🎁 Claim 100% Bonus
          </Link>
          <Link href="/sports" style={{ color: '#38BDF8', textDecoration: 'none', background: 'rgba(56, 189, 248, 0.12)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
            🏏 PSL &amp; Cricket Betting
          </Link>
          <Link href="/casino" style={{ color: '#F43F5E', textDecoration: 'none', background: 'rgba(244, 63, 94, 0.12)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
            🎰 11,200+ Online Slots
          </Link>
        </div>
      </section>

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
            <strong>WINX.COM</strong> is one of the best and most popular online slot websites in Pakistan powered by official SoftAggregator game servers. Over 11,200 authentic titles including JILI, PG Soft, Spribe Aviator, Pragmatic Play, Hacksaw, Nolimit City, and live tables. Real-time PKR balances synchronized seamlessly.
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

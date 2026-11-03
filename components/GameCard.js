import React, { useState } from 'react'
import Link from 'next/link'

export default function GameCard({ 
  id,
  title, 
  provider, 
  badge, 
  recommended = true,
  theme = 'linear-gradient(180deg, #162a1e 0%, #0b140e 100%)',
  icon = '🎮',
  slug = '',
  imageType = '', 
  imageUrl = '',
  category = '',
  featuredBento = false
}) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [imgError, setImgError] = useState(false)

  const toggleFavorite = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorite(!isFavorite)
  }

  const fallbackCovers = [
    'https://cdn.betnex.co/images/jiligaming/48.webp',
    'https://cdn.betnex.co/images/jiligaming/37.png',
    'https://cdn.betnex.co/images/pgsoft/16.png',
    'https://cdn.betnex.co/images/pgsoft/0.webp',
    'https://cdn.betnex.co/images/jiligaming/74.webp'
  ]
  const hashIdx = String(id || title || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % fallbackCovers.length
  const finalSrc = (!imgError && imageUrl) ? imageUrl : fallbackCovers[hashIdx]

  const targetUrl = (category === 'Sports' || provider === 'BetStack' || provider === 'BetStack Sports')
    ? '/sports'
    : `/play/${slug || id}`

  // Clean short provider tag for the top-center pill (matching bbrssms1.com)
  const shortProvider = (() => {
    if (!provider) return 'WINX'
    const p = provider.toUpperCase()
    if (p.includes('WINX')) return 'WINX'
    if (p.includes('JILI')) return 'JILI'
    if (p.includes('PG')) return 'PG'
    if (p.includes('PRAGMATIC')) return 'PP'
    if (p.includes('SPRIBE')) return 'IN-OUT'
    if (p.includes('EVOLUTION')) return 'EVO'
    if (p.includes('JDB')) return 'JDB'
    if (p.includes('FA CHAI')) return 'FC'
    if (p.includes('CQ9')) return 'CQ9'
    if (p.includes('BETSTACK')) return 'SPORT'
    return p.split(' ')[0].slice(0, 6)
  })()

  return (
    <Link 
      href={targetUrl} 
      className={featuredBento ? 'bbr-card-link bento-span-2x2' : 'bbr-card-link'}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div className={`bbr-game-card ${featuredBento ? 'bbr-game-card-bento' : ''}`}>
        {/* Full-bleed vertical poster artwork */}
        <img 
          src={finalSrc} 
          alt={title} 
          loading="lazy"
          onError={() => setImgError(true)}
          className="bbr-game-card-img"
        />

        {/* Top-center subtle provider tag matching bbrssms1.com */}
        <div className="bbr-card-provider-tag">
          {shortProvider}
        </div>

        {/* Top-right circular heart favorite button matching bbrssms1.com */}
        <button 
          type="button"
          className={`bbr-card-heart-btn ${isFavorite ? 'liked' : ''}`}
          onClick={toggleFavorite}
          aria-label="Favorite game"
        >
          {isFavorite ? '♥' : '♡'}
        </button>

        {/* Integrated bottom poster vignette + stylized game title for clarity */}
        <div className="bbr-card-poster-footer">
          <span className="bbr-card-poster-title">{title}</span>
        </div>
      </div>
    </Link>
  )
}

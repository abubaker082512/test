import React, { useState } from 'react'
import Link from 'next/link'

export default function GameCard({ 
  id,
  title, 
  provider, 
  badge, 
  recommended = true,
  theme = 'linear-gradient(180deg, #2a0f4f 0%, #150628 100%)',
  icon = '🎮',
  slug = '',
  imageType = '', 
  imageUrl = '',
  category = ''
}) {
  const [isFavorite, setIsFavorite] = useState(false)

  const toggleFavorite = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorite(!isFavorite)
  }

  const renderCardGraphic = () => {
    if (imageUrl) {
      return (
        <img 
          src={imageUrl} 
          alt={title} 
          className="game-card-img"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
      )
    }

    return (
      <div style={{
        width: '100%',
        height: '100%',
        background: theme || 'linear-gradient(180deg, #2a0f4f 0%, #150628 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <span style={{ fontSize: '38px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}>
          {icon}
        </span>
      </div>
    )
  }

  const targetUrl = (category === 'Sports' || provider === 'BetStack') ? '/sports' : `/play/${slug || id}`;

  // Formatted display label for bottom pill badge
  const pillLabel = provider ? `${provider} ${title.split(' ')[0]}` : title;

  return (
    <Link href={targetUrl} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="game-card-premium">
        
        {/* Top-Left Thumbs-up / Recommended badge */}
        {recommended && (
          <div className="card-top-badge-left" title="Hot Recommended">
            👍
          </div>
        )}

        {/* Top-Right Favorite Star badge */}
        <button 
          type="button"
          className="card-top-badge-right" 
          onClick={toggleFavorite}
          style={{ color: isFavorite ? '#ffd700' : 'rgba(255,255,255,0.7)' }}
          title="Add to Favorites"
        >
          ★
        </button>

        {/* Payout / Multiplier Badge */}
        {badge && (
          <div className="card-multiplier-badge">
            {badge}
          </div>
        )}

        {/* Inner Image Container */}
        <div className="game-card-img-wrapper">
          {renderCardGraphic()}
        </div>

        {/* Bottom Pill Badge matching 666H screenshot layout */}
        <div className="game-card-pill-badge">
          <span className="pill-provider">{provider || 'AKW'}</span>
          <span className="pill-title">{title}</span>
        </div>

      </div>
    </Link>
  )
}


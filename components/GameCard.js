import React, { useState } from 'react'
import Link from 'next/link'

export default function GameCard({ 
  id,
  title, 
  provider, 
  badge, 
  recommended = true,
  theme = 'linear-gradient(180deg, #202637 0%, #181d2a 100%)',
  icon = '🎮',
  slug = '',
  imageType = '', // 'ronaldo', 'messi', etc. to draw simulated player canvas/portraits
  imageUrl = ''
}) {
  const [isFavorite, setIsFavorite] = useState(false)

  const toggleFavorite = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorite(!isFavorite)
  }

  // Draw simulated player/sport graphic representations using high-end CSS vectors
  const renderCardGraphic = () => {
    if (imageType === 'ronaldo') {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom, #11823b, #031207)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          {/* Al-Nassr Yellow/Blue Jersey Visual Representation */}
          <div style={{
            width: '45px',
            height: '45px',
            background: '#ffea00',
            borderTop: '10px solid #0026e6',
            borderRadius: '50% 50% 0 0',
            position: 'relative',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: '#0026e6',
              fontSize: '11px',
              fontWeight: '900',
              fontFamily: 'sans-serif'
            }}>7</div>
          </div>
          {/* Soccer ball */}
          <div style={{ fontSize: '18px', marginTop: '6px' }}>⚽</div>
          <div style={{
            fontSize: '9px',
            fontWeight: '900',
            color: '#fff',
            marginTop: '4px',
            letterSpacing: '0.5px'
          }}>CR7 CROWN</div>
        </div>
      )
    }

    if (imageType === 'messi') {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom, #7a0c8d, #0d0310)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          {/* Inter Miami Pink Jersey Visual Representation */}
          <div style={{
            width: '45px',
            height: '45px',
            background: '#ff66b2',
            borderTop: '10px solid #111',
            borderRadius: '50% 50% 0 0',
            position: 'relative',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: '#000',
              fontSize: '11px',
              fontWeight: '900',
              fontFamily: 'sans-serif'
            }}>10</div>
          </div>
          {/* Soccer ball */}
          <div style={{ fontSize: '18px', marginTop: '6px' }}>⚽</div>
          <div style={{
            fontSize: '9px',
            fontWeight: '900',
            color: '#fff',
            marginTop: '4px',
            letterSpacing: '0.5px'
          }}>LM10 WG</div>
        </div>
      )
    }

    // Default high-end icon graphic
    return (
      <div style={{
        width: '100%',
        height: '100%',
        background: theme,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        ) : (
          <span style={{ fontSize: '46px', textShadow: '0 0 20px rgba(255,255,255,0.15)' }}>
            {icon}
          </span>
        )}
      </div>
    )
  }

  return (
    <Link href={`/play/${slug || id}`} style={{ textDecoration: 'none' }}>
      <div className="game-card">
        {/* Card Image area */}
        <div className="game-card-img-container">
          {renderCardGraphic()}
          
          {/* Provider Badge */}
          {provider && (
            <span className="game-provider-badge">
              {provider}
            </span>
          )}

          {/* Recommended / Thumbs Up Indicator */}
          {recommended && (
            <div style={{
              position: 'absolute',
              bottom: '6px',
              left: '6px',
              background: '#f57c00',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 5px rgba(0,0,0,0.4)'
            }}>
              <span style={{ fontSize: '9px', color: '#fff' }}>👍</span>
            </div>
          )}

          {/* Star Favorites Button */}
          <button 
            className="game-favorite-btn" 
            onClick={toggleFavorite}
            style={{ color: isFavorite ? 'var(--accent)' : '#ccc' }}
          >
            ★
          </button>
          
          {/* Top-Left/Right Payout Multiplier Badge (e.g. 1500x) */}
          {badge && (
            <div style={{
              position: 'absolute',
              top: '6px',
              left: provider ? '44px' : '6px', // Shift right if provider badge exists
              background: 'linear-gradient(45deg, #d32f2f, #f57c00)',
              color: '#fff',
              fontSize: '8px',
              fontWeight: '900',
              padding: '2px 6px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              textTransform: 'uppercase'
            }}>
              {badge}
            </div>
          )}
        </div>

        {/* Game Details */}
        <div className="game-details">
          <div className="game-title">{title}</div>
          <div className="game-subtitle">{provider} Casino</div>
        </div>
      </div>
    </Link>
  )
}

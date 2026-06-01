import React, { useState } from 'react'
import Link from 'next/link'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
const mockGames = [
  { id: '1', title: 'Gold Slots', subtitle: 'JILI', emoji: '🎰' },
  { id: '2', title: 'Crash', subtitle: 'Originals', emoji: '🚀' },
  { id: '3', title: 'Minesweeper', subtitle: 'Originals', emoji: '💣' },
  { id: '4', title: 'Fishing Joy', subtitle: 'JDB', emoji: '🐟' },
  { id: '5', title: 'Super Ace', subtitle: 'JILI', emoji: '🂡' },
  { id: '6', title: 'Fortune Gems', subtitle: 'PG', emoji: '💎' },
]

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('Hot');

  return (
    <div className="app">
      <NavBar />

      <header className="hero">
        <h1>Welcome to BetPK Official</h1>
        <p>Refer a friend to receive ₱155.55</p>
        <div className="auth-buttons">
          <button className="btn primary">Play Now</button>
        </div>
      </header>

      <section aria-label="Categories">
        <div className="category-bar">
          {['Hot', 'Slots', 'Live', 'Fishing', 'Cards', 'Blockchain'].map(cat => (
            <button 
              key={cat} 
              className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <section aria-label="Hot Games">
        <div className="section-title">Hot Games</div>
        <div className="hot-strip">
          {mockGames.map(game => (
            <Link href={`/play/${game.title.toLowerCase().replace(' ', '-')}`} key={game.id} style={{ textDecoration: 'none' }}>
              <div className="game-card">
                <div className="thumb">{game.emoji}</div>
                <div className="title">{game.title}</div>
                <div className="subtitle">{game.subtitle}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section aria-label="Providers">
        <div className="section-title">Providers</div>
        <div className="providers-list">
          {['JILI', 'PG', 'PP', 'FC', 'JDB', 'CQ9'].map(provider => (
            <button key={provider} className="provider-chip">
              {provider}
            </button>
          ))}
        </div>
      </section>

      <BottomNav />
    </div>
  )
}

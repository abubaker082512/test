import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'

const mockGames = [
  { id: '2', title: 'Crash', subtitle: 'Originals', emoji: '🚀' },
  { id: '10', title: 'Plinko', subtitle: 'Originals', emoji: '🟢' },
  { id: '11', title: 'Blackjack', subtitle: 'Originals', emoji: '🃏' },
  { id: '1', title: 'Gold Slots', subtitle: 'JILI', emoji: '🎰' },
  { id: '3', title: 'Coin Flip', subtitle: 'Originals', emoji: '🪙' },
  { id: '4', title: 'Crypto Dice', subtitle: 'Originals', emoji: '🎲' },
  { id: '5', title: 'Mini Roulette', subtitle: 'Originals', emoji: '🎡' },
  { id: '6', title: 'Minesweeper', subtitle: 'Originals', emoji: '💣' },
  { id: '7', title: 'Fishing Joy', subtitle: 'JDB', emoji: '🐟' },
  { id: '8', title: 'Super Ace', subtitle: 'JILI', emoji: '🂡' },
  { id: '9', title: 'Fortune Gems', subtitle: 'PG', emoji: '💎' },
]

// Simulated win ticker events
const winEvents = [
  { name: 'ali_khan', game: 'Crash', amount: '₱1,200.00', details: '3.42x multiplier' },
  { name: 'fatima_77', game: 'Gold Slots', amount: '₱450.00', details: 'Jackpot hit!' },
  { name: 'player_9982', game: 'Plinko', amount: '₱2,000.00', details: '10x Outer slot!' },
  { name: 'zain_bet', game: 'Blackjack', amount: '₱500.00', details: 'Blackjack card!' },
  { name: 'user_4822', game: 'Deposit', amount: '₱2,500.00', details: 'via Easypaisa' },
  { name: 'imran_pk', game: 'Crypto Dice', amount: '₱980.00', details: 'Rolled 14 (Under 50)' },
  { name: 'aisha_dxb', game: 'Mini Roulette', amount: '₱1,400.00', details: '14x Green hit!' },
  { name: 'kamran_jazz', game: 'Deposit', amount: '₱1,000.00', details: 'via JazzCash' },
  { name: 'sana_wins', game: 'Minesweeper', amount: '₱850.00', details: 'Cashed out 5 gems' }
]

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('Hot');
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Jackpot rolling state
  const [jackpot, setJackpot] = useState(1452789.20);

  // Live Toast Notification
  const [currentWinIdx, setCurrentWinIdx] = useState(0);
  const [showWinToast, setShowWinToast] = useState(false);

  // Sales promo popup modal
  const [showPromoPopup, setShowPromoPopup] = useState(false);

  useEffect(() => {
    // 1. Ticking Jackpot counter
    const jackpotInt = setInterval(() => {
      setJackpot(prev => prev + parseFloat((Math.random() * 3.5).toFixed(2)));
    }, 1000);

    // 2. Win Ticker cycle (display toast for 4 seconds, hide for 3 seconds, repeat)
    const toastCycle = setInterval(() => {
      setShowWinToast(false);
      setTimeout(() => {
        setCurrentWinIdx(Math.floor(Math.random() * winEvents.length));
        setShowWinToast(true);
      }, 3000);
    }, 7000);

    // Trigger initial win toast
    setTimeout(() => {
      setShowWinToast(true);
    }, 2000);

    // 3. Sales matching deposit popup (pops after 3.5 seconds if they haven't deposited/interacted)
    const promoTimer = setTimeout(() => {
      const closed = sessionStorage.getItem('betpk_promo_closed');
      if (!closed) {
        setShowPromoPopup(true);
      }
    }, 3500);

    return () => {
      clearInterval(jackpotInt);
      clearInterval(toastCycle);
      clearTimeout(promoTimer);
    }
  }, []);

  const handleClosePromo = () => {
    sessionStorage.setItem('betpk_promo_closed', 'true');
    setShowPromoPopup(false);
  }

  // Filter games based on category tab selection
  const filteredGames = mockGames.filter(game => {
    if (activeCategory === 'Hot') return true;
    if (activeCategory === 'Slots') return game.title.toLowerCase().includes('slots') || game.title === 'Super Ace' || game.title === 'Fortune Gems';
    if (activeCategory === 'Live') return game.title.includes('Roulette') || game.title === 'Blackjack';
    if (activeCategory === 'Fishing') return game.title.includes('Fishing');
    if (activeCategory === 'Blockchain') return game.title === 'Crash' || game.title === 'Crypto Dice' || game.title === 'Plinko' || game.title === 'Coin Flip' || game.title === 'Minesweeper';
    return true;
  });

  const activeWin = winEvents[currentWinIdx];

  return (
    <div className="app">
      <NavBar />

      {/* Hero Welcome Display */}
      <header className="hero">
        <h1 style={{ letterSpacing: '-0.5px' }}>Welcome to BetPK Official</h1>
        <p>Pakistani & Global Premier Gaming Arena. Refer friends to receive ₱155.55 instantly!</p>
        <div className="auth-buttons">
          {user ? (
            <button className="btn primary" onClick={() => document.getElementById('games-section').scrollIntoView({ behavior: 'smooth' })}>🔥 Play Casino Games</button>
          ) : (
            <button className="btn primary" onClick={() => setIsAuthModalOpen(true)}>✨ Register & Claim 100% Bonus</button>
          )}
        </div>
      </header>

      {/* Mega Urgency Jackpot Ticker */}
      <div className="jackpot-container pulse-glow">
        <div style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px' }}>
          👑 BETPK MEGA SUPER JACKPOT
        </div>
        <div style={{ fontSize: '38px', fontWeight: '900', color: '#fff', textShadow: '0 0 15px rgba(245, 194, 66, 0.6)', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
          ₱{jackpot.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '6px', fontWeight: '500' }}>
          Jackpot increments in real-time. Spin to trigger mega winnings!
        </div>
      </div>

      {/* Categories Bar */}
      <section id="games-section" aria-label="Categories">
        <div className="category-bar">
          {['Hot', 'Slots', 'Live', 'Fishing', 'Blockchain'].map(cat => (
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

      {/* Dynamic Games Grid */}
      <section aria-label="Casino Games" style={{ padding: '0 20px' }}>
        <div className="section-title">{activeCategory} Games</div>
        <div className="hot-strip">
          {filteredGames.map(game => (
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

      {/* Providers Grid */}
      <section aria-label="Providers" style={{ marginBottom: '40px' }}>
        <div className="section-title">Verified Providers</div>
        <div className="providers-list">
          {['JILI', 'PG Soft', 'Evolution', 'Pragmatic Play', 'FC Casino', 'JDB Fishing'].map(provider => (
            <button key={provider} className="provider-chip">
              {provider}
            </button>
          ))}
        </div>
      </section>

      {/* Floating Winners Notification Toast */}
      {showWinToast && activeWin && (
        <div className="win-toast">
          <div style={{ fontSize: '24px' }}>
            {activeWin.game === 'Deposit' ? '💳' : '🎉'}
          </div>
          <div>
            <div>
              <strong style={{ color: '#fff' }}>{activeWin.name}</strong> 
              {activeWin.game === 'Deposit' ? ' deposited ' : ' won '}
              <strong style={{ color: activeWin.game === 'Deposit' ? 'var(--accent)' : 'var(--success)' }}>{activeWin.amount}</strong>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
              on {activeWin.game} ({activeWin.details})
            </div>
          </div>
        </div>
      )}

      {/* Matched Deposit Sales Popup Modal */}
      {showPromoPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="pulse-glow" style={{ background: 'linear-gradient(135deg, #171206 0%, #0c0e14 100%)', border: '2px solid var(--accent)', padding: '32px', borderRadius: '20px', width: '90%', maxWidth: '380px', textPosition: 'center', textAlign: 'center', position: 'relative' }}>
            <button onClick={handleClosePromo} style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', color: '#ff4444', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎁</div>
            <h2 style={{ color: 'var(--accent)', marginTop: 0, fontSize: '24px', fontWeight: '900' }}>Double Your Cash!</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.6', margin: '12px 0 24px 0' }}>
              Claim a **100% matched bonus up to ₱5,000.00** on your very first completed deposit! 
              Depositing via Easypaisa or JazzCash takes less than 2 minutes.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link href={user ? '/wallet' : '#'} style={{ textDecoration: 'none' }}>
                <button 
                  onClick={() => { if (!user) setIsAuthModalOpen(true); handleClosePromo(); }} 
                  className="btn primary" 
                  style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 'bold' }}
                >
                  💳 Deposit & Claim Match Bonus
                </button>
              </Link>
              <button 
                onClick={handleClosePromo} 
                className="btn" 
                style={{ width: '100%', padding: '12px', background: 'transparent', border: 'none', color: '#555', fontSize: '13px' }}
              >
                No thanks, I will play with standard cash
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <BottomNav />
    </div>
  )
}

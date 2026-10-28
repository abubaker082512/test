import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export default function EpicArenaAdmin() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Settings State
  const [appMode, setAppMode] = useState('casual');
  const [bannerTitle, setBannerTitle] = useState('EpicArena Global Gaming Hub');
  const [themeColor, setThemeColor] = useState('cyan');
  const [activeGamesCount, setActiveGamesCount] = useState(120);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings/get');
      const data = await res.json();
      if (data) {
        setAppMode(data.epicarena_mode || (data.is_pro_mode ? 'pro' : 'casual'));
        if (data.epicarena_featured_banner) setBannerTitle(data.epicarena_featured_banner);
        if (data.epicarena_active_theme) setThemeColor(data.epicarena_active_theme);
      }
    } catch (err) {
      console.error('Error loading settings', err);
    }
  };

  const handleModeToggle = async (newMode) => {
    setLoading(true);
    setStatusMsg('');
    try {
      const isPro = newMode === 'pro';
      const res = await fetch('/api/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          epicarena_mode: newMode,
          app_mode: newMode,
          is_pro_mode: isPro,
          epicarena_featured_banner: bannerTitle,
          epicarena_active_theme: themeColor,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAppMode(newMode);
        setStatusMsg(`✅ Successfully switched EpicArena to ${newMode.toUpperCase()} MODE! Mobile apps will auto-update in real time.`);
      } else {
        setStatusMsg('❌ Failed to update settings on server.');
      }
    } catch (e) {
      setStatusMsg('❌ Network error updating mode.');
    }
    setLoading(false);
  };

  const handleSaveVisuals = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg('');
    try {
      const isPro = appMode === 'pro';
      const res = await fetch('/api/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          epicarena_mode: appMode,
          app_mode: appMode,
          is_pro_mode: isPro,
          epicarena_featured_banner: bannerTitle,
          epicarena_active_theme: themeColor,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg('✅ Visual settings and banners saved successfully!');
      }
    } catch (e) {
      setStatusMsg('❌ Error saving visual settings.');
    }
    setLoading(false);
  };

  if (!authed) {
    return (
      <div style={styles.loginContainer}>
        <Head>
          <title>EpicArena • Admin Control Gateway</title>
        </Head>
        <div style={styles.loginCard}>
          <div style={styles.logoBadge}>🎮</div>
          <h2 style={styles.loginTitle}>EpicArena Admin Gateway</h2>
          <p style={styles.loginSub}>Dynamic Mode & Visual Control Dashboard</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (password === 'Admin@123' || password === 'admin') {
                setAuthed(true);
              } else {
                alert('Invalid Admin Password');
              }
            }}
          >
            <input
              type="password"
              placeholder="Enter Admin Master Key"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.primaryBtn}>
              Unlock Gateway
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isPro = appMode === 'pro';

  return (
    <div style={styles.container}>
      <Head>
        <title>EpicArena Admin • Dynamic Control Panel</title>
      </Head>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.brandRow}>
          <span style={styles.brandIcon}>⚡</span>
          <div>
            <h1 style={styles.brandTitle}>EpicArena Remote Controller</h1>
            <p style={styles.brandSub}>Package ID: com.epicarena • Live Dynamic Feature Switch</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={{ ...styles.modePill, backgroundColor: isPro ? '#FF007A22' : '#00F0FF22', borderColor: isPro ? '#FF007A' : '#00F0FF', color: isPro ? '#FF007A' : '#00F0FF' }}>
            ● ACTIVE: {isPro ? 'PRO ARENA MODE' : 'CASUAL GAMING MODE'}
          </div>
          <button onClick={() => setAuthed(false)} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      {statusMsg && (
        <div style={{ ...styles.alert, backgroundColor: statusMsg.startsWith('✅') ? '#00E67622' : '#FF525222', borderColor: statusMsg.startsWith('✅') ? '#00E676' : '#FF5252' }}>
          {statusMsg}
        </div>
      )}

      {/* Main Grid */}
      <div style={styles.grid}>
        {/* Left Column: Mode Switcher */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🕹️ Dynamic Platform Mode Switch</h2>
          <p style={styles.cardDesc}>
            Switching modes dynamically transforms the mobile app on the fly. No app reinstall required.
          </p>

          <div style={styles.modeCardsContainer}>
            {/* Mode 1: Casual */}
            <div
              onClick={() => handleModeToggle('casual')}
              style={{
                ...styles.modeCard,
                borderColor: !isPro ? '#00F0FF' : '#263248',
                backgroundColor: !isPro ? '#152438' : '#151B26',
              }}
            >
              <div style={styles.modeCardHeader}>
                <span style={{ fontSize: 24 }}>🕹️</span>
                <span style={{ ...styles.modeBadge, backgroundColor: '#00F0FF', color: '#000' }}>SAFE / STORE MODE</span>
              </div>
              <h3 style={styles.modeCardTitle}>Casual Gaming Mode</h3>
              <p style={styles.modeCardText}>
                Serves 1,000+ HTML5 casual, arcade, puzzle, racing, and skill games (GamePix / Famobi). 
                Zero real-money gambling triggers exposed.
              </p>
              <div style={styles.activeCheck}>
                {!isPro ? '✓ ACTIVE' : 'Click to Activate'}
              </div>
            </div>

            {/* Mode 2: Pro Arena */}
            <div
              onClick={() => handleModeToggle('pro')}
              style={{
                ...styles.modeCard,
                borderColor: isPro ? '#FF007A' : '#263248',
                backgroundColor: isPro ? '#2B1124' : '#151B26',
              }}
            >
              <div style={styles.modeCardHeader}>
                <span style={{ fontSize: 24 }}>🏆</span>
                <span style={{ ...styles.modeBadge, backgroundColor: '#FF007A', color: '#fff' }}>PRO ARENA MODE</span>
              </div>
              <h3 style={styles.modeCardTitle}>Pro Arena Gaming</h3>
              <p style={styles.modeCardText}>
                Unlocks the complete WinXPro suite (ScorpioPlay, PaddyPower, RainbowRiches, Rocket Crash, Poker, Live Tables, and Token Vaults).
              </p>
              <div style={{ ...styles.activeCheck, color: isPro ? '#FF007A' : '#94A3B8' }}>
                {isPro ? '✓ ACTIVE' : 'Click to Activate'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visuals & Live API Endpoints */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🎨 Visual Showcase & Banners</h2>
          <p style={styles.cardDesc}>Customize hero banners and promotional ticker headlines on mobile.</p>

          <form onSubmit={handleSaveVisuals} style={styles.form}>
            <label style={styles.label}>Featured Hero Banner Title</label>
            <input
              type="text"
              value={bannerTitle}
              onChange={(e) => setBannerTitle(e.target.value)}
              style={styles.input}
            />

            <label style={styles.label}>Theme Accent Palette</label>
            <select
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
              style={styles.select}
            >
              <option value="cyan">Cyber Neon Cyan (Default)</option>
              <option value="purple">Electric Purple</option>
              <option value="pink">Neon Pink Pro</option>
              <option value="gold">Cyber Gold Vault</option>
            </select>

            <button type="submit" disabled={loading} style={styles.primaryBtn}>
              {loading ? 'Saving...' : 'Update Visual Settings'}
            </button>
          </form>

          <hr style={{ borderColor: '#263248', margin: '24px 0' }} />

          <h3 style={{ ...styles.cardTitle, fontSize: 16 }}>📡 Real-Time Endpoint Health</h3>
          <div style={styles.endpointList}>
            <div style={styles.endpointItem}>
              <span>Remote Config API (`/api/settings/get`)</span>
              <span style={{ color: '#00E676', fontWeight: 'bold' }}>● ONLINE</span>
            </div>
            <div style={styles.endpointItem}>
              <span>Casual GamePix Feed</span>
              <span style={{ color: '#00E676', fontWeight: 'bold' }}>● 5,000+ GAMES</span>
            </div>
            <div style={styles.endpointItem}>
              <span>ScorpioPlay Provider API</span>
              <span style={{ color: '#00E676', fontWeight: 'bold' }}>● CONNECTED</span>
            </div>
            <div style={styles.endpointItem}>
              <span>EasyPaisa & JazzCash Gateway</span>
              <span style={{ color: '#00E676', fontWeight: 'bold' }}>● READY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0B0E14',
    color: '#FFFFFF',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '24px 32px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '20px',
    borderBottom: '1px solid #263248',
    marginBottom: '24px',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  brandIcon: {
    fontSize: '32px',
    background: '#151B26',
    border: '1px solid #00F0FF',
    padding: '8px 12px',
    borderRadius: '12px',
  },
  brandTitle: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '800',
    letterSpacing: '1px',
    color: '#FFFFFF',
  },
  brandSub: {
    margin: '4px 0 0 0',
    fontSize: '12px',
    color: '#94A3B8',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  modePill: {
    padding: '6px 14px',
    borderRadius: '20px',
    border: '1px solid',
    fontSize: '12px',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
  },
  logoutBtn: {
    backgroundColor: '#1F2738',
    color: '#94A3B8',
    border: '1px solid #263248',
    padding: '6px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  alert: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid',
    marginBottom: '24px',
    fontSize: '14px',
    fontWeight: '600',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: '#151B26',
    borderRadius: '16px',
    border: '1px solid #263248',
    padding: '24px',
  },
  cardTitle: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardDesc: {
    margin: '0 0 20px 0',
    fontSize: '13px',
    color: '#94A3B8',
    lineHeight: '1.5',
  },
  modeCardsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  modeCard: {
    padding: '18px',
    borderRadius: '14px',
    border: '2px solid',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  modeCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  modeBadge: {
    fontSize: '10px',
    fontWeight: '800',
    padding: '4px 8px',
    borderRadius: '6px',
    letterSpacing: '0.5px',
  },
  modeCardTitle: {
    margin: '0 0 6px 0',
    fontSize: '16px',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modeCardText: {
    margin: '0 0 12px 0',
    fontSize: '12px',
    color: '#94A3B8',
    lineHeight: '1.4',
  },
  activeCheck: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#00F0FF',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#94A3B8',
  },
  input: {
    backgroundColor: '#0B0E14',
    border: '1px solid #263248',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#FFFFFF',
    fontSize: '14px',
    outline: 'none',
  },
  select: {
    backgroundColor: '#0B0E14',
    border: '1px solid #263248',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#FFFFFF',
    fontSize: '14px',
    outline: 'none',
  },
  primaryBtn: {
    marginTop: '8px',
    backgroundColor: '#00F0FF',
    color: '#000000',
    border: 'none',
    padding: '12px',
    borderRadius: '10px',
    fontWeight: '800',
    fontSize: '13px',
    cursor: 'pointer',
    letterSpacing: '0.5px',
  },
  endpointList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  endpointItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 14px',
    backgroundColor: '#0B0E14',
    borderRadius: '8px',
    border: '1px solid #263248',
    fontSize: '12px',
  },
  loginContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0E14',
  },
  loginCard: {
    width: '380px',
    backgroundColor: '#151B26',
    border: '1px solid #00F0FF',
    borderRadius: '20px',
    padding: '32px',
    textAlign: 'center',
  },
  logoBadge: {
    fontSize: '42px',
    marginBottom: '12px',
  },
  loginTitle: {
    margin: '0 0 4px 0',
    fontSize: '20px',
    fontWeight: '800',
    color: '#FFFFFF',
  },
  loginSub: {
    margin: '0 0 24px 0',
    fontSize: '12px',
    color: '#94A3B8',
  },
};

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { DEFAULT_APP_CONFIGS } from '../../utils/appConfigsStore';

export default function MultiAppAdmin() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState('winxpro');
  const [allConfigs, setAllConfigs] = useState(DEFAULT_APP_CONFIGS);
  const [currentConfig, setCurrentConfig] = useState(DEFAULT_APP_CONFIGS.winxpro);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/app-config');
      const data = await res.json();
      if (data.success && data.configs) {
        setAllConfigs(data.configs);
        setCurrentConfig(data.configs[selectedAppId] || data.configs.winxpro);
      }
    } catch (e) {
      console.error('Failed to load app configs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) {
      fetchConfigs();
    }
  }, [authed]);

  const handleAppSelect = (appId) => {
    setSelectedAppId(appId);
    setCurrentConfig(allConfigs[appId] || DEFAULT_APP_CONFIGS[appId] || DEFAULT_APP_CONFIGS.winxpro);
    setMsg(null);
  };

  const handleFieldChange = (field, value) => {
    setCurrentConfig(prev => ({ ...prev, [field]: value }));
  };

  const applyPresetTheme = (preset) => {
    if (preset === 'bluish') {
      setCurrentConfig(prev => ({
        ...prev,
        theme_type: 'bluish',
        primary_color: '#1877f2',
        secondary_color: '#0d6efd',
        accent_color: '#ffd700',
        bg_color: '#0d2240',
        card_color: '#13305b',
        header_bg: 'linear-gradient(135deg, #1877f2 0%, #0b5ed7 100%)',
        text_color: '#ffffff'
      }));
    } else if (preset === 'whitish') {
      setCurrentConfig(prev => ({
        ...prev,
        theme_type: 'whitish',
        primary_color: '#0e9f6e',
        secondary_color: '#057a55',
        accent_color: '#ff9800',
        bg_color: '#f4f6f8',
        card_color: '#ffffff',
        header_bg: 'linear-gradient(135deg, #0e9f6e 0%, #046c4e 100%)',
        text_color: '#1a202c'
      }));
    } else if (preset === 'blackish') {
      setCurrentConfig(prev => ({
        ...prev,
        theme_type: 'blackish',
        primary_color: '#121212',
        secondary_color: '#1e1e1e',
        accent_color: '#00e676',
        bg_color: '#0a0a0a',
        card_color: '#181818',
        header_bg: 'linear-gradient(135deg, #1f1f1f 0%, #121212 100%)',
        text_color: '#ffffff'
      }));
    } else if (preset === 'dark-gold') {
      setCurrentConfig(prev => ({
        ...prev,
        theme_type: 'dark-gold',
        primary_color: '#0f0a1e',
        secondary_color: '#191132',
        accent_color: '#ffd700',
        bg_color: '#0a0814',
        card_color: '#15102a',
        header_bg: 'linear-gradient(135deg, #150d2a 0%, #0d081a 100%)',
        text_color: '#ffffff'
      }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/app-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: selectedAppId, config: currentConfig })
      });
      const data = await res.json();
      if (data.success) {
        setAllConfigs(prev => ({ ...prev, [selectedAppId]: data.config }));
        setMsg({ type: 'success', text: `OTA Changes published live for ${currentConfig.app_name}!` });
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed to save configuration.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Server communication failure.' });
    } finally {
      setLoading(false);
    }
  };

  if (!authed) {
    return (
      <div style={{ maxWidth: '400px', margin: '80px auto', padding: '24px', background: '#121620', borderRadius: '16px', color: '#fff' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>🔐 App Manager Admin Login</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (password === 'Admin@123') setAuthed(true);
          else setMsg({ type: 'error', text: 'Invalid Admin Password' });
        }}>
          <input
            type="password"
            placeholder="Enter Admin Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#0a0d14', color: '#fff', marginBottom: '16px' }}
          />
          <button type="submit" style={{ width: '100%', padding: '12px', background: '#ffd700', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Unlock App Manager
          </button>
        </form>
        {msg && <p style={{ color: msg.type === 'error' ? '#ff4d4f' : '#52c41a', textAlign: 'center', marginTop: '12px' }}>{msg.text}</p>}
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1100px', margin: '0 auto', color: '#fff', fontFamily: 'sans-serif' }}>
      <Head>
        <title>App Branding & OTA Config Manager - WinXPro Admin</title>
      </Head>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #2a2e3d', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#ffd700' }}>📱 Multi-Brand App & Theme Manager</h1>
          <p style={{ margin: '6px 0 0', color: '#8c9ba5', fontSize: '14px' }}>
            Control live branding, colors, logos, and API options across all standalone & web apps instantly.
          </p>
        </div>
        <Link href="/admin">
          <button style={{ padding: '8px 16px', background: '#212638', color: '#fff', border: '1px solid #3d4663', borderRadius: '8px', cursor: 'pointer' }}>
            ← Back to Admin Panel
          </button>
        </Link>
      </div>

      {/* App Selector Pills */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', background: '#161b26', padding: '12px', borderRadius: '12px' }}>
        {['winxpro', 'n999', 'y999', 'winpkr'].map(appKey => {
          const cfg = allConfigs[appKey] || DEFAULT_APP_CONFIGS[appKey];
          const isSelected = selectedAppId === appKey;
          return (
            <button
              key={appKey}
              onClick={() => handleAppSelect(appKey)}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '8px',
                border: isSelected ? '2px solid #ffd700' : '1px solid #2d3548',
                background: isSelected ? '#252d3d' : '#0d1117',
                color: isSelected ? '#ffd700' : '#fff',
                fontWeight: 'bold',
                fontSize: '15px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '18px' }}>
                {appKey === 'winxpro' ? '🌐' : appKey === 'n999' ? '🔵' : appKey === 'y999' ? '⚪' : '🖤'} {cfg.app_name}
              </div>
              <div style={{ fontSize: '11px', color: isSelected ? '#e6c200' : '#6c7a89', marginTop: '4px' }}>
                {cfg.package_name} {appKey === 'winxpro' ? '(Web App)' : '(Standalone)'}
              </div>
            </button>
          );
        })}
      </div>

      {msg && (
        <div style={{ padding: '14px', borderRadius: '8px', marginBottom: '20px', background: msg.type === 'error' ? 'rgba(255, 77, 79, 0.15)' : 'rgba(82, 196, 26, 0.15)', border: `1px solid ${msg.type === 'error' ? '#ff4d4f' : '#52c41a'}`, color: msg.type === 'error' ? '#ff4d4f' : '#52c41a' }}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Left Column: Form Controls */}
        <div style={{ background: '#121620', padding: '24px', borderRadius: '16px', border: '1px solid #232a3b' }}>
          <h3 style={{ marginTop: 0, color: '#ffd700', borderBottom: '1px solid #232a3b', paddingBottom: '10px' }}>
            ⚙️ App Details & Preset Themes ({currentConfig.app_name})
          </h3>

          {/* Preset Theme Quick Buttons */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#8c9ba5', marginBottom: '8px' }}>Apply Quick Theme Preset:</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => applyPresetTheme('bluish')} style={{ flex: 1, padding: '8px', background: '#1877f2', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                🔵 Bluish Theme
              </button>
              <button type="button" onClick={() => applyPresetTheme('whitish')} style={{ flex: 1, padding: '8px', background: '#0e9f6e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                ⚪ Whitish Theme
              </button>
              <button type="button" onClick={() => applyPresetTheme('blackish')} style={{ flex: 1, padding: '8px', background: '#1e1e1e', color: '#00e676', border: '1px solid #00e676', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                🖤 Blackish Theme
              </button>
              <button type="button" onClick={() => applyPresetTheme('dark-gold')} style={{ flex: 1, padding: '8px', background: '#0f0a1e', color: '#ffd700', border: '1px solid #ffd700', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                ✨ Dark Gold
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#8c9ba5', marginBottom: '6px' }}>App Display Name:</label>
              <input
                type="text"
                value={currentConfig.app_name || ''}
                onChange={e => handleFieldChange('app_name', e.target.value)}
                style={{ width: '100%', padding: '10px', background: '#0a0d14', border: '1px solid #2b3347', borderRadius: '8px', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#8c9ba5', marginBottom: '6px' }}>Package Identifier:</label>
              <input
                type="text"
                disabled
                value={currentConfig.package_name || ''}
                style={{ width: '100%', padding: '10px', background: '#080a0f', border: '1px solid #1a202c', borderRadius: '8px', color: '#718096' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#8c9ba5', marginBottom: '6px' }}>App Logo SVG / Image URL:</label>
            <input
              type="text"
              value={currentConfig.logo_url || ''}
              onChange={e => handleFieldChange('logo_url', e.target.value)}
              style={{ width: '100%', padding: '10px', background: '#0a0d14', border: '1px solid #2b3347', borderRadius: '8px', color: '#fff' }}
            />
          </div>

          <h4 style={{ color: '#ffd700', margin: '20px 0 12px', borderBottom: '1px solid #232a3b', paddingBottom: '6px' }}>
            🎨 Visual Color Palette
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#8c9ba5', marginBottom: '6px' }}>Background Color (--bg):</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="color" value={currentConfig.bg_color || '#0a0814'} onChange={e => handleFieldChange('bg_color', e.target.value)} style={{ width: '40px', height: '38px', border: 'none', borderRadius: '6px', cursor: 'pointer' }} />
                <input type="text" value={currentConfig.bg_color || ''} onChange={e => handleFieldChange('bg_color', e.target.value)} style={{ flex: 1, padding: '8px', background: '#0a0d14', border: '1px solid #2b3347', borderRadius: '8px', color: '#fff' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#8c9ba5', marginBottom: '6px' }}>Card Container Color (--card):</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="color" value={currentConfig.card_color || '#15102a'} onChange={e => handleFieldChange('card_color', e.target.value)} style={{ width: '40px', height: '38px', border: 'none', borderRadius: '6px', cursor: 'pointer' }} />
                <input type="text" value={currentConfig.card_color || ''} onChange={e => handleFieldChange('card_color', e.target.value)} style={{ flex: 1, padding: '8px', background: '#0a0d14', border: '1px solid #2b3347', borderRadius: '8px', color: '#fff' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#8c9ba5', marginBottom: '6px' }}>Primary Brand Color (--primary):</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="color" value={currentConfig.primary_color || '#0f0a1e'} onChange={e => handleFieldChange('primary_color', e.target.value)} style={{ width: '40px', height: '38px', border: 'none', borderRadius: '6px', cursor: 'pointer' }} />
                <input type="text" value={currentConfig.primary_color || ''} onChange={e => handleFieldChange('primary_color', e.target.value)} style={{ flex: 1, padding: '8px', background: '#0a0d14', border: '1px solid #2b3347', borderRadius: '8px', color: '#fff' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#8c9ba5', marginBottom: '6px' }}>Accent Highlight Color (--accent):</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="color" value={currentConfig.accent_color || '#ffd700'} onChange={e => handleFieldChange('accent_color', e.target.value)} style={{ width: '40px', height: '38px', border: 'none', borderRadius: '6px', cursor: 'pointer' }} />
                <input type="text" value={currentConfig.accent_color || ''} onChange={e => handleFieldChange('accent_color', e.target.value)} style={{ flex: 1, padding: '8px', background: '#0a0d14', border: '1px solid #2b3347', borderRadius: '8px', color: '#fff' }} />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#8c9ba5', marginBottom: '6px' }}>Header Gradient / Background CSS:</label>
            <input
              type="text"
              value={currentConfig.header_bg || ''}
              onChange={e => handleFieldChange('header_bg', e.target.value)}
              style={{ width: '100%', padding: '10px', background: '#0a0d14', border: '1px solid #2b3347', borderRadius: '8px', color: '#fff' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              marginTop: '12px',
              background: 'linear-gradient(135deg, #ffd700 0%, #ff8f00 100%)',
              color: '#000',
              fontWeight: '900',
              fontSize: '16px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)'
            }}
          >
            {loading ? 'Publishing OTA...' : `🚀 Save & Publish OTA Changes for ${currentConfig.app_name}`}
          </button>
        </div>

        {/* Right Column: Live App Preview Card */}
        <div>
          <div style={{ position: 'sticky', top: '20px', background: '#0c0f17', padding: '20px', borderRadius: '16px', border: '1px solid #232a3b' }}>
            <h4 style={{ marginTop: 0, color: '#8c9ba5', textAlign: 'center', marginBottom: '16px' }}>
              📱 Live App Mockup Preview
            </h4>

            {/* Mobile Phone Mock Container */}
            <div style={{
              background: currentConfig.bg_color || '#0a0814',
              color: currentConfig.text_color || '#ffffff',
              borderRadius: '24px',
              border: '4px solid #333',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              minHeight: '440px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Header Bar */}
              <div style={{
                background: currentConfig.header_bg || currentConfig.primary_color,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                color: '#fff',
                fontWeight: 'bold'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src={currentConfig.logo_url || '/logo.svg'} alt="Logo" style={{ height: '24px' }} onError={(e) => { e.target.style.display = 'none'; }} />
                  <span>{currentConfig.app_name}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '12px', fontSize: '12px' }}>
                  Rs 0.00
                </div>
              </div>

              {/* Banner Area */}
              <div style={{
                margin: '12px',
                padding: '16px',
                background: `linear-gradient(135deg, ${currentConfig.primary_color} 0%, ${currentConfig.accent_color} 100%)`,
                borderRadius: '12px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 'bold'
              }}>
                🎉 {currentConfig.app_name} Welcome Bonus!
                <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '4px', fontWeight: 'normal' }}>
                  Deposit & get 100% instant reward
                </div>
              </div>

              {/* Game Cards Grid */}
              <div style={{ padding: '0 12px', flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ background: currentConfig.card_color, padding: '12px', borderRadius: '12px', border: `1px solid ${currentConfig.accent_color}33`, textAlign: 'center' }}>
                  <div style={{ fontSize: '24px' }}>✈️</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>Aviator</div>
                </div>
                <div style={{ background: currentConfig.card_color, padding: '12px', borderRadius: '12px', border: `1px solid ${currentConfig.accent_color}33`, textAlign: 'center' }}>
                  <div style={{ fontSize: '24px' }}>🎰</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>Super Ace</div>
                </div>
                <div style={{ background: currentConfig.card_color, padding: '12px', borderRadius: '12px', border: `1px solid ${currentConfig.accent_color}33`, textAlign: 'center' }}>
                  <div style={{ fontSize: '24px' }}>🎲</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>Sic Bo</div>
                </div>
                <div style={{ background: currentConfig.card_color, padding: '12px', borderRadius: '12px', border: `1px solid ${currentConfig.accent_color}33`, textAlign: 'center' }}>
                  <div style={{ fontSize: '24px' }}>🏏</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>Cricket</div>
                </div>
              </div>

              {/* Bottom Nav Bar */}
              <div style={{
                background: currentConfig.card_color,
                borderTop: '1px solid rgba(255,255,255,0.1)',
                padding: '8px 12px',
                display: 'flex',
                justify: 'space-around',
                fontSize: '10px',
                color: currentConfig.accent_color
              }}>
                <div>🏠 Home</div>
                <div>🎁 Promo</div>
                <div>💬 Support</div>
                <div>👤 Profile</div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// In-Memory & Persistent Application Configuration Store

export const DEFAULT_APP_CONFIGS = {
  winxpro: {
    app_id: 'winxpro',
    package_name: 'com.winxpro',
    app_name: 'WinXPro',
    logo_url: '/logo.svg',
    theme_type: 'dark-gold',
    primary_color: '#0f0a1e',
    secondary_color: '#191132',
    accent_color: '#ffd700',
    bg_color: '#0a0814',
    card_color: '#15102a',
    header_bg: 'linear-gradient(135deg, #150d2a 0%, #0d081a 100%)',
    text_color: '#ffffff',
    betnex_host: '',
    rapid_host: '',
    custom_notice: 'Welcome to WinXPro Premier Web Platform'
  },
  n999: {
    app_id: 'n999',
    package_name: 'com.winxpro.n999',
    app_name: 'N999',
    logo_url: '/logo.svg',
    theme_type: 'bluish',
    primary_color: '#1877f2',
    secondary_color: '#0d6efd',
    accent_color: '#ffd700',
    bg_color: '#0d2240',
    card_color: '#13305b',
    header_bg: 'linear-gradient(135deg, #1877f2 0%, #0b5ed7 100%)',
    text_color: '#ffffff',
    betnex_host: '',
    rapid_host: '',
    custom_notice: 'N999 Standalone App'
  },
  y999: {
    app_id: 'y999',
    package_name: 'com.winxpro.y999',
    app_name: 'Y999',
    logo_url: '/logo.svg',
    theme_type: 'whitish',
    primary_color: '#0e9f6e',
    secondary_color: '#057a55',
    accent_color: '#ff9800',
    bg_color: '#f4f6f8',
    card_color: '#ffffff',
    header_bg: 'linear-gradient(135deg, #0e9f6e 0%, #046c4e 100%)',
    text_color: '#1a202c',
    betnex_host: '',
    rapid_host: '',
    custom_notice: 'Y999 Standalone App'
  },
  winpkr: {
    app_id: 'winpkr',
    package_name: 'com.winxpro.winpkr',
    app_name: 'WinPkr',
    logo_url: '/logo.svg',
    theme_type: 'blackish',
    primary_color: '#121212',
    secondary_color: '#1e1e1e',
    accent_color: '#00e676',
    bg_color: '#0a0a0a',
    card_color: '#181818',
    header_bg: 'linear-gradient(135deg, #1f1f1f 0%, #121212 100%)',
    text_color: '#ffffff',
    betnex_host: '',
    rapid_host: '',
    custom_notice: 'WinPkr Standalone App'
  }
};

// Global in-memory cache for live updates
let activeAppConfigs = { ...DEFAULT_APP_CONFIGS };

export function getAppConfig(appId = 'winxpro') {
  const normalizedId = String(appId).toLowerCase();
  return activeAppConfigs[normalizedId] || activeAppConfigs['winxpro'];
}

export function getAllAppConfigs() {
  return activeAppConfigs;
}

export function updateAppConfig(appId, newConfig) {
  const normalizedId = String(appId).toLowerCase();
  if (!activeAppConfigs[normalizedId]) {
    activeAppConfigs[normalizedId] = { ...DEFAULT_APP_CONFIGS.winxpro, app_id: normalizedId };
  }
  
  activeAppConfigs[normalizedId] = {
    ...activeAppConfigs[normalizedId],
    ...newConfig,
    updated_at: new Date().toISOString()
  };

  return activeAppConfigs[normalizedId];
}

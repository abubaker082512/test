import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_APP_CONFIGS } from '../utils/appConfigsStore';

const ConfigContext = createContext({
  appConfig: DEFAULT_APP_CONFIGS.winxpro,
  appId: 'winxpro',
  refreshConfig: () => {}
});

export function ConfigProvider({ children }) {
  const [appId, setAppId] = useState('winxpro');
  const [appConfig, setAppConfig] = useState(DEFAULT_APP_CONFIGS.winxpro);

  const applyThemeToDOM = (config) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    if (config.bg_color) root.style.setProperty('--bg', config.bg_color);
    if (config.card_color) root.style.setProperty('--card', config.card_color);
    if (config.primary_color) root.style.setProperty('--primary', config.primary_color);
    if (config.secondary_color) root.style.setProperty('--secondary', config.secondary_color);
    if (config.accent_color) root.style.setProperty('--accent', config.accent_color);
    if (config.text_color) root.style.setProperty('--text-main', config.text_color);
    if (config.header_bg) root.style.setProperty('--header-bg', config.header_bg);
    
    // Set theme class attribute on html tag
    root.setAttribute('data-theme', config.theme_type || 'default');
    root.setAttribute('data-app-id', config.app_id || 'winxpro');

    // Update document title if applicable
    if (config.app_name) {
      document.title = config.app_name + ' - Pakistan Premier Gaming';
    }
  };

  const fetchConfig = async (targetId) => {
    try {
      const res = await fetch(`/api/app-config?appId=${encodeURIComponent(targetId)}`);
      const data = await res.json();
      if (data.success && data.config) {
        setAppConfig(data.config);
        applyThemeToDOM(data.config);
      }
    } catch (e) {
      console.error('Failed to load remote app configuration:', e);
      const fallback = DEFAULT_APP_CONFIGS[targetId] || DEFAULT_APP_CONFIGS.winxpro;
      setAppConfig(fallback);
      applyThemeToDOM(fallback);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      let detectedId = params.get('appId');

      if (!detectedId) {
        detectedId = localStorage.getItem('winxpro_app_id');
      } else {
        localStorage.setItem('winxpro_app_id', detectedId);
      }

      const finalId = (detectedId || 'winxpro').toLowerCase();
      setAppId(finalId);
      fetchConfig(finalId);
    }
  }, []);

  const refreshConfig = (targetId = appId) => {
    fetchConfig(targetId);
  };

  return (
    <ConfigContext.Provider value={{ appConfig, appId, refreshConfig, setAppId }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useAppConfig() {
  return useContext(ConfigContext);
}

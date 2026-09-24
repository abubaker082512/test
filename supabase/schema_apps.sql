-- Schema setup for Multi-App Configuration in WinXPro Engine

CREATE TABLE IF NOT EXISTS public.app_configs (
  app_id VARCHAR(50) PRIMARY KEY, -- 'winxpro', 'n999', 'y999', 'winpkr'
  package_name VARCHAR(100) NOT NULL,
  app_name VARCHAR(100) NOT NULL,
  logo_url TEXT NOT NULL DEFAULT '/logo.svg',
  theme_type VARCHAR(50) DEFAULT 'default',
  primary_color VARCHAR(20) NOT NULL,
  secondary_color VARCHAR(20) NOT NULL,
  accent_color VARCHAR(20) NOT NULL,
  bg_color VARCHAR(20) NOT NULL,
  card_color VARCHAR(20) NOT NULL,
  header_bg VARCHAR(50) NOT NULL,
  text_color VARCHAR(20) NOT NULL DEFAULT '#ffffff',
  betnex_host VARCHAR(255) DEFAULT '',
  rapid_host VARCHAR(255) DEFAULT '',
  custom_notice TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial records with requested themes:
-- 1. N999: Vibrant Bluish Theme (#0d6efd / #1877f2)
-- 2. Y999: Clean Whitish Theme (#ffffff / #0e9f6e Emerald Header)
-- 3. WinPkr: Blackish Premium Theme (#121212 / #00e676 Neon Green & Gold)
-- 4. WinXPro: Original Dark Gold Theme (#0a0814 / #ffd700)

INSERT INTO public.app_configs (
  app_id, package_name, app_name, logo_url, theme_type,
  primary_color, secondary_color, accent_color, bg_color, card_color, header_bg, text_color
) VALUES 
(
  'winxpro', 'com.winxpro', 'WinXPro', '/logo.svg', 'dark-gold',
  '#0f0a1e', '#191132', '#ffd700', '#0a0814', '#15102a', 'linear-gradient(135deg, #150d2a 0%, #0d081a 100%)', '#ffffff'
),
(
  'n999', 'com.winxpro.n999', 'N999', '/logo.svg', 'bluish',
  '#1877f2', '#0d6efd', '#ffd700', '#0f2444', '#132d54', 'linear-gradient(135deg, #1877f2 0%, #0b5ed7 100%)', '#ffffff'
),
(
  'y999', 'com.winxpro.y999', 'Y999', '/logo.svg', 'whitish',
  '#0e9f6e', '#057a55', '#ff9800', '#f4f6f8', '#ffffff', 'linear-gradient(135deg, #0e9f6e 0%, #046c4e 100%)', '#1a202c'
),
(
  'winpkr', 'com.winxpro.winpkr', 'WinPkr', '/logo.svg', 'blackish',
  '#121212', '#1e1e1e', '#00e676', '#0a0a0a', '#181818', 'linear-gradient(135deg, #1f1f1f 0%, #121212 100%)', '#ffffff'
)
ON CONFLICT (app_id) DO UPDATE SET
  app_name = EXCLUDED.app_name,
  primary_color = EXCLUDED.primary_color,
  secondary_color = EXCLUDED.secondary_color,
  accent_color = EXCLUDED.accent_color,
  bg_color = EXCLUDED.bg_color,
  card_color = EXCLUDED.card_color,
  header_bg = EXCLUDED.header_bg,
  text_color = EXCLUDED.text_color;

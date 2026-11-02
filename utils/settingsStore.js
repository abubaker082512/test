import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'settings.json');
const TMP_FILE = path.join('/tmp', 'winxpro_settings.json');

const DEFAULT_SETTINGS = {
  pkr_rate: 1.0,
  usd_rate: 280.0,
  payin_pkr_rate: 1.0,
  payout_pkr_rate: 1.0,
  directpay_client_id: process.env.DIRECTPAY_CLIENT_ID || 'pwa_ci_k1qlq54hv4gw5pr0khux',
  directpay_client_secret: process.env.DIRECTPAY_CLIENT_SECRET || 'pwa_secret_zp5rai8z02zr3o5sebm1co6uxci58uca',
  directpay_enabled: false, // Default to Direct P2P Manual Payments
  jazzcash_merchant_id: process.env.JAZZCASH_MERCHANT_ID || '74584985',
  jazzcash_password: process.env.JAZZCASH_PASSWORD || 'qo38057jbm',
  jazzcash_integrity_salt: process.env.JAZZCASH_INTEGRITY_SALT || 'z35f76uo0m',
  jazzcash_enabled: true,
  jazzcash_mode: 'manual',
  easypaisa_store_id: process.env.EASYPAISA_STORE_ID || '43',
  easypaisa_hash_key: process.env.EASYPAISA_HASH_KEY || '1234567890123456',
  easypaisa_enabled: true,
  easypaisa_mode: 'manual',
  card_mode: 'manual',
  // Direct P2P Manual Accounts & Limits (Zero 3rd-party fees)
  manual_deposit_enabled: true,
  min_deposit: 200,
  max_deposit: 100000,
  min_withdraw: 500,
  max_withdraw: 50000,
  manual_jazzcash_title: 'WinX Pro Official',
  manual_jazzcash_no: '03112235935',
  manual_jazzcash2_title: 'WinX Pro VIP',
  manual_jazzcash2_no: '03001234567',
  manual_easypaisa_title: 'WinX Pro Official',
  manual_easypaisa_no: '03493530916',
  manual_easypaisa2_title: 'WinX Pro VIP',
  manual_easypaisa2_no: '03451234567',
  manual_crypto_network: 'USDT (TRC20)',
  manual_crypto_address: '',
  deposit_instructions: 'Please transfer the exact amount to the account shown above, then enter your Transaction ID (TID) to get credited.',
  global_rtp: 92.0,
  max_win_cap: 5000.0,
  force_house_edge: false,
  restricted_users: [],
  epicarena_mode: 'casual',
  is_pro_mode: false,
  epicarena_featured_banner: 'EpicArena Global Gaming Hub',
  epicarena_active_theme: 'cyber_dark'
};

// Global in-memory cache to survive module re-evaluations
let memoryStore = { ...DEFAULT_SETTINGS };

export function getPersistedSettings() {
  try {
    // 1. Try local data file
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(content);
      memoryStore = { ...DEFAULT_SETTINGS, ...memoryStore, ...parsed };
      return memoryStore;
    }
  } catch (e) {}

  try {
    // 2. Try tmp file on serverless environments (Vercel)
    if (fs.existsSync(TMP_FILE)) {
      const content = fs.readFileSync(TMP_FILE, 'utf8');
      const parsed = JSON.parse(content);
      memoryStore = { ...DEFAULT_SETTINGS, ...memoryStore, ...parsed };
      return memoryStore;
    }
  } catch (e) {}

  return memoryStore;
}

export function savePersistedSettings(newSettings = {}) {
  memoryStore = {
    ...DEFAULT_SETTINGS,
    ...memoryStore,
    ...newSettings,
    updated_at: new Date().toISOString()
  };

  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch (e) {
    // Fallback write to /tmp on readonly filesystems
    try {
      fs.writeFileSync(TMP_FILE, JSON.stringify(memoryStore, null, 2), 'utf8');
    } catch (tmpErr) {}
  }

  return memoryStore;
}

export const getSettings = getPersistedSettings;
export const updateSettings = savePersistedSettings;

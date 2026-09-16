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
  directpay_enabled: true,
  jazzcash_merchant_id: process.env.JAZZCASH_MERCHANT_ID || '74584985',
  jazzcash_password: process.env.JAZZCASH_PASSWORD || 'qo38057jbm',
  jazzcash_integrity_salt: process.env.JAZZCASH_INTEGRITY_SALT || 'z35f76uo0m',
  jazzcash_enabled: true,
  jazzcash_mode: 'directpay',
  easypaisa_store_id: process.env.EASYPAISA_STORE_ID || '43',
  easypaisa_hash_key: process.env.EASYPAISA_HASH_KEY || '1234567890123456',
  easypaisa_enabled: true,
  easypaisa_mode: 'directpay',
  card_mode: 'directpay'
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

import { db } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  limit,
  getDocs,
  onSnapshot
} from 'firebase/firestore';

// In-memory / local fallback store in case Firestore is pending activation
const memoryStore = {
  wallets: new Map(),
  transactions: [],
  settings: {
    payout_target_pct: 75.0,
    min_rtp_floor: 65.0,
    max_rtp_ceiling: 85.0,
    loss_streak_trigger: 5,
    loss_streak_boost: 12.0,
    profit_cap_per_hour: 5000.0,
    risk_mode: 'DYNAMIC_AUTO',
    emergency_lock: false,
    win_ratio: 75.0,
    loss_ratio: 25.0
  },
  crash_state: {
    id: 1,
    multiplier: 1.0,
    crashed: false,
    active: true,
    phase: 'betting',
    crash_point: 2.0
  }
};

/**
 * Wallet Helpers
 */
export async function getOrCreateWallet(userId, initialBalance = 1000.0) {
  if (!userId) return null;
  try {
    const walletRef = doc(db, 'wallets', userId);
    const snap = await getDoc(walletRef);

    if (snap.exists()) {
      const data = { id: snap.id, ...snap.data() };
      memoryStore.wallets.set(userId, data);
      return data;
    } else {
      const newWallet = {
        user_id: userId,
        balance: initialBalance,
        currency: 'Pi',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await setDoc(walletRef, newWallet);
      memoryStore.wallets.set(userId, newWallet);
      return { id: userId, ...newWallet };
    }
  } catch (err) {
    if (!memoryStore.wallets.has(userId)) {
      memoryStore.wallets.set(userId, {
        id: userId,
        user_id: userId,
        balance: initialBalance,
        currency: 'Pi',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    return memoryStore.wallets.get(userId);
  }
}

export async function getWallet(userId) {
  if (!userId) return null;
  try {
    const walletRef = doc(db, 'wallets', userId);
    const snap = await getDoc(walletRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
  } catch (err) {}
  return memoryStore.wallets.get(userId) || null;
}

export async function updateWalletBalance(userId, newBalance) {
  if (!userId) return false;
  const numBalance = parseFloat(newBalance);
  try {
    const walletRef = doc(db, 'wallets', userId);
    await updateDoc(walletRef, {
      balance: numBalance,
      updated_at: new Date().toISOString()
    });
  } catch (err) {}

  if (memoryStore.wallets.has(userId)) {
    const w = memoryStore.wallets.get(userId);
    w.balance = numBalance;
    w.updated_at = new Date().toISOString();
  }
  return true;
}

export function subscribeWallet(userId, onUpdate) {
  if (!userId) return () => {};
  try {
    const walletRef = doc(db, 'wallets', userId);
    return onSnapshot(walletRef, (snap) => {
      if (snap.exists()) {
        onUpdate({ id: snap.id, ...snap.data() });
      }
    }, (err) => {
      if (memoryStore.wallets.has(userId)) {
        onUpdate(memoryStore.wallets.get(userId));
      }
    });
  } catch (e) {
    if (memoryStore.wallets.has(userId)) {
      onUpdate(memoryStore.wallets.get(userId));
    }
    return () => {};
  }
}

/**
 * Transactions Helpers
 */
export async function addTransaction({ user_id, type, amount, status = 'completed', notes = '', metadata = {} }) {
  const transObj = {
    id: 'tx-' + Date.now().toString(36),
    user_id,
    type,
    amount: parseFloat(amount),
    status,
    notes,
    metadata,
    created_at: new Date().toISOString()
  };
  try {
    const transRef = collection(db, 'transactions');
    const docRef = await addDoc(transRef, transObj);
    transObj.id = docRef.id;
  } catch (err) {}

  memoryStore.transactions.unshift(transObj);
  return { id: transObj.id };
}

export async function getUserTransactions(userId, maxCount = 20) {
  if (!userId) return [];
  try {
    const transRef = collection(db, 'transactions');
    const q = query(transRef, where('user_id', '==', userId), limit(maxCount));
    const snap = await getDocs(q);
    const list = [];
    snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
    if (list.length > 0) {
      return list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }
  } catch (err) {}

  return memoryStore.transactions
    .filter(t => t.user_id === userId)
    .slice(0, maxCount)
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

/**
 * Settings & Risk Management
 */
export async function getRiskSettings() {
  try {
    const docRef = doc(db, 'settings', 'risk_settings');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    await setDoc(docRef, memoryStore.settings);
  } catch (err) {}
  return memoryStore.settings;
}

export async function updateRiskSettings(newSettings) {
  memoryStore.settings = { ...memoryStore.settings, ...newSettings };
  try {
    const docRef = doc(db, 'settings', 'risk_settings');
    await setDoc(docRef, { ...newSettings, updated_at: new Date().toISOString() }, { merge: true });
  } catch (err) {}
  return true;
}

/**
 * Crash Game State
 */
export async function getCrashState() {
  try {
    const docRef = doc(db, 'crash_state', 'current');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {}
  return memoryStore.crash_state;
}

export async function updateCrashState(patch) {
  memoryStore.crash_state = { ...memoryStore.crash_state, ...patch, updated_at: new Date().toISOString() };
  try {
    const docRef = doc(db, 'crash_state', 'current');
    await setDoc(docRef, { ...patch, updated_at: new Date().toISOString() }, { merge: true });
  } catch (err) {}
}

export function subscribeCrashState(onUpdate) {
  try {
    const docRef = doc(db, 'crash_state', 'current');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data());
      }
    }, () => {
      onUpdate(memoryStore.crash_state);
    });
  } catch (e) {
    onUpdate(memoryStore.crash_state);
    return () => {};
  }
}

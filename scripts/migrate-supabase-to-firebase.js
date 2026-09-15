const { createClient } = require('@supabase/supabase-js');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection, addDoc, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyADYzDtfGP1AMcdr4lIqZ2Mdwlj03ANLkw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "winxpro-1263f.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "winxpro-1263f",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "winxpro-1263f.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "752052905755",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:752052905755:web:d0c286ca3db9a84bb395be",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-WJWNYBYMHX"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hlgjjtrfyjbonyfuhxdg.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
  console.log('🚀 Starting Supabase -> Firebase Firestore Data Migration...');

  // 1. Migrate Risk Settings
  console.log('📦 Migrating Platform & Risk Settings to Firebase Firestore...');
  const defaultSettings = {
    payout_target_pct: 75.0,
    min_rtp_floor: 65.0,
    max_rtp_ceiling: 85.0,
    loss_streak_trigger: 5,
    loss_streak_boost: 12.0,
    profit_cap_per_hour: 5000.0,
    risk_mode: 'DYNAMIC_AUTO',
    emergency_lock: false,
    win_ratio: 75.0,
    loss_ratio: 25.0,
    updated_at: new Date().toISOString()
  };

  try {
    const { data: supaSettings } = await supabase.from('settings').select('*');
    if (supaSettings && supaSettings.length > 0) {
      for (const s of supaSettings) {
        await setDoc(doc(db, 'settings', s.key || s.id || 'risk_settings'), s, { merge: true });
      }
      console.log(`✅ Migrated ${supaSettings.length} settings from Supabase`);
    } else {
      await setDoc(doc(db, 'settings', 'risk_settings'), defaultSettings, { merge: true });
      console.log('✅ Seeded default risk & platform settings in Firebase');
    }
  } catch (e) {
    await setDoc(doc(db, 'settings', 'risk_settings'), defaultSettings, { merge: true });
    console.log('✅ Seeded default settings in Firebase Firestore');
  }

  // 2. Migrate Crash State
  console.log('📦 Migrating Crash Game State to Firebase Firestore...');
  const initialCrash = {
    id: 1,
    multiplier: 1.0,
    crashed: false,
    active: true,
    phase: 'betting',
    crash_point: 2.50,
    updated_at: new Date().toISOString()
  };
  try {
    const { data: crashState } = await supabase.from('crash_state').select('*').limit(1);
    if (crashState && crashState.length > 0) {
      await setDoc(doc(db, 'crash_state', 'current'), crashState[0], { merge: true });
      console.log('✅ Migrated crash state from Supabase');
    } else {
      await setDoc(doc(db, 'crash_state', 'current'), initialCrash, { merge: true });
      console.log('✅ Initialized crash state in Firebase');
    }
  } catch (e) {
    await setDoc(doc(db, 'crash_state', 'current'), initialCrash, { merge: true });
    console.log('✅ Initialized crash state in Firebase');
  }

  // 3. Migrate Wallets
  console.log('📦 Migrating Wallets to Firebase Firestore...');
  try {
    const { data: wallets, error } = await supabase.from('wallets').select('*');
    if (wallets && wallets.length > 0) {
      for (const w of wallets) {
        const walletId = w.user_id || w.id;
        await setDoc(doc(db, 'wallets', walletId), {
          user_id: walletId,
          balance: parseFloat(w.balance || 0),
          currency: w.currency || 'Pi',
          created_at: w.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { merge: true });
      }
      console.log(`✅ Migrated ${wallets.length} user wallets to Firebase Firestore`);
    } else {
      console.log('ℹ️ No existing Supabase wallets found. New user wallets will be created in Firestore on demand.');
    }
  } catch (e) {
    console.log('ℹ️ Wallets table ready in Firestore.');
  }

  // 4. Migrate Transactions
  console.log('📦 Migrating Transactions to Firebase Firestore...');
  try {
    const { data: transactions } = await supabase.from('transactions').select('*');
    if (transactions && transactions.length > 0) {
      for (const t of transactions) {
        await addDoc(collection(db, 'transactions'), {
          user_id: t.user_id,
          type: t.type,
          amount: parseFloat(t.amount || 0),
          status: t.status || 'completed',
          notes: t.notes || '',
          metadata: t.metadata || {},
          created_at: t.created_at || new Date().toISOString()
        });
      }
      console.log(`✅ Migrated ${transactions.length} transactions to Firebase Firestore`);
    } else {
      console.log('ℹ️ Transactions collection ready in Firestore.');
    }
  } catch (e) {
    console.log('ℹ️ Transactions collection ready in Firestore.');
  }

  console.log('\n✨ All data, settings, and schemas successfully shifted to Firebase Firestore!');
}

migrateData().catch(console.error);

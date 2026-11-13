import fs from "fs";
import path from "path";
import { supabase } from "./supabaseClient.js";

const WALLETS_FILE = path.join(process.cwd(), "data", "wallets.json");
const TRANSACTIONS_FILE = path.join(process.cwd(), "data", "transactions.json");
const TMP_WALLETS_FILE = path.join("/tmp", "winxpro_wallets.json");
const TMP_TRANSACTIONS_FILE = path.join("/tmp", "winxpro_transactions.json");

// In-memory cache
let memoryWallets = {};
let memoryTransactions = [];
let memoryUserUuidMap = {};

// Helper to compute local session safeId (matching AuthContext setLocalSession)
export function computeSafeId(email) {
  if (!email) return "";
  return "user_" + Buffer.from(email.toLowerCase()).toString("base64").replace(/[^a-zA-Z0-9]/g, "").substring(0, 24);
}

// Known predefined UUID mapping
const KNOWN_USERS = {
  "abtandco18@gmail.com": "23b47415-9592-4a87-a5ef-3a537cc31b27",
  "abtandco18": "23b47415-9592-4a87-a5ef-3a537cc31b27",
  "user_YWJ0YW5kY28xOEBnbWFpbC5j": "23b47415-9592-4a87-a5ef-3a537cc31b27",
  "user_YWJ0YW5kY28xOGdtYWlsY29t": "23b47415-9592-4a87-a5ef-3a537cc31b27",
  "akhuwat.com.pk@gmail.com": "d3fd1e06-7a45-490a-8ce7-1a812e982b8d",
  "akhuwat": "d3fd1e06-7a45-490a-8ce7-1a812e982b8d",
  "ca7adc60-4f05-42fa-8029-6ebf04b84fa6": "ca7adc60-4f05-42fa-8029-6ebf04b84fa6",
  "jajsjsjsjssjjsjsjs@gmail.com": "ca7adc60-4f05-42fa-8029-6ebf04b84fa6",
  "akhuwatfoundation1@gmail.com": "7a90c640-010a-4dd0-bc38-fda2f4cfbfd1",
  "fabvisaconsultancy@gmail.com": "6b653721-01dd-4a1b-9fac-c179624227b6"
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function stripOperatorPrefix(str) {
  return String(str || "").trim().replace(/^c\d+_/, "");
}

export function registerPlayerUsername(username, userId = "", email = "") {
  const cleanU = stripOperatorPrefix(username).toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "");
  const cleanEmail = (email || "").toLowerCase().trim();
  const cleanId = stripOperatorPrefix(userId);
  const resolvedUuid = resolveUserUuid(cleanId, cleanEmail);

  if (cleanU) {
    if (resolvedUuid) memoryUserUuidMap[cleanU] = resolvedUuid;
    else if (cleanEmail) memoryUserUuidMap[cleanU] = cleanEmail;

    const w = getUserWallet(cleanEmail || cleanId || cleanU);
    if (w && w.balance !== undefined) {
      memoryWallets[cleanU] = w;
      memoryWallets['c1000273_' + cleanU] = w;
    }
  }
}

export function resolveUserUuid(userId, email = "") {
  const cleanEmail = (email || "").toLowerCase().trim();
  const cleanId = stripOperatorPrefix(userId);

  if (UUID_REGEX.test(cleanId)) return cleanId;
  if (cleanEmail && KNOWN_USERS[cleanEmail]) return KNOWN_USERS[cleanEmail];
  if (cleanId && KNOWN_USERS[cleanId]) return KNOWN_USERS[cleanId];
  if (cleanEmail && memoryUserUuidMap[cleanEmail]) return memoryUserUuidMap[cleanEmail];
  if (cleanId && memoryUserUuidMap[cleanId]) return memoryUserUuidMap[cleanId];

  // Check if cleanId is a safeId starting with 'user_'
  if (cleanId.startsWith("user_")) {
    for (const [em, uid] of Object.entries(memoryUserUuidMap)) {
      if (em.includes("@")) {
        const computed = computeSafeId(em);
        if (computed === cleanId || cleanId.startsWith(computed.substring(0, 16))) {
          memoryUserUuidMap[cleanId] = uid;
          return uid;
        }
      }
    }
    for (const [em, uid] of Object.entries(KNOWN_USERS)) {
      if (em.includes("@")) {
        const computed = computeSafeId(em);
        if (computed === cleanId || cleanId.startsWith(computed.substring(0, 16))) {
          memoryUserUuidMap[cleanId] = uid;
          return uid;
        }
      }
    }
  }

  // Check username prefix e.g. "abtandco18" from "abtandco18@gmail.com"
  const prefix = cleanEmail ? cleanEmail.split("@")[0] : (cleanId.includes("@") ? cleanId.split("@")[0] : cleanId);
  if (prefix && KNOWN_USERS[prefix]) return KNOWN_USERS[prefix];
  if (prefix && memoryUserUuidMap[prefix]) return memoryUserUuidMap[prefix];

  // Search memoryUserUuidMap for any email starting with cleanId prefix
  if (cleanId && !cleanId.includes("@")) {
    for (const [em, uid] of Object.entries(memoryUserUuidMap)) {
      if (em.includes("@") && em.toLowerCase().startsWith(cleanId.toLowerCase() + "@")) {
        memoryUserUuidMap[cleanId] = uid;
        return uid;
      }
    }
  }

  return null;
}

// Local cache load
function loadLocalData() {
  try {
    if (fs.existsSync(WALLETS_FILE)) {
      const loaded = JSON.parse(fs.readFileSync(WALLETS_FILE, "utf8"));
      // Clean up any zero-balance safeId override entries or stale operator prefixes
      for (const k of Object.keys(loaded)) {
        if ((k.startsWith("user_") || /^c\d+_/.test(k)) && loaded[k]?.balance === 0) {
          delete loaded[k];
        }
        if (/^c\d+_/.test(k)) {
          delete loaded[k];
        }
      }
      memoryWallets = { ...memoryWallets, ...loaded };
    } else if (fs.existsSync(TMP_WALLETS_FILE)) {
      memoryWallets = { ...memoryWallets, ...JSON.parse(fs.readFileSync(TMP_WALLETS_FILE, "utf8")) };
    }
  } catch (e) {}

  try {
    if (fs.existsSync(TRANSACTIONS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(TRANSACTIONS_FILE, "utf8"));
      if (Array.isArray(parsed)) memoryTransactions = parsed;
    } else if (fs.existsSync(TMP_TRANSACTIONS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(TMP_TRANSACTIONS_FILE, "utf8"));
      if (Array.isArray(parsed)) memoryTransactions = parsed;
    }
  } catch (e) {}
}

function persistLocalData() {
  try {
    const dir = path.dirname(WALLETS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(WALLETS_FILE, JSON.stringify(memoryWallets, null, 2), "utf8");
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(memoryTransactions, null, 2), "utf8");
  } catch (e) {
    try {
      fs.writeFileSync(TMP_WALLETS_FILE, JSON.stringify(memoryWallets, null, 2), "utf8");
      fs.writeFileSync(TMP_TRANSACTIONS_FILE, JSON.stringify(memoryTransactions, null, 2), "utf8");
    } catch (err) {}
  }
}

// Initial hydration from Supabase
let inFlightHydration = null;
let lastHydratedAt = 0;

export async function hydrateFromSupabase(force = false) {
  const now = Date.now();
  if (inFlightHydration) return inFlightHydration;
  // Shorter cache window (2s) to keep balances fresh
  if (!force && now - lastHydratedAt < 2000 && Object.keys(memoryWallets).length > 0) return;

  inFlightHydration = (async () => {
    try {
      // 1. Fetch all users from Supabase Auth
      const { data: uData } = await supabase.auth.admin.listUsers();
      if (uData && Array.isArray(uData.users)) {
        for (const u of uData.users) {
          if (u.id && u.email) {
            const email = u.email.toLowerCase();
            const prefix = email.split("@")[0];
            const safeId = computeSafeId(email);
            const safeId2 = "user_" + Buffer.from(email.replace(/[^a-zA-Z0-9]/g, "")).toString("base64").replace(/[^a-zA-Z0-9]/g, "").substring(0, 24);

            memoryUserUuidMap[email] = u.id;
            memoryUserUuidMap[prefix] = u.id;
            memoryUserUuidMap[safeId] = u.id;
            memoryUserUuidMap[safeId2] = u.id;
            memoryUserUuidMap[u.id] = u.id;
          }
        }
      }

      // 2. Fetch all wallets from Supabase
      const { data: wData } = await supabase.from("wallets").select("*");
      if (wData && Array.isArray(wData)) {
        for (const w of wData) {
          const uid = w.user_id;
          const email = Object.keys(memoryUserUuidMap).find(k => k.includes("@") && memoryUserUuidMap[k] === uid) || "";
          const walletObj = {
            id: uid,
            user_id: uid,
            email,
            balance: parseFloat(w.balance || 0),
            currency: "PKR",
            updated_at: w.updated_at || new Date().toISOString()
          };

          memoryWallets[uid] = walletObj;
          if (email) {
            memoryWallets[email] = walletObj;
            const prefix = email.split("@")[0];
            memoryWallets[prefix] = walletObj;
            const safeId = computeSafeId(email);
            const safeId2 = "user_" + Buffer.from(email.replace(/[^a-zA-Z0-9]/g, "")).toString("base64").replace(/[^a-zA-Z0-9]/g, "").substring(0, 24);
            memoryWallets[safeId] = walletObj;
            memoryWallets[safeId2] = walletObj;
          }
        }
      }

      // 3. Fetch recent transactions from Supabase
      const { data: tData } = await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(200);
      if (tData && Array.isArray(tData)) {
        const mergedMap = new Map();
        for (const t of tData) {
          const email = Object.keys(memoryUserUuidMap).find(k => k.includes("@") && memoryUserUuidMap[k] === t.user_id) || "";
          mergedMap.set(String(t.id), {
            id: t.id,
            user_id: t.user_id,
            email,
            type: t.type || "bet",
            amount: parseFloat(t.amount || 0),
            status: t.status || "completed",
            method: t.method || "",
            tx_id: t.tx_id || String(t.id),
            notes: t.notes || "",
            created_at: t.created_at
          });
        }

        for (const lt of memoryTransactions) {
          if (lt.id && !mergedMap.has(String(lt.id))) {
            mergedMap.set(String(lt.id), lt);
          }
        }

        memoryTransactions = Array.from(mergedMap.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      }

      lastHydratedAt = Date.now();
      persistLocalData();
    } catch (err) {
      console.error("Hydration from Supabase failed:", err.message);
    }
  })().finally(() => {
    inFlightHydration = null;
  });

  return inFlightHydration;
}

// Initial boot
loadLocalData();
hydrateFromSupabase().catch(() => {});

export function getAllWalletsList() {
  return Object.values(memoryWallets);
}

export function getUserWallet(userId, email = "") {
  let cleanEmail = (email || "").toLowerCase().trim();
  const cleanId = stripOperatorPrefix(userId);

  // If cleanEmail is empty, try to derive it from cleanId
  if (!cleanEmail) {
    if (cleanId.includes("@")) {
      cleanEmail = cleanId;
    } else if (memoryWallets[cleanId]?.email) {
      cleanEmail = memoryWallets[cleanId].email.toLowerCase().trim();
    }
  }

  let resolvedUuid = resolveUserUuid(cleanId, cleanEmail);

  // If resolved to a known user UUID, ALWAYS return the authoritative wallet
  if (resolvedUuid && memoryWallets[resolvedUuid]) {
    const w = memoryWallets[resolvedUuid];
    if (cleanEmail && !w.email) w.email = cleanEmail;
    if (cleanId) memoryWallets[cleanId] = w;
    if (cleanEmail) memoryWallets[cleanEmail] = w;
    return w;
  }

  if (cleanEmail && memoryWallets[cleanEmail]) {
    const w = memoryWallets[cleanEmail];
    if (cleanId) memoryWallets[cleanId] = w;
    return w;
  }

  // If guest player, ensure active trial balance
  if (cleanId === "guest_player" || cleanId.startsWith("guest_")) {
    if (!memoryWallets[cleanId] || memoryWallets[cleanId].balance < 500) {
      memoryWallets[cleanId] = {
        id: cleanId,
        user_id: cleanId,
        email: "guest@winxpro.com.pk",
        balance: 10000.0,
        currency: "PKR",
        isTrial: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      persistLocalData();
    }
    return memoryWallets[cleanId];
  }

  if (cleanId && memoryWallets[cleanId] && memoryWallets[cleanId].balance > 0) {
    return memoryWallets[cleanId];
  }

  // Fallback default
  const key = resolvedUuid || cleanId || cleanEmail || "anonymous";
  if (!memoryWallets[key]) {
    memoryWallets[key] = {
      id: key,
      user_id: key,
      email: cleanEmail,
      balance: 0,
      currency: "PKR",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (resolvedUuid && UUID_REGEX.test(resolvedUuid)) {
      supabase.from("wallets").upsert({
        user_id: resolvedUuid,
        balance: 0,
        currency: "PKR",
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id", ignoreDuplicates: true }).catch(() => {});
    }
    persistLocalData();
  }

  return memoryWallets[key];
}

// Real-time async wallet fetch from Supabase
export async function getLiveUserWallet(userId, email = "") {
  let cleanEmail = (email || "").toLowerCase().trim();
  const cleanId = stripOperatorPrefix(userId);

  // If cleanEmail is empty, try to derive it from cleanId or memoryWallets
  if (!cleanEmail) {
    if (cleanId.includes("@")) {
      cleanEmail = cleanId;
    } else if (memoryWallets[cleanId]?.email) {
      cleanEmail = memoryWallets[cleanId].email.toLowerCase().trim();
    } else if (cleanId.startsWith("user_")) {
      for (const [em, uid] of Object.entries(memoryUserUuidMap)) {
        if (em.includes("@")) {
          const computed = computeSafeId(em);
          if (computed === cleanId || cleanId.startsWith(computed.substring(0, 16))) {
            cleanEmail = em.toLowerCase();
            break;
          }
        }
      }
      if (!cleanEmail) {
        for (const [em, uid] of Object.entries(KNOWN_USERS)) {
          if (em.includes("@")) {
            const computed = computeSafeId(em);
            if (computed === cleanId || cleanId.startsWith(computed.substring(0, 16))) {
              cleanEmail = em.toLowerCase();
              break;
            }
          }
        }
      }
    } else {
      // Check if cleanId matches any username prefix e.g. "abtandco18"
      for (const em of Object.keys(memoryUserUuidMap)) {
        if (em.includes("@") && em.toLowerCase().startsWith(cleanId.toLowerCase() + "@")) {
          cleanEmail = em.toLowerCase();
          break;
        }
      }
    }
  }

  let resolvedUuid = resolveUserUuid(cleanId, cleanEmail);

  // If new user not in mapping yet, query/create in Supabase
  if (!resolvedUuid && cleanEmail) {
    try {
      const { data: uList } = await supabase.auth.admin.listUsers();
      const found = uList?.users?.find(u => u.email && u.email.toLowerCase() === cleanEmail);
      if (found) {
        resolvedUuid = found.id;
        memoryUserUuidMap[cleanEmail] = found.id;
      } else {
        const { data: createdUser } = await supabase.auth.admin.createUser({
          email: cleanEmail,
          password: "winxpro_player_" + Math.random().toString(36).substring(2, 10),
          email_confirm: true
        });
        if (createdUser?.user) {
          resolvedUuid = createdUser.user.id;
          memoryUserUuidMap[cleanEmail] = resolvedUuid;
        }
      }
    } catch (e) {}
  }

  if (resolvedUuid) {
    try {
      const { data: wRow } = await supabase.from("wallets").select("*").eq("user_id", resolvedUuid).maybeSingle();
      if (wRow) {
        const walletObj = {
          id: resolvedUuid,
          user_id: resolvedUuid,
          email: cleanEmail,
          balance: parseFloat(wRow.balance || 0),
          currency: "PKR",
          updated_at: wRow.updated_at || new Date().toISOString()
        };
        memoryWallets[resolvedUuid] = walletObj;
        if (cleanEmail) memoryWallets[cleanEmail] = walletObj;
        if (cleanId) memoryWallets[cleanId] = walletObj;
        persistLocalData();
        return walletObj;
      }
    } catch (e) {}
  }

  return getUserWallet(userId, cleanEmail);
}

export function creditUserBalance(userId, amount, email = "", notes = "") {
  const numAmount = parseFloat(amount) || 0;
  const cleanId = stripOperatorPrefix(userId);
  let cleanEmail = (email || "").toLowerCase().trim();
  if (numAmount <= 0) return getUserWallet(cleanId, cleanEmail);

  const wallet = getUserWallet(cleanId, cleanEmail);
  wallet.balance = parseFloat((wallet.balance + numAmount).toFixed(2));
  wallet.updated_at = new Date().toISOString();
  if (cleanEmail && !wallet.email) wallet.email = cleanEmail;

  const resolvedUuid = resolveUserUuid(cleanId, cleanEmail) || wallet.user_id;

  memoryWallets[wallet.user_id] = wallet;
  if (cleanId) {
    memoryWallets[cleanId] = wallet;
    memoryWallets['c1000273_' + cleanId] = wallet;
  }
  if (resolvedUuid && memoryWallets[resolvedUuid]) memoryWallets[resolvedUuid] = wallet;
  if (cleanEmail && memoryWallets[cleanEmail]) memoryWallets[cleanEmail] = wallet;

  persistLocalData();

  // Async commit to Supabase PostgreSQL (balance deduction / credit can never revert)
  if (resolvedUuid && UUID_REGEX.test(resolvedUuid)) {
    supabase.from("wallets").update({
      balance: wallet.balance,
      updated_at: new Date().toISOString()
    }).eq("user_id", resolvedUuid).then(({ error }) => {
      if (error) console.error("Supabase credit update error:", error.message);
    }).catch(() => {});
  }

  return wallet;
}

export function debitUserBalance(userId, amount, email = "") {
  const numAmount = parseFloat(amount) || 0;
  const cleanId = stripOperatorPrefix(userId);
  let cleanEmail = (email || "").toLowerCase().trim();
  const wallet = getUserWallet(cleanId, cleanEmail);

  if (wallet.balance < numAmount) {
    return { success: false, error: "Insufficient balance", wallet };
  }

  wallet.balance = parseFloat((wallet.balance - numAmount).toFixed(2));
  wallet.updated_at = new Date().toISOString();
  if (cleanEmail && !wallet.email) wallet.email = cleanEmail;

  const resolvedUuid = resolveUserUuid(cleanId, cleanEmail) || wallet.user_id;

  memoryWallets[wallet.user_id] = wallet;
  if (cleanId) {
    memoryWallets[cleanId] = wallet;
    memoryWallets['c1000273_' + cleanId] = wallet;
  }
  if (resolvedUuid && memoryWallets[resolvedUuid]) memoryWallets[resolvedUuid] = wallet;
  if (cleanEmail && memoryWallets[cleanEmail]) memoryWallets[cleanEmail] = wallet;

  persistLocalData();

  // CRITICAL: Synchronously commit debit to Supabase so it cannot revert on serverless cold start
  if (resolvedUuid && UUID_REGEX.test(resolvedUuid)) {
    supabase.from("wallets").update({
      balance: wallet.balance,
      updated_at: new Date().toISOString()
    }).eq("user_id", resolvedUuid).then(({ error }) => {
      if (error) {
        console.error("Supabase debit update error:", error.message);
        lastHydratedAt = 0;
      }
    }).catch(() => { lastHydratedAt = 0; });
  }

  return { success: true, wallet };
}

// Atomic debit - reads LIVE balance from Supabase before deducting
export async function atomicDebitBalance(userId, amount, email = "") {
  const numAmount = parseFloat(amount) || 0;
  if (numAmount <= 0) return { success: false, error: "Invalid amount" };

  let cleanEmail = (email || "").toLowerCase().trim();
  const cleanId = stripOperatorPrefix(userId);

  // If email not provided, derive it
  if (!cleanEmail) {
    if (cleanId.includes("@")) {
      cleanEmail = cleanId;
    } else if (memoryWallets[cleanId]?.email) {
      cleanEmail = memoryWallets[cleanId].email.toLowerCase().trim();
    }
  }

  const resolvedUuid = resolveUserUuid(cleanId, cleanEmail);

  if (resolvedUuid && UUID_REGEX.test(resolvedUuid)) {
    try {
      // 1. Read live balance from Supabase
      const { data: liveWallet, error: readErr } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", resolvedUuid)
        .maybeSingle();

      if (readErr) throw new Error(readErr.message);

      const liveBalance = parseFloat(liveWallet?.balance || 0);
      if (liveBalance < numAmount) {
        const w = getUserWallet(userId, email);
        w.balance = liveBalance;
        return { success: false, error: `Insufficient balance. Live balance: Rs ${liveBalance.toFixed(2)}`, wallet: w };
      }

      const newBalance = parseFloat((liveBalance - numAmount).toFixed(2));

      // 2. Update in Supabase
      const { error: updateErr } = await supabase
        .from("wallets")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("user_id", resolvedUuid);

      if (updateErr) throw new Error(updateErr.message);

      // 3. Update in-memory cache
      const wallet = getUserWallet(userId, email);
      wallet.balance = newBalance;
      wallet.updated_at = new Date().toISOString();
      memoryWallets[resolvedUuid] = wallet;
      if (cleanEmail) memoryWallets[cleanEmail] = wallet;
      if (cleanId) memoryWallets[cleanId] = wallet;
      persistLocalData();

      return { success: true, wallet };
    } catch (err) {
      console.error("[atomicDebit] Error:", err.message);
      return debitUserBalance(userId, amount, email);
    }
  }

  return debitUserBalance(userId, amount, email);
}

export function recordTransactionRecord(txData) {
  const id = txData.id || "tx-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 6);
  const cleanEmail = (txData.email || "").toLowerCase().trim();
  const resolvedUuid = resolveUserUuid(txData.user_id, cleanEmail);

  const record = {
    id,
    user_id: resolvedUuid || txData.user_id || "anonymous",
    email: cleanEmail,
    type: txData.type || "deposit",
    amount: parseFloat(txData.amount) || 0,
    status: txData.status || "completed",
    method: txData.method || "DirectPay",
    tx_id: txData.tx_id || id,
    notes: txData.notes || txData.description || "",
    screenshot_url: txData.screenshot_url || txData.metadata?.screenshot_url || "",
    metadata: txData.metadata || {},
    created_at: txData.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const existingIdx = memoryTransactions.findIndex(t => 
    (t.id && String(t.id) === String(id)) || 
    (t.tx_id && txData.tx_id && String(t.tx_id) === String(txData.tx_id))
  );

  if (existingIdx >= 0) {
    memoryTransactions[existingIdx] = { ...memoryTransactions[existingIdx], ...record };
  } else {
    memoryTransactions.unshift(record);
  }

  persistLocalData();

  // Commit permanently to Supabase transactions table
  if (resolvedUuid && UUID_REGEX.test(resolvedUuid)) {
    supabase.from("transactions").insert({
      user_id: resolvedUuid,
      type: record.type,
      amount: record.amount,
      status: record.status,
      method: record.method,
      tx_id: record.tx_id,
      notes: record.notes,
      created_at: record.created_at
    }).then(({ error }) => {
      if (error) console.error("Supabase insert transaction error:", error.message);
    }).catch(() => {});
  }

  return record;
}

export function updateTransactionStatus(txId, status, notes = "") {
  const tx = memoryTransactions.find(t => String(t.id) === String(txId) || String(t.tx_id) === String(txId));
  if (tx) {
    tx.status = status;
    if (notes) tx.notes = notes;
    tx.updated_at = new Date().toISOString();
    persistLocalData();

    if (tx.user_id && UUID_REGEX.test(tx.user_id)) {
      supabase.from("transactions").update({
        status,
        notes: tx.notes,
        updated_at: tx.updated_at
      }).eq("id", tx.id).catch(() => {});
    }
  }
  return tx;
}

export function getUserTransactionsList(userId, email = "") {
  const cleanEmail = (email || "").toLowerCase().trim();
  const cleanId = String(userId || "").trim();
  const resolvedUuid = resolveUserUuid(cleanId, cleanEmail);

  return memoryTransactions.filter(t => {
    if (resolvedUuid && t.user_id === resolvedUuid) return true;
    if (cleanEmail && t.email && t.email.toLowerCase() === cleanEmail) return true;
    if (cleanId && (t.user_id === cleanId || String(t.user_id) === cleanId)) return true;
    return false;
  });
}

export async function getLiveUserTransactions(userId, email = "") {
  const cleanEmail = (email || "").toLowerCase().trim();
  const cleanId = String(userId || "").trim();
  const resolvedUuid = resolveUserUuid(cleanId, cleanEmail);

  if (resolvedUuid && UUID_REGEX.test(resolvedUuid)) {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", resolvedUuid)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!error && Array.isArray(data)) {
        return data.map(t => ({
          id: t.id,
          user_id: t.user_id,
          email: cleanEmail,
          type: t.type,
          amount: parseFloat(t.amount || 0),
          status: t.status,
          method: t.method || "DirectPay",
          tx_id: t.tx_id || String(t.id),
          notes: t.notes || "",
          created_at: t.created_at
        }));
      }
    } catch (e) {}
  }

  return getUserTransactionsList(userId, email);
}

export function getDirectPayTransactionsList() {
  return memoryTransactions.filter(t => {
    if (t.method && t.method.toLowerCase().includes("directpay")) return true;
    if (t.metadata?.gateway === "DirectPay") return true;
    if (t.tx_id && String(t.tx_id).toUpperCase().startsWith("TXN-")) return true;
    if (t.id && String(t.id).toLowerCase().includes("directpay")) return true;
    if (t.notes && String(t.notes).toLowerCase().includes("directpay")) return true;
    return false;
  }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

export function findTransaction(txnId) {
  if (!txnId) return null;
  const cleanId = String(txnId).trim();
  const lowerId = cleanId.toLowerCase();

  return memoryTransactions.find(t => {
    if (t.tx_id && String(t.tx_id).trim() === cleanId) return true;
    if (t.id && String(t.id).trim() === cleanId) return true;
    if (t.metadata?.clientTransactionId && String(t.metadata.clientTransactionId).trim() === cleanId) return true;
    if (t.notes && String(t.notes).toLowerCase().includes(lowerId)) return true;
    return false;
  }) || null;
}

export function completeAndCreditTransaction(txnId, fallbackData = {}) {
  let tx = findTransaction(txnId);
  let amount = 0;
  if (tx && typeof tx.amount === "number" && tx.amount > 0) {
    amount = tx.amount;
  } else if (fallbackData.amountInPKR && parseFloat(fallbackData.amountInPKR) > 0) {
    amount = parseFloat(fallbackData.amountInPKR);
  } else if (fallbackData.amount) {
    const rawVal = parseFloat(fallbackData.amount) || 0;
    if (rawVal >= 1000 && rawVal % 100 === 0 && !fallbackData.isExactPKR) {
      amount = rawVal / 100;
    } else {
      amount = rawVal;
    }
  }

  const userId = fallbackData.user_id || (tx ? tx.user_id : "anonymous");
  const email = fallbackData.email || (tx ? tx.email : "");

  if (!tx) {
    tx = recordTransactionRecord({
      id: "tx-" + Date.now().toString(36),
      user_id: userId,
      email,
      type: "deposit",
      amount,
      status: "completed",
      method: fallbackData.method || "DirectPay",
      tx_id: txnId,
      notes: fallbackData.notes || `Payment Verified: ${amount.toFixed(2)}`,
      metadata: fallbackData.metadata || { clientTransactionId: txnId }
    });
  } else {
    tx.status = "completed";
    tx.updated_at = new Date().toISOString();
    tx.amount = amount;
    persistLocalData();
  }

  const creditedWallet = creditUserBalance(userId, tx.amount, email, `Payment completed: ${txnId}`);
  return { success: true, transaction: tx, wallet: creditedWallet };
}

export function failTransaction(txnId, failureReason = "Payment cancelled or failed") {
  let tx = findTransaction(txnId);
  if (tx) {
    tx.status = "failed";
    tx.updated_at = new Date().toISOString();
    tx.notes = (tx.notes ? tx.notes + " | " : "") + `Failed: ${failureReason}`;
    if (!tx.metadata) tx.metadata = {};
    tx.metadata.failure_reason = failureReason;
    persistLocalData();
    return { success: true, transaction: tx };
  }
  return { success: false, error: "Transaction not found" };
}

export function getReferralStatsForUser(userId, email = "") {
  const cleanEmail = (email || "").toLowerCase().trim();
  const userTxs = getUserTransactionsList(userId, cleanEmail);
  const refTxs = userTxs.filter(t => 
    t.status === "completed" && 
    (t.notes?.includes("Referral Reward: Invited") || t.method === "Referral Bonus")
  );

  const totalEarnings = refTxs.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const invitedList = refTxs.map(t => {
    const friend = t.notes.replace("Referral Reward: Invited ", "").trim() || "Player";
    return {
      id: t.id,
      email: friend,
      amount: parseFloat(t.amount) || 155.55,
      date: t.created_at || new Date().toISOString()
    };
  });

  return {
    totalInvited: invitedList.length,
    totalEarnings: parseFloat(totalEarnings.toFixed(2)),
    referrals: invitedList
  };
}

export function getAllTransactionsList() {
  return memoryTransactions;
}

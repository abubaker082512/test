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

// Known predefined UUID mapping
const KNOWN_USERS = {
  "abtandco18@gmail.com": "23b47415-9592-4a87-a5ef-3a537cc31b27",
  "abtandco18": "23b47415-9592-4a87-a5ef-3a537cc31b27",
  "akhuwat.com.pk@gmail.com": "d3fd1e06-7a45-490a-8ce7-1a812e982b8d",
  "akhuwat": "d3fd1e06-7a45-490a-8ce7-1a812e982b8d",
  "ca7adc60-4f05-42fa-8029-6ebf04b84fa6": "ca7adc60-4f05-42fa-8029-6ebf04b84fa6",
  "jajsjsjsjssjjsjsjs@gmail.com": "ca7adc60-4f05-42fa-8029-6ebf04b84fa6",
  "akhuwatfoundation1@gmail.com": "7a90c640-010a-4dd0-bc38-fda2f4cfbfd1",
  "fabvisaconsultancy@gmail.com": "6b653721-01dd-4a1b-9fac-c179624227b6"
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function resolveUserUuid(userId, email = "") {
  const cleanEmail = (email || "").toLowerCase().trim();
  const cleanId = String(userId || "").trim();

  if (UUID_REGEX.test(cleanId)) return cleanId;
  if (cleanEmail && KNOWN_USERS[cleanEmail]) return KNOWN_USERS[cleanEmail];
  if (cleanId && KNOWN_USERS[cleanId]) return KNOWN_USERS[cleanId];
  if (cleanEmail && memoryUserUuidMap[cleanEmail]) return memoryUserUuidMap[cleanEmail];
  if (cleanId && memoryUserUuidMap[cleanId]) return memoryUserUuidMap[cleanId];

  // Check username prefix e.g. "abtandco18" from "abtandco18@gmail.com"
  const prefix = cleanEmail ? cleanEmail.split("@")[0] : (cleanId.includes("@") ? cleanId.split("@")[0] : cleanId);
  if (prefix && KNOWN_USERS[prefix]) return KNOWN_USERS[prefix];
  if (prefix && memoryUserUuidMap[prefix]) return memoryUserUuidMap[prefix];

  return null;
}

// Local cache load
function loadLocalData() {
  try {
    if (fs.existsSync(WALLETS_FILE)) {
      memoryWallets = { ...memoryWallets, ...JSON.parse(fs.readFileSync(WALLETS_FILE, "utf8")) };
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
  if (!force && now - lastHydratedAt < 5000 && Object.keys(memoryWallets).length > 0) return;

  inFlightHydration = (async () => {
    try {
      // 1. Fetch all users from Supabase Auth
      const { data: uData } = await supabase.auth.admin.listUsers();
      if (uData && Array.isArray(uData.users)) {
        for (const u of uData.users) {
          if (u.id && u.email) {
            const email = u.email.toLowerCase();
            const prefix = email.split("@")[0];
            memoryUserUuidMap[email] = u.id;
            memoryUserUuidMap[prefix] = u.id;
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

export function getWalletsMap() {
  return memoryWallets;
}

export function getAllWalletsList() {
  return Object.values(memoryWallets);
}

export function getUserWallet(userId, email = "") {
  const cleanEmail = (email || "").toLowerCase().trim();
  const cleanId = String(userId || "").trim();
  const resolvedUuid = resolveUserUuid(cleanId, cleanEmail);

  if (resolvedUuid && memoryWallets[resolvedUuid]) {
    const w = memoryWallets[resolvedUuid];
    if (cleanEmail && !w.email) w.email = cleanEmail;
    return w;
  }

  if (cleanEmail && memoryWallets[cleanEmail]) {
    return memoryWallets[cleanEmail];
  }

  if (cleanId && memoryWallets[cleanId]) {
    return memoryWallets[cleanId];
  }

  // Fallback default
  const key = resolvedUuid || cleanId || cleanEmail || "anonymous";
  if (!memoryWallets[key]) {
    memoryWallets[key] = {
      id: key,
      user_id: key,
      email: cleanEmail,
      balance: 100.0,
      currency: "PKR",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    persistLocalData();
  }

  return memoryWallets[key];
}

// Real-time async wallet fetch from Supabase
export async function getLiveUserWallet(userId, email = "") {
  const cleanEmail = (email || "").toLowerCase().trim();
  const cleanId = String(userId || "").trim();
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
        persistLocalData();
        return walletObj;
      }
    } catch (e) {}
  }

  return getUserWallet(userId, email);
}

export function creditUserBalance(userId, amount, email = "", notes = "") {
  const numAmount = parseFloat(amount) || 0;
  if (numAmount <= 0) return getUserWallet(userId, email);

  const wallet = getUserWallet(userId, email);
  wallet.balance = parseFloat((wallet.balance + numAmount).toFixed(2));
  wallet.updated_at = new Date().toISOString();
  if (email && !wallet.email) wallet.email = email.toLowerCase().trim();

  const resolvedUuid = resolveUserUuid(userId, email) || wallet.user_id;

  memoryWallets[wallet.user_id] = wallet;
  if (resolvedUuid && memoryWallets[resolvedUuid]) memoryWallets[resolvedUuid] = wallet;
  if (email && memoryWallets[email.toLowerCase()]) memoryWallets[email.toLowerCase()] = wallet;

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
  const wallet = getUserWallet(userId, email);

  if (wallet.balance < numAmount) {
    return { success: false, error: "Insufficient balance", wallet };
  }

  wallet.balance = parseFloat((wallet.balance - numAmount).toFixed(2));
  wallet.updated_at = new Date().toISOString();
  if (email && !wallet.email) wallet.email = email.toLowerCase().trim();

  const resolvedUuid = resolveUserUuid(userId, email) || wallet.user_id;

  memoryWallets[wallet.user_id] = wallet;
  if (resolvedUuid && memoryWallets[resolvedUuid]) memoryWallets[resolvedUuid] = wallet;
  if (email && memoryWallets[email.toLowerCase()]) memoryWallets[email.toLowerCase()] = wallet;

  persistLocalData();

  // Async commit to Supabase PostgreSQL (balance deduction is permanent)
  if (resolvedUuid && UUID_REGEX.test(resolvedUuid)) {
    supabase.from("wallets").update({
      balance: wallet.balance,
      updated_at: new Date().toISOString()
    }).eq("user_id", resolvedUuid).then(({ error }) => {
      if (error) console.error("Supabase debit update error:", error.message);
    }).catch(() => {});
  }

  return { success: true, wallet };
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
      method: record.method || null,
      tx_id: String(record.tx_id || ""),
      notes: record.notes || null,
      created_at: record.created_at
    }).then(({ error }) => {
      if (error) console.error("Supabase transaction insert error:", error.message);
    }).catch(() => {});
  }

  return record;
}

export function getAllTransactionsList() {
  return memoryTransactions.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

export function getUserTransactionsList(userId, email = "") {
  const cleanEmail = (email || "").toLowerCase().trim();
  const cleanId = String(userId || "").trim();
  const resolvedUuid = resolveUserUuid(cleanId, cleanEmail);

  return memoryTransactions.filter(t => {
    if (resolvedUuid && t.user_id === resolvedUuid) return true;
    if (cleanId && t.user_id === cleanId) return true;
    if (cleanEmail && t.email && t.email.toLowerCase() === cleanEmail) return true;
    return false;
  }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

export async function getLiveUserTransactions(userId, email = "") {
  const cleanEmail = (email || "").toLowerCase().trim();
  const cleanId = String(userId || "").trim();
  const resolvedUuid = resolveUserUuid(cleanId, cleanEmail);

  if (resolvedUuid && UUID_REGEX.test(resolvedUuid)) {
    try {
      const { data: dbTxs } = await supabase.from("transactions").select("*").eq("user_id", resolvedUuid).order("created_at", { ascending: false }).limit(100);
      if (dbTxs && Array.isArray(dbTxs) && dbTxs.length > 0) {
        return dbTxs.map(t => ({
          id: t.id,
          user_id: t.user_id,
          email: cleanEmail,
          type: t.type,
          amount: parseFloat(t.amount || 0),
          status: t.status,
          method: t.method,
          tx_id: t.tx_id,
          notes: t.notes,
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

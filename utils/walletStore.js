import fs from "fs";
import path from "path";

const WALLETS_FILE = path.join(process.cwd(), "data", "wallets.json");
const TRANSACTIONS_FILE = path.join(process.cwd(), "data", "transactions.json");

const TMP_WALLETS_FILE = path.join("/tmp", "winxpro_wallets.json");
const TMP_TRANSACTIONS_FILE = path.join("/tmp", "winxpro_transactions.json");

// In-memory cache
let memoryWallets = {};
let memoryTransactions = [];

function loadData() {
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

function persistData() {
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

// Initial load
loadData();

export function getWalletsMap() {
  loadData();
  return memoryWallets;
}

export function getAllWalletsList() {
  loadData();
  return Object.values(memoryWallets);
}

export function getUserWallet(userId, email = "") {
  loadData();
  if (!userId && !email) return { user_id: "anonymous", balance: 0.0, currency: "Pi" };

  const cleanEmail = (email || "").toLowerCase().trim();

  // 1. Direct match by user_id key
  if (userId && memoryWallets[userId]) {
    if (cleanEmail && !memoryWallets[userId].email) {
      memoryWallets[userId].email = cleanEmail;
      persistData();
    }
    return memoryWallets[userId];
  }

  // 2. Search by email match
  if (cleanEmail) {
    const found = Object.values(memoryWallets).find(w => w.email && w.email.toLowerCase() === cleanEmail);
    if (found) {
      // If user provided a specific userId, bind it so both resolve together
      if (userId && found.user_id !== userId) {
        memoryWallets[userId] = found;
      }
      return found;
    }
  }

  // 3. Known predefined user mappings
  const KNOWN_USERS = {
    "abtandco18@gmail.com": "23b47415-5592-4a87-a5ef-3a537cc31b27",
    "akhuwat.com.pk@gmail.com": "d3fd1e06-7d45-498a-8ce7-1a812e962b3d",
    "jajsjsjsjssjjsjsjs@gmail.com": "ca7adc60-4f05-42f2-8025-6ebf04b84fa6",
    "akhuwatfoundation1@gmail.com": "7a90c640-010a-4dd0-bc38-fda2f4cfbfd1",
    "fabvisaconsultancy@gmail.com": "6b653721-01dd-4a1b-9fac-c179624227b6"
  };

  if (cleanEmail && KNOWN_USERS[cleanEmail] && memoryWallets[KNOWN_USERS[cleanEmail]]) {
    const w = memoryWallets[KNOWN_USERS[cleanEmail]];
    w.email = cleanEmail;
    if (userId) memoryWallets[userId] = w;
    persistData();
    return w;
  }

  const key = userId || (cleanEmail ? "user_" + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, "").substring(0, 24) : "anonymous");

  if (!memoryWallets[key]) {
    memoryWallets[key] = {
      id: key,
      user_id: key,
      email: cleanEmail,
      balance: 100.0, // Rs 100 welcome starting bonus
      currency: "PKR",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    persistData();
  }

  return memoryWallets[key];
}

export function creditUserBalance(userId, amount, email = "", notes = "") {
  loadData();
  const numAmount = parseFloat(amount) || 0;
  if (numAmount <= 0) return getUserWallet(userId, email);

  const wallet = getUserWallet(userId, email);
  wallet.balance = parseFloat((wallet.balance + numAmount).toFixed(2));
  wallet.updated_at = new Date().toISOString();
  if (email && !wallet.email) wallet.email = email.toLowerCase().trim();

  memoryWallets[wallet.user_id] = wallet;
  persistData();
  return wallet;
}

export function debitUserBalance(userId, amount) {
  loadData();
  const numAmount = parseFloat(amount) || 0;
  const wallet = getUserWallet(userId);
  if (wallet.balance < numAmount) return { success: false, error: "Insufficient balance", wallet };

  wallet.balance = parseFloat((wallet.balance - numAmount).toFixed(2));
  wallet.updated_at = new Date().toISOString();
  memoryWallets[wallet.user_id] = wallet;
  persistData();
  return { success: true, wallet };
}

export function recordTransactionRecord(txData) {
  loadData();
  const id = txData.id || "tx-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 6);
  const existingIdx = memoryTransactions.findIndex(t => 
    (t.id && t.id === id) || 
    (t.tx_id && txData.tx_id && t.tx_id === txData.tx_id) ||
    (t.metadata?.clientTransactionId && txData.metadata?.clientTransactionId && t.metadata.clientTransactionId === txData.metadata.clientTransactionId)
  );

  const record = {
    id,
    user_id: txData.user_id || "anonymous",
    email: (txData.email || "").toLowerCase().trim(),
    type: txData.type || "deposit",
    amount: parseFloat(txData.amount) || 0,
    status: txData.status || "pending",
    method: txData.method || "DirectPay",
    tx_id: txData.tx_id || id,
    notes: txData.notes || "",
    metadata: txData.metadata || {},
    created_at: txData.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    memoryTransactions[existingIdx] = { ...memoryTransactions[existingIdx], ...record };
  } else {
    memoryTransactions.unshift(record);
  }

  persistData();
  return record;
}

export function getAllTransactionsList() {
  loadData();
  return memoryTransactions.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

export function getUserTransactionsList(userId, email = "") {
  loadData();
  const cleanEmail = (email || "").toLowerCase().trim();
  return memoryTransactions.filter(t => {
    if (userId && t.user_id === userId) return true;
    if (cleanEmail && t.email && t.email.toLowerCase() === cleanEmail) return true;
    if (cleanEmail && t.user_id === cleanEmail) return true;
    return false;
  }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

export function findTransaction(txnId) {
  loadData();
  if (!txnId) return null;
  return memoryTransactions.find(t => 
    t.tx_id === txnId || 
    t.id === txnId || 
    t.metadata?.clientTransactionId === txnId
  ) || null;
}

export function completeAndCreditTransaction(txnId, fallbackData = {}) {
  loadData();
  let tx = findTransaction(txnId);

  // CRITICAL FIX: Prioritize original tx.amount in PKR saved at initiation time (1 PKR = 1 Balance Unit)
  let amount = 0;
  if (tx && typeof tx.amount === 'number' && tx.amount > 0) {
    amount = tx.amount;
  } else if (fallbackData.amountInPKR && parseFloat(fallbackData.amountInPKR) > 0) {
    amount = parseFloat(fallbackData.amountInPKR);
  } else if (fallbackData.amount) {
    const rawVal = parseFloat(fallbackData.amount) || 0;
    // Normalize Paisa amount if rawVal is >= 1000 and is integer 100x multiplier from payment gateway
    if (rawVal >= 1000 && rawVal % 100 === 0 && !fallbackData.isExactPKR) {
      amount = rawVal / 100;
    } else {
      amount = rawVal;
    }
  }

  const userId = fallbackData.user_id || (tx ? tx.user_id : "anonymous");
  const email = fallbackData.email || (tx ? tx.email : "");

  if (!tx) {
    // Create completed transaction if not yet registered
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
    persistData();
  }

  // Credit balance immediately (1 PKR = 1 Balance unit)
  const creditedWallet = creditUserBalance(userId, tx.amount, email, `Payment completed: ${txnId}`);

  return { success: true, transaction: tx, wallet: creditedWallet };
}

export function failTransaction(txnId, failureReason = "Payment cancelled or failed") {
  loadData();
  let tx = findTransaction(txnId);
  if (tx) {
    tx.status = "failed";
    tx.updated_at = new Date().toISOString();
    tx.notes = (tx.notes ? tx.notes + " | " : "") + `Failed: ${failureReason}`;
    if (!tx.metadata) tx.metadata = {};
    tx.metadata.failure_reason = failureReason;
    persistData();
    return { success: true, transaction: tx };
  }
  return { success: false, error: "Transaction not found" };
}

export function getReferralStatsForUser(userId, email = "") {
  loadData();
  const cleanEmail = (email || "").toLowerCase().trim();
  const userTxs = getUserTransactionsList(userId, cleanEmail);
  const refTxs = userTxs.filter(t => 
    t.status === 'completed' && 
    (t.notes?.includes('Referral Reward: Invited') || t.method === 'Referral Bonus')
  );

  const totalEarnings = refTxs.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const invitedList = refTxs.map(t => {
    const friend = t.notes.replace('Referral Reward: Invited ', '').trim() || 'Player';
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



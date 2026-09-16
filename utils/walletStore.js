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

  const key = userId || (email ? "user_" + btoa(email.toLowerCase()).replace(/[^a-zA-Z0-9]/g, "").substring(0, 24) : "anonymous");

  if (!memoryWallets[key]) {
    // Also search by email if key not direct match
    if (email) {
      const found = Object.values(memoryWallets).find(w => w.email && w.email.toLowerCase() === email.toLowerCase());
      if (found) return found;
    }

    memoryWallets[key] = {
      id: key,
      user_id: key,
      email: email || "",
      balance: 1000.0, // Default starting welcome balance
      currency: "Pi",
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
  if (email && !wallet.email) wallet.email = email;

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
    email: txData.email || "",
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

  const amount = parseFloat(fallbackData.amount || (tx ? tx.amount : 0)) || 0;
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
      notes: fallbackData.notes || `DirectPay Payment Verified: Pi ${amount.toFixed(2)}`,
      metadata: fallbackData.metadata || { clientTransactionId: txnId }
    });
  } else {
    tx.status = "completed";
    tx.updated_at = new Date().toISOString();
    if (amount > 0 && tx.amount <= 0) tx.amount = amount;
    persistData();
  }

  // Credit balance immediately
  const creditedWallet = creditUserBalance(userId, tx.amount || amount, email, `Payment completed: ${txnId}`);

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


import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const TRANSACTIONS_KEY = "eycms_transactions";

const defaultTransactions = [];

function initTransactions() {
  const stored = localStorage.getItem(TRANSACTIONS_KEY);
  if (stored && stored.includes("TXN-001")) {
    localStorage.removeItem(TRANSACTIONS_KEY);
    return defaultTransactions;
  }
  if (!stored) {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(defaultTransactions));
    return defaultTransactions;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(defaultTransactions));
    return defaultTransactions;
  }
}

export const transactionService = {
  async getBackendTransactions() {
    try {
      const response = await api.get("/user/transactions");
      const resData = response?.data?.data ?? response?.data;
      return Array.isArray(resData) ? resData : [];
    } catch (err) {
      console.error("Error fetching transactions:", err);
      return [];
    }
  },
  getTransactions() {
    return initTransactions();
  },

  getTransactionById(id) {
    const list = this.getTransactions();
    return list.find(t => t.id === id) || null;
  },

  createTransaction(data, creatorName = "Admin", creatorRole = "ADMIN") {
    const list = this.getTransactions();
    const prefix = "TXN";
    // Find next ID
    const nextNum = list.reduce((max, t) => {
      const parts = t.id.split("-");
      const num = parts.length > 1 ? parseInt(parts[1]) : parseInt(t.id.replace(prefix, ""));
      return !isNaN(num) && num > max ? num : max;
    }, 0) + 1;

    const newId = `${prefix}-${String(nextNum).padStart(3, "0")}`;
    const nowStr = new Date().toISOString();

    const newTxn = {
      id: newId,
      amount: Number(data.amount),
      budgetHead: data.budgetHead,
      description: data.description,
      createdBy: creatorName,
      creatorRole: creatorRole,
      transactionType: creatorRole === "ADMIN" ? "ADMIN_CREATED" : "USER_REQUEST",
      status: "DRAFT",
      createdAt: nowStr,
      updatedAt: nowStr,
      uploadedBills: data.uploadedBills || ["simulated_receipt.pdf"],
      auditTrail: [
        {
          timestamp: nowStr,
          action: "Created",
          user: creatorName,
          role: creatorRole,
          remarks: data.description || "Created transaction"
        }
      ]
    };

    list.push(newTxn);
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(list));
    return newTxn;
  },

  updateTransaction(id, updates) {
    const list = this.getTransactions();
    const idx = list.findIndex(t => t.id === id);
    if (idx === -1) return null;

    const updated = {
      ...list[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    list[idx] = updated;
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(list));
    return updated;
  },

  verifyTransaction(id, verifier, remarks) {
    const nowStr = new Date().toISOString();
    const txn = this.getTransactionById(id);
    if (!txn) return null;

    const auditTrail = [
      ...(txn.auditTrail || []),
      { timestamp: nowStr, action: "Verified", user: verifier, role: "ACCOUNTS", remarks }
    ];

    return this.updateTransaction(id, {
      status: "FINANCE_VERIFIED",
      verifiedBy: verifier,
      verifiedAt: nowStr,
      financeRemarks: remarks,
      auditTrail
    });
  },

  approveTransaction(id, approver, remarks) {
    const nowStr = new Date().toISOString();
    const txn = this.getTransactionById(id);
    if (!txn) return null;

    const auditTrail = [
      ...(txn.auditTrail || []),
      { timestamp: nowStr, action: "Approved", user: approver, role: "ADMIN", remarks }
    ];

    return this.updateTransaction(id, {
      status: "ADMIN_APPROVED",
      approvedBy: approver,
      adminRemarks: remarks,
      auditTrail
    });
  },

  rejectTransaction(id, rejector, remarks) {
    const nowStr = new Date().toISOString();
    const txn = this.getTransactionById(id);
    if (!txn) return null;

    const auditTrail = [
      ...(txn.auditTrail || []),
      { timestamp: nowStr, action: "Rejected", user: rejector, role: "ADMIN", remarks }
    ];

    return this.updateTransaction(id, {
      status: "REJECTED",
      adminRemarks: remarks,
      auditTrail
    });
  },

  requestRevision(id, requester, remarks, requesterRole = "ADMIN") {
    const nowStr = new Date().toISOString();
    const txn = this.getTransactionById(id);
    if (!txn) return null;

    const auditTrail = [
      ...(txn.auditTrail || []),
      { timestamp: nowStr, action: "Revision Requested", user: requester, role: requesterRole, remarks }
    ];

    return this.updateTransaction(id, {
      status: "REVISION_REQUESTED",
      financeRemarks: requesterRole === "ACCOUNTS" ? remarks : txn.financeRemarks,
      adminRemarks: requesterRole === "ADMIN" ? remarks : txn.adminRemarks,
      auditTrail
    });
  }
};

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

function extractResponseData(response) {
  return response?.data?.data ?? response?.data ?? null;
}

function getFilenameFromDisposition(disposition) {
  if (!disposition) return null;
  const match = disposition.match(/filename="?([^"]+)"?/i);
  return match?.[1] || null;
}

export const reconciliationService = {
  async getWorkspace(filters = {}) {
    const params = {};
    if (filters.period_name && filters.period_name !== "ALL") params.period_name = filters.period_name;
    if (filters.match_status && filters.match_status !== "ALL") params.match_status = filters.match_status;
    if (filters.search) params.search = filters.search;

    const response = await api.get("/admin/reconciliation", { params });
    return extractResponseData(response) || { summary: {}, bank_transactions: [], periods: [] };
  },

  async getSummary(period_name = null) {
    const params = period_name && period_name !== "ALL" ? { period_name } : {};
    const response = await api.get("/admin/reconciliation/summary", { params });
    return extractResponseData(response);
  },

  async stageImportBankStatement(file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/admin/reconciliation/import/stage", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return extractResponseData(response);
  },

  async confirmImportBankStatement(stage_token, period_name = null) {
    const response = await api.post("/admin/reconciliation/import/confirm", {
      stage_token,
      period_name,
    });
    return extractResponseData(response);
  },

  async autoMatch(period_name = null) {
    const response = await api.post("/admin/reconciliation/auto-match", {
      period_name: period_name === "ALL" ? null : period_name,
    });
    return extractResponseData(response);
  },

  async manualMatch(bank_transaction_id, transaction_id, notes = "") {
    const response = await api.post("/admin/reconciliation/match", {
      bank_transaction_id,
      transaction_id,
      notes,
    });
    return extractResponseData(response);
  },

  async unmatch(bank_transaction_id, notes = "") {
    const response = await api.post("/admin/reconciliation/unmatch", {
      bank_transaction_id,
      notes,
    });
    return extractResponseData(response);
  },

  async createJournalEntry(payload) {
    const response = await api.post("/admin/reconciliation/journal-entry", payload);
    return extractResponseData(response);
  },

  async confirmPeriod(period_name, notes = "") {
    const response = await api.post("/admin/reconciliation/confirm", {
      period_name,
      notes,
    });
    return extractResponseData(response);
  },

  async lockPeriod(period_name, notes = "") {
    const response = await api.post("/admin/reconciliation/lock", {
      period_name,
      notes,
    });
    return extractResponseData(response);
  },

  async unlockPeriod(period_name, reason) {
    const response = await api.post("/admin/reconciliation/unlock", {
      period_name,
      reason,
    });
    return extractResponseData(response);
  },

  async exportReconciliation(filters = {}) {
    const params = {};
    if (filters.period_name && filters.period_name !== "ALL") params.period_name = filters.period_name;
    if (filters.match_status && filters.match_status !== "ALL") params.match_status = filters.match_status;

    const response = await api.get("/admin/reconciliation/export", {
      params,
      responseType: "blob",
    });

    return {
      blob: response.data,
      filename: getFilenameFromDisposition(response.headers?.["content-disposition"]) || "reconciliation_export.csv",
    };
  },
};

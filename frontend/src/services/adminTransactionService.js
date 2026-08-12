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

function buildParams(filters = {}) {
  const params = {};

  if (filters.search) params.search = filters.search;
  if (filters.source && filters.source !== "ALL") params.source = filters.source;
  if (filters.status && filters.status !== "ALL") params.status = filters.status;
  if (filters.reconciliationStatus && filters.reconciliationStatus !== "ALL") {
    params.reconciliation_status = filters.reconciliationStatus;
  }
  if (filters.grant && filters.grant !== "ALL") params.grant = filters.grant;
  if (filters.budgetHead && filters.budgetHead !== "ALL") params.budget_head = filters.budgetHead;
  if (filters.vendor && filters.vendor !== "ALL") params.vendor = filters.vendor;
  if (filters.dateFrom) params.date_from = filters.dateFrom;
  if (filters.dateTo) params.date_to = filters.dateTo;
  if (filters.createdBy) params.created_by = filters.createdBy;
  if (filters.isHistorical !== undefined && filters.isHistorical !== null && filters.isHistorical !== "") {
    params.is_historical = filters.isHistorical;
  }

  return params;
}

function extractResponseData(response) {
  return response?.data?.data ?? response?.data ?? null;
}

function getFilenameFromDisposition(disposition) {
  if (!disposition) return null;
  const match = disposition.match(/filename="?([^"]+)"?/i);
  return match?.[1] || null;
}

export const adminTransactionService = {
  async getDashboardCounters() {
    const response = await api.get("/admin/transactions/dashboard-counters");
    return extractResponseData(response) || {
      pending_review: 0,
      approved: 0,
      admin_recorded: 0,
      awaiting_reconciliation: 0,
      reconciled: 0,
      rejected: 0,
      historical: 0,
      locked: 0,
    };
  },

  async getBudgetHeads() {
    const response = await api.get("/admin/budget-heads");
    const data = extractResponseData(response);
    return Array.isArray(data) ? data : [];
  },

  async getTransactions(filters = {}) {
    const response = await api.get("/admin/transactions", {
      params: buildParams(filters),
    });
    return Array.isArray(extractResponseData(response)) ? extractResponseData(response) : [];
  },

  async createTransaction(payload) {
    const response = await api.post("/admin/transactions", payload);
    return extractResponseData(response);
  },

  async uploadAdminBill(payload, file = null) {
    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    }
    const queryParams = new URLSearchParams({
      amount: payload.amount,
      budget_line: payload.budget_line,
      vendor: payload.vendor,
      description: payload.description,
    });
    if (payload.grant_id) queryParams.append("grant_id", payload.grant_id);

    const response = await api.post(`/admin/transactions/upload-bill?${queryParams.toString()}`, formData);
    return extractResponseData(response);
  },

  async stageImportTransactions(file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/admin/transactions/import/stage", formData);
    return extractResponseData(response);
  },

  async confirmImportTransactions(stage_token, is_historical = false) {
    const response = await api.post("/admin/transactions/import/confirm", {
      stage_token,
      is_historical,
    });
    return extractResponseData(response);
  },

  async recordJournalEntry(payload) {
    const response = await api.post("/admin/transactions/journal-entry", payload);
    return extractResponseData(response);
  },

  async uploadHistoricalCsv(file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(
      "/admin/transactions/upload-historical-csv",
      formData
    );
    return extractResponseData(response);
  },

  async reviewTransaction(payload) {
    const response = await api.post("/admin/transactions/review", payload);
    return extractResponseData(response);
  },

  async importTransactions(file, onUploadProgress = null) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/admin/transactions/import", formData, {
      onUploadProgress: onUploadProgress
        ? (event) => {
            if (event.total) {
              onUploadProgress(Math.round((event.loaded * 100) / event.total));
            }
          }
        : undefined,
    });

    return extractResponseData(response);
  },

  async exportTransactions(filters = {}) {
    const response = await api.get("/admin/transactions/export", {
      params: buildParams(filters),
      responseType: "blob",
    });

    return {
      blob: response.data,
      filename: getFilenameFromDisposition(response.headers?.["content-disposition"]) || "transactions_export.csv",
    };
  },
};

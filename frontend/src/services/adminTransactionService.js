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
  if (filters.status && filters.status !== "ALL") params.status = filters.status;
  if (filters.budgetHead) params.budget_head = filters.budgetHead;
  if (filters.dateFrom) params.date_from = filters.dateFrom;
  if (filters.dateTo) params.date_to = filters.dateTo;
  if (filters.createdBy) params.created_by = filters.createdBy;

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

  async reviewTransaction(payload) {
    const response = await api.post("/admin/transactions/review", payload);
    return extractResponseData(response);
  },

  async importTransactions(file, onUploadProgress = null) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/admin/transactions/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
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
      filename: getFilenameFromDisposition(response.headers?.["content-disposition"]),
    };
  },
};

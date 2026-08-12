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

export const getFileUrl = (filePath) => {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
  const cleanPath = filePath.replace(/\\/g, "/");
  const slashPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  const backendHost = (import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1").replace(/\/api\/v1\/?$/, "");
  return `${backendHost}${slashPath}`;
};

/**
 * Read-only client for the Accounts module. Every call here hits an
 * existing GET endpoint that is gated server-side by the ACCOUNTS role
 * (see app/accounts/routers/accounts.py and app/reports/router.py).
 * There are intentionally no create/update/delete methods in this file.
 */
export const accountsService = {
  // GET /accounts/dashboard - org-wide budget/spend KPIs
  getDashboardKPIs: async () => {
    const response = await api.get("/accounts/dashboard");
    return response?.data?.data ?? response?.data;
  },

  // GET /accounts/transactions - real transaction ledger (optional status/search filters)
  getTransactions: async ({ status, search } = {}) => {
    const response = await api.get("/accounts/transactions", {
      params: {
        ...(status && status !== "all" ? { status } : {}),
        ...(search ? { search } : {}),
      },
    });
    return response?.data?.data ?? response?.data ?? [];
  },

  // GET /accounts/budget - per-project budget & budget-head utilization
  getBudgetOverview: async () => {
    const response = await api.get("/accounts/budget");
    return response?.data?.data ?? response?.data ?? [];
  },

  // GET /reports/admin-files - reused as-is from the existing Reports module
  // (the same endpoint app/admin's Transaction Review & UC Management pages
  // call). The backend already restricts the ACCOUNTS role to "bill" and
  // "uc" categories, and rejects any write attempt from this role.
  getFinanceDocuments: async ({ category, status, search } = {}) => {
    const response = await api.get("/reports/admin-files", {
      params: {
        ...(category ? { category } : {}),
        ...(status && status !== "ALL" ? { status } : {}),
        ...(search ? { search } : {}),
      },
    });
    return response?.data?.data ?? response?.data ?? [];
  },
};

export const formatDateTime = (dateVal) => {
  if (!dateVal) return "N/A";
  let str = String(dateVal);
  if (str.includes("T") && !str.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(str)) {
    str += "Z";
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleString();
};

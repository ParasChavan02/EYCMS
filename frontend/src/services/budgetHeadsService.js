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

export const budgetHeadsService = {
  /**
   * Full overview: overall summary + teams (each with member/user rollups).
   * GET /admin/budget-heads/overview
   */
  async getOverview() {
    const response = await api.get("/admin/budget-heads/overview");
    return extractResponseData(response);
  },

  /**
   * Full detail for a single user: profile + budget + spending categories
   * + allocation history.
   * GET /admin/budget-heads/users/{userId}
   */
  async getUserDetail(userId) {
    const response = await api.get(`/admin/budget-heads/users/${userId}`);
    return extractResponseData(response);
  },

  /**
   * Create a new budget allocation for a user.
   * POST /admin/budget-heads/users/{userId}/allocation
   */
  async allocateBudget(userId, payload) {
    const response = await api.post(`/admin/budget-heads/users/${userId}/allocation`, payload);
    return extractResponseData(response);
  },

  /**
   * Edit/reallocate an existing budget allocation.
   * PUT /admin/budget-heads/allocations/{allocationId}
   */
  async updateAllocation(allocationId, payload) {
    const response = await api.put(`/admin/budget-heads/allocations/${allocationId}`, payload);
    return extractResponseData(response);
  },

  /**
   * Add a spending category entry for a user.
   * POST /admin/budget-heads/users/{userId}/spending
   */
  async addSpendingCategory(userId, payload) {
    const response = await api.post(`/admin/budget-heads/users/${userId}/spending`, payload);
    return extractResponseData(response);
  },

  /**
   * Edit a spending category entry.
   * PUT /admin/budget-heads/spending/{spendingId}
   */
  async updateSpendingCategory(spendingId, payload) {
    const response = await api.put(`/admin/budget-heads/spending/${spendingId}`, payload);
    return extractResponseData(response);
  },

  /**
   * Delete a spending category entry.
   * DELETE /admin/budget-heads/spending/{spendingId}
   */
  async deleteSpendingCategory(spendingId) {
    const response = await api.delete(`/admin/spending/${spendingId}`);
    return extractResponseData(response);
  },

  async allocateEycBudget(payload) {
    const response = await api.post("/admin/budget-heads/allocate", payload);
    return extractResponseData(response);
  },

  async addCommonBudgetEntry(payload) {
    const response = await api.post("/admin/budget-heads/common-budget", payload);
    return extractResponseData(response);
  },

  async getSuperOverview() {
    const response = await api.get("/admin/budget-heads/super-overview");
    return extractResponseData(response);
  },

  async superAllocate(payload) {
    const response = await api.post("/admin/budget-heads/super-allocate", payload);
    return extractResponseData(response);
  },

  async addCustomCategory(payload) {
    const response = await api.post("/admin/budget-heads/custom-category", payload);
    return extractResponseData(response);
  },

  async allocateFellowBudget(payload) {
    const response = await api.post("/admin/budget-heads/fellow-allocate", payload);
    return extractResponseData(response);
  },
};

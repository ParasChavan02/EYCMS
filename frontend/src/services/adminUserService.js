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

export const adminUserService = {
  async getUsersStats() {
    const response = await api.get("/admin/users/stats");
    return extractResponseData(response);
  },

  async getUsers(filters = {}) {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.role && filters.role !== "ALL") params.role = filters.role;
    if (filters.status && filters.status !== "ALL") params.status = filters.status;
    if (filters.department && filters.department !== "ALL") params.department = filters.department;
    if (filters.projectId && filters.projectId !== "ALL") params.project_id = filters.projectId;
    if (filters.teamId && filters.teamId !== "ALL") params.team_id = filters.teamId;

    const response = await api.get("/admin/users/list", { params });
    return Array.isArray(extractResponseData(response)) ? extractResponseData(response) : [];
  },

  async createUser(payload) {
    const response = await api.post("/admin/users/create", payload);
    return extractResponseData(response);
  },

  async updateUser(userId, payload) {
    const response = await api.put(`/admin/users/${userId}/update`, payload);
    return extractResponseData(response);
  },

  async resetPassword(userId, payload = {}) {
    const response = await api.post(`/admin/users/${userId}/reset-password`, payload);
    return extractResponseData(response);
  },

  async toggleUserStatus(userId) {
    const response = await api.post(`/admin/users/${userId}/toggle-status`);
    return extractResponseData(response);
  },

  async removeUserAccess(userId) {
    const response = await api.delete(`/admin/users/${userId}/remove-access`);
    return extractResponseData(response);
  },

  async getProjects() {
    const response = await api.get("/admin/projects/list");
    return Array.isArray(extractResponseData(response)) ? extractResponseData(response) : [];
  },

  async getProjectDetail(projectUuid) {
    const response = await api.get(`/admin/projects/${projectUuid}/detail`);
    return extractResponseData(response);
  },

  async getOnboardingRequests() {
    const response = await api.get("/admin/onboarding-requests/list");
    return Array.isArray(extractResponseData(response)) ? extractResponseData(response) : [];
  },

  async approveOnboarding(requestUuid) {
    const response = await api.post(`/admin/onboarding-requests/${requestUuid}/approve`);
    return extractResponseData(response);
  },

  async rejectOnboarding(requestUuid) {
    const response = await api.post(`/admin/onboarding-requests/${requestUuid}/reject`);
    return extractResponseData(response);
  },

  async getUserActivity(userId) {
    const response = await api.get(`/admin/users/${userId}/activity`);
    return Array.isArray(extractResponseData(response)) ? extractResponseData(response) : [];
  },

  async createProject(payload) {
    const response = await api.post("/admin/projects/create", payload);
    return extractResponseData(response);
  },
  
  async toggleProjectStatus(projectUuid) {
    const response = await api.post(`/admin/projects/${projectUuid}/toggle-status`);
    return extractResponseData(response);
  },

  async deleteProject(projectUuid) {
    const response = await api.delete(`/admin/projects/${projectUuid}/remove`);
    return extractResponseData(response);
  },
};

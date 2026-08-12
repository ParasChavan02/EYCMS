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

export const superAdminService = {
  async generateToken(tokenData) {
    const response = await api.post("/auth/admin-tokens", {
      invited_name: tokenData.invitedName,
      invited_email: tokenData.invitedEmail,
      expiry_duration: tokenData.expiryDuration, // e.g., "24 Hours", "7 Days", "30 Days"
    });
    return response.data;
  },

  async getTokens() {
    const response = await api.get("/auth/admin-tokens");
    return response.data;
  },

  async getTokenById(id) {
    const response = await api.get(`/auth/admin-tokens/${id}`);
    return response.data;
  },

  async revokeToken(id) {
    const response = await api.patch(`/auth/admin-tokens/${id}/revoke`);
    return response.data;
  },
};

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export async function login(credentials) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
    if (response.data && response.data.success) {
      const data = response.data.data;
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("current_user", JSON.stringify(data.user));
      return { success: true, user: data.user };
    }
    return { success: false, error: response.data.message || "Login failed" };
  } catch (error) {
    if (error.response && error.response.data) {
      return { success: false, error: error.response.data.error || error.response.data.detail || "Login failed" };
    }
    return { success: false, error: "Cannot connect to Backend API" };
  }
}

export async function logout() {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  } catch (e) {
    console.error("Logout error on backend:", e);
  }
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("current_user");
  return { success: true };
}

export async function registerAdmin(adminData) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/admin/register`, {
      name: adminData.name,
      email: adminData.email,
      password: adminData.password,
      confirm_password: adminData.confirmPassword,
      admin_token: adminData.adminToken
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return { success: false, error: error.response.data.error || error.response.data.detail || "Registration failed" };
    }
    return { success: false, error: "Cannot connect to Backend API" };
  }
}

export async function registerUser(userData) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/user/register`, {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      confirm_password: userData.confirmPassword
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return { success: false, error: error.response.data.error || error.response.data.detail || "Registration failed" };
    }
    return { success: false, error: "Cannot connect to Backend API" };
  }
}

export async function signup(userData) {
  return registerUser(userData);
}

export async function getCurrentUser() {
  const userJson = localStorage.getItem("current_user");
  return userJson ? JSON.parse(userJson) : null;
}

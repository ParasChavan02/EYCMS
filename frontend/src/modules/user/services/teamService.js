import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const USERS_STORAGE_KEY = 'app_users';
const CURRENT_USER_KEY = 'current_user';
const RESET_REQUESTS_KEY = 'team_reset_requests';

function getAllUsers() {
  const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
}

function saveUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export const teamService = {
  setupTeam: async (user, { projectId, teamMembers }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/user/setup-team`, {
        projectId,
        teamMembers
      }, {
        headers: getAuthHeaders()
      });

      if (response.data && response.data.success) {
        const updatedUser = response.data.data;
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
        return updatedUser;
      }
      throw new Error(response.data.message || "Failed to configure team workspace.");
    } catch (error) {
      if (error.response && error.response.data) {
        throw new Error(error.response.data.error || error.response.data.detail || "Failed to configure team workspace.");
      }
      throw error;
    }
  },

  addTeammate: async (user, { name, email }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/user/invite-teammate`, {
        name,
        email
      }, {
        headers: getAuthHeaders()
      });

      if (response.data && response.data.success) {
        const currentMembers = user.teamMembers || [];
        const updatedMembers = [...currentMembers, { name, email, status: 'Pending' }];
        const updatedUser = {
          ...user,
          teamMembers: updatedMembers
        };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
        return updatedUser;
      }
      throw new Error(response.data.message || "Failed to invite teammate.");
    } catch (error) {
      if (error.response && error.response.data) {
        throw new Error(error.response.data.error || error.response.data.detail || "Failed to invite teammate.");
      }
      throw error;
    }
  },

  requestTeamReset: async (user) => {
    const requestsJson = localStorage.getItem(RESET_REQUESTS_KEY);
    const requests = requestsJson ? JSON.parse(requestsJson) : [];

    // Check if there is already a pending request
    const existing = requests.find(r => r.userEmail === user.email && r.status === 'Pending');
    if (existing) {
      return existing;
    }

    const newRequest = {
      id: `REQ-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      projectId: user.projectId || '',
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    requests.push(newRequest);
    localStorage.setItem(RESET_REQUESTS_KEY, JSON.stringify(requests));
    return newRequest;
  },

  getResetRequest: async (user) => {
    const requestsJson = localStorage.getItem(RESET_REQUESTS_KEY);
    const requests = requestsJson ? JSON.parse(requestsJson) : [];
    
    const userRequests = requests.filter(r => r.userEmail === user.email);
    if (userRequests.length === 0) return null;

    userRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return userRequests[0];
  }
};

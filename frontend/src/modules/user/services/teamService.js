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
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.email === user.email);

    const updatedUser = {
      ...user,
      projectId,
      teamMembers: teamMembers || [],
      teamConfigured: true,
      onboardedAt: new Date().toISOString()
    };

    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        projectId,
        teamMembers: teamMembers || [],
        teamConfigured: true,
        onboardedAt: new Date().toISOString()
      };
      saveUsers(users);
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  },

  addTeammate: async (user, { name, email }) => {
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.email === user.email);

    const newMember = { name, email, status: 'Pending' };
    const currentMembers = user.teamMembers || [];

    if (currentMembers.some(m => m.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('A teammate with this email address already exists.');
    }

    const updatedMembers = [...currentMembers, newMember];
    const updatedUser = {
      ...user,
      teamMembers: updatedMembers
    };

    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        teamMembers: updatedMembers
      };
      saveUsers(users);
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    return updatedUser;
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

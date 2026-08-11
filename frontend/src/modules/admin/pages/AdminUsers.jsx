import { useMemo, useState, useEffect, useRef } from "react";
import { adminUserService } from "../../../services/adminUserService";
import "../../../styles/admin-management.css";

function AdminUsers() {
  const emptyForm = {
    name: "",
    email: "",
    contact_number: "",
    department: "",
    role: "USER",
    status: "Active",
    project_id: "",
    team_id: "",
    joining_date: new Date().toISOString().split("T")[0],
    password: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [projectForm, setProjectForm] = useState({ project_id: "", title: "" });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [projFilter, setProjFilter] = useState("ALL");
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  // Active Tab state: 'overview' | 'manage' | 'projects' | 'onboarding'
  const [activeTab, setActiveTab] = useState("overview");

  // Show/Hide password toggler & confirmation credentials card
  const [showPassword, setShowPassword] = useState(false);
  const [lastCreatedUser, setLastCreatedUser] = useState(null);

  // Manually created user history loaded from localStorage
  const [manuallyCreatedUsers, setManuallyCreatedUsers] = useState(() => {
    try {
      const stored = localStorage.getItem("manually_created_users");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const [visiblePasswords, setVisiblePasswords] = useState({});

  // Save manually created user history to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem("manually_created_users", JSON.stringify(manuallyCreatedUsers));
    } catch (e) {
      console.error("Error saving manual users to localStorage:", e);
    }
  }, [manuallyCreatedUsers]);

  // Database lists
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, inactive: 0 });
  const [projects, setProjects] = useState([]);
  const [onboardingRequests, setOnboardingRequests] = useState([]);
  const [formTeams, setFormTeams] = useState([]);

  // Dropdown & Modal States
  const [activeDropdownUserId, setActiveDropdownUserId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectDetailLoading, setProjectDetailLoading] = useState(false);
  const [profileTargetUser, setProfileTargetUser] = useState(null);
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [resetPasswordInput, setResetPasswordInput] = useState("");
  
  const [assignTargetUser, setAssignTargetUser] = useState(null);
  const [assignProjectId, setAssignProjectId] = useState("");
  const [assignTeamId, setAssignTeamId] = useState("");
  const [assignTeams, setAssignTeams] = useState([]);

  const [activityTargetUser, setActivityTargetUser] = useState(null);
  const [userActivityLogs, setUserActivityLogs] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Load all data on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const usersData = await adminUserService.getUsers();
      setUsers(usersData);

      const statsData = await adminUserService.getUsersStats();
      if (statsData) setStats(statsData);

      const projectsData = await adminUserService.getProjects();
      setProjects(projectsData);

      const onboardingData = await adminUserService.getOnboardingRequests();
      setOnboardingRequests(onboardingData);
    } catch (e) {
      console.error("Error loading admin users data:", e);
      setMessage("Failed to sync data with the server.");
      setIsError(true);
    }
  };

  // Dynamically load teams when form project changes
  const handleProjectChange = async (projUuid) => {
    if (!projUuid || projUuid === "None") {
      setFormTeams([]);
      setForm((prev) => ({ ...prev, project_id: "", team_id: "" }));
      return;
    }

    try {
      const details = await adminUserService.getProjectDetail(projUuid);
      if (details && details.teams) {
        setFormTeams(details.teams);
      } else {
        setFormTeams([]);
      }
      setForm((prev) => ({ ...prev, project_id: projUuid, team_id: "" }));
    } catch (e) {
      console.error("Failed to load teams for project:", e);
      setFormTeams([]);
    }
  };

  // Dynamically load teams when re-assigning project for user
  const handleAssignProjectChange = async (projUuid) => {
    setAssignProjectId(projUuid);
    setAssignTeamId("");
    if (!projUuid || projUuid === "None") {
      setAssignTeams([]);
      return;
    }
    try {
      const details = await adminUserService.getProjectDetail(projUuid);
      if (details && details.teams) {
        setAssignTeams(details.teams);
      } else {
        setAssignTeams([]);
      }
    } catch (e) {
      console.error("Failed to load teams for assignment:", e);
      setAssignTeams([]);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleVisiblePassword = (userId) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const saveProject = async () => {
    setMessage("");
    setIsError(false);

    if (!projectForm.project_id || !projectForm.title) {
      setMessage("Please fill Project ID and Project Name fields");
      setIsError(true);
      return;
    }

    try {
      await adminUserService.createProject({
        project_id: projectForm.project_id,
        title: projectForm.title
      });
      setMessage("Project created successfully and default team established.");
      setProjectForm({ project_id: "", title: "" });
      fetchInitialData();
    } catch (e) {
      setMessage(e.response?.data?.detail || e.message || "Failed to create project");
      setIsError(true);
    }
  };

  const saveUser = async () => {
    setMessage("");
    setIsError(false);
    setLastCreatedUser(null);

    if (!form.name || !form.email) {
      setMessage("Please fill Name and Email fields");
      setIsError(true);
      return;
    }

    const passwordVal = form.password || "EYCMS@2026";

    try {
      if (editingUserId) {
        await adminUserService.updateUser(editingUserId, {
          name: form.name,
          email: form.email,
          role: "USER", // Force USER role
          project_id: form.project_id || null,
          status: form.status,
          joining_date: form.joining_date || null,
          contact_number: form.contact_number || null
        });
        setMessage("User updated successfully");
        setActiveTab("overview");
      } else {
        const res = await adminUserService.createUser({
          name: form.name,
          email: form.email,
          role: "USER", // Force USER role
          project_id: form.project_id || null,
          status: form.status,
          joining_date: form.joining_date || null,
          password: passwordVal,
          contact_number: form.contact_number || null
        });
        setMessage("User created successfully");
        
        const freshUserRecord = {
          id: res.id || Math.random().toString(),
          name: form.name,
          email: form.email,
          password: passwordVal,
          project_id: form.project_id || "None",
          status: form.status,
          contact_number: form.contact_number || "None"
        };
        setLastCreatedUser(freshUserRecord);
        setManuallyCreatedUsers((prev) => [...prev, freshUserRecord]);
        
        // Reveal password by default for this newly created user
        setVisiblePasswords((prev) => ({ ...prev, [freshUserRecord.id]: true }));
      }
      setEditingUserId(null);
      setForm(emptyForm);
      setFormTeams([]);
      fetchInitialData();
    } catch (e) {
      setMessage(e.response?.data?.detail || e.message || "Failed to save user");
      setIsError(true);
    }
  };

  const editUser = (user) => {
    setEditingUserId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      contact_number: user.contact_number || "",
      department: "",
      role: "USER",
      status: user.status,
      project_id: user.project_id === "None" ? "" : user.project_id,
      team_id: "",
      joining_date: user.joining_date || new Date().toISOString().split("T")[0],
      password: "",
    });
    setMessage("");
    setIsError(false);
    setFormTeams([]);
    setLastCreatedUser(null);
    setActiveTab("manage");
  };

  const toggleStatus = async (id) => {
    try {
      await adminUserService.toggleUserStatus(id);
      setMessage("User status updated");
      setIsError(false);
      fetchInitialData();
    } catch (e) {
      setMessage(e.message || "Failed to toggle status");
      setIsError(true);
    }
  };

  const suspendUser = async (user) => {
    try {
      await adminUserService.updateUser(user.id, {
        status: "Suspended",
      });
      setMessage(`User ${user.name} has been suspended.`);
      setIsError(false);
      fetchInitialData();
    } catch (e) {
      setMessage(e.message || "Failed to suspend user");
      setIsError(true);
    }
  };

  const triggerResetPassword = (user) => {
    setResetTargetUser(user);
    setResetPasswordInput("");
  };

  const savePasswordReset = async () => {
    if (!resetTargetUser) return;
    try {
      await adminUserService.resetPassword(resetTargetUser.id, {
        password: resetPasswordInput || undefined,
      });
      setMessage(`Password reset successfully. Credentials saved and logged.`);
      setIsError(false);
      setResetTargetUser(null);
      fetchInitialData();
    } catch (e) {
      setMessage(e.message || "Failed to reset password");
      setIsError(true);
    }
  };

  const triggerChangeProjectTeam = async (user) => {
    setAssignTargetUser(user);
    setAssignProjectId(user.project_uuid || "");
    setAssignTeamId(user.team_id || "");
    if (user.project_uuid) {
      try {
        const details = await adminUserService.getProjectDetail(user.project_uuid);
        setAssignTeams(details.teams || []);
      } catch (e) {
        setAssignTeams([]);
      }
    } else {
      setAssignTeams([]);
    }
  };

  const saveProjectTeamAssignment = async () => {
    if (!assignTargetUser) return;
    try {
      await adminUserService.updateUser(assignTargetUser.id, {
        project_id: assignProjectId || null,
        team_id: assignTeamId || null,
      });
      setMessage(`Project and Team assignments updated for ${assignTargetUser.name}.`);
      setIsError(false);
      setAssignTargetUser(null);
      fetchInitialData();
    } catch (e) {
      setMessage(e.message || "Failed to update project/team assignment");
      setIsError(true);
    }
  };

  const viewUserActivity = async (user) => {
    setActivityTargetUser(user);
    setActivityLoading(true);
    try {
      const logs = await adminUserService.getUserActivity(user.id);
      setUserActivityLogs(logs);
    } catch (e) {
      console.error(e);
      setUserActivityLogs([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (window.confirm("Are you sure you want to revoke access? Historical ERP data will remain fully intact.")) {
      try {
        await adminUserService.removeUserAccess(id);
        setMessage("User access removed. Record kept deactivated in database.");
        setIsError(false);
        fetchInitialData();
      } catch (e) {
        setMessage(e.message || "Failed to remove user access");
        setIsError(true);
      }
    }
  };

  const handleToggleProjectStatus = async (projectUuid) => {
    try {
      await adminUserService.toggleProjectStatus(projectUuid);
      setMessage("Project status updated successfully");
      setIsError(false);
      fetchInitialData();
    } catch (e) {
      setMessage(e.message || "Failed to toggle project status");
      setIsError(true);
    }
  };

  const handleDeleteProject = async (projectUuid) => {
    if (window.confirm("Are you sure you want to delete this project? Historical ERP data will remain fully intact.")) {
      try {
        await adminUserService.deleteProject(projectUuid);
        setMessage("Project set to DELETED. Associated users blocked.");
        setIsError(false);
        fetchInitialData();
      } catch (e) {
        setMessage(e.message || "Failed to delete project");
        setIsError(true);
      }
    }
  };

  const handleApproveOnboarding = async (reqUuid) => {
    try {
      await adminUserService.approveOnboarding(reqUuid);
      setMessage("Onboarding request approved.");
      setIsError(false);
      fetchInitialData();
    } catch (e) {
      setMessage(e.message || "Failed to approve onboarding");
      setIsError(true);
    }
  };

  const handleRejectOnboarding = async (reqUuid) => {
    if (window.confirm("Are you sure you want to reject this request?")) {
      try {
        await adminUserService.rejectOnboarding(reqUuid);
        setMessage("Onboarding request rejected.");
        setIsError(false);
        fetchInitialData();
      } catch (e) {
        setMessage(e.message || "Failed to reject onboarding");
        setIsError(true);
      }
    }
  };

  const handleProjectCardClick = async (projUuid) => {
    setProjectDetailLoading(true);
    try {
      const details = await adminUserService.getProjectDetail(projUuid);
      setSelectedProject(details);
    } catch (e) {
      alert("Failed to fetch project details.");
      console.error(e);
    } finally {
      setProjectDetailLoading(false);
    }
  };

  const clearAllFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
    setProjFilter("ALL");
    setTeamFilter("ALL");
  };

  // Clickable stats card filtering
  const handleStatsCardClick = (type) => {
    clearAllFilters();
    if (type === "active") {
      setStatusFilter("Active");
    } else if (type === "pending") {
      setStatusFilter("Pending");
    } else if (type === "inactive") {
      setStatusFilter("Inactive");
    }
  };

  // Filter roster list in memory
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = [user.name, user.email, user.department].join(" ").toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      const matchesStatus = statusFilter === "ALL" || 
        (statusFilter === "Inactive" ? !user.is_active : user.status === statusFilter);
      const matchesProj = projFilter === "ALL" || user.project_uuid === projFilter || user.project_id === projFilter;
      const matchesTeam = teamFilter === "ALL" || user.team === teamFilter || user.team_id === teamFilter;
      return matchesSearch && matchesRole && matchesStatus && matchesProj && matchesTeam;
    });
  }, [users, search, roleFilter, statusFilter, projFilter, teamFilter]);

  // Recently Added Users list (top 5)
  const recentlyAddedUsers = useMemo(() => {
    const list = [...users];
    list.sort((a, b) => {
      const dateA = a.joining_date ? new Date(a.joining_date).getTime() : 0;
      const dateB = b.joining_date ? new Date(b.joining_date).getTime() : 0;
      return dateB - dateA;
    });
    return list.slice(0, 5);
  }, [users]);

  // Unique teams for filter
  const uniqueTeams = useMemo(() => {
    const set = new Set(users.map((u) => u.team).filter((t) => t && t !== "None"));
    return Array.from(set);
  }, [users]);

  // Onboarding requests requiring attention count
  const pendingOnboardingCount = useMemo(() => {
    return onboardingRequests.filter((r) => r.status === "PENDING_APPROVAL").length;
  }, [onboardingRequests]);

  // Pending user registrations count
  const pendingUsersCount = useMemo(() => {
    return users.filter((u) => u.status === "Pending").length;
  }, [users]);

  // Helper styles for top navigation buttons
  const tabNavStyle = {
    display: "flex",
    gap: "12px",
    margin: "12px 0 24px 0",
    flexWrap: "wrap",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "16px"
  };

  const getTabButtonStyle = (tabName) => {
    const isActive = activeTab === tabName;
    return {
      padding: "10px 20px",
      fontSize: "14px",
      fontWeight: "600",
      borderRadius: "8px",
      border: "1px solid #0f5aff",
      cursor: "pointer",
      transition: "all 0.2s ease-in-out",
      backgroundColor: isActive ? "#0f5aff" : "white",
      color: isActive ? "white" : "#0f5aff",
      boxShadow: isActive ? "0 4px 12px rgba(15, 90, 255, 0.2)" : "none"
    };
  };

  const clearManualHistory = () => {
    if (window.confirm("Clear manually created users history?")) {
      setManuallyCreatedUsers([]);
      setVisiblePasswords({});
      localStorage.removeItem("manually_created_users");
    }
  };

  return (
    <main className="admin-page">
      {/* LOCAL STYLES FOR SUSPENDED BADGE AND ACTIONS DROPDOWN */}
      <style>{`
        .status-badge.suspended {
          background: #ffedd5;
          color: #c2410c;
        }
        .status-badge.deactivated {
          background: #fee2e2;
          color: #991b1b;
        }
        .status-badge.blocked {
          background: #fecaca;
          color: #991b1b;
        }
        .status-badge.deleted {
          background: #fee2e2;
          color: #ef4444;
        }
        .actions-dropdown-container {
          position: relative;
          display: inline-block;
        }
        .actions-dropdown-menu {
          position: absolute;
          right: 0;
          top: 100%;
          background: white;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border-radius: 8px;
          z-index: 50;
          min-width: 170px;
          padding: 6px 0;
          margin-top: 4px;
        }
        .actions-dropdown-item {
          padding: 8px 14px;
          font-size: 13px;
          text-align: left;
          cursor: pointer;
          color: #475569;
          background: none;
          border: none;
          width: 100%;
          display: block;
          font-weight: 500;
          transition: background 0.15s, color 0.15s;
        }
        .actions-dropdown-item:hover {
          background: #f1f5f9;
          color: #0f5aff;
        }
        .quick-filter-strip {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 8px 0;
          margin-bottom: 16px;
          scrollbar-width: thin;
        }
        .quick-filter-btn {
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid #dbe2ea;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          background: white;
          color: #64748b;
          transition: all 0.15s;
        }
        .quick-filter-btn.active {
          background: #0f5aff;
          color: white;
          border-color: #0f5aff;
        }
        .quick-filter-btn:hover:not(.active) {
          border-color: #0f5aff;
          color: #0f5aff;
        }
        .role-badge, .status-badge {
          white-space: nowrap !important;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
        }
        .admin-table th, .admin-table td {
          white-space: nowrap !important;
        }
        .projects-teams-scroll-container, .table-wrapper {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 14px;
          scrollbar-width: auto !important; /* Force browser standard scrollbar */
        }
        /* Custom slidebar/scrollbar styling to make it clearly visible and thick */
        .projects-teams-scroll-container::-webkit-scrollbar,
        .table-wrapper::-webkit-scrollbar {
          height: 12px !important;
          display: block !important;
        }
        .projects-teams-scroll-container::-webkit-scrollbar-track,
        .table-wrapper::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
          border-radius: 6px !important;
          border: 1px solid #e2e8f0 !important;
        }
        .projects-teams-scroll-container::-webkit-scrollbar-thumb,
        .table-wrapper::-webkit-scrollbar-thumb {
          background: #888888 !important;
          border-radius: 6px !important;
          border: 2px solid #f1f5f9 !important;
        }
        .projects-teams-scroll-container::-webkit-scrollbar-thumb:hover,
        .table-wrapper::-webkit-scrollbar-thumb:hover {
          background: #555555 !important;
        }
      `}</style>

      <section className="admin-header">
        <h1>Users Management</h1>
        <p>Manage ERP users, role assignments, account status, and password reset workflows.</p>
      </section>

      {/* TOP TAB NAVIGATION */}
      <div style={tabNavStyle}>
        <button
          style={getTabButtonStyle("overview")}
          onClick={() => setActiveTab("overview")}
        >
          Users Overview
        </button>
        <button
          style={getTabButtonStyle("manage")}
          onClick={() => {
            setActiveTab("manage");
            if (!editingUserId) {
              setForm(emptyForm);
              setFormTeams([]);
              setLastCreatedUser(null);
            }
          }}
        >
          {editingUserId ? "Edit User" : "Create & Manage"}
        </button>
        <button
          style={getTabButtonStyle("projects")}
          onClick={() => setActiveTab("projects")}
        >
          Projects & Teams
        </button>
        <button
          style={getTabButtonStyle("onboarding")}
          onClick={() => setActiveTab("onboarding")}
        >
          Onboarding Requests
        </button>
      </div>

      {message && (
        <div className={`form-message ${isError ? "error" : "success"}`} style={{ marginBottom: "20px" }}>
          {message}
        </div>
      )}

      {/* TAB 1: USERS OVERVIEW */}
      {activeTab === "overview" && (
        <>
          {/* CLICKABLE STATISTICS CARDS */}
          <section className="stats-grid">
            <div className="stat-card" onClick={() => handleStatsCardClick("total")} style={{ cursor: "pointer", borderBottom: projFilter === "ALL" && statusFilter === "ALL" ? "3px solid #0f5aff" : "none" }}>
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <div className="stat-card" onClick={() => handleStatsCardClick("active")} style={{ cursor: "pointer", borderBottom: statusFilter === "Active" ? "3px solid #10b981" : "none" }}>
              <div className="stat-label">Active Users</div>
              <div className="stat-value">{stats.active}</div>
            </div>
            <div className="stat-card" onClick={() => { setActiveTab("onboarding"); }} style={{ cursor: "pointer" }}>
              <div className="stat-label">Pending Approval</div>
              <div className="stat-value">{stats.pending}</div>
            </div>
            <div className="stat-card" onClick={() => handleStatsCardClick("inactive")} style={{ cursor: "pointer", borderBottom: statusFilter === "Inactive" ? "3px solid #ef4444" : "none" }}>
              <div className="stat-label">Inactive Users</div>
              <div className="stat-value">{stats.inactive}</div>
            </div>
          </section>

          {/* TWO-COLUMN OVERVIEW GRID */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "24px",
            alignItems: "start",
            minWidth: 0
          }} className="overview-responsive-grid">
            <style>{`
              @media (min-width: 1024px) {
                .overview-responsive-grid {
                  grid-template-columns: 1fr 340px !important;
                }
              }
            `}</style>

            {/* LEFT COLUMN: User Roster & Table */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px", minWidth: 0 }}>
              
              {/* User Accounts & Roster Card */}
              <section className="admin-card">
                <h2>User Accounts & Roster</h2>

                {/* Horizontal Project Quick Filtering tag list */}
                <div style={{ marginBottom: "12px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    Quick Filter By Project
                  </span>
                  <div className="quick-filter-strip">
                    <button
                      className={`quick-filter-btn ${projFilter === "ALL" ? "active" : ""}`}
                      onClick={() => setProjFilter("ALL")}
                    >
                      All Users
                    </button>
                    <button
                      className={`quick-filter-btn ${projFilter === "ALL_PROJECTS" ? "active" : ""}`}
                      onClick={() => setProjFilter("ALL_PROJECTS")}
                    >
                      All Projects
                    </button>
                    {projects.filter(p => p.status !== "SUSPENDED" && p.status !== "DELETED").map((p) => (
                      <button
                        key={p.project_uuid}
                        className={`quick-filter-btn ${projFilter === p.project_uuid || projFilter === p.project_id ? "active" : ""}`}
                        onClick={() => setProjFilter(p.project_uuid)}
                      >
                        {p.project_id}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Horizontal Filters Alignment */}
                {projFilter !== "ALL_PROJECTS" && (
                  <div className="table-header" style={{
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: "10px",
                    alignItems: "center"
                  }}>
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="search-input"
                      style={{ flex: "1 1 200px", minWidth: "180px" }}
                    />
                    <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="filter-select" style={{ flex: "1 1 120px" }}>
                      <option value="ALL">All Roles</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="USER">USER</option>
                      <option value="ACCOUNTS">ACCOUNTS</option>
                    </select>
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="filter-select" style={{ flex: "1 1 120px" }}>
                      <option value="ALL">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Deactivated">Deactivated</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                    <select value={projFilter} onChange={(event) => setProjFilter(event.target.value)} className="filter-select" style={{ flex: "1 1 120px" }}>
                      <option value="ALL">All Projects</option>
                      {projects.map((p) => (
                        <option key={p.project_uuid} value={p.project_uuid}>{p.project_id}</option>
                      ))}
                    </select>
                    <select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)} className="filter-select" style={{ flex: "1 1 120px" }}>
                      <option value="ALL">All Teams</option>
                      {uniqueTeams.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button onClick={clearAllFilters} className="btn-secondary" style={{ padding: "10px 16px", borderRadius: "8px", fontWeight: "600", fontSize: "13px" }}>
                      Clear
                    </button>
                  </div>
                )}

                {projFilter === "ALL_PROJECTS" ? (
                  /* Projects Table */
                  <div className="table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Project ID</th>
                          <th>Project Name</th>
                          <th>Team Leader</th>
                          <th>Status</th>
                          <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projects.filter(p => p.status !== "DELETED").length > 0 ? (
                          projects.filter(p => p.status !== "DELETED").map((proj) => (
                            <tr key={proj.project_uuid}>
                              <td style={{ fontWeight: 600 }}>{proj.project_id}</td>
                              <td>{proj.project_name}</td>
                              <td>{proj.team_leader_name || "None"}</td>
                              <td>
                                <span className={`status-badge ${proj.status.toLowerCase()}`}>{proj.status}</span>
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <button
                                    className="btn-sm"
                                    onClick={() => handleToggleProjectStatus(proj.project_uuid)}
                                    style={{ padding: "6px 12px" }}
                                  >
                                    {proj.status === "SUSPENDED" ? "Activate" : "Suspend"}
                                  </button>
                                  <button
                                    className="btn-sm danger"
                                    onClick={() => handleDeleteProject(proj.project_uuid)}
                                    style={{ padding: "6px 12px", background: "#ef4444", color: "white", borderColor: "#ef4444" }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="empty-state">No projects found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Users Roster Table */
                  <div className="table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Project ID</th>
                          <th>Team</th>
                          <th>Status</th>
                          <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((user) => (
                            <tr key={user.id}>
                              <td style={{ fontWeight: 600 }}>{user.name}</td>
                              <td>{user.email}</td>
                              <td>
                                <span className={`role-badge ${user.role.toLowerCase()}`}>{user.role}</span>
                              </td>
                              <td>{user.project_id}</td>
                              <td>{user.team}</td>
                              <td>
                                <span className={`status-badge ${user.status.toLowerCase()}`}>{user.status}</span>
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <div className="actions-dropdown-container">
                                  <button
                                    className="btn-sm"
                                    onClick={() => setActiveDropdownUserId(activeDropdownUserId === user.id ? null : user.id)}
                                    style={{ padding: "6px 12px", border: "1px solid #cbd5e1" }}
                                  >
                                    Actions ▾
                                  </button>
                                  {activeDropdownUserId === user.id && (
                                    <div className="actions-dropdown-menu">
                                      <button className="actions-dropdown-item" onClick={() => { setActiveDropdownUserId(null); setProfileTargetUser(user); }}>
                                        View Profile
                                      </button>
                                      <button className="actions-dropdown-item" onClick={() => { setActiveDropdownUserId(null); editUser(user); }}>
                                        Edit User
                                      </button>
                                      <button className="actions-dropdown-item" onClick={() => { setActiveDropdownUserId(null); triggerResetPassword(user); }}>
                                        Change Password
                                      </button>
                                      <button className="actions-dropdown-item" onClick={() => { setActiveDropdownUserId(null); triggerChangeProjectTeam(user); }}>
                                        Change Project/Team
                                      </button>
                                      <button className="actions-dropdown-item" onClick={() => { setActiveDropdownUserId(null); toggleStatus(user.id); }}>
                                        {user.is_active ? "Deactivate" : "Activate"}
                                      </button>
                                      <button className="actions-dropdown-item" onClick={() => { setActiveDropdownUserId(null); suspendUser(user); }}>
                                        Suspend Account
                                      </button>
                                      <button className="actions-dropdown-item" onClick={() => { setActiveDropdownUserId(null); viewUserActivity(user); }}>
                                        View Activity
                                      </button>
                                      <div style={{ height: "1px", background: "#e2e8f0", margin: "4px 0" }}></div>
                                      <button className="actions-dropdown-item" style={{ color: "#ef4444" }} onClick={() => { setActiveDropdownUserId(null); deleteUser(user.id); }}>
                                        Remove Access
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="empty-state">
                              No users found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* History / Suspended Records */}
                <div style={{ marginTop: "32px", borderTop: "1px solid #e2e8f0", paddingTop: "24px" }}>
                  <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                    History / Suspended Records
                  </h3>
                  <p style={{ color: "#64748b", fontSize: "13px", marginTop: "-5px", marginBottom: "16px" }}>
                    Suspended or deleted Project IDs and their associated users.
                  </p>
                  
                  {projects.filter(p => p.status === "SUSPENDED" || p.status === "DELETED").length > 0 ? (
                    <div style={{ display: "grid", gap: "16px" }}>
                      {projects.filter(p => p.status === "SUSPENDED" || p.status === "DELETED").map((proj) => {
                        const associatedUsers = users.filter(u => u.project_uuid === proj.project_uuid || u.project_id === proj.project_id);
                        return (
                          <div key={proj.project_uuid} style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            padding: "16px",
                            background: "#f8fafc"
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                              <div>
                                <span className={`status-badge ${proj.status.toLowerCase()}`} style={{ marginRight: "8px" }}>
                                  {proj.status}
                                </span>
                                <strong style={{ color: "#0f172a", fontSize: "14px" }}>{proj.project_id} - {proj.project_name}</strong>
                              </div>
                              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                <div style={{ fontSize: "12px", color: "#64748b" }}>
                                  Leader: <strong>{proj.team_leader_name || "None"}</strong>
                                </div>
                                <button
                                  className="btn-sm"
                                  onClick={() => handleToggleProjectStatus(proj.project_uuid)}
                                  style={{ padding: "4px 10px", fontSize: "11px" }}
                                >
                                  {proj.status === "SUSPENDED" ? "Activate" : "Suspend"}
                                </button>
                              </div>
                            </div>
                            
                            <div style={{ marginTop: "10px" }}>
                              <div style={{ fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Associated Users:</div>
                              {associatedUsers.length > 0 ? (
                                <div style={{ display: "grid", gap: "8px" }}>
                                  {associatedUsers.map(u => (
                                    <div key={u.id} style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      fontSize: "12px",
                                      padding: "8px 12px",
                                      background: "white",
                                      border: "1px solid #f1f5f9",
                                      borderRadius: "6px",
                                      flexWrap: "wrap",
                                      gap: "8px"
                                    }}>
                                      <div>
                                        <strong style={{ color: "#1e293b" }}>{u.name}</strong> <span style={{ color: "#64748b" }}>({u.email})</span>
                                      </div>
                                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                        <span className={`role-badge ${u.role.toLowerCase()}`} style={{ fontSize: "10px", padding: "2px 6px" }}>{u.role}</span>
                                        <span className={`status-badge ${u.status.toLowerCase()}`} style={{ fontSize: "10px", padding: "2px 6px" }}>{u.status}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>
                                  No users associated with this project.
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{
                      padding: "16px",
                      background: "#f1f5f9",
                      borderRadius: "8px",
                      fontSize: "13px",
                      color: "#64748b",
                      textAlign: "center"
                    }}>
                      No suspended or deleted projects found.
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN: Sidebar Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px", minWidth: 0 }}>
              
              {/* ITEMS REQUIRING ATTENTION */}
              <div className="admin-card" style={{ borderLeft: "4px solid #ef4444" }}>
                <h3 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                  Items Requiring Attention
                </h3>
                <div style={{ display: "grid", gap: "10px" }}>
                  {pendingOnboardingCount > 0 ? (
                    <div
                      onClick={() => setActiveTab("onboarding")}
                      style={{
                        padding: "10px 12px",
                        background: "#fee2e2",
                        border: "1px solid #fecaca",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "13px",
                        color: "#991b1b",
                        fontWeight: "600",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <span>{pendingOnboardingCount} Pending Onboarding Requests</span>
                      <span>→</span>
                    </div>
                  ) : null}

                  {pendingUsersCount > 0 ? (
                    <div
                      onClick={() => { setStatusFilter("Pending"); }}
                      style={{
                        padding: "10px 12px",
                        background: "#ffedd5",
                        border: "1px solid #fed7aa",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "13px",
                        color: "#c2410c",
                        fontWeight: "600",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <span>{pendingUsersCount} Pending Users Approval</span>
                      <span>→</span>
                    </div>
                  ) : null}

                  {pendingOnboardingCount === 0 && pendingUsersCount === 0 ? (
                    <div style={{
                      padding: "12px",
                      background: "#dcfce7",
                      border: "1px solid #bbf7d0",
                      borderRadius: "8px",
                      fontSize: "13px",
                      color: "#166534",
                      display: "flex",
                      gap: "8px",
                      alignItems: "center"
                    }}>
                      <span style={{ fontSize: "16px" }}>✓</span>
                      <span>All caught up! No pending actions require approval.</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* RECENTLY ADDED USERS */}
              <div className="admin-card">
                <h3 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: "700", color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                  Recently Added Users
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  {recentlyAddedUsers.map((u) => (
                    <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                      <div>
                        <div style={{ fontWeight: "600", color: "#0f172a" }}>{u.name}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                          {u.role} &bull; Project: {u.project_id}
                        </div>
                      </div>
                      <span className={`status-badge ${u.status.toLowerCase()}`} style={{ padding: "4px 8px", fontSize: "10px" }}>
                        {u.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </>
      )}

      {/* TAB 2: CREATE & MANAGE */}
      {activeTab === "manage" && (
        <>
          {/* 1. CREATE DETAILS / PROJECTS CARD */}
          <section className="admin-card" style={{ marginBottom: "24px" }}>
            <h2>Create New Project Workspace</h2>
            <div className="form-grid">
              <input
                name="project_id"
                value={projectForm.project_id}
                onChange={(e) => setProjectForm((prev) => ({ ...prev, project_id: e.target.value }))}
                placeholder="Project ID (e.g. PROJ-2026-003)"
              />
              <input
                name="title"
                value={projectForm.title}
                onChange={(e) => setProjectForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Project Name (e.g. Project Name Test)"
              />
            </div>
            <div className="form-actions" style={{ marginTop: "14px" }}>
              <button onClick={saveProject} className="btn-primary">
                Create Project
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setProjectForm({ project_id: "", title: "" })}
              >
                Clear
              </button>
            </div>
          </section>

          {/* 2. CREATE USER (EXISTING LAYOUT) */}
          <section className="admin-card">
            <h2>{editingUserId ? "Edit User Details" : "Create New User Account"}</h2>
            
            {/* CONFIRMATION CARD FOR NEWLY CREATED CREDENTIALS */}
            {lastCreatedUser && (
              <div style={{
                background: "#eff6ff",
                border: "1px solid #bfd3ff",
                borderRadius: "10px",
                padding: "16px",
                marginBottom: "24px",
                position: "relative"
              }}>
                <button
                  onClick={() => setLastCreatedUser(null)}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "bold",
                    color: "#0f5aff",
                    fontSize: "14px"
                  }}
                >
                  ✕
                </button>
                <h3 style={{ margin: "0 0 10px 0", color: "#1e3a8a", fontSize: "14px", fontWeight: "700" }}>
                  ✓ User Account Created Successfully
                </h3>
                <div style={{ fontSize: "13px", color: "#1e40af", display: "grid", gap: "6px" }}>
                  <div><strong>Name:</strong> {lastCreatedUser.name}</div>
                  <div><strong>Email Address:</strong> {lastCreatedUser.email}</div>
                  <div><strong>Temporary Password:</strong> <code style={{ background: "#dbeafe", padding: "2px 6px", borderRadius: "4px" }}>{lastCreatedUser.password}</code></div>
                  <div><strong>Project ID:</strong> {lastCreatedUser.project_id}</div>
                </div>
                <p style={{ margin: "10px 0 0 0", fontSize: "11px", color: "#3b82f6" }}>
                  Copy these credentials. An onboarding welcome email has also been queued.
                </p>
              </div>
            )}

            <div className="form-grid">
              <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" />
              
              <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  style={{ flex: 1 }}
                />
                <input
                  name="contact_number"
                  value={form.contact_number}
                  onChange={handleChange}
                  placeholder="Contact Number"
                  style={{ flex: 1 }}
                />
              </div>

              <select name="status" value={form.status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
                <option value="Deactivated">Deactivated</option>
                <option value="Blocked">Blocked</option>
              </select>

              <input
                name="project_id"
                value={form.project_id}
                onChange={handleChange}
                placeholder="Enter Project ID (e.g. PROJ-2026-001)"
              />

              <input name="joining_date" type="date" value={form.joining_date} onChange={handleChange} title="Joining Date" />
              
              {!editingUserId && (
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Password (Optional - Defaults to welcome setup)"
                    style={{ width: "100%", paddingRight: "40px", boxSizing: "border-box" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#64748b",
                      fontSize: "16px",
                      padding: "0"
                    }}
                  >
                    {showPassword ? "👁️" : "🙈"}
                  </button>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button onClick={saveUser} className="btn-primary">
                {editingUserId ? "Save Changes" : "Create User"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditingUserId(null);
                  setForm(emptyForm);
                  setFormTeams([]);
                  setMessage("");
                  setIsError(false);
                  setLastCreatedUser(null);
                  setActiveTab("overview");
                }}
              >
                Cancel
              </button>
            </div>
          </section>

          {/* 3. DETAILS OF THE USER CREATED (SESSION HISTORY) */}
          {manuallyCreatedUsers.length > 0 && (
            <section className="admin-card" style={{ marginTop: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px", marginBottom: "14px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                  Recently Created Users
                </h3>
                <button onClick={clearManualHistory} className="btn-sm danger" style={{ background: "#ef4444", color: "white", padding: "6px 12px" }}>
                  Clear History
                </button>
              </div>
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Contact Number</th>
                      <th>Password</th>
                      <th>Project ID</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manuallyCreatedUsers.map((u) => {
                      const showPwd = !!visiblePasswords[u.id];
                      return (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 600 }}>{u.name}</td>
                          <td>{u.email}</td>
                          <td>{u.contact_number}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "12px" }}>
                                {showPwd ? u.password : "••••••••"}
                              </code>
                              <button
                                type="button"
                                onClick={() => toggleVisiblePassword(u.id)}
                                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", padding: 0 }}
                              >
                                {showPwd ? "👁️" : "🙈"}
                              </button>
                            </div>
                          </td>
                          <td><span className="role-badge" style={{ background: "#e0f2fe", color: "#0369a1" }}>{u.project_id}</span></td>
                          <td><span className={`status-badge ${u.status.toLowerCase()}`}>{u.status}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {/* TAB 3: PROJECTS & TEAMS */}
      {activeTab === "projects" && (
        <section className="admin-card">
          <h2>Projects & Teams</h2>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "-10px", marginBottom: "20px" }}>
            Click on any card to view detailed members, leaders, summaries, and activity.
          </p>

          {/* Project Card Grid Scroll Wrapper */}
          <div className="projects-teams-scroll-container">
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
              minWidth: "750px" /* Ensures scrollbar shows when screen width is smaller than 750px */
            }}>
              {projects.map((proj) => (
                <div
                  key={proj.project_uuid}
                  onClick={() => handleProjectCardClick(proj.project_uuid)}
                  className="stat-card"
                  style={{
                    cursor: "pointer",
                    borderLeft: "4px solid #0f5aff",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    position: "relative"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.06)";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <span className="role-badge" style={{ background: "#e0f2fe", color: "#0369a1" }}>{proj.project_id}</span>
                    <span className={`status-badge ${proj.status.toLowerCase()}`}>{proj.status}</span>
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 10px 0", color: "#0f172a" }}>
                    {proj.project_name}
                  </h3>
                  <div style={{ fontSize: "13px", color: "#64748b", display: "grid", gap: "6px" }}>
                    <div><strong>Leader:</strong> {proj.team_leader_name}</div>
                    <div><strong>Members:</strong> {proj.member_count}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TAB 4: ONBOARDING REQUESTS */}
      {activeTab === "onboarding" && (
        <section className="admin-card">
          <h2>Onboarding Requests</h2>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "-10px", marginBottom: "20px" }}>
            Real-time invitations issued by Team Leaders pending your administrative approval.
          </p>

          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Teammate Name</th>
                  <th>Email Address</th>
                  <th>Requested By (Team Leader)</th>
                  <th>Project ID</th>
                  <th>Team</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {onboardingRequests.length > 0 ? (
                  onboardingRequests.map((req) => (
                    <tr key={req.id}>
                      <td style={{ fontWeight: 600 }}>{req.name}</td>
                      <td>{req.email}</td>
                      <td>{req.requested_by}</td>
                      <td><span className="role-badge">{req.project_id}</span></td>
                      <td>{req.team_name}</td>
                      <td>
                        <span className={`status-badge ${req.status.toLowerCase() === "pending_approval" ? "pending" : req.status.toLowerCase()}`}>
                          {req.status}
                        </span>
                      </td>
                      <td>
                        {req.status === "PENDING_APPROVAL" ? (
                          <div className="action-buttons">
                            <button
                              className="btn-sm"
                              style={{ background: "#22c55e", color: "white", borderColor: "#22c55e" }}
                              onClick={() => handleApproveOnboarding(req.id)}
                            >
                              Approve
                            </button>
                            <button
                              className="btn-sm danger"
                              style={{ background: "#ef4444", color: "white", borderColor: "#ef4444" }}
                              onClick={() => handleRejectOnboarding(req.id)}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>No actions available</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      No onboarding requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* VIEW PROFILE MODAL OVERLAY */}
      {profileTargetUser && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(15, 23, 42, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div style={{
            background: "white",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "500px",
            padding: "24px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            position: "relative"
          }}>
            <button
              onClick={() => setProfileTargetUser(null)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                cursor: "pointer",
                fontWeight: "bold",
                color: "#64748b"
              }}
            >
              ✕
            </button>
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: "0 0 16px 0", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
              User Profile
            </h2>
            <div style={{ display: "grid", gap: "12px", fontSize: "14px" }}>
              <div><strong>Full Name:</strong> {profileTargetUser.name}</div>
              <div><strong>Email Address:</strong> {profileTargetUser.email}</div>
              <div><strong>Contact Number:</strong> {profileTargetUser.contact_number || "None"}</div>
              <div><strong>System Role:</strong> <span className={`role-badge ${profileTargetUser.role.toLowerCase()}`}>{profileTargetUser.role}</span></div>
              <div><strong>Department:</strong> {profileTargetUser.department}</div>
              <div><strong>Project ID:</strong> {profileTargetUser.project_id}</div>
              <div><strong>Team Workspace:</strong> {profileTargetUser.team}</div>
              <div><strong>Joining Date:</strong> {profileTargetUser.joining_date || "Not Set"}</div>
              <div>
                <strong>Status:</strong> <span className={`status-badge ${profileTargetUser.status.toLowerCase()}`}>{profileTargetUser.status}</span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
              <button onClick={() => setProfileTargetUser(null)} className="btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PROJECT/TEAM MODAL OVERLAY */}
      {assignTargetUser && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(15, 23, 42, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div style={{
            background: "white",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "450px",
            padding: "24px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
          }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: "0 0 16px 0", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
              Change Project/Team: {assignTargetUser.name}
            </h2>
            <div style={{ display: "grid", gap: "16px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>
                Enter Project ID / Code:
                <input
                  type="text"
                  value={assignProjectId}
                  onChange={(e) => setAssignProjectId(e.target.value)}
                  placeholder="e.g. PROJ-2026-001"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #dbe2ea", marginTop: "6px", boxSizing: "border-box" }}
                />
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
              <button onClick={() => setAssignTargetUser(null)} className="btn-secondary" style={{ padding: "8px 16px" }}>
                Cancel
              </button>
              <button onClick={saveProjectTeamAssignment} className="btn-primary" style={{ padding: "8px 16px" }}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW ACTIVITY MODAL OVERLAY */}
      {activityTargetUser && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(15, 23, 42, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div style={{
            background: "white",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "600px",
            padding: "24px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            position: "relative"
          }}>
            <button
              onClick={() => setActivityTargetUser(null)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                cursor: "pointer",
                fontWeight: "bold",
                color: "#64748b"
              }}
            >
              ✕
            </button>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: "0 0 16px 0", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
              Activity Log: {activityTargetUser.name}
            </h2>
            <div style={{ maxHeight: "300px", overflowY: "auto", fontSize: "13px" }}>
              {activityLoading ? (
                <div style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>Loading logs...</div>
              ) : userActivityLogs.length > 0 ? (
                userActivityLogs.map((log) => (
                  <div key={log.id} style={{ padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", color: "#0f172a" }}>
                      <span>{log.action}</span>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                      Target: {log.entity} &bull; Remarks: {log.remarks}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>No recent logs found.</div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
              <button onClick={() => setActivityTargetUser(null)} className="btn-primary">
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROJECT DETAILED MODAL OVERLAY */}
      {selectedProject && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(15, 23, 42, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div style={{
            background: "white",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "900px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "24px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            position: "relative"
          }}>
            <button
              onClick={() => setSelectedProject(null)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                cursor: "pointer",
                fontWeight: "bold",
                color: "#64748b"
              }}
            >
              ✕
            </button>

            <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "20px" }}>
              <span className="role-badge" style={{ marginBottom: "8px" }}>{selectedProject.project_id}</span>
              <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                {selectedProject.title}
              </h2>
            </div>

            {/* Member List */}
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#0f172a", marginBottom: "12px" }}>
                Team Members List
              </h3>
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Joining Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProject.members.length > 0 ? (
                      selectedProject.members.map((m) => (
                        <tr key={m.id}>
                          <td style={{ fontWeight: 600 }}>{m.name}</td>
                          <td>{m.email}</td>
                          <td><span className="role-badge">{m.role}</span></td>
                          <td>{m.department}</td>
                          <td><span className={`status-badge ${m.status.toLowerCase()}`}>{m.status}</span></td>
                          <td>{m.joining_date}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="empty-state">No members in this project yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed sections grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
              marginTop: "20px"
            }}>
              {/* Team Leader & Project Info */}
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>Project Information</h4>
                <div style={{ fontSize: "13px", display: "grid", gap: "8px", color: "#475569" }}>
                  <div><strong>Mentor:</strong> {selectedProject.mentor_name}</div>
                  <div><strong>Timeline:</strong> {selectedProject.start_date} to {selectedProject.end_date}</div>
                  <div><strong>Description:</strong> {selectedProject.description}</div>
                </div>
              </div>

              {/* Team Member Summary */}
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>Team Member Summary</h4>
                <div style={{ fontSize: "13px", display: "grid", gap: "6px", color: "#475569" }}>
                  <div><strong>Total Members:</strong> {selectedProject.summary.total_members}</div>
                  <div>
                    <strong>Roles Breakdown:</strong>
                    <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                      {Object.entries(selectedProject.summary.roles).map(([role, count]) => (
                        <li key={role}>{role}: {count}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", gridColumn: "span 2" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>Recent Team Activity</h4>
                <div style={{ maxHeight: "150px", overflowY: "auto", fontSize: "12px" }}>
                  {selectedProject.recent_activity.length > 0 ? (
                    selectedProject.recent_activity.map((act) => (
                      <div key={act.id} style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", marginBottom: "6px" }}>
                        <span style={{ color: "#0f5aff", fontWeight: 600 }}>{act.user_name}</span> - <strong>{act.action}</strong> ({act.entity})
                        <p style={{ margin: "2px 0", color: "#64748b" }}>{act.remarks}</p>
                        <span style={{ fontSize: "10px", color: "#94a3b8" }}>{new Date(act.timestamp).toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: "#94a3b8" }}>No recent audit activity found.</div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
              <button onClick={() => setSelectedProject(null)} className="btn-primary">
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD RESET MODAL POPUP */}
      {resetTargetUser && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(15, 23, 42, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "white",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "400px",
            padding: "20px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
          }}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#0f172a", marginBottom: "10px" }}>
              Reset Password for {resetTargetUser.name}
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "15px" }}>
              Enter a custom password below, or leave it blank to automatically generate a secure temporary password.
            </p>
            <input
              type="password"
              placeholder="New password (optional)"
              value={resetPasswordInput}
              onChange={(e) => setResetPasswordInput(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #dbe2ea",
                borderRadius: "8px",
                marginBottom: "20px",
                boxSizing: "border-box"
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setResetTargetUser(null)} className="btn-secondary" style={{ padding: "8px 16px" }}>
                Cancel
              </button>
              <button onClick={savePasswordReset} className="btn-primary" style={{ padding: "8px 16px" }}>
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default AdminUsers;

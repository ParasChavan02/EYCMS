import { useMemo, useState } from "react";
import "../../../styles/admin-management.css";

function AdminUsers() {
  const emptyForm = {
    name: "",
    email: "",
    department: "",
    role: "USER",
    status: "Active",
    createdDate: "2026-05-31",
  };

  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [editingUserId, setEditingUserId] = useState(null);
  const [users, setUsers] = useState([
    { id: 1, name: "Manas Pandya", email: "manas@eyuva.com", department: "Administration", role: "ADMIN", active: true, status: "Active", createdDate: "2026-02-03" },
    { id: 2, name: "Purva Kalkute", email: "purva@eyuva.com", department: "HR", role: "USER", active: true, status: "Pending", createdDate: "2026-05-12" },
    { id: 3, name: "Paras Chavan", email: "paras@eyuva.com", department: "Finance", role: "USER", active: true, status: "Active", createdDate: "2026-01-25" },
    { id: 4, name: "Rahul Sharma", email: "rahul@eyuva.com", department: "Operations", role: "USER", active: false, status: "Inactive", createdDate: "2025-12-09" },
  ]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveUser = () => {
    setMessage("");
    if (!form.name || !form.email || !form.department) {
      setMessage("Please fill all required fields");
      return;
    }

    const existingUser = users.find((user) => user.email === form.email && user.id !== editingUserId);
    if (existingUser) {
      setMessage("A user with this email already exists");
      return;
    }

    if (editingUserId) {
      setUsers((current) =>
        current.map((user) =>
          user.id === editingUserId ? { ...user, ...form, active: form.status === "Active" } : user
        )
      );
      setMessage("User updated successfully");
    } else {
      setUsers((current) => [
        ...current,
        { id: current.length + 1, ...form, active: form.status === "Active" },
      ]);
      setMessage("User added successfully");
    }

    setEditingUserId(null);
    setForm(emptyForm);
  };

  const deleteUser = (id) => {
    setUsers((current) => current.filter((user) => user.id !== id));
    setMessage("User deleted successfully");
  };

  const editUser = (user) => {
    setEditingUserId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role,
      status: user.status,
      createdDate: user.createdDate,
    });
    setMessage("");
  };

  const toggleStatus = (id) => {
    setUsers((current) =>
      current.map((user) => {
        if (user.id !== id) {
          return user;
        }
        const nextStatus = user.active ? "Inactive" : "Active";
        return { ...user, active: !user.active, status: nextStatus };
      })
    );
    setMessage("User status updated");
  };

  const resetPassword = () => {
    setMessage("Password reset email queued for the selected user");
  };

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesSearch = [user.name, user.email, user.department].join(" ").toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
        const matchesStatus = statusFilter === "ALL" || user.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
      }),
    [users, search, roleFilter, statusFilter]
  );

  const userSummary = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => user.status === "Active").length,
      pending: users.filter((user) => user.status === "Pending").length,
      inactive: users.filter((user) => user.status === "Inactive").length,
    }),
    [users]
  );

  return (
    <main className="admin-page">
      <section className="admin-header">
        <h1>Users Management</h1>
        <p>Manage ERP users, role assignments, account status, and password reset workflows.</p>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{userSummary.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Users</div>
          <div className="stat-value">{userSummary.active}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Approval</div>
          <div className="stat-value">{userSummary.pending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Inactive Users</div>
          <div className="stat-value">{userSummary.inactive}</div>
        </div>
      </section>

      <section className="admin-card">
        <h2>{editingUserId ? "Edit User" : "Add New User"}</h2>
        <div className="form-grid">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" />
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email Address" />
          <select name="department" value={form.department} onChange={handleChange}>
            <option value="">Select Department</option>
            <option value="Finance">Finance</option>
            <option value="Operations">Operations</option>
            <option value="HR">HR</option>
            <option value="Administration">Administration</option>
          </select>
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>
          <input name="createdDate" type="date" value={form.createdDate} onChange={handleChange} />
        </div>
        <div className="form-actions">
          <button onClick={saveUser} className="btn-primary">
            {editingUserId ? "Save Changes" : "Add User"}
          </button>
          {editingUserId && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setEditingUserId(null);
                setForm(emptyForm);
                setMessage("");
              }}
            >
              Cancel
            </button>
          )}
        </div>
        {message && <div className={`form-message ${message.includes("Please") || message.includes("exists") ? "error" : "success"}`}>{message}</div>}
      </section>

      <section className="admin-card">
        <div className="table-header">
          <input type="text" placeholder="Search users..." value={search} onChange={(event) => setSearch(event.target.value)} className="search-input" />
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="filter-select">
            <option value="ALL">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="USER">USER</option>
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="filter-select">
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role.toLowerCase()}`}>{user.role}</span>
                    </td>
                    <td>{user.department}</td>
                    <td>
                      <span className={`status-badge ${user.status.toLowerCase()}`}>{user.status}</span>
                    </td>
                    <td>{user.createdDate}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-sm" onClick={() => editUser(user)}>
                          Edit
                        </button>
                        <button className="btn-sm" onClick={() => toggleStatus(user.id)}>
                          {user.active ? "Deactivate" : "Activate"}
                        </button>
                        <button className="btn-sm" onClick={() => resetPassword(user.id)}>
                          Reset Password
                        </button>
                        <button className="btn-sm danger" onClick={() => deleteUser(user.id)}>
                          Delete
                        </button>
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
      </section>
    </main>
  );
}

export default AdminUsers;


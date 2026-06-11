import { useMemo, useState } from "react";
import "../../../styles/admin-management.css";

/**
 * AdminRoles Component
 * Manage user roles, system permissions scopes, and status.
 */
function AdminRoles() {
  const emptyForm = {
    name: "",
    description: "",
    status: "Active",
    scopes: [],
  };

  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [editingRoleId, setEditingRoleId] = useState(null);
  
  const [roles, setRoles] = useState([
    { id: 1, name: "ADMIN", description: "Full administrative access to all systems, user management, configurations, and logs.", scopes: ["User Management", "Finance", "Operations", "Support", "System Config"], status: "Active", isSystem: true, createdDate: "2026-01-01" },
    { id: 2, name: "ACCOUNTS", description: "Access to finance, reconciliation, budget heads, and transaction workflows.", scopes: ["Finance", "Operations"], status: "Active", isSystem: false, createdDate: "2026-01-10" },
    { id: 3, name: "USER", description: "General workspace access for standard actions, profile management, and dashboard widgets.", scopes: ["Operations"], status: "Active", isSystem: true, createdDate: "2026-01-15" },
    { id: 4, name: "AUDITOR", description: "Read-only access to audit logs, reports, and transactional histories for review.", scopes: ["Operations", "System Config"], status: "Inactive", isSystem: false, createdDate: "2026-02-18" },
  ]);

  const availableScopes = [
    "User Management",
    "Finance",
    "Operations",
    "Support",
    "System Config"
  ];

  const handleScopeChange = (scope) => {
    setForm(prev => {
      const isChecked = prev.scopes.includes(scope);
      const newScopes = isChecked 
        ? prev.scopes.filter(s => s !== scope) 
        : [...prev.scopes, scope];
      return { ...prev, scopes: newScopes };
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveRole = () => {
    setMessage("");
    if (!form.name || !form.description) {
      setMessage("Please fill all required fields");
      return;
    }

    const nameUpper = form.name.trim().toUpperCase();
    const existingRole = roles.find((role) => role.name.toUpperCase() === nameUpper && role.id !== editingRoleId);
    if (existingRole) {
      setMessage("A role with this name already exists");
      return;
    }

    if (editingRoleId) {
      setRoles((current) =>
        current.map((role) =>
          role.id === editingRoleId ? { ...role, ...form, name: nameUpper } : role
        )
      );
      setMessage("Role updated successfully");
    } else {
      setRoles((current) => [
        ...current,
        { 
          id: current.length + 1, 
          ...form, 
          name: nameUpper,
          isSystem: false, 
          createdDate: new Date().toISOString().split("T")[0] 
        },
      ]);
      setMessage("Role added successfully");
    }

    setEditingRoleId(null);
    setForm(emptyForm);
  };

  const deleteRole = (id) => {
    const roleToDelete = roles.find(r => r.id === id);
    if (roleToDelete?.isSystem) {
      setMessage("System roles cannot be deleted");
      return;
    }
    setRoles((current) => current.filter((role) => role.id !== id));
    setMessage("Role deleted successfully");
  };

  const editRole = (role) => {
    setEditingRoleId(role.id);
    setForm({
      name: role.name,
      description: role.description,
      status: role.status,
      scopes: [...role.scopes],
    });
    setMessage("");
  };

  const toggleStatus = (id) => {
    setRoles((current) =>
      current.map((role) => {
        if (role.id !== id) {
          return role;
        }
        const nextStatus = role.status === "Active" ? "Inactive" : "Active";
        return { ...role, status: nextStatus };
      })
    );
    setMessage("Role status updated");
  };

  const filteredRoles = useMemo(
    () =>
      roles.filter((role) => {
        const matchesSearch = [role.name, role.description].join(" ").toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || role.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [roles, search, statusFilter]
  );

  const stats = useMemo(
    () => ({
      total: roles.length,
      active: roles.filter((r) => r.status === "Active").length,
      system: roles.filter((r) => r.isSystem).length,
      inactive: roles.filter((r) => r.status === "Inactive").length,
    }),
    [roles]
  );

  return (
    <main className="admin-page">
      <section className="admin-header">
        <h1>Admin Roles Management</h1>
        <p>Define ERP user roles, assign permission scopes, configure system boundaries, and control active roles.</p>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Roles</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Roles</div>
          <div className="stat-value">{stats.active}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">System Roles</div>
          <div className="stat-value">{stats.system}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Inactive Roles</div>
          <div className="stat-value">{stats.inactive}</div>
        </div>
      </section>

      <section className="admin-card">
        <h2>{editingRoleId ? "Edit Role" : "Add New Role"}</h2>
        <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>Role Name</label>
            <input 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              placeholder="e.g. AUDITOR" 
              disabled={editingRoleId && roles.find(r => r.id === editingRoleId)?.isSystem}
            />
            {editingRoleId && roles.find(r => r.id === editingRoleId)?.isSystem && (
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>System role names cannot be modified.</span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "12px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>Description</label>
            <input name="description" value={form.description} onChange={handleChange} placeholder="Describe the purpose of this role..." />
          </div>
        </div>
        
        <div style={{ marginTop: "20px", marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#475569", marginBottom: "12px" }}>Associated Permissions Scopes</label>
          <div className="config-grid two-column">
            {availableScopes.map((scope) => (
              <div key={scope} className="config-option" style={{ padding: "12px 16px" }}>
                <div>
                  <p className="config-option-title" style={{ margin: 0, fontSize: "14px" }}>{scope}</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={form.scopes.includes(scope)} 
                  onChange={() => handleScopeChange(scope)}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button onClick={saveRole} className="btn-primary">
            {editingRoleId ? "Save Changes" : "Add Role"}
          </button>
          {editingRoleId && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setEditingRoleId(null);
                setForm(emptyForm);
                setMessage("");
              }}
            >
              Cancel
            </button>
          )}
        </div>
        {message && <div className={`form-message ${message.includes("Please") || message.includes("exists") || message.includes("System") ? "error" : "success"}`}>{message}</div>}
      </section>

      <section className="admin-card">
        <div className="table-header">
          <input type="text" placeholder="Search roles..." value={search} onChange={(event) => setSearch(event.target.value)} className="search-input" />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="filter-select">
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Role Name</th>
                <th>Description</th>
                <th>Permissions Scopes</th>
                <th>Type</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.length > 0 ? (
                filteredRoles.map((role) => (
                  <tr key={role.id}>
                    <td style={{ fontWeight: "600" }}>{role.name}</td>
                    <td style={{ maxWidth: "300px" }}>{role.description}</td>
                    <td>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {role.scopes.map(s => (
                          <span key={s} className="role-badge" style={{ textTransform: "none", fontSize: "10px", padding: "3px 6px" }}>
                            {s}
                          </span>
                        ))}
                        {role.scopes.length === 0 && <span style={{ color: "#94a3b8", fontSize: "12px" }}>None</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${role.isSystem ? "pending" : "low"}`} style={{ textTransform: "none" }}>
                        {role.isSystem ? "System" : "Custom"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${role.status.toLowerCase()}`}>{role.status}</span>
                    </td>
                    <td>{role.createdDate}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-sm" onClick={() => editRole(role)}>
                          Edit
                        </button>
                        <button className="btn-sm" onClick={() => toggleStatus(role.id)}>
                          {role.status === "Active" ? "Deactivate" : "Activate"}
                        </button>
                        {!role.isSystem && (
                          <button className="btn-sm danger" onClick={() => deleteRole(role.id)}>
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No roles found
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

export default AdminRoles;

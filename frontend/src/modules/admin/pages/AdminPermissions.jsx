import { useMemo, useState } from "react";
import "../../../styles/admin-management.css";

/**
 * AdminPermissions Component
 * Manage fine-grained permission codes, descriptions, categories, and active status.
 */
function AdminPermissions() {
  const emptyForm = {
    code: "",
    name: "",
    category: "User Management",
    description: "",
    status: "Active",
  };

  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [editingPermissionId, setEditingPermissionId] = useState(null);

  const [permissions, setPermissions] = useState([
    { id: 1, code: "user:read", name: "Read User Data", category: "User Management", description: "Allows reading user profile details and list.", status: "Active", isSystem: true },
    { id: 2, code: "user:write", name: "Write User Data", category: "User Management", description: "Allows creating, updating and deleting user accounts.", status: "Active", isSystem: true },
    { id: 3, code: "user:reset_pass", name: "Reset User Passwords", category: "User Management", description: "Allows initiating administrative password resets.", status: "Active", isSystem: true },
    { id: 4, code: "finance:read", name: "Read Finance Data", category: "Finance", description: "Allows viewing budget heads and transaction ledgers.", status: "Active", isSystem: true },
    { id: 5, code: "finance:write", name: "Write Finance Data", category: "Finance", description: "Allows adding budget heads and editing transaction records.", status: "Active", isSystem: true },
    { id: 6, code: "finance:approve", name: "Approve Transactions", category: "Finance", description: "Allows approving budget releases and reconciliation orders.", status: "Active", isSystem: true },
    { id: 7, code: "finance:reconcile", name: "Perform Reconciliation", category: "Finance", description: "Allows reconciling bank sheets and digital receipts.", status: "Active", isSystem: false },
    { id: 8, code: "ops:events", name: "Manage Operations Events", category: "Operations", description: "Allows organizing and modifying university events.", status: "Active", isSystem: true },
    { id: 9, code: "ops:reports", name: "Generate Reports", category: "Operations", description: "Allows access to export reports and run operations analytics.", status: "Active", isSystem: false },
    { id: 10, code: "ops:audit", name: "View Audit Logs", category: "Operations", description: "Allows viewing system-wide security audits and activity logs.", status: "Active", isSystem: true },
    { id: 11, code: "support:manage", name: "Manage Support Tickets", category: "Support", description: "Allows reviewing, assigning, and resolving support issues.", status: "Active", isSystem: false },
    { id: 12, code: "system:config", name: "Modify System Config", category: "System Config", description: "Allows changing email settings, system integrations, and backup tasks.", status: "Inactive", isSystem: true },
  ]);

  const categories = [
    "User Management",
    "Finance",
    "Operations",
    "Support",
    "System Config"
  ];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const savePermission = () => {
    setMessage("");
    if (!form.code || !form.name || !form.description) {
      setMessage("Please fill all required fields");
      return;
    }

    const codeClean = form.code.trim().toLowerCase();
    const existingPermission = permissions.find(
      (perm) => perm.code.toLowerCase() === codeClean && perm.id !== editingPermissionId
    );
    if (existingPermission) {
      setMessage("A permission with this code already exists");
      return;
    }

    if (editingPermissionId) {
      setPermissions((current) =>
        current.map((perm) =>
          perm.id === editingPermissionId ? { ...perm, ...form, code: codeClean } : perm
        )
      );
      setMessage("Permission updated successfully");
    } else {
      setPermissions((current) => [
        ...current,
        { 
          id: current.length + 1, 
          ...form, 
          code: codeClean,
          isSystem: false 
        },
      ]);
      setMessage("Permission added successfully");
    }

    setEditingPermissionId(null);
    setForm(emptyForm);
  };

  const deletePermission = (id) => {
    const permToDelete = permissions.find(p => p.id === id);
    if (permToDelete?.isSystem) {
      setMessage("System permissions cannot be deleted");
      return;
    }
    setPermissions((current) => current.filter((perm) => perm.id !== id));
    setMessage("Permission deleted successfully");
  };

  const editPermission = (perm) => {
    setEditingPermissionId(perm.id);
    setForm({
      code: perm.code,
      name: perm.name,
      category: perm.category,
      description: perm.description,
      status: perm.status,
    });
    setMessage("");
  };

  const toggleStatus = (id) => {
    setPermissions((current) =>
      current.map((perm) => {
        if (perm.id !== id) {
          return perm;
        }
        const nextStatus = perm.status === "Active" ? "Inactive" : "Active";
        return { ...perm, status: nextStatus };
      })
    );
    setMessage("Permission status updated");
  };

  const filteredPermissions = useMemo(
    () =>
      permissions.filter((perm) => {
        const matchesSearch = [perm.code, perm.name, perm.description].join(" ").toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter === "ALL" || perm.category === categoryFilter;
        const matchesStatus = statusFilter === "ALL" || perm.status === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
      }),
    [permissions, search, categoryFilter, statusFilter]
  );

  const stats = useMemo(
    () => ({
      total: permissions.length,
      user: permissions.filter((p) => p.category === "User Management").length,
      finance: permissions.filter((p) => p.category === "Finance").length,
      ops: permissions.filter((p) => p.category === "Operations").length,
      support: permissions.filter((p) => p.category === "Support").length,
      system: permissions.filter((p) => p.category === "System Config").length,
    }),
    [permissions]
  );

  return (
    <main className="admin-page">
      <section className="admin-header">
        <h1>Admin Permissions Management</h1>
        <p>Assign and catalog fine-grained security policies, module capability levels, and route keys for system boundary control.</p>
      </section>

      <section className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <div className="stat-card">
          <div className="stat-label">Total Perms</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">User Mgmt</div>
          <div className="stat-value">{stats.user}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Finance</div>
          <div className="stat-value">{stats.finance}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Operations</div>
          <div className="stat-value">{stats.ops}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Support</div>
          <div className="stat-value">{stats.support}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">System config</div>
          <div className="stat-value">{stats.system}</div>
        </div>
      </section>

      <section className="admin-card">
        <h2>{editingPermissionId ? "Edit Permission Policy" : "Add New Permission Policy"}</h2>
        <div className="form-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>Code / Identifier</label>
            <input 
              name="code" 
              value={form.code} 
              onChange={handleChange} 
              placeholder="e.g. system:backup" 
              disabled={editingPermissionId && permissions.find(p => p.id === editingPermissionId)?.isSystem}
            />
            {editingPermissionId && permissions.find(p => p.id === editingPermissionId)?.isSystem && (
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>System keys cannot be changed.</span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>Display Name</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Execute Backup" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>Category</label>
            <select name="category" value={form.category} onChange={handleChange}>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>Description</label>
            <input name="description" value={form.description} onChange={handleChange} placeholder="Briefly describe what capabilities this permission grants..." />
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: "16px" }}>
          <button onClick={savePermission} className="btn-primary">
            {editingPermissionId ? "Save Changes" : "Add Permission"}
          </button>
          {editingPermissionId && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setEditingPermissionId(null);
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
          <input type="text" placeholder="Search permission code, name, or description..." value={search} onChange={(event) => setSearch(event.target.value)} className="search-input" />
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="filter-select">
            <option value="ALL">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
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
                <th>Code / Identifier</th>
                <th>Display Name</th>
                <th>Category</th>
                <th>Description</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPermissions.length > 0 ? (
                filteredPermissions.map((perm) => (
                  <tr key={perm.id}>
                    <td style={{ fontFamily: "monospace", fontWeight: "600", color: "#0f5aff" }}>{perm.code}</td>
                    <td style={{ fontWeight: "500" }}>{perm.name}</td>
                    <td>
                      <span className="role-badge" style={{ textTransform: "none", fontSize: "11px", padding: "4px 8px" }}>
                        {perm.category}
                      </span>
                    </td>
                    <td style={{ maxWidth: "320px" }}>{perm.description}</td>
                    <td>
                      <span className={`status-badge ${perm.isSystem ? "pending" : "low"}`} style={{ textTransform: "none" }}>
                        {perm.isSystem ? "System" : "Custom"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${perm.status.toLowerCase()}`}>{perm.status}</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-sm" onClick={() => editPermission(perm)}>
                          Edit
                        </button>
                        <button className="btn-sm" onClick={() => toggleStatus(perm.id)}>
                          {perm.status === "Active" ? "Deactivate" : "Activate"}
                        </button>
                        {!perm.isSystem && (
                          <button className="btn-sm danger" onClick={() => deletePermission(perm.id)}>
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
                    No permissions found
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

export default AdminPermissions;

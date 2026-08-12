import { useMemo, useState } from "react";
import "../styles/admin-management.css";

function AdminApprovals() {
  const [approvals, setApprovals] = useState([
    { id: "APR001", type: "User", title: "New User Creation - Amit Kumar", requestedBy: "HR Team", date: "2026-05-30", status: "Pending" },
    { id: "APR002", type: "Transaction", title: "Budget Head Allocation ₹100,000", requestedBy: "Finance", date: "2026-05-29", status: "Pending" },
    { id: "APR003", type: "Event", title: "Workshop Registration - May 31", requestedBy: "Operations", date: "2026-05-28", status: "Pending" },
    { id: "APR004", type: "User", title: "Role Change Request - Priya Singh", requestedBy: "Admin", date: "2026-05-27", status: "Approved" },
    { id: "APR005", type: "Transaction", title: "Equipment Purchase ₹50,000", requestedBy: "Admin", date: "2026-05-26", status: "Rejected" },
  ]);

  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("Pending");

  const handleApprove = (id) => {
    setApprovals(
      approvals.map((a) =>
        a.id === id ? { ...a, status: "Approved" } : a
      )
    );
  };

  const handleReject = (id) => {
    setApprovals(
      approvals.map((a) =>
        a.id === id ? { ...a, status: "Rejected" } : a
      )
    );
  };

  const filteredApprovals = useMemo(() => {
    return approvals.filter((approval) => {
      const matchesType = typeFilter === "ALL" || approval.type === typeFilter;
      const matchesStatus = statusFilter === "ALL" || approval.status === statusFilter;
      return matchesType && matchesStatus;
    });
  }, [approvals, typeFilter, statusFilter]);

  return (
    <main className="admin-page">
      <section className="admin-header">
        <h1>✓ Approval Center</h1>
        <p>Review and approve pending requests</p>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Pending Approvals</div>
          <div className="stat-value">{approvals.filter(a => a.status === "Pending").length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Approved</div>
          <div className="stat-value">{approvals.filter(a => a.status === "Approved").length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Rejected</div>
          <div className="stat-value">{approvals.filter(a => a.status === "Rejected").length}</div>
        </div>
      </section>

      <section className="admin-card">
        <div className="table-header">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="filter-select">
            <option value="ALL">All Types</option>
            <option value="User">User</option>
            <option value="Transaction">Transaction</option>
            <option value="Event">Event</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
            <option value="Pending">Pending</option>
            <option value="ALL">All Status</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Title</th>
                <th>Requested By</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApprovals.length > 0 ? (
                filteredApprovals.map((approval) => (
                  <tr key={approval.id}>
                    <td>{approval.id}</td>
                    <td>
                      <span style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        background: "#e0e7ff",
                        color: "#0f5aff",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "600"
                      }}>
                        {approval.type}
                      </span>
                    </td>
                    <td>{approval.title}</td>
                    <td>{approval.requestedBy}</td>
                    <td>{approval.date}</td>
                    <td>
                      <span className={`status-badge ${approval.status.toLowerCase()}`}>
                        {approval.status}
                      </span>
                    </td>
                    <td>
                      {approval.status === "Pending" ? (
                        <div className="action-buttons">
                          <button className="btn-sm" onClick={() => handleApprove(approval.id)}>
                            ✓ Approve
                          </button>
                          <button className="btn-sm danger" onClick={() => handleReject(approval.id)}>
                            ✗ Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "13px" }}>-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No approvals found
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

export default AdminApprovals;

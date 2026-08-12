import { useMemo, useState } from "react";
import "../../../styles/admin-management.css";

function ApprovalCenter() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("User");
  const [selectedApprovalId, setSelectedApprovalId] = useState("APR001");
  const [approvals, setApprovals] = useState([]);

  const tabs = ["User", "Transaction", "Event", "Report"];

  const filteredApprovals = useMemo(
    () =>
      approvals.filter((approval) => {
        const matchesSearch = [approval.title, approval.requestedBy, approval.module].join(" ").toLowerCase().includes(search.toLowerCase());
        return matchesSearch && approval.type === activeTab && approval.status === "Pending";
      }),
    [approvals, search, activeTab]
  );

  const stats = {
    pending: approvals.filter((approval) => approval.status === "Pending").length,
    approved: approvals.filter((approval) => approval.status === "Approved").length,
    rejected: approvals.filter((approval) => approval.status === "Rejected").length,
  };

  const selectedApproval =
    approvals.find((approval) => approval.id === selectedApprovalId) || filteredApprovals[0] || approvals[0];

  const updateStatus = (id, status) => {
    setApprovals((current) => current.map((approval) => (approval.id === id ? { ...approval, status } : approval)));
  };

  return (
    <main className="admin-page">
      <section className="admin-header">
        <h1>Approval Center</h1>
        <p>Review pending users, transactions, events, and reports from one admin queue.</p>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value">{stats.pending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Approved</div>
          <div className="stat-value">{stats.approved}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Rejected</div>
          <div className="stat-value">{stats.rejected}</div>
        </div>
      </section>

      <section className="admin-card">
        <div className="tab-nav">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`tab-chip ${activeTab === tab ? "active" : ""}`}
              onClick={() => {
                setActiveTab(tab);
                setSelectedApprovalId("");
              }}
            >
              {tab} Approvals
            </button>
          ))}
        </div>

        <div className="table-header">
          <input
            type="text"
            placeholder="Search approvals..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="search-input"
          />
          <div className="filter-select approval-tab-label">Pending {activeTab.toLowerCase()} items</div>
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Requested By</th>
                <th>Module</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApprovals.length > 0 ? (
                filteredApprovals.map((approval) => (
                  <tr key={approval.id}>
                    <td>{approval.id}</td>
                    <td>{approval.title}</td>
                    <td>{approval.requestedBy}</td>
                    <td>{approval.module}</td>
                    <td>
                      <span className={`status-badge ${approval.priority.toLowerCase()}`}>{approval.priority}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${approval.status.toLowerCase()}`}>{approval.status}</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-sm" onClick={() => setSelectedApprovalId(approval.id)}>
                          View
                        </button>
                        <button className="btn-sm" onClick={() => updateStatus(approval.id, "Approved")}>
                          Approve
                        </button>
                        <button className="btn-sm danger" onClick={() => updateStatus(approval.id, "Rejected")}>
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No pending {activeTab.toLowerCase()} approvals found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedApproval && (
        <section className="admin-card">
          <h2>Selected Approval</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <span>Approval ID</span>
              <strong>{selectedApproval.id}</strong>
            </div>
            <div className="detail-item">
              <span>Type</span>
              <strong>{selectedApproval.type}</strong>
            </div>
            <div className="detail-item">
              <span>Requested By</span>
              <strong>{selectedApproval.requestedBy}</strong>
            </div>
            <div className="detail-item">
              <span>Date</span>
              <strong>{selectedApproval.date}</strong>
            </div>
            <div className="detail-item detail-item-wide">
              <span>Title</span>
              <strong>{selectedApproval.title}</strong>
            </div>
            <div className="detail-item detail-item-wide">
              <span>Current Status</span>
              <strong>{selectedApproval.status}</strong>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default ApprovalCenter;


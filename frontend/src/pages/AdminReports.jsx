import { useMemo, useState } from "react";
import "../styles/admin-management.css";

function AdminReports() {
  const [search, setSearch] = useState("");
  const [reports, setReports] = useState([
    { id: "RPT001", name: "Financial Report - May 2026", type: "Financial", submittedBy: "Finance Team", date: "2026-05-30", status: "Approved" },
    { id: "RPT002", name: "Budget Analysis", type: "Budget", submittedBy: "Manas Pandya", date: "2026-05-28", status: "Pending" },
    { id: "RPT003", name: "User Activity Report", type: "User Activity", submittedBy: "Administration", date: "2026-05-25", status: "Approved" },
    { id: "RPT004", name: "Quarterly Event Utilization", type: "Operations", submittedBy: "Operations Desk", date: "2026-05-20", status: "Rejected" },
  ]);

  const filteredReports = useMemo(
    () =>
      reports.filter((report) =>
        [report.id, report.name, report.type, report.submittedBy].join(" ").toLowerCase().includes(search.toLowerCase())
      ),
    [reports, search]
  );

  const stats = useMemo(
    () => ({
      total: reports.length,
      pending: reports.filter((report) => report.status === "Pending").length,
      approved: reports.filter((report) => report.status === "Approved").length,
      rejected: reports.filter((report) => report.status === "Rejected").length,
    }),
    [reports]
  );

  const updateStatus = (id, status) => {
    setReports((current) => current.map((report) => (report.id === id ? { ...report, status } : report)));
  };

  return (
    <main className="admin-page">
      <section className="admin-header">
        <h1>Reports Management</h1>
        <p>Review ERP report submissions, approve or reject them, and download final outputs.</p>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Reports</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Reports</div>
          <div className="stat-value">{stats.pending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Approved Reports</div>
          <div className="stat-value">{stats.approved}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Rejected Reports</div>
          <div className="stat-value">{stats.rejected}</div>
        </div>
      </section>

      <section className="admin-card">
        <div className="table-header">
          <input
            type="text"
            className="search-input"
            placeholder="Search reports by id, name, type, or submitter"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Report Name</th>
                <th>Type</th>
                <th>Submitted By</th>
                <th>Submission Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td>{report.id}</td>
                    <td>{report.name}</td>
                    <td>{report.type}</td>
                    <td>{report.submittedBy}</td>
                    <td>{report.date}</td>
                    <td>
                      <span className={`status-badge ${report.status.toLowerCase()}`}>{report.status}</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-sm">View</button>
                        <button className="btn-sm">Download PDF</button>
                        <button className="btn-sm" onClick={() => updateStatus(report.id, "Approved")}>
                          Approve
                        </button>
                        <button className="btn-sm danger" onClick={() => updateStatus(report.id, "Rejected")}>
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No reports match the current search
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

export default AdminReports;

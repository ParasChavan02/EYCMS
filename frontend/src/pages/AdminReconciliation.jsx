import { useState } from "react";
import "../styles/admin-management.css";

function AdminReconciliation() {
  const [reconciliations] = useState([
    { id: "REC001", period: "May 2026", status: "Completed", matchedTxn: 145, pendingTxn: 2, failedTxn: 1, completedDate: "2026-05-30" },
    { id: "REC002", period: "April 2026", status: "Completed", matchedTxn: 138, pendingTxn: 0, failedTxn: 0, completedDate: "2026-04-30" },
    { id: "REC003", period: "March 2026", status: "In Review", matchedTxn: 142, pendingTxn: 1, failedTxn: 2, completedDate: "2026-03-31" },
  ]);

  return (
    <main className="admin-page">
      <section className="admin-header">
        <h1>Reconciliation Module</h1>
        <p>Track matched, pending, and failed transactions for each reconciliation cycle.</p>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Matched Transactions</div>
          <div className="stat-value">425</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Transactions</div>
          <div className="stat-value">3</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Failed Transactions</div>
          <div className="stat-value">3</div>
        </div>
      </section>

      <section className="admin-card">
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Status</th>
                <th>Matched Transactions</th>
                <th>Pending Transactions</th>
                <th>Failed Transactions</th>
                <th>Completed Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reconciliations.map((reconciliation) => (
                <tr key={reconciliation.id}>
                  <td>{reconciliation.period}</td>
                  <td>
                    <span className={`status-badge ${reconciliation.status === "Completed" ? "approved" : "pending"}`}>
                      {reconciliation.status}
                    </span>
                  </td>
                  <td>{reconciliation.matchedTxn}</td>
                  <td>{reconciliation.pendingTxn}</td>
                  <td>{reconciliation.failedTxn}</td>
                  <td>{reconciliation.completedDate}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-sm">Report</button>
                      <button className="btn-sm">Details</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default AdminReconciliation;

import { useMemo, useState } from "react";
import "../../../styles/admin-management.css";

function AdminBudgetHeads() {
  const [heads] = useState([
    { id: 1, name: "Travel", sanctioned: 500000, utilized: 250000, remaining: 250000, percentage: 50 },
    { id: 2, name: "Equipment", sanctioned: 1000000, utilized: 820000, remaining: 180000, percentage: 82 },
    { id: 3, name: "Supplies", sanctioned: 300000, utilized: 120000, remaining: 180000, percentage: 40 },
    { id: 4, name: "Training", sanctioned: 800000, utilized: 610000, remaining: 190000, percentage: 76 },
    { id: 5, name: "Maintenance", sanctioned: 400000, utilized: 100000, remaining: 300000, percentage: 25 },
  ]);

  const totals = useMemo(
    () => ({
      sanctioned: heads.reduce((sum, head) => sum + head.sanctioned, 0),
      utilized: heads.reduce((sum, head) => sum + head.utilized, 0),
      remaining: heads.reduce((sum, head) => sum + head.remaining, 0),
    }),
    [heads]
  );

  return (
    <main className="admin-page">
      <section className="admin-header">
        <h1>Budget Heads Management</h1>
        <p>Track sanctioned amounts, actual utilization, remaining balances, and utilization progress.</p>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Sanctioned Amount</div>
          <div className="stat-value">Rs {(totals.sanctioned / 100000).toFixed(1)}L</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Utilized Amount</div>
          <div className="stat-value">Rs {(totals.utilized / 100000).toFixed(1)}L</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Remaining Amount</div>
          <div className="stat-value">Rs {(totals.remaining / 100000).toFixed(1)}L</div>
        </div>
      </section>

      <section className="admin-card">
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Budget Head</th>
                <th>Sanctioned Amount</th>
                <th>Utilized Amount</th>
                <th>Remaining Amount</th>
                <th>Utilization</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {heads.map((head) => (
                <tr key={head.id}>
                  <td>{head.name}</td>
                  <td>Rs {head.sanctioned.toLocaleString()}</td>
                  <td>Rs {head.utilized.toLocaleString()}</td>
                  <td>Rs {head.remaining.toLocaleString()}</td>
                  <td>
                    <div className="progress-inline">
                      <div className="progress-track">
                        <div
                          className={`progress-fill ${head.percentage > 80 ? "critical" : head.percentage > 60 ? "warning" : "healthy"}`}
                          style={{ width: `${head.percentage}%` }}
                        />
                      </div>
                      <span className="progress-value">{head.percentage}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-sm">Edit</button>
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

export default AdminBudgetHeads;


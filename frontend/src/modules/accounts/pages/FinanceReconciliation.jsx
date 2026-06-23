import "../styles/finance.css";

const reconciliations = [
  {
    id: "REC001",
    period: "May 2026",
    status: "Completed",
    matchedTxn: 145,
    pendingTxn: 2,
    failedTxn: 1,
    completedDate: "2026-05-30",
  },
  {
    id: "REC002",
    period: "April 2026",
    status: "Completed",
    matchedTxn: 138,
    pendingTxn: 0,
    failedTxn: 0,
    completedDate: "2026-04-30",
  },
  {
    id: "REC003",
    period: "March 2026",
    status: "In Review",
    matchedTxn: 142,
    pendingTxn: 1,
    failedTxn: 2,
    completedDate: "2026-03-31",
  },
];

export default function FinanceReconciliation() {
  const totalMatched = reconciliations.reduce(
    (s, r) => s + r.matchedTxn,
    0
  );
  const totalPending = reconciliations.reduce(
    (s, r) => s + r.pendingTxn,
    0
  );
  const totalFailed = reconciliations.reduce(
    (s, r) => s + r.failedTxn,
    0
  );

  return (
    <div className="fin-page">
      {/* HEADER */}
      <div className="fin-header">
        <div className="fin-header-top">
          <div>
            <h1>Bank Reconciliation</h1>
            <p className="subtitle">
              Read-only reconciliation summary from admin system.
            </p>
          </div>
          <span className="fin-badge-role">Read Only Access</span>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="fin-kpi-grid">
        <div className="fin-kpi-card" style={{ "--accent": "#16a34a" }}>
          <div className="fin-kpi-icon">✔️</div>
          <div className="fin-kpi-label">Matched Transactions</div>
          <div className="fin-kpi-value">{totalMatched}</div>
        </div>

        <div className="fin-kpi-card" style={{ "--accent": "#d97706" }}>
          <div className="fin-kpi-icon">⏳</div>
          <div className="fin-kpi-label">Pending Transactions</div>
          <div className="fin-kpi-value">{totalPending}</div>
        </div>

        <div className="fin-kpi-card" style={{ "--accent": "#dc2626" }}>
          <div className="fin-kpi-icon">❌</div>
          <div className="fin-kpi-label">Failed Transactions</div>
          <div className="fin-kpi-value">{totalFailed}</div>
        </div>
      </div>

      {/* TABLE */}
      <div className="fin-card fin-section">
        <div className="fin-card-header">
          <div>
            <div className="fin-card-title">
              Reconciliation History
            </div>
            <div className="fin-card-subtitle">
              Monthly reconciliation cycles (read-only)
            </div>
          </div>
        </div>

        <div className="fin-card-body">
          <div className="fin-table-wrap">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Matched</th>
                  <th>Pending</th>
                  <th>Failed</th>
                  <th>Completed Date</th>
                </tr>
              </thead>

              <tbody>
                {reconciliations.map((r) => (
                  <tr key={r.id}>
                    <td className="bold">{r.period}</td>

                    <td>
                      <span
                        className={`fin-badge ${
                          r.status === "Completed"
                            ? "badge-success"
                            : "badge-warning"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>

                    <td className="mono">{r.matchedTxn}</td>
                    <td className="mono">{r.pendingTxn}</td>
                    <td className="mono">{r.failedTxn}</td>
                    <td className="mono">{r.completedDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
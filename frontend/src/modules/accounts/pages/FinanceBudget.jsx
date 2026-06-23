import "../styles/finance.css";

const summaryCards = [
  {
    label: "Total Budget",
    value: "₹12,50,000",
    icon: "💼",
    accent: "#2563eb",
    iconBg: "#eff6ff",
  },
  {
    label: "Allocated",
    value: "₹11,80,000",
    icon: "📋",
    accent: "#9333ea",
    iconBg: "#fdf4ff",
  },
  {
    label: "Utilized",
    value: "₹8,45,000",
    icon: "📈",
    accent: "#d97706",
    iconBg: "#fffbeb",
  },
  {
    label: "Remaining",
    value: "₹4,05,000",
    icon: "🏦",
    accent: "#16a34a",
    iconBg: "#f0fdf4",
  },
];

const budgetRows = [
  { head: "Travel", allocated: 200000, utilized: 110000 },
  { head: "Equipment", allocated: 350000, utilized: 287000 },
  { head: "Training", allocated: 150000, utilized: 72000 },
  { head: "Events", allocated: 180000, utilized: 113400 },
  { head: "Operations", allocated: 300000, utilized: 225000 },
  { head: "IT Infrastructure", allocated: 200000, utilized: 148000 },
  { head: "Marketing", allocated: 100000, utilized: 89600 },
  { head: "Miscellaneous", allocated: 70000, utilized: 21000 },
];

function fmtINR(n) {
  return "₹" + n.toLocaleString("en-IN");
}

function pct(util, alloc) {
  return Math.round((util / alloc) * 100);
}

function barColor(p) {
  return p >= 80 ? "danger" : p >= 60 ? "warning" : "success";
}

export default function FinanceBudget() {
  const sorted = [...budgetRows].sort(
    (a, b) => pct(b.utilized, b.allocated) - pct(a.utilized, a.allocated)
  );

  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  const totalAllocated = budgetRows.reduce((s, r) => s + r.allocated, 0);
  const totalUtilized = budgetRows.reduce((s, r) => s + r.utilized, 0);
  const overallHealth = pct(totalUtilized, totalAllocated);

  const grantReleased = 750000;
  const spent = 420000;
  const remainingGrant = grantReleased - spent;

  return (
    <div className="fin-page">
      <div className="fin-header">
        <div className="fin-header-top">
          <div>
            <h1>Budget Overview</h1>
            <p className="subtitle">
              Annual budget allocation and utilization — FY 2026
            </p>
          </div>
          <span className="fin-badge-role">Read Only Access</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="fin-kpi-grid">
        {summaryCards.map((k, i) => (
          <div
            key={i}
            className="fin-kpi-card"
            style={{
              "--accent": k.accent,
              "--icon-bg": k.iconBg,
            }}
          >
            <div className="fin-kpi-icon">{k.icon}</div>
            <div className="fin-kpi-label">{k.label}</div>
            <div className="fin-kpi-value">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="fin-two-col">
        {/* Budget Table */}
        <div className="fin-card">
          <div className="fin-card-header">
            <div>
              <div className="fin-card-title">Budget Allocation</div>
              <div className="fin-card-subtitle">
                Per budget head breakdown
              </div>
            </div>
          </div>

          <div className="fin-card-body">
            <div className="fin-table-wrap">
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>Budget Head</th>
                    <th>Allocated</th>
                    <th>Utilized</th>
                    <th>Remaining</th>
                    <th>Utilization %</th>
                  </tr>
                </thead>

                <tbody>
                  {budgetRows.map((row, i) => {
                    const p = pct(row.utilized, row.allocated);
                    const remaining = row.allocated - row.utilized;

                    return (
                      <tr key={i}>
                        <td className="bold">{row.head}</td>
                        <td className="mono">{fmtINR(row.allocated)}</td>
                        <td className="mono">{fmtINR(row.utilized)}</td>
                        <td className="mono">{fmtINR(remaining)}</td>

                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <div
                              className="fin-progress-track"
                              style={{ flex: 1 }}
                            >
                              <div
                                className={`fin-progress-fill ${barColor(p)}`}
                                style={{ width: `${p}%` }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              {p}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Budget Insights */}
          <div className="fin-card">
            <div className="fin-card-header">
              <div className="fin-card-title">Budget Insights</div>
            </div>

            <div className="fin-card-body">
              <div className="fin-insight-row">
                <span>🔴 Highest Spending Head</span>
                <span>{highest.head}</span>
              </div>

              <div className="fin-insight-row">
                <span>🟢 Lowest Spending Head</span>
                <span>{lowest.head}</span>
              </div>

              <div className="fin-insight-row">
                <span>📊 Overall Utilization</span>
                <span>{overallHealth}%</span>
              </div>

              <div className="fin-insight-row">
                <span>🗂 Active Heads</span>
                <span>{budgetRows.length}</span>
              </div>
            </div>
          </div>

          {/* Utilization Progress */}
          <div className="fin-card">
            <div className="fin-card-header">
              <div className="fin-card-title">Utilization Progress</div>
            </div>

            <div className="fin-card-body">
              <h2 style={{ marginBottom: 14 }}>{overallHealth}% Utilized</h2>

              <div className="fin-progress-track">
                <div
                  className="fin-progress-fill warning"
                  style={{ width: `${overallHealth}%` }}
                />
              </div>
            </div>
          </div>

          {/* Grant Status */}
          <div className="fin-card">
            <div className="fin-card-header">
              <div className="fin-card-title">Grant Status</div>
            </div>

            <div className="fin-card-body">
              <div className="fin-stat-row">
                <span>Grant Released</span>
                <strong>{fmtINR(grantReleased)}</strong>
              </div>

              <div className="fin-stat-row">
                <span>Spent</span>
                <strong style={{ color: "var(--warning)" }}>
                  {fmtINR(spent)}
                </strong>
              </div>

              <div className="fin-stat-row">
                <span>Remaining</span>
                <strong style={{ color: "var(--success)" }}>
                  {fmtINR(remainingGrant)}
                </strong>
              </div>
            </div>
          </div>

          {/* UC Compliance */}
          <div className="fin-card">
            <div className="fin-card-header">
              <div className="fin-card-title">UC Compliance Status</div>
            </div>

            <div className="fin-card-body">
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <li>✅ SOE Prepared</li>
                <li>✅ Bills Uploaded</li>
                <li>✅ Transactions Verified</li>
                <li>⚠ UC Pending Approval</li>
              </ul>
            </div>
          </div>

          {/* Circular Progress */}
          <div className="fin-card">
            <div className="fin-card-header">
              <div className="fin-card-title">Overall Budget Health</div>
            </div>

            <div className="fin-card-body">
              <div
                style={{
                  width: 130,
                  height: 130,
                  margin: "0 auto",
                  borderRadius: "50%",
                  background: `conic-gradient(
                    var(--warning) 0% ${overallHealth}%,
                    var(--border) ${overallHealth}% 100%
                  )`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 95,
                    height: 95,
                    borderRadius: "50%",
                    background: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 20,
                  }}
                >
                  {overallHealth}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
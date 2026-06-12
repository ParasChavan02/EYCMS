import "../styles/finance.css";

const summaryCards = [
  { label: "Total Budget", value: "₹12,50,000", icon: "💼", accent: "#2563eb", iconBg: "#eff6ff" },
  { label: "Allocated", value: "₹11,80,000", icon: "📋", accent: "#9333ea", iconBg: "#fdf4ff" },
  { label: "Utilized", value: "₹8,45,000", icon: "📈", accent: "#d97706", iconBg: "#fffbeb" },
  { label: "Remaining", value: "₹4,05,000", icon: "🏦", accent: "#16a34a", iconBg: "#f0fdf4" },
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

function fmtINR(n) { return "₹" + n.toLocaleString("en-IN"); }
function pct(util, alloc) { return Math.round((util / alloc) * 100); }
function barColor(p) { return p >= 80 ? "danger" : p >= 60 ? "warning" : "success"; }

export default function FinanceBudget() {
  const sorted = [...budgetRows].sort((a, b) => pct(b.utilized, b.allocated) - pct(a.utilized, a.allocated));
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];
  const totalAllocated = budgetRows.reduce((s, r) => s + r.allocated, 0);
  const totalUtilized = budgetRows.reduce((s, r) => s + r.utilized, 0);
  const overallHealth = pct(totalUtilized, totalAllocated);

  return (
    <div className="fin-page">
      <div className="fin-header">
        <div className="fin-header-top">
          <div>
            <h1>Budget Overview</h1>
            <p className="subtitle">Annual budget allocation and utilization — FY 2026</p>
          </div>
          <span className="fin-badge-role">Read Only Access</span>
        </div>
      </div>

      <div className="fin-kpi-grid">
        {summaryCards.map((k, i) => (
          <div key={i} className="fin-kpi-card" style={{ "--accent": k.accent, "--icon-bg": k.iconBg }}>
            <div className="fin-kpi-icon">{k.icon}</div>
            <div className="fin-kpi-label">{k.label}</div>
            <div className="fin-kpi-value">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="fin-two-col">
        <div className="fin-card">
          <div className="fin-card-header">
            <div>
              <div className="fin-card-title">Budget Allocation</div>
              <div className="fin-card-subtitle">Per budget head breakdown</div>
            </div>
          </div>
          <div className="fin-card-body">
            <div className="fin-table-wrap">
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>Budget Head</th><th>Allocated</th><th>Utilized</th>
                    <th>Remaining</th><th style={{ minWidth: 140 }}>Utilization %</th>
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
                        <td className="mono" style={{ color: remaining < 20000 ? "var(--danger)" : "var(--success)" }}>
                          {fmtINR(remaining)}
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className="fin-progress-track" style={{ flex: 1 }}>
                              <div className={`fin-progress-fill ${barColor(p)}`} style={{ width: `${p}%` }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", minWidth: 30 }}>{p}%</span>
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

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="fin-card">
            <div className="fin-card-header">
              <div className="fin-card-title">Budget Insights</div>
            </div>
            <div className="fin-card-body">
              <div className="fin-insight-row">
                <span className="fin-insight-label">🔴 Highest Spending Head</span>
                <div style={{ textAlign: "right" }}>
                  <div className="fin-insight-val">{highest.head}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{pct(highest.utilized, highest.allocated)}% utilized</div>
                </div>
              </div>
              <div className="fin-insight-row">
                <span className="fin-insight-label">🟢 Lowest Spending Head</span>
                <div style={{ textAlign: "right" }}>
                  <div className="fin-insight-val">{lowest.head}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{pct(lowest.utilized, lowest.allocated)}% utilized</div>
                </div>
              </div>
              <div className="fin-insight-row">
                <span className="fin-insight-label">💡 Budget Health</span>
                <span className={`fin-badge ${overallHealth > 80 ? "badge-danger" : overallHealth > 60 ? "badge-warning" : "badge-success"}`}>
                  {overallHealth > 80 ? "Critical" : overallHealth > 60 ? "Moderate" : "Healthy"}
                </span>
              </div>
              <div className="fin-insight-row">
                <span className="fin-insight-label">📊 Overall Utilization</span>
                <span className="fin-insight-val">{overallHealth}%</span>
              </div>
              <div className="fin-insight-row">
                <span className="fin-insight-label">🗂 Active Heads</span>
                <span className="fin-insight-val">{budgetRows.length}</span>
              </div>
            </div>
          </div>

          <div className="fin-card">
            <div className="fin-card-header">
              <div className="fin-card-title">Overall Progress</div>
            </div>
            <div className="fin-card-body">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "8px 0" }}>
                <div style={{
                  width: 120, height: 120, borderRadius: "50%",
                  background: `conic-gradient(var(--warning) 0% ${overallHealth}%, var(--border) ${overallHealth}% 100%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{
                    width: 88, height: 88, borderRadius: "50%", background: "var(--surface)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: "var(--text-1)" }}>{overallHealth}%</span>
                    <span style={{ fontSize: 10, color: "var(--text-3)" }}>Utilized</span>
                  </div>
                </div>
                <div style={{ width: "100%" }}>
                  <div className="fin-stat-row">
                    <span style={{ fontSize: 13, color: "var(--text-2)" }}>Total Allocated</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{fmtINR(totalAllocated)}</span>
                  </div>
                  <div className="fin-stat-row">
                    <span style={{ fontSize: 13, color: "var(--text-2)" }}>Total Utilized</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--warning)" }}>{fmtINR(totalUtilized)}</span>
                  </div>
                  <div className="fin-stat-row">
                    <span style={{ fontSize: 13, color: "var(--text-2)" }}>Remaining</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--success)" }}>{fmtINR(totalAllocated - totalUtilized)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
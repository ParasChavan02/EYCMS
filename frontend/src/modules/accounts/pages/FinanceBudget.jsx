import { useEffect, useState } from "react";
import { accountsService } from "../services/accountsService";
import "../styles/finance.css";

function fmtINR(n) {
  return "₹" + Math.round(n || 0).toLocaleString("en-IN");
}

function pct(util, alloc) {
  if (!alloc) return 0;
  return Math.round((util / alloc) * 100);
}

function barColor(p) {
  return p >= 80 ? "danger" : p >= 60 ? "warning" : "success";
}

export default function FinanceBudget() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await accountsService.getBudgetOverview();
        if (isMounted) setBudgets(data || []);
      } catch (err) {
        if (isMounted) setError(err?.response?.data?.error || "Unable to load budget data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Flatten budget heads across all projects into a single table, each
  // labeled with its parent project so heads with the same name (e.g.
  // "Travel" on two different projects) aren't confused with one another.
  const budgetRows = budgets.flatMap((b) =>
    (b.budget_heads || []).map((h) => ({
      head: h.name,
      project: b.project_title || b.project_id || "Unassigned",
      allocated: h.allocated,
      utilized: h.utilized,
      remaining: h.remaining,
    }))
  );

  const totalAllocated = budgets.reduce((s, b) => s + (b.total_allocated || 0), 0);
  const totalUtilized = budgets.reduce((s, b) => s + (b.total_utilized || 0), 0);
  const overallHealth = pct(totalUtilized, totalAllocated);

  const sorted = [...budgetRows].sort(
    (a, b) => pct(b.utilized, b.allocated) - pct(a.utilized, a.allocated)
  );
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  const summaryCards = [
    { label: "Total Budget", value: fmtINR(totalAllocated), icon: "💼", accent: "#2563eb", iconBg: "#eff6ff" },
    { label: "Allocated", value: fmtINR(totalAllocated), icon: "📋", accent: "#9333ea", iconBg: "#fdf4ff" },
    { label: "Utilized", value: fmtINR(totalUtilized), icon: "📈", accent: "#d97706", iconBg: "#fffbeb" },
    { label: "Remaining", value: fmtINR(totalAllocated - totalUtilized), icon: "🏦", accent: "#16a34a", iconBg: "#f0fdf4" },
  ];

  return (
    <div className="fin-page">
      <div className="fin-header">
        <div className="fin-header-top">
          <div>
            <h1>Budget Overview</h1>
            <p className="subtitle">
              Budget allocation and utilization across all projects
            </p>
          </div>
          <span className="fin-badge-role">Read Only Access</span>
        </div>
      </div>

      {error && <div className="fin-empty">{error}</div>}
      {loading && !error && <div className="fin-empty">Loading budget data…</div>}

      {!loading && !error && (
        <>
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
            {budgetRows.length === 0 ? (
              <div className="fin-empty">No budget heads recorded yet.</div>
            ) : (
            <div className="fin-table-wrap">
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>Budget Head</th>
                    <th>Project</th>
                    <th>Allocated</th>
                    <th>Utilized</th>
                    <th>Remaining</th>
                    <th>Utilization %</th>
                  </tr>
                </thead>

                <tbody>
                  {budgetRows.map((row, i) => {
                    const p = pct(row.utilized, row.allocated);
                    const remaining = row.remaining;

                    return (
                      <tr key={i}>
                        <td className="bold">{row.head}</td>
                        <td>{row.project}</td>
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
                                style={{ width: `${Math.min(100, p)}%` }}
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
            )}
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
                <span>{highest ? highest.head : "N/A"}</span>
              </div>

              <div className="fin-insight-row">
                <span>🟢 Lowest Spending Head</span>
                <span>{lowest ? lowest.head : "N/A"}</span>
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

          {/* Grant Status - reuses the same allocated/utilized totals as the KPI cards above */}
          <div className="fin-card">
            <div className="fin-card-header">
              <div className="fin-card-title">Grant Status</div>
            </div>

            <div className="fin-card-body">
              <div className="fin-stat-row">
                <span>Total Allocated</span>
                <strong>{fmtINR(totalAllocated)}</strong>
              </div>

              <div className="fin-stat-row">
                <span>Spent</span>
                <strong style={{ color: "var(--warning)" }}>
                  {fmtINR(totalUtilized)}
                </strong>
              </div>

              <div className="fin-stat-row">
                <span>Remaining</span>
                <strong style={{ color: "var(--success)" }}>
                  {fmtINR(totalAllocated - totalUtilized)}
                </strong>
              </div>
            </div>
          </div>

          {/* UC Compliance - no backing data model yet, left as a static placeholder */}
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
        </>
      )}
    </div>
  );
}
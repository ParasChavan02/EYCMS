import { useEffect, useState } from "react";
import { accountsService } from "../services/accountsService";
import "../styles/finance.css";

function fmtINR(n) {
  return "₹" + Math.round(n || 0).toLocaleString("en-IN");
}

// NOTE: Notifications, Vendor Snapshot, Approvals Snapshot and Compliance
// Deadlines below have no backing data model yet (Vendors/Approvals are
// separate pages explicitly deferred to a later pass), so they remain
// static placeholders for now rather than fabricated "live" data.
const notifications = [
  {
    msg: "Budget utilization crossed 60% threshold",
    time: "2 hours ago",
    color: "#d97706",
  },
  {
    msg: "3 invoices are overdue",
    time: "4 hours ago",
    color: "#dc2626",
  },
  {
    msg: "3 approval requests awaiting admin verification",
    time: "Yesterday",
    color: "#2563eb",
  },
  {
    msg: "Monthly audit trail updated",
    time: "2 days ago",
    color: "#16a34a",
  },
];

const expenseHeads = [
  { label: "Equipment", pct: 82 },
  { label: "Operations", pct: 74 },
  { label: "Travel", pct: 55 },
];

const deadlines = [
  { title: "UC Submission", date: "15 Jun 2026" },
  { title: "Audit Review", date: "20 Jun 2026" },
  { title: "SOE Submission", date: "30 Jun 2026" },
];

const statusMap = {
  APPROVED: "badge-success",
  VERIFIED: "badge-success",
  PENDING: "badge-warning",
  DRAFT: "badge-warning",
  REVISION_REQUESTED: "badge-warning",
  REJECTED: "badge-danger",
};

export default function FinanceDashboard() {
  const [kpiData, setKpiData] = useState(null);
  const [budgetHeads, setBudgetHeads] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);
      try {
        const [kpis, budgets, transactions] = await Promise.all([
          accountsService.getDashboardKPIs(),
          accountsService.getBudgetOverview(),
          accountsService.getTransactions(),
        ]);

        if (!isMounted) return;

        setKpiData(kpis);

        // Flatten budget heads across all projects, take the top 5 by utilization
        const allHeads = (budgets || []).flatMap((b) => b.budget_heads || []);
        allHeads.sort((a, b) => b.utilization_percent - a.utilization_percent);
        setBudgetHeads(allHeads.slice(0, 5));

        setRecentTransactions((transactions || []).slice(0, 5));
      } catch (err) {
        if (isMounted) setError(err?.response?.data?.error || "Unable to load dashboard data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const utilization = Math.round(kpiData?.budget_utilized_percent ?? 0);
  const utilizationColor =
    utilization > 80 ? "danger" : utilization > 60 ? "warning" : "success";

  const kpis = kpiData
    ? [
        {
          label: "Total Budget",
          value: fmtINR(kpiData.total_allocated_funds),
          icon: "💰",
          iconBg: "#eff6ff",
          accent: "#2563eb",
          trend: `${kpiData.active_budgets} active budget(s)`,
          trendUp: null,
        },
        {
          label: "Total Expenses",
          value: fmtINR(kpiData.total_spent_funds),
          icon: "📊",
          iconBg: "#fdf4ff",
          accent: "#9333ea",
          trend: `${utilization}% of budget`,
          trendUp: null,
        },
        {
          label: "Remaining Budget",
          value: fmtINR(kpiData.remaining_funds),
          icon: "🏦",
          iconBg: "#f0fdf4",
          accent: "#16a34a",
          trend: `${100 - utilization}% remaining`,
          trendUp: true,
        },
        {
          label: "Pending Transactions",
          value: String(kpiData.pending_transactions),
          icon: "🧾",
          iconBg: "#fffbeb",
          accent: "#d97706",
          trend: "Awaiting verification/approval",
          trendUp: false,
        },
      ]
    : [];

  return (
    <div className="fin-page">
      <div className="fin-header">
        <div className="fin-header-top">
          <div>
            <h1>Finance Dashboard</h1>
            <p className="subtitle">
              Financial overview, compliance tracking and audit readiness.
            </p>
          </div>
          <span className="fin-badge-role">Read Only Access</span>
        </div>
      </div>

      {error && <div className="fin-empty">{error}</div>}
      {loading && !error && <div className="fin-empty">Loading dashboard…</div>}

      {!loading && !error && (
        <>
          {/* KPI Cards */}
          <div className="fin-kpi-grid">
            {kpis.map((k, i) => (
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
                <div className="fin-kpi-trend">
                  {k.trendUp === true && <span className="trend-up">↑</span>}
                  {k.trendUp === false && <span className="trend-down">↓</span>}
                  {k.trend}
                </div>
              </div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="fin-two-col">
            {/* Budget Health */}
            <div className="fin-card">
              <div className="fin-card-header">
                <div>
                  <div className="fin-card-title">Budget Health Gauge</div>
                  <div className="fin-card-subtitle">
                    Overall financial utilization
                  </div>
                </div>
                <span className="fin-badge badge-warning">{utilization}% Used</span>
              </div>

              <div className="fin-card-body">
                <div className="fin-progress-wrap">
                  <div className="fin-progress-meta">
                    <span className="fin-progress-label">Overall Budget</span>
                    <span className="fin-progress-pct">{utilization}%</span>
                  </div>

                  <div className="fin-progress-track">
                    <div
                      className={`fin-progress-fill ${utilizationColor}`}
                      style={{ width: `${utilization}%` }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 24 }}>
                  {budgetHeads.length === 0 && (
                    <div className="fin-notif-text">No budget heads recorded yet.</div>
                  )}
                  {budgetHeads.map((h) => (
                    <div
                      key={h.id}
                      className="fin-progress-wrap"
                      style={{ marginBottom: 18 }}
                    >
                      <div className="fin-progress-meta">
                        <span>{h.name}</span>
                        <span>{Math.round(h.utilization_percent)}%</span>
                      </div>

                      <div className="fin-progress-track">
                        <div
                          className={`fin-progress-fill ${
                            h.utilization_percent > 80
                              ? "danger"
                              : h.utilization_percent > 60
                              ? "warning"
                              : "success"
                          }`}
                          style={{ width: `${Math.min(100, h.utilization_percent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Notifications */}
        <div className="fin-card">
          <div className="fin-card-header">
            <div>
              <div className="fin-card-title">Notifications</div>
              <div className="fin-card-subtitle">
                Recent alerts & updates
              </div>
            </div>
            <span className="fin-badge badge-primary">4 New</span>
          </div>

          <div className="fin-card-body">
            {notifications.map((n, i) => (
              <div className="fin-notif-item" key={i}>
                <div
                  className="fin-notif-dot"
                  style={{ background: n.color }}
                />
                <div>
                  <div className="fin-notif-text">{n.msg}</div>
                  <div className="fin-notif-time">{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

          {/* Recent Transactions */}
          <div className="fin-card fin-section">
            <div className="fin-card-header">
              <div>
                <div className="fin-card-title">Recent Transactions</div>
                <div className="fin-card-subtitle">Last 5 transactions</div>
              </div>
            </div>

            <div className="fin-card-body">
              {recentTransactions.length === 0 ? (
                <div className="fin-empty">No transactions recorded yet.</div>
              ) : (
                <div className="fin-table-wrap">
                  <table className="fin-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentTransactions.map((t) => (
                        <tr key={t.id}>
                          <td className="mono">
                            {new Date(t.date).toLocaleDateString("en-IN")}
                          </td>
                          <td className="bold">{t.description}</td>
                          <td className="mono bold">{fmtINR(t.amount)}</td>
                          <td>
                            <span className={`fin-badge ${statusMap[t.status] || "badge-info"}`}>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          {/* Submission Status */}
<div className="fin-card fin-section">
  <div className="fin-card-header">
    <div>
      <div className="fin-card-title">Submission Status</div>
      <div className="fin-card-subtitle">
        Track submitted reports and supporting documents
      </div>
    </div>

    <span className="fin-badge badge-primary">
      4 Documents
    </span>
  </div>

  <div className="fin-card-body">
    <div className="fin-table-wrap">
      <table className="fin-table">
        <thead>
          <tr>
            <th>Document</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td className="bold">Q2 Event Report</td>
            <td>Report</td>
            <td>
              <span className="fin-badge badge-success">
                Approved
              </span>
            </td>
          </tr>

          <tr>
            <td className="bold">Audit Documents</td>
            <td>Supporting Document</td>
            <td>
              <span className="fin-badge badge-info">
                Under Review
              </span>
            </td>
          </tr>

          <tr>
            <td className="bold">Travel Expense Bill</td>
            <td>Bill</td>
            <td>
              <span className="fin-badge badge-warning">
                Pending
              </span>
            </td>
          </tr>

          <tr>
            <td className="bold">Image Gallery Upload</td>
            <td>Event Images</td>
            <td>
              <span className="fin-badge badge-danger">
                Rejected
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

          {/* Bottom Grid */}
      {/* Bottom Grid */}
<div className="fin-two-col">

  {/* Upcoming Events */}
  <div className="fin-card">
    <div className="fin-card-header">
      <div>
        <div className="fin-card-title">Upcoming Events</div>
        <div className="fin-card-subtitle">
          Meetings, workshops & upcoming activities
        </div>
      </div>
      <span className="fin-badge badge-primary">3 Events</span>
    </div>

    <div className="fin-card-body">

      <div className="fin-notif-item">
        <div>
          <div className="fin-notif-text" style={{ fontWeight: 600 }}>
            Leadership Workshop
          </div>
          <div className="fin-notif-time">
            📍 Conference Hall
          </div>
        </div>

        <span className="fin-badge badge-info">
          Jun 4, 2026
        </span>
      </div>

      <div className="fin-notif-item">
        <div>
          <div className="fin-notif-text" style={{ fontWeight: 600 }}>
            Finance Review
          </div>
          <div className="fin-notif-time">
            📍 Board Room
          </div>
        </div>

        <span className="fin-badge badge-warning">
          Jun 10, 2026
        </span>
      </div>

      <div className="fin-notif-item">
        <div>
          <div className="fin-notif-text" style={{ fontWeight: 600 }}>
            Team Collaboration Day
          </div>
          <div className="fin-notif-time">
            📍 Training Center
          </div>
        </div>

        <span className="fin-badge badge-success">
          Jun 18, 2026
        </span>
      </div>

    </div>
  </div>

  {/* Approvals Snapshot */}
  <div className="fin-card">
    <div className="fin-card-header">
      <div>
        <div className="fin-card-title">Approvals Snapshot</div>
        <div className="fin-card-subtitle">
          Current approval statistics
        </div>
      </div>
    </div>

    <div className="fin-card-body">

      <div className="fin-stat-row">
        <span>Total Requests</span>
        <strong>42</strong>
      </div>

      <div className="fin-stat-row">
        <span>Approved</span>
        <strong style={{ color: "var(--success)" }}>28</strong>
      </div>

      <div className="fin-stat-row">
        <span>Pending</span>
        <strong style={{ color: "var(--warning)" }}>10</strong>
      </div>

      <div className="fin-stat-row">
        <span>Rejected</span>
        <strong style={{ color: "var(--danger)" }}>4</strong>
      </div>

    </div>
  </div>

</div>
      {/* Compliance Deadlines */}
      <div className="fin-card fin-section">
        <div className="fin-card-header">
          <div>
            <div className="fin-card-title">
              Upcoming Compliance Deadlines
            </div>
            <div className="fin-card-subtitle">
              Audit and finance submissions
            </div>
          </div>
        </div>

        <div className="fin-card-body">
          {deadlines.map((d, i) => (
            <div key={i} className="fin-insight-row">
              <span>{d.title}</span>
              <strong>{d.date}</strong>
            </div>
          ))}
        </div>
      </div>
        </>
      )}
    </div>
  );
}

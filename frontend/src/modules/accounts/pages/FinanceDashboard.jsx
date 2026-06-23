
import "../styles/finance.css";

const kpis = [
  {
    label: "Total Budget",
    value: "₹12,50,000",
    icon: "💰",
    iconBg: "#eff6ff",
    accent: "#2563eb",
    trend: "+5% from last quarter",
    trendUp: true,
  },
  {
    label: "Total Expenses",
    value: "₹8,45,000",
    icon: "📊",
    iconBg: "#fdf4ff",
    accent: "#9333ea",
    trend: "67.6% of budget",
    trendUp: null,
  },
  {
    label: "Remaining Budget",
    value: "₹4,05,000",
    icon: "🏦",
    iconBg: "#f0fdf4",
    accent: "#16a34a",
    trend: "32.4% remaining",
    trendUp: true,
  },
  {
    label: "Pending Bills",
    value: "12",
    icon: "🧾",
    iconBg: "#fffbeb",
    accent: "#d97706",
    trend: "3 due this week",
    trendUp: false,
  },
];

const recentTransactions = [
  {
    date: "08 Jun 2026",
    beneficiary: "TechCorp Pvt Ltd",
    amount: "₹45,000",
    status: "Completed",
  },
  {
    date: "07 Jun 2026",
    beneficiary: "SkillUp Ltd",
    amount: "₹12,500",
    status: "Completed",
  },
  {
    date: "06 Jun 2026",
    beneficiary: "OfficePro",
    amount: "₹88,000",
    status: "Pending",
  },
  {
    date: "05 Jun 2026",
    beneficiary: "TravelHub India",
    amount: "₹8,200",
    status: "Completed",
  },
  {
    date: "04 Jun 2026",
    beneficiary: "EventHouse",
    amount: "₹32,000",
    status: "Pending",
  },
];

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
  Completed: "badge-success",
  Pending: "badge-warning",
};

export default function FinanceDashboard() {
  const utilization = 72;
  const utilizationColor =
    utilization > 80 ? "danger" : utilization > 60 ? "warning" : "success";

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
              {expenseHeads.map((h, i) => (
                <div
                  key={i}
                  className="fin-progress-wrap"
                  style={{ marginBottom: 18 }}
                >
                  <div className="fin-progress-meta">
                    <span>{h.label}</span>
                    <span>{h.pct}%</span>
                  </div>

                  <div className="fin-progress-track">
                    <div
                      className={`fin-progress-fill ${
                        h.pct > 80
                          ? "danger"
                          : h.pct > 60
                          ? "warning"
                          : "success"
                      }`}
                      style={{ width: `${h.pct}%` }}
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
          <div className="fin-table-wrap">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Beneficiary</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {recentTransactions.map((t, i) => (
                  <tr key={i}>
                    <td className="mono">{t.date}</td>
                    <td className="bold">{t.beneficiary}</td>
                    <td className="mono bold">{t.amount}</td>
                    <td>
                      <span className={`fin-badge ${statusMap[t.status]}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="fin-two-col">
        {/* Vendor Snapshot */}
        <div className="fin-card">
          <div className="fin-card-header">
            <div className="fin-card-title">Vendor Snapshot</div>
          </div>

          <div className="fin-card-body">
            <div className="fin-stat-row">
              <span>Total Vendors</span>
              <strong>28</strong>
            </div>
            <div className="fin-stat-row">
              <span>Active Vendors</span>
              <strong>21</strong>
            </div>
            <div className="fin-stat-row">
              <span>Pending Payments</span>
              <strong style={{ color: "var(--warning)" }}>₹1,45,000</strong>
            </div>
          </div>
        </div>

        {/* Approvals Snapshot */}
        <div className="fin-card">
         <div className="fin-card-header">
          <div className="fin-card-title">Approvals Snapshot</div>
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
    </div>
  );
}

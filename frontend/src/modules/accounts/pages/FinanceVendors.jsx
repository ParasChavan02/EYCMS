import "../styles/finance.css";

const vendorKpis = [
  {
    label: "Total Vendors",
    value: "28",
    icon: "🏢",
    iconBg: "#eff6ff",
    accent: "#2563eb",
    trend: "+4 added this month",
    trendUp: true,
  },
  {
    label: "Active Vendors",
    value: "21",
    icon: "✅",
    iconBg: "#f0fdf4",
    accent: "#16a34a",
    trend: "75% active",
    trendUp: true,
  },
  {
    label: "Pending Payments",
    value: "₹1,45,000",
    icon: "⏳",
    iconBg: "#fffbeb",
    accent: "#d97706",
    trend: "5 invoices pending",
    trendUp: false,
  },
  {
    label: "Paid Vendors",
    value: "17",
    icon: "💳",
    iconBg: "#fdf4ff",
    accent: "#9333ea",
    trend: "Processed this month",
    trendUp: true,
  },
];

const vendors = [
  {
    name: "ABC Pvt Ltd",
    category: "Equipment",
    amount: "₹45,000",
    status: "Paid",
  },
  {
    name: "TechNova Systems",
    category: "IT Infrastructure",
    amount: "₹78,500",
    status: "Pending",
  },
  {
    name: "TravelHub India",
    category: "Travel",
    amount: "₹22,400",
    status: "Paid",
  },
  {
    name: "SkillUp Training",
    category: "Training",
    amount: "₹35,000",
    status: "Paid",
  },
  {
    name: "EventHouse Pvt Ltd",
    category: "Events",
    amount: "₹58,000",
    status: "Pending",
  },
  {
    name: "OfficePro Supplies",
    category: "Operations",
    amount: "₹19,800",
    status: "Paid",
  },
];

const categoryUtilization = [
  { category: "Equipment", pct: 82 },
  { category: "Operations", pct: 68 },
  { category: "Travel", pct: 55 },
  { category: "Training", pct: 48 },
  { category: "Events", pct: 74 },
];

const statusMap = {
  Paid: "badge-success",
  Pending: "badge-warning",
};

export default function FinanceVendors() {
  return (
    <div className="fin-page">
      <div className="fin-header">
        <div className="fin-header-top">
          <div>
            <h1>Vendor Management</h1>
            <p className="subtitle">
              Manage vendors, payments, and procurement activities.
            </p>
          </div>
          <span className="fin-badge-role">Read Only Access</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="fin-kpi-grid">
        {vendorKpis.map((k, i) => (
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

      {/* Two Column Layout */}
      <div className="fin-two-col">
        {/* Vendor Table */}
        <div className="fin-card">
          <div className="fin-card-header">
            <div>
              <div className="fin-card-title">Registered Vendors</div>
              <div className="fin-card-subtitle">
                Vendor-wise payment tracking
              </div>
            </div>
          </div>

          <div className="fin-card-body">
            <div className="fin-table-wrap">
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>Vendor Name</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {vendors.map((v, i) => (
                    <tr key={i}>
                      <td className="bold">{v.name}</td>
                      <td>{v.category}</td>
                      <td className="mono bold">{v.amount}</td>
                      <td>
                        <span className={`fin-badge ${statusMap[v.status]}`}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Vendor Insights */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Category Utilization */}
          <div className="fin-card">
            <div className="fin-card-header">
              <div>
                <div className="fin-card-title">Vendor Category Utilization</div>
                <div className="fin-card-subtitle">
                  Spend distribution by category
                </div>
              </div>
            </div>

            <div className="fin-card-body">
              {categoryUtilization.map((c, i) => (
                <div
                  key={i}
                  className="fin-progress-wrap"
                  style={{ marginBottom: 18 }}
                >
                  <div className="fin-progress-meta">
                    <span className="fin-progress-label">{c.category}</span>
                    <span className="fin-progress-pct">{c.pct}%</span>
                  </div>

                  <div className="fin-progress-track">
                    <div
                      className={`fin-progress-fill ${
                        c.pct > 80
                          ? "danger"
                          : c.pct > 60
                          ? "warning"
                          : "success"
                      }`}
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vendor Compliance */}
          <div className="fin-card">
            <div className="fin-card-header">
              <div>
                <div className="fin-card-title">Vendor Compliance</div>
                <div className="fin-card-subtitle">
                  Audit and payment readiness
                </div>
              </div>
            </div>

            <div className="fin-card-body">
              <div className="fin-insight-row">
                <span>✅ GST Verified</span>
                <span>24</span>
              </div>

              <div className="fin-insight-row">
                <span>📄 PAN Submitted</span>
                <span>28</span>
              </div>

              <div className="fin-insight-row">
                <span>🏦 Bank Details Verified</span>
                <span>21</span>
              </div>

              <div className="fin-insight-row">
                <span>⚠ Pending Verification</span>
                <span>7</span>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="fin-card">
            <div className="fin-card-header">
              <div>
                <div className="fin-card-title">Payment Summary</div>
                <div className="fin-card-subtitle">
                  Current vendor payment breakdown
                </div>
              </div>
            </div>

            <div className="fin-card-body">
              <div className="fin-stat-row">
                <span>Total Paid</span>
                <strong style={{ color: "var(--success)" }}>₹3,20,000</strong>
              </div>

              <div className="fin-stat-row">
                <span>Pending Payments</span>
                <strong style={{ color: "var(--warning)" }}>₹1,45,000</strong>
              </div>

              <div className="fin-stat-row">
                <span>This Month Spend</span>
                <strong>₹4,65,000</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
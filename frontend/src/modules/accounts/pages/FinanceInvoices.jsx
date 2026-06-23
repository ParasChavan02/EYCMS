import "../styles/finance.css";

const invoiceKpis = [
  {
    label: "Invoices Raised",
    value: "58",
    icon: "🧾",
    iconBg: "#eff6ff",
    accent: "#2563eb",
    trend: "+8 this month",
    trendUp: true,
  },
  {
    label: "Paid",
    value: "37",
    icon: "✅",
    iconBg: "#f0fdf4",
    accent: "#16a34a",
    trend: "63.7% paid",
    trendUp: true,
  },
  {
    label: "Pending",
    value: "14",
    icon: "⏳",
    iconBg: "#fffbeb",
    accent: "#d97706",
    trend: "Awaiting clearance",
    trendUp: false,
  },
  {
    label: "Overdue",
    value: "7",
    icon: "⚠",
    iconBg: "#fef2f2",
    accent: "#dc2626",
    trend: "Need urgent action",
    trendUp: false,
  },
];

const invoices = [
  {
    invoiceNo: "INV001",
    vendor: "ABC Pvt Ltd",
    amount: "₹30,000",
    dueDate: "15 Jun 2026",
    status: "Paid",
  },
  {
    invoiceNo: "INV002",
    vendor: "TechNova Systems",
    amount: "₹72,500",
    dueDate: "18 Jun 2026",
    status: "Pending",
  },
  {
    invoiceNo: "INV003",
    vendor: "TravelHub India",
    amount: "₹14,800",
    dueDate: "10 Jun 2026",
    status: "Overdue",
  },
  {
    invoiceNo: "INV004",
    vendor: "EventHouse Pvt Ltd",
    amount: "₹44,000",
    dueDate: "22 Jun 2026",
    status: "Pending",
  },
  {
    invoiceNo: "INV005",
    vendor: "OfficePro Supplies",
    amount: "₹19,500",
    dueDate: "25 Jun 2026",
    status: "Paid",
  },
];

const statusMap = {
  Paid: "badge-success",
  Pending: "badge-warning",
  Overdue: "badge-danger",
};

export default function FinanceInvoices() {
  return (
    <div className="fin-page">
      <div className="fin-header">
        <div className="fin-header-top">
          <div>
            <h1>Invoice Management</h1>
            <p className="subtitle">
              Track raised invoices, due dates, and payment collections.
            </p>
          </div>
          <span className="fin-badge-role">Read Only Access</span>
        </div>
      </div>

      <div className="fin-kpi-grid">
        {invoiceKpis.map((k, i) => (
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

      <div className="fin-two-col">
        <div className="fin-card">
          <div className="fin-card-header">
            <div>
              <div className="fin-card-title">Invoice Records</div>
              <div className="fin-card-subtitle">
                Monitor invoice lifecycle
              </div>
            </div>
          </div>

          <div className="fin-card-body">
            <div className="fin-table-wrap">
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Vendor</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {invoices.map((inv, i) => (
                    <tr key={i}>
                      <td className="mono bold">{inv.invoiceNo}</td>
                      <td>{inv.vendor}</td>
                      <td className="mono bold">{inv.amount}</td>
                      <td>{inv.dueDate}</td>
                      <td>
                        <span className={`fin-badge ${statusMap[inv.status]}`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="fin-card">
            <div className="fin-card-header">
              <div className="fin-card-title">Invoice Summary</div>
            </div>

            <div className="fin-card-body">
              <div className="fin-stat-row">
                <span>Total Raised</span>
                <strong>₹8,75,000</strong>
              </div>
              <div className="fin-stat-row">
                <span>Collected</span>
                <strong style={{ color: "var(--success)" }}>₹5,20,000</strong>
              </div>
              <div className="fin-stat-row">
                <span>Pending</span>
                <strong style={{ color: "var(--warning)" }}>₹2,10,000</strong>
              </div>
              <div className="fin-stat-row">
                <span>Overdue</span>
                <strong style={{ color: "var(--danger)" }}>₹1,45,000</strong>
              </div>
            </div>
          </div>

          <div className="fin-card">
            <div className="fin-card-header">
              <div className="fin-card-title">Compliance Status</div>
            </div>

            <div className="fin-card-body">
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                <li>✅ GST Filed</li>
                <li>✅ Vendor Reconciliation Done</li>
                <li>⚠ 7 Overdue Invoices</li>
                <li>📊 Monthly Closing Pending</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
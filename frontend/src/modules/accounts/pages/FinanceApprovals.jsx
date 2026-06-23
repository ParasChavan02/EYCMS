import "../styles/finance.css";

const approvalKpis = [
  {
    label: "Total Requests",
    value: "42",
    icon: "📑",
    iconBg: "#eff6ff",
    accent: "#2563eb",
    trend: "+8 this week",
    trendUp: true,
  },
  {
    label: "Approved",
    value: "28",
    icon: "✅",
    iconBg: "#f0fdf4",
    accent: "#16a34a",
    trend: "67% approved",
    trendUp: true,
  },
  {
    label: "Pending",
    value: "10",
    icon: "⏳",
    iconBg: "#fffbeb",
    accent: "#d97706",
    trend: "Awaiting admin review",
    trendUp: false,
  },
  {
    label: "Rejected",
    value: "4",
    icon: "❌",
    iconBg: "#fef2f2",
    accent: "#dc2626",
    trend: "Requires re-submission",
    trendUp: false,
  },
];

const approvals = [
  {
    id: "APR001",
    type: "Vendor Payment",
    requestedBy: "Admin",
    amount: "₹45,000",
    status: "Approved",
    approvedBy: "Finance Head",
    date: "12 Jun 2026",
  },
  {
    id: "APR002",
    type: "Bill Approval",
    requestedBy: "Accounts Team",
    amount: "₹18,500",
    status: "Pending",
    approvedBy: "-",
    date: "13 Jun 2026",
  },
  {
    id: "APR003",
    type: "Expense Reimbursement",
    requestedBy: "HR",
    amount: "₹9,200",
    status: "Approved",
    approvedBy: "Finance Head",
    date: "11 Jun 2026",
  },
  {
    id: "APR004",
    type: "Invoice Verification",
    requestedBy: "Admin",
    amount: "₹62,000",
    status: "Rejected",
    approvedBy: "Finance Head",
    date: "10 Jun 2026",
  },
  {
    id: "APR005",
    type: "Budget Revision",
    requestedBy: "Operations",
    amount: "₹1,20,000",
    status: "Pending",
    approvedBy: "-",
    date: "14 Jun 2026",
  },
];

const statusMap = {
  Approved: "badge-success",
  Pending: "badge-warning",
  Rejected: "badge-danger",
};

export default function FinanceApprovals() {
  return (
    <div className="fin-page">
      {/* HEADER */}
      <div className="fin-header">
        <div className="fin-header-top">
          <div>
            <h1>Approvals Center</h1>
            <p className="subtitle">
              Monitor approvals, payment clearances, and admin verifications.
            </p>
          </div>
          <span className="fin-badge-role">Read Only Access</span>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="fin-kpi-grid">
        {approvalKpis.map((k, i) => (
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

      {/* MAIN CONTENT */}
      <div className="fin-two-col">
        {/* APPROVAL TABLE */}
        <div className="fin-card">
          <div className="fin-card-header">
            <div>
              <div className="fin-card-title">Approval Requests</div>
              <div className="fin-card-subtitle">
                Recent admin and finance approval requests
              </div>
            </div>
          </div>

          <div className="fin-card-body">
            <div className="fin-table-wrap">
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Type</th>
                    <th>Requested By</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Approved By</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {approvals.map((a, i) => (
                    <tr key={i}>
                      <td className="mono bold">{a.id}</td>
                      <td>{a.type}</td>
                      <td>{a.requestedBy}</td>
                      <td className="mono bold">{a.amount}</td>
                      <td>
                        <span className={`fin-badge ${statusMap[a.status]}`}>
                          {a.status}
                        </span>
                      </td>
                      <td>{a.approvedBy}</td>
                      <td className="mono">{a.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* APPROVAL WORKFLOW */}
          <div className="fin-card">
            <div className="fin-card-header">
              <div className="fin-card-title">Approval Workflow</div>
            </div>

            <div className="fin-card-body">
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <li>📝 Request Submitted</li>
                <li>🔍 Admin Verification</li>
                <li>📑 Finance Review</li>
                <li>✅ Final Approval</li>
              </ul>
            </div>
          </div>

          {/* COMPLIANCE STATUS */}
          <div className="fin-card">
            <div className="fin-card-header">
              <div className="fin-card-title">Compliance Status</div>
            </div>

            <div className="fin-card-body">
              <div className="fin-insight-row">
                <span>✔ Bills Verified</span>
              </div>

              <div className="fin-insight-row">
                <span>✔ Vendor KYC Approved</span>
              </div>

              <div className="fin-insight-row">
                <span>✔ Expense Documents Uploaded</span>
              </div>

              <div className="fin-insight-row">
                <span>⚠ 3 Requests Awaiting Approval</span>
              </div>
            </div>
          </div>

          {/* SUMMARY */}
          <div className="fin-card">
            <div className="fin-card-header">
              <div className="fin-card-title">Approval Summary</div>
            </div>

            <div className="fin-card-body">
              <div className="fin-insight-row">
                <span>Approved</span>
                <span>28</span>
              </div>

              <div className="fin-insight-row">
                <span>Pending</span>
                <span>10</span>
              </div>

              <div className="fin-insight-row">
                <span>Rejected</span>
                <span>4</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
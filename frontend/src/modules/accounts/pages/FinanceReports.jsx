import { useState } from "react";
import "../styles/finance.css";

const monthlyData = [
  { month: "Jan", expense: 62000 },
  { month: "Feb", expense: 74000 },
  { month: "Mar", expense: 88000 },
  { month: "Apr", expense: 71000 },
  { month: "May", expense: 95000 },
  { month: "Jun", expense: 82000 },
  { month: "Jul", expense: 110000 },
  { month: "Aug", expense: 98000 },
  { month: "Sep", expense: 87000 },
  { month: "Oct", expense: 105000 },
  { month: "Nov", expense: 92000 },
  { month: "Dec", expense: 78000 },
];

const categoryData = [
  { category: "Travel", amount: 110000 },
  { category: "Equipment", amount: 287000 },
  { category: "Training", amount: 72000 },
  { category: "Events", amount: 113400 },
  { category: "Operations", amount: 225000 },
  { category: "IT", amount: 148000 },
];

const reports = [
  {
    name: "Monthly Expense Report — Jun 2026",
    period: "June 2026",
    generated: "08 Jun 2026",
    status: "Ready",
  },
  {
    name: "Q2 Budget Utilization Report",
    period: "Apr–Jun 2026",
    generated: "07 Jun 2026",
    status: "Ready",
  },
  {
    name: "Annual Finance Summary 2025",
    period: "FY 2025",
    generated: "01 Jan 2026",
    status: "Ready",
  },
  {
    name: "Vendor Payment Report — May 2026",
    period: "May 2026",
    generated: "02 Jun 2026",
    status: "Ready",
  },
  {
    name: "Department-wise Expense Breakdown",
    period: "Q1 2026",
    generated: "01 Apr 2026",
    status: "Ready",
  },
  {
    name: "Audit Compliance Report",
    period: "Q1 2026",
    generated: "28 Mar 2026",
    status: "Ready",
  },
];

const kpis = [
  {
    label: "Monthly Expense",
    value: "₹82,000",
    icon: "📅",
    accent: "#2563eb",
    iconBg: "#eff6ff",
  },
  {
    label: "Quarterly Expense",
    value: "₹2,48,000",
    icon: "📆",
    accent: "#9333ea",
    iconBg: "#fdf4ff",
  },
  {
    label: "Annual Expense",
    value: "₹10,42,400",
    icon: "📊",
    accent: "#d97706",
    iconBg: "#fffbeb",
  },
  {
    label: "Reports Generated",
    value: "24",
    icon: "📄",
    accent: "#16a34a",
    iconBg: "#f0fdf4",
  },
];

export default function FinanceReports() {
  const [search, setSearch] = useState("");

  const filtered = reports.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.period.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fin-page">
      {/* Header */}
      <div className="fin-header">
        <div className="fin-header-top">
          <div>
            <h1>Reports & Analytics</h1>
            <p className="subtitle">
              Financial analytics, expense trends and generated reports.
            </p>
          </div>

          <span className="fin-badge-role">
            Read Only Access
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="fin-kpi-grid">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className="fin-kpi-card"
            style={{
              "--accent": kpi.accent,
              "--icon-bg": kpi.iconBg,
            }}
          >
            <div className="fin-kpi-icon">{kpi.icon}</div>
            <div className="fin-kpi-label">{kpi.label}</div>
            <div className="fin-kpi-value">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Analytics Tables */}
      <div className="fin-two-col">
        <div className="fin-card">
          <div className="fin-card-header">
            <div>
              <div className="fin-card-title">
                Monthly Expense Trend
              </div>
              <div className="fin-card-subtitle">
                Jan – Dec 2026
              </div>
            </div>
          </div>

          <div className="fin-card-body">
            <div className="fin-table-wrap">
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Expense</th>
                  </tr>
                </thead>

                <tbody>
                  {monthlyData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.month}</td>
                      <td className="bold mono">
                        ₹{item.expense.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="fin-card">
          <div className="fin-card-header">
            <div>
              <div className="fin-card-title">
                Category Expense Breakdown
              </div>
              <div className="fin-card-subtitle">
                Expense by category
              </div>
            </div>
          </div>

          <div className="fin-card-body">
            <div className="fin-table-wrap">
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {categoryData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.category}</td>
                      <td className="bold mono">
                        ₹{item.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Reports */}
      <div className="fin-card fin-section">
        <div className="fin-card-header">
          <div>
            <div className="fin-card-title">
              Generated Reports
            </div>
            <div className="fin-card-subtitle">
              {filtered.length} reports available
            </div>
          </div>
        </div>

        <div className="fin-card-body">
          <div className="fin-search-row">
            <div className="fin-search">
              <span className="fin-search-icon">🔍</span>

              <input
                type="text"
                placeholder="Search reports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="fin-table-wrap">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Report Name</th>
                  <th>Period</th>
                  <th>Generated Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((report, index) => (
                  <tr key={index}>
                    <td className="bold">{report.name}</td>
                    <td>{report.period}</td>
                    <td className="mono">{report.generated}</td>

                    <td>
                      <span className="fin-badge badge-success">
                        {report.status}
                      </span>
                    </td>

                    <td>
                      <button className="fin-btn fin-btn-ghost fin-btn-sm">
                        👁 View
                      </button>
                    </td>
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
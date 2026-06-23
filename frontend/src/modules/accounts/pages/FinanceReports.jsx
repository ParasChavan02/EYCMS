import { useState } from "react";
import "../styles/finance.css";

const monthlyData = [
  { month: "Jan", expense: 62000 },
  { month: "Feb", expense: 74000 },
  { month: "Mar", expense: 88000 },
  { month: "Apr", expense: 71000 },
  { month: "May", expense: 95000 },
  { month: "Jun", expense: 82000 },
];

const categoryData = [
  { category: "Travel", amount: 110000 },
  { category: "Equipment", amount: 287000 },
  { category: "Training", amount: 72000 },
  { category: "Events", amount: 113400 },
  { category: "Operations", amount: 225000 },
  { category: "IT", amount: 148000 },
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

const reports = [
  {
    id: 1,
    name: "Monthly Expense Report — Jun 2026",
    category: "Expense",
    period: "June 2026",
    generated: "08 Jun 2026",
    generatedBy: "Finance Manager",
    version: "v1.2",
    status: "Approved",
    summary:
      "Monthly expenditure analysis including training, operations and procurement expenses.",
  },
  {
    id: 2,
    name: "Q2 Budget Utilization Report",
    category: "Budget",
    period: "Apr–Jun 2026",
    generated: "07 Jun 2026",
    generatedBy: "Admin",
    version: "v2.0",
    status: "Approved",
    summary:
      "Quarterly budget utilization and remaining balance across all budget heads.",
  },
  {
    id: 3,
    name: "Annual Finance Summary 2025",
    category: "Finance",
    period: "FY 2025",
    generated: "01 Jan 2026",
    generatedBy: "System",
    version: "v3.0",
    status: "Approved",
    summary:
      "Year-end financial summary including grants, expenditures and balances.",
  },
  {
    id: 4,
    name: "Vendor Payment Report",
    category: "Vendor",
    period: "May 2026",
    generated: "02 Jun 2026",
    generatedBy: "Finance Executive",
    version: "v1.1",
    status: "Approved",
    summary:
      "Vendor settlements and payment status report.",
  },
  {
    id: 5,
    name: "Audit Compliance Report",
    category: "Audit",
    period: "Q1 2026",
    generated: "28 Mar 2026",
    generatedBy: "System",
    version: "v1.0",
    status: "Pending",
    summary:
      "Compliance observations and audit recommendations.",
  },
];

export default function FinanceReports() {
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);

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

      {/* Analytics */}
      <div className="fin-two-col">
        <div className="fin-card">
          <div className="fin-card-header">
            <div className="fin-card-title">
              Monthly Expense Trend
            </div>
          </div>

          <div className="fin-card-body">
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
                    <td>
                      ₹{item.expense.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="fin-card">
          <div className="fin-card-header">
            <div className="fin-card-title">
              Category Breakdown
            </div>
          </div>

          <div className="fin-card-body">
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
                    <td>
                      ₹{item.amount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              <input
                type="text"
                placeholder="Search reports..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>
          </div>

          <div className="fin-table-wrap">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Category</th>
                  <th>Version</th>
                  <th>Generated By</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <div className="bold">
                        {report.name}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-3)",
                        }}
                      >
                        {report.period}
                      </div>
                    </td>

                    <td>{report.category}</td>
                    <td>{report.version}</td>
                    <td>{report.generatedBy}</td>

                    <td>
                      <span
                        className={`fin-badge ${
                          report.status === "Approved"
                            ? "badge-success"
                            : "badge-warning"
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>

                    <td>
                      <button
                        className="fin-btn fin-btn-sm"
                        onClick={() => {
  console.log(report);
  setSelectedReport(report);
}}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      {selectedReport && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    }}
  >
    <div
      style={{
        width: "700px",
        maxWidth: "90%",
        background: "#fff",
        borderRadius: "12px",
        padding: "24px",
        maxHeight: "80vh",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <h2>{selectedReport.name}</h2>

        <button
          onClick={() => setSelectedReport(null)}
          className="fin-btn"
        >
          ✕
        </button>
      </div>

      <p>
        <strong>Category:</strong>{" "}
        {selectedReport.category}
      </p>

      <p>
        <strong>Version:</strong>{" "}
        {selectedReport.version}
      </p>

      <p>
        <strong>Generated By:</strong>{" "}
        {selectedReport.generatedBy}
      </p>

      <p>
        <strong>Status:</strong>{" "}
        {selectedReport.status}
      </p>

      <hr />

      <p>{selectedReport.summary}</p>

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          gap: "10px",
        }}
      >
        <button className="fin-btn">
          Download PDF
        </button>

        <button className="fin-btn fin-btn-ghost">
          Export Excel
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
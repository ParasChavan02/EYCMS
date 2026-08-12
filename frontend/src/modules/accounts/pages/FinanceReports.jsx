import { useEffect, useState } from "react";
import { accountsService, getFileUrl } from "../services/accountsService";
import "../styles/finance.css";

function fmtINR(n) {
  return "₹" + Math.round(n || 0).toLocaleString("en-IN");
}

export default function FinanceReports() {
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // GET /reports/admin-files is reused as-is; the backend already
        // restricts the Accounts role to "bill" and "uc" categories only.
        const [docs, txns] = await Promise.all([
          accountsService.getFinanceDocuments(),
          accountsService.getTransactions(),
        ]);
        if (!isMounted) return;
        setDocuments(docs || []);
        setTransactions(txns || []);
      } catch (err) {
        if (isMounted) setError(err?.response?.data?.error || "Unable to load reports.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Reports table, mapped from real ProjectFile records (bills & UCs)
  const reports = documents.map((d) => ({
    id: d.id,
    name: d.originalFileName || d.original_file_name || d.fileName,
    category: d.category,
    period: d.eventName || d.event_name || "—",
    generated: d.createdAt || d.created_at,
    generatedBy: d.uploadedByName || d.uploaded_by_name || "Unknown",
    status: d.status,
    summary: `${(d.category || "").toUpperCase()} document uploaded by ${d.uploadedByName || d.uploaded_by_name || "Unknown"}.`,
    url: d.url,
  }));

  const filtered = reports.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.period.toLowerCase().includes(search.toLowerCase())
  );

  // Monthly / category breakdowns derived client-side from the real
  // transaction list (reusing GET /accounts/transactions - no new endpoint).
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
    const label = d.toLocaleString("en-IN", { month: "short" });
    const total = transactions
      .filter((t) => {
        const td = new Date(t.date);
        return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
      })
      .reduce((sum, t) => sum + t.amount, 0);
    return { month: label, expense: total };
  });

  const categoryTotals = {};
  transactions.forEach((t) => {
    categoryTotals[t.budget_head] = (categoryTotals[t.budget_head] || 0) + t.amount;
  });
  const categoryData = Object.entries(categoryTotals).map(([category, amount]) => ({
    category,
    amount,
  }));

  const monthlyExpense = monthlyData[monthlyData.length - 1]?.expense || 0;
  const quarterlyExpense = monthlyData.slice(-3).reduce((s, m) => s + m.expense, 0);
  const annualExpense = transactions.reduce((s, t) => s + t.amount, 0);

  const kpis = [
    { label: "This Month's Expense", value: fmtINR(monthlyExpense), icon: "📅", accent: "#2563eb", iconBg: "#eff6ff" },
    { label: "Last 3 Months", value: fmtINR(quarterlyExpense), icon: "📆", accent: "#9333ea", iconBg: "#fdf4ff" },
    { label: "Total Expense (all time)", value: fmtINR(annualExpense), icon: "📊", accent: "#d97706", iconBg: "#fffbeb" },
    { label: "Bills / UCs Available", value: String(documents.length), icon: "📄", accent: "#16a34a", iconBg: "#f0fdf4" },
  ];

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

      {error && <div className="fin-empty">{error}</div>}
      {loading && !error && <div className="fin-empty">Loading reports…</div>}

      {!loading && !error && (
        <>
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
      

      {/* Reports */}
      <div className="fin-card fin-section">
        <div className="fin-card-header">
          <div>
            <div className="fin-card-title">
              Bills & Utilization Certificates
            </div>
            <div className="fin-card-subtitle">
              {filtered.length} document(s) available
            </div>
          </div>
        </div>

        <div className="fin-card-body">
          <div className="fin-search-row">
            <div className="fin-search">
              <input
                type="text"
                placeholder="Search documents..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="fin-empty">No matching documents found.</div>
          ) : (
          <div className="fin-table-wrap">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Category</th>
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
                    <td>{report.generatedBy}</td>

                    <td>
                      <span
                        className={`fin-badge ${
                          report.status === "APPROVED"
                            ? "badge-success"
                            : report.status === "REJECTED"
                            ? "badge-danger"
                            : "badge-warning"
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>

                    <td>
                      <button
                        className="fin-btn fin-btn-sm"
                        onClick={() => setSelectedReport(report)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
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
    onClick={() => setSelectedReport(null)}
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
      onClick={(e) => e.stopPropagation()}
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
        <strong>Generated By:</strong>{" "}
        {selectedReport.generatedBy}
      </p>

      <p>
        <strong>Status:</strong>{" "}
        {selectedReport.status}
      </p>

      <hr />

      <p>{selectedReport.summary}</p>

      {selectedReport.url && (
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            gap: "10px",
          }}
        >
          <a
            className="fin-btn"
            href={getFileUrl(selectedReport.url)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open File
          </a>
        </div>
      )}
    </div>
  </div>
)}
        </>
      )}
    </div>
  );
}
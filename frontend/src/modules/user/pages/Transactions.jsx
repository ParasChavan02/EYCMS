import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { ArrowRightLeft, CreditCard, DollarSign, Download, FileSpreadsheet, FileText, CheckCircle2, Clock, XCircle, Activity, Info, IndianRupee, Send, FileCheck2, UploadCloud } from "lucide-react";
import Chart from "chart.js/auto";
import { useNotification } from "../../common/hooks/useNotification";
import { transactionService } from "../../../services/transactionService";
import "./user-erp.css";
// Reusable Chart Component matching existing ERP architecture
function CategoryChart({ type, data, options }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current) {
      return undefined;
    }
    const chart = new Chart(canvasRef.current, { type, data, options });
    return () => chart.destroy();
  }, [type, data, options]);
  return <canvas ref={canvasRef} />;
}
function Transactions() {
  const { addNotification } = useNotification();
  const [searchFilter, setSearchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [ucStatus, setUcStatus] = useState(() => localStorage.getItem("uc_status") || "NOT_REQUESTED");

  useEffect(() => {
    const handleStorageChange = () => {
      setUcStatus(localStorage.getItem("uc_status") || "NOT_REQUESTED");
    };
    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleRequestUC = () => {
    localStorage.setItem("uc_status", "REQUESTED");
    setUcStatus("REQUESTED");
    addNotification("Request for Utilization Certificate sent to Admin successfully.", "success", 3000, false);
  };

  const handleSimulateAdminUpload = () => {
    localStorage.setItem("uc_status", "TEMPLATE_UPLOADED");
    setUcStatus("TEMPLATE_UPLOADED");
    addNotification("Admin uploaded the UC template successfully.", "success", 3000, false);
  };
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectCategories, setProjectCategories] = useState([]);

  const loadProjectCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
      const res = await axios.get(`${API_BASE_URL}/user/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjectCategories(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load project categories:", err);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await transactionService.getBackendTransactions();
      const mapped = (res || []).map(t => {
        const tone = t.status === "APPROVED" ? "approved" : t.status === "REJECTED" ? "rejected" : "pending";
        const categoryName = t.category || t.budget_head || "Miscellaneous";
        
        return {
          id: t.id.substring(0, 8).toUpperCase(),
          date: new Date(t.created_at || new Date()).toLocaleDateString("en-IN"),
          category: categoryName,
          description: t.description,
          amount: t.amount,
          status: t.status === "APPROVED" ? "Approved" : t.status === "REJECTED" ? "Rejected" : "Pending",
          tone: tone,
          rawStatus: t.status
        };
      });
      setTransactions(mapped);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    loadProjectCategories();
  }, []);

  const sanctionedTotal = projectCategories.reduce((sum, c) => sum + c.allocated, 0) || 300000;
  const spentTotal = transactions.filter(t => t.rawStatus === "APPROVED").reduce((sum, t) => sum + t.amount, 0);
  const remainingTotal = sanctionedTotal - spentTotal;
  const pendingTotal = transactions.filter(t => t.rawStatus === "PENDING").reduce((sum, t) => sum + t.amount, 0);

  const summaryCards = [
    { icon: DollarSign, label: "Total Budget Allocated", value: sanctionedTotal, note: "Overall event budget limit", color: "#1d5cff" },
    { icon: CreditCard, label: "Total Amount Spent", value: spentTotal, note: "Sum of approved expenses", color: "#16a34a" },
    { icon: CheckCircle2, label: "Remaining Budget", value: remainingTotal, note: "Available to spend", color: "#7c3aed" },
    { icon: Clock, label: "Pending Reimbursements", value: pendingTotal, note: "Awaiting approval", color: "#b45309" },
  ];

  const categories = useMemo(() => {
    const allocations = {};
    const spents = {};

    projectCategories.forEach(c => {
      allocations[c.category] = c.allocated;
      spents[c.category] = 0;
    });

    transactions.forEach(t => {
      if (t.rawStatus === "APPROVED") {
        if (spents[t.category] !== undefined) {
          spents[t.category] += t.amount;
        } else {
          if (!spents["Miscellaneous"]) {
            spents["Miscellaneous"] = 0;
            allocations["Miscellaneous"] = 0;
          }
          spents["Miscellaneous"] += t.amount;
        }
      }
    });

    const catKeys = Object.keys(allocations);
    if (catKeys.length === 0) {
      return [
        { name: "Venue", allocated: 100000, spent: 0 },
        { name: "Food & Refreshments", allocated: 50000, spent: 0 },
        { name: "Marketing", allocated: 40000, spent: 0 },
        { name: "Travel", allocated: 50000, spent: 0 },
        { name: "Miscellaneous", allocated: 60000, spent: 0 }
      ];
    }

    return catKeys.map(k => ({
      name: k,
      allocated: allocations[k],
      spent: spents[k] || 0
    }));
  }, [projectCategories, transactions]);

  const events = [];
  const financialActivity = transactions.slice(0, 5).map(t => ({
    text: `${t.description} (${t.category})`,
    time: t.date,
    status: t.status,
    tone: t.tone
  }));
  // Filtering Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const matchesSearch =
        txn.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
        txn.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
        txn.id.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesCategory = categoryFilter === "All" || txn.category === categoryFilter;
      const matchesStatus = statusFilter === "All" || txn.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchFilter, categoryFilter, statusFilter, transactions]);
  // Chart configuration
  const chartData = {
    labels: categories.map((c) => c.name),
    datasets: [
      {
        label: "Allocated (Rs)",
        data: categories.map((c) => c.allocated),
        backgroundColor: "#1d5cff",
        borderRadius: 8,
        barPercentage: 0.6,
      },
      {
        label: "Spent (Rs)",
        data: categories.map((c) => c.spent),
        backgroundColor: "#10b981",
        borderRadius: 8,
        barPercentage: 0.6,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: "#243b58",
          font: {
            family: "'Outfit', 'Inter', sans-serif",
            weight: "600",
            size: 13,
          },
          padding: 18,
        },
      },
      tooltip: {
        backgroundColor: "#0f1f34",
        titleFont: { family: "'Outfit', sans-serif", size: 13 },
        bodyFont: { family: "'Outfit', sans-serif", size: 13 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => ` ${context.dataset.label}: Rs ${context.raw.toLocaleString("en-IN")}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#536987",
          font: { family: "'Outfit', sans-serif", size: 12 },
        },
      },
      y: {
        border: { dash: [5, 5] },
        grid: { color: "#e2e8f0" },
        ticks: {
          color: "#536987",
          font: { family: "'Outfit', sans-serif", size: 12 },
          callback: (value) => `Rs ${value / 1000}k`,
        },
      },
    },
  };
  // CSV Export
  const handleExportExcel = () => {
    try {
      const headers = ["ID", "Date", "Category", "Description", "Amount (Rs)", "Status"];
      const rows = filteredTransactions.map((t) => [
        t.id,
        t.date,
        t.category,
        t.description,
        t.amount,
        t.status,
      ]);
      const csvContent =
        "data:text/csv;charset=utf-8,\uFEFF" +
        [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Transactions_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addNotification("Excel report exported successfully.", "success", 3000, false);
    } catch (error) {
      addNotification("Failed to export Excel report.", "error", 3000, false);
    }
  };
  // PDF Export (Uses browser print window formatted cleanly)
  const handleExportPDF = () => {
    addNotification("Preparing print interface...", "info", 2000, false);
    setTimeout(() => {
      window.print();
    }, 500);
  };
  return (
    <main className="user-erp-page">
      <div className="user-erp-shell">

        {/* Header Bar */}
        <header className="user-erp-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1>Transactions & Budgets</h1>
            <p>View expenditures, budget allocations, and transaction history.</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button className="user-secondary-button" type="button" onClick={handleExportExcel} style={{ display: "flex", alignItems: "center", gap: "8px", minHeight: "44px" }}>
              <FileSpreadsheet size={16} />
              Export Excel
            </button>
            <button className="user-primary-button" type="button" onClick={handleExportPDF} style={{ display: "flex", alignItems: "center", gap: "8px", minHeight: "44px", background: "linear-gradient(135deg, #1d5cff, #0f46d8)" }}>
              <FileText size={16} />
              Download PDF
            </button>
          </div>
        </header>
        {/* View-Only Indicator Alert Banner */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f0f5ff", border: "1px solid #1d5cff", borderRadius: "12px", padding: "16px 20px", color: "#0f4ad8", fontSize: "0.95rem" }}>
          <Info size={20} strokeWidth={2} style={{ flexShrink: 0 }} />
          <span><strong>View-Only Workspace:</strong> Your account has read-only access to transaction history and budget tracking. Actions involving budget adjustments, approvals, or expense generation are restricted.</span>
        </div>
        {/* KPI Cards Grid */}
        <section className="user-stat-grid">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <article className="user-erp-card user-stat-card" key={card.label}>
                <div className="user-stat-icon" style={{ color: card.color, background: `${card.color}15` }}>
                  <Icon size={26} />
                </div>
                <div>
                  <p>{card.label}</p>
                  <strong>Rs {card.value.toLocaleString("en-IN")}</strong>
                  <span className="user-stat-note">{card.note}</span>
                </div>
              </article>
            );
          })}
        </section>
        {/* Chart Section */}
        <section className="user-erp-card">
          <div style={{ marginBottom: "20px" }}>
            <h2>Budget Utilization</h2>
            <p style={{ margin: "4px 0 0", color: "#536987", fontSize: "0.9rem" }}>Comparison of allocated vs spent budgets across major spending categories.</p>
          </div>
          <div className="chart-container" style={{ position: "relative", height: "320px", width: "100%" }}>
            <CategoryChart type="bar" data={chartData} options={chartOptions} />
          </div>
        </section>
        {/* Double Table Grid Layout */}
        <section className="user-dashboard-grid">

          {/* Utilization Certificate (UC) Section */}
          <article className="user-erp-card">
            <div style={{ marginBottom: "20px" }}>
              <h2>Utilization Certificate (UC) Status</h2>
              <p style={{ margin: "4px 0 0", color: "#536987", fontSize: "0.85rem" }}>
                Request, download, and track the status of your project's Utilization Certificate.
              </p>
            </div>

            <div style={{ background: "#f8fafc", border: "1px dashed #cfd9e8", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#304761" }}>UC Request Status:</span>
                {ucStatus === "NOT_REQUESTED" && (
                  <span className="user-status pending" style={{ padding: "4px 12px" }}>Not Requested</span>
                )}
                {ucStatus === "REQUESTED" && (
                  <span className="user-status review" style={{ padding: "4px 12px" }}>Requested (Awaiting Admin)</span>
                )}
                {ucStatus === "TEMPLATE_UPLOADED" && (
                  <span className="user-status open" style={{ padding: "4px 12px" }}>Template Provided</span>
                )}
                {ucStatus === "SUBMITTED" && (
                  <span className="user-status approved" style={{ padding: "4px 12px" }}>Submitted & Under Review</span>
                )}
              </div>

              <p style={{ margin: 0, fontSize: "0.88rem", color: "#536987", lineHeight: "1.4" }}>
                {ucStatus === "NOT_REQUESTED" && "You have not requested the Utilization Certificate template yet. Please request it from the admin to proceed with reporting."}
                {ucStatus === "REQUESTED" && "Your request for the UC template has been sent to the admin portal. Once the admin uploads the template, you will be able to download it here."}
                {ucStatus === "TEMPLATE_UPLOADED" && "The admin has provided the UC template. Download it, fill out the required details, and upload the signed document in the Reports page."}
                {ucStatus === "SUBMITTED" && "You have successfully submitted the completed Utilization Certificate. It is currently under review by the administration."}
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "4px" }}>
                {ucStatus === "NOT_REQUESTED" && (
                  <button className="user-primary-button" type="button" onClick={handleRequestUC} style={{ display: "inline-flex", alignItems: "center", gap: "8px", minHeight: "44px", background: "linear-gradient(135deg, #1d5cff, #0f46d8)", padding: "0 16px", fontSize: "0.9rem" }}>
                    <Send size={16} />
                    Request UC from Admin
                  </button>
                )}

                {ucStatus === "REQUESTED" && (
                  <div style={{ display: "flex", gap: "12px", width: "100%", flexDirection: "column" }}>
                    <div style={{ padding: "10px", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "8px", fontSize: "0.8rem", color: "#b45309", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Info size={14} />
                      <span><strong>Demo Simulation:</strong> Simulate the admin receiving the request and uploading the UC template.</span>
                    </div>
                    <button className="user-secondary-button" type="button" onClick={handleSimulateAdminUpload} style={{ display: "inline-flex", alignItems: "center", gap: "8px", minHeight: "44px", border: "1px solid #16a34a", color: "#16a34a", padding: "0 16px", fontSize: "0.9rem", width: "fit-content" }}>
                      <UploadCloud size={16} />
                      Simulate Admin Upload
                    </button>
                  </div>
                )}

                {ucStatus === "TEMPLATE_UPLOADED" && (
                  <a href="#" onClick={(e) => { e.preventDefault(); addNotification("UC Template PDF download started.", "success", 2000); }} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "linear-gradient(135deg, #16a34a, #15803d)", color: "white", padding: "12px 20px", borderRadius: "12px", textDecoration: "none", fontWeight: "700", fontSize: "0.9rem", boxShadow: "0 4px 12px rgba(22, 163, 74, 0.2)" }}>
                    <Download size={16} />
                    Download UC Template
                  </a>
                )}

                {ucStatus === "SUBMITTED" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#16a34a", fontWeight: "600", fontSize: "0.9rem" }}>
                    <FileCheck2 size={20} />
                    <span>Filled UC Submitted Successfully</span>
                  </div>
                )}
              </div>
            </div>
          </article>
          {/* Recent Financial Activity timeline */}
          <article className="user-erp-card">
            <div style={{ marginBottom: "20px" }}>
              <h2>Recent Financial Activity</h2>
              <p style={{ margin: "4px 0 0", color: "#536987", fontSize: "0.85rem" }}>Timeline of latest approvals, rejections, and bill submittals.</p>
            </div>
            <div className="user-list">
              {financialActivity.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "#64748b", fontSize: "0.9rem" }}>
                  No recent financial activity recorded.
                </div>
              ) : (
                financialActivity.map((activity, index) => (
                  <div className="user-list-row" key={index} style={{ borderLeft: `3px solid ${activity.tone === "approved" ? "#10b981" : activity.tone === "pending" ? "#f59e0b" : "#ef4444"}` }}>
                    <div className="user-list-main" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <div style={{ display: "flex", alignContent: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "50%", background: activity.tone === "approved" ? "#e8fff5" : activity.tone === "pending" ? "#fff0d8" : "#ffdede", color: activity.tone === "approved" ? "#10b981" : activity.tone === "pending" ? "#f59e0b" : "#ef4444", flexShrink: 0, padding: "8px" }}>
                        {activity.tone === "approved" ? <CheckCircle2 size={16} /> : activity.tone === "pending" ? <Clock size={16} /> : <XCircle size={16} />}
                      </div>
                      <div>
                        <h3 style={{ fontSize: "0.95rem", fontWeight: "600", margin: 0, color: "#304761" }}>{activity.text}</h3>
                        <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>{activity.time}</span>
                      </div>
                    </div>
                    <span className={`user-status ${activity.tone}`} style={{ fontSize: "0.75rem", padding: "4px 10px" }}>
                      {activity.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
        {/* Transaction History Section with Advanced Filters */}
        <section className="user-erp-card user-table-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
            <div>
              <h2>Transaction History</h2>
              <p style={{ margin: "4px 0 0", color: "#536987", fontSize: "0.9rem" }}>Detailed record of all approved and pending financial postings.</p>
            </div>
            <span style={{ fontSize: "0.85rem", color: "#536987", fontWeight: "600" }}>Showing {filteredTransactions.length} of {transactions.length} records</span>
          </div>
          {/* Interactive Filters Grid */}
          <div className="user-ticket-filters" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "16px", marginBottom: "26px" }}>
            <div className="user-form-field">
              <span>Search Descriptions</span>
              <input
                type="text"
                placeholder="Search transaction description, category or ID..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="user-search-input"
                style={{ padding: "10px 14px", height: "42px" }}
              />
            </div>
            <div className="user-form-field">
              <span>Category</span>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ padding: "10px 14px", height: "42px", cursor: "pointer" }}>
                <option value="All">All Categories</option>
                <option value="Venue">Venue</option>
                <option value="Food & Refreshments">Food & Refreshments</option>
                <option value="Marketing">Marketing</option>
                <option value="Travel">Travel</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>
            <div className="user-form-field">
              <span>Status</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: "10px 14px", height: "42px", cursor: "pointer" }}>
                <option value="All">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((txn) => (
                    <tr key={txn.id}>
                      <td style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#536987" }}>{txn.id}</td>
                      <td>{txn.date}</td>
                      <td>
                        <span style={{ fontSize: "0.85rem", background: "#f1f5f9", padding: "4px 8px", borderRadius: "6px", color: "#334155", fontWeight: "600" }}>
                          {txn.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: "600", color: "#1f3450" }}>{txn.description}</td>
                      <td style={{ textAlign: "right", fontWeight: "700", color: "#243b58" }}>
                        Rs {txn.amount.toLocaleString("en-IN")}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className={`user-status ${txn.tone}`}>
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="user-empty-cell" style={{ padding: "48px 0", color: "#64748b" }}>
                      <Activity size={32} style={{ opacity: 0.3, marginBottom: "8px" }} />
                      <p style={{ margin: 0, fontWeight: "600" }}>No transactions matching current filter criteria.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
export default Transactions;
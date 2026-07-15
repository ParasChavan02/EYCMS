import { useState, useMemo, useEffect, useRef } from "react";
import {
  Landmark,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Clock,
  Search,
  ArrowRightLeft,
  XCircle,
  Info,
  IndianRupee
} from "lucide-react";
import { useNotification } from "../../common/hooks/useNotification";
import "./user-erp.css";
import Chart from "chart.js/auto";

// Reusable Chart Component matching existing ERP architecture
function ReconciliationChart({ type, data, options }) {
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

export default function BankReconciliation() {
  const { addNotification } = useNotification();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Mock data representing the 8 transactions in the screenshots
  const transactions = useMemo(() => [
    {
      id: "TXN-REC-001",
      date: "2026-06-18",
      category: "Travel",
      description: "Train ticket to meet research mentor in Delhi",
      amount: 25000,
      status: "Approved by Admin"
    },
    {
      id: "TXN-REC-002",
      date: "2026-06-17",
      category: "Food",
      description: "Working lunch with industry experts for research guidance",
      amount: 15000,
      status: "Bill Uploaded, Awaiting Admin Approval"
    },
    {
      id: "TXN-REC-003",
      date: "2026-06-15",
      category: "Marketing",
      description: "Printing survey questionnaires and feedback forms",
      amount: 40000,
      status: "Approved by Admin"
    },
    {
      id: "TXN-REC-004",
      date: "2026-06-14",
      category: "Travel",
      description: "Local cab fare for field research and data collection visits",
      amount: 20000,
      status: "Approved by Admin"
    },
    {
      id: "TXN-REC-005",
      date: "2026-06-12",
      category: "Equipment & Misc",
      description: "Purchase of laboratory test tubes and research chemical consumables",
      amount: 120000,
      status: "Approved by Admin"
    },
    {
      id: "TXN-REC-006",
      date: "2026-06-10",
      category: "Venue",
      description: "Meeting room rental for co-researchers discussion group",
      amount: 50000,
      status: "Approved by Admin"
    },
    {
      id: "TXN-REC-007",
      date: "2026-06-08",
      category: "Equipment & Misc",
      description: "Reference books bill purchase for project literature review",
      amount: 20000,
      status: "Bill Uploaded, Awaiting Admin Approval"
    },
    {
      id: "TXN-REC-008",
      date: "2026-06-05",
      category: "Marketing",
      description: "Poster design and printing for academic research presentation",
      amount: 10000,
      status: "Rejected by Admin"
    }
  ], []);

  // Filtered transactions for verification panel
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory =
        categoryFilter === "All" || t.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All" || t.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [transactions, searchQuery, categoryFilter, statusFilter]);

  // Export handlers
  const handleExportExcel = () => {
    addNotification("Exporting transaction report (Excel)...", "info", 1500, false);
    setTimeout(() => {
      addNotification("Excel report downloaded successfully.", "success", 3000, false);
    }, 1500);
  };

  const handleDownloadPDF = () => {
    addNotification("Preparing PDF summary...", "info", 1500, false);
    setTimeout(() => {
      addNotification("PDF report downloaded successfully.", "success", 3000, false);
    }, 1500);
  };

  // Chart Data Configurations
  const barData = {
    labels: ["Venue", "Food", "Marketing", "Travel", "Equipment & Misc"],
    datasets: [
      {
        label: "Budget Allocated (Rs)",
        data: [140000, 70000, 50000, 40000, 30000],
        backgroundColor: "#1d5cff",
        borderRadius: 4,
        barPercentage: 0.6
      },
      {
        label: "Actual Spendings (Rs)",
        data: [50000, 0, 40000, 45000, 120000],
        backgroundColor: "#10b981",
        borderRadius: 4,
        barPercentage: 0.6
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          font: { size: 10 }
        }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: "#f1f5f9" },
        ticks: {
          font: { size: 9 },
          callback: (val) => `Rs ${val >= 1000 ? (val / 1000) + "k" : val}`
        }
      }
    }
  };

  const donutData = {
    labels: ["Venue", "Food", "Marketing", "Travel", "Equipment & Misc"],
    datasets: [
      {
        data: [50000, 0, 40000, 45000, 120000],
        backgroundColor: ["#1d5cff", "#10b981", "#8b5cf6", "#f97316", "#06b6d4"]
      }
    ]
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          boxWidth: 8,
          padding: 8,
          font: { size: 9 }
        }
      }
    },
    cutout: "60%"
  };

  const lineData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Spend Trend",
        data: [15000, 45000, 35000, 60000, 40000, 255000],
        borderColor: "#8b5cf6",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: "#8b5cf6"
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: "#f1f5f9" },
        ticks: {
          font: { size: 9 },
          callback: (val) => `Rs ${val >= 1000 ? (val / 1000) + "k" : val}`
        }
      }
    }
  };

  return (
    <main className="user-erp-page">
      <div className="user-erp-shell" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* PAGE HEADER */}
        <header className="user-erp-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "8px" }}>
          <div>
            <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: "700" }}>
              <Landmark style={{ color: "#1d5cff" }} />
              Project Bank Reconciliation
            </h1>
            <p>Monitor research project transactions, verification statuses, and budgets cleared by E-YUVA Admin.</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button 
              className="user-secondary-button" 
              type="button" 
              onClick={handleExportExcel} 
              style={{ display: "flex", alignItems: "center", gap: "8px", minHeight: "42px", padding: "0 16px", color: "#16a34a", borderColor: "#bbf7d0", background: "#f0fdf4" }}
            >
              <FileSpreadsheet size={16} />
              Export Transaction Report (Excel)
            </button>
            <button 
              className="user-primary-button" 
              type="button" 
              onClick={handleDownloadPDF} 
              style={{ display: "flex", alignItems: "center", gap: "8px", minHeight: "42px", padding: "0 16px", background: "#1d5cff", border: "none", color: "#ffffff" }}
            >
              <FileText size={16} />
              Download Summary (PDF)
            </button>
          </div>
        </header>

        {/* TOP KPI CARDS */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
          <article className="user-erp-card user-stat-card" style={{ minHeight: "120px", padding: "20px" }}>
            <div className="user-stat-icon" style={{ color: "#1d5cff", background: "#f0f4ff" }}>
              <IndianRupee size={24} />
            </div>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "0.85rem", color: "#64748b" }}>Total Budget</p>
              <strong style={{ fontSize: "1.3rem", margin: 0, color: "#1e293b" }}>Rs 3,30,000</strong>
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Overall limit assigned</span>
            </div>
          </article>

          <article className="user-erp-card user-stat-card" style={{ minHeight: "120px", padding: "20px" }}>
            <div className="user-stat-icon" style={{ color: "#10b981", background: "#eafaf1" }}>
              <Landmark size={24} />
            </div>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "0.85rem", color: "#64748b" }}>Amount Received</p>
              <strong style={{ fontSize: "1.3rem", margin: 0, color: "#1e293b" }}>Rs 3,00,000</strong>
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Disbursed by Admin</span>
            </div>
          </article>

          <article className="user-erp-card user-stat-card" style={{ minHeight: "120px", padding: "20px" }}>
            <div className="user-stat-icon" style={{ color: "#8b5cf6", background: "#f5f3ff" }}>
              <FileText size={24} />
            </div>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "0.85rem", color: "#64748b" }}>Amount Utilized</p>
              <strong style={{ fontSize: "1.3rem", margin: 0, color: "#1e293b" }}>Rs 2,55,000</strong>
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Total verified expenses</span>
            </div>
          </article>

          <article className="user-erp-card user-stat-card" style={{ minHeight: "120px", padding: "20px" }}>
            <div className="user-stat-icon" style={{ color: "#06b6d4", background: "#ecfeff" }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "0.85rem", color: "#64748b" }}>Remaining Balance</p>
              <strong style={{ fontSize: "1.3rem", margin: 0, color: "#1e293b" }}>Rs 45,000</strong>
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Funds unspent</span>
            </div>
          </article>

          <article className="user-erp-card user-stat-card" style={{ minHeight: "120px", padding: "20px" }}>
            <div className="user-stat-icon" style={{ color: "#f97316", background: "#fff7ed" }}>
              <Clock size={24} />
            </div>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "0.85rem", color: "#64748b" }}>Pending Verification</p>
              <strong style={{ fontSize: "1.3rem", margin: 0, color: "#1e293b" }}>Rs 35,000</strong>
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Awaiting review</span>
            </div>
          </article>
        </section>

        {/* ACCOUNT INFO & RECONCILIATION TRACKER */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          
          {/* Project Account Information */}
          <article className="user-erp-card" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1e293b", marginBottom: "16px" }}>Project Account Information</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <span style={{ fontSize: "0.7rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Project ID</span>
                <strong style={{ display: "block", fontSize: "0.95rem", color: "#1e293b", marginTop: "4px" }}>PRJ-2026-089</strong>
              </div>
              <div>
                <span style={{ fontSize: "0.7rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Bank Name</span>
                <strong style={{ display: "block", fontSize: "0.95rem", color: "#1e293b", marginTop: "4px" }}>State Bank of India</strong>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Project Name</span>
                <strong style={{ display: "block", fontSize: "0.95rem", color: "#1e293b", marginTop: "4px" }}>EcoDrive Clean Energy Campaign</strong>
              </div>
              <div>
                <span style={{ fontSize: "0.7rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Assigned Account</span>
                <strong style={{ display: "block", fontSize: "0.95rem", color: "#1e293b", marginTop: "4px" }}>xxxx-xxxx-4993</strong>
              </div>
              <div>
                <span style={{ fontSize: "0.7rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>IFSC Code</span>
                <strong style={{ display: "block", fontSize: "0.95rem", color: "#1e293b", marginTop: "4px" }}>SBIN0000301</strong>
              </div>
            </div>
          </article>

          {/* Reconciliation Progress Tracker */}
          <article className="user-erp-card" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>Reconciliation Progress Tracker</h2>
            <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "18px" }}>
              Status tracking of active research bill uploads and administrative audit clearance.
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#dcfce7", color: "#15803d", borderRadius: "50%", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "0.88rem", color: "#1e293b" }}>Bank Statement Uploaded</strong>
                  <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Completed on May 30, 2026</span>
                </div>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#dcfce7", color: "#15803d", borderRadius: "50%", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "0.88rem", color: "#1e293b" }}>Transactions Reconciled (5 of 8)</strong>
                  <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Rs 2,55,000 matched and locked to book ledgers</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#fffbeb", color: "#d97706", borderRadius: "50%", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Clock size={16} />
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "0.88rem", color: "#1e293b" }}>Admin Audit Clearance</strong>
                  <span style={{ fontSize: "0.72rem", color: "#64748b" }}>2 bills awaiting Admin clearance (Rs 35,000)</span>
                </div>
              </div>
            </div>
          </article>
        </section>

        {/* STATUS SUMMARY ROW */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px", borderLeft: "5px solid #10b981", boxShadow: "0 4px 10px rgba(0,0,0,0.02)" }}>
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Approved</div>
              <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#1e293b", marginTop: "2px" }}>5</div>
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px", borderLeft: "5px solid #f59e0b", boxShadow: "0 4px 10px rgba(0,0,0,0.02)" }}>
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Awaiting Approval</div>
              <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#1e293b", marginTop: "2px" }}>2</div>
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px", borderLeft: "5px solid #ef4444", boxShadow: "0 4px 10px rgba(0,0,0,0.02)" }}>
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Rejected</div>
              <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#1e293b", marginTop: "2px" }}>1</div>
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px", borderLeft: "5px solid #3b82f6", boxShadow: "0 4px 10px rgba(0,0,0,0.02)" }}>
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Transactions</div>
              <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#1e293b", marginTop: "2px" }}>8</div>
            </div>
          </div>
        </section>

        {/* ANALYTICS CHARTS CARD */}
        <section className="user-erp-card" style={{ padding: "28px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#1e293b" }}>Budget Utilization Analytics</h2>
          <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "4px" }}>
            Visual financial tracking charts for project expenditures and allocation analysis.
          </p>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginTop: "20px" }}>
            {/* Chart 1: Bar */}
            <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: "700", color: "#475569", marginBottom: "14px", alignSelf: "center" }}>Budget Allocation vs Actual Spendings</h4>
              <div style={{ width: "100%", height: "220px", position: "relative" }}>
                <ReconciliationChart type="bar" data={barData} options={barOptions} />
              </div>
            </div>
            
            {/* Chart 2: Donut */}
            <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: "700", color: "#475569", marginBottom: "14px", alignSelf: "center" }}>Category-wise Expense Breakdown</h4>
              <div style={{ width: "100%", height: "220px", position: "relative" }}>
                <ReconciliationChart type="doughnut" data={donutData} options={donutOptions} />
              </div>
            </div>

            {/* Chart 3: Line */}
            <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: "700", color: "#475569", marginBottom: "14px", alignSelf: "center" }}>Monthly Expense Trend Chart</h4>
              <div style={{ width: "100%", height: "220px", position: "relative" }}>
                <ReconciliationChart type="line" data={lineData} options={lineOptions} />
              </div>
            </div>
          </div>
        </section>

        {/* TRANSACTION VERIFICATION PANEL */}
        <section className="user-erp-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#1e293b" }}>Transaction Verification Panel</h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "4px" }}>
                Verify incoming statements, uploaded bill logs, and administrative clearance records.
              </p>
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#475569" }}>
              Showing {filteredTransactions.length} of {transactions.length} entries
            </div>
          </div>

          {/* Filters Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <div className="user-form-field">
              <span style={{ fontSize: "0.78rem", color: "#475569", marginBottom: "6px" }}>Search Descriptions / IDs</span>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder="Search transaction description, category or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: "40px", fontSize: "0.9rem", height: "40px" }}
                />
                <Search size={16} style={{ position: "absolute", left: "14px", top: "12px", color: "#94a3b8" }} />
              </div>
            </div>

            <div className="user-form-field">
              <span style={{ fontSize: "0.78rem", color: "#475569", marginBottom: "6px" }}>Category</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ fontSize: "0.9rem", height: "40px", cursor: "pointer", padding: "0 12px" }}
              >
                <option value="All">All Categories</option>
                <option value="Venue">Venue</option>
                <option value="Food">Food</option>
                <option value="Marketing">Marketing</option>
                <option value="Travel">Travel</option>
                <option value="Equipment & Misc">Equipment & Misc</option>
              </select>
            </div>

            <div className="user-form-field">
              <span style={{ fontSize: "0.78rem", color: "#475569", marginBottom: "6px" }}>Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ fontSize: "0.9rem", height: "40px", cursor: "pointer", padding: "0 12px" }}
              >
                <option value="All">All Statuses</option>
                <option value="Approved by Admin">Approved by Admin</option>
                <option value="Bill Uploaded, Awaiting Admin Approval">Bill Uploaded, Awaiting Admin Approval</option>
                <option value="Rejected by Admin">Rejected by Admin</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="user-table-card">
            <table className="user-table">
              <thead>
                <tr>
                  <th style={{ background: "#f8fafc", color: "#475569", fontWeight: "700" }}>Transaction ID</th>
                  <th style={{ background: "#f8fafc", color: "#475569", fontWeight: "700" }}>Date</th>
                  <th style={{ background: "#f8fafc", color: "#475569", fontWeight: "700" }}>Category</th>
                  <th style={{ background: "#f8fafc", color: "#475569", fontWeight: "700" }}>Description</th>
                  <th style={{ background: "#f8fafc", color: "#475569", fontWeight: "700" }}>Amount</th>
                  <th style={{ background: "#f8fafc", color: "#475569", fontWeight: "700" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((row) => (
                    <tr key={row.id}>
                      <td style={{ fontFamily: "monospace", fontWeight: "600", fontSize: "0.85rem" }}>{row.id}</td>
                      <td style={{ fontSize: "0.88rem" }}>{row.date}</td>
                      <td>
                        <span style={{ background: "#f1f5f9", color: "#475569", padding: "4px 8px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "600" }}>
                          {row.category}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.88rem", fontWeight: "600", color: "#334155" }}>{row.description}</td>
                      <td style={{ fontWeight: "700", color: "#1e293b", fontSize: "0.88rem" }}>
                        Rs {row.amount.toLocaleString("en-IN")}
                      </td>
                      <td>
                        <span 
                          className={`user-status ${
                            row.status.includes("Approved") 
                              ? "approved" 
                              : row.status.includes("Awaiting") 
                                ? "pending" 
                                : "rejected"
                          }`}
                          style={{ fontSize: "0.78rem", fontWeight: "700", padding: "4px 10px" }}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="user-empty-cell" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                      <AlertTriangle size={28} style={{ opacity: 0.3, marginBottom: "8px", display: "block", margin: "0 auto" }} />
                      <span>No transactions matching filters</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* BOTTOM SECTION: HEALTH CARD / ALERTS & TIMELINE */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          
          {/* Health & Alerts */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Project Financial Health Card */}
            <article className="user-erp-card" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1e293b", marginBottom: "16px" }}>Project Financial Health Card</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                
                {/* Circular Gauge */}
                <div style={{ position: "relative", width: "80px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="80" height="80" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#f1f5f9"
                      strokeWidth="3.5"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="url(#healthGradient)"
                      strokeWidth="3.5"
                      strokeDasharray="77, 100"
                    />
                    <defs>
                      <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div style={{ position: "absolute", fontSize: "1.15rem", fontWeight: "800", color: "#1e293b" }}>
                    77%
                  </div>
                </div>

                {/* Health details */}
                <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Risk Profile:</span>
                    <span style={{ background: "#fff0d8", color: "#b45309", fontSize: "0.75rem", fontWeight: "700", padding: "2px 8px", borderRadius: "12px" }}>
                      Medium Risk
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Financial Status:</span>
                    <strong style={{ fontSize: "0.85rem", color: "#334155" }}>On Track (Review Advised)</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Last Audit Clearance:</span>
                    <strong style={{ fontSize: "0.85rem", color: "#334155" }}>Jun 18, 2026</strong>
                  </div>
                </div>

              </div>

              {/* Progress bar info */}
              <div style={{ marginTop: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#64748b", marginBottom: "6px" }}>
                  <span>Total Budget Utilization</span>
                  <strong>Rs 2,55,000 / Rs 3,30,000</strong>
                </div>
                <div style={{ height: "6px", width: "100%", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "77.2%", background: "linear-gradient(90deg, #7c3aed, #10b981)", borderRadius: "inherit" }}></div>
                </div>
              </div>
            </article>

            {/* Alerts & Notifications */}
            <article className="user-erp-card" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1e293b", marginBottom: "16px" }}>Alerts & Notifications</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                
                {/* Alert 1 */}
                <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "10px", padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <AlertTriangle size={18} style={{ color: "#ea580c", flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong style={{ display: "block", fontSize: "0.85rem", color: "#c2410c" }}>Budget Alert: Approaching Limit</strong>
                    <span style={{ fontSize: "0.78rem", color: "#ea580c", display: "block", marginTop: "2px" }}>
                      Budget utilization stands at 77%. Monitor pending settlements.
                    </span>
                  </div>
                </div>

                {/* Alert 2 */}
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <Info size={18} style={{ color: "#2563eb", flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong style={{ display: "block", fontSize: "0.85rem", color: "#1d4ed8" }}>Reconciliation Verification Needed</strong>
                    <span style={{ fontSize: "0.78rem", color: "#2563eb", display: "block", marginTop: "2px" }}>
                      You have 2 bills uploaded that are currently awaiting E-YUVA Admin clearance.
                    </span>
                  </div>
                </div>

                {/* Alert 3 */}
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <CheckCircle2 size={18} style={{ color: "#16a34a", flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong style={{ display: "block", fontSize: "0.85rem", color: "#15803d" }}>Admin Clearance Received</strong>
                    <span style={{ fontSize: "0.78rem", color: "#16a34a", display: "block", marginTop: "2px" }}>
                      Recent finance approval received for May 2026 expense filings.
                    </span>
                  </div>
                </div>

              </div>
            </article>

          </div>

          {/* Timeline Audit Log */}
          <article className="user-erp-card" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>Financial Activity Timeline</h2>
            <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "20px" }}>
              Audit log detailing reconciliation checkpoints, approvals, updates, and reviews.
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", position: "relative", paddingLeft: "24px" }}>
              {/* Timeline Connector Line */}
              <div style={{ position: "absolute", left: "9px", top: "12px", bottom: "12px", width: "2px", background: "#e2e8f0" }} />

              {/* Step 1 */}
              <div style={{ position: "relative", marginBottom: "22px" }}>
                <div style={{ position: "absolute", left: "-24px", top: "2px", background: "#ffffff", borderRadius: "50%", padding: "2px" }}>
                  <div style={{ background: "#dcfce7", color: "#15803d", borderRadius: "50%", width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "9px", fontWeight: "bold" }}>✓</span>
                  </div>
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "0.88rem", color: "#334155" }}>
                    Laboratory consumables purchase approved by Admin
                  </strong>
                  <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Today, 10:15 AM</span>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ position: "relative", marginBottom: "22px" }}>
                <div style={{ position: "absolute", left: "-24px", top: "2px", background: "#ffffff", borderRadius: "50%", padding: "2px" }}>
                  <div style={{ background: "#fffbeb", color: "#d97706", borderRadius: "50%", width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "9px", fontWeight: "bold" }}>◔</span>
                  </div>
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "0.88rem", color: "#334155" }}>
                    Working lunch bill submitted by Fellow (Awaiting Admin approval)
                  </strong>
                  <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Yesterday, 04:30 PM</span>
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ position: "relative", marginBottom: "22px" }}>
                <div style={{ position: "absolute", left: "-24px", top: "2px", background: "#ffffff", borderRadius: "50%", padding: "2px" }}>
                  <div style={{ background: "#fffbeb", color: "#d97706", borderRadius: "50%", width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "9px", fontWeight: "bold" }}>◔</span>
                  </div>
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "0.88rem", color: "#334155" }}>
                    Reference books bill submitted by Fellow (Awaiting Admin approval)
                  </strong>
                  <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Yesterday, 11:20 AM</span>
                </div>
              </div>

              {/* Step 4 */}
              <div style={{ position: "relative", marginBottom: "22px" }}>
                <div style={{ position: "absolute", left: "-24px", top: "2px", background: "#ffffff", borderRadius: "50%", padding: "2px" }}>
                  <div style={{ background: "#dcfce7", color: "#15803d", borderRadius: "50%", width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "9px", fontWeight: "bold" }}>✓</span>
                  </div>
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "0.88rem", color: "#334155" }}>
                    Meeting room rental bill approved by Admin
                  </strong>
                  <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Jun 18, 2026</span>
                </div>
              </div>

              {/* Step 5 */}
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "-24px", top: "2px", background: "#ffffff", borderRadius: "50%", padding: "2px" }}>
                  <div style={{ background: "#fee2e2", color: "#ef4444", borderRadius: "50%", width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "9px", fontWeight: "bold" }}>✕</span>
                  </div>
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "0.88rem", color: "#334155" }}>
                    Academic poster print bill rejected by Admin
                  </strong>
                  <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Jun 15, 2026</span>
                </div>
              </div>

            </div>
          </article>

        </section>

      </div>
    </main>
  );
}

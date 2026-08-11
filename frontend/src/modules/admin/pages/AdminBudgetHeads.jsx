import { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import Chart from "chart.js/auto";
import { budgetHeadsService } from "../../../services/budgetHeadsService";
import "../../../styles/admin-management.css";

const STATUS_FILTERS = [
  { value: "ALL", label: "All Utilization" },
  { value: "NOT_UTILIZED", label: "Not Utilized" },
  { value: "LOW", label: "Low (<50%)" },
  { value: "MEDIUM", label: "Medium (50-80%)" },
  { value: "HIGH", label: "High (>80%)" },
  { value: "EXCEEDED", label: "Exceeded" },
];

function formatCurrency(value) {
  const n = Number(value || 0);
  return `Rs ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatPercent(value) {
  const n = Number(value || 0);
  if (!isFinite(n)) return "0%";
  return `${n.toFixed(1)}%`;
}

function getUtilizationStatus(allocated, utilized) {
  if (utilized <= 0) return "NOT_UTILIZED";
  if (allocated <= 0) return "EXCEEDED";
  const pct = (utilized / allocated) * 100;
  if (pct > 100) return "EXCEEDED";
  if (pct > 80) return "HIGH";
  if (pct >= 50) return "MEDIUM";
  return "LOW";
}

function currentFinancialYear() {
  const now = new Date();
  const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${y}-${String(y + 1).slice(-2)}`;
}

function AdminBudgetHeads() {
  const [overview, setOverview] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState(null);

  // Active navigation tab: CENTRE | FELLOWS
  const [activeTab, setActiveTab] = useState("CENTRE");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Modal for category-wise allocation (Centre categories)
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocateForm, setAllocateForm] = useState({
    budget_head: "Manpower",
    allocated_amount: "",
    financial_year: currentFinancialYear(),
    remarks: ""
  });
  const [allocateSaving, setAllocateSaving] = useState(false);
  const [allocateError, setAllocateError] = useState("");

  // Modal for adding custom Centre categories
  const [showCustomCatModal, setShowCustomCatModal] = useState(false);
  const [customCatForm, setCustomCatForm] = useState({
    name: "",
    allocated_amount: "",
    financial_year: currentFinancialYear(),
    remarks: ""
  });
  const [customCatSaving, setCustomCatSaving] = useState(false);
  const [customCatError, setCustomCatError] = useState("");

  // Modal for allocating/transferring budget to Fellows (Projects)
  const [showFellowModal, setShowFellowModal] = useState(false);
  const [fellowForm, setFellowForm] = useState({
    project_uuid: "",
    allocated_amount: "",
    financial_year: currentFinancialYear(),
    remarks: ""
  });
  const [fellowSaving, setFellowSaving] = useState(false);
  const [fellowError, setFellowError] = useState("");

  // Selected project in Fellows tab
  const [selectedProjectUuid, setSelectedProjectUuid] = useState("");

  // Modal for E-YUVA Fellow project category allocation
  const [showFellowCatModal, setShowFellowCatModal] = useState(false);
  const [fellowCatForm, setFellowCatForm] = useState({
    budget_head: "",
    allocated_amount: "",
    financial_year: currentFinancialYear(),
    remarks: ""
  });
  const [fellowCatSaving, setFellowCatSaving] = useState(false);
  const [fellowCatError, setFellowCatError] = useState("");

  // Chart Canvas Refs
  const barChartRef = useRef(null);
  const doughnutChartRef = useRef(null);
  const lineChartRef = useRef(null);

  const fellowBarChartRef = useRef(null);
  const fellowDoughnutChartRef = useRef(null);
  const fellowLineChartRef = useRef(null);

  // Chart Instances
  const barChartInst = useRef(null);
  const doughnutChartInst = useRef(null);
  const lineChartInst = useRef(null);

  const fellowBarChartInst = useRef(null);
  const fellowDoughnutChartInst = useRef(null);
  const fellowLineChartInst = useRef(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Chart rendering effect
  useEffect(() => {
    if (activeTab === "CENTRE") {
      const timer = setTimeout(() => {
        renderAnalyticsCharts();
      }, 100);

      return () => {
        clearTimeout(timer);
        destroyCharts();
      };
    } else if (activeTab === "FELLOWS") {
      const timer = setTimeout(() => {
        renderFellowProjectCharts();
      }, 100);

      return () => {
        clearTimeout(timer);
        destroyFellowCharts();
      };
    }
  }, [activeTab, overview, selectedProjectUuid]);

  async function fetchInitialData() {
    try {
      setLoading(true);
      setLoadError("");
      const ovData = await budgetHeadsService.getOverview();
      setOverview(ovData);
      if (ovData?.fellows_budget?.projects?.length > 0) {
        setSelectedProjectUuid(prev => prev || ovData.fellows_budget.projects[0].project_uuid);
      }

      // Fetch projects list for dropdowns
      const token = localStorage.getItem("token");
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
      const projRes = await axios.get(`${API_BASE_URL}/admin/projects/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(projRes.data?.data || []);
    } catch (e) {
      console.error("Failed to load budget dashboard data:", e);
      setLoadError("Failed to fetch budget metrics from the server.");
    } finally {
      setLoading(false);
    }
  }

  const renderAnalyticsCharts = () => {
    destroyCharts();

    const analytics = overview?.analytics;
    if (!analytics) return;

    // 1. Budget vs Actual Bar Chart
    if (barChartRef.current) {
      const ctxBar = barChartRef.current.getContext("2d");
      barChartInst.current = new Chart(ctxBar, {
        type: "bar",
        data: {
          labels: analytics.budget_vs_actual.categories,
          datasets: [
            {
              label: "Allocated",
              data: analytics.budget_vs_actual.allocated,
              backgroundColor: "#3b82f6",
              borderRadius: 4,
            },
            {
              label: "Utilized",
              data: analytics.budget_vs_actual.utilized,
              backgroundColor: "#ef4444",
              borderRadius: 4,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "top", labels: { boxWidth: 12, font: { weight: "600" } } }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { callback: (val) => `Rs ${Number(val).toLocaleString()}` }
            }
          }
        }
      });
    }

    // 2. Category Expense Breakdown Doughnut Chart
    if (doughnutChartRef.current) {
      const ctxDoughnut = doughnutChartRef.current.getContext("2d");
      
      const hasSpending = analytics.category_breakdown.spent && analytics.category_breakdown.spent.length > 0;
      const labels = hasSpending ? analytics.category_breakdown.categories : ["No Spending Recorded"];
      const data = hasSpending ? analytics.category_breakdown.spent : [1];
      const colors = hasSpending 
        ? ["#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#06b6d4", "#ec4899", "#f43f5e"] 
        : ["#e2e8f0"];

      doughnutChartInst.current = new Chart(ctxDoughnut, {
        type: "doughnut",
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "right", labels: { boxWidth: 10, font: { size: 11 } } }
          }
        }
      });
    }

    // 3. Monthly Trend Line Chart
    if (lineChartRef.current) {
      const ctxLine = lineChartRef.current.getContext("2d");
      
      const hasTrend = analytics.monthly_trend.months && analytics.monthly_trend.months.length > 0;
      const labels = hasTrend ? analytics.monthly_trend.months : ["No Data"];
      const data = hasTrend ? analytics.monthly_trend.spent : [0];

      lineChartInst.current = new Chart(ctxLine, {
        type: "line",
        data: {
          labels: labels,
          datasets: [{
            label: "Monthly Outflow",
            data: data,
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            fill: true,
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: "#10b981"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { callback: (val) => `Rs ${Number(val).toLocaleString()}` }
            }
          }
        }
      });
    }
  };

  const destroyCharts = () => {
    if (barChartInst.current) {
      barChartInst.current.destroy();
      barChartInst.current = null;
    }
    if (doughnutChartInst.current) {
      doughnutChartInst.current.destroy();
      doughnutChartInst.current = null;
    }
    if (lineChartInst.current) {
      lineChartInst.current.destroy();
      lineChartInst.current = null;
    }
  };

  const renderFellowProjectCharts = () => {
    destroyFellowCharts();

    const activeProj = overview?.fellows_budget?.projects?.find(p => p.project_uuid === selectedProjectUuid);
    if (!activeProj || !activeProj.analytics) return;

    const analytics = activeProj.analytics;

    // 1. Budget vs Actual Bar Chart
    if (fellowBarChartRef.current) {
      const ctxBar = fellowBarChartRef.current.getContext("2d");
      fellowBarChartInst.current = new Chart(ctxBar, {
        type: "bar",
        data: {
          labels: analytics.budget_vs_actual.categories,
          datasets: [
            {
              label: "Allocated",
              data: analytics.budget_vs_actual.allocated,
              backgroundColor: "#3b82f6",
              borderRadius: 4,
            },
            {
              label: "Utilized",
              data: analytics.budget_vs_actual.utilized,
              backgroundColor: "#ef4444",
              borderRadius: 4,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "top", labels: { boxWidth: 12, font: { weight: "600" } } }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { callback: (val) => `Rs ${Number(val).toLocaleString()}` }
            }
          }
        }
      });
    }

    // 2. Category Doughnut Chart
    if (fellowDoughnutChartRef.current) {
      const ctxDoughnut = fellowDoughnutChartRef.current.getContext("2d");
      const hasSpending = analytics.category_breakdown.spent && analytics.category_breakdown.spent.length > 0;
      const labels = hasSpending ? analytics.category_breakdown.categories : ["No Spending Recorded"];
      const data = hasSpending ? analytics.category_breakdown.spent : [1];
      const colors = hasSpending 
        ? ["#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#06b6d4", "#ec4899", "#f43f5e"] 
        : ["#e2e8f0"];

      fellowDoughnutChartInst.current = new Chart(ctxDoughnut, {
        type: "doughnut",
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "right", labels: { boxWidth: 10, font: { size: 11 } } }
          }
        }
      });
    }

    // 3. Monthly Trend Line Chart
    if (fellowLineChartRef.current) {
      const ctxLine = fellowLineChartRef.current.getContext("2d");
      const hasTrend = analytics.monthly_trend.months && analytics.monthly_trend.months.length > 0;
      const labels = hasTrend ? analytics.monthly_trend.months : ["No Data"];
      const data = hasTrend ? analytics.monthly_trend.spent : [0];

      fellowLineChartInst.current = new Chart(ctxLine, {
        type: "line",
        data: {
          labels: labels,
          datasets: [{
            label: "Monthly Outflow",
            data: data,
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            fill: true,
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: "#10b981"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { callback: (val) => `Rs ${Number(val).toLocaleString()}` }
            }
          }
        }
      });
    }
  };

  const destroyFellowCharts = () => {
    if (fellowBarChartInst.current) {
      fellowBarChartInst.current.destroy();
      fellowBarChartInst.current = null;
    }
    if (fellowDoughnutChartInst.current) {
      fellowDoughnutChartInst.current.destroy();
      fellowDoughnutChartInst.current = null;
    }
    if (fellowLineChartInst.current) {
      fellowLineChartInst.current.destroy();
      fellowLineChartInst.current = null;
    }
  };

  const toggleRow = (rowKey) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowKey)) next.delete(rowKey);
      else next.add(rowKey);
      return next;
    });
  };

  const handleOpenAllocateModal = (initialCategory = "Manpower") => {
    setAllocateError("");
    setAllocateForm({
      budget_head: initialCategory,
      allocated_amount: "",
      financial_year: currentFinancialYear(),
      remarks: ""
    });
    setShowAllocateModal(true);
  };

  const handleCloseAllocateModal = () => {
    setShowAllocateModal(false);
  };

  const handleOpenCustomCatModal = () => {
    setCustomCatError("");
    setCustomCatForm({
      name: "",
      allocated_amount: "",
      financial_year: currentFinancialYear(),
      remarks: ""
    });
    setShowCustomCatModal(true);
  };

  const handleCloseCustomCatModal = () => {
    setShowCustomCatModal(false);
  };

  const handleOpenFellowModal = () => {
    setFellowError("");
    setFellowForm({
      project_uuid: projects[0]?.project_uuid || "",
      allocated_amount: "",
      financial_year: currentFinancialYear(),
      remarks: ""
    });
    setShowFellowModal(true);
  };

  const handleCloseFellowModal = () => {
    setShowFellowModal(false);
  };

  const submitAllocation = async (e) => {
    e.preventDefault();
    const amount = Number(allocateForm.allocated_amount);
    if (allocateForm.allocated_amount === "" || isNaN(amount) || amount < 0) {
      setAllocateError("Enter a valid allocation amount.");
      return;
    }

    try {
      setAllocateSaving(true);
      setAllocateError("");

      const payload = {
        section: "CENTRE",
        budget_head: allocateForm.budget_head,
        allocated_amount: amount,
        financial_year: allocateForm.financial_year.trim(),
        remarks: allocateForm.remarks.trim() || null
      };

      await budgetHeadsService.allocateEycBudget(payload);
      setToast({ type: "success", message: `Budget allocated for "${allocateForm.budget_head}" successfully!` });
      setShowAllocateModal(false);
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setAllocateError(err.response?.data?.error || err.response?.data?.detail || err.message || "Failed to save allocation.");
    } finally {
      setAllocateSaving(false);
    }
  };

  const submitCustomCategory = async (e) => {
    e.preventDefault();
    const amount = Number(customCatForm.allocated_amount);
    const catName = customCatForm.name.trim();

    if (!catName) {
      setCustomCatError("Category name is required.");
      return;
    }
    if (customCatForm.allocated_amount === "" || isNaN(amount) || amount < 0) {
      setCustomCatError("Enter a valid allocated amount.");
      return;
    }

    try {
      setCustomCatSaving(true);
      setCustomCatError("");

      const payload = {
        section: "CENTRE",
        budget_head: catName,
        allocated_amount: amount,
        financial_year: customCatForm.financial_year.trim(),
        remarks: customCatForm.remarks.trim() || "Custom Operational Category"
      };

      await budgetHeadsService.addCustomCategory(payload);
      setToast({ type: "success", message: `Custom category "${catName}" added successfully!` });
      setShowCustomCatModal(false);
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setCustomCatError(err.response?.data?.error || err.response?.data?.detail || err.message || "Failed to add custom category.");
    } finally {
      setCustomCatSaving(false);
    }
  };

  const submitFellowAllocation = async (e) => {
    e.preventDefault();
    const amount = Number(fellowForm.allocated_amount);
    if (!fellowForm.project_uuid) {
      setFellowError("Please select a project/fellow.");
      return;
    }
    if (fellowForm.allocated_amount === "" || isNaN(amount) || amount <= 0) {
      setFellowError("Enter a valid allocation amount greater than zero.");
      return;
    }

    try {
      setFellowSaving(true);
      setFellowError("");

      const payload = {
        section: "FELLOWS",
        budget_head: "Fellow Allocation", // Fallback, will resolve to title on backend
        project_uuid: fellowForm.project_uuid,
        allocated_amount: amount,
        financial_year: fellowForm.financial_year.trim(),
        remarks: fellowForm.remarks.trim() || "Project Funding Transfer"
      };

      await budgetHeadsService.allocateFellowBudget(payload);
      setToast({ type: "success", message: "Budget transferred to E-YUVA Fellow successfully!" });
      setShowFellowModal(false);
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setFellowError(err.response?.data?.error || err.response?.data?.detail || err.message || "Failed to transfer fellowship funds.");
    } finally {
      setFellowSaving(false);
    }
  };

  const submitFellowCatAllocation = async (e) => {
    e.preventDefault();
    const amount = Number(fellowCatForm.allocated_amount);
    const catName = fellowCatForm.budget_head.trim();
    if (!catName) {
      setFellowCatError("Category name is required.");
      return;
    }
    if (fellowCatForm.allocated_amount === "" || isNaN(amount) || amount < 0) {
      setFellowCatError("Enter a valid allocation amount.");
      return;
    }

    try {
      setFellowCatSaving(true);
      setFellowCatError("");

      const payload = {
        section: "FELLOWS_CAT",
        budget_head: catName,
        allocated_amount: amount,
        financial_year: fellowCatForm.financial_year.trim(),
        remarks: fellowCatForm.remarks.trim() || null,
        project_uuid: selectedProjectUuid
      };

      await budgetHeadsService.allocateEycBudget(payload);
      setToast({ type: "success", message: `Budget allocated for category "${catName}" successfully!` });
      setShowFellowCatModal(false);
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setFellowCatError(err.response?.data?.error || err.response?.data?.detail || err.message || "Failed to save category allocation.");
    } finally {
      setFellowCatSaving(false);
    }
  };

  // Filter computations for Centre Budget Heads
  const filteredCentreHeads = useMemo(() => {
    const heads = overview?.centre_budget?.heads || [];
    return heads.filter(h => {
      const q = search.trim().toLowerCase();
      const textMatch = !q || h.name.toLowerCase().includes(q);
      const status = getUtilizationStatus(h.allocated, h.utilized);
      const statusMatch = statusFilter === "ALL" || status === statusFilter;
      return textMatch && statusMatch;
    });
  }, [overview, search, statusFilter]);

  // Filter computations for Centre Transactions
  const filteredCentreTransactions = useMemo(() => {
    const txs = overview?.centre_budget?.transactions || [];
    return txs.filter(t => {
      const q = search.trim().toLowerCase();
      return !q || t.description.toLowerCase().includes(q) || t.uploaded_by.toLowerCase().includes(q) || t.status.toLowerCase().includes(q);
    });
  }, [overview, search]);

  // Filter computations for Fellows Projects rollup
  const filteredFellowsRollup = useMemo(() => {
    const projs = overview?.fellows_budget?.projects || [];
    return projs.filter(p => {
      const q = search.trim().toLowerCase();
      return !q || p.project_id.toLowerCase().includes(q) || p.project_name.toLowerCase().includes(q);
    });
  }, [overview, search]);

  return (
    <main className="admin-page">
      <section className="admin-header">
        <div>
          <h1>Budget Heads Management</h1>
          <p>Supervise E-YUVA centre budget pots, custom categories, operational transactions, and fellows allocations.</p>
        </div>
      </section>

      {toast && (
        <div className={`form-message ${toast.type === "error" ? "error" : "success"}`} style={{ marginBottom: "16px" }}>
          {toast.message}
        </div>
      )}

      {/* Tab Navigation Structure */}
      <div className="tab-nav" style={{ marginBottom: "24px", display: "flex", gap: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
        <button
          type="button"
          className={`tab-chip ${activeTab === "CENTRE" ? "active" : ""}`}
          onClick={() => { setActiveTab("CENTRE"); setSearch(""); setStatusFilter("ALL"); }}
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            background: activeTab === "CENTRE" ? "#3b82f6" : "#f1f5f9",
            color: activeTab === "CENTRE" ? "white" : "#475569"
          }}
        >
          E-YUVA Centre Budget
        </button>
        <button
          type="button"
          className={`tab-chip ${activeTab === "FELLOWS" ? "active" : ""}`}
          onClick={() => { setActiveTab("FELLOWS"); setSearch(""); setStatusFilter("ALL"); }}
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            background: activeTab === "FELLOWS" ? "#3b82f6" : "#f1f5f9",
            color: activeTab === "FELLOWS" ? "white" : "#475569"
          }}
        >
          E-YUVA Fellows Budget
        </button>
      </div>

      {loading && <div className="empty-state">Loading budget tracking...</div>}

      {!loading && loadError && (
        <div className="empty-state">
          <p>{loadError}</p>
          <button className="btn-sm" onClick={fetchInitialData}>Retry</button>
        </div>
      )}

      {!loading && !loadError && (
        <>
          {/* TAB 1: E-YUVA CENTRE BUDGET */}
          {activeTab === "CENTRE" && (
            <div>
              {/* Statistics Grid */}
              <section className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "24px" }}>
                <div className="stat-card" style={{ borderLeft: "4px solid #3b82f6" }}>
                  <div className="stat-label">Total Centre Budget (Received)</div>
                  <div className="stat-value">{formatCurrency(overview?.centre_budget?.total)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Allocated to Categories</div>
                  <div className="stat-value">{formatCurrency(overview?.centre_budget?.allocated)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Remaining to Distribute</div>
                  <div className="stat-value">{formatCurrency(overview?.centre_budget?.unallocated)}</div>
                </div>
                <div className="stat-card" style={{ borderLeft: "4px solid #f59e0b" }}>
                  <div className="stat-label">Total Utilized</div>
                  <div className="stat-value">{formatCurrency(overview?.centre_budget?.utilized)}</div>
                </div>
                <div className="stat-card" style={{ borderLeft: "4px solid #10b981" }}>
                  <div className="stat-label">Remaining Cash Balance</div>
                  <div className="stat-value">{formatCurrency(overview?.centre_budget?.remaining)}</div>
                </div>
              </section>

              {/* Toolbar filters */}
              <section className="admin-card" style={{ padding: "16px", marginBottom: "24px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Search centre categories..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-input"
                    style={{ flex: "1 1 300px" }}
                  />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select" style={{ flex: "0 1 180px" }}>
                    {STATUS_FILTERS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("ALL");
                    }}
                    style={{ height: "40px" }}
                  >
                    Reset
                  </button>
                </div>
              </section>

              {/* Centre Categories Allocation */}
              <section className="admin-card" style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "16px", color: "#0f172a" }}>Centre Category Allocations</h2>
                    <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "13px" }}>Manage allocated pots for staff and operational heads.</p>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn-secondary" onClick={handleOpenCustomCatModal}>
                      + Custom Category
                    </button>
                    <button className="btn-primary" onClick={() => handleOpenAllocateModal("Manpower")}>
                      Distribute Budget
                    </button>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: "250px" }}>Budget Head</th>
                        <th>Allocated Amount</th>
                        <th>Utilized Amount</th>
                        <th>Remaining Balance</th>
                        <th>Utilization %</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCentreHeads.length > 0 ? (
                        filteredCentreHeads.map(head => {
                          const expanded = expandedRows.has(head.name);
                          const pct = head.allocated > 0 ? (head.utilized / head.allocated) * 100 : 0;
                          return (
                            <>
                              <tr key={head.name}>
                                <td style={{ fontWeight: "600" }}>{head.name}</td>
                                <td>{formatCurrency(head.allocated)}</td>
                                <td>{formatCurrency(head.utilized)}</td>
                                <td style={{ fontWeight: "600", color: head.remaining < 0 ? "#ef4444" : "#1e293b" }}>
                                  {formatCurrency(head.remaining)}
                                </td>
                                <td>
                                  <span className={`status-badge ${getUtilizationStatus(head.allocated, head.utilized).toLowerCase()}`}>
                                    {formatPercent(pct)}
                                  </span>
                                </td>
                                <td style={{ textAlign: "right" }}>
                                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                                    <button className="btn-sm" onClick={() => handleOpenAllocateModal(head.name)}>
                                      Edit
                                    </button>
                                    <button className="btn-sm" onClick={() => toggleRow(head.name)}>
                                      {expanded ? "Hide Logs" : "View Logs ▾"}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {expanded && (
                                <tr>
                                  <td colSpan="6" style={{ background: "#f8fafc", padding: "16px" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                                      <div>
                                        <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: "700" }}>Allocation Logs</h4>
                                        {head.allocations && head.allocations.length > 0 ? (
                                          <ul style={{ paddingLeft: "16px", margin: 0, fontSize: "12px", color: "#475569" }}>
                                            {head.allocations.map(a => (
                                              <li key={a.id} style={{ marginBottom: "6px" }}>
                                                <strong>{a.financial_year}</strong>: {formatCurrency(a.amount)} allocated on {a.date || "N/A"}.
                                                {a.remarks && <span style={{ fontStyle: "italic", color: "#64748b" }}> ({a.remarks})</span>}
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <p style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>No allocation logs found.</p>
                                        )}
                                      </div>
                                      <div>
                                        <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: "700" }}>Approved Transactions</h4>
                                        {head.transactions && head.transactions.length > 0 ? (
                                          <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                                            <table className="admin-table" style={{ fontSize: "11px", border: "1px solid #e2e8f0" }}>
                                              <thead>
                                                <tr>
                                                  <th>Date</th>
                                                  <th>Description</th>
                                                  <th>Amount</th>
                                                  <th>Uploaded By</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {head.transactions.map(t => (
                                                  <tr key={t.id}>
                                                    <td>{t.date}</td>
                                                    <td>{t.description}</td>
                                                    <td style={{ fontWeight: 600 }}>{formatCurrency(t.amount)}</td>
                                                    <td>{t.uploaded_by}</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        ) : (
                                          <p style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>No approved transactions.</p>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" className="empty-state">No matching Centre heads found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Analytics Section */}
              <section className="admin-card" style={{ marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "#0f172a" }}>Budget Utilization Analytics</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
                  <div style={{ height: "280px", padding: "16px", border: "1px solid #e2e8f0", borderRadius: "8px", backgroundColor: "#ffffff" }}>
                    <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: "700", textAlign: "center", color: "#475569" }}>Budget vs Actual Spending</h4>
                    <div style={{ height: "220px", position: "relative" }}><canvas ref={barChartRef} /></div>
                  </div>
                  <div style={{ height: "280px", padding: "16px", border: "1px solid #e2e8f0", borderRadius: "8px", backgroundColor: "#ffffff" }}>
                    <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: "700", textAlign: "center", color: "#475569" }}>Category-wise Expense Breakdown</h4>
                    <div style={{ height: "220px", position: "relative" }}><canvas ref={doughnutChartRef} /></div>
                  </div>
                  <div style={{ height: "280px", padding: "16px", border: "1px solid #e2e8f0", borderRadius: "8px", backgroundColor: "#ffffff" }}>
                    <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: "700", textAlign: "center", color: "#475569" }}>Monthly Expense Trend</h4>
                    <div style={{ height: "220px", position: "relative" }}><canvas ref={lineChartRef} /></div>
                  </div>
                </div>
              </section>

              {/* Master Centre Transactions Panel */}
              <section className="admin-card">
                <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "#0f172a" }}>Centre Budget Transactions Ledger</h3>
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Uploaded By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCentreTransactions.length > 0 ? (
                        filteredCentreTransactions.map((tx, idx) => (
                          <tr key={idx}>
                            <td>{tx.date}</td>
                            <td>{tx.description}</td>
                            <td style={{ fontWeight: 600 }}>{formatCurrency(tx.amount)}</td>
                            <td>
                              <span className="status-badge active">{tx.status}</span>
                            </td>
                            <td>{tx.uploaded_by}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="empty-state">No Centre transactions recorded yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: E-YUVA FELLOWS BUDGET */}
          {activeTab === "FELLOWS" && (() => {
            const projectsList = overview?.fellows_budget?.projects || [];
            const activeProj = projectsList.find(p => p.project_uuid === selectedProjectUuid) || projectsList[0];
            const isSuspended = activeProj && ["SUSPENDED", "DELETED", "Suspended", "Deleted"].includes(activeProj.status);

            return (
              <div>
                {/* Statistics Grid */}
                <section className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: "24px" }}>
                  <div className="stat-card" style={{ borderLeft: "4px solid #3b82f6" }}>
                    <div className="stat-label">Total Fellows Budget (Received)</div>
                    <div className="stat-value">{formatCurrency(overview?.fellows_budget?.total)}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Total Allocated to Fellows</div>
                    <div className="stat-value">{formatCurrency(overview?.fellows_budget?.allocated)}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Remaining to Transfer</div>
                    <div className="stat-value">{formatCurrency(overview?.fellows_budget?.unallocated)}</div>
                  </div>
                  <div className="stat-card" style={{ borderLeft: "4px solid #10b981" }}>
                    <div className="stat-label">Fellows Total Utilized</div>
                    <div className="stat-value">{formatCurrency(overview?.fellows_budget?.utilized)}</div>
                  </div>
                </section>

                {/* Team Switcher toolbar */}
                <section className="admin-card" style={{ padding: "16px", marginBottom: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                      <span style={{ fontSize: "14px", fontWeight: "700", color: "#475569" }}>Select Fellow Team:</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {projectsList.map((p) => {
                          const isSel = p.project_uuid === selectedProjectUuid;
                          const isProjSuspended = ["SUSPENDED", "DELETED", "Suspended", "Deleted"].includes(p.status);
                          return (
                            <button
                              key={p.project_uuid}
                              type="button"
                              onClick={() => setSelectedProjectUuid(p.project_uuid)}
                              style={{
                                padding: "6px 14px",
                                borderRadius: "20px",
                                border: "1px solid",
                                borderColor: isSel ? "#3b82f6" : "#cbd5e1",
                                background: isSel ? "#e0f2fe" : "#ffffff",
                                color: isSel ? "#0369a1" : "#475569",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                              }}
                            >
                              {p.project_id} {isProjSuspended ? "(Suspended)" : ""}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <button type="button" className="btn-primary" onClick={handleOpenFellowModal} style={{ background: "#10b981", borderColor: "#10b981" }}>
                      Disburse Funds to Project
                    </button>
                  </div>
                </section>

                {activeProj ? (
                  <div>
                    {/* Active Project Details */}
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginBottom: "24px" }}>
                      <section className="admin-card" style={{ margin: 0, padding: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                          <div>
                            <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                              {activeProj.project_id}: {activeProj.project_name}
                            </h2>
                            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                              Leader: {activeProj.team_leader_name} | Members: {activeProj.member_count}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <span className={`status-badge ${isSuspended ? "rejected" : "approved"}`}>
                              {isSuspended ? "SUSPENDED" : "ACTIVE"}
                            </span>
                            <button
                              type="button"
                              className="btn-primary"
                              disabled={isSuspended}
                              onClick={() => {
                                setFellowCatError("");
                                setFellowCatForm({
                                  budget_head: "",
                                  allocated_amount: "",
                                  financial_year: currentFinancialYear(),
                                  remarks: ""
                                });
                                setShowFellowCatModal(true);
                              }}
                              title={isSuspended ? "Cannot allocate budget to suspended project" : ""}
                            >
                              + Allocate Category Budget
                            </button>
                          </div>
                        </div>

                        {/* Category Allocations Table */}
                        <div className="table-wrapper">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Category Name</th>
                                <th>Allocated Amount</th>
                                <th>Utilized Amount</th>
                                <th>Remaining Balance</th>
                                <th>Utilization %</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeProj.categories && activeProj.categories.length > 0 ? (
                                activeProj.categories.map((c) => {
                                  const uPct = c.allocated > 0 ? (c.utilized / c.allocated) * 100 : 0;
                                  const expanded = expandedRows.has(`fellow-cat-${c.name}`);
                                  return (
                                    <>
                                      <tr key={c.name}>
                                        <td style={{ fontWeight: "700" }}>{c.name}</td>
                                        <td>{formatCurrency(c.allocated)}</td>
                                        <td>{formatCurrency(c.utilized)}</td>
                                        <td style={{ fontWeight: "700", color: c.remaining < 0 ? "#ef4444" : "#0f172a" }}>
                                          {formatCurrency(c.remaining)}
                                        </td>
                                        <td>
                                          <span className={`status-badge ${getUtilizationStatus(c.allocated, c.utilized).toLowerCase()}`}>
                                            {formatPercent(uPct)}
                                          </span>
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                                            <button
                                              type="button"
                                              className="btn-sm"
                                              disabled={isSuspended}
                                              onClick={() => {
                                                setFellowCatError("");
                                                setFellowCatForm({
                                                  budget_head: c.name,
                                                  allocated_amount: String(c.allocated),
                                                  financial_year: c.allocations?.[0]?.financial_year || currentFinancialYear(),
                                                  remarks: c.allocations?.[0]?.remarks || ""
                                                });
                                                setShowFellowCatModal(true);
                                              }}
                                            >
                                              Edit
                                            </button>
                                            <button type="button" className="btn-sm" onClick={() => toggleRow(`fellow-cat-${c.name}`)}>
                                              {expanded ? "Hide Logs" : "View Logs ▾"}
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                      {expanded && (
                                        <tr>
                                          <td colSpan="6" style={{ background: "#f8fafc", padding: "16px" }}>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                                              <div>
                                                <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: "700" }}>Allocation Logs</h4>
                                                {c.allocations && c.allocations.length > 0 ? (
                                                  <ul style={{ paddingLeft: "16px", margin: 0, fontSize: "12px", color: "#475569" }}>
                                                    {c.allocations.map((a, aIdx) => (
                                                      <li key={aIdx} style={{ marginBottom: "6px" }}>
                                                        <strong>{a.financial_year}</strong>: {formatCurrency(a.amount)} allocated on {a.date || "N/A"}.
                                                        {a.remarks && <span style={{ fontStyle: "italic", color: "#64748b" }}> ({a.remarks})</span>}
                                                      </li>
                                                    ))}
                                                  </ul>
                                                ) : (
                                                  <p style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>No allocation logs found.</p>
                                                )}
                                              </div>
                                              <div>
                                                <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: "700" }}>Approved Transactions</h4>
                                                {c.transactions && c.transactions.length > 0 ? (
                                                  <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                                                    <table className="admin-table" style={{ fontSize: "11px", border: "1px solid #e2e8f0" }}>
                                                      <thead>
                                                        <tr>
                                                          <th>Date</th>
                                                          <th>Description</th>
                                                          <th>Amount</th>
                                                        </tr>
                                                      </thead>
                                                      <tbody>
                                                        {c.transactions.map((t, tIdx) => (
                                                          <tr key={tIdx}>
                                                            <td>{t.date}</td>
                                                            <td>{t.description}</td>
                                                            <td style={{ fontWeight: 600 }}>{formatCurrency(t.amount)}</td>
                                                          </tr>
                                                        ))}
                                                      </tbody>
                                                    </table>
                                                  </div>
                                                ) : (
                                                  <p style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>No approved transactions.</p>
                                                )}
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan="6" className="empty-state">No categories allocated for this project yet. Click "+ Allocate Category Budget" to start.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </section>

                      {/* Right Hand Side: Selected Project Disbursed Funding History */}
                      <section className="admin-card" style={{ margin: 0, padding: "20px" }}>
                        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "#0f172a" }}>Project Funding History</h3>
                        <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
                          {activeProj.allocations && activeProj.allocations.length > 0 ? (
                            activeProj.allocations.map((a, aIdx) => (
                              <div
                                key={aIdx}
                                style={{
                                  padding: "12px",
                                  borderRadius: "8px",
                                  border: "1px solid #e2e8f0",
                                  backgroundColor: "#f8fafc"
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                  <span style={{ fontWeight: "700", color: "#059669", fontSize: "14px" }}>
                                    {formatCurrency(a.amount)}
                                  </span>
                                  <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", background: "#e2e8f0", padding: "2px 6px", borderRadius: "4px" }}>
                                    {a.financial_year}
                                  </span>
                                </div>
                                <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>
                                  Transferred on {a.date}
                                </div>
                                {a.remarks && (
                                  <div style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic", borderTop: "1px dashed #cbd5e1", paddingTop: "4px", marginTop: "4px" }}>
                                    "{a.remarks}"
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <p style={{ fontSize: "13px", color: "#94a3b8", textAlign: "center", padding: "20px" }}>No fellowship disbursements transferred yet.</p>
                          )}
                        </div>
                      </section>
                    </div>

                    {/* Downside Analytics Charts */}
                    <section className="admin-card" style={{ marginBottom: "24px" }}>
                      <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "#0f172a" }}>Real-time Category Spend & Analytics</h3>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
                        <div style={{ height: "280px", padding: "16px", border: "1px solid #e2e8f0", borderRadius: "8px", backgroundColor: "#ffffff" }}>
                          <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: "700", textAlign: "center", color: "#475569" }}>Category Budget vs Actual</h4>
                          <div style={{ height: "220px", position: "relative" }}><canvas ref={fellowBarChartRef} /></div>
                        </div>
                        <div style={{ height: "280px", padding: "16px", border: "1px solid #e2e8f0", borderRadius: "8px", backgroundColor: "#ffffff" }}>
                          <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: "700", textAlign: "center", color: "#475569" }}>Category Breakdown</h4>
                          <div style={{ height: "220px", position: "relative" }}><canvas ref={fellowDoughnutChartRef} /></div>
                        </div>
                        <div style={{ height: "280px", padding: "16px", border: "1px solid #e2e8f0", borderRadius: "8px", backgroundColor: "#ffffff" }}>
                          <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: "700", textAlign: "center", color: "#475569" }}>Monthly Spend trend</h4>
                          <div style={{ height: "220px", position: "relative" }}><canvas ref={fellowLineChartRef} /></div>
                        </div>
                      </div>
                    </section>

                    {/* Transaction logs for the active project */}
                    <section className="admin-card">
                      <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "#0f172a" }}>Project Expenses Transactions Ledger</h3>
                      <div className="table-wrapper">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Description</th>
                              <th>Amount</th>
                              <th>Category</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeProj.transactions && activeProj.transactions.length > 0 ? (
                              activeProj.transactions.map((tx, idx) => (
                                <tr key={idx}>
                                  <td>{tx.date}</td>
                                  <td>{tx.description}</td>
                                  <td style={{ fontWeight: 600 }}>{formatCurrency(tx.amount)}</td>
                                  <td style={{ fontWeight: 600 }}>{tx.category}</td>
                                  <td>
                                    <span className="status-badge active">{tx.status}</span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="empty-state">No transactions recorded for this project yet.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="empty-state">No fellow projects found.</div>
                )}
              </div>
            );
          })()}
        </>
      )}

      {/* ---------- Allocate Centre Category Budget Modal ---------- */}
      {showAllocateModal && (
        <div className="custom-modal-overlay" onClick={handleCloseAllocateModal}>
          <div className="custom-modal" style={{ maxWidth: "450px" }} onClick={(e) => e.stopPropagation()}>
            <div className="custom-modal-header">
              <h2 style={{ margin: 0, fontSize: "16px" }}>Allocate Centre Category Budget</h2>
              <button className="icon-close-button" onClick={handleCloseAllocateModal}>×</button>
            </div>
            <div className="custom-modal-body">
              <form onSubmit={submitAllocation}>
                {allocateError && <div className="form-message error">{allocateError}</div>}
                
                <div style={{ display: "grid", gap: "16px" }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                    Budget Category
                    <select
                      value={allocateForm.budget_head}
                      onChange={(e) => setAllocateForm(f => ({ ...f, budget_head: e.target.value }))}
                      className="filter-select"
                      style={{ width: "100%", height: "40px" }}
                    >
                      {overview?.centre_budget?.heads?.map(h => (
                        <option key={h.name} value={h.name}>{h.name}</option>
                      ))}
                    </select>
                  </label>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                      Allocation Amount (Rs)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={allocateForm.allocated_amount}
                        onChange={(e) => setAllocateForm(f => ({ ...f, allocated_amount: e.target.value }))}
                        placeholder="e.g. 500000"
                        className="search-input"
                        style={{ height: "40px" }}
                        required
                      />
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                      Financial Year
                      <input
                        type="text"
                        value={allocateForm.financial_year}
                        onChange={(e) => setAllocateForm(f => ({ ...f, financial_year: e.target.value }))}
                        placeholder="e.g. 2026-27"
                        className="search-input"
                        style={{ height: "40px" }}
                        required
                      />
                    </label>
                  </div>

                  <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                    Remarks (optional)
                    <input
                      type="text"
                      value={allocateForm.remarks}
                      onChange={(e) => setAllocateForm(f => ({ ...f, remarks: e.target.value }))}
                      placeholder="Notes on this allocation..."
                      className="search-input"
                      style={{ height: "40px" }}
                    />
                  </label>
                </div>

                <div className="form-actions" style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button type="button" className="btn-secondary" onClick={handleCloseAllocateModal}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={allocateSaving}>
                    {allocateSaving ? "Saving..." : "Save Allocation"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Add Custom Category Modal ---------- */}
      {showCustomCatModal && (
        <div className="custom-modal-overlay" onClick={handleCloseCustomCatModal}>
          <div className="custom-modal" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="custom-modal-header">
              <h2 style={{ margin: 0, fontSize: "16px" }}>Add Custom Centre Category</h2>
              <button className="icon-close-button" onClick={handleCloseCustomCatModal}>×</button>
            </div>
            <div className="custom-modal-body">
              <form onSubmit={submitCustomCategory}>
                {customCatError && <div className="form-message error">{customCatError}</div>}
                
                <div style={{ display: "grid", gap: "16px" }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                    Category Name
                    <input
                      type="text"
                      value={customCatForm.name}
                      onChange={(e) => setCustomCatForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Consumables or Equipment"
                      className="search-input"
                      style={{ height: "40px" }}
                      required
                    />
                  </label>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                      Initial Allocation (Rs)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={customCatForm.allocated_amount}
                        onChange={(e) => setCustomCatForm(f => ({ ...f, allocated_amount: e.target.value }))}
                        placeholder="e.g. 150000"
                        className="search-input"
                        style={{ height: "40px" }}
                        required
                      />
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                      Financial Year
                      <input
                        type="text"
                        value={customCatForm.financial_year}
                        onChange={(e) => setCustomCatForm(f => ({ ...f, financial_year: e.target.value }))}
                        placeholder="e.g. 2026-27"
                        className="search-input"
                        style={{ height: "40px" }}
                        required
                      />
                    </label>
                  </div>

                  <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                    Remarks (optional)
                    <input
                      type="text"
                      value={customCatForm.remarks}
                      onChange={(e) => setCustomCatForm(f => ({ ...f, remarks: e.target.value }))}
                      placeholder="e.g. For specialized lab reagents..."
                      className="search-input"
                      style={{ height: "40px" }}
                    />
                  </label>
                </div>

                <div className="form-actions" style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button type="button" className="btn-secondary" onClick={handleCloseCustomCatModal}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={customCatSaving}>
                    {customCatSaving ? "Adding..." : "Add Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Transfer Funds to Fellow Modal ---------- */}
      {showFellowModal && (
        <div className="custom-modal-overlay" onClick={handleCloseFellowModal}>
          <div className="custom-modal" style={{ maxWidth: "450px" }} onClick={(e) => e.stopPropagation()}>
            <div className="custom-modal-header">
              <h2 style={{ margin: 0, fontSize: "16px" }}>Transfer Funds to Fellow</h2>
              <button className="icon-close-button" onClick={handleCloseFellowModal}>×</button>
            </div>
            <div className="custom-modal-body">
              <form onSubmit={submitFellowAllocation}>
                {fellowError && <div className="form-message error">{fellowError}</div>}
                
                <div style={{ display: "grid", gap: "16px" }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                    E-YUVA Fellow / Project ID
                    <select
                      value={fellowForm.project_uuid}
                      onChange={(e) => setFellowForm(f => ({ ...f, project_uuid: e.target.value }))}
                      className="filter-select"
                      style={{ width: "100%", height: "40px" }}
                      required
                    >
                      {projects.map((p) => (
                        <option key={p.project_uuid} value={p.project_uuid}>
                          {p.project_id} - {p.project_name} ({p.team_leader_name})
                        </option>
                      ))}
                    </select>
                  </label>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                      Transfer Amount (Rs)
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={fellowForm.allocated_amount}
                        onChange={(e) => setFellowForm(f => ({ ...f, allocated_amount: e.target.value }))}
                        placeholder="e.g. 250000"
                        className="search-input"
                        style={{ height: "40px" }}
                        required
                      />
                      <span style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                        Available Pot: {formatCurrency(overview?.fellows_budget?.unallocated)}
                      </span>
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                      Financial Year
                      <input
                        type="text"
                        value={fellowForm.financial_year}
                        onChange={(e) => setFellowForm(f => ({ ...f, financial_year: e.target.value }))}
                        placeholder="e.g. 2026-27"
                        className="search-input"
                        style={{ height: "40px" }}
                        required
                      />
                    </label>
                  </div>

                  <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                    Remarks
                    <input
                      type="text"
                      value={fellowForm.remarks}
                      onChange={(e) => setFellowForm(f => ({ ...f, remarks: e.target.value }))}
                      placeholder="e.g. 1st installment disbursement..."
                      className="search-input"
                      style={{ height: "40px" }}
                    />
                  </label>
                </div>

                <div className="form-actions" style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button type="button" className="btn-secondary" onClick={handleCloseFellowModal}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={fellowSaving} style={{ background: "#10b981", borderColor: "#10b981" }}>
                    {fellowSaving ? "Transferring..." : "Disburse Funds"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* ---------- Allocate Fellow Project Category Budget Modal ---------- */}
      {showFellowCatModal && (
        <div className="custom-modal-overlay" onClick={() => setShowFellowCatModal(false)}>
          <div className="custom-modal" style={{ maxWidth: "450px" }} onClick={(e) => e.stopPropagation()}>
            <div className="custom-modal-header">
              <h2 style={{ margin: 0, fontSize: "16px" }}>Allocate Project Category Budget</h2>
              <button type="button" className="icon-close-button" onClick={() => setShowFellowCatModal(false)}>×</button>
            </div>
            <div className="custom-modal-body">
              <form onSubmit={submitFellowCatAllocation}>
                {fellowCatError && <div className="form-message error">{fellowCatError}</div>}
                
                <div style={{ display: "grid", gap: "16px" }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                    Budget Category
                    <input
                      type="text"
                      value={fellowCatForm.budget_head}
                      onChange={(e) => setFellowCatForm(f => ({ ...f, budget_head: e.target.value }))}
                      placeholder="e.g. Travel, Equipment, Workshop..."
                      className="search-input"
                      style={{ height: "40px" }}
                      required
                    />
                  </label>
 
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                      Allocation Amount (Rs)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={fellowCatForm.allocated_amount}
                        onChange={(e) => setFellowCatForm(f => ({ ...f, allocated_amount: e.target.value }))}
                        placeholder="e.g. 50000"
                        className="search-input"
                        style={{ height: "40px" }}
                        required
                      />
                    </label>
 
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                      Financial Year
                      <input
                        type="text"
                        value={fellowCatForm.financial_year}
                        onChange={(e) => setFellowCatForm(f => ({ ...f, financial_year: e.target.value }))}
                        placeholder="e.g. 2026-27"
                        className="search-input"
                        style={{ height: "40px" }}
                        required
                      />
                    </label>
                  </div>
 
                  <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                    Remarks (optional)
                    <input
                      type="text"
                      value={fellowCatForm.remarks}
                      onChange={(e) => setFellowCatForm(f => ({ ...f, remarks: e.target.value }))}
                      placeholder="Notes on this allocation..."
                      className="search-input"
                      style={{ height: "40px" }}
                    />
                  </label>
                </div>
 
                <div className="form-actions" style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowFellowCatModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={fellowCatSaving}>
                    {fellowCatSaving ? "Saving..." : "Save Allocation"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default AdminBudgetHeads;

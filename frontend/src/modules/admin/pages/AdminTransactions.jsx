import React, { useMemo, useState, useEffect } from "react";
import {
  Download,
  Loader2,
  RefreshCw,
  Upload,
  X,
  FileCheck,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Lock,
  ChevronRight,
  Filter,
  Eye,
  AlertCircle,
  History,
  FileSpreadsheet,
  Link2,
} from "lucide-react";
import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../common/hooks/useAuth";
import { useNotification } from "../../common/hooks/useNotification";
import { adminTransactionService } from "../../../services/adminTransactionService";
import "../../../styles/admin-management.css";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

function AdminTransactions() {
  useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  // Filters State
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [recStatusFilter, setRecStatusFilter] = useState("ALL");
  const [budgetHeadFilter, setBudgetHeadFilter] = useState("ALL");
  const [vendorFilter, setVendorFilter] = useState("");
  const [grantFilter, setGrantFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isHistoricalFilter, setIsHistoricalFilter] = useState("");

  // Modals
  const [showAdminBillModal, setShowAdminBillModal] = useState(false);
  const [adminBillFile, setAdminBillFile] = useState(null);
  const [adminBillForm, setAdminBillForm] = useState({
    amount: "",
    budget_line: "Travel",
    vendor: "",
    description: "",
    grant_id: "",
  });
  const [isSubmittingBill, setIsSubmittingBill] = useState(false);

  // CSV Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isStaging, setIsStaging] = useState(false);
  const [stagedData, setStagedData] = useState(null);
  const [isImportHistorical, setIsImportHistorical] = useState(false);
  const [isConfirmingImport, setIsConfirmingImport] = useState(false);

  // Detail / Bill Preview Modal
  const [previewTxn, setPreviewTxn] = useState(null);

  // Live Dashboard Counters Query
  const {
    data: counters = {
      pending_review: 0,
      approved: 0,
      admin_recorded: 0,
      awaiting_reconciliation: 0,
      reconciled: 0,
      rejected: 0,
      historical: 0,
      locked: 0,
    },
    refetch: refetchCounters,
  } = useQuery(["admin-txn-counters"], () => adminTransactionService.getDashboardCounters(), {
    refetchInterval: 5000,
  });

  // Budget Heads list
  const { data: budgetHeads = [] } = useQuery(["admin-budget-heads"], () => adminTransactionService.getBudgetHeads(), {
    staleTime: 5 * 60 * 1000,
  });

  // Main Transactions Query with Active Filters
  const activeFilters = useMemo(
    () => ({
      search,
      source: sourceFilter,
      status: statusFilter,
      reconciliationStatus: recStatusFilter,
      budgetHead: budgetHeadFilter,
      vendor: vendorFilter,
      grant: grantFilter,
      dateFrom,
      dateTo,
      isHistorical: isHistoricalFilter,
    }),
    [search, sourceFilter, statusFilter, recStatusFilter, budgetHeadFilter, vendorFilter, grantFilter, dateFrom, dateTo, isHistoricalFilter]
  );

  const {
    data: transactions = [],
    isLoading: isLoadingTxns,
    isError,
    error,
    refetch: refetchTxns,
  } = useQuery(["admin-transactions-list", activeFilters], () => adminTransactionService.getTransactions(activeFilters), {
    refetchInterval: 5000,
    keepPreviousData: true,
  });

  // Admin Upload Bill Handler
  const handleAdminBillSubmit = async (e) => {
    e.preventDefault();
    if (!adminBillForm.amount || !adminBillForm.vendor || !adminBillForm.description || !adminBillForm.budget_line) {
      addNotification("Please fill all required fields.", "error", 2000);
      return;
    }
    setIsSubmittingBill(true);
    try {
      await adminTransactionService.uploadAdminBill(adminBillForm, adminBillFile);
      addNotification("Admin expense recorded successfully. Added to General Ledger.", "success", 2000);
      setShowAdminBillModal(false);
      setAdminBillFile(null);
      setAdminBillForm({ amount: "", budget_line: "Travel", vendor: "", description: "", grant_id: "" });
      refetchCounters();
      refetchTxns();
    } catch (err) {
      addNotification(err?.response?.data?.detail || "Failed to record admin expense.", "error", 2500);
    } finally {
      setIsSubmittingBill(false);
    }
  };

  // CSV Stage Handler
  const handleStageCSV = async () => {
    if (!importFile) {
      addNotification("Please select a CSV file.", "error", 2000);
      return;
    }
    if (!importFile.name.toLowerCase().endsWith(".csv")) {
      addNotification("Invalid file format. Please upload a CSV file (.csv) for transactions.", "error", 3000);
      return;
    }
    setIsStaging(true);
    try {
      const stageRes = await adminTransactionService.stageImportTransactions(importFile);
      setStagedData(stageRes);
      addNotification("CSV file parsed and staged. Please review validation results.", "info", 2000);
    } catch (err) {
      addNotification(err?.response?.data?.detail || "Failed to parse CSV file.", "error", 2500);
    } finally {
      setIsStaging(false);
    }
  };

  // CSV Confirm Handler
  const handleConfirmCSV = async () => {
    if (!stagedData || !stagedData.stage_token) return;
    setIsConfirmingImport(true);
    try {
      const res = await adminTransactionService.confirmImportTransactions(stagedData.stage_token, isImportHistorical);
      addNotification(`Successfully imported ${res.imported} transaction(s).`, "success", 2500);
      setShowImportModal(false);
      setImportFile(null);
      setStagedData(null);
      refetchCounters();
      refetchTxns();
    } catch (err) {
      addNotification(err?.response?.data?.detail || "Import confirmation failed.", "error", 2500);
    } finally {
      setIsConfirmingImport(false);
    }
  };

  // Export CSV Handler
  const handleExportCSV = async () => {
    try {
      const { blob, filename } = await adminTransactionService.exportTransactions(activeFilters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || "transactions.csv";
      link.click();
      URL.revokeObjectURL(url);
      addNotification("Transactions CSV exported successfully.", "success", 2000);
    } catch (err) {
      addNotification("Failed to export transactions CSV.", "error", 2000);
    }
  };

  return (
    <main className="admin-page" style={{ background: "#f8fafc", padding: "24px", gap: "24px" }}>
      {/* 1. Page Header */}
      <section className="admin-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>
            💳 General Ledger & Transactions Workspace
          </h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>
            Central ERP transaction hub for multi-source ledgers, bill verification, and reconciliation pipeline.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => setShowAdminBillModal(true)}
            className="btn-primary"
            style={{ background: "linear-gradient(135deg, #1d5cff, #0f46d8)", display: "flex", alignItems: "center", gap: "6px" }}
          >
            + Record Admin Bill / Expense
          </button>
          <button
            onClick={() => {
              setImportFile(null);
              setStagedData(null);
              setShowImportModal(true);
            }}
            className="btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "#ffffff", border: "1px solid #cbd5e1" }}
          >
            <Upload size={16} /> Import CSV
          </button>
          <button
            onClick={handleExportCSV}
            className="btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "#ffffff", border: "1px solid #cbd5e1" }}
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            onClick={() => {
              refetchCounters();
              refetchTxns();
              addNotification("Refreshed ledger data.", "info", 1000);
            }}
            className="btn-secondary"
            style={{ padding: "8px 12px", background: "#ffffff", border: "1px solid #cbd5e1" }}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </section>

      {/* 2. Live Dashboard Counters */}
      <section className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
        <article className="stat-card" style={{ borderLeft: "4px solid #f59e0b", padding: "14px" }}>
          <span className="stat-label" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Pending Review</span>
          <strong className="stat-value" style={{ color: "#d97706", fontSize: "22px" }}>{counters.pending_review}</strong>
        </article>
        <article className="stat-card" style={{ borderLeft: "4px solid #10b981", padding: "14px" }}>
          <span className="stat-label" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Approved</span>
          <strong className="stat-value" style={{ color: "#15803d", fontSize: "22px" }}>{counters.approved}</strong>
        </article>
        <article className="stat-card" style={{ borderLeft: "4px solid #3b82f6", padding: "14px" }}>
          <span className="stat-label" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Admin Recorded</span>
          <strong className="stat-value" style={{ color: "#2563eb", fontSize: "22px" }}>{counters.admin_recorded}</strong>
        </article>
        <article className="stat-card" style={{ borderLeft: "4px solid #8b5cf6", padding: "14px" }}>
          <span className="stat-label" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Awaiting Reconciliation</span>
          <strong className="stat-value" style={{ color: "#7c3aed", fontSize: "22px" }}>{counters.awaiting_reconciliation}</strong>
        </article>
        <article className="stat-card" style={{ borderLeft: "4px solid #06b6d4", padding: "14px" }}>
          <span className="stat-label" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Reconciled</span>
          <strong className="stat-value" style={{ color: "#0891b2", fontSize: "22px" }}>{counters.reconciled}</strong>
        </article>
        <article className="stat-card" style={{ borderLeft: "4px solid #ef4444", padding: "14px" }}>
          <span className="stat-label" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Rejected</span>
          <strong className="stat-value" style={{ color: "#dc2626", fontSize: "22px" }}>{counters.rejected}</strong>
        </article>
        <article className="stat-card" style={{ borderLeft: "4px solid #64748b", padding: "14px" }}>
          <span className="stat-label" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Historical</span>
          <strong className="stat-value" style={{ color: "#475569", fontSize: "22px" }}>{counters.historical}</strong>
        </article>
        <article className="stat-card" style={{ borderLeft: "4px solid #1e293b", padding: "14px" }}>
          <span className="stat-label" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Locked</span>
          <strong className="stat-value" style={{ color: "#0f172a", fontSize: "22px" }}>{counters.locked}</strong>
        </article>
      </section>

      {/* 3. Filters & Database Table */}
      <section className="admin-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={18} /> Financial Ledger Workspace
          </h2>
          <span style={{ fontSize: "12px", color: "#64748b" }}>Showing live backend ledger records</span>
        </div>

        {/* Filters grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search description, vendor, ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
            style={{ padding: "8px 12px", fontSize: "13px" }}
          />

          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="filter-select" style={{ padding: "8px 12px", fontSize: "13px" }}>
            <option value="ALL">All Sources</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="IMPORT">IMPORT</option>
            <option value="JOURNAL">JOURNAL</option>
            <option value="HISTORICAL">HISTORICAL</option>
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select" style={{ padding: "8px 12px", fontSize: "13px" }}>
            <option value="ALL">All Txn Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="PENDING_REVIEW">PENDING_REVIEW</option>
            <option value="APPROVED">APPROVED</option>
            <option value="ADMIN_RECORDED">ADMIN_RECORDED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="HISTORICAL">HISTORICAL</option>
            <option value="LOCKED">LOCKED</option>
          </select>

          <select value={recStatusFilter} onChange={(e) => setRecStatusFilter(e.target.value)} className="filter-select" style={{ padding: "8px 12px", fontSize: "13px" }}>
            <option value="ALL">All Rec Statuses</option>
            <option value="NOT_READY">NOT_READY</option>
            <option value="AWAITING_RECONCILIATION">AWAITING_RECONCILIATION</option>
            <option value="AUTO_MATCHED">AUTO_MATCHED</option>
            <option value="MANUALLY_MATCHED">MANUALLY_MATCHED</option>
            <option value="JOURNAL_CLOSED">JOURNAL_CLOSED</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="LOCKED">LOCKED</option>
          </select>

          <select value={budgetHeadFilter} onChange={(e) => setBudgetHeadFilter(e.target.value)} className="filter-select" style={{ padding: "8px 12px", fontSize: "13px" }}>
            <option value="ALL">All Budget Lines</option>
            {budgetHeads.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Filter by Vendor"
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="search-input"
            style={{ padding: "8px 12px", fontSize: "13px" }}
          />

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="filter-select"
            style={{ padding: "8px 12px", fontSize: "13px" }}
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="filter-select"
            style={{ padding: "8px 12px", fontSize: "13px" }}
          />

          <select value={isHistoricalFilter} onChange={(e) => setIsHistoricalFilter(e.target.value)} className="filter-select" style={{ padding: "8px 12px", fontSize: "13px" }}>
            <option value="">Historical / Current (All)</option>
            <option value="true">HISTORICAL Only</option>
            <option value="false">CURRENT Only</option>
          </select>

          <button
            onClick={() => {
              setSearch("");
              setSourceFilter("ALL");
              setStatusFilter("ALL");
              setRecStatusFilter("ALL");
              setBudgetHeadFilter("ALL");
              setVendorFilter("");
              setGrantFilter("");
              setDateFrom("");
              setDateTo("");
              setIsHistoricalFilter("");
            }}
            className="btn-secondary"
            style={{ padding: "8px 12px", fontSize: "13px", background: "#f1f5f9" }}
          >
            Reset Filters
          </button>
        </div>

        {/* ERP Table */}
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID / Ref</th>
                <th>Date</th>
                <th>Description</th>
                <th>Vendor</th>
                <th>Grant</th>
                <th>Budget Line</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th>Source</th>
                <th>Proof / Bill</th>
                <th>Txn Status</th>
                <th>Reconciliation Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingTxns && (
                <tr>
                  <td colSpan="12" style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                    <Loader2 className="animate-spin" style={{ margin: "0 auto 8px auto" }} /> Loading financial ledger...
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan="12" style={{ padding: "20px", textAlign: "center", color: "#ef4444" }}>
                    Failed to fetch transactions: {error?.message || "API Error"}
                  </td>
                </tr>
              )}

              {!isLoadingTxns && !isError && transactions.length === 0 && (
                <tr>
                  <td colSpan="12" className="empty-state">
                    No transactions match current filters.
                  </td>
                </tr>
              )}

              {!isLoadingTxns &&
                !isError &&
                transactions.map((txn) => {
                  const sourceColorMap = {
                    USER: { bg: "#e0f2fe", color: "#0369a1" },
                    ADMIN: { bg: "#f3e8ff", color: "#6b21a8" },
                    IMPORT: { bg: "#fef3c7", color: "#b45309" },
                    JOURNAL: { bg: "#dcfce7", color: "#15803d" },
                    HISTORICAL: { bg: "#f1f5f9", color: "#475569" },
                  };
                  const srcStyle = sourceColorMap[txn.source] || { bg: "#f1f5f9", color: "#475569" };

                  return (
                    <tr key={txn.id}>
                      <td style={{ fontFamily: "monospace", fontSize: "11px", fontWeight: "700" }}>
                        {txn.reference_number || txn.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
                        {new Date(txn.date).toLocaleDateString("en-IN")}
                      </td>
                      <td style={{ fontSize: "13px", maxWidth: "200px" }}>{txn.description}</td>
                      <td style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>{txn.vendor || "-"}</td>
                      <td style={{ fontSize: "12px" }}>{txn.grant || "-"}</td>
                      <td style={{ fontSize: "12px", fontWeight: "600" }}>{txn.budget_line}</td>
                      <td style={{ textAlign: "right", fontWeight: "800", color: "#0f172a" }}>
                        {formatCurrency(txn.amount)}
                      </td>
                      <td>
                        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", background: srcStyle.bg, color: srcStyle.color }}>
                          {txn.source}
                        </span>
                      </td>
                      <td>
                        {txn.bill_url ? (
                          <button
                            onClick={() => setPreviewTxn(txn)}
                            className="btn-sm"
                            style={{ padding: "2px 8px", fontSize: "11px", background: "#eff6ff", color: "#1d5cff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", gap: "4px" }}
                          >
                            <Eye size={12} /> View Bill
                          </button>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>No Proof</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${txn.status?.toLowerCase() === "approved" || txn.status?.toLowerCase() === "admin_recorded" ? "approved" : txn.status?.toLowerCase() === "rejected" ? "rejected" : "pending"}`}>
                          {txn.status}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "600",
                            background:
                              txn.reconciliation_status?.includes("MATCHED") || txn.reconciliation_status === "CONFIRMED" || txn.reconciliation_status === "JOURNAL_CLOSED"
                                ? "#dcfce7"
                                : txn.reconciliation_status === "LOCKED"
                                ? "#f1f5f9"
                                : "#fef3c7",
                            color:
                              txn.reconciliation_status?.includes("MATCHED") || txn.reconciliation_status === "CONFIRMED" || txn.reconciliation_status === "JOURNAL_CLOSED"
                                ? "#15803d"
                                : txn.reconciliation_status === "LOCKED"
                                ? "#0f172a"
                                : "#b45309",
                          }}
                        >
                          {txn.reconciliation_status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="action-buttons" style={{ justifyContent: "flex-end" }}>
                          <button onClick={() => setPreviewTxn(txn)} className="btn-sm">View</button>
                          {txn.reconciliation_status === "AWAITING_RECONCILIATION" && (
                            <button
                              onClick={() => navigate("/admin/reconciliation")}
                              className="btn-sm"
                              style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: "2px" }}
                            >
                              <Link2 size={12} /> Reconcile
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="pagination-bar" style={{ marginTop: "16px", display: "flex", justifyContent: "space-between" }}>
          <span>Showing {transactions.length} record(s)</span>
          <span style={{ fontSize: "12px", color: "#64748b" }}>Live FastAPI Ledger Connection</span>
        </div>
      </section>

      {/* 4. ADMIN RECORD BILL MODAL */}
      {showAdminBillModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)", zIndex: 1000, display: "grid", placeItems: "center" }}>
          <div className="admin-card" style={{ width: "90%", maxWidth: "550px", padding: "24px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Record Admin Expense / Bill</h3>
              <button onClick={() => setShowAdminBillModal(false)} style={{ border: 0, background: "transparent", cursor: "pointer", fontSize: "1.5rem", color: "#94a3b8" }}>&times;</button>
            </div>

            <form onSubmit={handleAdminBillSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 15000"
                    value={adminBillForm.amount}
                    onChange={(e) => setAdminBillForm({ ...adminBillForm, amount: e.target.value })}
                    required
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Budget Line *</label>
                  <select
                    value={adminBillForm.budget_line}
                    onChange={(e) => setAdminBillForm({ ...adminBillForm, budget_line: e.target.value })}
                    required
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                  >
                    {budgetHeads.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                    {!budgetHeads.includes("Travel") && <option value="Travel">Travel</option>}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Vendor Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp / Airline Services"
                  value={adminBillForm.vendor}
                  onChange={(e) => setAdminBillForm({ ...adminBillForm, vendor: e.target.value })}
                  required
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Flight tickets for research team"
                  value={adminBillForm.description}
                  onChange={(e) => setAdminBillForm({ ...adminBillForm, description: e.target.value })}
                  required
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Upload Bill / Proof (Optional)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setAdminBillFile(e.target.files?.[0] || null)}
                  style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button type="button" onClick={() => setShowAdminBillModal(false)} className="btn-sm" style={{ background: "#cbd5e1", color: "#334155" }}>Cancel</button>
                <button type="submit" disabled={isSubmittingBill} className="btn-primary" style={{ padding: "8px 20px" }}>
                  {isSubmittingBill ? "Saving..." : "Save to Ledger (ADMIN_RECORDED)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. CSV TRANSACTION IMPORT STAGING MODAL */}
      {showImportModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)", zIndex: 1000, display: "grid", placeItems: "center" }}>
          <div className="admin-card" style={{ width: "90%", maxWidth: "750px", padding: "24px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <FileSpreadsheet size={20} /> CSV Transaction Import & Validation Staging
              </h3>
              <button onClick={() => setShowImportModal(false)} style={{ border: 0, background: "transparent", cursor: "pointer", fontSize: "1.5rem", color: "#94a3b8" }}>&times;</button>
            </div>

            {!stagedData ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>
                  Upload a CSV file (`.csv`) containing transactions. The system will validate every row, detect duplicates, and display a preview table before writing to the database.
                </p>

                <div style={{ border: "2px dashed #cbd5e1", padding: "24px", borderRadius: "8px", textAlign: "center", background: "#f8fafc" }}>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    style={{ marginBottom: "12px" }}
                  />
                  {importFile && (
                    <div style={{ fontSize: "12px", fontWeight: "700", color: importFile.name.toLowerCase().endsWith(".csv") ? "#1d5cff" : "#dc2626" }}>
                      Selected: {importFile.name}
                    </div>
                  )}
                </div>

                {importFile && !importFile.name.toLowerCase().endsWith(".csv") && (
                  <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "12px", borderRadius: "6px", fontSize: "13px", fontWeight: "600" }}>
                    ⚠️ Invalid file format: Please select a CSV file (.csv) for transactions.
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      const csvData = `date,description,vendor,budget_line,amount,reference_number\n2026-05-15,Air India Flight Booking,Air India Ltd,Travel,5000.00,REF-9921\n2026-05-18,Local Cab Taxi Fare,City Cabs,Travel,2000.00,REF-TAXI-001\n2026-05-20,Office Supplies Purchase,Stationery Mart,Supplies,1500.00,REF-STAT-002`;
                      const blob = new Blob([csvData], { type: "text/csv" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "sample_transactions.csv";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="btn-sm"
                    style={{ background: "#eff6ff", color: "#1d5cff", border: "1px solid #bfdbfe", padding: "6px 12px" }}
                  >
                    📄 Download Sample Transactions CSV Template
                  </button>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => setShowImportModal(false)} className="btn-sm" style={{ background: "#cbd5e1", color: "#334155" }}>Cancel</button>
                    <button
                      onClick={handleStageCSV}
                      disabled={!importFile || !importFile.name.toLowerCase().endsWith(".csv") || isStaging}
                      className="btn-primary"
                      style={{ padding: "8px 20px", opacity: (!importFile || !importFile.name.toLowerCase().endsWith(".csv") || isStaging) ? 0.6 : 1 }}
                    >
                      {isStaging ? "Parsing & Validating..." : "Stage & Validate CSV"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Validation Summary Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                  <div style={{ background: "#f1f5f9", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Total Rows</span>
                    <strong style={{ display: "block", fontSize: "18px" }}>{stagedData.total_rows}</strong>
                  </div>
                  <div style={{ background: "#dcfce7", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
                    <span style={{ fontSize: "11px", color: "#166534" }}>Valid Rows</span>
                    <strong style={{ display: "block", fontSize: "18px", color: "#15803d" }}>{stagedData.valid_count}</strong>
                  </div>
                  <div style={{ background: "#fee2e2", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
                    <span style={{ fontSize: "11px", color: "#991b1b" }}>Invalid Rows</span>
                    <strong style={{ display: "block", fontSize: "18px", color: "#dc2626" }}>{stagedData.invalid_count}</strong>
                  </div>
                  <div style={{ background: "#fef3c7", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
                    <span style={{ fontSize: "11px", color: "#92400e" }}>Duplicates</span>
                    <strong style={{ display: "block", fontSize: "18px", color: "#b45309" }}>{stagedData.duplicate_count}</strong>
                  </div>
                </div>

                {/* Error details list if any */}
                {stagedData.errors && stagedData.errors.length > 0 && (
                  <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", padding: "12px", borderRadius: "6px", maxHeight: "120px", overflowY: "auto" }}>
                    <strong style={{ fontSize: "12px", color: "#be123c", display: "block", marginBottom: "4px" }}>Row-Level Validation Errors:</strong>
                    {stagedData.errors.map((err, idx) => (
                      <div key={idx} style={{ fontSize: "11px", color: "#9f1239" }}>
                        Row {err.row} ({err.field}): {err.reason}
                      </div>
                    ))}
                  </div>
                )}

                {/* Preview Table */}
                <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
                  <table className="admin-table" style={{ fontSize: "12px" }}>
                    <thead>
                      <tr>
                        <th>Row</th>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Vendor</th>
                        <th>Budget Line</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stagedData.preview_rows.map((r) => (
                        <tr key={r.row_index} style={{ background: r.is_valid ? "#ffffff" : "#fff1f2" }}>
                          <td>{r.row_index}</td>
                          <td>{new Date(r.date).toLocaleDateString()}</td>
                          <td>{r.description}</td>
                          <td>{r.vendor}</td>
                          <td>{r.budget_line}</td>
                          <td style={{ textAlign: "right", fontWeight: "700" }}>₹{r.amount.toLocaleString()}</td>
                          <td>
                            <span style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", background: r.is_valid ? "#dcfce7" : "#fee2e2", color: r.is_valid ? "#15803d" : "#dc2626" }}>
                              {r.is_valid ? "VALID" : "SKIPPED"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Historical Import Checkbox */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <input
                    type="checkbox"
                    id="is_historical_chk"
                    checked={isImportHistorical}
                    onChange={(e) => setIsImportHistorical(e.target.checked)}
                  />
                  <label htmlFor="is_historical_chk" style={{ fontSize: "13px", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                    Mark imported records explicitly as <strong>HISTORICAL</strong> (predates system, skips approval requests)
                  </label>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button onClick={() => setStagedData(null)} className="btn-sm" style={{ background: "#cbd5e1", color: "#334155" }}>Back</button>
                  <button
                    onClick={handleConfirmCSV}
                    disabled={isConfirmingImport || stagedData.valid_count === 0}
                    className="btn-primary"
                    style={{ padding: "8px 20px" }}
                  >
                    {isConfirmingImport ? "Importing..." : `Confirm Import (${stagedData.valid_count} records)`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. DETAIL / BILL PREVIEW MODAL */}
      {previewTxn && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)", zIndex: 1000, display: "grid", placeItems: "center" }}>
          <div className="admin-card" style={{ width: "90%", maxWidth: "600px", padding: "24px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Transaction Details: {previewTxn.id.substring(0, 8).toUpperCase()}</h3>
              <button onClick={() => setPreviewTxn(null)} style={{ border: 0, background: "transparent", cursor: "pointer", fontSize: "1.5rem", color: "#94a3b8" }}>&times;</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px", marginBottom: "16px" }}>
              <div><strong>Description:</strong> {previewTxn.description}</div>
              <div><strong>Amount:</strong> {formatCurrency(previewTxn.amount)}</div>
              <div><strong>Vendor:</strong> {previewTxn.vendor || "N/A"}</div>
              <div><strong>Grant:</strong> {previewTxn.grant || "N/A"}</div>
              <div><strong>Budget Line:</strong> {previewTxn.budget_line}</div>
              <div><strong>Source:</strong> {previewTxn.source}</div>
              <div><strong>Transaction Status:</strong> {previewTxn.status}</div>
              <div><strong>Reconciliation Status:</strong> {previewTxn.reconciliation_status}</div>
              <div><strong>Reference Number:</strong> {previewTxn.reference_number || "N/A"}</div>
              <div><strong>Created By:</strong> {previewTxn.created_by_name}</div>
              <div><strong>Date:</strong> {new Date(previewTxn.date).toLocaleString()}</div>
              <div><strong>Is Historical:</strong> {previewTxn.is_historical ? "Yes (HISTORICAL)" : "No"}</div>
            </div>

            {previewTxn.bill_url && (
              <div style={{ marginTop: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
                <strong style={{ fontSize: "13px", color: "#334155", display: "block", marginBottom: "8px" }}>Attached Bill Proof:</strong>
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", textAlign: "center", border: "1px solid #cbd5e1" }}>
                  <a href={`http://localhost:8000${previewTxn.bill_url}`} target="_blank" rel="noreferrer" style={{ color: "#1d5cff", fontWeight: "700", fontSize: "13px" }}>
                    📄 Open Attachment ({previewTxn.bill_filename || "Bill Document"})
                  </a>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <button onClick={() => setPreviewTxn(null)} className="btn-primary" style={{ padding: "8px 16px" }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default AdminTransactions;

import React, { useState, useMemo, useEffect } from "react";
import {
  Upload,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Zap,
  Link2,
  Unlink,
  FileSpreadsheet,
  PlusCircle,
  Eye,
  Loader2,
  ChevronRight,
  Filter,
  CheckSquare,
} from "lucide-react";
import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../common/hooks/useAuth";
import { useNotification } from "../../common/hooks/useNotification";
import { reconciliationService } from "../../../services/reconciliationService";
import { adminTransactionService } from "../../../services/adminTransactionService";
import "../../../styles/admin-management.css";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

function AdminReconciliation() {
  useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  // Filters
  const [selectedPeriod, setSelectedPeriod] = useState("ALL");
  const [matchStatusFilter, setMatchStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Bank Statement CSV Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isStaging, setIsStaging] = useState(false);
  const [stagedData, setStagedData] = useState(null);
  const [isConfirmingImport, setIsConfirmingImport] = useState(false);

  // Auto Match State
  const [isAutoMatching, setIsAutoMatching] = useState(false);
  const [autoMatchResult, setAutoMatchResult] = useState(null);

  // Manual Match Workspace Modal State
  const [selectedBankTxn, setSelectedBankTxn] = useState(null);
  const [selectedLedgerTxnId, setSelectedLedgerTxnId] = useState("");
  const [matchNotes, setMatchNotes] = useState("");
  const [isSubmittingMatch, setIsSubmittingMatch] = useState(false);

  // Journal Entry Fallback Modal State
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalBankTxn, setJournalBankTxn] = useState(null);
  const [journalForm, setJournalForm] = useState({
    debit_account: "Travel",
    credit_account: "Bank Account (HDFC)",
    amount: "",
    narration: "",
  });
  const [isSubmittingJournal, setIsSubmittingJournal] = useState(false);

  // Unlock Period Modal State
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockPeriodName, setUnlockPeriodName] = useState("");
  const [unlockReason, setUnlockReason] = useState("");
  const [isSubmittingUnlock, setIsSubmittingUnlock] = useState(false);

  // Fetch Workspace Data (Summary + Bank Transactions + Periods)
  const activeFilters = useMemo(
    () => ({
      period_name: selectedPeriod,
      match_status: matchStatusFilter,
      search: searchQuery,
    }),
    [selectedPeriod, matchStatusFilter, searchQuery]
  );

  const {
    data: workspaceData = { summary: {}, bank_transactions: [], periods: [] },
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(["admin-reconciliation-workspace", activeFilters], () => reconciliationService.getWorkspace(activeFilters), {
    refetchInterval: 5000,
    keepPreviousData: true,
  });

  const summary = workspaceData.summary || {};
  const bankTransactions = workspaceData.bank_transactions || [];
  const periods = workspaceData.periods || [];

  // Available Ledger Candidates query for Manual Match Workspace
  const { data: ledgerCandidates = [] } = useQuery(
    ["admin-ledger-candidates"],
    () => adminTransactionService.getTransactions({ reconciliationStatus: "AWAITING_RECONCILIATION" }),
    { enabled: Boolean(selectedBankTxn) }
  );

  // Handle Bank CSV Stage
  const handleStageBankCSV = async () => {
    if (!importFile) {
      addNotification("Please select a bank statement CSV file.", "error", 2000);
      return;
    }
    if (!importFile.name.toLowerCase().endsWith(".csv")) {
      addNotification("Invalid file format. Only CSV statement files (.csv) are supported.", "error", 3000);
      return;
    }
    setIsStaging(true);
    try {
      const stageRes = await reconciliationService.stageImportBankStatement(importFile);
      setStagedData(stageRes);
      addNotification("Bank statement parsed and staged. Please review statistics.", "info", 2000);
    } catch (err) {
      addNotification(err?.response?.data?.detail || "Failed to parse bank statement CSV.", "error", 2500);
    } finally {
      setIsStaging(false);
    }
  };

  // Handle Bank CSV Confirm
  const handleConfirmBankCSV = async () => {
    if (!stagedData || !stagedData.stage_token) return;
    setIsConfirmingImport(true);
    try {
      const res = await reconciliationService.confirmImportBankStatement(stagedData.stage_token, selectedPeriod !== "ALL" ? selectedPeriod : null);
      addNotification(`Successfully imported ${res.imported} bank transaction(s) into period '${res.period_name}'.`, "success", 2500);
      setShowImportModal(false);
      setImportFile(null);
      setStagedData(null);
      refetch();
    } catch (err) {
      addNotification(err?.response?.data?.detail || "Import confirmation failed.", "error", 2500);
    } finally {
      setIsConfirmingImport(false);
    }
  };

  // Handle Priority Auto-Match Trigger
  const handleRunAutoMatch = async () => {
    setIsAutoMatching(true);
    setAutoMatchResult(null);
    try {
      const res = await reconciliationService.autoMatch(selectedPeriod);
      setAutoMatchResult(res);
      addNotification(`Priority Auto-Match complete: ${res.matched_count} transaction(s) matched.`, "success", 2500);
      refetch();
    } catch (err) {
      addNotification(err?.response?.data?.detail || "Auto-match failed.", "error", 2500);
    } finally {
      setIsAutoMatching(false);
    }
  };

  // Handle Manual Match Submit
  const handleManualMatchSubmit = async () => {
    if (!selectedBankTxn || !selectedLedgerTxnId) {
      addNotification("Please select a ledger transaction to match.", "error", 2000);
      return;
    }
    setIsSubmittingMatch(true);
    try {
      await reconciliationService.manualMatch(selectedBankTxn.id, selectedLedgerTxnId, matchNotes);
      addNotification("Manual match recorded successfully.", "success", 2000);
      setSelectedBankTxn(null);
      setSelectedLedgerTxnId("");
      setMatchNotes("");
      refetch();
    } catch (err) {
      addNotification(err?.response?.data?.detail || "Manual match failed.", "error", 2500);
    } finally {
      setIsSubmittingMatch(false);
    }
  };

  // Handle Unmatch
  const handleUnmatch = async (bankTxn) => {
    if (!window.confirm(`Unmatch bank transaction '${bankTxn.bank_txn_id}'?`)) return;
    try {
      await reconciliationService.unmatch(bankTxn.id, "Unmatched by user");
      addNotification("Transaction unmatched.", "info", 2000);
      refetch();
    } catch (err) {
      addNotification(err?.response?.data?.detail || "Unmatch failed.", "error", 2000);
    }
  };

  // Handle Open Journal Entry Modal
  const openJournalModal = (bankTxn) => {
    if (bankTxn.amount > (summary.journal_threshold || 10000)) {
      addNotification(`Journal entry fallback is only allowed for unmatched bank transactions below ₹${(summary.journal_threshold || 10000).toLocaleString()}.`, "error", 3000);
      return;
    }
    setJournalBankTxn(bankTxn);
    setJournalForm({
      debit_account: "Travel",
      credit_account: "Bank Account (HDFC)",
      amount: String(bankTxn.amount),
      narration: `Journal entry for bank transaction ${bankTxn.bank_txn_id}`,
    });
    setShowJournalModal(true);
  };

  // Handle Journal Entry Submit
  const handleJournalSubmit = async (e) => {
    e.preventDefault();
    if (!journalForm.narration.trim()) {
      addNotification("Narration is mandatory.", "error", 2000);
      return;
    }
    setIsSubmittingJournal(true);
    try {
      await reconciliationService.createJournalEntry({
        bank_transaction_id: journalBankTxn.id,
        debit_account: journalForm.debit_account,
        credit_account: journalForm.credit_account,
        amount: parseFloat(journalForm.amount),
        narration: journalForm.narration,
      });
      addNotification("Journal entry created and bank transaction closed.", "success", 2500);
      setShowJournalModal(false);
      setJournalBankTxn(null);
      refetch();
    } catch (err) {
      addNotification(err?.response?.data?.detail || "Failed to create journal entry.", "error", 2500);
    } finally {
      setIsSubmittingJournal(false);
    }
  };

  // Handle Confirm Period Batch
  const handleConfirmBatch = async () => {
    const periodName = selectedPeriod !== "ALL" ? selectedPeriod : periods[0]?.period_name;
    if (!periodName) {
      addNotification("Please select a specific reconciliation period to confirm.", "error", 2000);
      return;
    }
    if (!window.confirm(`Confirm reconciliation batch for period '${periodName}'?`)) return;
    try {
      await reconciliationService.confirmPeriod(periodName, "Confirmed by Admin");
      addNotification(`Period '${periodName}' confirmed successfully.`, "success", 2500);
      refetch();
    } catch (err) {
      addNotification(err?.response?.data?.detail || "Batch confirmation failed.", "error", 3000);
    }
  };

  // Handle Lock Period
  const handleLockPeriod = async () => {
    const periodName = selectedPeriod !== "ALL" ? selectedPeriod : periods[0]?.period_name;
    if (!periodName) {
      addNotification("Please select a specific reconciliation period to lock.", "error", 2000);
      return;
    }
    if (!window.confirm(`LOCK reconciliation period '${periodName}'? All matched bank transactions and general ledger records will become READ-ONLY.`)) return;
    try {
      await reconciliationService.lockPeriod(periodName, "Locked by Admin");
      addNotification(`Period '${periodName}' locked. All records are now read-only.`, "success", 2500);
      refetch();
    } catch (err) {
      addNotification(err?.response?.data?.detail || "Period locking failed.", "error", 3000);
    }
  };

  // Handle Unlock Period Submit
  const handleUnlockSubmit = async (e) => {
    e.preventDefault();
    if (!unlockReason.trim()) {
      addNotification("Reason for unlocking is mandatory.", "error", 2000);
      return;
    }
    setIsSubmittingUnlock(true);
    try {
      await reconciliationService.unlockPeriod(unlockPeriodName, unlockReason);
      addNotification(`Period '${unlockPeriodName}' unlocked successfully. Audit log generated.`, "success", 2500);
      setShowUnlockModal(false);
      setUnlockReason("");
      refetch();
    } catch (err) {
      addNotification(err?.response?.data?.detail || "Unlock failed.", "error", 2500);
    } finally {
      setIsSubmittingUnlock(false);
    }
  };

  // Handle Export CSV
  const handleExportCSV = async () => {
    try {
      const { blob, filename } = await reconciliationService.exportReconciliation(activeFilters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || "reconciliation_export.csv";
      link.click();
      URL.revokeObjectURL(url);
      addNotification("Reconciliation CSV exported.", "success", 2000);
    } catch (err) {
      addNotification("Failed to export reconciliation CSV.", "error", 2000);
    }
  };

  return (
    <main className="admin-page" style={{ background: "#f8fafc", padding: "24px", gap: "24px" }}>
      {/* 1. Page Header & Actions */}
      <section className="admin-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>
            ⚖️ Bank Reconciliation Workspace
          </h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>
            Bank Statement ↔ General Ledger Month-End Matching, Priority Engine, and Lock Verification.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              setImportFile(null);
              setStagedData(null);
              setShowImportModal(true);
            }}
            className="btn-primary"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Upload size={16} /> Import Bank Statement CSV
          </button>

          <button
            onClick={handleRunAutoMatch}
            disabled={isAutoMatching}
            className="btn-primary"
            style={{ background: "linear-gradient(135deg, #1d5cff, #0f46d8)", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Zap size={16} /> {isAutoMatching ? "Matching..." : "Run Priority Auto-Match"}
          </button>

          <button
            onClick={handleConfirmBatch}
            className="btn-secondary"
            style={{ background: "#ffffff", border: "1px solid #cbd5e1", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <CheckCircle2 size={16} color="#16a34a" /> Confirm Batch
          </button>

          <button
            onClick={handleLockPeriod}
            className="btn-secondary"
            style={{ background: "#0f172a", color: "#ffffff", border: "1px solid #0f172a", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Lock size={16} /> Lock Period
          </button>

          <button
            onClick={handleExportCSV}
            className="btn-secondary"
            style={{ background: "#ffffff", border: "1px solid #cbd5e1", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </section>

      {/* 2. Reconciliation Summary KPIs */}
      <section className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px" }}>
        <article className="stat-card" style={{ borderLeft: "4px solid #3b82f6", padding: "12px" }}>
          <span className="stat-label" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Imported</span>
          <strong className="stat-value" style={{ color: "#2563eb", fontSize: "20px" }}>{summary.imported || 0}</strong>
        </article>
        <article className="stat-card" style={{ borderLeft: "4px solid #f59e0b", padding: "12px" }}>
          <span className="stat-label" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Awaiting</span>
          <strong className="stat-value" style={{ color: "#d97706", fontSize: "20px" }}>{summary.awaiting_reconciliation || 0}</strong>
        </article>
        <article className="stat-card" style={{ borderLeft: "4px solid #10b981", padding: "12px" }}>
          <span className="stat-label" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Auto Matched</span>
          <strong className="stat-value" style={{ color: "#15803d", fontSize: "20px" }}>{summary.auto_matched || 0}</strong>
        </article>
        <article className="stat-card" style={{ borderLeft: "4px solid #06b6d4", padding: "12px" }}>
          <span className="stat-label" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Manually Matched</span>
          <strong className="stat-value" style={{ color: "#0891b2", fontSize: "20px" }}>{summary.manually_matched || 0}</strong>
        </article>
        <article className="stat-card" style={{ borderLeft: "4px solid #ef4444", padding: "12px" }}>
          <span className="stat-label" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Unmatched</span>
          <strong className="stat-value" style={{ color: "#dc2626", fontSize: "20px" }}>{summary.unmatched || 0}</strong>
        </article>
        <article className="stat-card" style={{ borderLeft: "4px solid #8b5cf6", padding: "12px" }}>
          <span className="stat-label" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Variances</span>
          <strong className="stat-value" style={{ color: "#7c3aed", fontSize: "20px" }}>{summary.variances || 0}</strong>
        </article>
        <article className="stat-card" style={{ borderLeft: "4px solid #ec4899", padding: "12px" }}>
          <span className="stat-label" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Journal Entries</span>
          <strong className="stat-value" style={{ color: "#db2777", fontSize: "20px" }}>{summary.journal_entries || 0}</strong>
        </article>
        <article className="stat-card" style={{ borderLeft: "4px solid #15803d", padding: "12px" }}>
          <span className="stat-label" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Confirmed</span>
          <strong className="stat-value" style={{ color: "#166534", fontSize: "20px" }}>{summary.confirmed || 0}</strong>
        </article>
        <article className="stat-card" style={{ borderLeft: "4px solid #0f172a", padding: "12px" }}>
          <span className="stat-label" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Locked</span>
          <strong className="stat-value" style={{ color: "#0f172a", fontSize: "20px" }}>{summary.locked || 0}</strong>
        </article>
      </section>

      {/* 3. Filters & Bank Statement Table */}
      <section className="admin-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <FileSpreadsheet size={18} /> Bank Statement Entries vs General Ledger
          </h2>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="filter-select"
              style={{ padding: "6px 12px", fontSize: "13px", fontWeight: "700", color: "#1d5cff" }}
            >
              <option value="ALL">All Periods</option>
              {periods.map((p) => (
                <option key={p.id} value={p.period_name}>
                  {p.period_name} ({p.status})
                </option>
              ))}
            </select>

            {periods.find((p) => p.period_name === selectedPeriod && p.status === "LOCKED") && (
              <button
                onClick={() => {
                  setUnlockPeriodName(selectedPeriod);
                  setShowUnlockModal(true);
                }}
                className="btn-sm"
                style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Unlock size={14} /> Unlock Period
              </button>
            )}
          </div>
        </div>

        {/* Filters Bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px", marginBottom: "16px", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search bank ID, description, ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            style={{ padding: "8px 12px", fontSize: "13px" }}
          />

          <select value={matchStatusFilter} onChange={(e) => setMatchStatusFilter(e.target.value)} className="filter-select" style={{ padding: "8px 12px", fontSize: "13px" }}>
            <option value="ALL">All Match Statuses</option>
            <option value="UNMATCHED">UNMATCHED</option>
            <option value="AUTO_MATCHED">AUTO_MATCHED</option>
            <option value="MANUALLY_MATCHED">MANUALLY_MATCHED</option>
            <option value="JOURNAL_ENTRY">JOURNAL_ENTRY</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="LOCKED">LOCKED</option>
          </select>
        </div>

        {/* Bank Transactions Table */}
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Bank Txn ID</th>
                <th>Date</th>
                <th>Description</th>
                <th>Reference</th>
                <th style={{ textAlign: "right" }}>Debit (₹)</th>
                <th style={{ textAlign: "right" }}>Credit (₹)</th>
                <th style={{ textAlign: "right" }}>Amount (₹)</th>
                <th>Match Status</th>
                <th>Match Priority / Confidence</th>
                <th>Linked Ledger Transaction</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan="11" style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                    <Loader2 className="animate-spin" style={{ margin: "0 auto 8px auto" }} /> Loading bank statement reconciliation workspace...
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan="11" style={{ padding: "20px", textAlign: "center", color: "#ef4444" }}>
                    Failed to load reconciliation workspace: {error?.message || "API Error"}
                  </td>
                </tr>
              )}

              {!isLoading && !isError && bankTransactions.length === 0 && (
                <tr>
                  <td colSpan="11" className="empty-state">
                    No bank statement transactions found for selected criteria. Upload a bank statement CSV to begin.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                bankTransactions.map((b) => {
                  const statusColors = {
                    UNMATCHED: { bg: "#fee2e2", color: "#dc2626" },
                    AUTO_MATCHED: { bg: "#dcfce7", color: "#15803d" },
                    MANUALLY_MATCHED: { bg: "#e0f2fe", color: "#0369a1" },
                    JOURNAL_ENTRY: { bg: "#fce7f3", color: "#be185d" },
                    CONFIRMED: { bg: "#dcfce7", color: "#166534" },
                    LOCKED: { bg: "#f1f5f9", color: "#334155" },
                  };
                  const stStyle = statusColors[b.match_status] || { bg: "#f1f5f9", color: "#475569" };

                  return (
                    <tr key={b.id} style={{ background: b.match_status === "LOCKED" ? "#f8fafc" : "#ffffff" }}>
                      <td style={{ fontFamily: "monospace", fontSize: "11px", fontWeight: "700" }}>{b.bank_txn_id}</td>
                      <td style={{ fontSize: "12px", whiteSpace: "nowrap" }}>{new Date(b.date).toLocaleDateString("en-IN")}</td>
                      <td style={{ fontSize: "13px", maxWidth: "200px" }}>{b.description}</td>
                      <td style={{ fontSize: "12px", color: "#64748b" }}>{b.reference_number || "-"}</td>
                      <td style={{ textAlign: "right", color: b.debit > 0 ? "#dc2626" : "#64748b", fontWeight: b.debit > 0 ? "700" : "normal" }}>
                        {b.debit > 0 ? formatCurrency(b.debit) : "-"}
                      </td>
                      <td style={{ textAlign: "right", color: b.credit > 0 ? "#16a34a" : "#64748b", fontWeight: b.credit > 0 ? "700" : "normal" }}>
                        {b.credit > 0 ? formatCurrency(b.credit) : "-"}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: "800" }}>{formatCurrency(b.amount)}</td>
                      <td>
                        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", background: stStyle.bg, color: stStyle.color }}>
                          {b.match_status}
                        </span>
                      </td>
                      <td>
                        {b.match_confidence ? (
                          <div style={{ fontSize: "11px" }}>
                            <span style={{ fontWeight: "700", color: "#1d5cff" }}>{b.match_confidence}</span>
                            {b.match_type && <span style={{ color: "#64748b", display: "block" }}>{b.match_type}</span>}
                          </div>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>-</span>
                        )}
                      </td>
                      <td>
                        {b.matched_transaction_id ? (
                          <div style={{ fontSize: "11px" }}>
                            <button
                              onClick={() => navigate("/admin/transactions")}
                              style={{ border: 0, background: "transparent", color: "#1d5cff", fontWeight: "700", cursor: "pointer", textDecoration: "underline" }}
                            >
                              Txn #{b.matched_transaction_id.substring(0, 8).toUpperCase()}
                            </button>
                            <span style={{ display: "block", color: "#475569" }}>{b.matched_transaction_desc}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>None</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {b.match_status !== "LOCKED" ? (
                          <div className="action-buttons" style={{ justifyContent: "flex-end" }}>
                            {b.match_status === "UNMATCHED" ? (
                              <>
                                <button onClick={() => setSelectedBankTxn(b)} className="btn-sm" style={{ background: "#eff6ff", color: "#1d5cff", border: "1px solid #bfdbfe" }}>
                                  Match
                                </button>
                                {b.amount <= (summary.journal_threshold || 10000) && (
                                  <button onClick={() => openJournalModal(b)} className="btn-sm" style={{ background: "#fdf2f8", color: "#db2777", border: "1px solid #fbcfe8" }}>
                                    + Journal
                                  </button>
                                )}
                              </>
                            ) : (
                              <button onClick={() => handleUnmatch(b)} className="btn-sm" style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" }}>
                                Unmatch
                              </button>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "2px" }}>
                            <Lock size={12} /> Read-only
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. BANK STATEMENT CSV IMPORT MODAL */}
      {showImportModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)", zIndex: 1000, display: "grid", placeItems: "center" }}>
          <div className="admin-card" style={{ width: "90%", maxWidth: "750px", padding: "24px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Import Bank Statement CSV (Staging & Deduplication)</h3>
              <button onClick={() => setShowImportModal(false)} style={{ border: 0, background: "transparent", cursor: "pointer", fontSize: "1.5rem", color: "#94a3b8" }}>&times;</button>
            </div>

            {!stagedData ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>
                  Upload a bank statement CSV file (`.csv`). The system will parse debits/credits, calculate totals, and check for duplicates before writing to the bank transaction ledger.
                </p>

                <div style={{ border: "2px dashed #cbd5e1", padding: "24px", borderRadius: "8px", textAlign: "center", background: "#f8fafc" }}>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setImportFile(f);
                    }}
                    style={{ marginBottom: "12px" }}
                  />
                  {importFile && (
                    <div style={{ fontSize: "12px", fontWeight: "700", color: importFile.name.toLowerCase().endsWith(".csv") ? "#10b981" : "#dc2626" }}>
                      Selected: {importFile.name}
                    </div>
                  )}
                </div>

                {importFile && !importFile.name.toLowerCase().endsWith(".csv") && (
                  <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "12px", borderRadius: "6px", fontSize: "13px", fontWeight: "600" }}>
                    ⚠️ Invalid file format: PDF files cannot be parsed as bank statements. Please upload a valid CSV file (.csv).
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      const csvData = `date,description,reference_number,debit,credit,amount,bank_txn_id\n2026-05-15,Air India Flight Booking Ref #9921,REF-9921,5000.00,0.00,5000.00,BANK-TXN-5000\n2026-05-18,Local Cab Taxi Fare Site Visit,REF-TAXI-001,2000.00,0.00,2000.00,BANK-TXN-2000\n2026-05-20,Office Stationery Equipment,REF-STAT-002,1500.00,0.00,1500.00,BANK-TXN-1500`;
                      const blob = new Blob([csvData], { type: "text/csv" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "sample_bank_statement.csv";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="btn-sm"
                    style={{ background: "#eff6ff", color: "#1d5cff", border: "1px solid #bfdbfe", padding: "6px 12px" }}
                  >
                    📄 Download Sample Bank CSV Template
                  </button>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => setShowImportModal(false)} className="btn-sm" style={{ background: "#cbd5e1", color: "#334155" }}>Cancel</button>
                    <button
                      onClick={handleStageBankCSV}
                      disabled={!importFile || !importFile.name.toLowerCase().endsWith(".csv") || isStaging}
                      className="btn-primary"
                      style={{ padding: "8px 20px", opacity: (!importFile || !importFile.name.toLowerCase().endsWith(".csv") || isStaging) ? 0.6 : 1 }}
                    >
                      {isStaging ? "Parsing..." : "Stage & Validate Statement"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Statement Staging Metrics */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
                  <div style={{ background: "#f1f5f9", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Total Rows</span>
                    <strong style={{ display: "block", fontSize: "16px" }}>{stagedData.total_rows}</strong>
                  </div>
                  <div style={{ background: "#fee2e2", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
                    <span style={{ fontSize: "11px", color: "#991b1b" }}>Total Debits</span>
                    <strong style={{ display: "block", fontSize: "14px", color: "#dc2626" }}>{formatCurrency(stagedData.total_debits)}</strong>
                  </div>
                  <div style={{ background: "#dcfce7", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
                    <span style={{ fontSize: "11px", color: "#166534" }}>Total Credits</span>
                    <strong style={{ display: "block", fontSize: "14px", color: "#15803d" }}>{formatCurrency(stagedData.total_credits)}</strong>
                  </div>
                  <div style={{ background: "#fef3c7", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
                    <span style={{ fontSize: "11px", color: "#92400e" }}>Duplicates</span>
                    <strong style={{ display: "block", fontSize: "16px", color: "#b45309" }}>{stagedData.duplicate_rows}</strong>
                  </div>
                  <div style={{ background: "#e0f2fe", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
                    <span style={{ fontSize: "11px", color: "#0369a1" }}>Date Range</span>
                    <strong style={{ display: "block", fontSize: "11px", color: "#0284c7" }}>{stagedData.date_range}</strong>
                  </div>
                </div>

                {/* Staging Preview Table */}
                <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
                  <table className="admin-table" style={{ fontSize: "12px" }}>
                    <thead>
                      <tr>
                        <th>Bank Txn ID</th>
                        <th>Date</th>
                        <th>Description</th>
                        <th style={{ textAlign: "right" }}>Debit</th>
                        <th style={{ textAlign: "right" }}>Credit</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stagedData.preview_rows.map((r) => (
                        <tr key={r.bank_txn_id} style={{ background: r.is_valid ? "#ffffff" : "#fff1f2" }}>
                          <td>{r.bank_txn_id}</td>
                          <td>{new Date(r.date).toLocaleDateString()}</td>
                          <td>{r.description}</td>
                          <td style={{ textAlign: "right", color: r.debit > 0 ? "#dc2626" : "#64748b" }}>{r.debit > 0 ? formatCurrency(r.debit) : "-"}</td>
                          <td style={{ textAlign: "right", color: r.credit > 0 ? "#16a34a" : "#64748b" }}>{r.credit > 0 ? formatCurrency(r.credit) : "-"}</td>
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

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button onClick={() => setStagedData(null)} className="btn-sm" style={{ background: "#cbd5e1", color: "#334155" }}>Back</button>
                  <button onClick={handleConfirmBankCSV} disabled={isConfirmingImport} className="btn-primary" style={{ padding: "8px 20px" }}>
                    {isConfirmingImport ? "Importing..." : "Confirm Bank Statement Import"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. MANUAL MATCH WORKSPACE MODAL */}
      {selectedBankTxn && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)", zIndex: 1000, display: "grid", placeItems: "center" }}>
          <div className="admin-card" style={{ width: "90%", maxWidth: "800px", padding: "24px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Manual Match Workspace</h3>
              <button onClick={() => setSelectedBankTxn(null)} style={{ border: 0, background: "transparent", cursor: "pointer", fontSize: "1.5rem", color: "#94a3b8" }}>&times;</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              {/* Left Side: Bank Transaction */}
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>Bank Statement Entry</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
                  <div><strong>Bank Txn ID:</strong> {selectedBankTxn.bank_txn_id}</div>
                  <div><strong>Date:</strong> {new Date(selectedBankTxn.date).toLocaleDateString()}</div>
                  <div><strong>Description:</strong> {selectedBankTxn.description}</div>
                  <div><strong>Reference:</strong> {selectedBankTxn.reference_number || "N/A"}</div>
                  <div><strong>Amount:</strong> <strong style={{ color: "#1d5cff", fontSize: "16px" }}>{formatCurrency(selectedBankTxn.amount)}</strong></div>
                </div>
              </div>

              {/* Right Side: Ledger Candidate Selection */}
              <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>Select General Ledger Candidate</h4>
                <select
                  value={selectedLedgerTxnId}
                  onChange={(e) => setSelectedLedgerTxnId(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", marginBottom: "12px" }}
                >
                  <option value="">-- Choose matching ledger transaction --</option>
                  {ledgerCandidates.map((cand) => (
                    <option key={cand.id} value={cand.id}>
                      ₹{cand.amount} | {cand.budget_line} | {cand.description} ({new Date(cand.date).toLocaleDateString()})
                    </option>
                  ))}
                </select>

                <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "4px" }}>Match Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="Optional audit notes..."
                  value={matchNotes}
                  onChange={(e) => setMatchNotes(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setSelectedBankTxn(null)} className="btn-sm" style={{ background: "#cbd5e1", color: "#334155" }}>Cancel</button>
              <button onClick={handleManualMatchSubmit} disabled={!selectedLedgerTxnId || isSubmittingMatch} className="btn-primary" style={{ padding: "8px 20px" }}>
                {isSubmittingMatch ? "Matching..." : "Confirm Manual Match"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. JOURNAL ENTRY FALLBACK MODAL */}
      {showJournalModal && journalBankTxn && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)", zIndex: 1000, display: "grid", placeItems: "center" }}>
          <div className="admin-card" style={{ width: "90%", maxWidth: "550px", padding: "24px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Journal Entry Fallback (Small Unbilled Expense)</h3>
              <button onClick={() => setShowJournalModal(false)} style={{ border: 0, background: "transparent", cursor: "pointer", fontSize: "1.5rem", color: "#94a3b8" }}>&times;</button>
            </div>

            <form onSubmit={handleJournalSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ background: "#fef3c7", padding: "10px", borderRadius: "6px", fontSize: "12px", color: "#92400e" }}>
                Closing unmatched bank transaction <strong>{journalBankTxn.bank_txn_id}</strong> (₹{journalBankTxn.amount}) via Journal Entry. Narration is mandatory.
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Debit Account / Expense Head *</label>
                <select
                  value={journalForm.debit_account}
                  onChange={(e) => setJournalForm({ ...journalForm, debit_account: e.target.value })}
                  required
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                >
                  <option value="Travel">Travel</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Bank Charges">Bank Charges</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Credit Account / Cash-Bank *</label>
                <input
                  type="text"
                  value={journalForm.credit_account}
                  onChange={(e) => setJournalForm({ ...journalForm, credit_account: e.target.value })}
                  required
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={journalForm.amount}
                  onChange={(e) => setJournalForm({ ...journalForm, amount: e.target.value })}
                  required
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Narration (Mandatory) *</label>
                <textarea
                  rows={3}
                  placeholder="Enter mandatory reason / narration for journal entry..."
                  value={journalForm.narration}
                  onChange={(e) => setJournalForm({ ...journalForm, narration: e.target.value })}
                  required
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowJournalModal(false)} className="btn-sm" style={{ background: "#cbd5e1", color: "#334155" }}>Cancel</button>
                <button type="submit" disabled={isSubmittingJournal} className="btn-primary" style={{ padding: "8px 20px" }}>
                  {isSubmittingJournal ? "Posting..." : "Post Journal Entry & Close Txn"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. UNLOCK PERIOD REASON MODAL */}
      {showUnlockModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)", zIndex: 1000, display: "grid", placeItems: "center" }}>
          <div className="admin-card" style={{ width: "90%", maxWidth: "500px", padding: "24px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Unlock Reconciliation Period</h3>
              <button onClick={() => setShowUnlockModal(false)} style={{ border: 0, background: "transparent", cursor: "pointer", fontSize: "1.5rem", color: "#94a3b8" }}>&times;</button>
            </div>

            <form onSubmit={handleUnlockSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ background: "#fee2e2", padding: "10px", borderRadius: "6px", fontSize: "12px", color: "#991b1b" }}>
                Unlocking period <strong>{unlockPeriodName}</strong> will restore read-write capability. Mandatory reason required for audit trail.
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Reason for Unlocking *</label>
                <textarea
                  rows={4}
                  placeholder="State explicit reason for unlocking period..."
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  required
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowUnlockModal(false)} className="btn-sm" style={{ background: "#cbd5e1", color: "#334155" }}>Cancel</button>
                <button type="submit" disabled={isSubmittingUnlock} className="btn-primary" style={{ background: "#dc2626", padding: "8px 20px" }}>
                  {isSubmittingUnlock ? "Unlocking..." : "Confirm & Log Unlock Action"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default AdminReconciliation;

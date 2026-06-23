import { useState, useMemo, useEffect } from "react";
import {
  Landmark,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  ArrowRightLeft,
  XCircle,
  HelpCircle,
  TrendingUp,
  Download,
  Link,
  Plus,
  Info
} from "lucide-react";
import { useNotification } from "../../common/hooks/useNotification";
import "./user-erp.css";

// Reusable Progress Bar Component
function ReconciliationProgressBar({ percentage }) {
  return (
    <div style={{ width: "100%", marginTop: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: "600", color: "#536987", marginBottom: "4px" }}>
        <span>Match Progress</span>
        <span>{percentage}%</span>
      </div>
      <div className="user-progress" style={{ margin: 0, height: "8px" }}>
        <span style={{ width: `${percentage}%`, background: "linear-gradient(90deg, #10b981, #1d5cff)" }} />
      </div>
    </div>
  );
}

export default function BankReconciliation() {
  const { addNotification } = useNotification();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  // Format Selector & Upload States
  const [selectedFormat, setSelectedFormat] = useState("CSV");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([
    { name: "bank_statement_may_2026.csv", size: "18.4 KB", date: "2026-05-30", status: "Reconciled" }
  ]);

  // Initial Bank Statement Entries (Mocked)
  const [statementEntries, setStatementEntries] = useState([
    { id: "ST-001", date: "2026-06-12", description: "GOOGLE ADS / MKTG SERVICE", amount: -15000, reconciled: true, matchedTxnId: "TXN-001", matchType: "Auto" },
    { id: "ST-002", date: "2026-06-11", description: "CATERING EXPS / WORKSHOP LUNCH", amount: -25000, reconciled: true, matchedTxnId: "TXN-002", matchType: "Auto" },
    { id: "ST-003", date: "2026-06-10", description: "CITY HALL AUDITORIUM DEP", amount: -50000, reconciled: true, matchedTxnId: "TXN-003", matchType: "Auto" },
    { id: "ST-004", date: "2026-06-08", description: "INDIGO AIRLINES FLT TICKETS", amount: -20000, reconciled: true, matchedTxnId: "TXN-004", matchType: "Auto" },
    { id: "ST-005", date: "2026-06-07", description: "STARBUCKS CAFE SNACKS", amount: -8000, reconciled: true, matchedTxnId: "TXN-005", matchType: "Auto" },
    { id: "ST-006", date: "2026-06-06", description: "STATIONERY ZONE CORP", amount: -5000, reconciled: true, matchedTxnId: "TXN-006", matchType: "Auto" },
    { id: "ST-007", date: "2026-06-05", description: "AV SOUND & LIGHT SYSTEMS", amount: -40000, reconciled: true, matchedTxnId: "TXN-007", matchType: "Auto" },
    { id: "ST-008", date: "2026-06-04", description: "PRINT FAST BROCHURES", amount: -10000, reconciled: false, matchedTxnId: null, matchType: null },
    { id: "ST-009", date: "2026-06-01", description: "META ADS / MKTG PROMO", amount: -10000, reconciled: false, matchedTxnId: null, matchType: null },
    { id: "ST-010", date: "2026-06-03", description: "MONTHLY BANK CHARGES", amount: -3000, reconciled: false, matchedTxnId: null, matchType: null }
  ]);

  // Initial ERP Book Transactions
  const [erpTransactions, setErpTransactions] = useState([
    { id: "TXN-001", date: "2026-06-12", category: "Marketing", description: "Digital ads campaign", amount: 15000, status: "Approved", reconciled: true },
    { id: "TXN-002", date: "2026-06-11", category: "Food & Refreshments", description: "Lunch catering for workshop", amount: 25000, status: "Approved", reconciled: true },
    { id: "TXN-003", date: "2026-06-10", category: "Venue", description: "Auditorium booking deposit", amount: 50000, status: "Approved", reconciled: true },
    { id: "TXN-004", date: "2026-06-08", category: "Travel", description: "Flight tickets for guest speaker", amount: 20000, status: "Approved", reconciled: true },
    { id: "TXN-005", date: "2026-06-07", category: "Food & Refreshments", description: "Coffee and snacks for panel", amount: 8000, status: "Approved", reconciled: true },
    { id: "TXN-006", date: "2026-06-06", category: "Miscellaneous", description: "Stationery and printing", amount: 5000, status: "Approved", reconciled: true },
    { id: "TXN-007", date: "2026-06-05", category: "Venue", description: "Audio-visual equipment rental", amount: 40000, status: "Approved", reconciled: true },
    { id: "TXN-008", date: "2026-06-04", category: "Marketing", description: "Brochure printing", amount: 10000, status: "Approved", reconciled: false },
    { id: "TXN-011", date: "2026-06-01", category: "Marketing", description: "Social media promotions", amount: 10000, status: "Approved", reconciled: false },
    { id: "TXN-009", date: "2026-06-03", category: "Travel", description: "Local taxi reimbursements", amount: 5000, status: "Pending", reconciled: false },
    { id: "TXN-010", date: "2026-06-02", category: "Food & Refreshments", description: "Dinner for organizing committee", amount: 10000, status: "Pending", reconciled: false }
  ]);

  // Interactive Match Modals State
  const [selectedStatementRow, setSelectedStatementRow] = useState(null);
  const [showManualMatchModal, setShowManualMatchModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [manualMatchId, setManualMatchId] = useState("");

  // Adjustment form states
  const [adjDescription, setAdjDescription] = useState("");
  const [adjCategory, setAdjCategory] = useState("Miscellaneous");

  // Summary Metrics calculations
  const totalReconciledAmount = useMemo(() => {
    return statementEntries
      .filter((s) => s.reconciled)
      .reduce((sum, s) => sum + Math.abs(s.amount), 0);
  }, [statementEntries]);

  const bankStatementTotal = useMemo(() => {
    return statementEntries.reduce((sum, s) => sum + Math.abs(s.amount), 0);
  }, [statementEntries]);

  const unreconciledDifference = useMemo(() => {
    const statementUnrec = statementEntries
      .filter((s) => !s.reconciled)
      .reduce((sum, s) => sum + Math.abs(s.amount), 0);
    return statementUnrec;
  }, [statementEntries]);

  const progressPercentage = useMemo(() => {
    const total = statementEntries.length;
    if (total === 0) return 0;
    const reconciledCount = statementEntries.filter((s) => s.reconciled).length;
    return Math.round((reconciledCount / total) * 100);
  }, [statementEntries]);

  // Handle Mock Statement Upload
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    simulateUpload("bank_statement_june_2026.csv");
  };

  const handleFileBrowseChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      simulateUpload(e.target.files[0].name);
    }
  };

  const simulateUpload = (fileName) => {
    setIsUploading(true);
    addNotification(`Uploading bank statement file: ${fileName}...`, "info", 1500, false);
    
    setTimeout(() => {
      setIsUploading(false);
      const newFile = {
        name: fileName,
        size: "24.5 KB",
        date: new Date().toISOString().slice(0, 10),
        status: "In Progress"
      };
      setUploadedFiles((prev) => [newFile, ...prev]);
      addNotification(`File "${fileName}" parsed and statement records populated successfully.`, "success", 3000, false);
    }, 1500);
  };

  // Perform Auto-Match operation
  const handleAutoMatch = () => {
    addNotification("Running smart matching algorithm...", "info", 1000, false);

    setTimeout(() => {
      let matchedCount = 0;
      const updatedEntries = statementEntries.map((entry) => {
        if (entry.reconciled) return entry;
        
        // Find perfect matches by Date and Amount similarity
        const absoluteAmount = Math.abs(entry.amount);
        const match = erpTransactions.find(
          (txn) => !txn.reconciled && txn.amount === absoluteAmount && txn.date === entry.date
        );

        if (match) {
          matchedCount++;
          // Mark ERP transaction reconciled
          setErpTransactions((prevTxns) =>
            prevTxns.map((t) => (t.id === match.id ? { ...t, reconciled: true } : t))
          );
          return {
            ...entry,
            reconciled: true,
            matchedTxnId: match.id,
            matchType: "Auto"
          };
        }
        return entry;
      });

      setStatementEntries(updatedEntries);
      if (matchedCount > 0) {
        addNotification(`Auto-matched ${matchedCount} transaction(s) successfully.`, "success", 3000, false);
      } else {
        addNotification("No additional auto-matches found. Use manual match for remaining entries.", "info", 3000, false);
      }
    }, 1000);
  };

  // Prepare manual matching modal
  const openManualMatch = (row) => {
    setSelectedStatementRow(row);
    // Find ERP transactions that are not reconciled and match in amount sign or value
    const matchVal = Math.abs(row.amount);
    const options = erpTransactions.filter((t) => !t.reconciled && t.amount === matchVal);
    
    if (options.length > 0) {
      setManualMatchId(options[0].id);
    } else {
      const allUnreconciled = erpTransactions.filter((t) => !t.reconciled);
      if (allUnreconciled.length > 0) {
        setManualMatchId(allUnreconciled[0].id);
      } else {
        setManualMatchId("");
      }
    }
    setShowManualMatchModal(true);
  };

  // Execute manual match
  const confirmManualMatch = () => {
    if (!manualMatchId || !selectedStatementRow) return;

    setStatementEntries((prevEntries) =>
      prevEntries.map((entry) =>
        entry.id === selectedStatementRow.id
          ? { ...entry, reconciled: true, matchedTxnId: manualMatchId, matchType: "Manual" }
          : entry
      )
    );

    setErpTransactions((prevTxns) =>
      prevTxns.map((txn) => (txn.id === manualMatchId ? { ...txn, reconciled: true } : txn))
    );

    addNotification(
      `Statement entry reconciled with ERP record ${manualMatchId} successfully.`,
      "success",
      3000,
      false
    );
    setShowManualMatchModal(false);
    setSelectedStatementRow(null);
  };

  // Prepare adjustments (record expense discrepancy)
  const openAdjustment = (row) => {
    setSelectedStatementRow(row);
    setAdjDescription(row.description);
    setAdjCategory("Miscellaneous");
    setShowAdjustmentModal(true);
  };

  // Record and reconcile discrepancy
  const recordAndReconcile = (e) => {
    e.preventDefault();
    if (!selectedStatementRow) return;

    const newTxnId = `TXN-${Math.floor(100 + Math.random() * 900)}`;
    const newTxn = {
      id: newTxnId,
      date: selectedStatementRow.date,
      category: adjCategory,
      description: adjDescription,
      amount: Math.abs(selectedStatementRow.amount),
      status: "Approved",
      reconciled: true
    };

    // Add to ERP transactions
    setErpTransactions((prev) => [newTxn, ...prev]);

    // Reconcile statement row
    setStatementEntries((prevEntries) =>
      prevEntries.map((entry) =>
        entry.id === selectedStatementRow.id
          ? { ...entry, reconciled: true, matchedTxnId: newTxnId, matchType: "Adjustment" }
          : entry
      )
    );

    addNotification(`Discrepancy recorded as new ERP expense (${newTxnId}) and reconciled.`, "success", 3000, false);
    setShowAdjustmentModal(false);
    setSelectedStatementRow(null);
  };

  // Export report
  const handleExport = (type) => {
    addNotification(`Preparing ${type} report for download...`, "info", 1500, false);
    setTimeout(() => {
      addNotification(`Reconciliation ${type} report downloaded successfully.`, "success", 3000, false);
    }, 1600);
  };

  // Unlink / Unreconcile transaction helper
  const handleUnlink = (entry) => {
    const txnId = entry.matchedTxnId;
    
    setStatementEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, reconciled: false, matchedTxnId: null, matchType: null } : e))
    );

    if (txnId) {
      setErpTransactions((prev) =>
        prev.map((t) => (t.id === txnId ? { ...t, reconciled: false } : t))
      );
    }

    addNotification("Linked match removed successfully. Item marked as unreconciled.", "info", 3000, false);
  };

  // Filtering criteria
  const filteredEntries = useMemo(() => {
    return statementEntries.filter((entry) => {
      const matchesSearch =
        entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Reconciled" && entry.reconciled) ||
        (statusFilter === "Unreconciled" && !entry.reconciled);

      return matchesSearch && matchesStatus;
    });
  }, [statementEntries, searchQuery, statusFilter]);

  // Unreconciled ERP transactions for manual selection
  const unmatchedErpTransactions = useMemo(() => {
    return erpTransactions.filter((t) => !t.reconciled);
  }, [erpTransactions]);

  return (
    <main className="user-erp-page">
      <div className="user-erp-shell">
        
        {/* Header section */}
        <header className="user-erp-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Landmark style={{ color: "#1d5cff" }} />
              Bank Reconciliation
            </h1>
            <p>Compare bank statements against ERP postings, track variances, and resolve differences.</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button className="user-secondary-button" type="button" onClick={() => handleExport("Excel")} style={{ display: "flex", alignItems: "center", gap: "8px", minHeight: "44px" }}>
              <FileSpreadsheet size={16} />
              Export Excel
            </button>
            <button className="user-primary-button" type="button" onClick={() => handleExport("PDF")} style={{ display: "flex", alignItems: "center", gap: "8px", minHeight: "44px", background: "linear-gradient(135deg, #1d5cff, #0f46d8)" }}>
              <FileText size={16} />
              Export PDF
            </button>
          </div>
        </header>

        {/* View-Only & Action Indicator Alert Banner */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f0fdf4", border: "1px solid #22c55e", borderRadius: "12px", padding: "16px 20px", color: "#15803d", fontSize: "0.95rem" }}>
          <Info size={20} strokeWidth={2} style={{ flexShrink: 0, color: "#16a34a" }} />
          <span>
            <strong>Interactive Workspace:</strong> Match uploaded bank statement records to ERP transaction logs. Unmatched fees can be recorded as new expenses to bring discrepancy to zero.
          </span>
        </div>

        {/* KPI Cards Grid */}
        <section className="user-stat-grid">
          
          <article className="user-erp-card user-stat-card">
            <div className="user-stat-icon" style={{ color: "#1d5cff", background: "#1d5cff15" }}>
              <Landmark size={26} />
            </div>
            <div>
              <p>Statement Total Spent</p>
              <strong>Rs {bankStatementTotal.toLocaleString("en-IN")}</strong>
              <span className="user-stat-note" style={{ color: "#536987" }}>Sum of statement debits</span>
            </div>
          </article>

          <article className="user-erp-card user-stat-card">
            <div className="user-stat-icon" style={{ color: "#10b981", background: "#10b98115" }}>
              <CheckCircle2 size={26} />
            </div>
            <div>
              <p>Reconciled in ERP</p>
              <strong>Rs {totalReconciledAmount.toLocaleString("en-IN")}</strong>
              <span className="user-stat-note" style={{ color: "#10b981", fontWeight: "600" }}>Matched to Book Ledgers</span>
            </div>
          </article>

          <article className="user-erp-card user-stat-card">
            <div className="user-stat-icon" style={{ color: unreconciledDifference > 0 ? "#ef4444" : "#10b981", background: unreconciledDifference > 0 ? "#ef444415" : "#10b98115" }}>
              {unreconciledDifference > 0 ? <AlertTriangle size={26} /> : <CheckCircle2 size={26} />}
            </div>
            <div>
              <p>Unreconciled Difference</p>
              <strong style={{ color: unreconciledDifference > 0 ? "#b91c1c" : "#087132" }}>
                Rs {unreconciledDifference.toLocaleString("en-IN")}
              </strong>
              <span className="user-stat-note" style={{ color: "#536987" }}>
                {unreconciledDifference > 0 ? "Variance to be matched" : "Fully Reconciled!"}
              </span>
            </div>
          </article>

          <article className="user-erp-card user-stat-card">
            <div className="user-stat-icon" style={{ color: "#7c3aed", background: "#7c3aed15" }}>
              <TrendingUp size={26} />
            </div>
            <div>
              <p>Reconciliation Rate</p>
              <strong>{progressPercentage}%</strong>
              <ReconciliationProgressBar percentage={progressPercentage} />
            </div>
          </article>

        </section>

        {/* Upload & Files Section */}
        <section className="user-dashboard-grid" style={{ gridTemplateColumns: "1.2fr 0.8fr" }}>
          
          {/* File Upload Box */}
          <article className="user-erp-card">
            <h2>Import Bank Statement</h2>
            <p style={{ margin: "4px 0 20px", color: "#536987", fontSize: "0.85rem" }}>
              Upload your bank statement files in structured formats to compare with ERP records.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px", alignItems: "center" }}>
              <div className="user-form-field">
                <span>Select File Format</span>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  style={{ padding: "10px 14px", height: "46px", cursor: "pointer" }}
                >
                  <option value="CSV">CSV format</option>
                  <option value="XLSX">Excel Spreadsheet</option>
                  <option value="MT940">MT940 Swift format</option>
                  <option value="OFX">OFX / QFX format</option>
                </select>
              </div>

              <div>
                <span>Drag & Drop File</span>
                <div
                  className="user-upload-box"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  style={{ minHeight: "100px", marginTop: "10px", borderColor: isUploading ? "#1d5cff" : "#d4d4d8" }}
                >
                  <input type="file" accept=".csv,.xlsx,.xls,.txt" onChange={handleFileBrowseChange} disabled={isUploading} />
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                    <UploadCloud size={28} style={{ color: isUploading ? "#1d5cff" : "#9ca3af" }} />
                    <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "#304761" }}>
                      {isUploading ? "Uploading & Parsing..." : "Click or drag statement file here"}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>Max size 15MB. Formats: CSV, Excel, TXT</span>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Upload History List */}
          <article className="user-erp-card">
            <h2>Statement Upload History</h2>
            <p style={{ margin: "4px 0 16px", color: "#536987", fontSize: "0.85rem" }}>Previous uploads for reconciliation cycles.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "140px", overflowY: "auto" }}>
              {uploadedFiles.map((file, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: "0.85rem", fontWeight: "600", color: "#1f3450", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      {file.name}
                    </h4>
                    <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{file.size} • Uploaded on {file.date}</span>
                  </div>
                  <span className={`user-status ${file.status === "Reconciled" ? "approved" : "pending"}`} style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                    {file.status}
                  </span>
                </div>
              ))}
            </div>
          </article>

        </section>

        {/* Reconciliation Center: Double Panel Workspace */}
        <section className="user-erp-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
            <div>
              <h2>Interactive Reconciliation Center</h2>
              <p style={{ margin: "4px 0 0", color: "#536987", fontSize: "0.85rem" }}>
                Match statement line items directly to ledger records. Reconciled entries lock in the matching ledger ID.
              </p>
            </div>
            
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                className="user-primary-button"
                type="button"
                onClick={handleAutoMatch}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", minHeight: "40px", background: "linear-gradient(135deg, #1d5cff, #0f46d8)", padding: "0 16px", fontSize: "0.88rem" }}
              >
                <RefreshCw size={14} />
                Run Auto-Match
              </button>
            </div>
          </div>

          {/* Interactive Filters Grid */}
          <div className="user-ticket-filters" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <div className="user-form-field">
              <span>Search Entries</span>
              <input
                type="text"
                placeholder="Search statement ID or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="user-search-input"
                style={{ padding: "8px 12px", height: "40px", fontSize: "0.9rem" }}
              />
            </div>
            <div className="user-form-field">
              <span>Status Filter</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: "8px 12px", height: "40px", cursor: "pointer", fontSize: "0.9rem" }}
              >
                <option value="All">All Statements</option>
                <option value="Reconciled">Reconciled only</option>
                <option value="Unreconciled">Unreconciled only</option>
              </select>
            </div>
          </div>

          {/* Reconciliation Table */}
          <div style={{ overflowX: "auto" }}>
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Statement Date</th>
                  <th>Description</th>
                  <th>Statement Amount</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                  <th>Linked ERP Match</th>
                  <th style={{ textAlign: "right" }}>Reconcile Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length > 0 ? (
                  filteredEntries.map((entry) => {
                    const absVal = Math.abs(entry.amount);
                    return (
                      <tr key={entry.id} style={{ background: entry.reconciled ? "#f0fdf450" : "transparent" }}>
                        <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#64748b" }}>{entry.id}</td>
                        <td style={{ fontSize: "0.9rem" }}>{entry.date}</td>
                        <td style={{ fontWeight: "600", color: "#1f3450", fontSize: "0.9rem" }}>
                          {entry.description}
                        </td>
                        <td style={{ fontWeight: "700", color: entry.amount < 0 ? "#b91c1c" : "#087132", fontSize: "0.9rem" }}>
                          {entry.amount < 0 ? "-" : "+"} Rs {absVal.toLocaleString("en-IN")}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className={`user-status ${entry.reconciled ? "approved" : "pending"}`} style={{ fontSize: "0.75rem", padding: "3px 10px" }}>
                            {entry.reconciled ? "Reconciled" : "Unmatched"}
                          </span>
                        </td>
                        <td>
                          {entry.reconciled ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "#1e293b", background: "#f1f5f9", padding: "4px 8px", borderRadius: "6px", width: "fit-content" }}>
                              <Link size={12} style={{ color: "#10b981" }} />
                              <span style={{ fontFamily: "monospace", fontWeight: "600" }}>{entry.matchedTxnId}</span>
                              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>({entry.matchType})</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.85rem", color: "#9ca3af", fontStyle: "italic" }}>No link</span>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {entry.reconciled ? (
                            <button
                              className="user-secondary-button"
                              type="button"
                              onClick={() => handleUnlink(entry)}
                              style={{ padding: "4px 10px", minHeight: "30px", fontSize: "0.75rem", color: "#ef4444", border: "1px solid #fecaca" }}
                            >
                              Unlink
                            </button>
                          ) : (
                            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                              <button
                                className="user-secondary-button"
                                type="button"
                                onClick={() => openManualMatch(entry)}
                                style={{ padding: "4px 10px", minHeight: "30px", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
                              >
                                <ArrowRightLeft size={12} />
                                Match
                              </button>
                              
                              {/* If monthly bank charges or unmatched discrepancy, allow adjustment creation */}
                              {entry.id === "ST-010" && (
                                <button
                                  className="user-primary-button"
                                  type="button"
                                  onClick={() => openAdjustment(entry)}
                                  style={{ padding: "4px 10px", minHeight: "30px", fontSize: "0.75rem", background: "linear-gradient(135deg, #10b981, #059669)", borderColor: "#10b981", display: "inline-flex", alignItems: "center", gap: "4px" }}
                                >
                                  <Plus size={12} />
                                  Adjust
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="user-empty-cell" style={{ padding: "48px 0", color: "#64748b" }}>
                      <AlertTriangle size={32} style={{ opacity: 0.3, marginBottom: "8px" }} />
                      <p style={{ margin: 0, fontWeight: "600" }}>No statement entries matching filters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {/* Manual Matching Selection Modal */}
      {showManualMatchModal && selectedStatementRow && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", zIndex: 1000, display: "grid", placeItems: "center" }}>
          <div className="user-erp-card" style={{ width: "90%", maxWidth: "500px", padding: "24px", transform: "none", border: "1px solid #cbd5e1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0 }}>Link Statement Row to ERP</h3>
              <button onClick={() => setShowManualMatchModal(false)} style={{ border: 0, background: "transparent", cursor: "pointer", fontSize: "1.2rem", color: "#94a3b8" }}>&times;</button>
            </div>
            
            <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>STATEMENT ENTRY DETAILS:</div>
              <strong style={{ display: "block", fontSize: "0.95rem", color: "#1e293b", margin: "4px 0" }}>{selectedStatementRow.description}</strong>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#475569" }}>
                <span>Date: {selectedStatementRow.date}</span>
                <span>Amount: <strong>Rs {Math.abs(selectedStatementRow.amount).toLocaleString("en-IN")}</strong></span>
              </div>
            </div>

            <div className="user-form-field" style={{ marginBottom: "20px" }}>
              <span>Select ERP Book Transaction</span>
              {unmatchedErpTransactions.length > 0 ? (
                <select
                  value={manualMatchId}
                  onChange={(e) => setManualMatchId(e.target.value)}
                  style={{ padding: "10px 14px", height: "46px", cursor: "pointer" }}
                >
                  {unmatchedErpTransactions.map((txn) => (
                    <option key={txn.id} value={txn.id}>
                      [{txn.id}] {txn.date} - {txn.description} (Rs {txn.amount.toLocaleString("en-IN")})
                    </option>
                  ))}
                </select>
              ) : (
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#ef4444", fontStyle: "italic" }}>
                  No unmatched ERP transactions found to link. Create an adjustment or import new records.
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button className="user-secondary-button" type="button" onClick={() => setShowManualMatchModal(false)} style={{ minHeight: "38px" }}>
                Cancel
              </button>
              <button
                className="user-primary-button"
                type="button"
                disabled={!manualMatchId}
                onClick={confirmManualMatch}
                style={{ minHeight: "38px", background: "linear-gradient(135deg, #1d5cff, #0f46d8)" }}
              >
                Confirm Link Match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discrepancy Adjustments Modal */}
      {showAdjustmentModal && selectedStatementRow && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", zIndex: 1000, display: "grid", placeItems: "center" }}>
          <div className="user-erp-card" style={{ width: "90%", maxWidth: "500px", padding: "24px", transform: "none", border: "1px solid #cbd5e1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0 }}>Record Discrepancy as Expense</h3>
              <button onClick={() => setShowAdjustmentModal(false)} style={{ border: 0, background: "transparent", cursor: "pointer", fontSize: "1.2rem", color: "#94a3b8" }}>&times;</button>
            </div>

            <div style={{ padding: "12px", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca", marginBottom: "16px", color: "#991b1b" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: "600" }}>UNMATCHED DISCREPANCY:</div>
              <strong style={{ display: "block", fontSize: "0.95rem", margin: "4px 0" }}>{selectedStatementRow.description}</strong>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span>Date: {selectedStatementRow.date}</span>
                <span>Amount: <strong>Rs {Math.abs(selectedStatementRow.amount).toLocaleString("en-IN")}</strong></span>
              </div>
            </div>

            <form onSubmit={recordAndReconcile} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="user-form-field">
                <span>Expense Description</span>
                <input
                  type="text"
                  required
                  value={adjDescription}
                  onChange={(e) => setAdjDescription(e.target.value)}
                  placeholder="e.g., Bank transaction fee June 2026"
                />
              </div>

              <div className="user-form-field">
                <span>Budget Category</span>
                <select value={adjCategory} onChange={(e) => setAdjCategory(e.target.value)} style={{ padding: "10px 14px", height: "46px" }}>
                  <option value="Miscellaneous">Miscellaneous</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Venue">Venue</option>
                  <option value="Food & Refreshments">Food & Refreshments</option>
                  <option value="Travel">Travel</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button className="user-secondary-button" type="button" onClick={() => setShowAdjustmentModal(false)} style={{ minHeight: "38px" }}>
                  Cancel
                </button>
                <button className="user-primary-button" type="submit" style={{ minHeight: "38px", background: "linear-gradient(135deg, #10b981, #059669)", borderColor: "#10b981" }}>
                  Record & Reconcile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}

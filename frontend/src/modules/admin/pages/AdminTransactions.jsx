import { useMemo, useState } from "react";
import { Download, Loader2, RefreshCw, Upload, X } from "lucide-react";
import { useQuery } from "react-query";
import { useAuth } from "../../common/hooks/useAuth";
import { adminTransactionService } from "../../../services/adminTransactionService";
import "../../../styles/admin-management.css";

const initialCreateForm = {
  budgetHead: "",
  amount: "",
  description: "",
};

const initialFilters = {
  search: "",
  status: "ALL",
  budgetHead: "",
  dateFrom: "",
  dateTo: "",
  createdBy: "",
};

function parseCsvPreview(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  const pushValue = () => {
    row.push(value);
    value = "";
  };

  const pushRow = () => {
    if (row.length > 0) {
      rows.push(row);
    }
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      pushValue();
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      pushValue();
      pushRow();
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    pushValue();
    pushRow();
  }

  if (rows.length === 0) {
    return { headers: [], records: [] };
  }

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const records = rows.slice(1).map((columns) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = (columns[index] ?? "").trim();
    });
    return record;
  });

  return { headers, records };
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function formatCurrency(amount) {
  const numericAmount = Number(amount || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

function AdminTransactions() {
  useAuth();

  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [filters, setFilters] = useState(initialFilters);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [importOpen, setImportOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewCount, setPreviewCount] = useState(0);
  const [previewError, setPreviewError] = useState("");
  const [importProgress, setImportProgress] = useState(0);
  const [importSummary, setImportSummary] = useState(null);
  const [importing, setImporting] = useState(false);

  const queryKey = useMemo(
    () => [
      "admin-transactions",
      filters.search,
      filters.status,
      filters.budgetHead,
      filters.dateFrom,
      filters.dateTo,
      filters.createdBy,
    ],
    [filters.search, filters.status, filters.budgetHead, filters.dateFrom, filters.dateTo, filters.createdBy]
  );

  const {
    data: transactions = [],
    isLoading,
    error: queryError,
    refetch,
  } = useQuery(queryKey, () => adminTransactionService.getTransactions(filters), {
    keepPreviousData: true,
  });

  const { data: budgetHeads = [] } = useQuery(
    ["admin-budget-heads"],
    () => adminTransactionService.getBudgetHeads(),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  const filteredCount = useMemo(() => transactions.length, [transactions]);

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTransaction = async () => {
    setMessage("");

    if (!createForm.budgetHead || !createForm.amount || !createForm.description) {
      setMessage("Please fill all required fields.");
      return;
    }

    setSaving(true);
    try {
      await adminTransactionService.createTransaction({
        budget_head: createForm.budgetHead,
        amount: Number(createForm.amount),
        description: createForm.description,
      });

      setCreateForm(initialCreateForm);
      await refetch();
      setMessage("Transaction created successfully.");
    } catch (error) {
      setMessage(error?.response?.data?.detail || error?.response?.data?.error || "Failed to create transaction");
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async (transactionId, action) => {
    setMessage("");
    try {
      await adminTransactionService.reviewTransaction({
        transaction_id: transactionId,
        action,
        remarks: null,
      });
      await refetch();
      setMessage(`Transaction ${action.toLowerCase()}d successfully.`);
    } catch (error) {
      setMessage(error?.response?.data?.detail || error?.response?.data?.error || "Failed to review transaction");
    }
  };

  const handleExport = async () => {
    setMessage("");
    try {
      const { blob, filename } = await adminTransactionService.exportTransactions(filters);
      const safeName = filename || `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
      downloadBlob(blob, safeName);
      setMessage("Export completed successfully.");
    } catch (error) {
      setMessage(error?.response?.data?.detail || error?.response?.data?.error || "Failed to export transactions");
    }
  };

  const openImportModal = () => {
    setImportOpen(true);
    setSelectedFile(null);
    setPreviewRows([]);
    setPreviewCount(0);
    setPreviewError("");
    setImportProgress(0);
    setImportSummary(null);
  };

  const closeImportModal = () => {
    if (importing) {
      return;
    }
    setImportOpen(false);
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setPreviewError("Please choose a valid .csv file.");
      setSelectedFile(null);
      setPreviewRows([]);
      setPreviewCount(0);
      return;
    }

    setPreviewError("");
    setSelectedFile(file);

    try {
      const text = await file.text();
      const parsed = parseCsvPreview(text);
      const preview = parsed.records.slice(0, 3).map((record) => ({
        budget_head: record.budget_head || "",
        amount: record.amount || "",
        description: record.description || "",
        date: record.date || "",
        status: record.status || "",
      }));

      setPreviewRows(preview);
      setPreviewCount(parsed.records.length);
    } catch {
      setPreviewError("Unable to read the CSV file.");
      setSelectedFile(null);
      setPreviewRows([]);
      setPreviewCount(0);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setPreviewError("Please choose a CSV file first.");
      return;
    }

    setImporting(true);
    setPreviewError("");
    setMessage("");

    try {
      const result = await adminTransactionService.importTransactions(selectedFile, setImportProgress);
      setImportSummary(result);
      await refetch();
      setMessage("Import completed successfully.");
    } catch (error) {
      setPreviewError(error?.response?.data?.detail || error?.response?.data?.error || "Failed to import transactions");
    } finally {
      setImporting(false);
    }
  };

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  return (
    <main className="admin-page">
      <section className="admin-header">
        <h1>Transactions Management</h1>
        <p>Admin-only transaction creation, review, CSV import, and filtered export.</p>
      </section>

      <section className="admin-card">
        <h2>Create New Transaction</h2>
        <div className="form-grid">
          <select name="budgetHead" value={createForm.budgetHead} onChange={handleCreateChange}>
            <option value="">{budgetHeads.length > 0 ? "Select Budget Head" : "No Budget Heads Available"}</option>
            {budgetHeads.map((head) => (
              <option key={head} value={head}>
                {head}
              </option>
            ))}
          </select>
          <input
            name="amount"
            type="number"
            min="0"
            step="0.01"
            value={createForm.amount}
            onChange={handleCreateChange}
            placeholder="Amount (₹)"
          />
          <input
            name="description"
            value={createForm.description}
            onChange={handleCreateChange}
            placeholder="Description"
          />
        </div>
        <div className="form-actions">
          <button onClick={handleCreateTransaction} className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "+ Create Transaction"}
          </button>
        </div>
      </section>

      <section className="admin-card">
        <div className="transactions-toolbar">
          <div className="transactions-toolbar-filters">
            <input
              type="text"
              name="search"
              placeholder="Search Transactions..."
              value={filters.search}
              onChange={handleFilterChange}
              className="search-input"
            />
            <select name="status" value={filters.status} onChange={handleFilterChange} className="filter-select">
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="REVISION_REQUESTED">Revision Requested</option>
            </select>
            <input
              type="text"
              name="budgetHead"
              placeholder="Budget Head"
              value={filters.budgetHead}
              onChange={handleFilterChange}
              className="search-input"
            />
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="filter-select"
            />
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="filter-select"
            />
            <input
              type="text"
              name="createdBy"
              placeholder="Created By"
              value={filters.createdBy}
              onChange={handleFilterChange}
              className="search-input"
            />
          </div>
          <div className="transactions-toolbar-actions">
            <button type="button" className="btn-sm" onClick={openImportModal}>
              <Upload size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
              Import CSV
            </button>
            <button type="button" className="btn-sm" onClick={handleExport}>
              <Download size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
              Export CSV
            </button>
            <button type="button" className="btn-sm" onClick={clearFilters}>
              <RefreshCw size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
              Reset
            </button>
          </div>
        </div>

        {message && <div className={`form-message ${message.toLowerCase().includes("failed") ? "error" : "success"}`}>{message}</div>}

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Budget Head</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Date</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="empty-state">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <Loader2 size={16} className="spin" /> Loading transactions...
                    </span>
                  </td>
                </tr>
              ) : queryError ? (
                <tr>
                  <td colSpan="9" className="empty-state">
                    {(queryError?.response?.data?.detail || queryError?.response?.data?.error || "Failed to load transactions")}
                  </td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map((txn) => {
                  const canReview = !["APPROVED", "REJECTED"].includes(String(txn.status || "").toUpperCase());
                  const txnDate = txn.date ? new Date(txn.date) : null;

                  return (
                    <tr key={txn.id}>
                      <td>{txn.id.slice(0, 8).toUpperCase()}</td>
                      <td>{txn.budget_head}</td>
                      <td>{formatCurrency(txn.amount)}</td>
                      <td>{txn.description}</td>
                      <td>{txnDate && !Number.isNaN(txnDate.getTime()) ? txnDate.toLocaleDateString() : "-"}</td>
                      <td>
                        <span className={`status-badge ${(txn.status || "").toLowerCase()}`}>{txn.status}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <strong>{txn.created_by_name || "-"}</strong>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>{txn.created_by_email || txn.created_by_role || ""}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge ${txn.source === "IMPORT" ? "admin" : ""}`}>{txn.source}</span>
                      </td>
                      <td>
                        {canReview ? (
                          <div className="action-buttons">
                            <button className="btn-sm" onClick={() => handleReview(txn.id, "APPROVE")}>
                              Approve
                            </button>
                            <button className="btn-sm danger" onClick={() => handleReview(txn.id, "REJECT")}>
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "13px" }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="empty-state">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-bar">
          <span>{filteredCount} transaction(s) loaded</span>
          <span>Admin only access for transaction CSV operations</span>
        </div>
      </section>

      {importOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0 }}>Import Transactions</h3>
              <button type="button" className="icon-close-button" onClick={closeImportModal} disabled={importing}>
                <X size={18} />
              </button>
            </div>

            <div className="config-grid">
              <label className="config-field">
                <span>Choose File</span>
                <input type="file" accept=".csv,text/csv" onChange={handleFileSelect} disabled={importing} />
              </label>
            </div>

            {selectedFile && (
              <div className="config-field">
                <span>Selected File</span>
                <strong>{selectedFile.name}</strong>
              </div>
            )}

            <div className="config-field">
              <span>Records Detected</span>
              <strong>{previewCount}</strong>
            </div>

            {previewError && <div className="form-message error">{previewError}</div>}

            {previewRows.length > 0 && (
              <div>
                <h4 style={{ marginBottom: "10px" }}>Preview</h4>
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Budget Head</th>
                        <th>Amount</th>
                        <th>Description</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, index) => (
                        <tr key={`${row.budget_head || "row"}-${index}`}>
                          <td>{row.budget_head || "-"}</td>
                          <td>{row.amount || "-"}</td>
                          <td>{row.description || "-"}</td>
                          <td>{row.date || "-"}</td>
                          <td>{row.status || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {importSummary && (
              <div className="config-field">
                <span>Import Summary</span>
                <div style={{ display: "grid", gap: "6px" }}>
                  <strong>Imported: {importSummary.imported}</strong>
                  <strong>Skipped: {importSummary.skipped}</strong>
                  <strong>Batch ID: {importSummary.batch_id}</strong>
                </div>
                {Array.isArray(importSummary.errors) && importSummary.errors.length > 0 && (
                  <div style={{ marginTop: "12px" }}>
                    <strong>Skipped Rows</strong>
                    <div style={{ display: "grid", gap: "6px", marginTop: "8px" }}>
                      {importSummary.errors.map((item) => (
                        <div key={`${item.row}-${item.reason}`} className="form-message error">
                          Row {item.row}: {item.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {importing && (
              <div className="config-field">
                <span>Upload Progress</span>
                <div className="progress-inline">
                  <div className="progress-track">
                    <div className="progress-fill healthy" style={{ width: `${importProgress}%` }} />
                  </div>
                  <strong>{importProgress}%</strong>
                </div>
              </div>
            )}

            <div className="form-actions" style={{ justifyContent: "flex-end", marginTop: "16px" }}>
              <button type="button" className="btn-secondary" onClick={closeImportModal} disabled={importing}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleImport} disabled={!selectedFile || importing}>
                {importing ? "Importing..." : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(15, 23, 42, 0.65)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  backdropFilter: "blur(4px)",
  padding: "16px",
};

const modalContentStyle = {
  backgroundColor: "white",
  padding: "24px",
  borderRadius: "12px",
  width: "min(960px, 100%)",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
  border: "1px solid #e2e8f0",
};

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "18px",
  paddingBottom: "10px",
  borderBottom: "1px solid #e2e8f0",
};

export default AdminTransactions;

import { useMemo, useState } from "react";
import { useAuth } from "../../common/hooks/useAuth";
import { transactionService } from "../../../services/transactionService";
import { FileText, Eye, History, Check, X, CornerDownRight } from "lucide-react";
import "../../../styles/admin-management.css";

function AdminTransactions() {
  const { user } = useAuth();
  const currentAdmin = user?.email || "admin@example.com";
  const currentAdminName = user?.name || "Admin";

  const [form, setForm] = useState({
    budgetHead: "",
    amount: "",
    description: "",
    date: "",
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL"); // ALL, MY, USER
  const [message, setMessage] = useState("");
  const [transactions, setTransactions] = useState(() => transactionService.getTransactions());

  const [selectedTxnId, setSelectedTxnId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [modalMode, setModalMode] = useState(""); // "", "APPROVE", "REJECT", "REVISION", "AUDIT", "BILL"
  const [viewBillName, setViewBillName] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const refreshTransactions = () => {
    setTransactions(transactionService.getTransactions());
  };

  const selectedTxn = useMemo(() => {
    return transactions.find(t => t.id === selectedTxnId) || null;
  }, [transactions, selectedTxnId]);

  const handleActionClick = (mode, txnId) => {
    setSelectedTxnId(txnId);
    setRemarks("");
    setModalMode(mode);
    setActionMessage("");
  };

  const submitAction = () => {
    if (!remarks.trim()) {
      setActionMessage("❌ Remarks are required for this action.");
      return;
    }

    if (modalMode === "APPROVE") {
      transactionService.approveTransaction(selectedTxnId, currentAdmin, remarks);
    } else if (modalMode === "REJECT") {
      transactionService.rejectTransaction(selectedTxnId, currentAdmin, remarks);
    } else if (modalMode === "REVISION") {
      transactionService.requestRevision(selectedTxnId, currentAdmin, remarks, "ADMIN");
    }

    refreshTransactions();
    setModalMode("");
    setSelectedTxnId("");
    setRemarks("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTransaction = () => {
    setMessage("");
    if (!form.budgetHead || !form.amount || !form.description) {
      setMessage("❌ Please fill all required fields");
      return;
    }

    const payload = {
      amount: form.amount,
      budgetHead: form.budgetHead,
      description: form.description,
      uploadedBills: ["admin_manual_invoice.pdf"]
    };

    transactionService.createTransaction(payload, currentAdmin, "ADMIN");
    refreshTransactions();
    setForm({ budgetHead: "", amount: "", description: "", date: "" });
    setMessage("✅ Transaction created successfully");
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const matchesSearch =
        txn.id.toLowerCase().includes(search.toLowerCase()) ||
        txn.budgetHead.toLowerCase().includes(search.toLowerCase()) ||
        txn.description.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "ALL" ? true : txn.status.toUpperCase() === statusFilter.toUpperCase();

      let matchesSource = true;
      if (sourceFilter === "MY") {
        matchesSource = txn.creatorRole === "ADMIN" || txn.transactionType === "ADMIN_CREATED";
      } else if (sourceFilter === "USER") {
        matchesSource = txn.creatorRole === "USER" || txn.transactionType === "USER_REQUEST";
      }

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [transactions, search, statusFilter, sourceFilter]);

  return (
    <main className="admin-page">
      <section className="admin-header">
        <h1>💳 Transactions Management</h1>
        <p>Create and search financial transactions across the enterprise</p>
      </section>

      {/* CREATE TRANSACTION */}
      <section className="admin-card">
        <h2>Create New Transaction</h2>
        <div className="form-grid">
          <select name="budgetHead" value={form.budgetHead} onChange={handleChange}>
            <option value="">Select Budget Head</option>
            <option value="Venue">Venue</option>
            <option value="Food & Refreshments">Food & Refreshments</option>
            <option value="Marketing">Marketing</option>
            <option value="Travel">Travel</option>
            <option value="Equipment">Equipment</option>
            <option value="Training">Training</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Miscellaneous">Miscellaneous</option>
          </select>
          <input
            name="amount"
            type="number"
            value={form.amount}
            onChange={handleChange}
            placeholder="Amount (₹)"
          />
          <input
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
          />
        </div>
        <div className="form-actions">
          <button onClick={handleCreateTransaction} className="btn-primary">
            + Create Transaction
          </button>
        </div>
        {message && <div className={`form-message ${message.includes("✅") ? "success" : "error"}`}>{message}</div>}
      </section>

      {/* TRANSACTIONS TABLE */}
      <section className="admin-card">
        <div className="tab-nav" style={{ marginBottom: "20px" }}>
          <button
            type="button"
            className={`tab-chip ${sourceFilter === "ALL" ? "active" : ""}`}
            onClick={() => setSourceFilter("ALL")}
          >
            All Transactions
          </button>
          <button
            type="button"
            className={`tab-chip ${sourceFilter === "MY" ? "active" : ""}`}
            onClick={() => setSourceFilter("MY")}
          >
            My Transactions (Admin)
          </button>
          <button
            type="button"
            className={`tab-chip ${sourceFilter === "USER" ? "active" : ""}`}
            onClick={() => setSourceFilter("USER")}
          >
            User Transactions
          </button>
        </div>

        <div className="table-header">
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="ADMIN_APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="REVISION_REQUESTED">Revision Requested</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Budget Head</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Created By</th>
                <th>Source</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((txn) => (
                  <tr key={txn.id}>
                    <td style={{ fontWeight: "600" }}>{txn.id}</td>
                    <td>{txn.budgetHead}</td>
                    <td>₹{txn.amount.toLocaleString("en-IN")}</td>
                    <td>{txn.description}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: "500" }}>{txn.createdBy}</span>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>{txn.creatorRole}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "600",
                          backgroundColor: txn.transactionType === "ADMIN_CREATED" ? "#f3e8ff" : "#e0f2fe",
                          color: txn.transactionType === "ADMIN_CREATED" ? "#6b21a8" : "#0369a1",
                        }}
                      >
                        {txn.transactionType || (txn.creatorRole === "ADMIN" ? "ADMIN_CREATED" : "USER_REQUEST")}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${txn.status.toLowerCase().replace("_", "")}`}>
                        {txn.status === "ADMIN_APPROVED" ? "Approved" :
                         txn.status === "ADMIN_REJECTED" || txn.status === "REJECTED" ? "Rejected" :
                         txn.status === "REVISION_REQUESTED" || txn.status === "ADMIN_REVISION_REQUESTED" ? "Revision Requested" :
                         txn.status === "SUBMITTED" ? "Submitted" :
                         txn.status === "DRAFT" ? "Draft" :
                         txn.status === "PENDING" ? "Pending" :
                         txn.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>{txn.createdAt ? new Date(txn.createdAt).toLocaleDateString() : "-"}</td>
                    <td style={{ textAlign: "right" }}>
                      <div className="action-buttons" style={{ justifyContent: "flex-end" }}>
                        <button
                          className="btn-sm"
                          onClick={() => handleActionClick("DETAILS_MODAL", txn.id)}
                          title="View Details"
                        >
                          <Eye size={12} style={{ marginRight: "2px", verticalAlign: "middle" }} /> Details
                        </button>
                        {txn.creatorRole === "USER" && (txn.status === "SUBMITTED" || txn.status === "PENDING" || txn.status === "UNDER_REVIEW") && (
                          <>
                            <button
                              className="btn-sm"
                              style={{ borderColor: "#16a34a", color: "#16a34a" }}
                              onClick={() => handleActionClick("APPROVE", txn.id)}
                            >
                              Approve
                            </button>
                            <button
                              className="btn-sm danger"
                              onClick={() => handleActionClick("REJECT", txn.id)}
                            >
                              Reject
                            </button>
                            <button
                              className="btn-sm"
                              style={{ borderColor: "#d97706", color: "#d97706" }}
                              onClick={() => handleActionClick("REVISION", txn.id)}
                            >
                              Revision
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
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
      </section>

      {/* DETAILS MODAL */}
      {modalMode === "DETAILS_MODAL" && selectedTxn && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: "550px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
              <h3 style={{ margin: 0 }}>Transaction Details - {selectedTxn.id}</h3>
              <button style={{ border: "none", background: "none", cursor: "pointer", fontSize: "18px", color: "#94a3b8" }} onClick={() => setModalMode("")}>✕</button>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <span>Amount</span>
                <strong style={{ fontSize: "1.2rem", color: "#0f5aff" }}>
                  ₹{selectedTxn.amount.toLocaleString("en-IN")}
                </strong>
              </div>
              <div className="detail-item">
                <span>Budget Head</span>
                <strong>{selectedTxn.budgetHead}</strong>
              </div>
              <div className="detail-item">
                <span>Created By</span>
                <strong>{selectedTxn.createdBy} ({selectedTxn.creatorRole})</strong>
              </div>
              <div className="detail-item">
                <span>Created Date</span>
                <strong>{new Date(selectedTxn.createdAt).toLocaleString()}</strong>
              </div>
              <div className="detail-item detail-item-wide">
                <span>Description</span>
                <strong>{selectedTxn.description}</strong>
              </div>
              {selectedTxn.adminRemarks && (
                <div className="detail-item detail-item-wide" style={{ borderLeft: "4px solid #0f5aff", background: "#eff6ff" }}>
                  <span style={{ color: "#1d4ed8" }}>Admin Remarks</span>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>{selectedTxn.adminRemarks}</p>
                  {selectedTxn.approvedBy && <small style={{ color: "#64748b" }}>Processed by: {selectedTxn.approvedBy}</small>}
                </div>
              )}
            </div>

            <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
              <button
                className="btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
                onClick={() => setModalMode("BILL")}
              >
                <FileText size={16} /> View Bills
              </button>
              <button
                className="btn-secondary"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
                onClick={() => setModalMode("AUDIT")}
              >
                <History size={16} /> Audit Trail ({selectedTxn.auditTrail?.length || 0})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION REMARKS MODAL */}
      {(modalMode === "APPROVE" || modalMode === "REJECT" || modalMode === "REVISION") && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3>Confirm {modalMode === "APPROVE" ? "Approval" : modalMode === "REJECT" ? "Rejection" : "Revision Request"}</h3>
            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
              Please enter detailed remarks below. Remarks are **required** to process this action.
            </p>
            <textarea
              style={textareaStyle}
              placeholder="Enter remarks..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={4}
            />
            {actionMessage && <p style={{ color: "#ef4444", fontSize: "12px", margin: "8px 0" }}>{actionMessage}</p>}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "16px" }}>
              <button className="btn-secondary" onClick={() => setModalMode("")}>Cancel</button>
              <button
                className="btn-primary"
                style={{
                  backgroundColor: modalMode === "APPROVE" ? "#16a34a" : modalMode === "REJECT" ? "#ef4444" : "#d97706"
                }}
                onClick={submitAction}
              >
                Submit {modalMode === "APPROVE" ? "Approve" : modalMode === "REJECT" ? "Reject" : "Request Revision"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT TRAIL MODAL */}
      {modalMode === "AUDIT" && selectedTxn && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: "600px" }}>
            <h3>Audit Trail - {selectedTxn.id}</h3>
            <div style={{ maxHeight: "350px", overflowY: "auto", margin: "16px 0", paddingRight: "8px" }}>
              {selectedTxn.auditTrail && selectedTxn.auditTrail.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {selectedTxn.auditTrail.map((entry, idx) => (
                    <div key={idx} style={auditItemStyle}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <strong style={{ fontSize: "13px" }}>{entry.action}</strong>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#475569" }}>
                        By: <strong>{entry.user}</strong> ({entry.role})
                      </div>
                      {entry.remarks && (
                        <div style={auditRemarksBoxStyle}>
                          <CornerDownRight size={12} style={{ marginRight: "4px", color: "#64748b" }} />
                          <span>Remarks: {entry.remarks}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: "center", color: "#94a3b8" }}>No audit log found</p>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={() => setModalMode("DETAILS_MODAL")}>Back</button>
            </div>
          </div>
        </div>
      )}

      {/* ATTACHED BILLS MODAL */}
      {modalMode === "BILL" && selectedTxn && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: "600px" }}>
            <h3>Attached Bills - {selectedTxn.id}</h3>
            <div style={{ margin: "16px 0" }}>
              <p style={{ fontSize: "13px", color: "#64748b" }}>Select a document below to view invoice details:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                {(selectedTxn.uploadedBills || ["invoice_receipt.pdf"]).map((bill, idx) => (
                  <div key={idx} style={billRowStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FileText size={18} style={{ color: "#0f5aff" }} />
                      <span style={{ fontSize: "13px", fontWeight: "600" }}>{bill}</span>
                    </div>
                    <button
                      className="btn-sm"
                      onClick={() => setViewBillName(bill)}
                    >
                      Inspect File
                    </button>
                  </div>
                ))}
              </div>

              {viewBillName && (
                <div style={billInspectBoxStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>
                    <strong style={{ fontSize: "12px", color: "#334155" }}>File Preview: {viewBillName}</strong>
                    <button style={{ border: "none", background: "none", color: "#94a3b8", cursor: "pointer" }} onClick={() => setViewBillName("")}><X size={14} /></button>
                  </div>
                  <div style={{ padding: "12px", background: "white", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                      <span><strong>Invoice No:</strong> INV-{selectedTxn.id.replace("TXN-", "")}-093</span>
                      <span><strong>Date:</strong> {selectedTxn.createdAt ? selectedTxn.createdAt.split("T")[0] : "N/A"}</span>
                    </div>
                    <div style={{ fontSize: "12px", marginBottom: "6px" }}>
                      <strong>Vendor:</strong> Enterprise Logistics & Services Ltd.
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "700", borderTop: "1px solid #f1f5f9", paddingTop: "6px", marginTop: "6px", color: "#0f5aff" }}>
                      <span>Grand Total:</span>
                      <span>₹{selectedTxn.amount.toLocaleString("en-IN")}</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#22c55e", marginTop: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Check size={12} /> Digital Signature Verified (SHA256 checksum OK)
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={() => { setModalMode("DETAILS_MODAL"); setViewBillName(""); }}>Back</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// Inline Styles for Modal
const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(15, 23, 42, 0.65)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  backdropFilter: "blur(4px)"
};

const modalContentStyle = {
  backgroundColor: "white",
  padding: "24px",
  borderRadius: "12px",
  width: "90%",
  maxWidth: "450px",
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
  border: "1px solid #e2e8f0"
};

const textareaStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  fontFamily: "inherit",
  fontSize: "14px",
  resize: "vertical"
};

const auditItemStyle = {
  padding: "12px",
  borderRadius: "8px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0"
};

const auditRemarksBoxStyle = {
  display: "flex",
  alignItems: "center",
  marginTop: "6px",
  padding: "6px 8px",
  background: "#f1f5f9",
  borderRadius: "6px",
  fontSize: "11px",
  color: "#475569"
};

const billRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 12px",
  background: "#f8fafc",
  borderRadius: "8px",
  border: "1px solid #e2e8f0"
};

const billInspectBoxStyle = {
  marginTop: "16px",
  padding: "12px",
  background: "#f1f5f9",
  borderRadius: "8px",
  border: "1px solid #cbd5e1"
};

export default AdminTransactions;

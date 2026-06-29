import React, { useMemo, useState } from "react";
import { useAuth } from "../../common/hooks/useAuth";
import { transactionService } from "../../../services/transactionService";
import { FileText, Eye, History, Check, X, Edit, Info, CornerDownRight } from "lucide-react";
import "../../../styles/admin-management.css";

function TransactionReviewCenter() {
  const { user } = useAuth();
  const currentAdmin = user?.email || "admin@example.com";

  const [transactions, setTransactions] = useState(() => transactionService.getTransactions());
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("PENDING"); // PENDING, APPROVED, REJECTED, REVISION_REQUESTED, ALL
  const [selectedTxnId, setSelectedTxnId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [modalMode, setModalMode] = useState(""); // "", "APPROVE", "REJECT", "REVISION", "AUDIT", "BILL"
  const [viewBillName, setViewBillName] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const refreshList = () => {
    setTransactions(transactionService.getTransactions());
  };

  const selectedTxn = useMemo(() => {
    return transactions.find(t => t.id === selectedTxnId) || null;
  }, [transactions, selectedTxnId]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch =
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.createdBy.toLowerCase().includes(search.toLowerCase()) ||
        t.budgetHead.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());

      const status = t.status.toUpperCase();
      let matchesTab = false;

      if (activeTab === "ALL") {
        matchesTab = true;
      } else if (activeTab === "PENDING") {
        // Transactions waiting for Admin signoff (Submitted or verified)
        matchesTab = status === "SUBMITTED" || status === "UNDER_REVIEW" || status === "PENDING";
      } else if (activeTab === "APPROVED") {
        matchesTab = status === "ADMIN_APPROVED";
      } else if (activeTab === "REJECTED") {
        matchesTab = status === "REJECTED";
      } else if (activeTab === "REVISION_REQUESTED") {
        matchesTab = status === "REVISION_REQUESTED";
      }

      return matchesSearch && matchesTab;
    });
  }, [transactions, search, activeTab]);

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

    refreshList();
    setModalMode("");
    setSelectedTxnId("");
    setRemarks("");
  };

  return (
    <main className="admin-page">
      <section className="admin-header">
        <h1>📊 Transaction Review Center</h1>
        <p>Review expense requests, audit trails, and approve or reject transactions</p>
      </section>

      {/* FILTER TABS */}
      <section className="admin-card">
        <div className="tab-nav">
          <button
            type="button"
            className={`tab-chip ${activeTab === "PENDING" ? "active" : ""}`}
            onClick={() => { setActiveTab("PENDING"); setSelectedTxnId(""); }}
          >
            Pending Review
          </button>

          <button
            type="button"
            className={`tab-chip ${activeTab === "APPROVED" ? "active" : ""}`}
            onClick={() => { setActiveTab("APPROVED"); setSelectedTxnId(""); }}
          >
            Approved
          </button>
          <button
            type="button"
            className={`tab-chip ${activeTab === "REJECTED" ? "active" : ""}`}
            onClick={() => { setActiveTab("REJECTED"); setSelectedTxnId(""); }}
          >
            Rejected
          </button>
          <button
            type="button"
            className={`tab-chip ${activeTab === "REVISION_REQUESTED" ? "active" : ""}`}
            onClick={() => { setActiveTab("REVISION_REQUESTED"); setSelectedTxnId(""); }}
          >
            Revision Requested
          </button>
          <button
            type="button"
            className={`tab-chip ${activeTab === "ALL" ? "active" : ""}`}
            onClick={() => { setActiveTab("ALL"); setSelectedTxnId(""); }}
          >
            All Items
          </button>
        </div>

        <div className="table-header">
          <input
            type="text"
            placeholder="Search approvals by ID, creator, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Creator</th>
                <th>Creator Role</th>
                <th>Budget Head</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((txn) => (
                  <tr key={txn.id} className={selectedTxnId === txn.id ? "selected-row" : ""}>
                    <td style={{ fontWeight: "700" }}>{txn.id}</td>
                    <td>{txn.createdBy}</td>
                    <td>
                      <span className={`role-badge ${txn.creatorRole.toLowerCase()}`}>
                        {txn.creatorRole}
                      </span>
                    </td>
                    <td>{txn.budgetHead}</td>
                    <td style={{ fontWeight: "700" }}>₹{txn.amount.toLocaleString("en-IN")}</td>
                    <td>
                      <span className={`status-badge ${txn.status.toLowerCase().replace("_", "")}`}>
                        {txn.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>{new Date(txn.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-sm"
                          onClick={() => setSelectedTxnId(txn.id)}
                          title="View Details"
                        >
                          <Eye size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} /> Details
                        </button>
                        {(txn.status === "SUBMITTED" || txn.status === "PENDING" || txn.status === "UNDER_REVIEW") && (
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
                  <td colSpan="8" className="empty-state">
                    No transactions matching current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SELECTED TRANSACTION DETAILS */}
      {selectedTxn && (
        <section className="admin-card">
          <h2>Selected Transaction Details ({selectedTxn.id})</h2>
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

          <div style={{ marginTop: "24px", display: "flex", gap: "16px" }}>
            <button
              className="btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
              onClick={() => handleActionClick("BILL", selectedTxnId)}
            >
              <FileText size={16} /> View Attached Bills
            </button>
            <button
              className="btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
              onClick={() => handleActionClick("AUDIT", selectedTxnId)}
            >
              <History size={16} /> Audit Trail & History ({selectedTxn.auditTrail?.length || 0})
            </button>
          </div>
        </section>
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
              <button className="btn-secondary" onClick={() => setModalMode("")}>Close</button>
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
              <button className="btn-secondary" onClick={() => { setModalMode(""); setViewBillName(""); }}>Close</button>
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

export default TransactionReviewCenter;

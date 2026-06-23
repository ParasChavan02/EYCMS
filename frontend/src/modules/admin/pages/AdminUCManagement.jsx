import React, { useMemo, useState } from "react";
import { useAuth } from "../../common/hooks/useAuth";
import { ucService } from "../../../services/ucService";
import { FileText, Eye, History, Check, X, Info, Download, CornerDownRight, Plus } from "lucide-react";
import "../../../styles/admin-management.css";

function AdminUCManagement() {
  const { user } = useAuth();
  const currentAdmin = user?.email || "admin@example.com";

  const [requests, setRequests] = useState(() => ucService.getUCRequests());
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("PENDING"); // ALL, PENDING, FINANCE_VERIFIED, APPROVED, REJECTED
  const [selectedReqId, setSelectedReqId] = useState("");
  const [modalMode, setModalMode] = useState(""); // "", "GRANT", "APPROVE", "REJECT", "REVISION", "AUDIT"
  
  // Grant Template Form State
  const [templateName, setTemplateName] = useState("UC_Template_Format_2026.docx");
  const [instructions, setInstructions] = useState("");
  
  // Remarks State
  const [remarks, setRemarks] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const refreshList = () => {
    setRequests(ucService.getUCRequests());
  };

  const selectedReq = useMemo(() => {
    return requests.find(r => r.id === selectedReqId) || null;
  }, [requests, selectedReqId]);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchesSearch =
        r.id.toLowerCase().includes(search.toLowerCase()) ||
        r.requestedBy.toLowerCase().includes(search.toLowerCase());

      const status = r.status.toUpperCase();
      let matchesTab = false;

      if (activeTab === "ALL") {
        matchesTab = true;
      } else if (activeTab === "PENDING") {
        matchesTab = status === "REQUESTED" || status === "UC_SUBMITTED";
      } else if (activeTab === "FINANCE_VERIFIED") {
        matchesTab = status === "FINANCE_VERIFIED";
      } else if (activeTab === "APPROVED") {
        matchesTab = status === "ADMIN_APPROVED";
      } else if (activeTab === "REJECTED") {
        matchesTab = status === "REJECTED";
      }

      return matchesSearch && matchesTab;
    });
  }, [requests, search, activeTab]);

  const handleActionClick = (mode, reqId) => {
    setSelectedReqId(reqId);
    setRemarks("");
    setActionMessage("");
    setModalMode(mode);

    if (mode === "GRANT") {
      setTemplateName("UC_Template_Format_2026.docx");
      setInstructions("Please fill sections A & B, sign with official seal, and upload in PDF format along with supporting bills.");
    }
  };

  const handleGrantSubmit = () => {
    if (!templateName.trim() || !instructions.trim()) {
      setActionMessage("❌ Template Name and Instructions are required.");
      return;
    }
    ucService.grantTemplate(selectedReqId, templateName, instructions, currentAdmin);
    refreshList();
    setModalMode("");
    setSelectedReqId("");
  };

  const handleActionSubmit = () => {
    if (!remarks.trim()) {
      setActionMessage("❌ Remarks are required for this action.");
      return;
    }

    if (modalMode === "APPROVE") {
      ucService.approveUC(selectedReqId, currentAdmin, remarks);
    } else if (modalMode === "REJECT") {
      ucService.rejectUC(selectedReqId, currentAdmin, remarks);
    } else if (modalMode === "REVISION") {
      ucService.requestUCRevision(selectedReqId, currentAdmin, remarks, "ADMIN");
    }

    refreshList();
    setModalMode("");
    setSelectedReqId("");
    setRemarks("");
  };

  return (
    <main className="admin-page">
      <section className="admin-header">
        <h1>📜 UC Management Center</h1>
        <p>Manage project Utilization Certificates, grant templates, and verify submitted certificates</p>
      </section>

      {/* FILTER TABS */}
      <section className="admin-card">
        <div className="tab-nav">
          <button
            type="button"
            className={`tab-chip ${activeTab === "PENDING" ? "active" : ""}`}
            onClick={() => { setActiveTab("PENDING"); setSelectedReqId(""); }}
          >
            Pending Requests ({requests.filter(r => r.status === "REQUESTED" || r.status === "UC_SUBMITTED").length})
          </button>
          <button
            type="button"
            className={`tab-chip ${activeTab === "FINANCE_VERIFIED" ? "active" : ""}`}
            onClick={() => { setActiveTab("FINANCE_VERIFIED"); setSelectedReqId(""); }}
          >
            Finance Verified ({requests.filter(r => r.status === "FINANCE_VERIFIED").length})
          </button>
          <button
            type="button"
            className={`tab-chip ${activeTab === "APPROVED" ? "active" : ""}`}
            onClick={() => { setActiveTab("APPROVED"); setSelectedReqId(""); }}
          >
            Approved ({requests.filter(r => r.status === "ADMIN_APPROVED").length})
          </button>
          <button
            type="button"
            className={`tab-chip ${activeTab === "REJECTED" ? "active" : ""}`}
            onClick={() => { setActiveTab("REJECTED"); setSelectedReqId(""); }}
          >
            Rejected ({requests.filter(r => r.status === "REJECTED").length})
          </button>
          <button
            type="button"
            className={`tab-chip ${activeTab === "ALL" ? "active" : ""}`}
            onClick={() => { setActiveTab("ALL"); setSelectedReqId(""); }}
          >
            All Requests ({requests.length})
          </button>
        </div>

        <div className="table-header">
          <input
            type="text"
            placeholder="Search UC requests by ID, requester email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Requested By</th>
                <th>Status</th>
                <th>UC Document</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req) => (
                  <tr key={req.id} className={selectedReqId === req.id ? "selected-row" : ""}>
                    <td style={{ fontWeight: "700" }}>{req.id}</td>
                    <td>{req.requestedBy}</td>
                    <td>
                      <span className={`status-badge ${req.status.toLowerCase().replace("_", "")}`}>
                        {req.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      {req.uploadedUcFile ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                          <FileText size={14} style={{ color: "#0f5aff" }} />
                          <span style={{ fontWeight: "500" }}>{req.uploadedUcFile}</span>
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "12px" }}>Not uploaded yet</span>
                      )}
                    </td>
                    <td>{new Date(req.updatedAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-sm"
                          onClick={() => setSelectedReqId(req.id)}
                        >
                          <Eye size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} /> View
                        </button>
                        {req.status === "REQUESTED" && (
                          <button
                            className="btn-sm"
                            style={{ borderColor: "#0f5aff", color: "#0f5aff" }}
                            onClick={() => handleActionClick("GRANT", req.id)}
                          >
                            Grant Template
                          </button>
                        )}
                        {(req.status === "UC_SUBMITTED" || req.status === "FINANCE_VERIFIED") && (
                          <>
                            <button
                              className="btn-sm"
                              style={{ borderColor: "#16a34a", color: "#16a34a" }}
                              onClick={() => handleActionClick("APPROVE", req.id)}
                            >
                              Approve
                            </button>
                            <button
                              className="btn-sm danger"
                              onClick={() => handleActionClick("REJECT", req.id)}
                            >
                              Reject
                            </button>
                            <button
                              className="btn-sm"
                              style={{ borderColor: "#d97706", color: "#d97706" }}
                              onClick={() => handleActionClick("REVISION", req.id)}
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
                  <td colSpan="6" className="empty-state">
                    No Utilization Certificates found for this filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* DETAILED VIEW */}
      {selectedReq && (
        <section className="admin-card">
          <h2>UC Request Details - {selectedReq.id}</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <span>Status</span>
              <strong style={{ fontSize: "1.1rem", textTransform: "uppercase" }}>
                {selectedReq.status.replace("_", " ")}
              </strong>
            </div>
            <div className="detail-item">
              <span>Requested By</span>
              <strong>{selectedReq.requestedBy}</strong>
            </div>
            {selectedReq.templateGranted && (
              <>
                <div className="detail-item">
                  <span>Template file provided</span>
                  <strong>{selectedReq.templateGranted.templateFile}</strong>
                </div>
                <div className="detail-item">
                  <span>Template Granted Date</span>
                  <strong>{new Date(selectedReq.templateGranted.grantedAt).toLocaleString()}</strong>
                </div>
                <div className="detail-item detail-item-wide" style={{ background: "#f8fafc" }}>
                  <span>Template instructions</span>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>{selectedReq.templateGranted.instructions}</p>
                </div>
              </>
            )}
            {selectedReq.financeRemarks && (
              <div className="detail-item detail-item-wide" style={{ borderLeft: "4px solid #10b981", background: "#f0fdf4" }}>
                <span style={{ color: "#166534" }}>Finance Review Comments (Accounts)</span>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>{selectedReq.financeRemarks}</p>
                {selectedReq.verifiedBy && <small style={{ color: "#64748b" }}>Verified by: {selectedReq.verifiedBy}</small>}
              </div>
            )}
            {selectedReq.adminRemarks && (
              <div className="detail-item detail-item-wide" style={{ borderLeft: "4px solid #0f5aff", background: "#eff6ff" }}>
                <span style={{ color: "#1d4ed8" }}>Admin Remarks</span>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>{selectedReq.adminRemarks}</p>
                {selectedReq.approvedBy && <small style={{ color: "#64748b" }}>Approved by: {selectedReq.approvedBy}</small>}
              </div>
            )}
          </div>

          <div style={{ marginTop: "24px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {selectedReq.uploadedUcFile && (
              <button
                className="btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
                onClick={() => {
                  alert(`Starting download of filled certificate: ${selectedReq.uploadedUcFile}`);
                }}
              >
                <Download size={16} /> Download Submitted UC
              </button>
            )}
            <button
              className="btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
              onClick={() => handleActionClick("AUDIT", selectedReq.id)}
            >
              <History size={16} /> View Audit History ({selectedReq.auditTrail?.length || 0})
            </button>
          </div>

          {selectedReq.uploadedUcFile && (
            <div style={{ marginTop: "24px", padding: "16px", border: "1px dashed #cbd5e1", borderRadius: "10px", backgroundColor: "#f8fafc" }}>
              <h3 style={{ fontSize: "14px", margin: "0 0 12px 0", color: "#334155" }}>📎 Associated Documents & Bills</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={docRowStyle}>
                  <span>Completed UC Document</span>
                  <strong>{selectedReq.uploadedUcFile}</strong>
                </div>
                <div style={docRowStyle}>
                  <span>Audited Event Bills & Invoices</span>
                  <strong>consolidated_event_bills_signed.pdf (4.8 MB)</strong>
                </div>
                <div style={docRowStyle}>
                  <span>Supporting Event Reports</span>
                  <strong>leadership_workshop_completion_report.pdf (1.2 MB)</strong>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* GRANT TEMPLATE MODAL */}
      {modalMode === "GRANT" && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3>Grant UC Template</h3>
            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
              Upload template guidelines and write specific instructions for this request.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label style={labelStyle}>
                <span>Template File Name</span>
                <input
                  type="text"
                  style={inputStyle}
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </label>
              <label style={labelStyle}>
                <span>Instructions</span>
                <textarea
                  style={textareaStyle}
                  rows={4}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </label>
            </div>
            {actionMessage && <p style={{ color: "#ef4444", fontSize: "12px", margin: "8px 0" }}>{actionMessage}</p>}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button className="btn-secondary" onClick={() => setModalMode("")}>Cancel</button>
              <button className="btn-primary" onClick={handleGrantSubmit}>Save & Grant</button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION REMARKS MODAL */}
      {(modalMode === "APPROVE" || modalMode === "REJECT" || modalMode === "REVISION") && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3>Confirm {modalMode === "APPROVE" ? "UC Approval" : modalMode === "REJECT" ? "UC Rejection" : "UC Revision Request"}</h3>
            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
              Detailed remarks are **required** to perform this action.
            </p>
            <textarea
              style={textareaStyle}
              placeholder="Enter audit remarks..."
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
                onClick={handleActionSubmit}
              >
                Submit {modalMode === "APPROVE" ? "Approve" : modalMode === "REJECT" ? "Reject" : "Request Revision"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT TRAIL MODAL */}
      {modalMode === "AUDIT" && selectedReq && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: "600px" }}>
            <h3>UC Audit Trail - {selectedReq.id}</h3>
            <div style={{ maxHeight: "350px", overflowY: "auto", margin: "16px 0", paddingRight: "8px" }}>
              {selectedReq.auditTrail && selectedReq.auditTrail.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {selectedReq.auditTrail.map((entry, idx) => (
                    <div key={idx} style={auditItemStyle}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <strong style={{ fontSize: "13px" }}>{entry.action}</strong>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#475569" }}>
                        Action by: <strong>{entry.user}</strong> ({entry.role})
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
    </main>
  );
}

// Custom styles
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

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  fontSize: "13px",
  fontWeight: "600",
  color: "#334155"
};

const inputStyle = {
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #cbd5e1",
  fontFamily: "inherit",
  fontSize: "13px"
};

const textareaStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  fontFamily: "inherit",
  fontSize: "13px",
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

const docRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 12px",
  background: "white",
  borderRadius: "6px",
  border: "1px solid #e2e8f0",
  fontSize: "12px"
};

export default AdminUCManagement;

import React, { useState, useEffect, useMemo } from "react";
import {
  Receipt,
  Download,
  Eye,
  RefreshCw,
  UserCheck,
  Loader2,
  X,
  FileCode
} from "lucide-react";
import { accountsService, getFileUrl, formatDateTime } from "../services/accountsService";
import "../styles/finance.css";

// Ported from the real, backend-connected admin/pages/TransactionReviewCenter.jsx
// ("Admin Approvals"). Same endpoint (GET /reports/admin-files, category=bill),
// same data shape. Approve/Reject actions are removed — the Accounts role is
// strictly read-only, enforced both here (no buttons) and server-side
// (ReportService.update_file_status rejects the ACCOUNTS role with a 403).
export default function FinanceApprovals() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("PENDING");
  const [previewFile, setPreviewFile] = useState(null);

  const fetchBills = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await accountsService.getFinanceDocuments({ category: "bill" });
      setBills(data || []);
    } catch (err) {
      console.error("Failed to load bills for approval review:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const safeBills = useMemo(() => (Array.isArray(bills) ? bills : []), [bills]);

  const filteredBills = useMemo(() => {
    return safeBills.filter((b) => {
      if (!b) return false;
      const fileName = b.originalFileName || b.original_file_name || b.fileName || b.file_name || "";
      const uploaderName = b.uploadedByName || b.uploaded_by_name || "";
      const projectId = b.projectId || b.project_id || "";
      const teamId = b.teamId || b.team_id || "";
      const status = (b.status || "").toUpperCase();

      const s = search.toLowerCase();
      const matchesSearch =
        fileName.toLowerCase().includes(s) ||
        uploaderName.toLowerCase().includes(s) ||
        projectId.toLowerCase().includes(s) ||
        teamId.toLowerCase().includes(s);

      let matchesTab = false;
      if (activeTab === "ALL") matchesTab = true;
      else if (activeTab === "PENDING") matchesTab = status === "PENDING" || status === "UNDER_REVIEW" || status === "SUBMITTED";
      else if (activeTab === "APPROVED") matchesTab = status === "APPROVED" || status === "ADMIN_APPROVED";
      else if (activeTab === "REJECTED") matchesTab = status === "REJECTED";

      return matchesSearch && matchesTab;
    });
  }, [safeBills, search, activeTab]);

  const stats = useMemo(
    () => ({
      total: safeBills.length,
      pending: safeBills.filter((b) => b && (b.status === "PENDING" || b.status === "UNDER_REVIEW" || b.status === "SUBMITTED")).length,
      approved: safeBills.filter((b) => b && (b.status === "APPROVED" || b.status === "ADMIN_APPROVED")).length,
      rejected: safeBills.filter((b) => b && b.status === "REJECTED").length,
    }),
    [safeBills]
  );

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
      case "ADMIN_APPROVED":
        return <span className="fin-badge badge-success">Approved</span>;
      case "REJECTED":
        return <span className="fin-badge badge-danger">Rejected</span>;
      default:
        return <span className="fin-badge badge-warning">Pending Review</span>;
    }
  };

  return (
    <div className="fin-page">
      <div className="fin-header">
        <div className="fin-header-top">
          <div>
            <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Receipt size={24} color="#1d5cff" />
              Approvals Center
            </h1>
            <p className="subtitle">
              Review status of uploaded expense bills and transaction records across project teams.
            </p>
          </div>
          <span className="fin-badge-role">Read Only Access</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <button type="button" className="fin-btn fin-btn-ghost" onClick={() => fetchBills(true)} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} style={{ marginRight: 6 }} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="fin-kpi-grid">
        <div className="fin-kpi-card" style={{ "--accent": "#2563eb" }}>
          <div className="fin-kpi-label">Total Bills & Transactions</div>
          <div className="fin-kpi-value">{stats.total}</div>
        </div>
        <div className="fin-kpi-card" style={{ "--accent": "#d97706" }}>
          <div className="fin-kpi-label">Pending Review</div>
          <div className="fin-kpi-value">{stats.pending}</div>
        </div>
        <div className="fin-kpi-card" style={{ "--accent": "#16a34a" }}>
          <div className="fin-kpi-label">Approved</div>
          <div className="fin-kpi-value">{stats.approved}</div>
        </div>
        <div className="fin-kpi-card" style={{ "--accent": "#dc2626" }}>
          <div className="fin-kpi-label">Rejected</div>
          <div className="fin-kpi-value">{stats.rejected}</div>
        </div>
      </div>

      {/* Filter Tabs and Search */}
      <div className="fin-card fin-section">
        <div className="fin-card-body">
          <div className="fin-search-row">
            <div className="fin-search">
              <input
                type="text"
                placeholder="Search by bill name, uploader, project ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            {[
              { id: "PENDING", label: `Pending Review (${stats.pending})` },
              { id: "APPROVED", label: `Approved (${stats.approved})` },
              { id: "REJECTED", label: `Rejected (${stats.rejected})` },
              { id: "ALL", label: `All Items (${stats.total})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`fin-btn fin-btn-sm ${activeTab === tab.id ? "fin-btn-primary" : "fin-btn-ghost"}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="fin-card fin-section">
        <div className="fin-card-body">
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
              <Loader2 className="animate-spin" size={32} color="#1d5cff" />
            </div>
          ) : (
            <div className="fin-table-wrap">
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>Bill / Transaction Name</th>
                    <th>Uploader</th>
                    <th>Project / Team ID</th>
                    <th>Upload Date & Time</th>
                    <th>Size</th>
                    <th>Status</th>
                    <th>File</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.length > 0 ? (
                    filteredBills.map((b) => {
                      const fileDirectUrl = getFileUrl(b.filePath || b.file_path || b.url);
                      const displayName = b.originalFileName || b.original_file_name || b.fileName || b.file_name || "Expense Bill";
                      const uploaderName = b.uploadedByName || b.uploaded_by_name || "Team Member";
                      const createdAtVal = b.createdAt || b.created_at;
                      const dateStr = formatDateTime(createdAtVal);
                      const sizeBytes = b.fileSize ?? b.file_size ?? 0;
                      const projectIdVal = b.projectId || b.project_id || "N/A";
                      const teamIdVal = b.teamId || b.team_id || "N/A";

                      return (
                        <tr key={b.id}>
                          <td className="bold">
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <Receipt size={16} color="#1d5cff" />
                              <span>{displayName}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <UserCheck size={14} color="#10b981" />
                              {uploaderName}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: "12.5px" }}>
                              <div><strong>Proj:</strong> {projectIdVal}</div>
                              <div style={{ color: "var(--text-3)" }}><strong>Team:</strong> {teamIdVal}</div>
                            </div>
                          </td>
                          <td>{dateStr}</td>
                          <td>{formatFileSize(sizeBytes)}</td>
                          <td>{getStatusBadge(b.status)}</td>
                          <td>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button type="button" className="fin-btn fin-btn-sm" onClick={() => setPreviewFile(b)}>
                                <Eye size={14} style={{ marginRight: 4 }} />
                                Preview
                              </button>
                              <a
                                className="fin-btn fin-btn-sm"
                                href={fileDirectUrl}
                                download={displayName}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download size={14} style={{ marginRight: 4 }} />
                                Download
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="empty-state" style={{ textAlign: "center", padding: "40px 20px" }}>
                        No uploaded bills or transaction records match the selected tab.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (() => {
        const fileName = previewFile.originalFileName || previewFile.original_file_name || previewFile.fileName || previewFile.file_name || "Bill";
        const uploaderName = previewFile.uploadedByName || previewFile.uploaded_by_name || "Team Member";
        const createdAtVal = previewFile.createdAt || previewFile.created_at;
        const dateStr = formatDateTime(createdAtVal);
        const sizeBytes = previewFile.fileSize ?? previewFile.file_size ?? 0;
        const filePath = previewFile.filePath || previewFile.file_path || previewFile.url || "";
        const fileDirectUrl = getFileUrl(filePath);
        const mimeType = (previewFile.mimeType || previewFile.mime_type || "").toLowerCase();

        const isImage = mimeType.startsWith("image") || /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(fileName) || /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(filePath);
        const isPdf = mimeType.includes("pdf") || /\.pdf$/i.test(fileName) || /\.pdf$/i.test(filePath);

        return (
          <div className="fin-modal-overlay" onClick={() => setPreviewFile(null)}>
            <div className="fin-modal" style={{ maxWidth: "850px" }} onClick={(e) => e.stopPropagation()}>
              <div className="fin-modal-header">
                <div>
                  <h3>{fileName}</h3>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>
                    Uploaded by {uploaderName} on {dateStr} | Size: {formatFileSize(sizeBytes)}
                  </span>
                </div>
                <button type="button" className="fin-modal-close" onClick={() => setPreviewFile(null)}>
                  <X size={20} />
                </button>
              </div>

              <div className="fin-modal-body" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "350px" }}>
                {isImage ? (
                  <img src={fileDirectUrl} alt={fileName} style={{ maxWidth: "100%", maxHeight: "550px", borderRadius: "10px", objectFit: "contain" }} />
                ) : isPdf ? (
                  <iframe src={fileDirectUrl} title={fileName} style={{ width: "100%", height: "550px", border: "none", borderRadius: "10px" }} />
                ) : (
                  <div style={{ textAlign: "center", padding: "40px 20px" }}>
                    <FileCode size={52} color="#1d5cff" style={{ marginBottom: "14px" }} />
                    <h3>Document Preview</h3>
                    <p style={{ color: "var(--text-3)" }}>File: <strong>{fileName}</strong> ({formatFileSize(sizeBytes)})</p>
                    <a className="fin-btn fin-btn-primary" href={fileDirectUrl} download={fileName} target="_blank" rel="noopener noreferrer">
                      <Download size={16} style={{ marginRight: 6 }} />
                      Download File to View
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import {
  FileCheck,
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

// Ported from the real, backend-connected admin/pages/AdminUCManagement.jsx
// ("Admin UC Management" = Fellow Utilization Certificates). Same endpoint
// (GET /reports/admin-files, category=uc), same data shape. The
// "Approve Clearance" / "Reject" actions are removed — Accounts is a
// strictly read-only role, enforced both here (no buttons) and server-side.
export default function FinanceFellowUtilization() {
  const [ucFiles, setUcFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [previewFile, setPreviewFile] = useState(null);

  const fetchUCDocuments = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await accountsService.getFinanceDocuments({ category: "uc" });
      setUcFiles(data || []);
    } catch (err) {
      console.error("Failed to load UC files:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUCDocuments();
  }, []);

  const safeUcFiles = useMemo(() => (Array.isArray(ucFiles) ? ucFiles : []), [ucFiles]);

  const filteredUCs = useMemo(() => {
    return safeUcFiles.filter((uc) => {
      if (!uc) return false;
      const fileName = uc.originalFileName || uc.original_file_name || uc.fileName || uc.file_name || "";
      const uploaderName = uc.uploadedByName || uc.uploaded_by_name || "";
      const projectId = uc.projectId || uc.project_id || "";
      const teamId = uc.teamId || uc.team_id || "";
      const status = uc.status || "";

      const s = search.toLowerCase();
      const matchesSearch =
        fileName.toLowerCase().includes(s) ||
        uploaderName.toLowerCase().includes(s) ||
        projectId.toLowerCase().includes(s) ||
        teamId.toLowerCase().includes(s);

      const matchesStatus = statusFilter === "ALL" || status.toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [safeUcFiles, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: safeUcFiles.length,
      pending: safeUcFiles.filter((u) => u && !["APPROVED", "REJECTED"].includes((u.status || "").toUpperCase())).length,
      approved: safeUcFiles.filter((u) => u && (u.status || "").toUpperCase() === "APPROVED").length,
      rejected: safeUcFiles.filter((u) => u && (u.status || "").toUpperCase() === "REJECTED").length,
    }),
    [safeUcFiles]
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
        return <span className="fin-badge badge-success">Approved</span>;
      case "REJECTED":
        return <span className="fin-badge badge-danger">Rejected</span>;
      default:
        return <span className="fin-badge badge-warning">Pending Clearance</span>;
    }
  };

  return (
    <div className="fin-page">
      <div className="fin-header">
        <div className="fin-header-top">
          <div>
            <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <FileCheck size={24} color="#8b5cf6" />
              Fellow Utilization Certificates
            </h1>
            <p className="subtitle">
              View Utilization Certificates submitted by fellows across project teams and their financial clearance status.
            </p>
          </div>
          <span className="fin-badge-role">Read Only Access</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <button type="button" className="fin-btn fin-btn-ghost" onClick={() => fetchUCDocuments(true)} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} style={{ marginRight: 6 }} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="fin-kpi-grid">
        <div className="fin-kpi-card" style={{ "--accent": "#2563eb" }}>
          <div className="fin-kpi-label">Total UCs Submitted</div>
          <div className="fin-kpi-value">{stats.total}</div>
        </div>
        <div className="fin-kpi-card" style={{ "--accent": "#d97706" }}>
          <div className="fin-kpi-label">Pending Clearance</div>
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

      {/* Filter and Search Bar */}
      <div className="fin-card fin-section">
        <div className="fin-card-body">
          <div className="fin-search-row">
            <div className="fin-search">
              <input
                type="text"
                placeholder="Search by UC name, uploader, project ID, team..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="fin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Clearance</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="fin-card fin-section">
        <div className="fin-card-body">
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
              <Loader2 className="animate-spin" size={32} color="#8b5cf6" />
            </div>
          ) : (
            <div className="fin-table-wrap">
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>UC Document</th>
                    <th>Fellow / Uploader</th>
                    <th>Project / Team ID</th>
                    <th>Submitted On</th>
                    <th>Size</th>
                    <th>Status</th>
                    <th>File</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUCs.length > 0 ? (
                    filteredUCs.map((uc) => {
                      const fileDirectUrl = getFileUrl(uc.filePath || uc.file_path || uc.url);
                      const displayName = uc.originalFileName || uc.original_file_name || uc.fileName || uc.file_name || "Utilization Certificate";
                      const uploaderName = uc.uploadedByName || uc.uploaded_by_name || "Team Member";
                      const createdAtVal = uc.createdAt || uc.created_at;
                      const dateStr = formatDateTime(createdAtVal);
                      const sizeBytes = uc.fileSize ?? uc.file_size ?? 0;
                      const projectIdVal = uc.projectId || uc.project_id || "N/A";
                      const teamIdVal = uc.teamId || uc.team_id || "N/A";

                      return (
                        <tr key={uc.id}>
                          <td className="bold">
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <FileCheck size={16} color="#8b5cf6" />
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
                          <td>{getStatusBadge(uc.status)}</td>
                          <td>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button type="button" className="fin-btn fin-btn-sm" onClick={() => setPreviewFile(uc)}>
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
                        No Utilization Certificates submitted yet.
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
        const fileName = previewFile.originalFileName || previewFile.original_file_name || previewFile.fileName || previewFile.file_name || "Utilization Certificate";
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
                    <FileCode size={52} color="#8b5cf6" style={{ marginBottom: "14px" }} />
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

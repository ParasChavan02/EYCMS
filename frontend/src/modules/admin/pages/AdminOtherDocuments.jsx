import React, { useState, useEffect, useMemo } from "react";
import {
  FolderArchive,
  Search,
  Download,
  Eye,
  RefreshCw,
  UserCheck,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  Loader2,
  FileText,
  FileCode
} from "lucide-react";
import { reportService, getFileUrl, formatDateTime } from "../../../services/reportService";
import { useNotification } from "../../common/hooks/useNotification";

export default function AdminOtherDocuments() {
  const { addNotification } = useNotification();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [previewFile, setPreviewFile] = useState(null);

  const fetchOtherDocuments = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await reportService.getAdminFiles("document");
      setDocuments(data || []);
      if (isManual) {
        addNotification("Supporting documents list refreshed.", "info", 1800, false);
      }
    } catch (err) {
      console.error("Failed to load supporting documents:", err);
      if (isManual) {
        addNotification("Failed to refresh supporting documents.", "error", 1800, false);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOtherDocuments();
    // Real-time polling every 10 seconds for live synchronization
    const interval = setInterval(() => {
      fetchOtherDocuments();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const safeDocs = useMemo(() => {
    return Array.isArray(documents) ? documents : [];
  }, [documents]);

  const filteredDocs = useMemo(() => {
    return safeDocs.filter((doc) => {
      if (!doc) return false;
      const fileName = doc.originalFileName || doc.original_file_name || doc.fileName || doc.file_name || "";
      const uploaderName = doc.uploadedByName || doc.uploaded_by_name || "";
      const projectId = doc.projectId || doc.project_id || "";
      const teamId = doc.teamId || doc.team_id || "";
      const status = doc.status || "";

      const s = searchQuery.toLowerCase();
      const matchesSearch =
        fileName.toLowerCase().includes(s) ||
        uploaderName.toLowerCase().includes(s) ||
        projectId.toLowerCase().includes(s) ||
        teamId.toLowerCase().includes(s);

      const matchesStatus =
        statusFilter === "ALL" || status.toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [safeDocs, searchQuery, statusFilter]);

  const handleStatusUpdate = async (fileId, newStatus, fileName) => {
    try {
      await reportService.updateFileStatus(fileId, newStatus);
      addNotification(`Document '${fileName}' mark as ${newStatus}.`, "success", 1800, false);
      await fetchOtherDocuments();
    } catch (err) {
      console.error(err);
      addNotification("Failed to update document status.", "error", 1800, false);
    }
  };

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
        return <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}><CheckCircle2 size={12} /> Approved</span>;
      case "REJECTED":
        return <span style={{ background: "#fee2e2", color: "#991b1b", padding: "4px 10px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}><XCircle size={12} /> Rejected</span>;
      default:
        return <span style={{ background: "#fef3c7", color: "#92400e", padding: "4px 10px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}><Clock size={12} /> Auto-Approved</span>;
    }
  };

  return (
    <main style={{ padding: "28px", minHeight: "calc(100vh - 60px)", background: "#f8fafc" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "10px" }}>
            <FolderArchive size={26} color="#1d5cff" />
            Supporting Documents Management
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.95rem" }}>
            Review, inspect, and manage all uploaded supporting documents, attendance sheets, certificates, and attachments in real time.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchOtherDocuments(true)}
          disabled={refreshing}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            padding: "10px 18px",
            borderRadius: "10px",
            fontWeight: "600",
            color: "#334155",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.04)"
          }}
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh Documents"}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px 22px", marginBottom: "28px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: "260px", position: "relative" }}>
          <input
            type="text"
            placeholder="Search by Document Name, Uploader Name, Project ID, Team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", paddingLeft: "40px", height: "42px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box", background: "#ffffff", color: "#0f172a" }}
          />
          <Search size={18} style={{ position: "absolute", left: "14px", top: "12px", color: "#94a3b8" }} />
        </div>

        {/* Status filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#475569" }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ height: "42px", padding: "0 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", background: "#ffffff", color: "#0f172a" }}
          >
            <option value="ALL">All Documents</option>
            <option value="APPROVED">Approved / Auto-Approved</option>
            <option value="PENDING">Pending Review</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Total stats pill */}
        <div style={{ marginLeft: "auto", background: "#eff6ff", color: "#1d5cff", padding: "8px 14px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "700" }}>
          Total Documents: {filteredDocs.length}
        </div>
      </div>

      {/* Table Container */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <Loader2 className="animate-spin" size={36} color="#1d5cff" />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                  <th style={{ padding: "14px 18px", fontWeight: "700" }}>Document Name</th>
                  <th style={{ padding: "14px 18px", fontWeight: "700" }}>Uploader Name</th>
                  <th style={{ padding: "14px 18px", fontWeight: "700" }}>Project / Team ID</th>
                  <th style={{ padding: "14px 18px", fontWeight: "700" }}>Upload Date & Time</th>
                  <th style={{ padding: "14px 18px", fontWeight: "700" }}>Size</th>
                  <th style={{ padding: "14px 18px", fontWeight: "700" }}>Status</th>
                  <th style={{ padding: "14px 18px", fontWeight: "700", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.length > 0 ? (
                  filteredDocs.map((doc) => {
                    const fileDirectUrl = getFileUrl(doc.filePath || doc.file_path || doc.url);
                    const displayName = doc.originalFileName || doc.original_file_name || doc.fileName || doc.file_name || "Document";
                    const uploaderName = doc.uploadedByName || doc.uploaded_by_name || "Team Member";
                    const uploaderEmail = doc.uploadedByEmail || doc.uploaded_by_email || "";
                    const createdAtVal = doc.createdAt || doc.created_at;
                    const dateStr = formatDateTime(createdAtVal);
                    const sizeBytes = doc.fileSize ?? doc.file_size ?? 0;
                    const projectIdVal = doc.projectId || doc.project_id || "N/A";
                    const teamIdVal = doc.teamId || doc.team_id || "N/A";

                    return (
                      <tr key={doc.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s ease" }}>
                        <td style={{ padding: "14px 18px", fontWeight: "600", color: "#0f172a" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <FileText size={18} color="#1d5cff" />
                            <span>{displayName}</span>
                          </div>
                        </td>

                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <UserCheck size={14} color="#10b981" />
                            <div>
                              <strong style={{ color: "#1e293b", display: "block" }}>{uploaderName}</strong>
                              {uploaderEmail && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>{uploaderEmail}</span>}
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: "14px 18px", color: "#334155" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span><strong>Proj:</strong> {projectIdVal}</span>
                            <span style={{ fontSize: "0.78rem", color: "#64748b" }}><strong>Team:</strong> {teamIdVal}</span>
                          </div>
                        </td>

                        <td style={{ padding: "14px 18px", color: "#475569" }}>
                          {dateStr}
                        </td>

                        <td style={{ padding: "14px 18px", color: "#475569" }}>
                          {formatFileSize(sizeBytes)}
                        </td>

                        <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                          {getStatusBadge(doc.status)}
                        </td>

                        <td style={{ padding: "14px 18px", textAlign: "center", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "nowrap" }}>
                            {/* Preview */}
                            <button
                              type="button"
                              onClick={() => setPreviewFile(doc)}
                              style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#334155", fontWeight: "600", fontSize: "0.78rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            >
                              <Eye size={14} />
                              Preview
                            </button>

                            {/* Direct Download */}
                            <a
                              href={fileDirectUrl}
                              download={displayName}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ padding: "6px 12px", borderRadius: "8px", border: "none", background: "#eff6ff", color: "#1d5cff", fontWeight: "600", fontSize: "0.78rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
                            >
                              <Download size={14} />
                              Download
                            </a>

                            {/* Approve */}
                            {doc.status !== "APPROVED" && (
                              <button
                                type="button"
                                onClick={() => handleStatusUpdate(doc.id, "APPROVED", displayName)}
                                style={{ padding: "6px 12px", borderRadius: "8px", border: "none", background: "#dcfce7", color: "#166534", fontWeight: "600", fontSize: "0.78rem", cursor: "pointer" }}
                              >
                                Approve
                              </button>
                            )}

                            {/* Reject */}
                            {doc.status !== "REJECTED" && (
                              <button
                                type="button"
                                onClick={() => handleStatusUpdate(doc.id, "REJECTED", displayName)}
                                style={{ padding: "6px 12px", borderRadius: "8px", border: "none", background: "#fee2e2", color: "#991b1b", fontWeight: "600", fontSize: "0.78rem", cursor: "pointer" }}
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                      No supporting documents uploaded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {previewFile && (() => {
        const fileName = previewFile.originalFileName || previewFile.original_file_name || previewFile.fileName || previewFile.file_name || "Document";
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
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99990,
              background: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px"
            }}
            onClick={() => setPreviewFile(null)}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "850px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                display: "flex",
                flexDirection: "column",
                border: "1px solid #e2e8f0"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                <div>
                  <strong style={{ fontSize: "1rem", color: "#0f172a" }}>{fileName}</strong>
                  <span style={{ fontSize: "0.78rem", color: "#64748b", display: "block", marginTop: "2px" }}>
                    Uploaded by {uploaderName} on {dateStr} | Size: {formatFileSize(sizeBytes)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "350px", background: "#f8fafc" }}>
                {isImage ? (
                  <img
                    src={fileDirectUrl}
                    alt={fileName}
                    style={{ maxWidth: "100%", maxHeight: "550px", borderRadius: "10px", objectFit: "contain" }}
                  />
                ) : isPdf ? (
                  <iframe
                    src={fileDirectUrl}
                    title={fileName}
                    style={{ width: "100%", height: "550px", border: "none", borderRadius: "10px", background: "#ffffff" }}
                  />
                ) : (
                  <div style={{ textAlign: "center", padding: "40px 20px", background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", width: "100%", maxWidth: "500px" }}>
                    <FileCode size={52} color="#1d5cff" style={{ marginBottom: "14px" }} />
                    <h3 style={{ margin: "0 0 6px", color: "#1e293b" }}>Document Preview</h3>
                    <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: "0.88rem" }}>
                      File: <strong>{fileName}</strong> ({formatFileSize(sizeBytes)})
                    </p>
                    <a
                      href={fileDirectUrl}
                      download={fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "none", padding: "10px 20px", borderRadius: "10px", background: "#1d5cff", color: "#ffffff", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "8px" }}
                    >
                      <Download size={16} />
                      Download File to View
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </main>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Download,
  Eye,
  RefreshCw,
  Image as ImageIcon,
  UserCheck,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  Loader2,
  Sparkles
} from "lucide-react";
import { reportService, getFileUrl, formatDateTime } from "../../../services/reportService";
import { useNotification } from "../../common/hooks/useNotification";

export default function AdminGallery() {
  const { addNotification } = useNotification();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchGalleryImages = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await reportService.getGalleryImages();
      setImages(data || []);
      if (isManual) {
        addNotification("Gallery refreshed with latest event media.", "info", 1800, false);
      }
    } catch (err) {
      console.error("Failed to load gallery images:", err);
      if (isManual) {
        addNotification("Failed to refresh gallery images.", "error", 1800, false);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGalleryImages();
    // Real-time polling every 10 seconds for instant live updates when users upload images
    const interval = setInterval(() => {
      fetchGalleryImages();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const safeImages = useMemo(() => {
    return Array.isArray(images) ? images : [];
  }, [images]);

  const filteredImages = useMemo(() => {
    return safeImages.filter((img) => {
      if (!img) return false;
      const fileName = img.originalFileName || "";
      const uploaderName = img.uploadedByName || "";
      const eventName = img.eventName || "";
      const projectId = img.projectId || "";
      const status = img.status || "";

      const s = searchQuery.toLowerCase();
      const matchesSearch =
        fileName.toLowerCase().includes(s) ||
        uploaderName.toLowerCase().includes(s) ||
        eventName.toLowerCase().includes(s) ||
        projectId.toLowerCase().includes(s);

      const matchesStatus =
        statusFilter === "ALL" || status.toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [safeImages, searchQuery, statusFilter]);

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
        return <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}><CheckCircle2 size={12} /> Approved</span>;
      case "REJECTED":
        return <span style={{ background: "#fee2e2", color: "#991b1b", padding: "4px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}><XCircle size={12} /> Rejected</span>;
      default:
        return <span style={{ background: "#fef3c7", color: "#92400e", padding: "4px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}><Clock size={12} /> Auto-Approved</span>;
    }
  };

  return (
    <main style={{ padding: "28px", minHeight: "calc(100vh - 60px)", background: "#f8fafc" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "10px" }}>
            <Sparkles size={26} color="#8b5cf6" />
            Operations Media & Event Gallery
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.95rem" }}>
            Live responsive image grid of event media uploaded by team members across all projects.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchGalleryImages(true)}
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
          {refreshing ? "Refreshing..." : "Refresh Gallery"}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px 22px", marginBottom: "28px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: "260px", position: "relative" }}>
          <input
            type="text"
            placeholder="Search by Event Name, File Name, Uploader Name..."
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
            <option value="ALL">All Media</option>
            <option value="APPROVED">Approved / Auto-Approved</option>
            <option value="PENDING">Pending Review</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Total stats pill */}
        <div style={{ marginLeft: "auto", background: "#f1f5f9", padding: "8px 14px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "700", color: "#334155" }}>
          Total Images: {filteredImages.length}
        </div>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
          <Loader2 className="animate-spin" size={40} color="#8b5cf6" />
        </div>
      ) : filteredImages.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
          {filteredImages.map((img) => {
            const imgDirectUrl = getFileUrl(img.filePath || img.file_path || img.url);
            const uploaderName = img.uploadedByName || img.uploaded_by_name || "Team Member";
            const createdAtVal = img.createdAt || img.created_at;
            const dateStr = formatDateTime(createdAtVal);
            const sizeBytes = img.fileSize ?? img.file_size ?? 0;
            const displayName = img.eventName || img.event_name || img.originalFileName || img.original_file_name || "Event Image";
            const projectIdVal = img.projectId || img.project_id;

            return (
              <div
                key={img.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  cursor: "pointer"
                }}
                onClick={() => setSelectedImage(img)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 20px 30px -10px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(0,0,0,0.05)";
                }}
              >
                {/* Image Preview Container */}
                <div style={{ position: "relative", height: "200px", background: "#0f172a", overflow: "hidden" }}>
                  <img
                    src={imgDirectUrl}
                    alt={displayName}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/400x300?text=Event+Image";
                    }}
                  />
                  <div style={{ position: "absolute", top: "12px", right: "12px" }}>
                    {getStatusBadge(img.status)}
                  </div>
                  <div style={{ position: "absolute", bottom: "12px", left: "12px", background: "rgba(15, 23, 42, 0.75)", color: "#ffffff", backdropFilter: "blur(4px)", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600" }}>
                    {formatFileSize(sizeBytes)}
                  </div>
                </div>

                {/* Card Meta Content */}
                <div style={{ padding: "18px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <h4 style={{ margin: "0 0 6px", fontSize: "1rem", fontWeight: "700", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {displayName}
                    </h4>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.82rem", color: "#64748b", margin: "10px 0 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <UserCheck size={14} color="#8b5cf6" />
                        <strong style={{ color: "#334155" }}>Uploader:</strong> {uploaderName}
                      </div>
                      {projectIdVal && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Layers size={14} color="#06b6d4" />
                          <strong style={{ color: "#334155" }}>Project ID:</strong> {projectIdVal}
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Calendar size={14} color="#64748b" />
                        <span>{dateStr}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div style={{ display: "flex", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(img);
                      }}
                      style={{ flex: 1, height: "36px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", cursor: "pointer", fontWeight: "600", fontSize: "0.82rem", color: "#334155", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                    >
                      <Eye size={14} />
                      Preview
                    </button>

                    <a
                      href={imgDirectUrl}
                      download={img.originalFileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ flex: 1, height: "36px", borderRadius: "8px", border: "none", background: "#8b5cf6", color: "#ffffff", cursor: "pointer", fontWeight: "600", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", textDecoration: "none" }}
                    >
                      <Download size={14} />
                      Download
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "60px 20px", textAlign: "center" }}>
          <ImageIcon size={48} color="#cbd5e1" style={{ marginBottom: "12px" }} />
          <h3 style={{ margin: "0 0 6px", color: "#1e293b" }}>No event images found</h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
            When users upload event photographs in the Reports module, they will automatically appear here in real time.
          </p>
        </div>
      )}

      {/* Image Lightbox Preview Modal */}
      {selectedImage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99990,
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => setSelectedImage(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "880px",
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
              display: "flex",
              flexDirection: "column"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <ImageIcon size={20} color="#8b5cf6" />
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#0f172a" }}>
                  {selectedImage.eventName || selectedImage.originalFileName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Lightbox Body */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* High-res Image Preview */}
              <div style={{ background: "#0f172a", borderRadius: "12px", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center", maxHeight: "500px" }}>
                <img
                  src={getFileUrl(selectedImage.filePath || selectedImage.url)}
                  alt={selectedImage.originalFileName}
                  style={{ maxWidth: "100%", maxHeight: "500px", objectFit: "contain" }}
                />
              </div>

              {/* Image Details Metadata Grid */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Uploader Name</span>
                  <strong style={{ color: "#0f172a", fontSize: "0.95rem" }}>{selectedImage.uploadedByName || selectedImage.uploaded_by_name || "Team Member"}</strong>
                  <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block" }}>{selectedImage.uploadedByEmail || selectedImage.uploaded_by_email}</span>
                </div>

                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Event / File Name</span>
                  <strong style={{ color: "#0f172a", fontSize: "0.95rem" }}>{selectedImage.eventName || selectedImage.event_name || "N/A"}</strong>
                  <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block" }}>{selectedImage.originalFileName || selectedImage.original_file_name}</span>
                </div>

                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Upload Timestamp</span>
                  <span style={{ fontSize: "0.9rem", color: "#334155" }}>
                    {formatDateTime(selectedImage.createdAt || selectedImage.created_at)}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>File Details</span>
                  <span style={{ fontSize: "0.9rem", color: "#334155" }}>
                    {formatFileSize(selectedImage.fileSize ?? selectedImage.file_size ?? 0)} ({selectedImage.mimeType || selectedImage.mime_type || "image"})
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  style={{ padding: "10px 20px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#ffffff", fontWeight: "600", color: "#475569", cursor: "pointer" }}
                >
                  Close
                </button>

                <a
                  href={getFileUrl(selectedImage.filePath || selectedImage.url)}
                  download={selectedImage.originalFileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: "10px 22px", borderRadius: "10px", border: "none", background: "#8b5cf6", color: "#ffffff", fontWeight: "600", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <Download size={16} />
                  Download High-Res Image
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

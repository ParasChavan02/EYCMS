import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import {
  Download,
  FileCheck2,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  FolderArchive,
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Trash2,
  Search,
  X,
  FileCode,
  Loader2,
  UserCheck
} from "lucide-react";
import { useNotification } from "../../common/hooks/useNotification";
import { reportService, getFileUrl, formatDateTime } from "../../../services/reportService";
import "./user-erp.css";

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function Reports() {
  const { addNotification } = useNotification();
  
  // Real team files loaded from backend DB
  const [teamFiles, setTeamFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [projectCategories, setProjectCategories] = useState([]);

  const loadProjectCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
      const res = await axios.get(`${API_BASE_URL}/user/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjectCategories(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load project categories:", err);
    }
  };

  // Per-category state for selected files, event names, drag states, and upload progress
  const [selectedFiles, setSelectedFiles] = useState({
    report: null,
    image: null,
    document: null,
    bill: null,
    uc: null,
  });

  const [eventNames, setEventNames] = useState({
    image: "",
  });

  const [uploadProgress, setUploadProgress] = useState({
    report: 0,
    image: 0,
    document: 0,
    bill: 0,
    uc: 0,
  });

  const [isUploading, setIsUploading] = useState({
    report: false,
    image: false,
    document: false,
    bill: false,
    uc: false,
  });

  const [dragActive, setDragActive] = useState({
    report: false,
    image: false,
    document: false,
    bill: false,
    uc: false,
  });

  // Bill splitting & drafts config states
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [billId, setBillId] = useState(null);
  const [billFile, setBillFile] = useState(null);
  const [billFilePreviewUrl, setBillFilePreviewUrl] = useState("");
  const [billTotalAmount, setBillTotalAmount] = useState("");
  const [transactionMode, setTransactionMode] = useState("single");
  const [singleCategory, setSingleCategory] = useState("Travel");
  const [singleRemarks, setSingleRemarks] = useState("");
  const [splitTransactions, setSplitTransactions] = useState([
    { id: 1, category: "Travel", description: "", amount: "" }
  ]);
  const [localActivityHistory, setLocalActivityHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [hasAutosave, setHasAutosave] = useState(false);

  useEffect(() => {
    if (!billFile) {
      setBillFilePreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(billFile);
    setBillFilePreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [billFile]);

  // Table filtering & search state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [uploaderFilter, setUploaderFilter] = useState("All");

  // File Preview Modal state
  const [previewFile, setPreviewFile] = useState(null);

  // Load team files from backend API
  const loadFiles = async () => {
    try {
      setLoadingFiles(true);
      const data = await reportService.getTeamFiles();
      setTeamFiles(data || []);
    } catch (err) {
      console.error("Failed to load team files:", err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const location = useLocation();

  useEffect(() => {
    if (location.state?.category) {
      setCategoryFilter(location.state.category);
    }
  }, [location.state]);

  useEffect(() => {
    loadFiles();
    loadProjectCategories();
  }, []);

  // Safe team files array guard
  const safeTeamFiles = useMemo(() => {
    return Array.isArray(teamFiles) ? teamFiles : [];
  }, [teamFiles]);

  // Handle Drag & Drop events
  const handleDrag = (category, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive((prev) => ({ ...prev, [category]: true }));
    } else if (e.type === "dragleave") {
      setDragActive((prev) => ({ ...prev, [category]: false }));
    }
  };

  const validateAndSetFile = (category, file) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      addNotification(
        `File '${file.name}' exceeds the maximum size limit of ${MAX_FILE_SIZE_MB} MB.`,
        "error",
        1800,
        false
      );
      return;
    }
    if (category === "bill") {
      setBillFile(file);
      setBillId(null);
      setBillTotalAmount("");
      setTransactionMode("single");
      setSingleCategory("Travel");
      setSingleRemarks("");
      setSplitTransactions([{ id: 1, category: "Travel", description: "", amount: "" }]);
      setLocalActivityHistory([`[${new Date().toLocaleTimeString()}] Selected bill file: ${file.name}`]);
      setIsBillModalOpen(true);
    } else {
      setSelectedFiles((prev) => ({ ...prev, [category]: file }));
    }
  };

  // Close split modal and clear state
  const handleCloseBillModal = () => {
    setIsBillModalOpen(false);
    setBillFile(null);
    setBillId(null);
    setSelectedFiles(prev => ({ ...prev, bill: null }));
  };

  // Open split modal to edit a draft
  const handleEditBill = (file) => {
    setBillId(file.id);
    setBillFile(null); // Keep original file unless replaced
    const txs = file.transactions || [];
    const total = txs.reduce((sum, t) => sum + t.amount, 0);
    setBillTotalAmount(total > 0 ? String(total) : "");
    
    if (txs.length <= 1) {
      setTransactionMode("single");
      if (txs.length === 1) {
        setSingleCategory(txs[0].category || "Travel");
        setSingleRemarks(txs[0].description || "");
      } else {
        setSingleCategory("Travel");
        setSingleRemarks("");
      }
      setSplitTransactions([{ id: 1, category: "Travel", description: "", amount: "" }]);
    } else {
      setTransactionMode("multiple");
      setSplitTransactions(txs.map((t, idx) => ({
        id: idx + 1,
        category: t.category || "Travel",
        description: t.description || "",
        amount: String(t.amount)
      })));
    }
    
    setLocalActivityHistory([
      `[${new Date().toLocaleTimeString()}] Opened draft bill for editing.`,
      `[${new Date().toLocaleTimeString()}] Existing file: ${file.originalFileName || file.original_file_name}`
    ]);
    setIsBillModalOpen(true);
  };

  // Auto-save effect
  useEffect(() => {
    if (isBillModalOpen) {
      const data = {
        billId,
        billTotalAmount,
        transactionMode,
        singleCategory,
        singleRemarks,
        splitTransactions
      };
      localStorage.setItem("eycms_bill_autosave", JSON.stringify(data));
      // Log local activity history
      setLocalActivityHistory(prev => {
        const last = prev[prev.length - 1];
        const logMsg = `[${new Date().toLocaleTimeString()}] Draft auto-saved.`;
        if (last && last.includes("Draft auto-saved")) {
          return prev; // prevent log flooding
        }
        return [...prev, logMsg];
      });
    }
  }, [isBillModalOpen, billId, billTotalAmount, transactionMode, singleCategory, singleRemarks, splitTransactions]);

  // Load check for local cache autosaves
  useEffect(() => {
    const saved = localStorage.getItem("eycms_bill_autosave");
    if (saved) {
      setHasAutosave(true);
    }
  }, []);

  const handleRestoreAutosave = () => {
    try {
      const saved = localStorage.getItem("eycms_bill_autosave");
      if (saved) {
        const data = JSON.parse(saved);
        setBillId(data.billId);
        setBillTotalAmount(data.billTotalAmount);
        setTransactionMode(data.transactionMode);
        setSingleCategory(data.singleCategory);
        setSingleRemarks(data.singleRemarks);
        setSplitTransactions(data.splitTransactions);
        setLocalActivityHistory([
          `[${new Date().toLocaleTimeString()}] Restored auto-save from cache.`
        ]);
        setIsBillModalOpen(true);
        addNotification("Autosaved progress restored.", "success", 1800, false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Process and upload bill (Save as Draft or Submit)
  const handleBillSubmit = async (statusType) => {
    const totalVal = parseFloat(billTotalAmount);
    if (!totalVal || totalVal <= 0) {
      addNotification("Please enter a valid bill amount.", "error", 1800, false);
      return;
    }

    let txsArray = [];
    if (transactionMode === "single") {
      txsArray = [{
        category: singleCategory,
        description: singleRemarks.trim(),
        amount: totalVal
      }];
    } else {
      txsArray = splitTransactions.map(t => ({
        category: t.category,
        description: t.description.trim(),
        amount: parseFloat(t.amount) || 0
      }));
    }

    // Check category balances on submit
    if (statusType !== "DRAFT" && projectCategories.length > 0) {
      for (const tx of txsArray) {
        const catAlloc = projectCategories.find(c => c.category.toLowerCase() === tx.category.toLowerCase());
        if (!catAlloc) {
          addNotification(`Insufficient category balance. Category '${tx.category}' has not been allocated any budget.`, "error", 4000, false);
          return;
        }

        const currentSplitTotal = txsArray.filter(t => t.category.toLowerCase() === tx.category.toLowerCase()).reduce((sum, t) => sum + t.amount, 0);
        if (currentSplitTotal > catAlloc.remaining) {
          addNotification(`Insufficient category balance. Category '${tx.category}' has only Rs ${catAlloc.remaining.toLocaleString("en-IN")} remaining, but you requested Rs ${currentSplitTotal.toLocaleString("en-IN")}.`, "error", 4000, false);
          return;
        }
      }
    }

    setIsUploading((prev) => ({ ...prev, bill: true }));
    setUploadProgress((prev) => ({ ...prev, bill: 0 }));

    try {
      const extraData = {
        bill_amount: totalVal,
        transaction_mode: transactionMode,
        transactions: JSON.stringify(txsArray),
        status: statusType
      };
      if (billId) {
        extraData.bill_id = billId;
      }

      await reportService.uploadFile(
        "bill",
        billFile, // Null when editing existing file unless replaced
        "",
        extraData,
        (percent) => {
          setUploadProgress((prev) => ({ ...prev, bill: percent }));
        }
      );

      addNotification(
        statusType === "DRAFT"
          ? "Bill saved as draft successfully."
          : "Bill submitted for review successfully.",
        "success",
        1800,
        false
      );

      // Clear local cache autosave
      localStorage.removeItem("eycms_bill_autosave");
      setHasAutosave(false);

      // Reset modal and refresh file list
      setIsBillModalOpen(false);
      setBillFile(null);
      setBillId(null);
      await loadFiles();
    } catch (err) {
      console.error(err);
      const errMsg = err?.response?.data?.detail || `Failed to upload bill.`;
      addNotification(errMsg, "error", 1800, false);
    } finally {
      setIsUploading((prev) => ({ ...prev, bill: false }));
    }
  };

  const handleDrop = (category, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive((prev) => ({ ...prev, [category]: false }));
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(category, e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (category, e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(category, e.target.files[0]);
    }
  };

  // Upload handler for a specific category
  const handleSectionUpload = async (category, categoryLabel) => {
    const file = selectedFiles[category];
    if (!file) {
      addNotification(`Please select or drag a file to upload for ${categoryLabel}.`, "error", 1800, false);
      return;
    }

    setIsUploading((prev) => ({ ...prev, [category]: true }));
    setUploadProgress((prev) => ({ ...prev, [category]: 0 }));

    try {
      const eventNameVal = category === "image" ? eventNames.image : "";
      await reportService.uploadFile(
        category,
        file,
        eventNameVal,
        (percent) => {
          setUploadProgress((prev) => ({ ...prev, [category]: percent }));
        }
      );

      addNotification(`${categoryLabel} uploaded successfully!`, "success", 1800, false);

      // Reset state for this section
      setSelectedFiles((prev) => ({ ...prev, [category]: null }));
      setUploadProgress((prev) => ({ ...prev, [category]: 0 }));
      if (category === "image") {
        setEventNames((prev) => ({ ...prev, image: "" }));
      }

      // Refresh team files list
      await loadFiles();
    } catch (err) {
      console.error(err);
      const errMsg = err?.response?.data?.detail || `Failed to upload ${categoryLabel}.`;
      addNotification(errMsg, "error", 1800, false);
    } finally {
      setIsUploading((prev) => ({ ...prev, [category]: false }));
    }
  };

  // Delete file handler
  const handleDeleteFile = async (fileId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete '${fileName}'?`)) return;
    try {
      await reportService.deleteFile(fileId);
      addNotification(`File '${fileName}' deleted successfully.`, "success", 1800, false);
      await loadFiles();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.detail || "Failed to delete file.";
      addNotification(msg, "error", 1800, false);
    }
  };

  // 5 Upload Category Sections with unified styling
  const uploadSections = [
    {
      category: "report",
      title: "1. Project Reports",
      description: "Upload formal quarterly or annual project reporting documents.",
      acceptedFormats: ".pdf, .doc, .docx",
      icon: FileText,
    },
    {
      category: "image",
      title: "2. Event Images & Media",
      description: "Upload high-res event photographs for project gallery & admin review.",
      acceptedFormats: ".jpg, .jpeg, .png, .webp",
      icon: ImageIcon,
      hasEventName: true,
    },
    {
      category: "document",
      title: "3. Supporting Documents",
      description: "Add approval letters, attendance sheets, certificates, or zip archives.",
      acceptedFormats: ".pdf, .doc, .docx, .zip, .rar",
      icon: FolderArchive,
    },
    {
      category: "bill",
      title: "4. Bills & Receipts",
      description: "Upload travel, food, printing, venue, and equipment expense vouchers.",
      acceptedFormats: ".pdf, .jpg, .jpeg, .png",
      icon: Receipt,
    },
    {
      category: "uc",
      title: "5. Utilization Certificate (UC)",
      description: "Submit completed Utilization Certificate signed PDF for fund clearance.",
      acceptedFormats: ".pdf",
      icon: FileCheck2,
    },
  ];

  // Unique list of uploader names for filter dropdown
  const uploaderNames = useMemo(() => {
    const set = new Set();
    safeTeamFiles.forEach((f) => {
      if (!f) return;
      const name = f.uploadedByName || f.uploaded_by_name;
      if (name) set.add(name);
    });
    return Array.from(set);
  }, [safeTeamFiles]);

  // Filtered files logic
  const filteredFiles = useMemo(() => {
    return safeTeamFiles.filter((file) => {
      if (!file) return false;
      const fileName = file.originalFileName || file.original_file_name || file.fileName || file.file_name || "";
      const uploaderName = file.uploadedByName || file.uploaded_by_name || "";
      const eventName = file.eventName || file.event_name || "";
      const category = file.category || "";
      const status = file.status || "";

      const matchesSearch =
        fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        uploaderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eventName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === "All" || category.toLowerCase() === categoryFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "All" ||
        (category.toLowerCase() !== "image" && category.toLowerCase() !== "document" && status.toUpperCase() === statusFilter.toUpperCase());

      const matchesUploader =
        uploaderFilter === "All" || uploaderName === uploaderFilter;

      return matchesSearch && matchesCategory && matchesStatus && matchesUploader;
    });
  }, [safeTeamFiles, searchQuery, categoryFilter, statusFilter, uploaderFilter]);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Status badge logic: Approval required ONLY for report, bill, uc. Images & documents display N/A.
  const getStatusBadge = (status, category) => {
    const cat = category?.toLowerCase();
    if (cat === "image" || cat === "document") {
      return (
        <span style={{ padding: "4px 10px", borderRadius: "999px", background: "#f1f5f9", color: "#64748b", fontSize: "0.78rem", fontWeight: "700" }}>
          N/A
        </span>
      );
    }
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return <span className="user-status approved"><CheckCircle2 size={12} /> Approved</span>;
      case "REJECTED":
        return <span className="user-status rejected"><XCircle size={12} /> Rejected</span>;
      case "DRAFT":
        return <span className="user-status draft" style={{ background: "#cbd5e1", color: "#334155", display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "8px", fontSize: "0.78rem", fontWeight: "700" }}><FileText size={12} /> Draft</span>;
      default:
        return <span className="user-status pending"><Clock size={12} /> Pending Review</span>;
    }
  };

  return (
    <main className="user-erp-page">
      <header className="user-erp-header">
        <h1>Reports & Document Management</h1>
        <p>Upload project reports, event gallery images, bills, and Utilization Certificates for your team.</p>
      </header>

      {hasAutosave && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", padding: "16px 20px", color: "#92400e", fontSize: "0.95rem", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={20} style={{ flexShrink: 0 }} />
            <span>You have an autosaved bill draft. Would you like to restore your progress?</span>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleRestoreAutosave}
              style={{ padding: "6px 12px", background: "#d97706", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "0.82rem", fontWeight: "700", cursor: "pointer" }}
            >
              Restore Draft
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("eycms_bill_autosave");
                setHasAutosave(false);
              }}
              style={{ padding: "6px 12px", background: "transparent", color: "#92400e", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.82rem", cursor: "pointer" }}
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* 5 INDIVIDUAL UPLOAD SECTIONS (UNIFIED BUTTON STYLING) */}
      <section className="user-erp-card" style={{ marginBottom: "28px" }}>
        <h2>Upload Document Hub</h2>
        <p style={{ margin: "4px 0 20px", color: "#536987", fontSize: "0.9rem" }}>
          Upload files into distinct categories. Each section has its own drag & drop zone, progress tracker, and dedicated upload button. Maximum 20 MB per file.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          {uploadSections.map((sec) => {
            const Icon = sec.icon;
            const cat = sec.category;
            const file = selectedFiles[cat];
            const uploading = isUploading[cat];
            const progress = uploadProgress[cat];
            const isDragActive = dragActive[cat];

            return (
              <div
                key={cat}
                style={{
                  background: "#ffffff",
                  border: `1px solid ${isDragActive ? "#1d5cff" : "#cfd9e8"}`,
                  borderRadius: "14px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: isDragActive ? "0 0 0 3px rgba(29, 92, 255, 0.15)" : "0 4px 12px rgba(0,0,0,0.03)",
                  transition: "all 0.2s ease"
                }}
              >
                <div>
                  {/* Section Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <div style={{ padding: "8px", borderRadius: "8px", background: "#eff6ff", color: "#1d5cff" }}>
                      <Icon size={20} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "#1e293b" }}>
                      {sec.title}
                    </h3>
                  </div>

                  <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0 0 14px", lineHeight: "1.4" }}>
                    {sec.description}
                  </p>

                  {/* Optional Event Name field for Event Images */}
                  {sec.hasEventName && (
                    <div style={{ marginBottom: "12px" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>
                        Event Name (Optional)
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. Leadership Workshop 2026"
                        value={eventNames.image}
                        onChange={(e) => setEventNames((prev) => ({ ...prev, image: e.target.value }))}
                        style={{ width: "100%", padding: "8px 12px", fontSize: "0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box", background: "#ffffff", color: "#0f172a" }}
                      />
                    </div>
                  )}

                  {/* Drag & Drop Zone */}
                  <div
                    onDragEnter={(e) => handleDrag(cat, e)}
                    onDragOver={(e) => handleDrag(cat, e)}
                    onDragLeave={(e) => handleDrag(cat, e)}
                    onDrop={(e) => handleDrop(cat, e)}
                    style={{
                      border: `2px dashed ${isDragActive ? "#1d5cff" : "#cbd5e1"}`,
                      borderRadius: "10px",
                      background: isDragActive ? "#eff6ff" : "#f8fafc",
                      padding: "18px 14px",
                      textAlign: "center",
                      cursor: "pointer",
                      marginBottom: "14px",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <input
                      type="file"
                      id={`file-input-${cat}`}
                      accept={sec.acceptedFormats}
                      onChange={(e) => handleFileInputChange(cat, e)}
                      style={{ display: "none" }}
                    />
                    <label htmlFor={`file-input-${cat}`} style={{ cursor: "pointer", display: "block" }}>
                      <UploadCloud size={28} style={{ color: "#1d5cff", margin: "0 auto 6px" }} />
                      <strong style={{ display: "block", fontSize: "0.85rem", color: "#334155" }}>
                        {file ? file.name : "Click or Drag & Drop file here"}
                      </strong>
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8", display: "block", marginTop: "4px" }}>
                        {sec.acceptedFormats} (Max 20 MB)
                      </span>
                    </label>

                    {file && (
                      <div style={{ marginTop: "10px", display: "inline-flex", alignItems: "center", gap: "6px", background: "#ffffff", padding: "4px 10px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "0.78rem" }}>
                        <span>{formatFileSize(file.size)}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFiles((prev) => ({ ...prev, [cat]: null }));
                          }}
                          style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ef4444", padding: 0 }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar during upload */}
                {uploading && (
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#475569", marginBottom: "4px" }}>
                      <span>Uploading...</span>
                      <strong>{progress}%</strong>
                    </div>
                    <div style={{ height: "6px", width: "100%", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${progress}%`, background: "#1d5cff", transition: "width 0.2s ease" }} />
                    </div>
                  </div>
                )}

                {/* UNIFIED PRIMARY UPLOAD BUTTON FOR ALL 5 SECTIONS */}
                <button
                  type="button"
                  onClick={() => handleSectionUpload(cat, sec.title.replace(/^\d+\.\s*/, ""))}
                  disabled={uploading || !file}
                  className="user-primary-button"
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    opacity: !file || uploading ? 0.6 : 1,
                    minHeight: "40px"
                  }}
                >
                  {uploading ? <Loader2 className="animate-spin" size={16} /> : <UploadCloud size={16} />}
                  {uploading ? "Uploading..." : `Upload ${sec.title.replace(/^\d+\.\s*/, "")}`}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* TEAM-SHARED UPLOADED FILES TABLE WITH FILTERS & SEARCH */}
      <section className="user-erp-card user-table-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#1e293b" }}>Team Uploaded Files & Shared History</h2>
            <p style={{ margin: "4px 0 0", color: "#536987", fontSize: "0.85rem" }}>
              View all document uploads shared across your project team. Files display uploader names, sizes, and approval statuses.
            </p>
          </div>
          <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#475569" }}>
            Showing {filteredFiles.length} of {safeTeamFiles.length} files
          </span>
        </div>

        {/* HIGH VISIBILITY FILTERS & SEARCH ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "24px", background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div className="user-form-field">
            <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#1e293b", marginBottom: "6px", display: "block" }}>Search Files</span>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Search by filename or uploader..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: "36px", height: "40px", fontSize: "0.88rem", background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: "8px", width: "100%", boxSizing: "border-box" }}
              />
              <Search size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "#64748b" }} />
            </div>
          </div>

          <div className="user-form-field">
            <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#1e293b", marginBottom: "6px", display: "block" }}>Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ height: "40px", fontSize: "0.88rem", background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: "8px", width: "100%", boxSizing: "border-box" }}
            >
              <option value="All">All Categories</option>
              <option value="report">Project Reports</option>
              <option value="image">Event Images</option>
              <option value="document">Supporting Docs</option>
              <option value="bill">Bills & Receipts</option>
              <option value="uc">Utilization Certificate (UC)</option>
            </select>
          </div>

          <div className="user-form-field">
            <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#1e293b", marginBottom: "6px", display: "block" }}>Approval Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ height: "40px", fontSize: "0.88rem", background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: "8px", width: "100%", boxSizing: "border-box" }}
            >
              <option value="All">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="user-form-field">
            <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#1e293b", marginBottom: "6px", display: "block" }}>Uploaded By</span>
            <select
              value={uploaderFilter}
              onChange={(e) => setUploaderFilter(e.target.value)}
              style={{ height: "40px", fontSize: "0.88rem", background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: "8px", width: "100%", boxSizing: "border-box" }}
            >
              <option value="All">All Team Members</option>
              {uploaderNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* FILES TABLE */}
        {loadingFiles ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
            <Loader2 className="animate-spin" size={32} color="#1d5cff" />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="user-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Category</th>
                  <th>Uploaded By</th>
                  <th>Date & Time</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.length > 0 ? (
                  filteredFiles.map((file) => {
                    const fileDirectUrl = getFileUrl(file.filePath || file.file_path || file.url);
                    const displayName = file.originalFileName || file.original_file_name || file.fileName || file.file_name || "Uploaded File";
                    const uploaderName = file.uploadedByName || file.uploaded_by_name || "Team Member";
                    const createdAtVal = file.createdAt || file.created_at;
                    const dateStr = formatDateTime(createdAtVal);
                    const sizeBytes = file.fileSize ?? file.file_size ?? 0;

                    return (
                      <tr key={file.id}>
                        <td style={{ fontWeight: "600", color: "#1e293b" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <FileText size={16} color="#1d5cff" />
                            <span>{displayName}</span>
                          </div>
                          {(file.eventName || file.event_name) && (
                            <span style={{ fontSize: "0.75rem", color: "#8b5cf6", display: "block", marginTop: "2px" }}>
                              Event: {file.eventName || file.event_name}
                            </span>
                          )}
                        </td>

                        <td>
                          <span style={{ fontSize: "0.78rem", background: "#f1f5f9", padding: "3px 8px", borderRadius: "6px", textTransform: "uppercase", fontWeight: "700", color: "#475569" }}>
                            {file.category}
                          </span>
                        </td>

                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <UserCheck size={14} color="#10b981" />
                            <strong style={{ fontSize: "0.85rem", color: "#334155" }}>{uploaderName}</strong>
                          </div>
                        </td>

                        <td style={{ fontSize: "0.82rem", color: "#475569", fontWeight: "500" }}>
                          {dateStr}
                        </td>

                        <td style={{ fontSize: "0.82rem", color: "#475569", fontWeight: "500" }}>
                          {formatFileSize(sizeBytes)}
                        </td>

                        <td>{getStatusBadge(file.status, file.category)}</td>

                        <td style={{ textAlign: "center", whiteSpace: "nowrap", minWidth: "260px" }}>
                          <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "nowrap" }}>
                            {/* PREVIEW BUTTON */}
                            <button
                              type="button"
                              className="user-secondary-button"
                              onClick={() => setPreviewFile(file)}
                              title="Preview File"
                              style={{ minHeight: "32px", height: "32px", padding: "0 12px", fontSize: "0.78rem", display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap", flexShrink: 0 }}
                            >
                              <Eye size={14} />
                              Preview
                            </button>

                            {/* DOWNLOAD BUTTON - DIRECT FILE DOWNLOAD */}
                            <a
                              href={fileDirectUrl}
                              download={displayName}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="user-secondary-button"
                              title="Download File"
                              style={{ minHeight: "32px", height: "32px", padding: "0 12px", fontSize: "0.78rem", display: "inline-flex", alignItems: "center", gap: "4px", textDecoration: "none", color: "#1d5cff", whiteSpace: "nowrap", flexShrink: 0 }}
                            >
                              <Download size={14} />
                              Download
                            </a>

                            {/* EDIT BUTTON (FOR DRAFT OR PENDING BILLS) */}
                            {file.category === "bill" && (file.status === "DRAFT" || file.status === "PENDING") && (
                              <button
                                type="button"
                                className="user-secondary-button"
                                onClick={() => handleEditBill(file)}
                                title="Edit Bill & Transactions split"
                                style={{ minHeight: "32px", height: "32px", padding: "0 12px", fontSize: "0.78rem", background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a", borderRadius: "8px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap", flexShrink: 0 }}
                              >
                                Edit
                              </button>
                            )}

                            {/* DELETE BUTTON (BEFORE APPROVAL OR IF OWNER) */}
                            {(file.status === "PENDING" || file.status === "DRAFT" || file.category === "image" || file.category === "document") && (
                              <button
                                type="button"
                                onClick={() => handleDeleteFile(file.id, displayName)}
                                title="Delete File"
                                style={{ minHeight: "32px", height: "32px", padding: "0 12px", fontSize: "0.78rem", display: "inline-flex", alignItems: "center", gap: "4px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: "8px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                      No document uploads matching current filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* AUTO FILE PREVIEW MODAL */}
      {previewFile && (() => {
        const fileName = previewFile.originalFileName || previewFile.original_file_name || previewFile.fileName || previewFile.file_name || "Document";
        const uploaderName = previewFile.uploadedByName || previewFile.uploaded_by_name || "Team Member";
        const createdAtVal = previewFile.createdAt || previewFile.created_at;
        const dateStr = formatDateTime(createdAtVal);
        const sizeBytes = previewFile.fileSize ?? previewFile.file_size ?? 0;
        const filePath = previewFile.filePath || previewFile.file_path || previewFile.url || "";
        const fileDirectUrl = getFileUrl(filePath);
        const category = (previewFile.category || "").toLowerCase();
        const mimeType = (previewFile.mimeType || previewFile.mime_type || "").toLowerCase();

        const isImage = category === "image" || mimeType.startsWith("image") || /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(fileName) || /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(filePath);
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
              {/* Modal Header */}
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

              {/* Modal Content Preview */}
              <div style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "350px", background: "#f8fafc" }}>
                {isImage ? (
                  <img
                    src={fileDirectUrl}
                    alt={fileName}
                    style={{ maxWidth: "100%", maxHeight: "550px", borderRadius: "10px", objectFit: "contain", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/600x400?text=Preview+Not+Available";
                    }}
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
                    <h3 style={{ margin: "0 0 6px", color: "#1e293b", fontSize: "1.1rem" }}>Document Preview</h3>
                    <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: "0.88rem" }}>
                      File: <strong>{fileName}</strong> ({formatFileSize(sizeBytes)})
                    </p>
                    <a
                      href={fileDirectUrl}
                      download={fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="user-primary-button"
                      style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px" }}
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

      {/* BILL TRANSACTION SPLITTING CONFIG MODAL */}
      {isBillModalOpen && (() => {
        const CATEGORIES = projectCategories.length > 0 ? projectCategories.map(c => c.category) : ["Travel", "Food", "Venue", "Marketing", "Printing", "Equipment", "Miscellaneous"];
        const totalBillNum = parseFloat(billTotalAmount) || 0;
        const sumEntered = transactionMode === "single"
          ? totalBillNum
          : splitTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        const isAmountMatching = Math.abs(sumEntered - totalBillNum) < 0.01;
        const hasDuplicates = transactionMode === "multiple" && splitTransactions.some((t1, i) =>
          splitTransactions.some((t2, j) =>
            i !== j &&
            t1.category === t2.category &&
            t1.description.trim().toLowerCase() === t2.description.trim().toLowerCase() &&
            t1.amount === t2.amount
          )
        );
        const anyExceeds = transactionMode === "multiple" && splitTransactions.some(t => (parseFloat(t.amount) || 0) > totalBillNum);
        const anyInvalid = transactionMode === "multiple" && splitTransactions.some(t => (parseFloat(t.amount) || 0) <= 0);
        const isListEmpty = transactionMode === "multiple" && splitTransactions.length === 0;

        const isValid = totalBillNum > 0 && isAmountMatching && !hasDuplicates && !anyExceeds && !anyInvalid && !isListEmpty;

        // Preview setup
        let filePreviewUrl = "";
        let isImage = false;
        let isPdf = false;
        const sizeBytes = billFile ? billFile.size : 0;
        if (billFile) {
          filePreviewUrl = billFilePreviewUrl;
          const name = billFile.name.toLowerCase();
          isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(name);
          isPdf = name.endsWith(".pdf");
        } else if (billId) {
          const matchFile = safeTeamFiles.find(f => f.id === billId);
          if (matchFile) {
            filePreviewUrl = getFileUrl(matchFile.filePath || matchFile.file_path || matchFile.url);
            const name = (matchFile.originalFileName || matchFile.original_file_name || "").toLowerCase();
            isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(name);
            isPdf = name.endsWith(".pdf");
          }
        }

        return (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99980,
              background: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px"
            }}
            onClick={handleCloseBillModal}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "1000px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                display: "flex",
                flexDirection: "column",
                border: "1px solid #e2e8f0"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "#1e293b" }}>
                    {billId ? "Edit Bill & Transactions split" : "Configure Bill & Transactions split"}
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    Configure how this expense bill is allocated and accounted for.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCloseBillModal}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
                >
                  <X size={22} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "24px", overflowY: "auto" }}>
                
                {/* Left Column: File Preview & Info */}
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  <div>
                    <h4 style={{ margin: "0 0 8px", fontSize: "0.95rem", fontWeight: "700", color: "#334155" }}>File Preview</h4>
                    <div style={{ height: "260px", background: "#f1f5f9", borderRadius: "10px", overflow: "hidden", border: "1px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {filePreviewUrl ? (
                        isImage ? (
                          <img src={filePreviewUrl} alt="Bill Preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        ) : isPdf ? (
                          <iframe src={filePreviewUrl} title="Bill PDF Preview" style={{ width: "100%", height: "100%", border: "none" }} />
                        ) : (
                          <div style={{ textAlign: "center", padding: "20px" }}>
                            <FileText size={48} color="#64748b" />
                            <p style={{ margin: "8px 0 0", fontSize: "0.8rem", color: "#64748b" }}>PDF or Image preview not supported. File ready for upload.</p>
                          </div>
                        )
                      ) : (
                        <div style={{ textAlign: "center", color: "#94a3b8" }}>
                          <UploadCloud size={40} />
                          <p style={{ margin: "8px 0 0", fontSize: "0.8rem" }}>No file loaded.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                      Total Bill Amount (Rs) <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={billTotalAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBillTotalAmount(val);
                        setLocalActivityHistory(prev => [
                          ...prev,
                          `[${new Date().toLocaleTimeString()}] Updated bill total amount: Rs ${val}`
                        ]);
                      }}
                      style={{ width: "100%", padding: "10px 14px", fontSize: "0.9rem", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                {/* Right Column: Split Config */}
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  {/* Mode Selector */}
                  <div>
                    <span style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#475569", marginBottom: "8px" }}>
                      Transaction Mode
                    </span>
                    <div style={{ display: "flex", gap: "10px", background: "#f1f5f9", padding: "4px", borderRadius: "8px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setTransactionMode("single");
                          setLocalActivityHistory(prev => [
                            ...prev,
                            `[${new Date().toLocaleTimeString()}] Switched mode to Single Transaction`
                          ]);
                        }}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "none",
                          fontSize: "0.85rem",
                          fontWeight: "700",
                          background: transactionMode === "single" ? "#ffffff" : "transparent",
                          color: transactionMode === "single" ? "#1d5cff" : "#64748b",
                          boxShadow: transactionMode === "single" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        Single Transaction
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTransactionMode("multiple");
                          setLocalActivityHistory(prev => [
                            ...prev,
                            `[${new Date().toLocaleTimeString()}] Switched mode to Multiple Transactions`
                          ]);
                        }}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "none",
                          fontSize: "0.85rem",
                          fontWeight: "700",
                          background: transactionMode === "multiple" ? "#ffffff" : "transparent",
                          color: transactionMode === "multiple" ? "#1d5cff" : "#64748b",
                          boxShadow: transactionMode === "multiple" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        Multiple Transactions (Split)
                      </button>
                    </div>
                  </div>

                  {/* Mode Forms */}
                  {transactionMode === "single" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                          Transaction Category <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <select
                          value={singleCategory}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSingleCategory(val);
                            setLocalActivityHistory(prev => [
                              ...prev,
                              `[${new Date().toLocaleTimeString()}] Selected category: ${val}`
                            ]);
                          }}
                          style={{ width: "100%", padding: "10px", fontSize: "0.88rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        >
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                          Description / Remarks
                        </label>
                        <textarea
                          placeholder="e.g. Travel tickets reimbursement"
                          value={singleRemarks}
                          onChange={(e) => setSingleRemarks(e.target.value)}
                          rows={3}
                          style={{ width: "100%", padding: "10px", fontSize: "0.88rem", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h5 style={{ margin: 0, fontSize: "0.9rem", fontWeight: "700", color: "#334155" }}>Split Transactions</h5>
                        <button
                          type="button"
                          onClick={() => {
                            const nextId = splitTransactions.length ? Math.max(...splitTransactions.map(t => t.id)) + 1 : 1;
                            setSplitTransactions(prev => [...prev, { id: nextId, category: "Travel", description: "", amount: "" }]);
                            setLocalActivityHistory(prev => [
                              ...prev,
                              `[${new Date().toLocaleTimeString()}] Added split row`
                            ]);
                          }}
                          style={{ padding: "6px 12px", background: "#eff6ff", color: "#1d5cff", border: "none", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "700", cursor: "pointer" }}
                        >
                          + Add Row
                        </button>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "220px", overflowY: "auto", paddingRight: "4px" }}>
                        {splitTransactions.map((t, idx) => (
                          <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 80px 30px", gap: "8px", alignItems: "center", background: "#f8fafc", padding: "8px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <select
                              value={t.category}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSplitTransactions(prev => prev.map(item => item.id === t.id ? { ...item, category: val } : item));
                              }}
                              style={{ padding: "6px", fontSize: "0.82rem", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff" }}
                            >
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            <input
                              type="text"
                              placeholder="Description"
                              value={t.description}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSplitTransactions(prev => prev.map(item => item.id === t.id ? { ...item, description: val } : item));
                              }}
                              style={{ padding: "6px", fontSize: "0.82rem", borderRadius: "6px", border: "1px solid #cbd5e1", width: "100%", boxSizing: "border-box", background: "#ffffff" }}
                            />

                            <input
                              type="number"
                              placeholder="Amt"
                              value={t.amount}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSplitTransactions(prev => prev.map(item => item.id === t.id ? { ...item, amount: val } : item));
                              }}
                              style={{ padding: "6px", fontSize: "0.82rem", borderRadius: "6px", border: "1px solid #cbd5e1", width: "100%", boxSizing: "border-box", background: "#ffffff" }}
                            />

                            <button
                              type="button"
                              onClick={() => {
                                setSplitTransactions(prev => prev.filter(item => item.id !== t.id));
                                setLocalActivityHistory(prev => [
                                  ...prev,
                                  `[${new Date().toLocaleTimeString()}] Removed split row`
                                ]);
                              }}
                              disabled={splitTransactions.length <= 1}
                              style={{ background: "transparent", border: "none", cursor: splitTransactions.length <= 1 ? "not-allowed" : "pointer", color: "#ef4444", display: "flex", alignItems: "center", padding: 0 }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* live validation indicators */}
                  <div style={{ padding: "12px 16px", borderRadius: "8px", border: "1px solid", background: isAmountMatching ? "#f0fdf4" : "#fffbeb", borderColor: isAmountMatching ? "#bbf7d0" : "#fde68a", color: isAmountMatching ? "#166534" : "#92400e", fontSize: "0.82rem", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "700" }}>
                      <span>Total Bill Amount:</span>
                      <span>Rs {totalBillNum.toLocaleString()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "700" }}>
                      <span>Sum Entered:</span>
                      <span>Rs {sumEntered.toLocaleString()}</span>
                    </div>
                    <hr style={{ margin: "6px 0", border: "none", borderTop: "1px solid", borderColor: isAmountMatching ? "#bbf7d0" : "#fde68a" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {isAmountMatching ? (
                        <span>✓ Amounts match perfectly. Ready to submit.</span>
                      ) : (
                        <span>⚠ Sum of split transaction rows must equal the total bill amount. Diff: Rs {Math.abs(totalBillNum - sumEntered).toLocaleString()}</span>
                      )}
                    </div>
                    {hasDuplicates && (
                      <span style={{ color: "#ef4444", fontWeight: "600", marginTop: "4px" }}>⚠ Duplicate transaction rows detected (Category + Description + Amount).</span>
                    )}
                    {anyExceeds && (
                      <span style={{ color: "#ef4444", fontWeight: "600", marginTop: "4px" }}>⚠ A split amount cannot exceed the total bill amount.</span>
                    )}
                    {anyInvalid && (
                      <span style={{ color: "#ef4444", fontWeight: "600", marginTop: "4px" }}>⚠ Amounts must be greater than zero.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Activity History Drawer */}
              <div style={{ borderTop: "1px solid #e2e8f0", padding: "12px 24px", background: "#f8fafc" }}>
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  style={{ background: "transparent", border: "none", color: "#475569", fontSize: "0.78rem", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: 0 }}
                >
                  {showHistory ? "▼ Hide Activity Logs" : "▶ Show Activity Logs"}
                </button>
                {showHistory && (
                  <div style={{ marginTop: "8px", maxHeight: "100px", overflowY: "auto", background: "#ffffff", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.75rem", fontFamily: "monospace", color: "#64748b", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {localActivityHistory.map((h, i) => <div key={i}>{h}</div>)}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{ padding: "18px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "#f8fafc" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#10b981", fontSize: "0.8rem", fontWeight: "600" }}>
                  <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", animation: "pulse 1.5s infinite" }} />
                  <span>Draft saved locally.</span>
                </div>
                
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={handleCloseBillModal}
                    className="user-secondary-button"
                    style={{ minHeight: "40px" }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBillSubmit("DRAFT")}
                    className="user-secondary-button"
                    style={{ minHeight: "40px", borderColor: "#cfd9e8", color: "#475569" }}
                  >
                    Save as Draft
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBillSubmit("PENDING")}
                    disabled={!isValid}
                    className="user-primary-button"
                    style={{ minHeight: "40px", background: isValid ? "linear-gradient(135deg, #1d5cff, #0f46d8)" : "#cbd5e1", color: isValid ? "#ffffff" : "#94a3b8", border: "none", cursor: isValid ? "pointer" : "not-allowed", opacity: isValid ? 1 : 0.7 }}
                  >
                    Submit for Approval
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </main>
  );
}

export default Reports;

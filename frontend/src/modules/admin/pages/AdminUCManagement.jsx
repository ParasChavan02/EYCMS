import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileCheck,
  Plus,
  Trash2,
  Save,
  Eye,
  Download,
  Printer,
  RefreshCw,
  Upload,
  FileText,
  FileUp,
  CheckCircle2,
  XCircle,
  FileStack,
  PenLine,
  Layers3,
  Building2,
  BadgeIndianRupee,
  Users,
  History,
  ArrowRightCircle,
  Edit3,
  Search,
  ShieldCheck,
  Send,
  AlertTriangle,
  FileSearch,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { reportService, getFileUrl, formatDateTime } from "../../../services/reportService";
import { ucAdminService } from "../services/ucAdminService";
import { useNotification } from "../../common/hooks/useNotification";
import "../../../styles/admin-management.css";

const blankRow = () => ({
  head: "",
  opening_balance: "",
  grant_received: "",
  total_available: "",
  actual_expenditure: "",
  balance: "",
  remarks: "",
  sort_order: 0,
});

const blankCommittedRow = () => ({
  head_of_expenditure: "",
  particulars: "",
  tentative_amount: "",
  contribution: "",
  expected_expenditure_date: "",
  sort_order: 0,
});

const blankAssetRow = () => ({
  item: "",
  budget_cost: "",
  actual_cost: "",
  contribution: "",
  procurement_date: "",
  insurance_period: "",
  insurance_amount: "",
  beneficiary: "",
  sort_order: 0,
});

const blankManpowerRow = () => ({
  employee_name: "",
  qualification: "",
  designation: "",
  joining_date: "",
  salary_period: "",
  monthly_salary: "",
  total_paid: "",
  sort_order: 0,
});

const blankDraft = () => ({
  id: null,
  project_id: "",
  reference_no: "",
  project_title: "",
  organization: "",
  project_coordinator: "",
  sanction_order_no: "",
  project_start_date: "",
  project_end_date: "",
  bank_account_number: "",
  financial_year: "",
  reporting_period_from: "",
  reporting_period_to: "",
  notes: "",
  financial_summary: {
    opening_balance: "",
    grant_received: "",
    interest_earned: "",
    other_receipts: "",
    total_available_funds: "",
    actual_expenditure: "",
    refunded_amount: "",
    closing_balance: "",
    amount_carried_forward: "",
  },
  soe_rows: [blankRow()],
  committed_rows: [blankCommittedRow()],
  capital_assets: [],
  manpower_details: [],
  supporting_documents: [],
  versions: [],
  generated_pdf_path: "",
  generated_pdf_file_name: "",
  status: "DRAFT",
  version: 1,
});

const documentTypeOptions = [
  "UC PDF",
  "SOE",
  "Invoices",
  "Bills",
  "Purchase Orders",
  "Quotations",
  "Assets List",
  "Any Supporting Documents",
];

const tabs = [
  { id: "create", label: "Create New UC", icon: PenLine },
  { id: "my", label: "My UCs", icon: Layers3 },
  { id: "submitted", label: "User Submitted UCs", icon: FileSearch },
];

const toMoney = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return "0.00";
  return n.toFixed(2);
};

const toDisplayDate = (value) => {
  if (!value) return "N/A";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
};

const mapApiRecordToDraft = (record) => {
  if (!record) return blankDraft();
  return {
    ...blankDraft(),
    id: record.id || null,
    project_id: record.project_id || "",
    reference_no: record.reference_no || "",
    project_title: record.project_title || "",
    organization: record.organization || "",
    project_coordinator: record.project_coordinator || "",
    sanction_order_no: record.sanction_order_no || "",
    project_start_date: record.project_start_date || "",
    project_end_date: record.project_end_date || "",
    bank_account_number: record.bank_account_number || "",
    financial_year: record.financial_year || "",
    reporting_period_from: record.reporting_period_from || "",
    reporting_period_to: record.reporting_period_to || "",
    notes: record.notes || "",
    financial_summary: {
      opening_balance: record.financial_summary?.opening_balance ?? "",
      grant_received: record.financial_summary?.grant_received ?? "",
      interest_earned: record.financial_summary?.interest_earned ?? "",
      other_receipts: record.financial_summary?.other_receipts ?? "",
      total_available_funds: record.financial_summary?.total_available_funds ?? "",
      actual_expenditure: record.financial_summary?.actual_expenditure ?? "",
      refunded_amount: record.financial_summary?.refunded_amount ?? "",
      closing_balance: record.financial_summary?.closing_balance ?? "",
      amount_carried_forward: record.financial_summary?.amount_carried_forward ?? "",
    },
    soe_rows: Array.isArray(record.soe_rows) && record.soe_rows.length ? record.soe_rows.map((row) => ({ ...blankRow(), ...row })) : [blankRow()],
    committed_rows: Array.isArray(record.committed_rows) && record.committed_rows.length ? record.committed_rows.map((row) => ({ ...blankCommittedRow(), ...row })) : [blankCommittedRow()],
    capital_assets: Array.isArray(record.capital_assets) ? record.capital_assets.map((row) => ({ ...blankAssetRow(), ...row })) : [],
    manpower_details: Array.isArray(record.manpower_details) ? record.manpower_details.map((row) => ({ ...blankManpowerRow(), ...row })) : [],
    supporting_documents: Array.isArray(record.supporting_documents) ? record.supporting_documents : [],
    versions: Array.isArray(record.versions) ? record.versions : [],
    generated_pdf_path: record.generated_pdf_path || "",
    generated_pdf_file_name: record.generated_pdf_file_name || "",
    status: record.status || "DRAFT",
    version: record.version || 1,
  };
};

export default function AdminUCManagement() {
  const { addNotification } = useNotification();
  const [activeTab, setActiveTab] = useState("create");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [officialRecords, setOfficialRecords] = useState([]);
  const [submittedFiles, setSubmittedFiles] = useState([]);
  const [draft, setDraft] = useState(blankDraft());
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [versionModal, setVersionModal] = useState(null);

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [official, submitted] = await Promise.all([
        ucAdminService.listRecords(),
        reportService.getAdminFiles("uc"),
      ]);
      setOfficialRecords(Array.isArray(official) ? official : []);
      setSubmittedFiles(Array.isArray(submitted) ? submitted : []);
      if (isManual) addNotification("UC data refreshed.", "info", 1600, false);
    } catch (error) {
      console.error("Failed to load UC data:", error);
      if (isManual) addNotification("Failed to refresh UC data.", "error", 1800, false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addNotification]);

  useEffect(() => {
    void (async () => {
      await loadData();
    })();
  }, [loadData]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const safeOfficialRecords = useMemo(() => (Array.isArray(officialRecords) ? officialRecords : []), [officialRecords]);
  const safeSubmittedFiles = useMemo(() => (Array.isArray(submittedFiles) ? submittedFiles : []), [submittedFiles]);

  const filteredOfficialRecords = useMemo(() => {
    const s = search.trim().toLowerCase();
    return safeOfficialRecords.filter((item) => {
      if (!item) return false;
      const matchesSearch =
        !s ||
        [item.reference_no, item.project_title, item.organization, item.project_coordinator, item.financial_year]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(s));
      const matchesStatus = statusFilter === "ALL" || String(item.status || "").toUpperCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [safeOfficialRecords, search, statusFilter]);

  const filteredSubmittedFiles = useMemo(() => {
    const s = submittedSearch.trim().toLowerCase();
    return safeSubmittedFiles.filter((item) => {
      if (!item) return false;
      const fileName = item.originalFileName || item.original_file_name || item.fileName || item.file_name || "";
      const uploaderName = item.uploadedByName || item.uploaded_by_name || "";
      const projectId = item.projectId || item.project_id || "";
      const teamId = item.teamId || item.team_id || "";
      const status = item.status || "";
      const matchesSearch =
        !s ||
        [fileName, uploaderName, projectId, teamId]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(s));
      const matchesStatus = statusFilter === "ALL" || String(status || "").toUpperCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [safeSubmittedFiles, submittedSearch, statusFilter]);

  const updateDraftField = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }));

  const updateNestedField = (section, field, value) =>
    setDraft((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));

  const updateArrayRow = (section, index, field, value) =>
    setDraft((prev) => ({
      ...prev,
      [section]: prev[section].map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    }));

  const addRow = (section, template) =>
    setDraft((prev) => ({
      ...prev,
      [section]: [...prev[section], template()],
    }));

  const deleteRow = (section, index, minimum = 0) =>
    setDraft((prev) => {
      const rows = prev[section].filter((_, rowIndex) => rowIndex !== index);
      if (rows.length < minimum) return prev;
      return { ...prev, [section]: rows };
    });

  const resetDraft = () => setDraft(blankDraft());

  const persistDraft = async () => {
    const payload = {
      ...draft,
      project_id: draft.project_id || null,
    };

    if (!draft.id) {
      const created = await ucAdminService.createRecord(payload);
      setDraft(mapApiRecordToDraft(created));
      return created;
    }

    const updated = await ucAdminService.updateRecord(draft.id, {
      ...payload,
      change_note: "Saved draft changes",
    });
    setDraft(mapApiRecordToDraft(updated));
    return updated;
  };

  const buildPdfBlob = async (recordLike = draft) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 36;
    let cursorY = 44;

    const addHeader = () => {
      doc.setFillColor(14, 116, 144);
      doc.rect(0, 0, pageWidth, 78, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("BIRAC / E-YUVA UTILIZATION CERTIFICATE", margin, 34);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Official UC Generation | Reference No. ${recordLike.reference_no || "Draft"}`, margin, 54);
      doc.text(`Version ${recordLike.version || 1} | Status ${recordLike.status || "DRAFT"}`, pageWidth - margin, 54, { align: "right" });
      doc.setTextColor(15, 23, 42);
      cursorY = 96;
    };

    const addSectionTitle = (title) => {
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 20, 4, 4, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(title, margin + 8, cursorY + 14);
      cursorY += 30;
    };

    const addPairTable = (rows) => {
      autoTable(doc, {
        startY: cursorY,
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 5, valign: "middle", textColor: [15, 23, 42] },
        headStyles: { fillColor: [14, 116, 144], textColor: [255, 255, 255] },
        body: rows,
        columnStyles: {
          0: { cellWidth: 165, fontStyle: "bold", fillColor: [248, 250, 252] },
          1: { cellWidth: pageWidth - margin * 2 - 165 },
        },
        margin: { left: margin, right: margin },
      });
      cursorY = doc.lastAutoTable.finalY + 16;
    };

    addHeader();

    addSectionTitle("Project Details");
    addPairTable([
      ["Project Reference No.", recordLike.reference_no || "-"],
      ["Project Title", recordLike.project_title || "-"],
      ["Organization", recordLike.organization || "-"],
      ["Project Coordinator", recordLike.project_coordinator || "-"],
      ["Sanction Order No.", recordLike.sanction_order_no || "-"],
      ["Project Start Date", toDisplayDate(recordLike.project_start_date)],
      ["Project End Date", toDisplayDate(recordLike.project_end_date)],
      ["Bank Account Number", recordLike.bank_account_number || "-"],
      ["Financial Year", recordLike.financial_year || "-"],
      ["Reporting Period", `${toDisplayDate(recordLike.reporting_period_from)} to ${toDisplayDate(recordLike.reporting_period_to)}`],
    ]);

    addSectionTitle("Financial Summary");
    autoTable(doc, {
      startY: cursorY,
      theme: "grid",
      head: [["Opening Balance", "Grant Received", "Interest Earned", "Other Receipts", "Total Funds", "Actual Expenditure", "Refunded Amount", "Closing Balance", "Carried Forward"]],
      body: [[
        toMoney(recordLike.financial_summary?.opening_balance),
        toMoney(recordLike.financial_summary?.grant_received),
        toMoney(recordLike.financial_summary?.interest_earned),
        toMoney(recordLike.financial_summary?.other_receipts),
        toMoney(recordLike.financial_summary?.total_available_funds),
        toMoney(recordLike.financial_summary?.actual_expenditure),
        toMoney(recordLike.financial_summary?.refunded_amount),
        toMoney(recordLike.financial_summary?.closing_balance),
        toMoney(recordLike.financial_summary?.amount_carried_forward),
      ]],
      styles: { fontSize: 8, cellPadding: 4, halign: "center" },
      headStyles: { fillColor: [20, 83, 45], textColor: [255, 255, 255] },
      margin: { left: margin, right: margin },
    });
    cursorY = doc.lastAutoTable.finalY + 16;

    if (recordLike.soe_rows?.length) {
      addSectionTitle("Statement of Expenditure");
      autoTable(doc, {
        startY: cursorY,
        theme: "grid",
        head: [["Head", "Opening", "Grant", "Total", "Actual", "Balance", "Remarks"]],
        body: recordLike.soe_rows.map((row) => [
          row.head || "-",
          toMoney(row.opening_balance),
          toMoney(row.grant_received),
          toMoney(row.total_available),
          toMoney(row.actual_expenditure),
          toMoney(row.balance),
          row.remarks || "-",
        ]),
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [14, 116, 144], textColor: [255, 255, 255] },
        margin: { left: margin, right: margin },
      });
      cursorY = doc.lastAutoTable.finalY + 16;
    }

    if (recordLike.committed_rows?.length) {
      addSectionTitle("Details of Committed Expenditure");
      autoTable(doc, {
        startY: cursorY,
        theme: "grid",
        head: [["Head of Expenditure", "Particulars", "Tentative Amount", "Contribution", "Expected Date"]],
        body: recordLike.committed_rows.map((row) => [
          row.head_of_expenditure || "-",
          row.particulars || "-",
          toMoney(row.tentative_amount),
          toMoney(row.contribution),
          toDisplayDate(row.expected_expenditure_date),
        ]),
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255] },
        margin: { left: margin, right: margin },
      });
      cursorY = doc.lastAutoTable.finalY + 16;
    }

    if (recordLike.capital_assets?.length) {
      addSectionTitle("Detail of Capital Assets");
      autoTable(doc, {
        startY: cursorY,
        theme: "grid",
        head: [["Item", "Budget Cost", "Actual Cost", "Contribution", "Procurement Date", "Insurance Period", "Insurance Amount", "Beneficiary"]],
        body: recordLike.capital_assets.map((row) => [
          row.item || "-",
          toMoney(row.budget_cost),
          toMoney(row.actual_cost),
          toMoney(row.contribution),
          toDisplayDate(row.procurement_date),
          row.insurance_period || "-",
          toMoney(row.insurance_amount),
          row.beneficiary || "-",
        ]),
        styles: { fontSize: 7, cellPadding: 3 },
        headStyles: { fillColor: [124, 45, 18], textColor: [255, 255, 255] },
        margin: { left: margin, right: margin },
      });
      cursorY = doc.lastAutoTable.finalY + 16;
    }

    if (recordLike.manpower_details?.length) {
      addSectionTitle("Manpower Details");
      autoTable(doc, {
        startY: cursorY,
        theme: "grid",
        head: [["Employee Name", "Qualification", "Designation", "Joining Date", "Salary Period", "Monthly Salary", "Total Paid"]],
        body: recordLike.manpower_details.map((row) => [
          row.employee_name || "-",
          row.qualification || "-",
          row.designation || "-",
          toDisplayDate(row.joining_date),
          row.salary_period || "-",
          toMoney(row.monthly_salary),
          toMoney(row.total_paid),
        ]),
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [7, 89, 133], textColor: [255, 255, 255] },
        margin: { left: margin, right: margin },
      });
      cursorY = doc.lastAutoTable.finalY + 16;
    }

    addSectionTitle("Certification");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      "Certified that the above utilization statement is true and correct to the best of our knowledge and the expenditure has been incurred for the purpose sanctioned.",
      margin,
      cursorY,
      { maxWidth: pageWidth - margin * 2, align: "justify" }
    );
    cursorY += 42;

    const signatureLines = [
      ["Finance Officer", "Project Coordinator", "Registrar", "Chartered Accountant"],
      ["Membership Number", "UDIN Number", "Date", ""],
    ];
    autoTable(doc, {
      startY: cursorY,
      theme: "plain",
      body: signatureLines,
      styles: { fontSize: 9, cellPadding: 6, textColor: [15, 23, 42] },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 120 },
        2: { cellWidth: 120 },
        3: { cellWidth: 120 },
      },
      didDrawCell: (data) => {
        if (data.section === "body" && data.row.index === 0) {
          const y = data.cell.y + data.cell.height - 3;
          doc.setDrawColor(100, 116, 139);
          doc.line(data.cell.x + 5, y, data.cell.x + data.cell.width - 5, y);
        }
      },
      margin: { left: margin, right: margin },
    });

    return doc.output("blob");
  };

  const pushPreviewBlob = (blob) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    return url;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const saved = await persistDraft();
      addNotification(`UC draft ${saved.reference_no || ""} saved successfully.`, "success", 1800, false);
    } catch (error) {
      console.error(error);
      addNotification(error?.response?.data?.detail?.message || error?.response?.data?.detail || "Failed to save UC draft.", "error", 2200, false);
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePdf = async (shouldDownload = false) => {
    setSaving(true);
    try {
      const saved = await persistDraft();
      const blob = await buildPdfBlob(saved);
      pushPreviewBlob(blob);
      const fileName = `${(saved.reference_no || "official_uc").replace(/\s+/g, "_")}.pdf`;
      await ucAdminService.uploadGeneratedPdf(saved.id, blob, fileName);
      await loadData();
      addNotification("Official UC PDF generated and stored securely.", "success", 2200, false);
      if (shouldDownload) {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      }
    } catch (error) {
      console.error(error);
      addNotification(error?.response?.data?.detail || "Failed to generate UC PDF.", "error", 2400, false);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    try {
      const blob = await buildPdfBlob(draft.id ? draft : { ...draft, version: 1, status: "DRAFT" });
      const url = pushPreviewBlob(blob);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
      addNotification("Could not open preview.", "error", 1800, false);
    }
  };

  const handlePrint = async () => {
    try {
      const blob = await buildPdfBlob(draft);
      const url = pushPreviewBlob(blob);
      const win = window.open(url, "_blank", "noopener,noreferrer");
      if (win) {
        win.addEventListener("load", () => win.print(), { once: true });
      }
    } catch (error) {
      console.error(error);
      addNotification("Could not start print flow.", "error", 1800, false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const saved = await persistDraft();
      const submitted = await ucAdminService.submitRecord(saved.id);
      setDraft(mapApiRecordToDraft(submitted));
      await loadData();
      setActiveTab("my");
      addNotification("UC submitted successfully for official record keeping.", "success", 2200, false);
    } catch (error) {
      console.error(error);
      addNotification(error?.response?.data?.detail?.message || error?.response?.data?.detail || "Submission failed. Check required fields and generated PDF first.", "error", 2500, false);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadSupportingDocuments = async (fileList, documentType) => {
    if (!draft.id) {
      addNotification("Save the draft first before uploading supporting documents.", "warning", 2200, false);
      return;
    }

    try {
      const uploads = Array.from(fileList || []);
      for (const file of uploads) {
        await ucAdminService.uploadSupportingDocument(draft.id, file, documentType);
      }
      const refreshed = await ucAdminService.getRecord(draft.id);
      setDraft(mapApiRecordToDraft(refreshed));
      await loadData();
      addNotification("Supporting documents uploaded.", "success", 1800, false);
    } catch (error) {
      console.error(error);
      addNotification("Failed to upload supporting documents.", "error", 2000, false);
    }
  };

  const startEditRecord = (record) => {
    setDraft(mapApiRecordToDraft(record));
    setActiveTab("create");
  };

  const loadRecordVersions = async (recordId) => {
    try {
      const versions = await ucAdminService.listVersions(recordId);
      setVersionModal({ recordId, versions });
    } catch (error) {
      console.error(error);
      addNotification("Could not load version history.", "error", 1800, false);
    }
  };

  const downloadStoredPdf = (record) => {
    if (record.generated_pdf_path) {
      window.open(getFileUrl(record.generated_pdf_path), "_blank", "noopener,noreferrer");
      return;
    }
    addNotification("No stored PDF is available for download yet.", "warning", 1800, false);
  };

  const updateSubmittedStatus = async (fileId, newStatus, fileName) => {
    try {
      await reportService.updateFileStatus(fileId, newStatus);
      addNotification(`Utilization Certificate '${fileName}' marked as ${newStatus}.`, "success", 1800, false);
      await loadData();
    } catch (error) {
      console.error(error);
      addNotification("Failed to update UC status.", "error", 1800, false);
    }
  };

  const getStatusBadge = (status) => {
    switch (String(status || "").toUpperCase()) {
      case "APPROVED":
        return <span className="sp-badge-approved">Approved</span>;
      case "REJECTED":
        return <span className="sp-badge-rejected">Rejected</span>;
      case "VERIFIED":
        return <span className="sp-badge-approved">Verified</span>;
      case "REVISION_REQUESTED":
        return <span className="sp-badge-pending">Revision Requested</span>;
      case "SUBMITTED":
        return <span className="sp-badge-pending">Submitted</span>;
      default:
        return <span className="sp-badge-pending">Draft</span>;
    }
  };

  const renderSectionCard = (title, icon, children, accent = "#0f766e") => {
    const Icon = icon;
    return (
      <section style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 18, marginBottom: 18, boxShadow: "0 4px 12px rgba(15,23,42,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: `${accent}14`, display: "grid", placeItems: "center", color: accent }}>
            <Icon size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", color: "#0f172a" }}>{title}</h3>
          </div>
        </div>
        {children}
      </section>
    );
  };

  return (
    <main style={{ padding: 28, minHeight: "calc(100vh - 60px)", background: "linear-gradient(180deg, #f8fafc 0%, #eef6fb 100%)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.95rem", fontWeight: 900, color: "#0f172a", display: "flex", alignItems: "center", gap: 12 }}>
            <FileCheck size={28} color="#0f766e" />
            Utilization Certificate Management
          </h1>
          <p style={{ margin: "6px 0 0", color: "#475569", maxWidth: 860 }}>
            Create official BIRAC / E-YUVA Utilization Certificates, manage drafts and version history, generate printable PDFs, and continue reviewing user-submitted UC files.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={() => loadData(true)} disabled={refreshing} className="sp-btn sp-btn-secondary">
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh UC Data"}
          </button>
          <button type="button" onClick={() => { resetDraft(); setActiveTab("create"); }} className="sp-btn sp-btn-primary">
            <Plus size={16} />
            Create New UC
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                border: active ? "1px solid #0f766e" : "1px solid #cbd5e1",
                background: active ? "#0f766e" : "#ffffff",
                color: active ? "#ffffff" : "#0f172a",
                padding: "11px 16px",
                borderRadius: 999,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "create" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(320px, 0.8fr)", gap: 18, alignItems: "start" }}>
          <div>
            {renderSectionCard("Project Details", Building2, (
              <div className="uc-grid">
                {[
                  ["Project Reference No.", "reference_no"],
                  ["Project Title", "project_title"],
                  ["Organization", "organization"],
                  ["Project Coordinator", "project_coordinator"],
                  ["Sanction Order No.", "sanction_order_no"],
                  ["Bank Account Number", "bank_account_number"],
                  ["Financial Year", "financial_year"],
                  ["Project ID", "project_id"],
                ].map(([label, field]) => (
                  <label key={field} className="uc-field">
                    <span>{label}</span>
                    <input value={draft[field]} onChange={(e) => updateDraftField(field, e.target.value)} />
                  </label>
                ))}
                <label className="uc-field">
                  <span>Project Start Date</span>
                  <input type="date" value={draft.project_start_date} onChange={(e) => updateDraftField("project_start_date", e.target.value)} />
                </label>
                <label className="uc-field">
                  <span>Project End Date</span>
                  <input type="date" value={draft.project_end_date} onChange={(e) => updateDraftField("project_end_date", e.target.value)} />
                </label>
                <label className="uc-field">
                  <span>Reporting Period From</span>
                  <input type="date" value={draft.reporting_period_from} onChange={(e) => updateDraftField("reporting_period_from", e.target.value)} />
                </label>
                <label className="uc-field">
                  <span>Reporting Period To</span>
                  <input type="date" value={draft.reporting_period_to} onChange={(e) => updateDraftField("reporting_period_to", e.target.value)} />
                </label>
                <label className="uc-field uc-span-2">
                  <span>Notes</span>
                  <textarea rows={3} value={draft.notes} onChange={(e) => updateDraftField("notes", e.target.value)} placeholder="Optional internal note for the UC draft" />
                </label>
              </div>
            ))}

            {renderSectionCard("Financial Summary", BadgeIndianRupee, (
              <div className="uc-grid">
                {[
                  ["Opening Balance", "opening_balance"],
                  ["Grant Received", "grant_received"],
                  ["Interest Earned", "interest_earned"],
                  ["Other Receipts", "other_receipts"],
                  ["Total Available Funds", "total_available_funds"],
                  ["Actual Expenditure", "actual_expenditure"],
                  ["Refunded Amount", "refunded_amount"],
                  ["Closing Balance", "closing_balance"],
                  ["Amount Carried Forward", "amount_carried_forward"],
                ].map(([label, field]) => (
                  <label key={field} className="uc-field">
                    <span>{label}</span>
                    <input value={draft.financial_summary[field]} onChange={(e) => updateNestedField("financial_summary", field, e.target.value)} />
                  </label>
                ))}
              </div>
            ))}

            {renderSectionCard("Statement of Expenditure", FileStack, (
              <div style={{ display: "grid", gap: 12 }}>
                {draft.soe_rows.map((row, index) => (
                  <div key={`soe-${index}`} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 14, background: "#f8fafc" }}>
                    <div className="uc-grid">
                      {[
                        ["Head", "head"],
                        ["Opening Balance", "opening_balance"],
                        ["Grant Received", "grant_received"],
                        ["Total Available", "total_available"],
                        ["Actual Expenditure", "actual_expenditure"],
                        ["Balance", "balance"],
                      ].map(([label, field]) => (
                        <label key={field} className="uc-field">
                          <span>{label}</span>
                          <input value={row[field]} onChange={(e) => updateArrayRow("soe_rows", index, field, e.target.value)} />
                        </label>
                      ))}
                      <label className="uc-field uc-span-2">
                        <span>Remarks</span>
                        <input value={row.remarks} onChange={(e) => updateArrayRow("soe_rows", index, "remarks", e.target.value)} />
                      </label>
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                      <button type="button" className="sp-btn sp-btn-secondary" onClick={() => addRow("soe_rows", blankRow)}>
                        <Plus size={14} />
                        Add Row
                      </button>
                      <button type="button" className="sp-btn sp-btn-danger" onClick={() => deleteRow("soe_rows", index, 1)}>
                        <Trash2 size={14} />
                        Delete Row
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {renderSectionCard("Committed Expenditure", Layers3, (
              <div style={{ display: "grid", gap: 12 }}>
                {draft.committed_rows.map((row, index) => (
                  <div key={`committed-${index}`} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 14, background: "#f8fafc" }}>
                    <div className="uc-grid">
                      {[
                        ["Head of Expenditure", "head_of_expenditure"],
                        ["Particulars", "particulars"],
                        ["Tentative Amount", "tentative_amount"],
                        ["Contribution", "contribution"],
                      ].map(([label, field]) => (
                        <label key={field} className="uc-field">
                          <span>{label}</span>
                          <input value={row[field]} onChange={(e) => updateArrayRow("committed_rows", index, field, e.target.value)} />
                        </label>
                      ))}
                      <label className="uc-field">
                        <span>Expected Expenditure Date</span>
                        <input type="date" value={row.expected_expenditure_date} onChange={(e) => updateArrayRow("committed_rows", index, "expected_expenditure_date", e.target.value)} />
                      </label>
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                      <button type="button" className="sp-btn sp-btn-secondary" onClick={() => addRow("committed_rows", blankCommittedRow)}>
                        <Plus size={14} />
                        Add Row
                      </button>
                      <button type="button" className="sp-btn sp-btn-danger" onClick={() => deleteRow("committed_rows", index, 1)}>
                        <Trash2 size={14} />
                        Delete Row
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {renderSectionCard("Capital Assets", Building2, (
              <div style={{ display: "grid", gap: 12 }}>
                {draft.capital_assets.map((row, index) => (
                  <div key={`asset-${index}`} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 14, background: "#f8fafc" }}>
                    <div className="uc-grid">
                      {[
                        ["Item", "item"],
                        ["Budget Cost", "budget_cost"],
                        ["Actual Cost", "actual_cost"],
                        ["Contribution", "contribution"],
                        ["Insurance Period", "insurance_period"],
                        ["Insurance Amount", "insurance_amount"],
                        ["Beneficiary", "beneficiary"],
                      ].map(([label, field]) => (
                        <label key={field} className="uc-field">
                          <span>{label}</span>
                          <input value={row[field]} onChange={(e) => updateArrayRow("capital_assets", index, field, e.target.value)} />
                        </label>
                      ))}
                      <label className="uc-field">
                        <span>Procurement Date</span>
                        <input type="date" value={row.procurement_date} onChange={(e) => updateArrayRow("capital_assets", index, "procurement_date", e.target.value)} />
                      </label>
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                      <button type="button" className="sp-btn sp-btn-secondary" onClick={() => addRow("capital_assets", blankAssetRow)}>
                        <Plus size={14} />
                        Add Asset
                      </button>
                      <button type="button" className="sp-btn sp-btn-danger" onClick={() => deleteRow("capital_assets", index, 0)}>
                        <Trash2 size={14} />
                        Remove Asset
                      </button>
                    </div>
                  </div>
                ))}
                {!draft.capital_assets.length && (
                  <button type="button" className="sp-btn sp-btn-secondary" onClick={() => addRow("capital_assets", blankAssetRow)}>
                    <Plus size={14} />
                    Add Asset
                  </button>
                )}
              </div>
            ))}

            {renderSectionCard("Manpower Details", Users, (
              <div style={{ display: "grid", gap: 12 }}>
                {draft.manpower_details.map((row, index) => (
                  <div key={`manpower-${index}`} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 14, background: "#f8fafc" }}>
                    <div className="uc-grid">
                      {[
                        ["Employee Name", "employee_name"],
                        ["Qualification", "qualification"],
                        ["Designation", "designation"],
                        ["Salary Period", "salary_period"],
                        ["Monthly Salary", "monthly_salary"],
                        ["Total Paid", "total_paid"],
                      ].map(([label, field]) => (
                        <label key={field} className="uc-field">
                          <span>{label}</span>
                          <input value={row[field]} onChange={(e) => updateArrayRow("manpower_details", index, field, e.target.value)} />
                        </label>
                      ))}
                      <label className="uc-field">
                        <span>Joining Date</span>
                        <input type="date" value={row.joining_date} onChange={(e) => updateArrayRow("manpower_details", index, "joining_date", e.target.value)} />
                      </label>
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                      <button type="button" className="sp-btn sp-btn-secondary" onClick={() => addRow("manpower_details", blankManpowerRow)}>
                        <Plus size={14} />
                        Add Row
                      </button>
                      <button type="button" className="sp-btn sp-btn-danger" onClick={() => deleteRow("manpower_details", index, 0)}>
                        <Trash2 size={14} />
                        Remove Row
                      </button>
                    </div>
                  </div>
                ))}
                {!draft.manpower_details.length && (
                  <button type="button" className="sp-btn sp-btn-secondary" onClick={() => addRow("manpower_details", blankManpowerRow)}>
                    <Plus size={14} />
                    Add Manpower Row
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ position: "sticky", top: 20, display: "grid", gap: 18 }}>
            {renderSectionCard("Actions", ArrowRightCircle, (
              <div style={{ display: "grid", gap: 10 }}>
                <button type="button" className="sp-btn sp-btn-secondary" onClick={handleSaveDraft} disabled={saving}>
                  <Save size={16} />
                  Save Draft
                </button>
                <button type="button" className="sp-btn sp-btn-secondary" onClick={handlePreview} disabled={saving}>
                  <Eye size={16} />
                  Preview UC
                </button>
                <button type="button" className="sp-btn sp-btn-primary" onClick={() => handleGeneratePdf(true)} disabled={saving}>
                  <Download size={16} />
                  Generate PDF
                </button>
                <button type="button" className="sp-btn sp-btn-primary" onClick={handleSubmit} disabled={saving}>
                  <Send size={16} />
                  Submit UC
                </button>
                <button type="button" className="sp-btn sp-btn-secondary" onClick={() => handleGeneratePdf(false)} disabled={saving}>
                  <FileUp size={16} />
                  Generate and Store
                </button>
                <button type="button" className="sp-btn sp-btn-secondary" onClick={handlePrint} disabled={saving}>
                  <Printer size={16} />
                  Print UC
                </button>
              </div>
            ))}

            {renderSectionCard("Supporting Documents", Upload, (
              <div style={{ display: "grid", gap: 12 }}>
                <label className="uc-field">
                  <span>Document Type</span>
                  <select id="uc-support-type">
                    {documentTypeOptions.map((label) => (
                      <option key={label} value={label}>{label}</option>
                    ))}
                  </select>
                </label>
                <label className="uc-field">
                  <span>Upload files</span>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      const type = document.getElementById("uc-support-type")?.value || "Any Supporting Documents";
                      handleUploadSupportingDocuments(e.target.files, type);
                      e.target.value = "";
                    }}
                  />
                </label>
                <div style={{ display: "grid", gap: 8 }}>
                  {draft.supporting_documents.length ? draft.supporting_documents.map((doc) => (
                    <div key={doc.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 10, background: "#f8fafc" }}>
                      <strong style={{ display: "block", fontSize: 13 }}>{doc.original_file_name}</strong>
                      <span style={{ fontSize: 12, color: "#64748b" }}>{doc.document_type} | {toDisplayDate(doc.created_at)}</span>
                    </div>
                  )) : (
                    <div style={{ color: "#64748b", fontSize: 13 }}>No supporting documents uploaded yet.</div>
                  )}
                </div>
              </div>
            ))}

            <div style={{ background: "#ecfeff", border: "1px solid #a5f3fc", color: "#155e75", borderRadius: 16, padding: 16, display: "grid", gap: 8 }}>
              <strong style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={16} />
                Submission checklist
              </strong>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                <div>Save the draft before uploading supporting documents.</div>
                <div>Generate and store the PDF before submission.</div>
                <div>Validate project, financial summary, and SOE rows before final submission.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "my" && (
        <>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 18, marginBottom: 18, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by reference number, title, organization..." style={{ width: "100%", height: 42, borderRadius: 10, border: "1px solid #cbd5e1", paddingLeft: 40 }} />
              <Search size={16} style={{ position: "absolute", left: 14, top: 13, color: "#94a3b8" }} />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ height: 42, borderRadius: 10, border: "1px solid #cbd5e1", padding: "0 12px" }}>
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="REVISION_REQUESTED">Revision Requested</option>
            </select>
            <div style={{ background: "#e0f2fe", color: "#075985", padding: "8px 12px", borderRadius: 10, fontWeight: 700 }}>
              Total Records: {filteredOfficialRecords.length}
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: 60, display: "flex", justifyContent: "center" }}>
                <RefreshCw className="animate-spin" size={34} color="#0f766e" />
              </div>
            ) : filteredOfficialRecords.length ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                      <th style={{ padding: 14 }}>Reference</th>
                      <th style={{ padding: 14 }}>Project Title</th>
                      <th style={{ padding: 14 }}>Organization</th>
                      <th style={{ padding: 14 }}>Status</th>
                      <th style={{ padding: 14 }}>Version</th>
                      <th style={{ padding: 14 }}>Generated PDF</th>
                      <th style={{ padding: 14 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOfficialRecords.map((record) => (
                      <tr key={record.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                        <td style={{ padding: 14, fontWeight: 700 }}>{record.reference_no}</td>
                        <td style={{ padding: 14 }}>{record.project_title}</td>
                        <td style={{ padding: 14 }}>{record.organization}</td>
                        <td style={{ padding: 14 }}>{getStatusBadge(record.status)}</td>
                        <td style={{ padding: 14 }}>{record.version || 1}</td>
                        <td style={{ padding: 14 }}>
                          {record.generated_pdf_file_name ? (
                            <button className="sp-btn sp-btn-secondary" type="button" onClick={() => downloadStoredPdf(record)}>
                              <Download size={14} />
                              Download PDF
                            </button>
                          ) : (
                            <span style={{ color: "#64748b", fontSize: 13 }}>Not generated yet</span>
                          )}
                        </td>
                        <td style={{ padding: 14 }}>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button type="button" className="sp-btn sp-btn-secondary" onClick={() => startEditRecord(record)}>
                              <Edit3 size={14} />
                              Edit
                            </button>
                            <button type="button" className="sp-btn sp-btn-secondary" onClick={() => loadRecordVersions(record.id)}>
                              <History size={14} />
                              Versions
                            </button>
                            <button type="button" className="sp-btn sp-btn-secondary" onClick={async () => {
                              const blob = await buildPdfBlob(record);
                              const url = pushPreviewBlob(blob);
                              window.open(url, "_blank", "noopener,noreferrer");
                            }}>
                              <Eye size={14} />
                              Preview
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: 44, textAlign: "center", color: "#64748b" }}>No official UC records found.</div>
            )}
          </div>
        </>
      )}

      {activeTab === "submitted" && (
        <>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 18, marginBottom: 18, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
              <input value={submittedSearch} onChange={(e) => setSubmittedSearch(e.target.value)} placeholder="Search by UC name, uploader, project/team..." style={{ width: "100%", height: 42, borderRadius: 10, border: "1px solid #cbd5e1", paddingLeft: 40 }} />
              <Search size={16} style={{ position: "absolute", left: 14, top: 13, color: "#94a3b8" }} />
            </div>
            <div style={{ background: "#f3e8ff", color: "#7e22ce", padding: "8px 12px", borderRadius: 10, fontWeight: 700 }}>
              Submitted UCs: {filteredSubmittedFiles.length}
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: 60, display: "flex", justifyContent: "center" }}>
                <RefreshCw className="animate-spin" size={34} color="#0f766e" />
              </div>
            ) : filteredSubmittedFiles.length ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                      <th style={{ padding: 14 }}>UC File</th>
                      <th style={{ padding: 14 }}>Uploader</th>
                      <th style={{ padding: 14 }}>Project / Team</th>
                      <th style={{ padding: 14 }}>Status</th>
                      <th style={{ padding: 14 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmittedFiles.map((uc) => {
                      const fileDirectUrl = getFileUrl(uc.filePath || uc.file_path || uc.url);
                      const displayName = uc.originalFileName || uc.original_file_name || uc.fileName || uc.file_name || "Utilization Certificate";
                      const uploaderName = uc.uploadedByName || uc.uploaded_by_name || "Team Member";
                      const uploaderEmail = uc.uploadedByEmail || uc.uploaded_by_email || "";
                      const projectIdVal = uc.projectId || uc.project_id || "N/A";
                      const teamIdVal = uc.teamId || uc.team_id || "N/A";
                      const createdAtVal = uc.createdAt || uc.created_at;
                      const dateStr = formatDateTime(createdAtVal);

                      return (
                        <tr key={uc.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                          <td style={{ padding: 14, fontWeight: 700 }}>{displayName}</td>
                          <td style={{ padding: 14 }}>
                            <div>{uploaderName}</div>
                            {uploaderEmail && <div style={{ fontSize: 12, color: "#64748b" }}>{uploaderEmail}</div>}
                            <div style={{ fontSize: 12, color: "#64748b" }}>{dateStr}</div>
                          </td>
                          <td style={{ padding: 14 }}>
                            <div>Proj: {projectIdVal}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>Team: {teamIdVal}</div>
                          </td>
                          <td style={{ padding: 14 }}>{getStatusBadge(uc.status)}</td>
                          <td style={{ padding: 14 }}>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <button type="button" className="sp-btn sp-btn-secondary" onClick={() => setPreviewFile(uc)}>
                                <Eye size={14} />
                                View
                              </button>
                              <a href={fileDirectUrl} download={displayName} target="_blank" rel="noreferrer" className="sp-btn sp-btn-secondary" style={{ textDecoration: "none" }}>
                                <Download size={14} />
                                Download
                              </a>
                              <button type="button" className="sp-btn sp-btn-secondary" onClick={() => updateSubmittedStatus(uc.id, "VERIFIED", displayName)}>
                                <ShieldCheck size={14} />
                                Verify
                              </button>
                              <button type="button" className="sp-btn sp-btn-primary" onClick={() => updateSubmittedStatus(uc.id, "APPROVED", displayName)}>
                                <CheckCircle2 size={14} />
                                Approve
                              </button>
                              <button type="button" className="sp-btn sp-btn-danger" onClick={() => updateSubmittedStatus(uc.id, "REJECTED", displayName)}>
                                <XCircle size={14} />
                                Reject
                              </button>
                              <button type="button" className="sp-btn sp-btn-secondary" onClick={() => updateSubmittedStatus(uc.id, "REVISION_REQUESTED", displayName)}>
                                <AlertTriangle size={14} />
                                Request Changes
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: 44, textAlign: "center", color: "#64748b" }}>No submitted UC files found.</div>
            )}
          </div>
        </>
      )}

      {previewFile && (() => {
        const fileName = previewFile.originalFileName || previewFile.original_file_name || previewFile.fileName || previewFile.file_name || "Utilization Certificate";
        const uploaderName = previewFile.uploadedByName || previewFile.uploaded_by_name || "Team Member";
        const createdAtVal = previewFile.createdAt || previewFile.created_at;
        const dateStr = formatDateTime(createdAtVal);
        const filePath = previewFile.filePath || previewFile.file_path || previewFile.url || "";
        const fileDirectUrl = getFileUrl(filePath);
        const mimeType = (previewFile.mimeType || previewFile.mime_type || "").toLowerCase();
        const isImage = mimeType.startsWith("image") || /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(fileName) || /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(filePath);
        const isPdf = mimeType.includes("pdf") || /\.pdf$/i.test(fileName) || /\.pdf$/i.test(filePath);

        return (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 99990, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={() => setPreviewFile(null)}
          >
            <div
              style={{ background: "#ffffff", borderRadius: 16, width: "100%", maxWidth: 900, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", display: "flex", flexDirection: "column", border: "1px solid #e2e8f0" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                <div>
                  <strong style={{ fontSize: "1rem", color: "#0f172a" }}>{fileName}</strong>
                  <span style={{ fontSize: "0.78rem", color: "#64748b", display: "block", marginTop: "2px" }}>
                    Uploaded by {uploaderName} on {dateStr}
                  </span>
                </div>
                <button type="button" onClick={() => setPreviewFile(null)} className="sp-btn sp-btn-secondary">
                  Close
                </button>
              </div>

              <div style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 350, background: "#f8fafc" }}>
                {isImage ? (
                  <img src={fileDirectUrl} alt={fileName} style={{ maxWidth: "100%", maxHeight: 550, borderRadius: 10, objectFit: "contain" }} />
                ) : isPdf ? (
                  <iframe src={fileDirectUrl} title={fileName} style={{ width: "100%", height: 550, border: "none", borderRadius: 10, background: "#ffffff" }} />
                ) : (
                  <div style={{ textAlign: "center", padding: "40px 20px", background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", width: "100%", maxWidth: 520 }}>
                    <FileText size={52} color="#0f766e" style={{ marginBottom: 14 }} />
                    <h3 style={{ margin: "0 0 6px", color: "#1e293b" }}>Document Preview</h3>
                    <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: "0.88rem" }}>
                      File: <strong>{fileName}</strong>
                    </p>
                    <a href={fileDirectUrl} download={fileName} target="_blank" rel="noopener noreferrer" className="sp-btn sp-btn-primary" style={{ textDecoration: "none" }}>
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

      {versionModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99992, background: "rgba(2, 6, 23, 0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }} onClick={() => setVersionModal(null)}>
          <div style={{ width: "100%", maxWidth: 760, background: "#ffffff", borderRadius: 18, overflow: "hidden", maxHeight: "88vh", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: 18, background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ fontSize: 16 }}>Version History</strong>
                <div style={{ fontSize: 12, color: "#64748b" }}>{versionModal.versions.length} recorded revisions</div>
              </div>
              <button type="button" className="sp-btn sp-btn-secondary" onClick={() => setVersionModal(null)}>Close</button>
            </div>
            <div style={{ padding: 18, overflow: "auto" }}>
              {versionModal.versions.length ? versionModal.versions.map((version) => (
                <div key={version.id} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 14, marginBottom: 12, background: "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <strong>Version {version.version_number}</strong>
                    <span style={{ color: "#64748b", fontSize: 12 }}>{formatDateTime(version.created_at)}</span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13, color: "#334155" }}>{version.change_note || "No change note recorded."}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>Changed by {version.changed_by_name || "System"}</div>
                </div>
              )) : (
                <div style={{ color: "#64748b" }}>No version history has been recorded yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .uc-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .uc-field {
          display: grid;
          gap: 6px;
        }
        .uc-field span {
          font-size: 12px;
          font-weight: 700;
          color: #475569;
        }
        .uc-field input,
        .uc-field textarea,
        .uc-field select {
          width: 100%;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          padding: 10px 12px;
          font-size: 14px;
          color: #0f172a;
          box-sizing: border-box;
        }
        .uc-field textarea {
          resize: vertical;
        }
        .uc-span-2 {
          grid-column: span 2;
        }
        .sp-btn {
          border: none;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 14px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: transform .12s ease, opacity .12s ease, background .12s ease;
        }
        .sp-btn:hover { transform: translateY(-1px); }
        .sp-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }
        .sp-btn-primary { background: linear-gradient(135deg, #0f766e, #115e59); color: #fff; }
        .sp-btn-secondary { background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; }
        .sp-btn-danger { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .sp-badge-approved, .sp-badge-rejected, .sp-badge-pending {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 5px 10px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }
        .sp-badge-approved { background: #dcfce7; color: #166534; }
        .sp-badge-rejected { background: #fee2e2; color: #991b1b; }
        .sp-badge-pending { background: #fef3c7; color: #92400e; }
        @media (max-width: 1100px) {
          .uc-grid { grid-template-columns: 1fr; }
          .uc-span-2 { grid-column: span 1; }
        }
      `}</style>
    </main>
  );
}

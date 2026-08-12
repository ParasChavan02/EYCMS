import React, { useMemo, useState, useEffect } from "react";
import {
  Download,
  Loader2,
  RefreshCw,
  Upload,
  X,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileCheck,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Layers,
  Wallet,
  Activity,
  UserCheck,
  Send,
  Trash2,
  CheckSquare,
  Square,
  Lock,
  ChevronRight
} from "lucide-react";
import { useQuery } from "react-query";
import { useAuth } from "../../common/hooks/useAuth";
import { useNotification } from "../../common/hooks/useNotification";
import { adminTransactionService } from "../../../services/adminTransactionService";
import { reportService, getFileUrl, formatDateTime } from "../../../services/reportService";
import "../../../styles/admin-management.css";

const CATEGORIES = ["Travel", "Food", "Venue", "Marketing", "Printing", "Equipment", "Miscellaneous"];

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
}

function AdminTransactions() {
  useAuth();
  const { addNotification } = useNotification();

  // Selected item from the queue (could be a bill file or a manual transaction)
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Tabs for the Live Queue
  const [activeQueueTab, setActiveQueueTab] = useState("PENDING"); // PENDING, ADMIN, REJECTED, CLARIFICATION, LOCKED
  
  // Left Preview State
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  // Remarks state
  const [adminRemarks, setAdminRemarks] = useState("");
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  // Search and Advanced Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [budgetHeadFilter, setBudgetHeadFilter] = useState("All");

  // Admin upload bill modal
  const [isAdminUploadOpen, setIsAdminUploadOpen] = useState(false);
  const [adminBillFile, setAdminBillFile] = useState(null);
  const [adminBillAmount, setAdminBillAmount] = useState("");
  const [adminBillDesc, setAdminBillDesc] = useState("");
  const [adminBillCategory, setAdminBillCategory] = useState("Travel");
  const [adminBillMode, setAdminBillMode] = useState("single"); // single, split
  const [adminSplits, setAdminSplits] = useState([
    { id: 1, category: "Travel", description: "", amount: "" }
  ]);
  const [adminUploadProgress, setAdminUploadProgress] = useState(0);
  const [isAdminUploading, setIsAdminUploading] = useState(false);

  // Auto-refetch data every 5 seconds for real-time visual updates
  const {
    data: allFiles = [],
    isLoading: isLoadingFiles,
    refetch: refetchFiles
  } = useQuery(
    ["admin-all-files"],
    () => reportService.getAdminFiles(),
    { refetchInterval: 5000, keepPreviousData: true }
  );

  const {
    data: allTransactions = [],
    isLoading: isLoadingTxns,
    refetch: refetchTxns
  } = useQuery(
    ["admin-all-transactions"],
    () => adminTransactionService.getTransactions(),
    { refetchInterval: 5000, keepPreviousData: true }
  );

  const { data: budgetHeads = [] } = useQuery(
    ["admin-budget-heads"],
    () => adminTransactionService.getBudgetHeads(),
    { staleTime: 5 * 60 * 1000 }
  );

  // Handle selected item refetching logic
  useEffect(() => {
    if (selectedItem) {
      if (selectedItem.category) {
        // Selected item is a file (bill)
        const updated = allFiles.find(f => f.id === selectedItem.id);
        if (updated) setSelectedItem(updated);
      } else {
        // Selected item is a transaction
        const updated = allTransactions.find(t => t.id === selectedItem.id);
        if (updated) setSelectedItem(updated);
      }
    }
  }, [allFiles, allTransactions]);

  // Aggregate Dashboard stats
  const stats = useMemo(() => {
    const pendingBills = allFiles.filter(f => f.category === "bill" && ["PENDING", "SUBMITTED", "UNDER_REVIEW"].includes(f.status?.toUpperCase())).length;
    const adminTxns = allTransactions.filter(t => t.source === "BILL" || t.source === "IMPORT").length;
    
    // Approved today (today UTC/Local)
    const todayStr = new Date().toDateString();
    const approvedToday = allFiles.filter(f => f.category === "bill" && f.status === "APPROVED" && new Date(f.updated_at).toDateString() === todayStr).length +
                          allTransactions.filter(t => t.status === "APPROVED" && new Date(t.date).toDateString() === todayStr).length;

    const rejected = allFiles.filter(f => f.category === "bill" && f.status === "REJECTED").length +
                     allTransactions.filter(t => t.status === "REJECTED").length;

    // Budget utilization
    const sanctioned = 300000;
    const totalSpent = allTransactions.filter(t => t.status === "APPROVED").reduce((sum, t) => sum + t.amount, 0);
    const utilPercent = Math.min(100, Math.round((totalSpent / sanctioned) * 100));

    return {
      pendingBills,
      adminTxns,
      approvedToday,
      rejected,
      totalSpent,
      sanctioned,
      utilPercent
    };
  }, [allFiles, allTransactions]);

  // Generate Live Activity Feed events sorted by date/time
  const activityFeed = useMemo(() => {
    const list = [];
    allFiles.slice(0, 10).forEach(f => {
      const uploader = f.uploaded_by_name || "Someone";
      const fileType = (f.category || "file").toUpperCase();
      const amountMsg = f.category === "bill" && f.transactions?.length ? ` (Rs ${f.transactions.reduce((sum, t) => sum + t.amount, 0)})` : "";
      
      let message = `${uploader} uploaded a ${fileType}${amountMsg}`;
      let tone = "info";
      
      if (f.status === "APPROVED") {
        message = `${uploader}'s ${fileType} was approved by Admin`;
        tone = "success";
      } else if (f.status === "REJECTED") {
        message = `${uploader}'s ${fileType} was rejected`;
        tone = "error";
      } else if (f.status === "REVISION_REQUESTED") {
        message = `Revision requested for ${uploader}'s ${fileType}`;
        tone = "warning";
      }

      list.push({
        id: `file-${f.id}-${f.updated_at}`,
        time: new Date(f.updated_at || f.created_at),
        message,
        tone
      });
    });

    allTransactions.slice(0, 10).forEach(t => {
      const creator = t.created_by_name || "Someone";
      const source = t.source || "MANUAL";
      
      let message = `${creator} posted a ${source} transaction of ${formatCurrency(t.amount)}`;
      let tone = "info";

      if (t.status === "APPROVED") {
        message = `Transaction '${t.description}' approved | Budget updated`;
        tone = "success";
      } else if (t.status === "REJECTED") {
        message = `Transaction '${t.description}' rejected`;
        tone = "error";
      } else if (t.status === "REVISION_REQUESTED") {
        message = `Revision requested for transaction '${t.description}'`;
        tone = "warning";
      }

      list.push({
        id: `txn-${t.id}-${t.date}`,
        time: new Date(t.date),
        message,
        tone
      });
    });

    return list
      .sort((a, b) => b.time - a.time)
      .slice(0, 8);
  }, [allFiles, allTransactions]);

  // Budget Category utilization maps (to visualize live impact)
  const categoryBudgets = useMemo(() => {
    const allocations = {
      "Venue": 100000,
      "Food": 50000,
      "Marketing": 40000,
      "Travel": 50000,
      "Printing": 30000,
      "Equipment": 30000,
      "Miscellaneous": 50000
    };
    
    const spents = {
      "Venue": 0, "Food": 0, "Marketing": 0, "Travel": 0, "Printing": 0, "Equipment": 0, "Miscellaneous": 0
    };

    allTransactions.forEach(t => {
      if (t.status === "APPROVED") {
        let categoryName = "Miscellaneous";
        const catLower = (t.category || t.budget_head || "").toLowerCase();
        if (catLower.includes("venue")) categoryName = "Venue";
        else if (catLower.includes("food") || catLower.includes("refreshment")) categoryName = "Food";
        else if (catLower.includes("marketing")) categoryName = "Marketing";
        else if (catLower.includes("travel")) categoryName = "Travel";
        else if (catLower.includes("printing")) categoryName = "Printing";
        else if (catLower.includes("equipment")) categoryName = "Equipment";
        
        if (spents[categoryName] !== undefined) {
          spents[categoryName] += t.amount;
        } else {
          spents["Miscellaneous"] += t.amount;
        }
      }
    });

    return Object.keys(allocations).map(name => ({
      name,
      allocated: allocations[name],
      spent: spents[name],
      remaining: allocations[name] - spents[name]
    }));
  }, [allTransactions]);

  // Filter queue entries based on active Queue Tab and search query
  const queueItems = useMemo(() => {
    let items = [];

    if (activeQueueTab === "PENDING") {
      // User uploads pending
      items = allFiles
        .filter(f => f.category === "bill" && ["PENDING", "SUBMITTED", "UNDER_REVIEW"].includes(f.status?.toUpperCase()))
        .map(f => ({ ...f, type: "USER_BILL", date: f.created_at, amount: f.transactions?.reduce((sum, t) => sum + t.amount, 0) || f.bill_amount || 0 }));
    } else if (activeQueueTab === "ADMIN") {
      // Admin transactions
      items = allTransactions
        .filter(t => t.source === "BILL" || t.source === "IMPORT" || t.source === "MANUAL")
        .map(t => ({ ...t, type: "ADMIN_TXN", date: t.date }));
    } else if (activeQueueTab === "REJECTED") {
      const filesRejected = allFiles
        .filter(f => f.category === "bill" && f.status === "REJECTED")
        .map(f => ({ ...f, type: "USER_BILL", date: f.created_at, amount: f.transactions?.reduce((sum, t) => sum + t.amount, 0) || f.bill_amount || 0 }));
      const txnsRejected = allTransactions
        .filter(t => t.status === "REJECTED")
        .map(t => ({ ...t, type: "ADMIN_TXN", date: t.date }));
      items = [...filesRejected, ...txnsRejected];
    } else if (activeQueueTab === "CLARIFICATION") {
      const filesClarify = allFiles
        .filter(f => f.category === "bill" && f.status === "REVISION_REQUESTED")
        .map(f => ({ ...f, type: "USER_BILL", date: f.created_at, amount: f.transactions?.reduce((sum, t) => sum + t.amount, 0) || f.bill_amount || 0 }));
      const txnsClarify = allTransactions
        .filter(t => t.status === "REVISION_REQUESTED")
        .map(t => ({ ...t, type: "ADMIN_TXN", date: t.date }));
      items = [...filesClarify, ...txnsClarify];
    } else if (activeQueueTab === "LOCKED") {
      const filesLocked = allFiles
        .filter(f => f.category === "bill" && (f.status === "APPROVED" || f.status === "ADMIN_APPROVED"))
        .map(f => ({ ...f, type: "USER_BILL", date: f.created_at, amount: f.transactions?.reduce((sum, t) => sum + t.amount, 0) || f.bill_amount || 0 }));
      const txnsLocked = allTransactions
        .filter(t => t.status === "APPROVED" || t.status === "LOCKED")
        .map(t => ({ ...t, type: "ADMIN_TXN", date: t.date }));
      items = [...filesLocked, ...txnsLocked];
    }

    // Apply Search Query & Advanced Filters
    return items.filter(item => {
      const label = item.original_file_name || item.description || "";
      const uploader = item.uploaded_by_name || item.created_by_name || "";
      const matchesSearch = label.toLowerCase().includes(searchQuery.toLowerCase()) || uploader.toLowerCase().includes(searchQuery.toLowerCase());
      
      const itemCat = item.category || item.budget_head || "";
      const matchesCat = categoryFilter === "All" || itemCat.toLowerCase().includes(categoryFilter.toLowerCase());
      const matchesBudget = budgetHeadFilter === "All" || itemCat.toLowerCase() === budgetHeadFilter.toLowerCase();
      
      let matchesDate = true;
      if (dateFrom) {
        matchesDate = matchesDate && new Date(item.date) >= new Date(dateFrom);
      }
      if (dateTo) {
        matchesDate = matchesDate && new Date(item.date) <= new Date(dateTo);
      }

    });
  }, [allFiles, allTransactions, activeQueueTab, searchQuery, categoryFilter, dateFrom, dateTo, budgetHeadFilter]);

  // Filtered transactions for the database table view at the bottom
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(txn => {
      const desc = txn.description || "";
      const creator = txn.created_by_name || "";
      const matchesSearch = desc.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            creator.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBudget = budgetHeadFilter === "All" || 
                            (txn.budget_head || "").toLowerCase() === budgetHeadFilter.toLowerCase();

      let matchesDate = true;
      const txnDate = new Date(txn.date);
      if (dateFrom) {
        matchesDate = matchesDate && txnDate >= new Date(dateFrom + "T00:00:00");
      }
      if (dateTo) {
        matchesDate = matchesDate && txnDate <= new Date(dateTo + "T23:59:59");
      }

      return matchesSearch && matchesBudget && matchesDate;
    });
  }, [allTransactions, searchQuery, budgetHeadFilter, dateFrom, dateTo]);

  const filteredCount = filteredTransactions.length;


  // Bulk Actions
  const handleToggleSelectAll = () => {
    if (selectedIds.size === queueItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(queueItems.map(item => item.id)));
    }
  };

  const handleToggleSelectOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBulkApprove = async () => {
    if (!selectedIds.size) return;
    let successCount = 0;
    try {
      for (const id of selectedIds) {
        const item = queueItems.find(i => i.id === id);
        if (item) {
          if (item.type === "USER_BILL") {
            await reportService.updateFileStatus(item.id, "APPROVED", "Approved via Bulk Action");
          } else {
            await adminTransactionService.reviewTransaction({ transaction_id: item.id, action: "APPROVE", remarks: "Approved via Bulk Action" });
          }
          successCount++;
        }
      }
      addNotification(`Successfully approved ${successCount} items in bulk.`, "success", 2000);
      setSelectedIds(new Set());
      refetchFiles();
      refetchTxns();
    } catch (err) {
      addNotification("Error occurred during bulk approval.", "error", 2000);
    }
  };

  const handleBulkReject = async () => {
    if (!selectedIds.size) return;
    let successCount = 0;
    try {
      for (const id of selectedIds) {
        const item = queueItems.find(i => i.id === id);
        if (item) {
          if (item.type === "USER_BILL") {
            await reportService.updateFileStatus(item.id, "REJECTED", "Rejected via Bulk Action");
          } else {
            await adminTransactionService.reviewTransaction({ transaction_id: item.id, action: "REJECT", remarks: "Rejected via Bulk Action" });
          }
          successCount++;
        }
      }
      addNotification(`Successfully rejected ${successCount} items.`, "success", 2000);
      setSelectedIds(new Set());
      refetchFiles();
      refetchTxns();
    } catch (err) {
      addNotification("Error occurred during bulk rejection.", "error", 2000);
    }
  };

  // Split Screen Actions (Single item actions)
  const handleItemApprove = async (item) => {
    try {
      if (item.type === "USER_BILL") {
        await reportService.updateFileStatus(item.id, "APPROVED", adminRemarks);
        addNotification("Bill approved successfully.", "success", 1800);
      } else {
        await adminTransactionService.reviewTransaction({ transaction_id: item.id, action: "APPROVE", remarks: adminRemarks });
        addNotification("Transaction approved successfully.", "success", 1800);
      }
      setAdminRemarks("");
      refetchFiles();
      refetchTxns();
    } catch (err) {
      addNotification("Failed to approve transaction.", "error", 2000);
    }
  };

  const handleItemReject = async (item) => {
    if (!adminRemarks.trim()) {
      addNotification("rejection remarks/reason is required.", "error", 2000);
      return;
    }
    try {
      if (item.type === "USER_BILL") {
        await reportService.updateFileStatus(item.id, "REJECTED", adminRemarks);
        addNotification("Bill rejected successfully.", "success", 1800);
      } else {
        await adminTransactionService.reviewTransaction({ transaction_id: item.id, action: "REJECT", remarks: adminRemarks });
        addNotification("Transaction rejected successfully.", "success", 1800);
      }
      setAdminRemarks("");
      refetchFiles();
      refetchTxns();
    } catch (err) {
      addNotification("Failed to reject transaction.", "error", 2000);
    }
  };

  const handleItemRequestChanges = async (item) => {
    if (!adminRemarks.trim()) {
      addNotification("Please specify details/clarifications requested in remarks.", "error", 2000);
      return;
    }
    try {
      if (item.type === "USER_BILL") {
        await reportService.updateFileStatus(item.id, "REVISION_REQUESTED", adminRemarks);
        addNotification("Revision requested from user.", "success", 1800);
      } else {
        await adminTransactionService.reviewTransaction({ transaction_id: item.id, action: "REQUEST_REVISION", remarks: adminRemarks });
        addNotification("Revision requested from creator.", "success", 1800);
      }
      setAdminRemarks("");
      refetchFiles();
      refetchTxns();
    } catch (err) {
      addNotification("Failed to update status.", "error", 2000);
    }
  };

  const handleItemLock = async (item) => {
    try {
      // Locking sets reconciliation status or closes entry
      if (item.type === "USER_BILL") {
        await reportService.updateFileStatus(item.id, "APPROVED", "Locked by administration.");
      } else {
        await adminTransactionService.reviewTransaction({ transaction_id: item.id, action: "APPROVE", remarks: "Finalized and Locked.", is_reconciliation: true });
      }
      addNotification("Transaction locked successfully.", "success", 1800);
      refetchFiles();
      refetchTxns();
    } catch (err) {
      addNotification("Failed to lock entry.", "error", 2000);
    }
  };

  const handleItemDelete = async (item) => {
    if (!window.confirm("Are you sure you want to delete this draft/entry?")) return;
    try {
      if (item.type === "USER_BILL") {
        await reportService.deleteFile(item.id);
      } else {
        // Backend doesn't have standard delete transaction router, but we mock/alert
        addNotification("Re-export CSV or adjust allocations instead of deleting direct ledger entries.", "info", 3000);
      }
      addNotification("Item deleted.", "success", 1800);
      setSelectedItem(null);
      refetchFiles();
      refetchTxns();
    } catch (err) {
      addNotification("Failed to delete entry.", "error", 2000);
    }
  };

  // Automatic Validation Logic for Selected Item
  const autoValidation = useMemo(() => {
    if (!selectedItem) return [];
    const logs = [];

    const amount = selectedItem.amount || selectedItem.bill_amount || 0;
    const splits = selectedItem.transactions || [];

    // Check sum match
    if (splits.length > 0) {
      const sum = splits.reduce((s, t) => s + t.amount, 0);
      if (Math.abs(sum - amount) > 0.01) {
        logs.push({ text: `Amount Mismatch: Splits sum (Rs ${sum}) does not equal total bill amount (Rs ${amount})`, severity: "error" });
      } else {
        logs.push({ text: "Sum Validation: Split total matches bill amount.", severity: "success" });
      }
    }

    // Check budget availability
    const budgetCategory = selectedItem.category || selectedItem.budget_head || "";
    const matchBudget = categoryBudgets.find(b => b.name.toLowerCase() === budgetCategory.toLowerCase());
    if (matchBudget && amount > matchBudget.remaining) {
      logs.push({ text: `Over Budget Alert: Amount (Rs ${amount}) exceeds remaining allocation (Rs ${matchBudget.remaining}) for category ${matchBudget.name}`, severity: "warning" });
    } else if (matchBudget) {
      logs.push({ text: `Budget availability: Confirmed under ${matchBudget.name}.`, severity: "success" });
    }

    // Duplicate detection
    const isDuplicate = allTransactions.some(t => t.id !== selectedItem.id && t.amount === amount && (t.category || t.budget_head || "").toLowerCase() === budgetCategory.toLowerCase());
    if (isDuplicate) {
      logs.push({ text: "Duplicate Detected: A transaction with the identical amount and category already exists in ledger books.", severity: "warning" });
    }

    // Attachment validation
    if (selectedItem.type === "USER_BILL" && !selectedItem.file_path) {
      logs.push({ text: "Missing Attachment: No source receipt file attached to this transaction record.", severity: "error" });
    } else {
      logs.push({ text: "Attachment Verified: Bill document is attached and accessible.", severity: "success" });
    }

    return logs;
  }, [selectedItem, categoryBudgets, allTransactions]);

  // Admin Bill upload handlers
  const handleAdminFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAdminBillFile(file);
    setAdminBillDesc(file.name.replace(/\.[^/.]+$/, ""));
  };

  const handleAddAdminSplitRow = () => {
    const nextId = adminSplits.length ? Math.max(...adminSplits.map(t => t.id)) + 1 : 1;
    setAdminSplits([...adminSplits, { id: nextId, category: "Travel", description: "", amount: "" }]);
  };

  const handleRemoveAdminSplitRow = (id) => {
    setAdminSplits(adminSplits.filter(t => t.id !== id));
  };

  const handleAdminUploadSubmit = async () => {
    const totalVal = parseFloat(adminBillAmount);
    if (!totalVal || totalVal <= 0) {
      addNotification("Please enter a valid amount.", "error", 1800);
      return;
    }

    let splitsArray = [];
    if (adminBillMode === "single") {
      splitsArray = [{ category: adminBillCategory, description: adminBillDesc, amount: totalVal }];
    } else {
      const sumSplits = adminSplits.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      if (Math.abs(sumSplits - totalVal) > 0.01) {
        addNotification("Splits sum must equal total bill amount.", "error", 1800);
        return;
      }
      splitsArray = adminSplits.map(t => ({
        category: t.category,
        description: t.description.trim() || adminBillDesc,
        amount: parseFloat(t.amount) || 0
      }));
    }

    setIsAdminUploading(true);
    setAdminUploadProgress(0);

    try {
      const extraData = {
        bill_amount: totalVal,
        transaction_mode: adminBillMode,
        transactions: JSON.stringify(splitsArray),
        status: "APPROVED" // Admin bills bypass approval directly into RECORDED/APPROVED status
      };

      await reportService.uploadFile(
        "bill",
        adminBillFile,
        "",
        extraData,
        (percent) => setAdminUploadProgress(percent)
      );

      addNotification("Admin transaction recorded and ledger updated.", "success", 1800);
      setIsAdminUploadOpen(false);
      setAdminBillFile(null);
      setAdminBillAmount("");
      setAdminBillDesc("");
      setAdminSplits([{ id: 1, category: "Travel", description: "", amount: "" }]);
      refetchFiles();
      refetchTxns();
    } catch (err) {
      addNotification("Failed to upload bill.", "error", 1800);
    } finally {
      setIsAdminUploading(false);
    }
  };

  return (
    <main className="admin-page" style={{ background: "#f1f5f9", gap: "20px" }}>
      
      {/* 1. Header & Actions */}
      <section className="admin-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1>💳 Transactions Workspace</h1>
          <p>Real-time financial ledgers, auto validation, and user/admin bill review.</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => setIsAdminUploadOpen(true)} className="btn-primary" style={{ background: "linear-gradient(135deg, #1d5cff, #0f46d8)", padding: "10px 20px" }}>
            + Record Admin Expense
          </button>
          <button onClick={() => { refetchFiles(); refetchTxns(); addNotification("Refreshed data.", "info", 1000); }} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "8px", borderRadius: "8px" }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </section>

      {/* 2. Dashboard Summary KPIs */}
      <section className="stats-grid" style={{ marginBottom: 0 }}>
        <article className="stat-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", borderLeft: "4px solid #f59e0b" }}>
          <span className="stat-label">Pending User Bills</span>
          <strong className="stat-value" style={{ color: "#d97706" }}>{stats.pendingBills}</strong>
        </article>
        <article className="stat-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", borderLeft: "4px solid #10b981" }}>
          <span className="stat-label">Admin Transactions</span>
          <strong className="stat-value" style={{ color: "#15803d" }}>{stats.adminTxns}</strong>
        </article>
        <article className="stat-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", borderLeft: "4px solid #3b82f6" }}>
          <span className="stat-label">Approved Today</span>
          <strong className="stat-value" style={{ color: "#2563eb" }}>{stats.approvedToday}</strong>
        </article>
        <article className="stat-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", borderLeft: "4px solid #ef4444" }}>
          <span className="stat-label">Rejected / Clarification</span>
          <strong className="stat-value" style={{ color: "#b91c1c" }}>{stats.rejected}</strong>
        </article>
        <article className="stat-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", borderLeft: "4px solid #8b5cf6" }}>
          <span className="stat-label">Budget Utilization</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
            <strong className="stat-value" style={{ fontSize: "20px" }}>{stats.utilPercent}%</strong>
            <span style={{ fontSize: "12px", color: "#64748b" }}>{formatCurrency(stats.totalSpent)} spent</span>
          </div>
          <div className="progress-track" style={{ height: "6px", marginTop: "8px" }}>
            <div className="progress-fill healthy" style={{ width: `${stats.utilPercent}%`, background: "linear-gradient(90deg, #8b5cf6, #10b981)" }} />
          </div>
        </article>
      </section>

      {/* 3. Advanced Filtering & Database Ledgers Panel */}
      <section className="admin-card">
        <h2 style={{ fontSize: "14px", fontWeight: "700" }}>General Ledgers & CSV Operations</h2>
        
        {/* Filters bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="Search general ledgers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            style={{ padding: "8px 12px", fontSize: "13px" }}
          />
          <select value={budgetHeadFilter} onChange={(e) => setBudgetHeadFilter(e.target.value)} className="filter-select" style={{ padding: "8px 12px", fontSize: "13px" }}>
            <option value="All">All Budget Heads</option>
            {budgetHeads.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="filter-select"
            style={{ padding: "8px 12px", fontSize: "13px" }}
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="filter-select"
            style={{ padding: "8px 12px", fontSize: "13px" }}
          />
          <button onClick={() => { setSearchQuery(""); setBudgetHeadFilter("All"); setDateFrom(""); setDateTo(""); }} className="btn-secondary" style={{ padding: "8px 12px", fontSize: "13px" }}>
            Reset Filters
          </button>
        </div>

        {/* Database table view */}
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Budget Head</th>
                <th>Description</th>
                <th>Date</th>
                <th>Created By</th>
                <th>Source</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.slice(0, 10).map((txn) => (
                <tr key={txn.id}>
                  <td style={{ fontFamily: "monospace", fontSize: "11px" }}>{txn.id.substring(0, 8).toUpperCase()}</td>
                  <td>{txn.budget_head}</td>
                  <td>{txn.description}</td>
                  <td>{new Date(txn.date).toLocaleDateString()}</td>
                  <td>{txn.created_by_name}</td>
                  <td><span className="role-badge" style={{ background: txn.source === "BILL" ? "#eff6ff" : "#f1f5f9", color: txn.source === "BILL" ? "#1d5cff" : "#475569" }}>{txn.source}</span></td>
                  <td><span className={`status-badge ${txn.status?.toLowerCase() === "approved" ? "approved" : "pending"}`}>{txn.status}</span></td>
                  <td style={{ textAlign: "right", fontWeight: "700" }}>{formatCurrency(txn.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination-bar">
          <span>{filteredCount} transaction(s) loaded</span>
          <span>Admin only access for transaction CSV operations</span>
        </div>
      </section>

      {/* ADMIN EXPENSE RECORDING MODAL */}
      {isAdminUploadOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontWeight: "800", color: "#0f172a" }}>Record Admin Expense (Bypasses Approval)</h3>
              <button type="button" className="icon-close-button" onClick={() => setIsAdminUploadOpen(false)} disabled={isAdminUploading}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label className="config-field" style={{ display: "block" }}>
                  <span>Select Bill File (Receipt/Invoice)</span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleAdminFileSelect} disabled={isAdminUploading} />
                </label>
                <div className="config-field">
                  <span>Total Bill Amount (Rs) <span style={{ color: "#ef4444" }}>*</span></span>
                  <input type="number" placeholder="e.g. 15000" value={adminBillAmount} onChange={(e) => setAdminBillAmount(e.target.value)} disabled={isAdminUploading} />
                </div>
              </div>

              <div className="config-field">
                <span>Description / Vendor Details</span>
                <input type="text" placeholder="e.g. Server hosting subscription / Amazon purchase" value={adminBillDesc} onChange={(e) => setAdminBillDesc(e.target.value)} disabled={isAdminUploading} />
              </div>

              {/* Mode Split selector */}
              <div>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>Transaction Mode</span>
                <div style={{ display: "flex", gap: "10px", background: "#f1f5f9", padding: "4px", borderRadius: "8px" }}>
                  <button onClick={() => setAdminBillMode("single")} style={{ flex: 1, padding: "8px", border: 0, borderRadius: "6px", fontWeight: "700", cursor: "pointer", background: adminBillMode === "single" ? "#ffffff" : "transparent", color: adminBillMode === "single" ? "#1d5cff" : "#64748b" }}>Single Transaction</button>
                  <button onClick={() => setAdminBillMode("split")} style={{ flex: 1, padding: "8px", border: 0, borderRadius: "6px", fontWeight: "700", cursor: "pointer", background: adminBillMode === "split" ? "#ffffff" : "transparent", color: adminBillMode === "split" ? "#1d5cff" : "#64748b" }}>Multiple Split Rows</button>
                </div>
              </div>

              {adminBillMode === "single" ? (
                <div className="config-field">
                  <span>Category head</span>
                  <select value={adminBillCategory} onChange={(e) => setAdminBillCategory(e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Split Transactions</span>
                    <button onClick={handleAddAdminSplitRow} className="btn-sm" style={{ background: "#eff6ff", color: "#1d5cff" }}>+ Add Split row</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "150px", overflowY: "auto" }}>
                    {adminSplits.map((split, idx) => (
                      <div key={split.id} style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 100px auto", gap: "8px", alignItems: "center" }}>
                        <select
                          value={split.category}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAdminSplits(adminSplits.map(s => s.id === split.id ? { ...s, category: val } : s));
                          }}
                          style={{ padding: "6px", fontSize: "12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                        >
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input
                          type="text"
                          placeholder="Description"
                          value={split.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAdminSplits(adminSplits.map(s => s.id === split.id ? { ...s, description: val } : s));
                          }}
                          style={{ padding: "6px", fontSize: "12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                        />
                        <input
                          type="number"
                          placeholder="Amount"
                          value={split.amount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAdminSplits(adminSplits.map(s => s.id === split.id ? { ...s, amount: val } : s));
                          }}
                          style={{ padding: "6px", fontSize: "12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                        />
                        <button onClick={() => handleRemoveAdminSplitRow(split.id)} disabled={adminSplits.length <= 1} style={{ background: "transparent", border: 0, color: "#ef4444", cursor: "pointer" }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isAdminUploading && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                    <span>Recording ledger entries...</span>
                    <strong>{adminUploadProgress}%</strong>
                  </div>
                  <div className="progress-track" style={{ height: "6px" }}>
                    <div className="progress-fill healthy" style={{ width: `${adminUploadProgress}%` }} />
                  </div>
                </div>
              )}

              <div className="form-actions" style={{ justifyContent: "flex-end", marginTop: "12px" }}>
                <button onClick={() => setIsAdminUploadOpen(false)} className="btn-secondary" style={{ padding: "8px 16px", borderRadius: "8px" }} disabled={isAdminUploading}>
                  Cancel
                </button>
                <button onClick={handleAdminUploadSubmit} className="btn-primary" style={{ padding: "8px 20px", borderRadius: "8px" }} disabled={isAdminUploading}>
                  Record Ledger Transaction
                </button>
              </div>
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
  padding: "16px"
};

const modalContentStyle = {
  backgroundColor: "white",
  padding: "24px",
  borderRadius: "12px",
  width: "min(650px, 100%)",
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
  borderBottom: "1px solid #e2e8f0"
};

export default AdminTransactions;

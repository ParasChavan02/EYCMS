import React, { useState, useMemo, useEffect } from "react";
import { useNotification } from "../../common/hooks/useNotification";
import { adminTransactionService } from "../../../services/adminTransactionService";
import "../../../styles/admin-management.css";

const PENDING_STATUSES = ["DRAFT", "PENDING", "VERIFIED", "REVISION_REQUESTED"];

function AdminReconciliation() {
  const { addNotification } = useNotification();

  // State
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL"); // ALL, MY, USER

  // Detail Modal State
  const [selectedRec, setSelectedRec] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Review Modal State for user transactions
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRemarks, setReviewRemarks] = useState("");

  // Fetch transactions from backend
  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminTransactionService.getTransactions();
      const mapped = (data || []).map(t => ({
        ...t,
        source: t.source || "USER",
        reconciliation_status: t.reconciliation_status || "PENDING",
        vendor: t.description?.split(" ")[0] || "Vendor Service",
        reference_number: `REF-${t.id.substring(0, 6).toUpperCase()}`
      }));
      setTransactions(mapped);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to load transaction ledger.");
      addNotification("Failed to fetch ledger transactions.", "error", 2000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);



  // Reconciliation cycles grouping
  const reconciliations = useMemo(() => {
    const groups = {};

    transactions.forEach((t) => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const periodName = d.toLocaleString("en-US", { month: "long", year: "numeric" });

      // Group by period & transaction source (USER or ADMIN)
      const isSystemAdmin = t.source === "ADMIN" || t.created_by_role?.toUpperCase() === "ADMIN";
      const txnSource = isSystemAdmin ? "ADMIN" : "USER";
      const groupKey = `${key}_${txnSource}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: `REC_LIVE_${groupKey}`,
          period: periodName,
          sortDate: new Date(d.getFullYear(), d.getMonth(), 1),
          status: "Completed",
          matchedTxn: 0,
          pendingTxn: 0,
          failedTxn: 0,
          completedDate: "",
          source: txnSource,
          items: []
        };
      }

      const g = groups[groupKey];
      g.items.push(t);

      if (t.status === "APPROVED" || t.reconciliation_status === "APPROVED" || t.reconciliation_status === "LOCKED") {
        g.matchedTxn += 1;
      } else if (t.status === "REJECTED" || t.status === "FAILED") {
        g.failedTxn += 1;
      } else {
        g.pendingTxn += 1;
      }

      const formattedDate = d.toISOString().slice(0, 10);
      if (!g.completedDate || formattedDate > g.completedDate) {
        g.completedDate = formattedDate;
      }
    });

    const liveRuns = Object.values(groups).map((g) => {
      let status = "Completed";
      if (g.pendingTxn > 0) {
        status = "In Review";
      } else if (g.matchedTxn === 0 && g.failedTxn === 0) {
        status = "Pending";
      }
      return {
        ...g,
        status
      };
    });

    return liveRuns.sort((a, b) => {
      const dateA = a.sortDate ? new Date(a.sortDate).getTime() : 0;
      const dateB = b.sortDate ? new Date(b.sortDate).getTime() : 0;
      if (dateB !== dateA) return dateB - dateA;
      return a.source.localeCompare(b.source);
    });
  }, [transactions]);

  // Filtered reconciliation cycles
  const filteredReconciliations = useMemo(() => {
    return reconciliations.filter((r) => {
      const matchesSearch = r.period.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus =
        statusFilter === "ALL" ? true : r.status.toUpperCase() === statusFilter.toUpperCase();

      let matchesSource = true;
      if (sourceFilter === "MY") {
        matchesSource = r.source === "ADMIN";
      } else if (sourceFilter === "USER") {
        matchesSource = r.source === "USER";
      }

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [reconciliations, search, statusFilter, sourceFilter]);

  // Filtered user transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Only show user-submitted transactions
      const isSystemAdmin = t.source === "ADMIN" || t.created_by_role?.toUpperCase() === "ADMIN";
      if (isSystemAdmin) return false;

      // Filter by status dropdown
      let matchesStatus = true;
      if (statusFilter === "COMPLETED") {
        matchesStatus = t.status === "APPROVED";
      } else if (statusFilter === "IN REVIEW") {
        matchesStatus = PENDING_STATUSES.includes(t.status?.toUpperCase());
      } else if (statusFilter === "PENDING") {
        matchesStatus = ["PENDING", "DRAFT"].includes(t.status?.toUpperCase());
      }

      // Search filter: ID, description, category
      const dateObj = new Date(t.date);
      const monthName = isNaN(dateObj.getTime()) ? "" : dateObj.toLocaleString("en-US", { month: "long", year: "numeric" });
      const matchesSearch =
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        (t.category || t.budget_head || "").toLowerCase().includes(search.toLowerCase()) ||
        monthName.toLowerCase().includes(search.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [transactions, search, statusFilter]);

  // Summary Metrics (Stats)
  const stats = useMemo(() => {
    if (sourceFilter === "USER") {
      let matched = 0;
      let pending = 0;
      let failed = 0;
      filteredTransactions.forEach((t) => {
        if (t.status === "APPROVED") matched++;
        else if (t.status === "REJECTED" || t.status === "FAILED") failed++;
        else pending++;
      });
      return { matched, pending, failed };
    } else {
      return filteredReconciliations.reduce(
        (acc, r) => {
          acc.matched += r.matchedTxn;
          acc.pending += r.pendingTxn;
          acc.failed += r.failedTxn;
          return acc;
        },
        { matched: 0, pending: 0, failed: 0 }
      );
    }
  }, [sourceFilter, filteredReconciliations, filteredTransactions]);

  // Category budget analytics
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

    transactions.forEach(t => {
      if (t.status === "APPROVED" || t.reconciliation_status === "APPROVED" || t.reconciliation_status === "LOCKED") {
        let categoryName = "Miscellaneous";
        const catLower = (t.category || t.budget_head || "").toLowerCase();
        if (catLower.includes("venue")) categoryName = "Venue";
        else if (catLower.includes("food") || catLower.includes("refreshment")) categoryName = "Food";
        else if (catLower.includes("marketing")) categoryName = "Marketing";
        else if (catLower.includes("travel")) categoryName = "Travel";
        else if (catLower.includes("printing")) categoryName = "Printing";
        else if (catLower.includes("equipment")) categoryName = "Equipment";
        
        if (spents[categoryName] !== undefined) {
          spents[categoryName] += t.amount || 0;
        } else {
          spents["Miscellaneous"] += t.amount || 0;
        }
      }
    });

    return Object.keys(allocations).map(name => ({
      name,
      allocated: allocations[name],
      spent: spents[name],
      remaining: allocations[name] - spents[name]
    }));
  }, [transactions]);

  // Review user transaction clearance handler
  const handleReviewTransaction = async (action) => {
    if (!selectedTxn) return;
    try {
      await adminTransactionService.reviewTransaction({
        transaction_id: selectedTxn.id,
        action,
        remarks: reviewRemarks,
        is_reconciliation: true
      });
      addNotification(`Transaction status updated to ${action.toLowerCase()}.`, "success", 2000);
      setShowReviewModal(false);
      setSelectedTxn(null);
      setReviewRemarks("");
      fetchTransactions(); // Reload transactions
    } catch (err) {
      addNotification(err?.response?.data?.error || "Failed to update transaction status.", "error", 2000);
    }
  };

  // Export cycle transactions to CSV
  const exportCycleCsv = (c) => {
    const header = ["Transaction ID", "Date", "Category", "Description", "Amount", "Status", "Source"];
    const rows = (c.items || []).map((t) => [
      t.id,
      t.date,
      t.category || t.budget_head || "Miscellaneous",
      t.description,
      t.amount,
      t.status,
      t.source || "USER"
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reconciliation_report_${c.period.replace(/\s+/g, "_")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openDetails = (rec) => {
    setSelectedRec(rec);
    setShowDetailModal(true);
  };

  return (
    <main className="admin-page">
      <section className="admin-header">
        <h1>⚖️ Reconciliation Management</h1>
        <p>Compare bank statements against general ledger transactions. Review user runs and construct admin cycles.</p>
      </section>



      {/* STATS GRID / SUMMARY CARDS */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Matched Transactions</div>
          <div className="stat-value">{stats.matched}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Transactions</div>
          <div className="stat-value">{stats.pending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Failed Transactions</div>
          <div className="stat-value">{stats.failed}</div>
        </div>
      </section>

      {/* RECONCILIATIONS LIST */}
      <section className="admin-card">
        {/* Navigation Tabs */}
        <div className="tab-nav">
          <button
            type="button"
            className={`tab-chip ${sourceFilter === "ALL" ? "active" : ""}`}
            onClick={() => setSourceFilter("ALL")}
          >
            All Reconciliations
          </button>
          <button
            type="button"
            className={`tab-chip ${sourceFilter === "MY" ? "active" : ""}`}
            onClick={() => setSourceFilter("MY")}
          >
            My Reconciliations (Admin)
          </button>
          <button
            type="button"
            className={`tab-chip ${sourceFilter === "USER" ? "active" : ""}`}
            onClick={() => setSourceFilter("USER")}
          >
            User Reconciliations
          </button>
        </div>

        {sourceFilter === "USER" && (
          <div style={{ marginBottom: "24px", borderBottom: "1px solid #e2e8f0", paddingBottom: "24px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", marginBottom: "16px" }}>Category-wise Allocated Budget Analytics</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              {categoryBudgets.map((b) => {
                const percent = Math.min(100, Math.round((b.spent / b.allocated) * 100)) || 0;
                const isOverspent = b.spent > b.allocated;
                const barColor = isOverspent ? "critical" : percent > 75 ? "warning" : "healthy";
                return (
                  <div key={b.name} style={{ display: "flex", flexDirection: "column", gap: "6px", background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "700", color: "#334155" }}>
                      <span>{b.name}</span>
                      <span style={{ color: "#475569" }}>{percent}% Spent</span>
                    </div>
                    
                    <div className="progress-inline" style={{ margin: "4px 0" }}>
                      <div className="progress-track" style={{ background: "#cbd5e1" }}>
                        <div className={`progress-fill ${barColor}`} style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Allocation:</span>
                        <strong>₹{b.allocated.toLocaleString("en-IN")}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Spent:</span>
                        <strong>₹{b.spent.toLocaleString("en-IN")}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed #cbd5e1", paddingTop: "4px", marginTop: "2px" }}>
                        <span>Remaining:</span>
                        <strong style={{ color: b.remaining >= 0 ? "#16a34a" : "#ef4444" }}>₹{b.remaining.toLocaleString("en-IN")}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Searching and filtering */}
        <div className="table-header">
          <input
            type="text"
            placeholder="Search by period..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
            <option value="ALL">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="IN REVIEW">In Review</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>

        {loading && !error && <div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>Loading dynamic reconciliation data...</div>}
        {error && <div style={{ padding: "20px", textAlign: "center", color: "#ef4444" }}>{error}</div>}

        {!loading && !error && (
          sourceFilter === "USER" ? (
            /* USER RECONCILIATIONS TABLE */
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((t) => (
                      <tr key={t.id}>
                        <td style={{ fontWeight: "600" }}>{t.id}</td>
                        <td>{new Date(t.date).toLocaleDateString("en-IN")}</td>
                        <td>{t.category || t.budget_head || "Miscellaneous"}</td>
                        <td>{t.description}</td>
                        <td>₹{(t.amount || 0).toLocaleString("en-IN")}</td>
                        <td>
                          <span className={`status-badge ${t.status?.toUpperCase() === "APPROVED" ? "approved" : t.status?.toUpperCase() === "REJECTED" ? "rejected" : "pending"}`}>
                            {t.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="action-buttons" style={{ justifyContent: "flex-end" }}>
                            <button
                              className="btn-sm"
                              onClick={() => {
                                setSelectedTxn(t);
                                setReviewRemarks(t.admin_remarks || "");
                                setShowReviewModal(true);
                              }}
                            >
                              Review
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="empty-state">
                        No user transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* CYCLES TABLE */
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Matched Transactions</th>
                    <th>Pending Transactions</th>
                    <th>Failed Transactions</th>
                    <th>Completed Date</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReconciliations.length > 0 ? (
                    filteredReconciliations.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: "600" }}>{r.period}</td>
                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: "600",
                              backgroundColor: r.source === "ADMIN" ? "#f3e8ff" : "#e0f2fe",
                              color: r.source === "ADMIN" ? "#6b21a8" : "#0369a1",
                            }}
                          >
                            {r.source === "ADMIN" ? "Admin Run" : "User Run"}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${r.status === "Completed" ? "approved" : "pending"}`}>
                            {r.status}
                          </span>
                        </td>
                        <td>{r.matchedTxn}</td>
                        <td>{r.pendingTxn}</td>
                        <td>{r.failedTxn}</td>
                        <td>{r.completedDate || "N/A"}</td>
                        <td style={{ textAlign: "right" }}>
                          <div className="action-buttons" style={{ justifyContent: "flex-end" }}>
                            <button className="btn-sm" onClick={() => exportCycleCsv(r)}>Report</button>
                            <button className="btn-sm" onClick={() => openDetails(r)}>Details</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="empty-state">
                        No reconciliation cycles found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        )}
      </section>

      {/* Details Modal */}
      {showDetailModal && selectedRec && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", zIndex: 1000, display: "grid", placeItems: "center" }}>
          <div className="admin-card" style={{ width: "90%", maxWidth: "600px", padding: "24px", border: "1px solid #cbd5e1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Reconciliation Details - {selectedRec.period} ({selectedRec.source === "ADMIN" ? "Admin Run" : "User Run"})</h3>
              <button onClick={() => { setShowDetailModal(false); setSelectedRec(null); }} style={{ border: 0, background: "transparent", cursor: "pointer", fontSize: "1.5rem", color: "#94a3b8" }}>&times;</button>
            </div>

            <div className="detail-grid" style={{ marginBottom: "20px" }}>
              <div className="detail-item">
                <span>Matched Transactions</span>
                <strong>{selectedRec.matchedTxn} records</strong>
              </div>
              <div className="detail-item">
                <span>Pending Matches</span>
                <strong>{selectedRec.pendingTxn} records</strong>
              </div>
              <div className="detail-item">
                <span>Failed Adjustments</span>
                <strong>{selectedRec.failedTxn} records</strong>
              </div>
              <div className="detail-item">
                <span>Completion Date</span>
                <strong>{selectedRec.completedDate || "N/A"}</strong>
              </div>
            </div>

            <h4 style={{ margin: "0 0 10px 0", color: "#475569", fontSize: "13px", fontWeight: "600", textTransform: "uppercase" }}>Mapped Entries</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto", paddingRight: "4px" }}>
              {selectedRec.items && selectedRec.items.length > 0 ? (
                selectedRec.items.map((item, idx) => {
                  const isDebit = item.amount < 0 || item.type?.toLowerCase() === "debit" || true;
                  return (
                    <div key={item.id || idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: "8px" }}>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: "600", color: isDebit ? "#991b1b" : "#166534", background: isDebit ? "#fee2e2" : "#dcfce7", padding: "2px 6px", borderRadius: "4px", marginRight: "6px" }}>
                          {isDebit ? "Debit" : "Credit"}
                        </span>
                        <strong style={{ fontSize: "13px", color: "#1e293b" }}>{item.description}</strong>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>TXN ID: {item.id} • Category: {item.category || item.budget_head || "N/A"} • Status: {item.status}</div>
                      </div>
                      <strong style={{ fontSize: "13px", color: "#0f172a" }}>₹{(item.amount || 0).toLocaleString("en-IN")}</strong>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "10px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
                  No transaction entries in this cycle.
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
              <button onClick={() => { setShowDetailModal(false); setSelectedRec(null); }} className="btn-primary" style={{ padding: "8px 16px" }}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedTxn && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", zIndex: 1000, display: "grid", placeItems: "center" }}>
          <div className="admin-card" style={{ width: "90%", maxWidth: "500px", padding: "24px", border: "1px solid #cbd5e1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Review Transaction: {selectedTxn.id}</h3>
              <button onClick={() => { setShowReviewModal(false); setSelectedTxn(null); }} style={{ border: 0, background: "transparent", cursor: "pointer", fontSize: "1.5rem", color: "#94a3b8" }}>&times;</button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px", fontSize: "13px" }}>
              <div><strong>Description:</strong> {selectedTxn.description}</div>
              <div><strong>Category:</strong> {selectedTxn.category || selectedTxn.budget_head || "Miscellaneous"}</div>
              <div><strong>Amount:</strong> ₹{(selectedTxn.amount || 0).toLocaleString("en-IN")}</div>
              <div><strong>Submitted By:</strong> {selectedTxn.created_by_name || "User"} ({selectedTxn.created_by_email || "N/A"})</div>
              <div><strong>Current Status:</strong> {selectedTxn.status}</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Admin Remarks / Notes</label>
              <textarea
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                placeholder="Enter feedback or approval notes..."
                rows={3}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => { setShowReviewModal(false); setSelectedTxn(null); }} className="btn-sm" style={{ background: "#cbd5e1", color: "#334155" }}>Cancel</button>
              <button onClick={() => handleReviewTransaction("REQUEST_REVISION")} className="btn-sm" style={{ background: "#fef3c7", color: "#d97706", border: "1px solid #fcd34d" }}>Revision</button>
              <button onClick={() => handleReviewTransaction("REJECT")} className="btn-sm" style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" }}>Reject</button>
              <button onClick={() => handleReviewTransaction("APPROVE")} className="btn-sm" style={{ background: "#dcfce7", color: "#16a34a", border: "1px solid #86efac" }}>Approve</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default AdminReconciliation;

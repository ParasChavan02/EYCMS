import { useState, useMemo } from "react";
import "../../../styles/admin-management.css";

function AdminReconciliation() {
  const [reconciliations, setReconciliations] = useState([
    { id: "REC001", period: "May 2026", status: "Completed", matchedTxn: 145, pendingTxn: 2, failedTxn: 1, completedDate: "2026-05-30", source: "USER" },
    { id: "REC002", period: "April 2026", status: "Completed", matchedTxn: 138, pendingTxn: 0, failedTxn: 0, completedDate: "2026-04-30", source: "ADMIN" },
    { id: "REC003", period: "March 2026", status: "In Review", matchedTxn: 142, pendingTxn: 1, failedTxn: 2, completedDate: "2026-03-31", source: "USER" },
    { id: "REC004", period: "June 2026", status: "In Review", matchedTxn: 80, pendingTxn: 15, failedTxn: 5, completedDate: "2026-06-23", source: "ADMIN" },
  ]);

  // Form State
  const [form, setForm] = useState({
    period: "",
    status: "Completed",
    matchedTxn: "",
    pendingTxn: "",
    failedTxn: "",
  });
  const [message, setMessage] = useState("");

  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL"); // ALL, MY, USER

  // Detail Modal State
  const [selectedRec, setSelectedRec] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Form Change Handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Create New Reconciliation Handler
  const handleCreateReconciliation = () => {
    setMessage("");
    if (!form.period || form.matchedTxn === "" || form.pendingTxn === "" || form.failedTxn === "") {
      setMessage("❌ Please fill all required fields");
      return;
    }

    const newRec = {
      id: `REC00${reconciliations.length + 1}`,
      period: form.period,
      status: form.status,
      matchedTxn: parseInt(form.matchedTxn, 10),
      pendingTxn: parseInt(form.pendingTxn, 10),
      failedTxn: parseInt(form.failedTxn, 10),
      completedDate: new Date().toISOString().slice(0, 10),
      source: "ADMIN",
    };

    setReconciliations((prev) => [newRec, ...prev]);
    setForm({
      period: "",
      status: "Completed",
      matchedTxn: "",
      pendingTxn: "",
      failedTxn: "",
    });
    setMessage("✅ Reconciliation cycle created successfully");
  };

  // Filtered List
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

  // Aggregate Stats based on filtered lists
  const stats = useMemo(() => {
    return filteredReconciliations.reduce(
      (acc, r) => {
        acc.matched += r.matchedTxn;
        acc.pending += r.pendingTxn;
        acc.failed += r.failedTxn;
        return acc;
      },
      { matched: 0, pending: 0, failed: 0 }
    );
  }, [filteredReconciliations]);

  // Mock Detail transaction links
  const mockDetailsList = {
    REC001: [
      { type: "Debit", desc: "GOOGLE ADS / MKTG SERVICE", erpId: "TXN-001", amount: 15000, matchStatus: "Matched (Auto)" },
      { type: "Debit", desc: "CATERING EXPS / WORKSHOP LUNCH", erpId: "TXN-002", amount: 25000, matchStatus: "Matched (Auto)" },
      { type: "Debit", desc: "CITY HALL AUDITORIUM DEP", erpId: "TXN-003", amount: 50000, matchStatus: "Matched (Auto)" },
      { type: "Debit", desc: "MONTHLY BANK CHARGES", erpId: "Unresolved", amount: 3000, matchStatus: "Pending Adjustment" }
    ],
    REC002: [
      { type: "Debit", desc: "OFFICE STATIONERY CORP", erpId: "TXN-099", amount: 4500, matchStatus: "Matched (Manual)" },
      { type: "Debit", desc: "REIMBURSEMENT CAB CHARGES", erpId: "TXN-101", amount: 1200, matchStatus: "Matched (Auto)" },
      { type: "Credit", desc: "INTEREST EARNED INTEGRATED", erpId: "TXN-102", amount: 800, matchStatus: "Matched (Auto)" }
    ],
    REC003: [
      { type: "Debit", desc: "VENUE AUDIO VISUAL RENTALS", erpId: "TXN-007", amount: 40000, matchStatus: "Matched (Auto)" },
      { type: "Debit", desc: "TRAVEL FLIGHT SPEAKS", erpId: "TXN-004", amount: 20000, matchStatus: "Matched (Auto)" },
      { type: "Debit", desc: "UNAUTHORIZED CARD CHARGE", erpId: "None", amount: 2500, matchStatus: "Discrepancy (Failed)" }
    ],
    REC004: [
      { type: "Debit", desc: "PRINTING FAST BROCHURES", erpId: "TXN-008", amount: 10000, matchStatus: "Matched (Auto)" },
      { type: "Debit", desc: "META ADS / MKTG PROMO", erpId: "TXN-011", amount: 10000, matchStatus: "Matched (Manual)" }
    ]
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

      {/* CREATE RECONCILIATION */}
      <section className="admin-card">
        <h2>Create New Reconciliation Cycle</h2>
        <div className="form-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Reconciliation Period</span>
            <input
              name="period"
              value={form.period}
              onChange={handleChange}
              placeholder="e.g. June 2026"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Matched Transactions</span>
            <input
              name="matchedTxn"
              type="number"
              value={form.matchedTxn}
              onChange={handleChange}
              placeholder="Count (e.g. 120)"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Pending Transactions</span>
            <input
              name="pendingTxn"
              type="number"
              value={form.pendingTxn}
              onChange={handleChange}
              placeholder="Count (e.g. 5)"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Failed Transactions</span>
            <input
              name="failedTxn"
              type="number"
              value={form.failedTxn}
              onChange={handleChange}
              placeholder="Count (e.g. 2)"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Initial Status</span>
            <select name="status" value={form.status} onChange={handleChange} className="filter-select" style={{ minWidth: "auto", height: "46px" }}>
              <option value="Completed">Completed</option>
              <option value="In Review">In Review</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
        <div className="form-actions">
          <button onClick={handleCreateReconciliation} className="btn-primary">
            + Create Reconciliation Run
          </button>
        </div>
        {message && <div className={`form-message ${message.includes("✅") ? "success" : "error"}`}>{message}</div>}
      </section>

      {/* STATS GRID */}
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
          <div className="stat-label">Failed/Discrepancy Txn</div>
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
                    <td>{r.completedDate}</td>
                    <td style={{ textAlign: "right" }}>
                      <div className="action-buttons" style={{ justifyContent: "flex-end" }}>
                        <button className="btn-sm" onClick={() => alert(`Report download started for cycle ${r.period}`)}>Report</button>
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
      </section>

      {/* Details breakdown Modal */}
      {showDetailModal && selectedRec && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", zIndex: 1000, display: "grid", placeItems: "center" }}>
          <div className="admin-card" style={{ width: "90%", maxWidth: "600px", padding: "24px", border: "1px solid #cbd5e1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Reconciliation Details - {selectedRec.period} ({selectedRec.source === "ADMIN" ? "Admin Run" : "User Run"})</h3>
              <button onClick={() => setShowDetailModal(false)} style={{ border: 0, background: "transparent", cursor: "pointer", fontSize: "1.5rem", color: "#94a3b8" }}>&times;</button>
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
                <strong>{selectedRec.completedDate}</strong>
              </div>
            </div>

            <h4 style={{ margin: "0 0 10px 0", color: "#475569", fontSize: "13px", fontWeight: "600", textTransform: "uppercase" }}>Sample Mapped Entries</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto", paddingRight: "4px" }}>
              {(mockDetailsList[selectedRec.id] || [
                { type: "Debit", desc: "General Ledger Posting", erpId: "TXN-AUTO", amount: 1500, matchStatus: "Matched (Auto)" },
                { type: "Debit", desc: "Miscellaneous Bank Item", erpId: "TXN-MAN", amount: 800, matchStatus: "Matched (Manual)" }
              ]).map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: "8px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: "600", color: item.type === "Debit" ? "#991b1b" : "#166534", background: item.type === "Debit" ? "#fee2e2" : "#dcfce7", padding: "2px 6px", borderRadius: "4px", marginRight: "6px" }}>
                      {item.type}
                    </span>
                    <strong style={{ fontSize: "13px", color: "#1e293b" }}>{item.desc}</strong>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>ERP Link ID: {item.erpId} • Status: {item.matchStatus}</div>
                  </div>
                  <strong style={{ fontSize: "13px", color: "#0f172a" }}>₹{item.amount.toLocaleString("en-IN")}</strong>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
              <button onClick={() => setShowDetailModal(false)} className="btn-primary" style={{ padding: "8px 16px" }}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

export default AdminReconciliation;

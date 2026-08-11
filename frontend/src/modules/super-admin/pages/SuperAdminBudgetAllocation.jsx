import { useEffect, useState } from "react";
import { budgetHeadsService } from "../../../services/budgetHeadsService";
import "../../../styles/admin-management.css";

function formatCurrency(value) {
  const n = Number(value || 0);
  return `Rs ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function currentFinancialYear() {
  const now = new Date();
  const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${y}-${String(y + 1).slice(-2)}`;
}

function SuperAdminBudgetAllocation() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState(null);

  // Modals state
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantForm, setGrantForm] = useState({
    amount: "",
    financial_year: currentFinancialYear(),
    remarks: ""
  });
  const [grantSaving, setGrantSaving] = useState(false);
  const [grantError, setGrantError] = useState("");

  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocateForm, setAllocateForm] = useState({
    destination: "E-YUVA Centre",
    amount: "",
    financial_year: currentFinancialYear(),
    remarks: ""
  });
  const [allocateSaving, setAllocateSaving] = useState(false);
  const [allocateError, setAllocateError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  async function fetchData() {
    try {
      setLoading(true);
      setLoadError("");
      const data = await budgetHeadsService.getSuperOverview();
      setOverview(data);
    } catch (e) {
      console.error(e);
      setLoadError("Failed to load budget allocation metrics.");
    } finally {
      setLoading(false);
    }
  }

  const handleOpenGrantModal = () => {
    setGrantError("");
    setGrantForm({
      amount: "",
      financial_year: currentFinancialYear(),
      remarks: ""
    });
    setShowGrantModal(true);
  };

  const handleCloseGrantModal = () => {
    setShowGrantModal(false);
  };

  const handleOpenAllocateModal = () => {
    setAllocateError("");
    setAllocateForm({
      destination: "E-YUVA Centre",
      amount: "",
      financial_year: currentFinancialYear(),
      remarks: ""
    });
    setShowAllocateModal(true);
  };

  const handleCloseAllocateModal = () => {
    setShowAllocateModal(false);
  };

  const submitGrantEntry = async (e) => {
    e.preventDefault();
    const amount = Number(grantForm.amount);
    if (grantForm.amount === "" || isNaN(amount) || amount <= 0) {
      setGrantError("Enter a valid amount greater than zero.");
      return;
    }

    try {
      setGrantSaving(true);
      setGrantError("");

      const payload = {
        section: "COMMON",
        budget_head: "Total BIRAC Grant",
        allocated_amount: amount,
        financial_year: grantForm.financial_year.trim(),
        remarks: grantForm.remarks.trim() || "Manual BIRAC Grant Entry"
      };

      await budgetHeadsService.addCommonBudgetEntry(payload);
      setToast({ type: "success", message: "BIRAC Common Budget entry added successfully!" });
      setShowGrantModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setGrantError(err.response?.data?.detail || err.message || "Failed to add common budget entry.");
    } finally {
      setGrantSaving(false);
    }
  };

  const submitAllocation = async (e) => {
    e.preventDefault();
    const amount = Number(allocateForm.amount);
    if (allocateForm.amount === "" || isNaN(amount) || amount <= 0) {
      setAllocateError("Enter a valid allocation amount greater than zero.");
      return;
    }

    // Client side check
    if (amount > (overview?.available_balance || 0)) {
      setAllocateError(`Cannot allocate beyond the available balance of ${formatCurrency(overview?.available_balance)}`);
      return;
    }

    try {
      setAllocateSaving(true);
      setAllocateError("");

      const payload = {
        section: "SUPER_ALLOC",
        budget_head: allocateForm.destination,
        allocated_amount: amount,
        financial_year: allocateForm.financial_year.trim(),
        remarks: allocateForm.remarks.trim() || null
      };

      await budgetHeadsService.superAllocate(payload);
      setToast({ type: "success", message: `Successfully allocated budget to ${allocateForm.destination}!` });
      setShowAllocateModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setAllocateError(err.response?.data?.detail || err.message || "Failed to allocate budget.");
    } finally {
      setAllocateSaving(false);
    }
  };

  return (
    <main className="admin-page">
      <section className="admin-header">
        <div>
          <h1>Super Admin Budget Allocation</h1>
          <p>Manage E-YUVA Common Budget, record BIRAC Grant receipts, and distribute funds to Centre or Fellows.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn-secondary" onClick={handleOpenGrantModal}>
            + Add BIRAC Grant Entry
          </button>
          <button className="btn-primary" onClick={handleOpenAllocateModal} style={{ background: "#2563eb", borderColor: "#2563eb" }}>
            Allocate Budget
          </button>
        </div>
      </section>

      {toast && (
        <div className={`form-message ${toast.type === "error" ? "error" : "success"}`} style={{ marginBottom: "16px" }}>
          {toast.message}
        </div>
      )}

      {loading && <div className="empty-state">Loading budget overview metrics...</div>}

      {!loading && loadError && (
        <div className="empty-state">
          <p>{loadError}</p>
          <button className="btn-sm" onClick={fetchData}>Retry</button>
        </div>
      )}

      {!loading && !loadError && (
        <>
          {/* Summary Cards */}
          <section className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: "24px" }}>
            <div className="stat-card" style={{ borderLeft: "4px solid #3b82f6" }}>
              <div className="stat-label">Total Common Budget</div>
              <div className="stat-value">{formatCurrency(overview?.total_common_budget)}</div>
            </div>
            <div className="stat-card" style={{ borderLeft: "4px solid #f59e0b" }}>
              <div className="stat-label">Total Allocated</div>
              <div className="stat-value">{formatCurrency(overview?.total_allocated)}</div>
            </div>
            <div className="stat-card" style={{ borderLeft: "4px solid #10b981" }}>
              <div className="stat-label">Available Balance</div>
              <div className="stat-value" style={{ color: "#059669" }}>{formatCurrency(overview?.available_balance)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Centre Allocation</div>
              <div className="stat-value">{formatCurrency(overview?.centre_allocation)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Fellows Allocation</div>
              <div className="stat-value">{formatCurrency(overview?.fellows_allocation)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total System Utilization</div>
              <div className="stat-value">{formatCurrency(overview?.utilization)}</div>
            </div>
          </section>

          {/* Allocation & Grant History panels */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginBottom: "24px" }}>
            {/* Allocation History */}
            <section className="admin-card" style={{ margin: 0 }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "#0f172a" }}>Super Admin Allocation History</h3>
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Destination</th>
                      <th>Amount</th>
                      <th>Financial Year</th>
                      <th>Date & Time</th>
                      <th>Allocated By</th>
                      <th>Status</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview?.allocation_history && overview.allocation_history.length > 0 ? (
                      overview.allocation_history.map((h) => (
                        <tr key={h.id}>
                          <td style={{ fontWeight: "600" }}>{h.destination}</td>
                          <td style={{ fontWeight: "600" }}>{formatCurrency(h.amount)}</td>
                          <td>{h.financial_year}</td>
                          <td>{h.date || "N/A"}</td>
                          <td>{h.allocated_by}</td>
                          <td>
                            <span className="status-badge active" style={{ padding: "4px 8px" }}>
                              {h.status}
                            </span>
                          </td>
                          <td style={{ fontSize: "12px", color: "#64748b", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {h.remarks || "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="empty-state">No allocation logs recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Grant Entry Logs */}
            <section className="admin-card" style={{ margin: 0 }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "#0f172a" }}>BIRAC Grant Entry Log</h3>
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {overview?.common_history && overview.common_history.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {overview.common_history.map((g) => (
                      <div
                        key={g.id}
                        style={{
                          padding: "12px",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          backgroundColor: "#f8fafc"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontWeight: "700", color: "#1e3a8a", fontSize: "14px" }}>
                            {formatCurrency(g.amount)}
                          </span>
                          <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", background: "#cbd5e1", padding: "2px 6px", borderRadius: "4px" }}>
                            {g.financial_year}
                          </span>
                        </div>
                        <div style={{ fontSize: "11px", color: "#475569", marginBottom: "4px" }}>
                          Entered on {g.date} by {g.allocated_by}
                        </div>
                        {g.remarks && (
                          <div style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic", borderTop: "1px dashed #cbd5e1", paddingTop: "4px" }}>
                            "{g.remarks}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "#94a3b8", textAlign: "center", padding: "20px" }}>No grant entries recorded.</p>
                )}
              </div>
            </section>
          </div>
        </>
      )}

      {/* ---------- Add BIRAC Grant Modal ---------- */}
      {showGrantModal && (
        <div className="custom-modal-overlay" onClick={handleCloseGrantModal}>
          <div className="custom-modal" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="custom-modal-header">
              <h2 style={{ margin: 0, fontSize: "16px" }}>Add BIRAC Common Grant Entry</h2>
              <button className="icon-close-button" onClick={handleCloseGrantModal}>×</button>
            </div>
            <div className="custom-modal-body">
              <form onSubmit={submitGrantEntry}>
                {grantError && <div className="form-message error">{grantError}</div>}
                
                <div style={{ display: "grid", gap: "16px" }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                    Grant Receipt Amount (Rs)
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={grantForm.amount}
                      onChange={(e) => setGrantForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="e.g. 5000000"
                      className="search-input"
                      style={{ height: "40px" }}
                      required
                    />
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                    Financial Year
                    <input
                      type="text"
                      value={grantForm.financial_year}
                      onChange={(e) => setGrantForm(f => ({ ...f, financial_year: e.target.value }))}
                      placeholder="e.g. 2026-27"
                      className="search-input"
                      style={{ height: "40px" }}
                      required
                    />
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                    Remarks / Grant Reference
                    <input
                      type="text"
                      value={grantForm.remarks}
                      onChange={(e) => setGrantForm(f => ({ ...f, remarks: e.target.value }))}
                      placeholder="e.g. BIRAC 1st Installment Sanction letter ref..."
                      className="search-input"
                      style={{ height: "40px" }}
                    />
                  </label>
                </div>

                <div className="form-actions" style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button type="button" className="btn-secondary" onClick={handleCloseGrantModal}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={grantSaving}>
                    {grantSaving ? "Adding..." : "Add Entry"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Allocate Budget Modal ---------- */}
      {showAllocateModal && (
        <div className="custom-modal-overlay" onClick={handleCloseAllocateModal}>
          <div className="custom-modal" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="custom-modal-header">
              <h2 style={{ margin: 0, fontSize: "16px" }}>Allocate Common Budget Pot</h2>
              <button className="icon-close-button" onClick={handleCloseAllocateModal}>×</button>
            </div>
            <div className="custom-modal-body">
              <form onSubmit={submitAllocation}>
                {allocateError && <div className="form-message error">{allocateError}</div>}
                
                <div style={{ display: "grid", gap: "16px" }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                    Destination Pot
                    <input
                      type="text"
                      value="E-YUVA Centre"
                      disabled
                      className="search-input"
                      style={{ height: "40px", backgroundColor: "#f1f5f9", cursor: "not-allowed" }}
                    />
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                    Allocation Amount (Rs)
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={allocateForm.amount}
                      onChange={(e) => setAllocateForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="e.g. 1000000"
                      className="search-input"
                      style={{ height: "40px" }}
                      required
                    />
                    <span style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                      Available balance: {formatCurrency(overview?.available_balance)}
                    </span>
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                    Financial Year
                    <input
                      type="text"
                      value={allocateForm.financial_year}
                      onChange={(e) => setAllocateForm(f => ({ ...f, financial_year: e.target.value }))}
                      placeholder="e.g. 2026-27"
                      className="search-input"
                      style={{ height: "40px" }}
                      required
                    />
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                    Remarks
                    <input
                      type="text"
                      value={allocateForm.remarks}
                      onChange={(e) => setAllocateForm(f => ({ ...f, remarks: e.target.value }))}
                      placeholder="Operational remarks..."
                      className="search-input"
                      style={{ height: "40px" }}
                    />
                  </label>
                </div>

                <div className="form-actions" style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button type="button" className="btn-secondary" onClick={handleCloseAllocateModal}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={allocateSaving} style={{ background: "#2563eb", borderColor: "#2563eb" }}>
                    {allocateSaving ? "Allocating..." : "Allocate Budget"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default SuperAdminBudgetAllocation;

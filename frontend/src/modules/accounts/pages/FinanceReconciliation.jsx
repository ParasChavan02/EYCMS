import { useEffect, useMemo, useState } from "react";
import { accountsService } from "../services/accountsService";
import "../styles/finance.css";

// The admin/pages/AdminReconciliation.jsx page (Admin's "Reconciliation
// Management") only ever held local mock state — it never called a backend
// endpoint, and no reconciliation table exists in the database. To give
// this page a genuine backend connection instead of copying that mock data
// forward, each reconciliation "cycle" here is derived from the real
// transaction ledger (GET /accounts/transactions, the same live data used
// by the already-implemented Finance Transactions page): one cycle per
// calendar month, with matched = APPROVED, pending = DRAFT/PENDING/VERIFIED/
// REVISION_REQUESTED, and failed = REJECTED. No new backend endpoint or
// model was introduced for this.
const PENDING_STATUSES = ["DRAFT", "PENDING", "VERIFIED", "REVISION_REQUESTED"];

function fmtINR(n) {
  return "₹" + Math.round(n || 0).toLocaleString("en-IN");
}

export default function FinanceReconciliation() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedCycle, setSelectedCycle] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await accountsService.getTransactions();
        if (isMounted) setTransactions(data || []);
      } catch (err) {
        if (isMounted) setError(err?.response?.data?.error || "Unable to load reconciliation data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const cycles = useMemo(() => {
    const groups = {};
    transactions.forEach((t) => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          period: d.toLocaleString("en-IN", { month: "long", year: "numeric" }),
          sortDate: new Date(d.getFullYear(), d.getMonth(), 1),
          matched: 0,
          pending: 0,
          failed: 0,
          totalAmount: 0,
          latestDate: d,
          items: [],
        };
      }
      const g = groups[key];
      g.items.push(t);
      g.totalAmount += t.amount || 0;
      if (t.status === "APPROVED") g.matched += 1;
      else if (t.status === "REJECTED") g.failed += 1;
      else if (PENDING_STATUSES.includes(t.status)) g.pending += 1;
      if (d > g.latestDate) g.latestDate = d;
    });

    return Object.values(groups)
      .map((g) => ({
        ...g,
        status: g.pending === 0 ? "Completed" : "In Review",
      }))
      .sort((a, b) => b.sortDate - a.sortDate);
  }, [transactions]);

  const filteredCycles = useMemo(() => {
    return cycles.filter((c) => {
      const matchesSearch = c.period.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || c.status.toUpperCase() === statusFilter.toUpperCase();
      return matchesSearch && matchesStatus;
    });
  }, [cycles, search, statusFilter]);

  const totals = useMemo(
    () =>
      filteredCycles.reduce(
        (acc, c) => {
          acc.matched += c.matched;
          acc.pending += c.pending;
          acc.failed += c.failed;
          return acc;
        },
        { matched: 0, pending: 0, failed: 0 }
      ),
    [filteredCycles]
  );

  const exportCsv = () => {
    const header = ["Period", "Status", "Matched", "Pending", "Failed", "Total Transactions", "Total Amount", "Latest Activity"];
    const rows = filteredCycles.map((c) => [
      c.period,
      c.status,
      c.matched,
      c.pending,
      c.failed,
      c.items.length,
      c.totalAmount,
      c.latestDate.toLocaleDateString("en-IN"),
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bank_reconciliation.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fin-page">
      {/* HEADER */}
      <div className="fin-header">
        <div className="fin-header-top">
          <div>
            <h1>Bank Reconciliation</h1>
            <p className="subtitle">
              Monthly reconciliation cycles derived from the live transaction ledger.
            </p>
          </div>
          <span className="fin-badge-role">Read Only Access</span>
        </div>
      </div>

      {error && <div className="fin-empty">{error}</div>}
      {loading && !error && <div className="fin-empty">Loading reconciliation data…</div>}

      {!loading && !error && (
        <>
          {/* KPI GRID */}
          <div className="fin-kpi-grid">
            <div className="fin-kpi-card" style={{ "--accent": "#16a34a" }}>
              <div className="fin-kpi-icon">✔️</div>
              <div className="fin-kpi-label">Matched Transactions</div>
              <div className="fin-kpi-value">{totals.matched}</div>
            </div>

            <div className="fin-kpi-card" style={{ "--accent": "#d97706" }}>
              <div className="fin-kpi-icon">⏳</div>
              <div className="fin-kpi-label">Pending Transactions</div>
              <div className="fin-kpi-value">{totals.pending}</div>
            </div>

            <div className="fin-kpi-card" style={{ "--accent": "#dc2626" }}>
              <div className="fin-kpi-icon">❌</div>
              <div className="fin-kpi-label">Failed / Discrepancy</div>
              <div className="fin-kpi-value">{totals.failed}</div>
            </div>
          </div>

          {/* TABLE */}
          <div className="fin-card fin-section">
            <div className="fin-card-header">
              <div>
                <div className="fin-card-title">Reconciliation History</div>
                <div className="fin-card-subtitle">Monthly reconciliation cycles (read-only)</div>
              </div>
              <button type="button" className="fin-btn fin-btn-ghost" onClick={exportCsv}>
                Export CSV
              </button>
            </div>

            <div className="fin-card-body">
              <div className="fin-search-row">
                <div className="fin-search">
                  <input
                    type="text"
                    placeholder="Search by period..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select className="fin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">All Status</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="IN REVIEW">In Review</option>
                </select>
              </div>

              {filteredCycles.length === 0 ? (
                <div className="fin-empty">No reconciliation cycles found.</div>
              ) : (
                <div className="fin-table-wrap">
                  <table className="fin-table">
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>Status</th>
                        <th>Matched</th>
                        <th>Pending</th>
                        <th>Failed</th>
                        <th>Total Txns</th>
                        <th>Latest Activity</th>
                        <th>Details</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredCycles.map((c) => (
                        <tr key={c.key}>
                          <td className="bold">{c.period}</td>
                          <td>
                            <span className={`fin-badge ${c.status === "Completed" ? "badge-success" : "badge-warning"}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="mono">{c.matched}</td>
                          <td className="mono">{c.pending}</td>
                          <td className="mono">{c.failed}</td>
                          <td className="mono">{c.items.length}</td>
                          <td className="mono">{c.latestDate.toLocaleDateString("en-IN")}</td>
                          <td>
                            <button type="button" className="fin-btn fin-btn-sm" onClick={() => setSelectedCycle(c)}>
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Details Modal - lists the real transactions behind the selected cycle */}
      {selectedCycle && (
        <div className="fin-modal-overlay" onClick={() => setSelectedCycle(null)}>
          <div className="fin-modal" style={{ maxWidth: "700px" }} onClick={(e) => e.stopPropagation()}>
            <div className="fin-modal-header">
              <h3>Reconciliation Details — {selectedCycle.period}</h3>
              <button type="button" className="fin-modal-close" onClick={() => setSelectedCycle(null)}>
                &times;
              </button>
            </div>

            <div className="fin-modal-body">
              <div className="fin-modal-row">
                <span className="fin-modal-key">Matched</span>
                <span className="fin-modal-val">{selectedCycle.matched} records</span>
              </div>
              <div className="fin-modal-row">
                <span className="fin-modal-key">Pending</span>
                <span className="fin-modal-val">{selectedCycle.pending} records</span>
              </div>
              <div className="fin-modal-row">
                <span className="fin-modal-key">Failed</span>
                <span className="fin-modal-val">{selectedCycle.failed} records</span>
              </div>
              <div className="fin-modal-row">
                <span className="fin-modal-key">Total Amount</span>
                <span className="fin-modal-val">{fmtINR(selectedCycle.totalAmount)}</span>
              </div>

              <h4 style={{ margin: "16px 0 10px", fontSize: "13px", color: "var(--text-3)", textTransform: "uppercase" }}>
                Transactions in this cycle
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }}>
                {selectedCycle.items.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 10,
                      background: "#f8fafc",
                      border: "1px solid #f1f5f9",
                      borderRadius: 8,
                    }}
                  >
                    <div>
                      <span className={`fin-badge ${t.status === "APPROVED" ? "badge-success" : t.status === "REJECTED" ? "badge-danger" : "badge-warning"}`} style={{ marginRight: 8 }}>
                        {t.status}
                      </span>
                      <strong style={{ fontSize: 13 }}>{t.description}</strong>
                      <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                        {t.budget_head} • {t.project_title || "Unassigned"} • {new Date(t.date).toLocaleDateString("en-IN")}
                      </div>
                    </div>
                    <strong style={{ fontSize: 13 }}>{fmtINR(t.amount)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { budgetHeadsService } from "../../../services/budgetHeadsService";
import "../../../styles/admin-management.css";

const STATUS_FILTERS = [
  { value: "ALL", label: "All Utilization" },
  { value: "NOT_UTILIZED", label: "Not Utilized" },
  { value: "LOW", label: "Low (<50%)" },
  { value: "MEDIUM", label: "Medium (50-80%)" },
  { value: "HIGH", label: "High (>80%)" },
  { value: "EXCEEDED", label: "Exceeded" },
];

const STATUS_BADGE_CLASS = {
  NOT_UTILIZED: "inactive",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  EXCEEDED: "critical",
};

const STATUS_LABEL = {
  NOT_UTILIZED: "Not Utilized",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  EXCEEDED: "Exceeded",
};

function formatCurrency(value) {
  const n = Number(value || 0);
  return `Rs ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatPercent(value) {
  const n = Number(value || 0);
  if (!isFinite(n)) return "0%";
  return `${n.toFixed(1)}%`;
}

function progressClass(percent) {
  const n = Number(percent || 0);
  if (n > 80) return "critical";
  if (n > 60) return "warning";
  return "healthy";
}

/**
 * View-only mirror of Admin -> Finance -> Budget Heads, for the Accounts /
 * Finance role. Reuses the same budgetHeadsService (GET endpoints only —
 * the backend permits Accounts on reads via verify_admin_or_accounts, and
 * blocks it on every write endpoint). No allocate, edit, add, or delete
 * actions are rendered anywhere on this page.
 */
function FinanceBudgetHeads() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedTeams, setExpandedTeams] = useState(() => new Set());

  const [detailUserId, setDetailUserId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    fetchOverview();
  }, []);

  async function fetchOverview() {
    try {
      setLoading(true);
      setLoadError("");
      const data = await budgetHeadsService.getOverview();
      setOverview(data);
      setExpandedTeams((prev) => {
        if (prev.size > 0) return prev;
        const ids = (data?.teams || []).map((t) => t.team_id || t.team_name);
        return new Set(ids);
      });
    } catch (e) {
      console.error("Failed to load budget heads overview:", e);
      setLoadError("Failed to load budget data from the server.");
    } finally {
      setLoading(false);
    }
  }

  const teams = overview?.teams || [];
  const summary = overview?.summary || {
    total_allocated: 0,
    total_utilized: 0,
    total_remaining: 0,
    utilization_percent: 0,
  };

  const teamOptions = useMemo(
    () => teams.map((t) => ({ id: t.team_id || t.team_name, label: t.team_name })),
    [teams]
  );

  const filteredTeams = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teams
      .filter((team) => teamFilter === "ALL" || (team.team_id || team.team_name) === teamFilter)
      .map((team) => {
        const members = (team.members || []).filter((m) => {
          const matchesSearch =
            !q ||
            m.user_name?.toLowerCase().includes(q) ||
            m.user_id?.toLowerCase().includes(q) ||
            (m.team_id || "").toLowerCase().includes(q);
          const matchesStatus = statusFilter === "ALL" || m.utilization_status === statusFilter;
          return matchesSearch && matchesStatus;
        });
        return { ...team, members };
      })
      .filter((team) => team.members.length > 0 || (!search && statusFilter === "ALL"));
  }, [teams, search, teamFilter, statusFilter]);

  function toggleTeam(teamKey) {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamKey)) next.delete(teamKey);
      else next.add(teamKey);
      return next;
    });
  }

  async function openDetail(user) {
    setDetailUserId(user.user_id);
    setDetailData(null);
    setDetailError("");
    try {
      setDetailLoading(true);
      const data = await budgetHeadsService.getUserDetail(user.user_id);
      setDetailData(data);
    } catch (e) {
      console.error("Failed to load user budget detail:", e);
      setDetailError("Failed to load details for this user.");
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setDetailUserId(null);
    setDetailData(null);
    setDetailError("");
  }

  return (
    <main className="admin-page">
      <section className="admin-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h1>Budget Heads Management</h1>
            <p>Track budgets allocated to users and category-wise utilization across teams.</p>
          </div>
          <span className="status-badge inactive" style={{ whiteSpace: "nowrap" }}>
            Read Only Access
          </span>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Allocated</div>
          <div className="stat-value">{formatCurrency(summary.total_allocated)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Utilized</div>
          <div className="stat-value">{formatCurrency(summary.total_utilized)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Remaining</div>
          <div className="stat-value">{formatCurrency(summary.total_remaining)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Utilization</div>
          <div className="stat-value">{formatPercent(summary.utilization_percent)}</div>
        </div>
      </section>

      <section className="admin-card">
        <div className="transactions-toolbar">
          <div className="transactions-toolbar-filters">
            <input
              type="text"
              placeholder="Search user name, user ID or team ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className="filter-select">
              <option value="ALL">All Teams</option>
              {teamOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
              {STATUS_FILTERS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="transactions-toolbar-actions">
            <button
              className="btn-secondary"
              onClick={() => {
                setSearch("");
                setTeamFilter("ALL");
                setStatusFilter("ALL");
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>

        {loading && <div className="empty-state">Loading budget data...</div>}

        {!loading && loadError && (
          <div className="empty-state">
            {loadError}
            <div style={{ marginTop: "10px" }}>
              <button className="btn-sm" onClick={fetchOverview}>
                Retry
              </button>
            </div>
          </div>
        )}

        {!loading && !loadError && filteredTeams.length === 0 && (
          <div className="empty-state">No teams or users match the current filters.</div>
        )}

        {!loading &&
          !loadError &&
          filteredTeams.map((team) => {
            const teamKey = team.team_id || team.team_name;
            const isExpanded = expandedTeams.has(teamKey);
            return (
              <div key={teamKey} className="admin-card" style={{ marginBottom: "14px", boxShadow: "none", border: "1px solid var(--border)" }}>
                <div
                  onClick={() => toggleTeam(teamKey)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ display: "inline-block", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
                      ▶
                    </span>
                    <div>
                      <h2 style={{ margin: 0 }}>{team.team_name}</h2>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{team.member_count} member(s)</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
                    <div style={{ fontSize: "13px" }}>
                      <strong>Budget:</strong> {formatCurrency(team.total_allocated)}
                    </div>
                    <div style={{ fontSize: "13px" }}>
                      <strong>Utilized:</strong> {formatCurrency(team.total_utilized)}
                    </div>
                    <div style={{ fontSize: "13px" }}>
                      <strong>Remaining:</strong> {formatCurrency(team.total_remaining)}
                    </div>
                    <div style={{ fontSize: "13px" }}>
                      <strong>Util:</strong> {formatPercent(team.utilization_percent)}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="table-wrapper" style={{ marginTop: "14px" }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>User ID</th>
                          <th>Allocated</th>
                          <th>Utilized</th>
                          <th>Remaining</th>
                          <th>Utilization</th>
                          <th>Categories</th>
                          <th>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {team.members.length === 0 && (
                          <tr>
                            <td colSpan={8} style={{ textAlign: "center", color: "#94a3b8" }}>
                              No users match the current filters.
                            </td>
                          </tr>
                        )}
                        {team.members.map((m) => (
                          <tr key={m.user_id}>
                            <td>{m.user_name}</td>
                            <td>{m.user_id}</td>
                            <td>{formatCurrency(m.allocated_amount)}</td>
                            <td>{formatCurrency(m.utilized_amount)}</td>
                            <td>{formatCurrency(m.remaining_amount)}</td>
                            <td>
                              <div className="progress-inline">
                                <div className="progress-track">
                                  <div
                                    className={`progress-fill ${progressClass(m.utilization_percent)}`}
                                    style={{ width: `${Math.min(Number(m.utilization_percent || 0), 100)}%` }}
                                  />
                                </div>
                                <span className="progress-value">{formatPercent(m.utilization_percent)}</span>
                              </div>
                              <span className={`status-badge ${STATUS_BADGE_CLASS[m.utilization_status] || "inactive"}`} style={{ marginTop: "4px", display: "inline-block" }}>
                                {STATUS_LABEL[m.utilization_status] || "Not Utilized"}
                              </span>
                            </td>
                            <td>{m.category_count}</td>
                            <td>
                              <div className="action-buttons">
                                <button className="btn-sm" onClick={() => openDetail(m)}>
                                  View Details
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
      </section>

      {/* ---------- User detail (read-only) ---------- */}
      {detailUserId && (
        <div className="custom-modal-overlay" onClick={closeDetail}>
          <div className="custom-modal" style={{ maxWidth: "760px" }} onClick={(e) => e.stopPropagation()}>
            <div className="custom-modal-header">
              <h2 style={{ margin: 0, fontSize: "16px" }}>User Budget Details</h2>
              <button className="icon-close-button" onClick={closeDetail}>
                ×
              </button>
            </div>
            <div className="custom-modal-body">
              {detailLoading && <div className="empty-state">Loading details...</div>}
              {!detailLoading && detailError && <div className="empty-state">{detailError}</div>}

              {!detailLoading && detailData && (
                <>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span>Name</span>
                      <strong>{detailData.user_name}</strong>
                    </div>
                    <div className="detail-item">
                      <span>User ID</span>
                      <strong>{detailData.user_id}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Team ID</span>
                      <strong>{detailData.team_id || "—"}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Email</span>
                      <strong>{detailData.email}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Role</span>
                      <strong>{detailData.role || "—"}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Financial Year</span>
                      <strong>{detailData.financial_year || "—"}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Allocated Budget</span>
                      <strong>{formatCurrency(detailData.allocated_amount)}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Utilized</span>
                      <strong>{formatCurrency(detailData.utilized_amount)}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Remaining</span>
                      <strong>{formatCurrency(detailData.remaining_amount)}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Utilization</span>
                      <strong>{formatPercent(detailData.utilization_percent)}</strong>
                    </div>
                  </div>

                  <h2 style={{ fontSize: "14px", marginTop: "20px" }}>Spending Categories</h2>
                  <div className="table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Amount</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(detailData.spending || []).length === 0 && (
                          <tr>
                            <td colSpan={3} style={{ textAlign: "center", color: "#94a3b8" }}>
                              No spending categories yet.
                            </td>
                          </tr>
                        )}
                        {(detailData.spending || []).map((item) => (
                          <tr key={item.id}>
                            <td>{item.category_name}</td>
                            <td>{formatCurrency(item.amount)}</td>
                            <td>{item.remarks || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                      {(detailData.spending || []).length > 0 && (
                        <tfoot>
                          <tr>
                            <td>
                              <strong>Total</strong>
                            </td>
                            <td>
                              <strong>{formatCurrency(detailData.utilized_amount)}</strong>
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>

                  {detailData.allocation_history && detailData.allocation_history.length > 0 && (
                    <>
                      <h2 style={{ fontSize: "14px", marginTop: "20px" }}>Allocation History</h2>
                      <div className="table-wrapper">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Financial Year</th>
                              <th>Allocated Amount</th>
                              <th>Remarks</th>
                              <th>Updated</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detailData.allocation_history.map((h) => (
                              <tr key={h.id}>
                                <td>{h.financial_year}</td>
                                <td>{formatCurrency(h.allocated_amount)}</td>
                                <td>{h.remarks || "—"}</td>
                                <td>{new Date(h.updated_at).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default FinanceBudgetHeads;

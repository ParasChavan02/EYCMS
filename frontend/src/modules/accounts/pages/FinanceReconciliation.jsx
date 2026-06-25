import { useEffect, useMemo, useRef, useState } from "react";
import {
  IndianRupee,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Activity,
  AlertTriangle,
  Info,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  Eye
} from "lucide-react";
import "../styles/finance.css";

function FinanceReconciliation() {
  const TOTAL_BUDGET = 330000;
  const AMOUNT_RECEIVED = 300000;
  const LAST_FINANCE_REVIEW_DATE = "Jun 18, 2026";

  const accountInfo = {
    projectId: "PRJ-2026-089",
    projectName: "EcoDrive Clean Energy Campaign",
    accountNumber: "•••• •••• •••• 4092",
    bankName: "State Bank of India",
    ifsc: "SBIN0000301",
    lastUpdated: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };

  const transactions = [
    { id: "TXN-REC-001", date: "2026-06-18", category: "Travel", description: "Train ticket to meet research mentor in Delhi", amount: 25000, status: "Verified", tone: "approved" },
    { id: "TXN-REC-002", date: "2026-06-17", category: "Food", description: "Working lunch with industry experts for research guidance", amount: 15000, status: "Pending", tone: "pending" },
    { id: "TXN-REC-003", date: "2026-06-15", category: "Marketing", description: "Printing survey questionnaires and feedback forms", amount: 40000, status: "Verified", tone: "approved" },
    { id: "TXN-REC-004", date: "2026-06-14", category: "Travel", description: "Local cab fare for field research and data collection visits", amount: 20000, status: "Verified", tone: "approved" },
    { id: "TXN-REC-005", date: "2026-06-12", category: "Equipment and Miscellaneous", description: "Purchase of laboratory test tubes and research chemical consumables", amount: 120000, status: "Verified", tone: "approved" },
    { id: "TXN-REC-006", date: "2026-06-10", category: "Venue", description: "Meeting room rental for co-researchers discussion group", amount: 50000, status: "Verified", tone: "approved" },
    { id: "TXN-REC-007", date: "2026-06-08", category: "Equipment and Miscellaneous", description: "Reference books and subscription to online research journal portals", amount: 20000, status: "Pending", tone: "pending" },
    { id: "TXN-REC-008", date: "2026-06-05", category: "Marketing", description: "Poster design and printing for academic research presentation", amount: 10000, status: "Rejected", tone: "rejected" },
  ];

  const activities = [
    { time: "Today, 10:15 AM", text: "Laboratory consumables purchase approved by Admin", type: "approval", tone: "approved" },
    { time: "Yesterday, 04:30 PM", text: "Working lunch bill submitted by Fellow (Awaiting Admin approval)", type: "submission", tone: "pending" },
    { time: "Yesterday, 11:20 AM", text: "Reference books bill submitted by Fellow (Awaiting Admin approval)", type: "submission", tone: "pending" },
    { time: "Jun 18, 2026", text: "Meeting room rental bill approved by Admin", type: "approval", tone: "approved" },
    { time: "Jun 15, 2026", text: "Academic poster print bill rejected by Admin", type: "rejection", tone: "rejected" },
  ];

  const amountUtilized = useMemo(() =>
    transactions.filter((t) => t.status === "Verified").reduce((sum, t) => sum + t.amount, 0),
  []);

  const pendingVerification = useMemo(() =>
    transactions.filter((t) => t.status === "Pending").reduce((sum, t) => sum + t.amount, 0),
  []);

  const remainingBalance = AMOUNT_RECEIVED - amountUtilized;

  const statusOverview = useMemo(() => ({
    verified: transactions.filter((t) => t.status === "Verified").length,
    pending: transactions.filter((t) => t.status === "Pending").length,
    rejected: transactions.filter((t) => t.status === "Rejected").length,
    total: transactions.length,
  }), []);

  const budgetUtilizationPercentage = Math.round((amountUtilized / TOTAL_BUDGET) * 100);

  const riskLevel = useMemo(() => {
    if (budgetUtilizationPercentage < 75) return "Low";
    if (budgetUtilizationPercentage < 90) return "Medium";
    return "High";
  }, [budgetUtilizationPercentage]);

  const overallFinancialStatus = useMemo(() => {
    if (riskLevel === "Low") return { label: "Healthy", tone: "approved" };
    if (riskLevel === "Medium") return { label: "On Track (Review Advised)", tone: "pending" };
    return { label: "Critical (Over Budget Risk)", tone: "rejected" };
  }, [riskLevel]);

  return (
    <main className="user-erp-page">
      <div className="user-erp-shell">

        {/* ── Header ── */}
        <header
          className="user-erp-header"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}
        >
          <div>
            <h1>Project Bank Reconciliation</h1>
            <p>Read-only financial overview for monitoring, audit, and compliance purposes.</p>
          </div>

          {/* Read-only badge — no action buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              background: "#f0f5ff",
              border: "1px solid #c7d7fd",
              borderRadius: "8px",
              color: "#1d5cff",
              fontSize: "0.85rem",
              fontWeight: "700",
            }}
          >
            <Eye size={15} />
            Read Only Access
          </div>
        </header>

        {/* ── 1. Financial Summary Cards ── */}
        <section className="user-stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <article className="user-erp-card user-stat-card">
            <div className="user-stat-icon" style={{ color: "#1d5cff", background: "#1d5cff15" }}>
              <IndianRupee size={26} />
            </div>
            <div>
              <p style={{ margin: "0 0 10px", fontSize: "0.88rem", fontWeight: "600", color: "#536987" }}>Total Budget</p>
              <strong style={{ fontSize: "1.25rem" }}>Rs {TOTAL_BUDGET.toLocaleString("en-IN")}</strong>
              <span className="user-stat-note" style={{ fontSize: "0.75rem", color: "#64748b" }}>Overall limit assigned</span>
            </div>
          </article>

          <article className="user-erp-card user-stat-card">
            <div className="user-stat-icon" style={{ color: "#10b981", background: "#10b98115" }}>
              <Building2 size={26} />
            </div>
            <div>
              <p style={{ margin: "0 0 10px", fontSize: "0.88rem", fontWeight: "600", color: "#536987" }}>Amount Received</p>
              <strong style={{ fontSize: "1.25rem" }}>Rs {AMOUNT_RECEIVED.toLocaleString("en-IN")}</strong>
              <span className="user-stat-note" style={{ fontSize: "0.75rem", color: "#64748b" }}>Disbursed by Admin</span>
            </div>
          </article>

          <article className="user-erp-card user-stat-card">
            <div className="user-stat-icon" style={{ color: "#7c3aed", background: "#7c3aed15" }}>
              <Wallet size={26} />
            </div>
            <div>
              <p style={{ margin: "0 0 10px", fontSize: "0.88rem", fontWeight: "600", color: "#536987" }}>Amount Utilized</p>
              <strong style={{ fontSize: "1.25rem" }}>Rs {amountUtilized.toLocaleString("en-IN")}</strong>
              <span className="user-stat-note" style={{ fontSize: "0.75rem", color: "#64748b" }}>Total verified expenses</span>
            </div>
          </article>

          <article className="user-erp-card user-stat-card">
            <div className="user-stat-icon" style={{ color: "#0891b2", background: "#0891b215" }}>
              <TrendingUp size={26} />
            </div>
            <div>
              <p style={{ margin: "0 0 10px", fontSize: "0.88rem", fontWeight: "600", color: "#536987" }}>Remaining Balance</p>
              <strong style={{ fontSize: "1.25rem" }}>Rs {remainingBalance.toLocaleString("en-IN")}</strong>
              <span className="user-stat-note" style={{ fontSize: "0.75rem", color: "#64748b" }}>Funds unspent</span>
            </div>
          </article>

          <article className="user-erp-card user-stat-card">
            <div className="user-stat-icon" style={{ color: "#b45309", background: "#b4530915" }}>
              <Clock size={26} />
            </div>
            <div>
              <p style={{ margin: "0 0 10px", fontSize: "0.88rem", fontWeight: "600", color: "#536987" }}>Pending Verification</p>
              <strong style={{ fontSize: "1.25rem" }}>Rs {pendingVerification.toLocaleString("en-IN")}</strong>
              <span className="user-stat-note" style={{ fontSize: "0.75rem", color: "#64748b" }}>Awaiting review</span>
            </div>
          </article>
        </section>

        {/* ── 2. Account Info + Reconciliation Progress ── */}
        <section className="user-dashboard-grid" style={{ gridTemplateColumns: "4fr 5fr" }}>

          <article className="user-erp-card">
            <h2 style={{ fontSize: "1.1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
              Project Account Information
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "600" }}>PROJECT ID</span>
                <p style={{ margin: "4px 0 0", fontSize: "0.92rem", fontWeight: "700", color: "#1e293b" }}>{accountInfo.projectId}</p>
              </div>
              <div>
                <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "600" }}>BANK NAME</span>
                <p style={{ margin: "4px 0 0", fontSize: "0.92rem", fontWeight: "700", color: "#1e293b" }}>{accountInfo.bankName}</p>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "600" }}>PROJECT NAME</span>
                <p style={{ margin: "4px 0 0", fontSize: "0.92rem", fontWeight: "700", color: "#1e293b" }}>{accountInfo.projectName}</p>
              </div>
              <div>
                <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "600" }}>ASSIGNED ACCOUNT</span>
                <p style={{ margin: "4px 0 0", fontSize: "0.92rem", fontWeight: "700", color: "#1e293b" }}>{accountInfo.accountNumber}</p>
              </div>
              <div>
                <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "600" }}>IFSC CODE</span>
                <p style={{ margin: "4px 0 0", fontSize: "0.92rem", fontWeight: "700", color: "#1e293b" }}>{accountInfo.ifsc}</p>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "600" }}>LAST RECONCILED DATE</span>
                <p style={{ margin: "4px 0 0", fontSize: "0.88rem", fontWeight: "500", color: "#64748b" }}>{accountInfo.lastUpdated}</p>
              </div>
            </div>
          </article>

          <article className="user-erp-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "20px" }}>
                Reconciliation Progress Tracker
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 24px" }}>
                Status tracking of active research bill uploads and administrative audit clearance.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", position: "relative", padding: "10px 0 20px" }}>
              <div style={{ position: "absolute", left: "10%", right: "10%", top: "22px", height: "3px", background: "#cbd5e1", zIndex: 1 }} />
              <div style={{ position: "absolute", left: "10%", width: "60%", top: "22px", height: "3px", background: "linear-gradient(90deg, #10b981, #3b82f6)", zIndex: 2 }} />

              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", zIndex: 3 }}>
                {[
                  { label: "Created", done: true, active: false, num: "✓" },
                  { label: "Submitted", done: true, active: false, num: "✓" },
                  { label: "Finance Review", done: false, active: true, num: "3" },
                  { label: "Verified", done: false, active: false, num: "4" },
                ].map((step) => (
                  <div key={step.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "1" }}>
                    <div style={{
                      width: "26px", height: "26px", borderRadius: "50%",
                      background: step.done ? "#10b981" : step.active ? "#3b82f6" : "#e2e8f0",
                      color: step.done || step.active ? "white" : "#64748b",
                      display: "grid", placeItems: "center",
                      fontSize: "0.75rem", fontWeight: "bold",
                      boxShadow: step.active ? "0 0 0 4px rgba(59,130,246,0.25)" : "none",
                    }}>
                      {step.num}
                    </div>
                    <span style={{
                      fontSize: "0.78rem", fontWeight: "700", marginTop: "8px", textAlign: "center",
                      color: step.done ? "#10b981" : step.active ? "#3b82f6" : "#64748b",
                    }}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </section>

        {/* ── 3. Reconciliation Status Overview ── */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
          {[
            { label: "APPROVED", value: statusOverview.verified, color: "#10b981" },
            { label: "AWAITING APPROVAL", value: statusOverview.pending, color: "#f59e0b" },
            { label: "REJECTED", value: statusOverview.rejected, color: "#ef4444" },
            { label: "TOTAL TRANSACTIONS", value: statusOverview.total, color: "#3b82f6" },
          ].map((item) => (
            <div
              key={item.label}
              style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}
            >
              <div style={{ width: "8px", height: "40px", borderRadius: "4px", background: item.color }} />
              <div>
                <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "600" }}>{item.label}</span>
                <p style={{ margin: "4px 0 0", fontSize: "1.4rem", fontWeight: "800", color: "#1e293b" }}>{item.value}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ── 4. Transaction Verification Table (read-only, no filters) ── */}
        <section className="user-erp-card user-table-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
            <div>
              <h2>Transaction Verification Panel</h2>
              <p style={{ margin: "4px 0 0", color: "#536987", fontSize: "0.9rem" }}>
                Read-only log of all uploaded bills and their administrative clearance status.
              </p>
            </div>
            <span style={{ fontSize: "0.85rem", color: "#536987", fontWeight: "600" }}>
              {transactions.length} entries total
            </span>
          </div>

          {/* Read-only notice banner */}
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 14px", marginBottom: "20px",
            background: "#f0f5ff", border: "1px solid #c7d7fd",
            borderRadius: "8px", color: "#1d5cff", fontSize: "0.83rem", fontWeight: "600",
          }}>
            <Eye size={15} />
            You have read-only access to this panel. Filters and exports are restricted to the Fellow's view.
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="user-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id}>
                    <td style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#536987" }}>{txn.id}</td>
                    <td>{txn.date}</td>
                    <td>
                      <span style={{ fontSize: "0.82rem", background: "#f1f5f9", padding: "4px 8px", borderRadius: "6px", color: "#334155", fontWeight: "600" }}>
                        {txn.category === "Equipment and Miscellaneous" ? "Equipment & Misc" : txn.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: "600", color: "#1f3450" }}>{txn.description}</td>
                    <td style={{ textAlign: "right", fontWeight: "700", color: "#243b58" }}>
                      Rs {txn.amount.toLocaleString("en-IN")}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`user-status ${txn.tone}`} style={{ fontSize: "0.78rem" }}>
                        {txn.status === "Verified"
                          ? "Approved by Admin"
                          : txn.status === "Pending"
                          ? "Bill Uploaded, Awaiting Admin Approval"
                          : "Rejected by Admin"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 5. Financial Health + Alerts + Timeline ── */}
        <section className="user-dashboard-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>

          {/* Column 1 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Financial Health Card */}
            <article className="user-erp-card">
              <h2 style={{ fontSize: "1.1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
                Project Financial Health Card
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                <div style={{
                  position: "relative", width: "80px", height: "80px", borderRadius: "50%",
                  background: `conic-gradient(#7c3aed ${budgetUtilizationPercentage}%, #e2e8f0 ${budgetUtilizationPercentage}% 100%)`,
                  display: "grid", placeItems: "center",
                }}>
                  <div style={{ width: "66px", height: "66px", borderRadius: "50%", background: "white", display: "grid", placeItems: "center" }}>
                    <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "#1e293b" }}>{budgetUtilizationPercentage}%</span>
                  </div>
                </div>
                <div style={{ flex: 1, display: "grid", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Risk Profile:</span>
                    <span className={`user-status ${riskLevel === "Low" ? "approved" : riskLevel === "Medium" ? "pending" : "rejected"}`} style={{ fontSize: "0.75rem", padding: "2px 8px" }}>
                      {riskLevel} Risk
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Financial Status:</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: "700" }}>{overallFinancialStatus.label}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Last Audit Clearance:</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "#475569" }}>{LAST_FINANCE_REVIEW_DATE}</span>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>
                  <span>Total Budget Utilization</span>
                  <span>Rs {amountUtilized.toLocaleString("en-IN")} / Rs {TOTAL_BUDGET.toLocaleString("en-IN")}</span>
                </div>
                <div className="user-progress" style={{ margin: 0 }}>
                  <span style={{ width: `${budgetUtilizationPercentage}%`, background: "linear-gradient(90deg, #7c3aed, #10b981)" }} />
                </div>
              </div>
            </article>

            {/* Alerts & Notifications */}
            <article className="user-erp-card">
              <h2 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>Alerts & Notifications</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {budgetUtilizationPercentage >= 80 ? (
                  <div style={{ display: "flex", gap: "10px", padding: "12px", background: "#ffdede", border: "1px solid #fecaca", borderRadius: "8px", color: "#b91c1c", fontSize: "0.85rem" }}>
                    <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                    <div>
                      <strong style={{ display: "block" }}>Budget Alert: High Utilization</strong>
                      Budget utilization exceeds 80% limit (Currently {budgetUtilizationPercentage}%).
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "10px", padding: "12px", background: "#fff0d8", border: "1px solid #fde68a", borderRadius: "8px", color: "#b45309", fontSize: "0.85rem" }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <div>
                      <strong style={{ display: "block" }}>Budget Alert: Approaching Limit</strong>
                      Budget utilization stands at {budgetUtilizationPercentage}%. Monitor pending settlements.
                    </div>
                  </div>
                )}
                {statusOverview.pending > 0 && (
                  <div style={{ display: "flex", gap: "10px", padding: "12px", background: "#f0f5ff", border: "1px solid #1d5cff", borderRadius: "8px", color: "#0f4ad8", fontSize: "0.85rem" }}>
                    <Info size={18} style={{ flexShrink: 0 }} />
                    <div>
                      <strong style={{ display: "block" }}>Reconciliation Verification Needed</strong>
                      {statusOverview.pending} bills are currently awaiting E-YUVA Admin clearance.
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", gap: "10px", padding: "12px", background: "#e8fff5", border: "1px solid #a7f3d0", borderRadius: "8px", color: "#047857", fontSize: "0.85rem" }}>
                  <ShieldCheck size={18} style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ display: "block" }}>Admin Clearance Received</strong>
                    Recent finance approval received for May 2026 expense filings.
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* Column 2: Financial Activity Timeline */}
          <article className="user-erp-card">
            <h2 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>Financial Activity Timeline</h2>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 16px" }}>
              Audit log detailing reconciliation checkpoints, approvals, updates, and reviews.
            </p>
            <div className="user-list" style={{ marginTop: 0 }}>
              {activities.map((activity, index) => (
                <div
                  className="user-list-row"
                  key={index}
                  style={{
                    borderLeft: `3px solid ${
                      activity.tone === "approved" ? "#10b981"
                      : activity.tone === "pending" ? "#f59e0b"
                      : "#ef4444"
                    }`,
                    padding: "12px 14px",
                  }}
                >
                  <div className="user-list-main" style={{ gap: "12px" }}>
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                      background: activity.tone === "approved" ? "#e8fff5" : activity.tone === "pending" ? "#fffbeb" : "#ffdede",
                      color: activity.tone === "approved" ? "#10b981" : activity.tone === "pending" ? "#f59e0b" : "#ef4444",
                    }}>
                      {activity.type === "approval" ? <CheckCircle2 size={14} />
                        : activity.type === "rejection" ? <XCircle size={14} />
                        : <Clock size={14} />}
                    </div>
                    <div>
                      <h3 style={{ fontSize: "0.88rem", fontWeight: "600", margin: 0 }}>{activity.text}</h3>
                      <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

      </div>
    </main>
  );
}

export default FinanceReconciliation;
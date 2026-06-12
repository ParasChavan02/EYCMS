import { useState } from "react";
import "../styles/finance.css";

const kpis = [
  { label: "Total Budget", value: "₹12,50,000", icon: "💰", iconBg: "#eff6ff", accent: "#2563eb", trend: "+5% from last quarter", trendUp: true },
  { label: "Total Expenses", value: "₹8,45,000", icon: "📊", iconBg: "#fdf4ff", accent: "#9333ea", trend: "67.6% of budget", trendUp: null },
  { label: "Remaining Budget", value: "₹4,05,000", icon: "🏦", iconBg: "#f0fdf4", accent: "#16a34a", trend: "32.4% remaining", trendUp: true },
  { label: "Pending Bills", value: "12", icon: "🧾", iconBg: "#fffbeb", accent: "#d97706", trend: "3 due this week", trendUp: false },
];

const transactions = [
  { date: "08 Jun 2026", debit: "Operations A/C", credit: "Vendor A/C", beneficiary: "TechCorp Pvt Ltd", amount: "₹45,000", status: "Completed" },
  { date: "07 Jun 2026", debit: "Training A/C", credit: "Events A/C", beneficiary: "SkillUp Ltd", amount: "₹12,500", status: "Completed" },
  { date: "06 Jun 2026", debit: "Equipment A/C", credit: "Supplier A/C", beneficiary: "OfficePro", amount: "₹88,000", status: "Pending" },
  { date: "05 Jun 2026", debit: "Travel A/C", credit: "Employee A/C", beneficiary: "Ramesh Kumar", amount: "₹8,200", status: "Completed" },
  { date: "04 Jun 2026", debit: "Events A/C", credit: "Vendor A/C", beneficiary: "EventHouse", amount: "₹32,000", status: "Pending" },
  { date: "03 Jun 2026", debit: "Operations A/C", credit: "Utility A/C", beneficiary: "PowerGrid Ltd", amount: "₹15,600", status: "Completed" },
];

const bills = [
  { id: "BILL-001", vendor: "TechCorp Pvt Ltd", amount: "₹45,000", status: "Approved" },
  { id: "BILL-002", vendor: "OfficePro Supplies", amount: "₹88,000", status: "Pending" },
  { id: "BILL-003", vendor: "EventHouse Pvt Ltd", amount: "₹32,000", status: "Pending" },
  { id: "BILL-004", vendor: "SkillUp Training", amount: "₹12,500", status: "Approved" },
  { id: "BILL-005", vendor: "Travel Agency India", amount: "₹28,000", status: "Rejected" },
];

const notifications = [
  { msg: "Budget utilization crossed 60% threshold", time: "2 hours ago", color: "#d97706" },
  { msg: "New bill submitted by OfficePro (₹88,000)", time: "4 hours ago", color: "#2563eb" },
  { msg: "Q1 Audit has been completed successfully", time: "Yesterday", color: "#16a34a" },
  { msg: "Monthly expense report is ready for review", time: "2 days ago", color: "#0891b2" },
];

const statusMap = {
  Completed: "badge-success",
  Pending: "badge-warning",
  Approved: "badge-success",
  Rejected: "badge-danger",
};

export default function FinanceDashboard() {
  const utilization = 68;
  const utilizationColor = utilization > 80 ? "danger" : utilization > 60 ? "warning" : "success";

  return (
    <div className="fin-page">
      <div className="fin-header">
        <div className="fin-header-top">
          <div>
            <h1>Finance Dashboard</h1>
            <p className="subtitle">Welcome back! Here's your financial overview for June 2026.</p>
          </div>
          <span className="fin-badge-role">Read Only Access</span>
        </div>
      </div>

      <div className="fin-kpi-grid">
        {kpis.map((k, i) => (
          <div key={i} className="fin-kpi-card" style={{ "--accent": k.accent, "--icon-bg": k.iconBg }}>
            <div className="fin-kpi-icon">{k.icon}</div>
            <div className="fin-kpi-label">{k.label}</div>
            <div className="fin-kpi-value">{k.value}</div>
            <div className="fin-kpi-trend">
              {k.trendUp === true && <span className="trend-up">↑</span>}
              {k.trendUp === false && <span className="trend-down">↓</span>}
              {k.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="fin-two-col">
        <div className="fin-card">
          <div className="fin-card-header">
            <div>
              <div className="fin-card-title">Budget Utilization</div>
              <div className="fin-card-subtitle">FY 2026 — Annual Budget Tracking</div>
            </div>
            <span className="fin-badge badge-warning">{utilization}% Used</span>
          </div>
          <div className="fin-card-body">
            <div className="fin-progress-wrap" style={{ marginBottom: 24 }}>
              <div className="fin-progress-meta">
                <span className="fin-progress-label">Overall Budget (₹12,50,000)</span>
                <span className="fin-progress-pct">{utilization}%</span>
              </div>
              <div className="fin-progress-track">
                <div className={`fin-progress-fill ${utilizationColor}`} style={{ width: `${utilization}%` }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
              {[
                { label: "Operations", pct: 75 },
                { label: "Equipment", pct: 82 },
                { label: "Travel", pct: 55 },
                { label: "Training", pct: 48 },
                { label: "Events", pct: 63 },
              ].map((b) => (
                <div key={b.label} className="fin-progress-wrap">
                  <div className="fin-progress-meta">
                    <span className="fin-progress-label">{b.label}</span>
                    <span className="fin-progress-pct">{b.pct}%</span>
                  </div>
                  <div className="fin-progress-track">
                    <div className={`fin-progress-fill ${b.pct > 80 ? "danger" : b.pct > 60 ? "warning" : "success"}`} style={{ width: `${b.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="fin-card">
          <div className="fin-card-header">
            <div>
              <div className="fin-card-title">Notifications</div>
              <div className="fin-card-subtitle">Recent alerts & updates</div>
            </div>
            <span className="fin-badge badge-primary">4 New</span>
          </div>
          <div className="fin-card-body">
            {notifications.map((n, i) => (
              <div className="fin-notif-item" key={i}>
                <div className="fin-notif-dot" style={{ background: n.color }} />
                <div>
                  <div className="fin-notif-text">{n.msg}</div>
                  <div className="fin-notif-time">{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fin-card fin-section">
        <div className="fin-card-header">
          <div>
            <div className="fin-card-title">Recent Transactions</div>
            <div className="fin-card-subtitle">Last 6 financial transactions</div>
          </div>
        </div>
        <div className="fin-card-body">
          <div className="fin-table-wrap">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Date</th><th>Debit Account</th><th>Credit Account</th>
                  <th>Beneficiary</th><th>Amount</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr key={i}>
                    <td className="mono">{t.date}</td>
                    <td>{t.debit}</td>
                    <td>{t.credit}</td>
                    <td className="bold">{t.beneficiary}</td>
                    <td className="bold mono">{t.amount}</td>
                    <td><span className={`fin-badge ${statusMap[t.status]}`}>{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="fin-card fin-section">
        <div className="fin-card-header">
          <div>
            <div className="fin-card-title">Recent Bills</div>
            <div className="fin-card-subtitle">Latest submitted bills</div>
          </div>
        </div>
        <div className="fin-card-body">
          <div className="fin-table-wrap">
            <table className="fin-table">
              <thead>
                <tr><th>Bill ID</th><th>Vendor</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {bills.map((b, i) => (
                  <tr key={i}>
                    <td className="mono bold">{b.id}</td>
                    <td>{b.vendor}</td>
                    <td className="bold mono">{b.amount}</td>
                    <td><span className={`fin-badge ${statusMap[b.status]}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
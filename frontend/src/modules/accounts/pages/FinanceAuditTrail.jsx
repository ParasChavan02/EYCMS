import { useState } from "react";
import "../styles/finance.css";

const allLogs = [
  { ts: "08 Jun 2026, 10:42 AM", user: "Admin", action: "Updated Q2 budget allocation for Equipment", module: "Budget", status: "Success" },
  { ts: "08 Jun 2026, 09:15 AM", user: "Finance Manager", action: "Viewed monthly expense report for June 2026", module: "Reports", status: "Info" },
  { ts: "07 Jun 2026, 04:30 PM", user: "Admin", action: "Approved bill BILL-001 from TechCorp Pvt Ltd", module: "Bills", status: "Success" },
  { ts: "07 Jun 2026, 02:10 PM", user: "Finance Exec", action: "Searched audit trail for keyword 'travel'", module: "Audit", status: "Info" },
  { ts: "07 Jun 2026, 11:55 AM", user: "Admin", action: "Rejected bill BILL-005 from Travel Agency India", module: "Bills", status: "Warning" },
  { ts: "06 Jun 2026, 05:00 PM", user: "System", action: "Auto-generated monthly audit report for May 2026", module: "Reports", status: "Success" },
  { ts: "06 Jun 2026, 03:20 PM", user: "Finance Manager", action: "Reviewed budget utilization dashboard", module: "Dashboard", status: "Info" },
  { ts: "06 Jun 2026, 01:00 PM", user: "Admin", action: "Updated Operations budget head by ₹20,000", module: "Budget", status: "Warning" },
  { ts: "05 Jun 2026, 11:00 AM", user: "Finance Exec", action: "Exported Q1 expense report to PDF", module: "Reports", status: "Success" },
  { ts: "05 Jun 2026, 09:30 AM", user: "Admin", action: "Added new vendor: EventHouse Pvt Ltd", module: "Bills", status: "Success" },
  { ts: "04 Jun 2026, 04:45 PM", user: "Finance Manager", action: "Verified audit trail for BILL-004", module: "Audit", status: "Info" },
  { ts: "04 Jun 2026, 02:00 PM", user: "System", action: "Budget utilization threshold alert triggered at 68%", module: "Budget", status: "Warning" },
];

const timeline = [
  { title: "Budget Updated", desc: "Q2 Equipment allocation increased", time: "10:42 AM", color: "#2563eb" },
  { title: "Bill Approved", desc: "BILL-001 — TechCorp approved", time: "4:30 PM, Yesterday", color: "#16a34a" },
  { title: "Report Generated", desc: "Monthly audit report — May 2026", time: "5:00 PM, Yesterday", color: "#9333ea" },
  { title: "Audit Completed", desc: "Q1 2026 audit closed successfully", time: "3 days ago", color: "#0891b2" },
  { title: "Budget Alert", desc: "Utilization crossed 68% threshold", time: "4 days ago", color: "#d97706" },
];

const statusMap = { Success: "badge-success", Warning: "badge-warning", Info: "badge-info" };

const kpis = [
  { label: "Total Logs", value: "248", icon: "📋", accent: "#2563eb", iconBg: "#eff6ff" },
  { label: "User Activities", value: "186", icon: "👤", accent: "#9333ea", iconBg: "#fdf4ff" },
  { label: "Budget Changes", value: "34", icon: "💰", accent: "#d97706", iconBg: "#fffbeb" },
  { label: "Bill Reviews", value: "28", icon: "🧾", accent: "#16a34a", iconBg: "#f0fdf4" },
];

export default function FinanceAuditTrail() {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = allLogs.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = l.user.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.module.toLowerCase().includes(q);
    const matchModule = moduleFilter === "All" || l.module === moduleFilter;
    const matchStatus = statusFilter === "All" || l.status === statusFilter;
    return matchSearch && matchModule && matchStatus;
  });

  return (
    <div className="fin-page">
      <div className="fin-header">
        <div className="fin-header-top">
          <div>
            <h1>Audit Trail</h1>
            <p className="subtitle">Complete log of all system activities and user actions.</p>
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
          </div>
        ))}
      </div>

      <div className="fin-two-col">
        <div className="fin-card">
          <div className="fin-card-header">
            <div>
              <div className="fin-card-title">Audit Logs</div>
              <div className="fin-card-subtitle">{filtered.length} records</div>
            </div>
          </div>
          <div className="fin-card-body">
            <div className="fin-search-row">
              <div className="fin-search">
                <span className="fin-search-icon">🔍</span>
                <input type="text" placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <select className="fin-select" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
                {["All", "Budget", "Bills", "Reports", "Dashboard", "Audit"].map((m) => <option key={m}>{m}</option>)}
              </select>
              <select className="fin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {["All", "Success", "Warning", "Info"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="fin-table-wrap">
              <table className="fin-table">
                <thead>
                  <tr><th>Timestamp</th><th>User</th><th>Action</th><th>Module</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5}><div className="fin-empty">No logs match your filters.</div></td></tr>
                  ) : (
                    filtered.map((log, i) => (
                      <tr key={i}>
                        <td className="mono" style={{ whiteSpace: "nowrap" }}>{log.ts}</td>
                        <td className="bold">{log.user}</td>
                        <td style={{ fontSize: 13 }}>{log.action}</td>
                        <td><span className="fin-badge badge-primary">{log.module}</span></td>
                        <td><span className={`fin-badge ${statusMap[log.status]}`}>{log.status}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="fin-card" style={{ alignSelf: "flex-start" }}>
          <div className="fin-card-header">
            <div>
              <div className="fin-card-title">Recent Activity</div>
              <div className="fin-card-subtitle">Latest system events</div>
            </div>
          </div>
          <div className="fin-card-body">
            <div className="fin-timeline">
              {timeline.map((item, i) => (
                <div className="fin-timeline-item" key={i}>
                  <div className="fin-timeline-dot" style={{ background: item.color }} />
                  <div className="fin-timeline-title">{item.title}</div>
                  <div className="fin-timeline-desc">{item.desc}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>{item.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";
import AnalyticsCard from "../components/AnalyticsCard";
import StatusBadge from "../components/StatusBadge";
import DataTable from "../components/DataTable";
import { ROUTES } from "../../common/constants/routes";
import "../components/styles/admin-dashboard-enhanced.css";
import { transactionService } from "../../../services/transactionService";
import { ucService } from "../../../services/ucService";
import { userService } from "../../../services/userService";
import { X } from "lucide-react";

function DashboardChart({ type, data, options }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return undefined;
    }

    const chart = new Chart(canvasRef.current, { type, data, options });
    return () => chart.destroy();
  }, [type, data, options]);

  return <canvas ref={canvasRef} />;
}

function AdminDashboardEnhanced() {
  const [dateRange, setDateRange] = useState("month");
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("ALL");
  const [selectedUserProgress, setSelectedUserProgress] = useState(null);

  const txns = useMemo(() => transactionService.getTransactions(), []);
  const ucs = useMemo(() => ucService.getUCRequests(), []);

  const progressList = useMemo(() => userService.getUserProgress(), [txns, ucs]);

  const progressKPIs = useMemo(() => {
    const active = progressList.filter(u => u.status === "Active").length;
    const nearDeadline = progressList.filter(u => u.status === "Active" && u.daysRemaining <= 30 && u.daysRemaining >= 0).length;
    const pendingReviews = progressList.reduce((acc, u) => acc + u.pendingReviews, 0);
    const completedReports = progressList.reduce((acc, u) => acc + u.submittedReports, 0);
    const pendingUcs = ucs.filter(r => r.status === "REQUESTED" || r.status === "UC_SUBMITTED").length;

    return [
      { label: "Total Active Users", value: String(active), color: "#10b981", icon: "👤" },
      { label: "Users Near Deadline", value: String(nearDeadline), color: "#ef4444", icon: "⏰" },
      { label: "Pending Reviews", value: String(pendingReviews), color: "#f59e0b", icon: "🔍" },
      { label: "Completed Reports", value: String(completedReports), color: "#3b82f6", icon: "📝" },
      { label: "Pending UC Requests", value: String(pendingUcs), color: "#8b5cf6", icon: "📜" },
    ];
  }, [progressList, ucs]);

  const filteredUserProgress = useMemo(() => {
    return progressList.filter(u => {
      const matchesSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.projectID.toLowerCase().includes(userSearch.toLowerCase());

      let matchesFilter = true;
      if (userStatusFilter === "ACTIVE") {
        matchesFilter = u.status === "Active";
      } else if (userStatusFilter === "DELAYED") {
        matchesFilter = u.status === "Delayed";
      } else if (userStatusFilter === "PENDING_REVIEW") {
        matchesFilter = u.status === "Pending Review";
      } else if (userStatusFilter === "COMPLETED") {
        matchesFilter = u.status === "Completed";
      }

      return matchesSearch && matchesFilter;
    });
  }, [progressList, userSearch, userStatusFilter]);

  const kpiData = useMemo(() => {
    const totalTxnsCount = txns.length;
    const userTxnsCount = txns.filter(t => t.creatorRole === "USER" || t.transactionType === "USER_REQUEST").length;
    const adminTxnsCount = txns.filter(t => t.creatorRole === "ADMIN" || t.transactionType === "ADMIN_CREATED").length;
    const pendingTxnsCount = txns.filter(t => t.status === "SUBMITTED" || t.status === "Under Review" || t.status === "UNDER_REVIEW").length;

    const totalUcCount = ucs.length;
    const pendingUcCount = ucs.filter(r => r.status === "REQUESTED" || r.status === "UC_SUBMITTED").length;
    const financeVerifiedUcCount = ucs.filter(r => r.status === "FINANCE_VERIFIED").length;
    const approvedUcCount = ucs.filter(r => r.status === "ADMIN_APPROVED").length;
    const rejectedUcCount = ucs.filter(r => r.status === "REJECTED").length;

    return [
      { icon: "TX", label: "Total Transactions", value: String(totalTxnsCount), color: "#f59e0b", to: ROUTES.ADMIN_TRANSACTIONS },
      { icon: "UT", label: "User Transactions", value: String(userTxnsCount), color: "#6366f1", to: ROUTES.ADMIN_TRANSACTIONS },
      { icon: "AT", label: "Admin Transactions", value: String(adminTxnsCount), color: "#a855f7", to: ROUTES.ADMIN_TRANSACTIONS },
      { icon: "PT", label: "Pending Transaction Approvals", value: String(pendingTxnsCount), color: "#ef4444", to: ROUTES.ADMIN_TRANSACTION_REVIEW },
      { icon: "UC", label: "Total UC Requests", value: String(totalUcCount), color: "#06b6d4", to: ROUTES.ADMIN_UC_MANAGEMENT },
      { icon: "PU", label: "Pending UC Reviews", value: String(pendingUcCount), color: "#3b82f6", to: ROUTES.ADMIN_UC_MANAGEMENT },
      { icon: "AU", label: "Approved UCs", value: String(approvedUcCount), color: "#10b981", to: ROUTES.ADMIN_UC_MANAGEMENT },
      { icon: "RU", label: "Rejected UCs", value: String(rejectedUcCount), color: "#ef4444", to: ROUTES.ADMIN_UC_MANAGEMENT },
    ];
  }, [txns, ucs]);

  const operationalAlerts = [
    { id: "ALT-01", title: "Pending User Approvals", detail: "7 newly registered users are waiting for admin approval.", severity: "warning", actionLabel: "Review users", actionPath: ROUTES.ADMIN_USERS },
    { id: "ALT-02", title: "Budget Warning", detail: "Equipment and Training heads have crossed 75 percent utilization.", severity: "critical", actionLabel: "View budgets", actionPath: ROUTES.ADMIN_BUDGET_HEADS },
    { id: "ALT-03", title: "Overdue Reports", detail: "3 monthly submissions were not generated before the compliance cutoff.", severity: "warning", actionLabel: "Open reports", actionPath: ROUTES.ADMIN_REPORTS },
    { id: "ALT-04", title: "Failed Transactions", detail: "2 settlement attempts failed during yesterday's reconciliation sync.", severity: "critical", actionLabel: "Inspect queue", actionPath: ROUTES.ADMIN_RECONCILIATION },
  ];

  const quickActions = [
    { label: "Approve queue", helper: "Clear pending users and reports", path: ROUTES.ADMIN_APPROVALS },
    { label: "Review accounts", helper: "Check balances and reconciliation", path: ROUTES.ADMIN_ACCOUNTS },
    { label: "Run audit checks", helper: "Inspect recent admin activity", path: ROUTES.ADMIN_AUDIT_LOGS },
  ];

  const globalResults = [
    { category: "Users", label: "Purva Kalkute", path: ROUTES.ADMIN_USERS },
    { category: "Transactions", label: "TXN002 Equipment purchase", path: ROUTES.ADMIN_TRANSACTIONS },
    { category: "Events", label: "Startup Workshop", path: ROUTES.ADMIN_EVENTS },
    { category: "Reports", label: "Budget Analysis", path: ROUTES.ADMIN_REPORTS },
  ];

  const recentActivity = [
    { id: "ACT-01", actor: "Finance Team", action: "Submitted capital procurement transaction", module: "Transactions", status: "pending", time: "10 mins ago" },
    { id: "ACT-02", actor: "Priya Singh", action: "Completed onboarding documents", module: "Users", status: "approved", time: "25 mins ago" },
    { id: "ACT-03", actor: "Operations Desk", action: "Scheduled Startup Workshop event", module: "Events", status: "approved", time: "58 mins ago" },
    { id: "ACT-04", actor: "Compliance Bot", action: "Flagged missing utilization report", module: "Reports", status: "rejected", time: "1 hour ago" },
  ];

  const systemOverview = useMemo(() => {
    const pendingTxns = txns.filter(t => t.status === "SUBMITTED").length;
    const pendingUcs = ucs.filter(r => r.status === "REQUESTED" || r.status === "UC_SUBMITTED").length;

    return [
      { label: "New Users This Month", value: "28", helper: "11 awaiting approval" },
      { label: "Transactions Today", value: String(txns.length), helper: `${pendingTxns} pending approval` },
      { label: "Reports Generated", value: "17", helper: "3 overdue" },
      { label: "Events Scheduled", value: "9", helper: "2 start this week" },
    ];
  }, [txns, ucs]);

  const recentTransactions = useMemo(() => {
    return [...txns]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4)
      .map(t => ({ id: t.id, amount: t.amount, status: t.status, date: t.createdAt.split("T")[0], head: t.budgetHead }));
  }, [txns]);

  const recentApprovals = useMemo(() => {
    const pendingTxns = txns.filter(t => t.status === "SUBMITTED");
    const pendingUcs = ucs.filter(r => r.status === "REQUESTED" || r.status === "UC_SUBMITTED");

    const items = [];
    pendingTxns.forEach(t => {
      items.push({
        id: t.id,
        item: `Transaction approval for Rs ${t.amount}`,
        owner: t.creatorRole,
        status: t.status.toLowerCase()
      });
    });
    pendingUcs.forEach(u => {
      items.push({
        id: u.id,
        item: `UC Approval Request`,
        owner: u.requestedBy.split(" ")[0],
        status: u.status.toLowerCase()
      });
    });

    // Fallback to static if empty so we don't display a completely empty list
    if (items.length === 0) {
      return [
        { id: "APR-88", item: "Role change request", owner: "Administration", status: "pending" },
        { id: "APR-89", item: "Budget release", owner: "Finance", status: "approved" },
        { id: "APR-90", item: "Monthly operations report", owner: "Compliance", status: "rejected" },
      ];
    }
    return items.slice(0, 4);
  }, [txns, ucs]);

  const upcomingEvents = [
    { id: 1, title: "Startup Workshop", date: "2026-06-05", type: "Workshop" },
    { id: 2, title: "Leadership Training", date: "2026-06-10", type: "Training" },
    { id: 3, title: "Budget Review", date: "2026-06-15", type: "Review" },
  ];

  const approvalsByType = useMemo(
    () => [
      { name: "Users", value: 11, description: "Onboarding and role upgrades" },
      { name: "Transactions", value: 19, description: "Payments waiting for sign-off" },
      { name: "Reports", value: 12, description: "Compliance and MIS submissions" },
    ],
    []
  );

  const filteredSuggestions = useMemo(
    () =>
      searchQuery
        ? globalResults.filter((result) =>
            `${result.category} ${result.label}`.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : [],
    [searchQuery]
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  const charts = {
    monthlyTransactions: {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [{ data: [120, 170, 150, 210, 245, 230], borderColor: "#0f5aff", backgroundColor: "rgba(15, 90, 255, 0.15)", fill: true, tension: 0.35 }],
      },
    },
    budgetUtilization: {
      type: "bar",
      data: {
        labels: ["Travel", "Equipment", "Training", "Supplies"],
        datasets: [{ data: [50, 82, 76, 40], backgroundColor: ["#3b82f6", "#ef4444", "#f59e0b", "#10b981"] }],
      },
    },
    reportsStatus: {
      type: "doughnut",
      data: {
        labels: ["Pending", "Approved", "Rejected"],
        datasets: [{ data: [12, 36, 7], backgroundColor: ["#f59e0b", "#10b981", "#ef4444"] }],
      },
    },
    userGrowth: {
      type: "bar",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [{ data: [12, 17, 22, 25, 28, 31], backgroundColor: "#06b6d4" }],
      },
    },
  };

  return (
    <main className="admin-dashboard-enhanced">
      <section className="dashboard-pagebar">
        <div className="dashboard-pagebar-copy">
          <span className="dashboard-breadcrumb">Home / Dashboard</span>
          <h1>Dashboard</h1>
        </div>
        <select value={dateRange} onChange={(event) => setDateRange(event.target.value)} className="date-filter">
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </section>

      <section className="kpi-grid">
        {kpiData.map((kpi) => (
          <AnalyticsCard key={kpi.label} icon={kpi.icon} label={kpi.label} value={kpi.value} trend={kpi.trend} color={kpi.color} to={kpi.to} />
        ))}
      </section>

      <section className="dashboard-card">
        <div className="card-header">
          <h3>Global Search</h3>
          <span className="card-meta">Users, transactions, events, reports</span>
        </div>
        <div className="global-search-shell">
          <input
            type="text"
            className="dashboard-search-input"
            placeholder="Search users, transactions, events, reports"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          {filteredSuggestions.length > 0 && (
            <div className="search-suggestions">
              {filteredSuggestions.map((result) => (
                <Link key={`${result.category}-${result.label}`} to={result.path} className="suggestion-row">
                  <span>{result.category}</span>
                  <strong>{result.label}</strong>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-card">
        <div className="card-header">
          <h3>Operational Alerts</h3>
          <span className="card-meta">{operationalAlerts.length} active alerts</span>
        </div>
        <div className="alerts-grid">
          {operationalAlerts.map((alert) => (
            <article key={alert.id} className={`alert-card ${alert.severity}`}>
              <div className="alert-title-row">
                <h4>{alert.title}</h4>
                <span className={`alert-pill ${alert.severity}`}>{alert.severity}</span>
              </div>
              <p>{alert.detail}</p>
              <Link to={alert.actionPath}>{alert.actionLabel}</Link>
            </article>
          ))}
        </div>
      </section>

      {/* USER PROGRESS MONITORING SECTION */}
      <section className="dashboard-card" style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "24px" }}>
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
          <div>
            <h3>User Progress Monitoring</h3>
            <span className="card-meta">Fellowship & project milestone tracking overview</span>
          </div>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>
            Showing {filteredUserProgress.length} of {progressList.length} Fellowship Users
          </span>
        </div>

        {/* PROGRESS SUMMARY KPI CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
          {progressKPIs.map((kpi) => (
            <div key={kpi.label} style={{ padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: "600", color: "#64748b" }}>{kpi.label}</span>
                <strong style={{ display: "block", fontSize: "24px", color: kpi.color, marginTop: "6px" }}>{kpi.value}</strong>
              </div>
              <span style={{ fontSize: "24px", opacity: 0.8 }}>{kpi.icon}</span>
            </div>
          ))}
        </div>

        {/* FILTERS & SEARCH */}
        <div className="table-header" style={{ display: "flex", gap: "12px", flexWrap: "wrap", margin: "10px 0" }}>
          <input
            type="text"
            placeholder="Search by user name or project ID..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="search-input"
            style={{ flex: 1, minWidth: "250px" }}
          />
          <select
            value={userStatusFilter}
            onChange={(e) => setUserStatusFilter(e.target.value)}
            className="filter-select"
            style={{ minWidth: "180px" }}
          >
            <option value="ALL">All Users</option>
            <option value="ACTIVE">Active Users</option>
            <option value="DELAYED">Delayed Users</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="COMPLETED">Completed Users</option>
          </select>
        </div>

        {/* TABLE VIEW */}
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Project ID</th>
                <th>Joining Date</th>
                <th>Days Remaining</th>
                <th>Month</th>
                <th>Progress %</th>
                <th>Events</th>
                <th>Reports</th>
                <th>Docs</th>
                <th>Reviews</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUserProgress.length > 0 ? (
                filteredUserProgress.map((u) => (
                  <tr
                    key={u.projectID}
                    style={{ cursor: "pointer", transition: "background-color 0.2s" }}
                    onClick={() => setSelectedUserProgress(u)}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
                  >
                    <td style={{ fontWeight: "700", color: "#0f5aff" }}>{u.name}</td>
                    <td style={{ fontWeight: "600" }}>{u.projectID}</td>
                    <td>{new Date(u.dateOfJoining).toLocaleDateString()}</td>
                    <td style={{ color: u.daysRemaining <= 30 && u.daysRemaining >= 0 ? "#ef4444" : "inherit", fontWeight: u.daysRemaining <= 30 ? "600" : "normal" }}>
                      {u.daysRemaining >= 0 ? `${u.daysRemaining} days` : "Overdue"}
                    </td>
                    <td>M{u.fellowshipMonth}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "65px", height: "6px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ width: `${u.programProgress}%`, height: "100%", backgroundColor: u.programProgress >= 90 ? "#10b981" : u.programProgress >= 50 ? "#3b82f6" : "#ef4444" }} />
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: "700" }}>{u.programProgress}%</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>{u.assignedEvents}</td>
                    <td style={{ textAlign: "center" }}>{u.submittedReports}</td>
                    <td style={{ textAlign: "center" }}>{u.uploadedDocuments}</td>
                    <td style={{ textAlign: "center" }}>{u.pendingReviews}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor:
                            u.status === "Active" ? "#dcfce7" :
                            u.status === "Delayed" ? "#fee2e2" :
                            u.status === "Pending Review" ? "#fef3c7" : "#dbeafe",
                          color:
                            u.status === "Active" ? "#166534" :
                            u.status === "Delayed" ? "#991b1b" :
                            u.status === "Pending Review" ? "#92400e" : "#1d4ed8"
                        }}
                      >
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="empty-state">
                    No fellowship users found matching current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* DETAILED USER PROGRESS MODAL */}
      {selectedUserProgress && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: "650px", width: "95%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#0f172a" }}>
                Fellowship Progress Details: <strong>{selectedUserProgress.name}</strong>
              </h3>
              <button
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                onClick={() => setSelectedUserProgress(null)}
              >
                <span style={{ fontSize: "20px", fontWeight: "bold" }}>×</span>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxHeight: "450px", overflowY: "auto", paddingRight: "8px" }}>
              {/* PROJECT INFORMATION */}
              <div style={modalSectionStyle}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#475569" }}>📁 Project Information</h4>
                <div style={modalGridStyle}>
                  <div style={modalFieldStyle}>
                    <span style={modalLabelStyle}>Project ID</span>
                    <strong style={modalValueStyle}>{selectedUserProgress.projectID}</strong>
                  </div>
                  <div style={modalFieldStyle}>
                    <span style={modalLabelStyle}>Fellow User</span>
                    <strong style={modalValueStyle}>{selectedUserProgress.name}</strong>
                  </div>
                  <div style={modalFieldStyle}>
                    <span style={modalLabelStyle}>Email Address</span>
                    <strong style={modalValueStyle}>{selectedUserProgress.email}</strong>
                  </div>
                  <div style={modalFieldStyle}>
                    <span style={modalLabelStyle}>Date of Joining</span>
                    <strong style={modalValueStyle}>{new Date(selectedUserProgress.dateOfJoining).toLocaleDateString()}</strong>
                  </div>
                  <div style={modalFieldStyle}>
                    <span style={modalLabelStyle}>Fellowship Duration</span>
                    <strong style={modalValueStyle}>{selectedUserProgress.fellowshipDuration}</strong>
                  </div>
                  <div style={modalFieldStyle}>
                    <span style={modalLabelStyle}>Days Remaining</span>
                    <strong style={{ ...modalValueStyle, color: selectedUserProgress.daysRemaining <= 30 ? "#ef4444" : "#0f172a" }}>
                      {selectedUserProgress.daysRemaining >= 0 ? `${selectedUserProgress.daysRemaining} days` : "Overdue"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* PROGRESS INFORMATION */}
              <div style={modalSectionStyle}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#475569" }}>📈 Progress Information</h4>
                <div style={modalGridStyle}>
                  <div style={{ ...modalFieldStyle, gridColumn: "span 2" }}>
                    <span style={modalLabelStyle}>Program Milestone Progress</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                      <div style={{ flex: 1, height: "10px", backgroundColor: "#e2e8f0", borderRadius: "5px", overflow: "hidden" }}>
                        <div style={{ width: `${selectedUserProgress.programProgress}%`, height: "100%", backgroundColor: "#10b981" }} />
                      </div>
                      <strong style={{ fontSize: "13px" }}>{selectedUserProgress.programProgress}%</strong>
                    </div>
                  </div>
                  <div style={modalFieldStyle}>
                    <span style={modalLabelStyle}>Submitted Reports</span>
                    <strong style={modalValueStyle}>{selectedUserProgress.submittedReports} / 12</strong>
                  </div>
                  <div style={modalFieldStyle}>
                    <span style={modalLabelStyle}>Uploaded Documents</span>
                    <strong style={modalValueStyle}>{selectedUserProgress.uploadedDocuments} Files</strong>
                  </div>
                  <div style={modalFieldStyle}>
                    <span style={modalLabelStyle}>Assigned Events</span>
                    <strong style={modalValueStyle}>{selectedUserProgress.assignedEvents} Events</strong>
                  </div>
                  <div style={modalFieldStyle}>
                    <span style={modalLabelStyle}>Pending Reviews</span>
                    <strong style={{ ...modalValueStyle, color: selectedUserProgress.pendingReviews > 0 ? "#d97706" : "#0f172a" }}>
                      {selectedUserProgress.pendingReviews} Items
                    </strong>
                  </div>
                </div>
              </div>

              {/* FINANCIAL INFORMATION */}
              <div style={modalSectionStyle}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#475569" }}>💳 Financial Information (Live Sync)</h4>
                <div style={modalGridStyle}>
                  <div style={modalFieldStyle}>
                    <span style={modalLabelStyle}>Total Submitted</span>
                    <strong style={modalValueStyle}>{selectedUserProgress.financials.total} Transactions</strong>
                  </div>
                  <div style={modalFieldStyle}>
                    <span style={modalLabelStyle}>Approved Expenses</span>
                    <strong style={{ ...modalValueStyle, color: "#16a34a" }}>{selectedUserProgress.financials.approved} Approved</strong>
                  </div>
                  <div style={modalFieldStyle}>
                    <span style={modalLabelStyle}>Rejected Expenses</span>
                    <strong style={{ ...modalValueStyle, color: "#ef4444" }}>{selectedUserProgress.financials.rejected} Rejected</strong>
                  </div>
                  <div style={modalFieldStyle}>
                    <span style={modalLabelStyle}>Awaiting Review</span>
                    <strong style={{ ...modalValueStyle, color: "#d97706" }}>{selectedUserProgress.financials.pending} Pending</strong>
                  </div>
                </div>
              </div>

              {/* UC INFORMATION */}
              <div style={modalSectionStyle}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#475569" }}>📜 UC Information (Live Sync)</h4>
                <div style={modalGridStyle}>
                  <div style={modalFieldStyle}>
                    <span style={modalLabelStyle}>UC Requested</span>
                    <strong style={modalValueStyle}>{selectedUserProgress.uc.requested ? "Yes" : "No"}</strong>
                  </div>
                  <div style={modalFieldStyle}>
                    <span style={modalLabelStyle}>UC Template Granted</span>
                    <strong style={modalValueStyle}>{selectedUserProgress.uc.templateGranted ? "Yes" : "No"}</strong>
                  </div>
                  <div style={modalFieldStyle}>
                    <span style={modalLabelStyle}>UC Submitted</span>
                    <strong style={modalValueStyle}>{selectedUserProgress.uc.submitted ? "Yes" : "No"}</strong>
                  </div>
                  <div style={modalFieldStyle}>
                    <span style={modalLabelStyle}>UC Approved</span>
                    <strong style={{ ...modalValueStyle, color: selectedUserProgress.uc.approved ? "#16a34a" : "#0f172a" }}>
                      {selectedUserProgress.uc.approved ? "Yes" : "No"}
                    </strong>
                  </div>
                  <div style={modalFieldStyle}>
                    <span style={modalLabelStyle}>UC Rejected</span>
                    <strong style={{ ...modalValueStyle, color: selectedUserProgress.uc.rejected ? "#ef4444" : "#0f172a" }}>
                      {selectedUserProgress.uc.rejected ? "Yes" : "No"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginTop: "20px" }}>
              <button
                className="btn-secondary"
                onClick={() => setSelectedUserProgress(null)}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="dashboard-stack dashboard-stack-wide">
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Recent Transactions</h3>
              <Link to={ROUTES.ADMIN_TRANSACTIONS}>View All</Link>
            </div>
            <DataTable
              columns={[
                { key: "id", label: "ID" },
                { key: "head", label: "Budget Head" },
                { key: "amount", label: "Amount", render: (value) => `Rs ${value.toLocaleString()}` },
                { key: "status", label: "Status", render: (value) => <StatusBadge status={value.toLowerCase()} /> },
              ]}
              data={recentTransactions}
            />
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h3>System Overview</h3>
              <span className="card-meta">Updated for {dateRange}</span>
            </div>
            <div className="overview-grid">
              {systemOverview.map((item) => (
                <div key={item.label} className="overview-stat">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.helper}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h3>Monthly Transactions Chart</h3>
            </div>
            <div className="chart-panel">
              <DashboardChart type={charts.monthlyTransactions.type} data={charts.monthlyTransactions.data} options={chartOptions} />
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h3>Budget Utilization Chart</h3>
            </div>
            <div className="chart-panel">
              <DashboardChart type={charts.budgetUtilization.type} data={charts.budgetUtilization.data} options={chartOptions} />
            </div>
          </div>
        </div>

        <div className="dashboard-stack">
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Quick Actions</h3>
              <span className="card-meta">Prioritize admin workflows</span>
            </div>
            <div className="quick-actions-grid">
              {quickActions.map((action) => (
                <Link key={action.label} to={action.path} className="quick-action-card">
                  <strong>{action.label}</strong>
                  <span>{action.helper}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h3>Recent Approvals</h3>
              <Link to={ROUTES.ADMIN_APPROVALS}>Open queue</Link>
            </div>
            <div className="list-container">
              {recentApprovals.map((approval) => (
                <div key={approval.id} className="list-item">
                  <div className="list-icon">{approval.id.slice(-2)}</div>
                  <div className="list-content">
                    <h4>{approval.item}</h4>
                    <span className="list-type">{approval.owner}</span>
                  </div>
                  <StatusBadge status={approval.status} />
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h3>Reports Status Chart</h3>
            </div>
            <div className="chart-panel">
              <DashboardChart type={charts.reportsStatus.type} data={charts.reportsStatus.data} options={chartOptions} />
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h3>User Growth Chart</h3>
            </div>
            <div className="chart-panel">
              <DashboardChart type={charts.userGrowth.type} data={charts.userGrowth.data} options={chartOptions} />
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h3>Upcoming Events</h3>
              <Link to={ROUTES.ADMIN_EVENTS}>View All</Link>
            </div>
            <div className="list-container">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="list-item event-item">
                  <div className="event-date">{event.date.split("-")[2]}</div>
                  <div className="list-content">
                    <h4>{event.title}</h4>
                    <span className="list-type">{event.type}</span>
                    <span className="list-date">{event.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h3>System Activity Feed</h3>
              <span className="card-meta">Latest system touches</span>
            </div>
            <div className="activity-list">
              {recentActivity.map((item) => (
                <div key={item.id} className="activity-item">
                  <div className="activity-copy">
                    <h4>{item.action}</h4>
                    <p>
                      <strong>{item.actor}</strong> in {item.module}
                    </p>
                  </div>
                  <div className="activity-meta">
                    <StatusBadge status={item.status} />
                    <span>{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h3>Approval Distribution</h3>
            </div>
            <div className="mini-chart">
              {approvalsByType.map((entry) => (
                <div key={entry.name} className="mini-chart-row">
                  <div className="mini-chart-label">
                    <span>{entry.name}</span>
                    <strong>{entry.value}</strong>
                  </div>
                  <div className="mini-chart-track">
                    <div className="mini-chart-fill" style={{ width: `${entry.value * 4}%`, backgroundColor: "#0f5aff" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(15, 23, 42, 0.65)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  backdropFilter: "blur(4px)"
};

const modalContentStyle = {
  backgroundColor: "white",
  padding: "24px",
  borderRadius: "12px",
  width: "90%",
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
  border: "1px solid #e2e8f0"
};

const modalSectionStyle = {
  padding: "12px 16px",
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px"
};

const modalGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "10px",
  marginTop: "6px"
};

const modalFieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "2px"
};

const modalLabelStyle = {
  fontSize: "11px",
  fontWeight: "600",
  color: "#64748b",
  textTransform: "uppercase"
};

const modalValueStyle = {
  fontSize: "13px",
  color: "#0f172a"
};

export default AdminDashboardEnhanced;


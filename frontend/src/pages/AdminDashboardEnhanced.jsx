import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";
import AnalyticsCard from "../components/admin/AnalyticsCard";
import StatusBadge from "../components/admin/StatusBadge";
import DataTable from "../components/admin/DataTable";
import { ROUTES } from "../constants/routes";
import "../components/styles/admin-dashboard-enhanced.css";

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

  const kpiData = [
    { icon: "US", label: "Total Users", value: "245", trend: 12, color: "#3b82f6", to: ROUTES.ADMIN_USERS },
    { icon: "AU", label: "Active Users", value: "189", trend: 8, color: "#10b981" },
    { icon: "TX", label: "Total Transactions", value: "1,250", trend: 23, color: "#f59e0b", to: ROUTES.ADMIN_TRANSACTIONS },
    { icon: "BG", label: "Total Budget", value: "Rs 57.5L", trend: 5, color: "#8b5cf6", to: ROUTES.ADMIN_BUDGET_HEADS },
    { icon: "PA", label: "Pending Approvals", value: "42", trend: -15, color: "#ef4444", to: ROUTES.ADMIN_APPROVALS },
    { icon: "RP", label: "Reports Generated", value: "156", trend: 31, color: "#06b6d4", to: ROUTES.ADMIN_REPORTS },
  ];

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

  const systemOverview = [
    { label: "New Users This Month", value: "28", helper: "11 awaiting approval" },
    { label: "Transactions Today", value: "54", helper: "12 still pending" },
    { label: "Reports Generated", value: "17", helper: "3 overdue" },
    { label: "Events Scheduled", value: "9", helper: "2 start this week" },
  ];

  const recentTransactions = [
    { id: "TXN001", amount: 50000, status: "Approved", date: "2026-05-30", head: "Travel" },
    { id: "TXN002", amount: 75000, status: "Pending", date: "2026-05-29", head: "Equipment" },
    { id: "TXN003", amount: 30000, status: "Approved", date: "2026-05-28", head: "Supplies" },
    { id: "TXN004", amount: 125000, status: "Rejected", date: "2026-05-27", head: "Training" },
  ];

  const recentApprovals = [
    { id: "APR-88", item: "Role change request", owner: "Administration", status: "pending" },
    { id: "APR-89", item: "Budget release", owner: "Finance", status: "approved" },
    { id: "APR-90", item: "Monthly operations report", owner: "Compliance", status: "rejected" },
  ];

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

export default AdminDashboardEnhanced;

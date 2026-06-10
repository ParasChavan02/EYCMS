import { useMemo, useState } from "react";
import "../../../styles/admin-dashboard.css";

function AdminDashboard() {
  const [dateRange, setDateRange] = useState("week");

  // Sample data - in real app, this would come from API
  const dashboardStats = {
    totalUsers: 245,
    activeUsers: 189,
    totalTransactions: 1250,
    totalBudget: 5750000,
    pendingApprovals: 42,
    generatedReports: 156,
  };

  const analyticsCards = [
    {
      title: "Total Users",
      value: dashboardStats.totalUsers,
      trend: "+12%",
      icon: "👥",
      color: "#3b82f6",
    },
    {
      title: "Active Users",
      value: dashboardStats.activeUsers,
      trend: "+8%",
      icon: "✓",
      color: "#10b981",
    },
    {
      title: "Total Transactions",
      value: dashboardStats.totalTransactions,
      trend: "+23%",
      icon: "💳",
      color: "#f59e0b",
    },
    {
      title: "Total Budget",
      value: `₹${(dashboardStats.totalBudget / 1000000).toFixed(1)}M`,
      trend: "+5%",
      icon: "💰",
      color: "#8b5cf6",
    },
    {
      title: "Pending Approvals",
      value: dashboardStats.pendingApprovals,
      trend: "-15%",
      icon: "⏳",
      color: "#ef4444",
    },
    {
      title: "Generated Reports",
      value: dashboardStats.generatedReports,
      trend: "+31%",
      icon: "📊",
      color: "#06b6d4",
    },
  ];

  const recentRegistrations = [
    { id: 1, name: "Raj Kumar", email: "raj@eyuva.com", date: "2026-05-30", role: "USER" },
    { id: 2, name: "Priya Singh", email: "priya@eyuva.com", date: "2026-05-29", role: "USER" },
    { id: 3, name: "Arjun Patel", email: "arjun@eyuva.com", date: "2026-05-28", role: "USER" },
    { id: 4, name: "Neha Verma", email: "neha@eyuva.com", date: "2026-05-27", role: "USER" },
    { id: 5, name: "Vikram Singh", email: "vikram@eyuva.com", date: "2026-05-26", role: "USER" },
  ];

  const recentTransactions = [
    { id: "TXN001", amount: 50000, status: "Approved", date: "2026-05-30", head: "Travel" },
    { id: "TXN002", amount: 75000, status: "Pending", date: "2026-05-29", head: "Equipment" },
    { id: "TXN003", amount: 30000, status: "Approved", date: "2026-05-28", head: "Supplies" },
    { id: "TXN004", amount: 120000, status: "Rejected", date: "2026-05-27", head: "Training" },
    { id: "TXN005", amount: 45000, status: "Pending", date: "2026-05-26", head: "Maintenance" },
  ];

  const pendingApprovals = [
    { id: "APR001", type: "User", title: "New User Creation - Amit Kumar", date: "2026-05-30" },
    { id: "APR002", type: "Transaction", title: "Budget Head Allocation ₹100,000", date: "2026-05-29" },
    { id: "APR003", type: "Event", title: "Workshop Registration - May 31", date: "2026-05-28" },
    { id: "APR004", type: "User", title: "Role Change Request - Priya Singh", date: "2026-05-27" },
  ];

  const upcomingEvents = [
    { id: 1, title: "Startup Workshop", date: "2026-06-05", type: "Workshop" },
    { id: 2, title: "Leadership Training", date: "2026-06-10", type: "Training" },
    { id: 3, title: "Budget Review", date: "2026-06-15", type: "Review" },
  ];

  const systemNotifications = [
    { id: 1, message: "Database backup completed successfully", type: "success", time: "2 mins ago" },
    { id: 2, message: "3 users pending approval", type: "warning", time: "15 mins ago" },
    { id: 3, message: "Monthly budget review scheduled for June 5", type: "info", time: "1 hour ago" },
    { id: 4, message: "System maintenance scheduled for June 10", type: "info", time: "2 hours ago" },
  ];

  return (
    <main className="page admin-dashboard-page">
      {/* HEADER */}
      <section className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Monitor your ERP system, manage users, and oversee operations</p>
        </div>
        <select 
          className="date-filter"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </section>

      {/* ANALYTICS GRID */}
      <section className="analytics-grid">
        {analyticsCards.map((card, idx) => (
          <div key={idx} className="analytics-card">
            <div className="card-header">
              <div className="card-icon" style={{ backgroundColor: card.color + "20" }}>
                {card.icon}
              </div>
              <span className="trend-badge">{card.trend}</span>
            </div>
            <h3 className="card-title">{card.title}</h3>
            <h2 className="card-value">{card.value}</h2>
            <div className="card-bar" style={{ backgroundColor: card.color }}></div>
          </div>
        ))}
      </section>

      {/* DASHBOARD GRID */}
      <div className="dashboard-grid">
        {/* LEFT COLUMN */}
        <div className="dashboard-column">
          {/* Recent Registrations */}
          <section className="dashboard-card">
            <div className="card-header-bar">
              <h2>Recent Registrations</h2>
              <a href="/admin/users" className="view-all-link">View All →</a>
            </div>
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRegistrations.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.date}</td>
                      <td><span className="status-badge new">Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Recent Transactions */}
          <section className="dashboard-card">
            <div className="card-header-bar">
              <h2>Recent Transactions</h2>
              <a href="/admin/transactions" className="view-all-link">View All →</a>
            </div>
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Head</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((txn) => (
                    <tr key={txn.id}>
                      <td>{txn.id}</td>
                      <td>₹{txn.amount.toLocaleString()}</td>
                      <td>
                        <span className={`status-badge ${txn.status.toLowerCase()}`}>
                          {txn.status}
                        </span>
                      </td>
                      <td>{txn.head}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="dashboard-column">
          {/* Pending Approvals */}
          <section className="dashboard-card">
            <div className="card-header-bar">
              <h2>Pending Approvals</h2>
              <a href="/admin/approvals" className="view-all-link">View All →</a>
            </div>
            <div className="approval-list">
              {pendingApprovals.map((approval) => (
                <div key={approval.id} className="approval-item">
                  <div className="approval-icon">📋</div>
                  <div className="approval-content">
                    <h4>{approval.title}</h4>
                    <span className="approval-type">{approval.type}</span>
                    <span className="approval-date">{approval.date}</span>
                  </div>
                  <button className="action-btn">→</button>
                </div>
              ))}
            </div>
          </section>

          {/* Upcoming Events */}
          <section className="dashboard-card">
            <div className="card-header-bar">
              <h2>Upcoming Events</h2>
              <a href="/admin/events" className="view-all-link">View All →</a>
            </div>
            <div className="events-list">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="event-item">
                  <div className="event-date">{event.date.split("-")[2]}</div>
                  <div className="event-content">
                    <h4>{event.title}</h4>
                    <span className="event-type">{event.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* System Notifications */}
          <section className="dashboard-card">
            <div className="card-header-bar">
              <h2>System Notifications</h2>
            </div>
            <div className="notifications-list">
              {systemNotifications.map((notif) => (
                <div key={notif.id} className={`notification-item ${notif.type}`}>
                  <div className="notif-indicator"></div>
                  <div className="notif-content">
                    <p>{notif.message}</p>
                    <span className="notif-time">{notif.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default AdminDashboard;


import { useMemo, useState } from "react";
import "../../../styles/admin-dashboard.css";

function AdminDashboard() {
  const [dateRange, setDateRange] = useState("week");

  // Sample data - in real app, this would come from API
  const dashboardStats = {
    totalUsers: 0,
    activeUsers: 0,
    totalTransactions: 0,
    totalBudget: 0,
    pendingApprovals: 0,
    generatedReports: 0,
  };

  const analyticsCards = [
    {
      title: "Total Users",
      value: dashboardStats.totalUsers,
      trend: "+0%",
      icon: "👥",
      color: "#3b82f6",
    },
    {
      title: "Active Users",
      value: dashboardStats.activeUsers,
      trend: "+0%",
      icon: "✓",
      color: "#10b981",
    },
    {
      title: "Total Transactions",
      value: dashboardStats.totalTransactions,
      trend: "+0%",
      icon: "💳",
      color: "#f59e0b",
    },
    {
      title: "Total Budget",
      value: `₹${(dashboardStats.totalBudget / 1000000).toFixed(1)}M`,
      trend: "+0%",
      icon: "💰",
      color: "#8b5cf6",
    },
    {
      title: "Pending Approvals",
      value: dashboardStats.pendingApprovals,
      trend: "0%",
      icon: "⏳",
      color: "#ef4444",
    },
    {
      title: "Generated Reports",
      value: dashboardStats.generatedReports,
      trend: "+0%",
      icon: "📊",
      color: "#06b6d4",
    },
  ];

  const recentRegistrations = [];

  const recentTransactions = [];

  const pendingApprovals = [];

  const upcomingEvents = [];

  const systemNotifications = [];

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
                  {recentRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-state" style={{ textAlign: "center", color: "#64748b" }}>
                        No recent registrations
                      </td>
                    </tr>
                  ) : (
                    recentRegistrations.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.date}</td>
                        <td><span className="status-badge new">Active</span></td>
                      </tr>
                    ))
                  )}
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
                  {recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-state" style={{ textAlign: "center", color: "#64748b" }}>
                        No recent transactions
                      </td>
                    </tr>
                  ) : (
                    recentTransactions.map((txn) => (
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
                    ))
                  )}
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
              {pendingApprovals.length === 0 ? (
                <div className="empty-state" style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
                  No pending approvals
                </div>
              ) : (
                pendingApprovals.map((approval) => (
                  <div key={approval.id} className="approval-item">
                    <div className="approval-icon">📋</div>
                    <div className="approval-content">
                      <h4>{approval.title}</h4>
                      <span className="approval-type">{approval.type}</span>
                      <span className="approval-date">{approval.date}</span>
                    </div>
                    <button className="action-btn">→</button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Upcoming Events */}
          <section className="dashboard-card">
            <div className="card-header-bar">
              <h2>Upcoming Events</h2>
              <a href="/admin/events" className="view-all-link">View All →</a>
            </div>
            <div className="events-list">
              {upcomingEvents.length === 0 ? (
                <div className="empty-state" style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
                  No upcoming events scheduled
                </div>
              ) : (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="event-item">
                    <div className="event-date">{event.date.split("-")[2]}</div>
                    <div className="event-content">
                      <h4>{event.title}</h4>
                      <span className="event-type">{event.type}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* System Notifications */}
          <section className="dashboard-card">
            <div className="card-header-bar">
              <h2>System Notifications</h2>
            </div>
            <div className="notifications-list">
              {systemNotifications.length === 0 ? (
                <div className="empty-state" style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
                  No new notifications
                </div>
              ) : (
                systemNotifications.map((notif) => (
                  <div key={notif.id} className={`notification-item ${notif.type}`}>
                    <div className="notif-indicator"></div>
                    <div className="notif-content">
                      <p>{notif.message}</p>
                      <span className="notif-time">{notif.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default AdminDashboard;


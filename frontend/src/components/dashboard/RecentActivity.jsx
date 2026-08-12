import "./recentActivity.css";

function RecentActivity() {
  const activities = [
    { type: "transaction", description: "Transaction TXN-001 created", time: "2 hours ago" },
    { type: "user", description: "New user John Doe added", time: "4 hours ago" },
    { type: "report", description: "Monthly report generated", time: "1 day ago" },
    { type: "reconciliation", description: "Bank reconciliation completed", time: "2 days ago" },
  ];

  const getActivityIcon = (type) => {
    const icons = {
      transaction: "💳",
      user: "👤",
      report: "📊",
      reconciliation: "✓",
      event: "📅",
    };
    return icons[type] || "📌";
  };

  return (
    <div className="recent-activity">
      <h3 className="recent-activity-title">Recent Activity</h3>
      <div className="activity-list">
        {activities.map((activity, index) => (
          <div key={index} className="activity-item">
            <div className="activity-icon">{getActivityIcon(activity.type)}</div>
            <div className="activity-content">
              <p className="activity-description">{activity.description}</p>
              <span className="activity-time">{activity.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentActivity;

import "./activityTimeline.css";

function ActivityTimeline() {
  const activities = [
    {
      id: 1,
      icon: "🔓",
      title: "Login",
      description: "Logged in to the system",
      time: "2 hours ago",
      type: "login",
    },
    {
      id: 2,
      icon: "📝",
      title: "Profile Updated",
      description: "Updated personal information",
      time: "1 day ago",
      type: "update",
    },
    {
      id: 3,
      icon: "🔐",
      title: "Password Changed",
      description: "Changed account password",
      time: "3 days ago",
      type: "security",
    },
    {
      id: 4,
      icon: "📊",
      title: "Report Generated",
      description: "Generated monthly financial report",
      time: "1 week ago",
      type: "report",
    },
    {
      id: 5,
      icon: "💳",
      title: "Transaction Approved",
      description: "Approved transaction #TXN-2024-001",
      time: "2 weeks ago",
      type: "transaction",
    },
  ];

  return (
    <div className="activity-card">
      <div className="activity-header">
        <h2 className="activity-title">📋 Recent Activity</h2>
      </div>

      <div className="activity-timeline">
        {activities.map((activity, index) => (
          <div key={activity.id} className={`timeline-item ${activity.type}`}>
            <div className="timeline-marker">
              <div className="timeline-icon">{activity.icon}</div>
            </div>

            <div className="timeline-content">
              <div className="timeline-header">
                <h3 className="timeline-title">{activity.title}</h3>
                <span className="timeline-time">{activity.time}</span>
              </div>
              <p className="timeline-description">{activity.description}</p>
            </div>

            {index !== activities.length - 1 && <div className="timeline-line"></div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ActivityTimeline;

import "./reportHistory.css";

function ReportHistory({ reports }) {
  const getRecentActivity = () => {
    return reports
      .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
      .slice(0, 10);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const getActivityIcon = (status) => {
    switch (status) {
      case "Generated":
        return "✅";
      case "Pending":
        return "⏳";
      case "Failed":
        return "❌";
      case "Archived":
        return "📦";
      default:
        return "📄";
    }
  };

  const getActivityColor = (status) => {
    switch (status) {
      case "Generated":
        return "activity-generated";
      case "Pending":
        return "activity-pending";
      case "Failed":
        return "activity-failed";
      case "Archived":
        return "activity-archived";
      default:
        return "activity-default";
    }
  };

  const recentActivity = getRecentActivity();

  return (
    <div className="report-history-card">
      <div className="history-header">
        <h3 className="history-title">📋 Report Activity History</h3>
        <span className="history-badge">{recentActivity.length} recent</span>
      </div>

      <div className="history-list">
        {recentActivity.length > 0 ? (
          recentActivity.map((report, index) => (
            <div key={report.id} className={`history-item ${getActivityColor(report.status)}`}>
              <div className="history-icon">{getActivityIcon(report.status)}</div>

              <div className="history-content">
                <h4 className="history-title-item">{report.name}</h4>
                <div className="history-details">
                  <span className="detail-badge">{report.reportType || "General"}</span>
                  {report.department && (
                    <span className="detail-text">• {report.department}</span>
                  )}
                  {report.generatedBy && (
                    <span className="detail-text">• By {report.generatedBy}</span>
                  )}
                </div>
              </div>

              <div className="history-meta">
                <span className="history-status">{report.status}</span>
                <span className="history-date">{formatDate(report.createdDate)}</span>
              </div>

              {index < recentActivity.length - 1 && <div className="history-divider"></div>}
            </div>
          ))
        ) : (
          <div className="history-empty">
            <p>No report activity yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportHistory;

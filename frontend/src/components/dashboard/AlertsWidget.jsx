import "./alertsWidget.css";

function AlertsWidget() {
  const alerts = [
    {
      id: 1,
      icon: "⚠️",
      title: "Pending Approvals",
      value: "12 Requests",
      severity: "warning",
      color: "#f59e0b",
    },
    {
      id: 2,
      icon: "📊",
      title: "Budget Threshold",
      value: "Exceeded",
      severity: "critical",
      color: "#ef4444",
    },
    {
      id: 3,
      icon: "📋",
      title: "Overdue Reports",
      value: "2 Reports",
      severity: "critical",
      color: "#ef4444",
    },
    {
      id: 4,
      icon: "✓",
      title: "Completed Tasks",
      value: "8 Today",
      severity: "success",
      color: "#10b981",
    },
  ];

  return (
    <div className="alerts-widget">
      <h3 className="alerts-title">⚡ Operational Alerts</h3>
      <div className="alerts-grid">
        {alerts.map((alert) => (
          <div key={alert.id} className={`alert-card alert-${alert.severity}`}>
            <div className="alert-icon">{alert.icon}</div>
            <div className="alert-content">
              <div className="alert-label">{alert.title}</div>
              <div className="alert-value">{alert.value}</div>
            </div>
            <div className="alert-indicator" style={{ backgroundColor: alert.color }}></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AlertsWidget;

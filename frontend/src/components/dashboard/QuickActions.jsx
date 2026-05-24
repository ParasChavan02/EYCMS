import "./quickActions.css";

function QuickActions() {
  const actions = [
    { icon: "💳", label: "Create Transaction", action: "transaction" },
    { icon: "📊", label: "Generate Report", action: "report" },
    { icon: "👤", label: "Add User", action: "user" },
    { icon: "📋", label: "Create Event", action: "event" },
  ];

  const handleAction = (action) => {
    console.log("Quick action:", action);
    // Route to appropriate page
    const routes = {
      transaction: "/transactions",
      report: "/reports",
      user: "/users",
      event: "/reports",
    };
    // window.location.href = routes[action];
  };

  return (
    <div className="quick-actions">
      <h3 className="quick-actions-title">Quick Actions</h3>
      <div className="quick-actions-grid">
        {actions.map((action, index) => (
          <button
            key={index}
            className="quick-action-button"
            onClick={() => handleAction(action.action)}
            title={action.label}
          >
            <div className="quick-action-icon">{action.icon}</div>
            <span className="quick-action-label">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuickActions;

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES, isAdminRole } from "../../constants/routes";
import "./quickActions.css";

function QuickActions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const adminMode = isAdminRole(user);

  const actions = [
    { icon: "💳", label: "Transactions", action: "transaction" },
    { icon: "📊", label: "Generate Report", action: "report" },
    { icon: "👤", label: "Open Profile", action: "profile" },
    { icon: "📋", label: "Browse Events", action: "event" },
  ];

  const handleAction = (action) => {
    const routes = {
      transaction: adminMode ? ROUTES.ADMIN_TRANSACTIONS : ROUTES.USER_DASHBOARD,
      report: adminMode ? ROUTES.ADMIN_REPORTS : ROUTES.USER_REPORTS,
      profile: adminMode ? ROUTES.ADMIN_PROFILE : ROUTES.USER_PROFILE,
      event: adminMode ? ROUTES.ADMIN_EVENTS : ROUTES.USER_EVENTS,
    };

    navigate(routes[action]);
  };

  return (
    <div className="quick-actions">
      <h3 className="quick-actions-title">Quick Actions</h3>
      <div className="quick-actions-grid">
        {actions.map((action) => (
          <button
            key={action.action}
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

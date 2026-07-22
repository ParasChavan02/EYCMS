import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import { ROUTES, getHomeRoute, getProfileRoute, getSettingsRoute, isAdminRole } from "../../constants/routes";
import "./notificationBell.css";

function NotificationBell() {
  const { user } = useAuth();
  const { notifications, removeNotification, refreshNotifications } = useNotification();
  const [isOpen, setIsOpen] = useState(false);

  const [dropdownStyle, setDropdownStyle] = useState({});
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);
  const currentUser = user || JSON.parse(localStorage.getItem("current_user") || "null");
  const adminMode = isAdminRole(currentUser);
  const isSuperAdmin = currentUser?.role?.toUpperCase() === "SUPER_ADMIN";

  const quickActions = isSuperAdmin
    ? [
        { label: "Dashboard", helper: "Return to your workspace", path: ROUTES.SUPER_ADMIN_DASHBOARD },
        { label: "Profile", helper: "Review your account details", path: ROUTES.SUPER_ADMIN_PROFILE },
        { label: "Settings", helper: "Update personal preferences", path: ROUTES.SUPER_ADMIN_SETTINGS },
      ]
    : adminMode
    ? [
        { label: "Approval Center", helper: "Review pending requests", path: ROUTES.ADMIN_APPROVALS },
        { label: "Audit Logs", helper: "Open latest activity", path: ROUTES.ADMIN_AUDIT_LOGS },
        { label: "System Config", helper: "Update admin settings", path: ROUTES.ADMIN_SETTINGS },
      ]
    : [
        { label: "Dashboard", helper: "Return to your workspace", path: getHomeRoute(currentUser) },
        { label: "Profile", helper: "Review your account details", path: getProfileRoute(currentUser) },
        { label: "Settings", helper: "Update personal preferences", path: getSettingsRoute(currentUser) },
      ];

  const latestAlerts = useMemo(() => {
    const role = currentUser?.role?.toUpperCase() || "USER";
    return notifications
      .filter((n) => {
        if (n.showInBell === false) return false;
        if (n.roles && !n.roles.map(r => r.toUpperCase()).includes(role)) return false;
        return true;
      })
      .slice()
      .reverse();
  }, [notifications, currentUser]);

  const unreadCount = latestAlerts.length;

  const handleClearAll = () => {
    latestAlerts.forEach((notification) => removeNotification(notification.id));
    setIsOpen(false);
  };

  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: `${rect.bottom + 8}px`,
        right: `${window.innerWidth - rect.right}px`,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      window.addEventListener("scroll", updateDropdownPosition);
      window.addEventListener("resize", updateDropdownPosition);
      return () => {
        window.removeEventListener("scroll", updateDropdownPosition);
        window.removeEventListener("resize", updateDropdownPosition);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target) && buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleExternalToggle = () => {
      setIsOpen((current) => !current);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("toggle-notification-center", handleExternalToggle);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("toggle-notification-center", handleExternalToggle);
    };
  }, []);

  return (
    <div className="notification-bell-wrapper" ref={wrapperRef}>
      <button type="button" className="notification-bell" ref={buttonRef} onClick={() => {
        setIsOpen(!isOpen);
        if (!isOpen && refreshNotifications) {
          refreshNotifications();
        }
      }} title="Notifications">
        <Bell size={22} aria-hidden="true" />

        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown" style={dropdownStyle}>
          <div className="notification-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button className="clear-all-btn" onClick={handleClearAll} type="button">
                Clear all
              </button>
            )}
          </div>

          <div className="notification-list">
            <div className="notification-shortcuts">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  className="notification-shortcut"
                  type="button"
                  onClick={() => {
                    navigate(action.path);
                    setIsOpen(false);
                  }}
                >
                  <strong>{action.label}</strong>
                  <span>{action.helper}</span>
                </button>
              ))}
            </div>

            {latestAlerts.length > 0 ? (
              latestAlerts.map((notification) => (
                <div key={notification.id} className={`notification-item notification-item--${notification.type}`}>
                  <div className="notification-content">
                    <strong>{notification.title || "Notification"}</strong>
                    <p>{notification.message}</p>
                    <div className="notification-meta">
                      <span>{notification.time || "Just now"}</span>
                      {notification.actionPath && (
                        <button
                          type="button"
                          className="notification-link"
                          onClick={() => {
                            navigate(notification.actionPath);
                            setIsOpen(false);
                          }}
                        >
                          {notification.actionLabel || "Open"}
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    className="notification-close"
                    onClick={() => removeNotification(notification.id)}
                    type="button"
                    title="Dismiss"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
              ))
            ) : (
              <div className="notification-empty">
                <p>No notifications</p>
              </div>
            )}
          </div>
        </div>
      )}

      {isOpen && <div className="notification-overlay" onClick={() => setIsOpen(false)} />}
    </div>
  );
}

export default NotificationBell;

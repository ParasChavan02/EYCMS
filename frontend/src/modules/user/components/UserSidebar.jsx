import { NavLink } from "react-router-dom";
import {
  BadgeHelp,
  CalendarDays,
  LayoutDashboard,
  FileText,
  LifeBuoy,
  MessageSquareWarning,
  Star,
  Ticket,
} from "lucide-react";
import { ROUTES } from "../../common/constants/routes";
import "../../common/components/sidebar-enterprise.css";

function UserSidebar({ isOpen, onClose, isCollapsed }) {
  const userNavItems = [
    {
      section: "Core",
      items: [{ icon: LayoutDashboard, label: "Dashboard", path: ROUTES.USER_DASHBOARD }],
    },
    {
      section: "Reporting",
      items: [
        { icon: CalendarDays, label: "Events", path: ROUTES.USER_EVENTS },
        { icon: FileText, label: "Reports", path: ROUTES.USER_REPORTS },
      ],
    },
    {
      section: "Support",
      items: [
        { icon: BadgeHelp, label: "Help Center", path: "/help-center" },
        { icon: MessageSquareWarning, label: "Report Issue", path: "/report-issue" },
        { icon: Ticket, label: "My Tickets", path: "/my-tickets" },
        { icon: Star, label: "Feature Requests", path: "/feature-requests" },
        { icon: LifeBuoy, label: "Contact Support", path: "/contact-support" },
      ],
    },
  ];

  return (
    <aside className={`sidebar sidebar-enterprise ${isOpen ? "sidebar-open" : ""} ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand-shell">
          {!isCollapsed ? (
            <>
              <div className="sidebar-brand-mark">EY</div>
              <div className="sidebar-brand">
                <h2 className="sidebar-logo">E-YUVA ERP</h2>
                <p className="sidebar-subtitle">User workspace</p>
              </div>
            </>
          ) : (
            <div className="sidebar-logo-mini">EY</div>
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        {userNavItems.map((group) => (
          <div key={group.section || "root"} className="nav-section">
            {!isCollapsed && group.section && <div className="nav-section-label">{group.section}</div>}
            {group.items.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={`${item.label}-${item.path}`}
                  to={item.path}
                  end={item.path === ROUTES.USER_DASHBOARD}
                  onClick={onClose}
                  className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                  title={item.label}
                >
                  <span className="nav-icon">
                    <Icon size={18} strokeWidth={2.2} />
                  </span>
                  {!isCollapsed && <span className="nav-text">{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default UserSidebar;

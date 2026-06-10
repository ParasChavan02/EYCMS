import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  FileText,
  Settings,
} from "lucide-react";
import { useAuth } from "../../common/hooks/useAuth";
import { ROUTES } from "../../common/constants/routes";
import "../../common/components/sidebar-enterprise.css";

function UserSidebar({ isOpen, onClose, isCollapsed }) {
  const { user } = useAuth();

  const userNavItems = [
    {
      section: null,
      items: [{ icon: LayoutDashboard, label: "Dashboard", path: ROUTES.USER_DASHBOARD }],
    },
    {
      section: "Workspace",
      items: [
        { icon: Users, label: "Profile", path: ROUTES.USER_PROFILE },
        { icon: Sparkles, label: "Events", path: ROUTES.USER_EVENTS },
        { icon: FileText, label: "Reports", path: ROUTES.USER_REPORTS },
        { icon: Settings, label: "Settings", path: ROUTES.USER_SETTINGS },
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
                <p className="sidebar-subtitle">Workspace</p>
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

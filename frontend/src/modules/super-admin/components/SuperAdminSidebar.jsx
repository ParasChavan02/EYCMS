import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  KeyRound,
  List,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../common/hooks/useAuth";
import { useNotification } from "../../common/hooks/useNotification";
import { logout } from "../../../services/authService";
import "../../common/components/sidebar-enterprise.css";

function SuperAdminSidebar({ isOpen, onClose, isCollapsed }) {
  const { user, signOut } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const navItems = [
    {
      section: "SYSTEM",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/super-admin/dashboard" },
        { icon: KeyRound, label: "Generate Token", path: "/super-admin/generate-token" },
        { icon: List, label: "Generated Tokens", path: "/super-admin/tokens" },
      ],
    },
  ];

  const handleLogoutClick = async (e) => {
    e.preventDefault();
    const userName = user?.name || "Super Admin";
    try {
      await logout();
      addNotification(`Goodbye ${userName}. You have been logged out.`, "info", 3000, true);
      signOut();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      signOut();
      navigate("/login");
    }
  };

  return (
    <aside className={`sidebar sidebar-enterprise ${isOpen ? "sidebar-open" : ""} ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand-shell">
          {!isCollapsed ? (
            <>
              <img src="/eyuva_logo.jpg" alt="Logo" className="sidebar-brand-mark" style={{ objectFit: 'cover' }} />
              <div className="sidebar-brand">
                <h2 className="sidebar-logo">E-YUVA ERP</h2>
                <p className="sidebar-subtitle">Super Admin portal</p>
              </div>
            </>
          ) : (
            <img src="/eyuva_logo.jpg" alt="Logo" className="sidebar-logo-mini" style={{ objectFit: 'cover' }} />
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((group) => (
          <div key={group.section} className="nav-section">
            {!isCollapsed && <div className="nav-section-label">{group.section}</div>}
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  end={item.path === "/super-admin/dashboard"}
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

        <div className="nav-section">
          {!isCollapsed && <div className="nav-section-label">ACCOUNT</div>}
          <a
            href="#logout"
            onClick={handleLogoutClick}
            className="nav-link nav-link-logout"
            title="Logout"
            style={{ cursor: "pointer" }}
          >
            <span className="nav-icon">
              <LogOut size={18} strokeWidth={2.2} style={{ color: "#ef4444" }} />
            </span>
            {!isCollapsed && <span className="nav-text" style={{ color: "#ef4444" }}>Logout</span>}
          </a>
        </div>
      </nav>
    </aside>
  );
}

export default SuperAdminSidebar;

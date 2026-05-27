import { NavLink } from "react-router-dom";
import "./sidebar-enterprise.css";

function Sidebar({ isOpen, onLinkClick, isCollapsed }) {
  const navItems = [
    {
      section: "CORE",
      items: [
        { icon: "📊", label: "Dashboard", path: "/dashboard" },
        { icon: "👥", label: "Users", path: "/users" },
        { icon: "⚙️", label: "Master Data", path: "/master" },
      ]
    },
    {
      section: "FINANCIAL",
      items: [
        { icon: "💳", label: "Transactions", path: "/transactions" },
        { icon: "✓", label: "Reconciliation", path: "/reconciliation" },
      ]
    },
    {
      section: "REPORTING",
      items: [
        { icon: "�", label: "Events", path: "/events" },
        { icon: "�📈", label: "Reports", path: "/reports" },
      ]
    },
  ];

  return (
    <aside className={`sidebar sidebar-enterprise ${isOpen ? "sidebar-open" : ""} ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        {!isCollapsed && <h2 className="sidebar-logo">E-YUVA</h2>}
        {isCollapsed && <div className="sidebar-logo-mini">E</div>}
      </div>

      <nav className="sidebar-nav">
        {navItems.map((group, idx) => (
          <div key={idx} className="nav-section">
            {!isCollapsed && <div className="nav-section-label">{group.section}</div>}
            {group.items.map((item, itemIdx) => (
              <NavLink 
                key={itemIdx}
                to={item.path} 
                onClick={onLinkClick} 
                className="nav-link"
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
                {!isCollapsed && <span className="nav-text">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
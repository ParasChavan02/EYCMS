import { NavLink } from "react-router-dom";
import "./sidebar-enterprise.css";

function Sidebar({ isOpen, onLinkClick }) {
  return (
    <aside className={`sidebar sidebar-enterprise ${isOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-logo">E-YUVA ERP</h2>
      </div>

      <nav className="sidebar-nav">
        {/* CORE SECTION */}
        <div className="nav-section">
          <div className="nav-section-label">CORE</div>
          <NavLink to="/dashboard" onClick={onLinkClick} className="nav-link">
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </NavLink>
          <NavLink to="/users" onClick={onLinkClick} className="nav-link">
            <span className="nav-icon">👥</span>
            <span className="nav-text">Users</span>
          </NavLink>
          <NavLink to="/master" onClick={onLinkClick} className="nav-link">
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Master Data</span>
          </NavLink>
        </div>

        {/* FINANCIAL SECTION */}
        <div className="nav-section">
          <div className="nav-section-label">FINANCIAL</div>
          <NavLink to="/transactions" onClick={onLinkClick} className="nav-link">
            <span className="nav-icon">💳</span>
            <span className="nav-text">Transactions</span>
          </NavLink>
          <NavLink to="/reconciliation" onClick={onLinkClick} className="nav-link">
            <span className="nav-icon">✓</span>
            <span className="nav-text">Reconciliation</span>
          </NavLink>
        </div>

        {/* REPORTING SECTION */}
        <div className="nav-section">
          <div className="nav-section-label">REPORTING</div>
          <NavLink to="/reports" onClick={onLinkClick} className="nav-link">
            <span className="nav-icon">📈</span>
            <span className="nav-text">Reports</span>
          </NavLink>
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;
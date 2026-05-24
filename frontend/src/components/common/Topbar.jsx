import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import NotificationBell from "./NotificationBell";
import "./topbar-enterprise.css";

function Topbar({ onMenuClick }) {
  const { user, signOut } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Get user from context or localStorage fallback
  const currentUser = user || (() => {
    const saved = localStorage.getItem('current_user');
    return saved ? JSON.parse(saved) : null;
  })();

  // Map routes to titles
  const getPageTitle = (path) => {
    const titles = {
      '/dashboard': 'Dashboard',
      '/users': 'Users',
      '/master': 'Master Data',
      '/transactions': 'Transactions',
      '/reconciliation': 'Reconciliation',
      '/reports': 'Reports',
    };
    return titles[path] || 'Dashboard';
  };

  // Generate breadcrumb
  const getBreadcrumb = (path) => {
    const titles = {
      '/dashboard': [{ name: 'Home', path: '/dashboard' }],
      '/users': [{ name: 'Home', path: '/dashboard' }, { name: 'Users', path: '/users' }],
      '/master': [{ name: 'Home', path: '/dashboard' }, { name: 'Master Data', path: '/master' }],
      '/transactions': [{ name: 'Home', path: '/dashboard' }, { name: 'Transactions', path: '/transactions' }],
      '/reconciliation': [{ name: 'Home', path: '/dashboard' }, { name: 'Reconciliation', path: '/reconciliation' }],
      '/reports': [{ name: 'Home', path: '/dashboard' }, { name: 'Reports', path: '/reports' }],
    };
    return titles[path] || [{ name: 'Home', path: '/dashboard' }];
  };

  const pageTitle = getPageTitle(location.pathname);
  const breadcrumbs = getBreadcrumb(location.pathname);

  const handleLogout = () => {
    const userName = currentUser?.name || "User";
    addNotification(`👋 ${userName} logged out successfully.`, 'info', 3000, true);
    signOut();
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      setSearchQuery("");
    }
  };

  // Get first letter of name for avatar
  const getInitial = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="topbar topbar-enterprise">
      <div className="topbar-left">
        <button className="menu-button" type="button" onClick={onMenuClick} title="Menu">
          ☰
        </button>

        <div className="page-header">
          <h1 className="page-title">{pageTitle}</h1>
          <nav className="breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="breadcrumb-item">
                {index > 0 && <span className="breadcrumb-separator">/</span>}
                {index === breadcrumbs.length - 1 ? (
                  <span className="breadcrumb-current">{crumb.name}</span>
                ) : (
                  <a href={crumb.path} onClick={(e) => { e.preventDefault(); navigate(crumb.path); }}>
                    {crumb.name}
                  </a>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      <div className="topbar-center">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-button" title="Search">
            🔍
          </button>
        </form>
      </div>

      <div className="topbar-right">
        <NotificationBell />
        {currentUser && (
          <div className="user-profile">
            <div className="user-avatar">{getInitial(currentUser.name)}</div>
            <span className="user-name">{currentUser.name}</span>
          </div>
        )}
        <button type="button" className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Topbar;
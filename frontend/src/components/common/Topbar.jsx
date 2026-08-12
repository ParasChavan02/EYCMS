import { useState } from "react";
import { Menu, PanelLeft, Search } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import NotificationBell from "./NotificationBell";
import ProfileDropdown from "./ProfileDropdown";
import "./topbar-enterprise.css";

function Topbar({ onMenuClick, onToggleSidebar, isAdmin = false }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const currentUser =
    user ||
    (() => {
      const saved = localStorage.getItem("current_user");
      return saved ? JSON.parse(saved) : null;
    })();

  const handleSearch = (event) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      setSearchQuery("");
    }
  };

  return (
    <header className="topbar topbar-enterprise">
      <div className="topbar-primary-row">
        <div className="topbar-left">
          <button className="menu-button" type="button" onClick={onMenuClick} title="Open sidebar">
            <Menu size={18} />
          </button>
          <button className="collapse-button" type="button" onClick={onToggleSidebar} title="Collapse sidebar">
            <PanelLeft size={18} />
          </button>
          <div className="topbar-brand">
            <span className="topbar-brand-mark">EY</span>
            <span className="topbar-brand-text">{isAdmin ? "Admin ERP" : "E-YUVA"}</span>
          </div>
        </div>

        <div className="topbar-center topbar-center-desktop">
          <form className="search-form" onSubmit={handleSearch}>
            <Search size={16} className="search-leading-icon" />
            <input
              type="text"
              placeholder="Search workspace"
              className="search-input"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </form>
        </div>

        <div className="topbar-right">
          <NotificationBell />
          <ProfileDropdown currentUser={currentUser} />
        </div>
      </div>

      <div className="topbar-search-row">
        <form className="search-form" onSubmit={handleSearch}>
          <Search size={16} className="search-leading-icon" />
          <input
            type="text"
            placeholder="Search workspace"
            className="search-input"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </form>
      </div>
    </header>
  );
}

export default Topbar;

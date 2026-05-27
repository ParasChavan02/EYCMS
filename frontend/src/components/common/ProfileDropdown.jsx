import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import { useNavigate } from "react-router-dom";
import "./profileDropdown.css";

function ProfileDropdown({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const { signOut } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const getInitial = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  const handleSettings = () => {
    navigate("/settings");
    setIsOpen(false);
  };

  const handleProfile = () => {
    navigate("/profile");
    setIsOpen(false);
  };

  const handleLogout = () => {
    const userName = currentUser?.name || "User";
    addNotification(`👋 ${userName} logged out successfully.`, 'info', 3000, true);
    signOut();
    navigate("/");
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentUser) return null;

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <button
        className="profile-button"
        onClick={() => setIsOpen(!isOpen)}
        title={currentUser.name}
      >
        <div className="profile-avatar-small">{getInitial(currentUser.name)}</div>
        <span className="profile-name-small">{currentUser.name}</span>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            <div className="dropdown-avatar">{getInitial(currentUser.name)}</div>
            <div className="dropdown-info">
              <div className="dropdown-name">{currentUser.name}</div>
              <div className="dropdown-role">{currentUser.role || "User"}</div>
            </div>
          </div>

          <div className="dropdown-divider"></div>

          <button className="dropdown-item" onClick={handleSettings}>
            ⚙️ Settings
          </button>
          <button className="dropdown-item" onClick={handleProfile}>
            📋 Profile
          </button>
          {/* <button className="dropdown-item">
            🔔 Preferences
          </button> */}

          <div className="dropdown-divider"></div>

          <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;

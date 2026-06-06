import { useState, useRef, useEffect } from "react";
import { Bell, LogOut, Settings, User } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import { useNavigate } from "react-router-dom";
import { ROUTES, getProfileRoute, getSettingsRoute } from "../../constants/routes";
import "./profileDropdown.css";

function ProfileDropdown({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const { signOut } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const getInitial = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  const handleSettings = () => {
    navigate(getSettingsRoute(currentUser));
    setIsOpen(false);
  };

  const handleProfile = () => {
    navigate(getProfileRoute(currentUser));
    setIsOpen(false);
  };

  const handleNotifications = () => {
    window.dispatchEvent(new CustomEvent("toggle-notification-center"));
    setIsOpen(false);
  };

  const handleLogout = () => {
    const userName = currentUser?.name || "User";
    addNotification(`Welcome ${userName}. You have been signed out.`, "info", 3000, true);
    signOut();
    navigate(ROUTES.ROOT);
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentUser) return null;

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <button type="button" className="profile-button" ref={buttonRef} onClick={() => setIsOpen(!isOpen)} title={currentUser.name}>
        <div className="profile-avatar-small">{getInitial(currentUser.name)}</div>
        <span className="profile-name-small">{currentUser.name}</span>
      </button>

      {isOpen && (
        <div className="dropdown-menu" style={dropdownStyle}>
          <div className="dropdown-header">
            <div className="dropdown-avatar">{getInitial(currentUser.name)}</div>
            <div className="dropdown-info">
              <div className="dropdown-name">{currentUser.name}</div>
              <div className="dropdown-role">{currentUser.role || "User"}</div>
            </div>
          </div>

          <div className="dropdown-divider" />

          <button type="button" className="dropdown-item" onClick={handleSettings}>
            <Settings size={16} />
            <span>Settings</span>
          </button>
          <button type="button" className="dropdown-item" onClick={handleProfile}>
            <User size={16} />
            <span>Profile</span>
          </button>
          <button type="button" className="dropdown-item" onClick={handleNotifications}>
            <Bell size={16} />
            <span>Notifications</span>
          </button>

          <div className="dropdown-divider" />

          <button type="button" className="dropdown-item dropdown-logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;

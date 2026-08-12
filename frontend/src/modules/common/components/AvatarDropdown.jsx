import { useState, useRef, useEffect } from "react";
import { Bell, LogOut, Settings, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNotification } from "../hooks/useNotification";
import { useNavigate } from "react-router-dom";
import { ROUTES, getProfileRoute, getSettingsRoute } from "../constants/routes";
import "./avatarDropdown.css";

function AvatarDropdown({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
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
    console.log('👤 handleLogout called, currentUser:', currentUser);
    const userName = currentUser?.name || "User";
    try {
      addNotification(`Welcome ${userName}. You have been signed out.`, "info", 3000, true);
    } catch (e) {
      console.error('👤 addNotification failed:', e);
    }
    console.log('👤 calling signOut...');
    signOut();
    console.log('👤 signOut called, navigating to ROOT...');
    navigate(ROUTES.ROOT);
    setIsOpen(false);
  };

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
      <button type="button" className="profile-button" ref={buttonRef} onClick={() => {
        console.log('👤 Profile button clicked, toggling isOpen from', isOpen, 'to', !isOpen);
        setIsOpen(!isOpen);
      }} title={currentUser.name}>
        <div className="profile-avatar-small">{getInitial(currentUser.name)}</div>
        <span className="profile-name-small">{currentUser.name}</span>
      </button>

      {isOpen && (
        <div className="avatar-dropdown-menu">
          {console.log('👤 Dropdown menu is rendering in DOM!')}
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

export default AvatarDropdown;

import { useState, useEffect } from "react";
import "./profileHeader.css";

function ProfileHeader({ user, onEditClick }) {
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const savedImage = localStorage.getItem("userProfileImage");
    if (savedImage) {
      setProfileImage(savedImage);
    }
  }, []);

  const getInitial = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="profile-header">
      <div className="profile-header-content">
        <div className="profile-avatar-large">
          {profileImage ? (
            <img src={profileImage} alt="Profile" className="avatar-image" />
          ) : (
            getInitial(user?.name)
          )}
        </div>

        <div className="profile-info">
          <h1 className="profile-name">{user?.name || "User"}</h1>
          <p className="profile-role">{user?.role || "Administrator"}</p>
          <div className="profile-meta">
            <span className="status-badge status-active">● Active</span>
            <span className="meta-item">ID: {user?.id || "N/A"}</span>
          </div>
        </div>

        <div className="profile-actions">
          <button className="btn-profile-action" onClick={onEditClick}>
            ✎ Edit Profile
          </button>
          <button className="btn-profile-action btn-secondary">
            🔐 Change Password
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileHeader;

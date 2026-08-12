import { useAuth } from "../hooks/useAuth";
import { useLocation } from "react-router-dom";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileInfoForm from "../components/profile/ProfileInfoForm";
import ProfileAvatarUpload from "../components/profile/ProfileAvatarUpload";
import SecuritySettings from "../components/profile/SecuritySettings";
import ActivityTimeline from "../components/profile/ActivityTimeline";
import TeamOnboardingDetails from "../components/profile/TeamOnboardingDetails";
import { ROUTES, isAdminRole } from "../constants/routes";
import "./profile.css";

function Profile() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const adminProfile = pathname.startsWith(ROUTES.ADMIN_ROOT) || isAdminRole(user);

  const handleEditClick = () => {
    console.log("Edit profile clicked");
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1 className="page-title">{adminProfile ? "Admin Profile" : "My Profile"}</h1>
        <p className="page-subtitle">
          {adminProfile
            ? "Manage administrator identity, security, and recent activity."
            : "Manage your personal information and account settings."}
        </p>
      </div>

      <div className="profile-container">
        <div className="profile-main">
          <ProfileHeader user={user} onEditClick={handleEditClick} />
          <ProfileInfoForm user={user} />
          {!adminProfile && <TeamOnboardingDetails />}
          <ProfileAvatarUpload />
          <SecuritySettings />
        </div>

        <div className="profile-sidebar">
          <ActivityTimeline />
        </div>
      </div>
    </div>
  );
}

export default Profile;

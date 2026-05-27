import { useAuth } from "../hooks/useAuth";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileInfoForm from "../components/profile/ProfileInfoForm";
import ProfileAvatarUpload from "../components/profile/ProfileAvatarUpload";
import SecuritySettings from "../components/profile/SecuritySettings";
import ActivityTimeline from "../components/profile/ActivityTimeline";
import "./profile.css";

function Profile() {
  const { user } = useAuth();

  const handleEditClick = () => {
    console.log("Edit profile clicked");
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your personal information and account settings</p>
      </div>

      <div className="profile-container">
        <div className="profile-main">
          <ProfileHeader user={user} onEditClick={handleEditClick} />
          <ProfileInfoForm user={user} />
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

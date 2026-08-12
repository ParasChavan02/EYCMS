import AccountSettings from "../components/settings/AccountSettings";
import NotificationSettings from "../components/settings/NotificationSettings";
import AppearanceSettings from "../components/settings/AppearanceSettings";
import SecuritySettings from "../components/settings/SecuritySettings";
import SystemPreferences from "../components/settings/SystemPreferences";
import "./settings.css";

function Settings() {
  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure your account preferences and system settings</p>
      </div>

      <div className="settings-container">
        <div className="settings-content">
          <AccountSettings />
          <AppearanceSettings />
          <NotificationSettings />
          <SecuritySettings />
          <SystemPreferences />
        </div>
      </div>
    </div>
  );
}

export default Settings;

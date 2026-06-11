import { useState, useEffect } from "react";
import "./securitySettings.css";

function SecuritySettings() {
  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionManagement: true,
    loginAlerts: true,
  });
  const [saveMessage, setSaveMessage] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const savedSecurity = localStorage.getItem("securitySettings");
    if (savedSecurity) {
      try {
        const parsed = JSON.parse(savedSecurity);
        setSecurity(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.log("Could not load saved security settings");
      }
    }
  }, []);

  const handleToggle = (key) => {
    setSecurity(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem("securitySettings", JSON.stringify(security));
      setSaveMessage("✓ Security settings saved!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (e) {
      setSaveMessage("✗ Error saving settings.");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  return (
    <div className="security-card">
      <div className="card-header">
        <h2 className="card-title">🔒 Security Settings</h2>
      </div>

      <div className="security-list">
        <div className="security-item">
          <div className="security-info">
            <div className="security-label">Two-Factor Authentication</div>
            <div className="security-description">
              Add an extra layer of security to your account
            </div>
          </div>
          <div className="toggle-switch">
            <input
              type="checkbox"
              id="twoFactorAuth"
              checked={security.twoFactorAuth}
              onChange={() => handleToggle("twoFactorAuth")}
              className="toggle-input"
            />
            <label htmlFor="twoFactorAuth" className="toggle-label">
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="security-item">
          <div className="security-info">
            <div className="security-label">Session Management</div>
            <div className="security-description">
              Control your active sessions and sign out from other devices
            </div>
          </div>
          <button className="btn-manage">Manage Sessions</button>
        </div>

        <div className="security-item">
          <div className="security-info">
            <div className="security-label">Login Alerts</div>
            <div className="security-description">
              Get notified of login attempts from new devices
            </div>
          </div>
          <div className="toggle-switch">
            <input
              type="checkbox"
              id="loginAlerts"
              checked={security.loginAlerts}
              onChange={() => handleToggle("loginAlerts")}
              className="toggle-input"
            />
            <label htmlFor="loginAlerts" className="toggle-label">
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="security-item">
          <div className="security-info">
            <div className="security-label">Password Reset</div>
            <div className="security-description">
              Reset your account password
            </div>
          </div>
          <button className="btn-reset-password">Reset Password</button>
        </div>
      </div>

      {saveMessage && (
        <div className={`save-message ${saveMessage.includes("✓") ? "success" : "error"}`}>
          {saveMessage}
        </div>
      )}

      <div className="settings-actions">
        <button className="btn-save-settings" onClick={handleSave}>Save Security Settings</button>
      </div>
    </div>
  );
}

export default SecuritySettings;

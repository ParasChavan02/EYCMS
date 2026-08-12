import { useState } from "react";
import "../../../styles/admin-management.css";

function AdminSystemConfig() {
  const [settings, setSettings] = useState({
    notificationsEmail: true,
    notificationsSms: false,
    notificationsInApp: true,
    loginAttempts: 5,
    sessionTimeout: 30,
    twoFactorAuth: true,
    passwordRotationDays: 90,
    dashboardDefaultRange: "month",
    dashboardShowFinance: true,
    dashboardShowApprovals: true,
    emailSender: "noreply@eyuva.org",
    emailReplyTo: "admin@eyuva.org",
    emailDigest: "daily",
  });

  const [message, setMessage] = useState("");

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNumberChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleValueChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setMessage("Settings updated successfully");
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <main className="admin-page">
      <section className="admin-header">
        <h1>System Configuration</h1>
        <p>Manage notification rules, security controls, dashboard preferences, and email delivery.</p>
      </section>

      <section className="admin-card">
        <h2>Notification Settings</h2>
        <div className="config-grid">
          <div className="config-option">
            <div>
              <p className="config-option-title">Email Notifications</p>
              <p className="config-option-copy">Send approval and workflow updates by email.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notificationsEmail}
              onChange={() => handleToggle("notificationsEmail")}
            />
          </div>
          <div className="config-option">
            <div>
              <p className="config-option-title">SMS Notifications</p>
              <p className="config-option-copy">Send urgent financial alerts via SMS.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notificationsSms}
              onChange={() => handleToggle("notificationsSms")}
            />
          </div>
          <div className="config-option">
            <div>
              <p className="config-option-title">In-app Notifications</p>
              <p className="config-option-copy">Keep real-time notices visible in the topbar.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notificationsInApp}
              onChange={() => handleToggle("notificationsInApp")}
            />
          </div>
        </div>
      </section>

      <section className="admin-card">
        <h2>Security Settings</h2>
        <div className="config-grid">
          <div className="config-option">
            <div>
              <p className="config-option-title">Two-Factor Authentication</p>
              <p className="config-option-copy">Require 2FA for all privileged users.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.twoFactorAuth}
              onChange={() => handleToggle("twoFactorAuth")}
            />
          </div>
          <div className="config-range">
            <label>Max Login Attempts: {settings.loginAttempts}</label>
            <input
              type="range"
              min="3"
              max="10"
              value={settings.loginAttempts}
              onChange={(e) => handleNumberChange("loginAttempts", parseInt(e.target.value))}
            />
          </div>
          <div className="config-range">
            <label>Session Timeout (minutes): {settings.sessionTimeout}</label>
            <input
              type="range"
              min="15"
              max="120"
              value={settings.sessionTimeout}
              onChange={(e) => handleNumberChange("sessionTimeout", parseInt(e.target.value))}
            />
          </div>
          <div className="config-range">
            <label>Password Rotation (days): {settings.passwordRotationDays}</label>
            <input
              type="range"
              min="30"
              max="180"
              step="15"
              value={settings.passwordRotationDays}
              onChange={(e) => handleNumberChange("passwordRotationDays", parseInt(e.target.value))}
            />
          </div>
        </div>
      </section>

      <section className="admin-card">
        <h2>Dashboard Preferences</h2>
        <div className="config-grid two-column">
          <label className="config-field">
            <span>Default Date Range</span>
            <select
              value={settings.dashboardDefaultRange}
              onChange={(e) => handleValueChange("dashboardDefaultRange", e.target.value)}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </label>
          <div className="config-option">
            <div>
              <p className="config-option-title">Show Financial Snapshot</p>
              <p className="config-option-copy">Display accounts and budget summary on the admin dashboard.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.dashboardShowFinance}
              onChange={() => handleToggle("dashboardShowFinance")}
            />
          </div>
          <div className="config-option">
            <div>
              <p className="config-option-title">Show Approval Summary</p>
              <p className="config-option-copy">Keep approval workload visible in the dashboard header.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.dashboardShowApprovals}
              onChange={() => handleToggle("dashboardShowApprovals")}
            />
          </div>
        </div>
      </section>

      <section className="admin-card">
        <h2>Email Settings</h2>
        <div className="config-grid two-column">
          <label className="config-field">
            <span>Sender Address</span>
            <input
              type="email"
              value={settings.emailSender}
              onChange={(e) => handleValueChange("emailSender", e.target.value)}
            />
          </label>
          <label className="config-field">
            <span>Reply-To Address</span>
            <input
              type="email"
              value={settings.emailReplyTo}
              onChange={(e) => handleValueChange("emailReplyTo", e.target.value)}
            />
          </label>
          <label className="config-field">
            <span>Digest Frequency</span>
            <select value={settings.emailDigest} onChange={(e) => handleValueChange("emailDigest", e.target.value)}>
              <option value="instant">Instant</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>
        </div>
      </section>

      <section className="admin-card">
        <button className="btn-primary" onClick={handleSave}>
          Save All Settings
        </button>
        {message && <div className="form-message success">{message}</div>}
      </section>
    </main>
  );
}

export default AdminSystemConfig;


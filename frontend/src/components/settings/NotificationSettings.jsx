import { useState, useEffect } from "react";
import "./notificationSettings.css";

function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    transactionAlerts: true,
    reportUpdates: false,
    budgetWarnings: true,
    systemNotifications: true,
  });
  const [saveMessage, setSaveMessage] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem("notificationSettings");
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.log("Could not load saved notification settings");
      }
    }
  }, []);

  const handleToggle = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const notificationOptions = [
    { key: "emailNotifications", label: "Email Notifications", description: "Receive updates via email" },
    { key: "transactionAlerts", label: "Transaction Alerts", description: "Get notified of new transactions" },
    { key: "reportUpdates", label: "Report Updates", description: "Alerts when reports are generated" },
    { key: "budgetWarnings", label: "Budget Warnings", description: "Alerts when budget thresholds are exceeded" },
    { key: "systemNotifications", label: "System Notifications", description: "General system maintenance alerts" },
  ];

  return (
    <div className="notification-card">
      <div className="card-header">
        <h2 className="card-title">🔔 Notification Settings</h2>
      </div>

      <div className="notification-list">
        {notificationOptions.map((option) => (
          <div key={option.key} className="notification-item">
            <div className="notification-info">
              <div className="notification-label">{option.label}</div>
              <div className="notification-description">{option.description}</div>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id={option.key}
                checked={notifications[option.key]}
                onChange={() => handleToggle(option.key)}
                className="toggle-input"
              />
              <label htmlFor={option.key} className="toggle-label">
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {saveMessage && (
        <div className={`save-message ${saveMessage.includes("✓") ? "success" : "error"}`}>
          {saveMessage}
        </div>
      )}

      <div className="settings-actions">
        <button className="btn-save-settings" onClick={() => {
          try {
            localStorage.setItem("notificationSettings", JSON.stringify(notifications));
            setSaveMessage("✓ Notification settings saved!");
            setTimeout(() => setSaveMessage(""), 3000);
          } catch (e) {
            setSaveMessage("✗ Error saving settings.");
            setTimeout(() => setSaveMessage(""), 3000);
          }
        }}>Save Preferences</button>
      </div>
    </div>
  );
}

export default NotificationSettings;

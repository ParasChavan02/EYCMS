import { useState } from "react";
import "../styles/finance.css";

export default function FinanceSettings() {
  const [settings, setSettings] = useState({
    emailAlerts: true,
    monthlyReports: true,
    auditNotifications: false,
    darkMode: false,
    exportFormat: "PDF",
    autoRefresh: true,
    dataVisibility: "Read Only",
    financialYear: "FY 2026",
  });

  const toggleSetting = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const updateValue = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="fin-page">
      {/* Header */}
      <div className="fin-header">
        <div className="fin-header-top">
          <div>
            <h1>Finance Settings</h1>
            <p className="subtitle">
              Configure your finance workspace preferences and system behavior
            </p>
          </div>
          <span className="fin-badge-role">Read Only Access</span>
        </div>
      </div>

      {/* Preferences Grid */}
      <div className="fin-two-col">
        {/* Notifications */}
        <div className="fin-card">
          <div className="fin-card-header">
            <div>
              <div className="fin-card-title">Notification Preferences</div>
              <div className="fin-card-subtitle">
                Manage alerts and reminders
              </div>
            </div>
          </div>

          <div className="fin-card-body">
            <div className="fin-stat-row">
              <span>Email Alerts</span>
              <button
                className={`fin-btn ${
                  settings.emailAlerts ? "fin-btn-primary" : "fin-btn-ghost"
                }`}
                onClick={() => toggleSetting("emailAlerts")}
              >
                {settings.emailAlerts ? "Enabled" : "Disabled"}
              </button>
            </div>

            <div className="fin-stat-row">
              <span>Monthly Reports</span>
              <button
                className={`fin-btn ${
                  settings.monthlyReports
                    ? "fin-btn-primary"
                    : "fin-btn-ghost"
                }`}
                onClick={() => toggleSetting("monthlyReports")}
              >
                {settings.monthlyReports ? "Enabled" : "Disabled"}
              </button>
            </div>

            <div className="fin-stat-row">
              <span>Audit Notifications</span>
              <button
                className={`fin-btn ${
                  settings.auditNotifications
                    ? "fin-btn-primary"
                    : "fin-btn-ghost"
                }`}
                onClick={() => toggleSetting("auditNotifications")}
              >
                {settings.auditNotifications ? "Enabled" : "Disabled"}
              </button>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="fin-card">
          <div className="fin-card-header">
            <div>
              <div className="fin-card-title">Appearance & System</div>
              <div className="fin-card-subtitle">
                UI and workspace preferences
              </div>
            </div>
          </div>

          <div className="fin-card-body">
            <div className="fin-stat-row">
              <span>Dark Mode</span>
              <button
                className={`fin-btn ${
                  settings.darkMode ? "fin-btn-primary" : "fin-btn-ghost"
                }`}
                onClick={() => toggleSetting("darkMode")}
              >
                {settings.darkMode ? "Enabled" : "Disabled"}
              </button>
            </div>

            <div className="fin-stat-row">
              <span>Auto Refresh Dashboard</span>
              <button
                className={`fin-btn ${
                  settings.autoRefresh ? "fin-btn-primary" : "fin-btn-ghost"
                }`}
                onClick={() => toggleSetting("autoRefresh")}
              >
                {settings.autoRefresh ? "Yes" : "No"}
              </button>
            </div>

            <div className="fin-stat-row">
              <span>Preferred Export Format</span>
              <select
                className="fin-select"
                value={settings.exportFormat}
                onChange={(e) =>
                  updateValue("exportFormat", e.target.value)
                }
              >
                <option>PDF</option>
                <option>Excel</option>
                <option>CSV</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* System Preferences */}
      <div className="fin-card fin-section">
        <div className="fin-card-header">
          <div>
            <div className="fin-card-title">System Preferences</div>
            <div className="fin-card-subtitle">
              Finance workspace configuration
            </div>
          </div>
        </div>

        <div className="fin-card-body">
          <div className="fin-stat-row">
            <span>Financial Year</span>
            <select
              className="fin-select"
              value={settings.financialYear}
              onChange={(e) =>
                updateValue("financialYear", e.target.value)
              }
            >
              <option>FY 2026</option>
              <option>FY 2025</option>
              <option>FY 2024</option>
            </select>
          </div>

          <div className="fin-stat-row">
            <span>Data Visibility</span>
            <select
              className="fin-select"
              value={settings.dataVisibility}
              onChange={(e) =>
                updateValue("dataVisibility", e.target.value)
              }
            >
              <option>Read Only</option>
              <option>Restricted</option>
            </select>
          </div>

          <div className="fin-stat-row">
            <span>Download Permissions</span>
            <button className="fin-btn fin-btn-primary">Allowed</button>
          </div>

          <div className="fin-stat-row">
            <span>Last Sync</span>
            <strong>15 Jun 2026, 11:20 AM</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
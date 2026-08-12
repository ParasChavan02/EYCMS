import { useState, useEffect } from "react";
import "./systemPreferences.css";

function SystemPreferences() {
  const [preferences, setPreferences] = useState({
    defaultDashboard: "overview",
    defaultLandingPage: "dashboard",
    tableDensity: "normal",
    autoRefreshInterval: "5",
  });
  const [saveMessage, setSaveMessage] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem("systemPreferences");
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.log("Could not load saved system preferences");
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPreferences(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem("systemPreferences", JSON.stringify(preferences));
      setSaveMessage("✓ System preferences saved!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (e) {
      setSaveMessage("✗ Error saving preferences.");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  return (
    <div className="preferences-card">
      <div className="card-header">
        <h2 className="card-title">⚙️ System Preferences</h2>
      </div>

      <div className="preferences-grid">
        <div className="form-group">
          <label className="form-label">Default Dashboard View</label>
          <select
            name="defaultDashboard"
            value={preferences.defaultDashboard}
            onChange={handleChange}
            className="form-input"
          >
            <option value="overview">Overview</option>
            <option value="analytics">Analytics</option>
            <option value="reports">Reports</option>
            <option value="transactions">Transactions</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Default Landing Page</label>
          <select
            name="defaultLandingPage"
            value={preferences.defaultLandingPage}
            onChange={handleChange}
            className="form-input"
          >
            <option value="dashboard">Dashboard</option>
            <option value="reports">Reports</option>
            <option value="transactions">Transactions</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Table Density</label>
          <select
            name="tableDensity"
            value={preferences.tableDensity}
            onChange={handleChange}
            className="form-input"
          >
            <option value="compact">Compact</option>
            <option value="normal">Normal</option>
            <option value="comfortable">Comfortable</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Auto Refresh Interval (seconds)</label>
          <select
            name="autoRefreshInterval"
            value={preferences.autoRefreshInterval}
            onChange={handleChange}
            className="form-input"
          >
            <option value="off">Off</option>
            <option value="5">5 seconds</option>
            <option value="15">15 seconds</option>
            <option value="30">30 seconds</option>
            <option value="60">1 minute</option>
          </select>
        </div>
      </div>

      {saveMessage && (
        <div className={`save-message ${saveMessage.includes("✓") ? "success" : "error"}`}>
          {saveMessage}
        </div>
      )}

      <div className="settings-actions">
        <button className="btn-save-settings" onClick={handleSave}>
          Save Preferences
        </button>
      </div>
    </div>
  );
}

export default SystemPreferences;

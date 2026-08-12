import { useState, useEffect } from "react";
import "./appearanceSettings.css";

function AppearanceSettings() {
  const [appearance, setAppearance] = useState({
    theme: "light",
    compactMode: false,
    sidebarCollapsed: false,
    fontSize: "normal",
  });
  const [saveMessage, setSaveMessage] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const savedAppearance = localStorage.getItem("appearanceSettings");
    if (savedAppearance) {
      try {
        const parsed = JSON.parse(savedAppearance);
        setAppearance(prev => ({ ...prev, ...parsed }));
        // Apply saved theme
        if (parsed.theme) {
          document.documentElement.setAttribute("data-theme", parsed.theme);
        }
      } catch (e) {
        console.log("Could not load saved appearance settings");
      }
    }
  }, []);

  const handleChange = (key, value) => {
    setAppearance(prev => ({ ...prev, [key]: value }));
    
    // Apply theme immediately if theme changed
    if (key === "theme") {
      if (value === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("appearanceSettings", JSON.stringify({ ...appearance, [key]: value }));
      } else {
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("appearanceSettings", JSON.stringify({ ...appearance, [key]: value }));
      }
    }
  };

  return (
    <div className="appearance-card">
      <div className="card-header">
        <h2 className="card-title">🎨 Appearance Settings</h2>
      </div>

      <div className="appearance-grid">
        <div className="appearance-option">
          <label className="option-label">Theme</label>
          <div className="option-buttons">
            <button
              className={`theme-btn ${appearance.theme === "light" ? "active" : ""}`}
              onClick={() => handleChange("theme", "light")}
            >
              ☀️ Light
            </button>
            <button
              className={`theme-btn ${appearance.theme === "dark" ? "active" : ""}`}
              onClick={() => handleChange("theme", "dark")}
            >
              🌙 Dark
            </button>
          </div>
        </div>

        <div className="appearance-option">
          <label className="option-label">Font Size</label>
          <select
            value={appearance.fontSize}
            onChange={(e) => handleChange("fontSize", e.target.value)}
            className="option-select"
          >
            <option value="small">Small</option>
            <option value="normal">Normal</option>
            <option value="large">Large</option>
          </select>
        </div>

        <div className="appearance-option full-width">
          <div className="toggle-option">
            <div>
              <div className="setting-label">Compact Mode</div>
              <div className="setting-description">Reduce spacing for more content</div>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="compactMode"
                checked={appearance.compactMode}
                onChange={(e) => handleChange("compactMode", e.target.checked)}
                className="toggle-input"
              />
              <label htmlFor="compactMode" className="toggle-switch-label">
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="appearance-option full-width">
          <div className="toggle-option">
            <div>
              <div className="setting-label">Collapse Sidebar by Default</div>
              <div className="setting-description">Start with sidebar in collapsed state</div>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="sidebarCollapsed"
                checked={appearance.sidebarCollapsed}
                onChange={(e) => handleChange("sidebarCollapsed", e.target.checked)}
                className="toggle-input"
              />
              <label htmlFor="sidebarCollapsed" className="toggle-switch-label">
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {saveMessage && (
        <div className={`save-message ${saveMessage.includes("✓") ? "success" : "error"}`}>
          {saveMessage}
        </div>
      )}

      <div className="settings-actions">
        <button className="btn-save-settings" onClick={() => {
          try {
            localStorage.setItem("appearanceSettings", JSON.stringify(appearance));
            setSaveMessage("✓ Appearance settings saved!");
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

export default AppearanceSettings;

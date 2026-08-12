import { useState, useEffect } from "react";
import "./accountSettings.css";

function AccountSettings() {
  const [formData, setFormData] = useState({
    fullName: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 234-567-8900",
    language: "English",
    timezone: "EST",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("accountSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.log("Could not load saved settings");
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem("accountSettings", JSON.stringify(formData));
      setSaveMessage("✓ Settings saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
      setIsEditing(false);
    } catch (e) {
      setSaveMessage("✗ Error saving settings.");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  return (
    <div className="account-card">
      <div className="card-header">
        <h2 className="card-title">👤 Account Settings</h2>
        <button
          className={`btn-edit-account ${isEditing ? 'btn-save' : ''}`}
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
        >
          {isEditing ? '✓ Save' : '✎ Edit'}
        </button>
      </div>

      {saveMessage && (
        <div className={`save-message ${saveMessage.includes("✓") ? "success" : "error"}`}>
          {saveMessage}
        </div>
      )}

      <div className="account-grid">
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            disabled={!isEditing}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={!isEditing}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={!isEditing}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Language</label>
          <select
            name="language"
            value={formData.language}
            onChange={handleChange}
            disabled={!isEditing}
            className="form-input"
          >
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Timezone</label>
          <select
            name="timezone"
            value={formData.timezone}
            onChange={handleChange}
            disabled={!isEditing}
            className="form-input"
          >
            <option>EST</option>
            <option>CST</option>
            <option>MST</option>
            <option>PST</option>
          </select>
        </div>
      </div>

      {isEditing && (
        <div className="form-actions">
          <button className="btn-cancel" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
          <button className="btn-submit" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}

export default AccountSettings;

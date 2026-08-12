import { useState, useEffect } from "react";
import "./profileInfoForm.css";

function ProfileInfoForm({ user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "+1 234-567-8900",
    department: user?.department || "Finance",
    designation: user?.designation || "Manager",
    address: user?.address || "123 Business Ave, Corporate City, CC 12345",
  });
  const [saveMessage, setSaveMessage] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.log("Could not load saved profile");
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem("userProfile", JSON.stringify(formData));
      setSaveMessage("✓ Profile saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
      setIsEditing(false);
    } catch (e) {
      setSaveMessage("✗ Error saving profile. Try again.");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  return (
    <div className="profile-form-card">
      <div className="form-header">
        <h2 className="form-title">Personal Information</h2>
        <button
          className={`btn-edit ${isEditing ? 'btn-save' : ''}`}
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
        >
          {isEditing ? '✓ Save' : '✎ Edit'}
        </button>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={!isEditing}
            className="form-input"
            placeholder="Full Name"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={!isEditing}
            className="form-input"
            placeholder="Email Address"
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
            placeholder="Phone Number"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Department</label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            disabled={!isEditing}
            className="form-input"
            placeholder="Department"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Designation</label>
          <input
            type="text"
            name="designation"
            value={formData.designation}
            onChange={handleChange}
            disabled={!isEditing}
            className="form-input"
            placeholder="Designation"
          />
        </div>

        <div className="form-group form-full">
          <label className="form-label">Address</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            disabled={!isEditing}
            className="form-input form-textarea"
            placeholder="Street Address"
            rows="3"
          />
        </div>
      </div>

      {saveMessage && (
        <div className={`save-message ${saveMessage.includes("✓") ? "success" : "error"}`}>
          {saveMessage}
        </div>
      )}

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

export default ProfileInfoForm;

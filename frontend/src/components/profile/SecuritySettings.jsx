import { useState } from "react";
import "./securitySettings.css";

function SecuritySettings() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setPasswordMessage("New passwords do not match!");
      return;
    }
    if (formData.newPassword.length < 8) {
      setPasswordMessage("Password must be at least 8 characters long!");
      return;
    }
    console.log("Changing password");
    setPasswordMessage("Password changed successfully!");
    setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <div className="security-card">
      <div className="security-header">
        <h2 className="security-title">🔐 Change Password</h2>
      </div>

      <form onSubmit={handleSubmit} className="security-form">
        <div className="form-group-security">
          <label className="form-label">Current Password</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter current password"
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
        </div>

        <div className="form-group-security">
          <label className="form-label">New Password</label>
          <input
            type={showPassword ? "text" : "password"}
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter new password (min 8 characters)"
            required
          />
          <p className="password-hint">
            Use uppercase, lowercase, numbers, and symbols for a strong password
          </p>
        </div>

        <div className="form-group-security">
          <label className="form-label">Confirm Password</label>
          <input
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="form-input"
            placeholder="Confirm new password"
            required
          />
        </div>

        {passwordMessage && (
          <div className={`password-message ${passwordMessage.includes("success") ? "success" : "error"}`}>
            {passwordMessage}
          </div>
        )}

        <button type="submit" className="btn-change-password">
          Update Password
        </button>
      </form>
    </div>
  );
}

export default SecuritySettings;

import { useState } from "react";
import { X } from "lucide-react";

function AuthHelpModal({ isOpen, onClose }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    issueType: "",
    subject: "",
    description: "",
    screenshot: null,
    attachment: null,
  });

  if (!isOpen) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    setForm((current) => ({
      ...current,
      [name]: files ? files[0] : value,
    }));
  };

  return (
    <div className="auth-help-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-help-title">
      <section className="auth-help-modal">
        <header className="auth-help-header">
          <h2 id="auth-help-title">Help & Support</h2>
          <button type="button" className="auth-help-close" onClick={onClose} aria-label="Close help form">
            <X size={22} />
          </button>
        </header>

        <div className="auth-help-body">
          <section className="auth-help-section">
            <h3>Your Information</h3>
            <label>
              <span>Full Name *</span>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Enter your full name" />
            </label>
            <label>
              <span>Email Address *</span>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com" />
            </label>
            <label>
              <span>Issue Type *</span>
              <select name="issueType" value={form.issueType} onChange={handleChange}>
                <option value="">Select an issue type</option>
                <option>Login problem</option>
                <option>Signup or role access</option>
                <option>Password reset</option>
                <option>Account approval</option>
                <option>Technical error</option>
              </select>
            </label>
          </section>

          <section className="auth-help-section">
            <h3>Issue Details</h3>
            <label>
              <span>Subject *</span>
              <input name="subject" value={form.subject} onChange={handleChange} placeholder="Brief subject of your issue" />
            </label>
            <label>
              <span>Description *</span>
              <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe your issue in detail" />
            </label>
          </section>

          <section className="auth-help-section">
            <h3>Attachments (Optional)</h3>
            <label>
              <span>Screenshot</span>
              <span className="auth-help-upload">
                <input name="screenshot" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleChange} />
                <strong>{form.screenshot?.name || "Choose file or drag and drop"}</strong>
                <small>JPG, PNG, PDF up to 5MB</small>
              </span>
            </label>
            <label>
              <span>Additional Attachment</span>
              <span className="auth-help-upload">
                <input name="attachment" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleChange} />
                <strong>{form.attachment?.name || "Choose file or drag and drop"}</strong>
                <small>JPG, PNG, PDF up to 5MB</small>
              </span>
            </label>
          </section>
        </div>

        <footer className="auth-help-footer">
          <button type="button" className="auth-help-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="auth-help-submit" onClick={onClose}>Submit</button>
        </footer>
      </section>
    </div>
  );
}

export default AuthHelpModal;

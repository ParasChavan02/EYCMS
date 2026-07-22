import { useState } from "react";
import { X, User, Info } from "lucide-react";
import { useNotification } from "../../common/hooks/useNotification";

function ForgotPasswordModal({ isOpen, onClose }) {
  const [identifier, setIdentifier] = useState("");
  const { addNotification } = useNotification();

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      addNotification("⚠️ Please enter your login email or username.", "error", 3000);
      return;
    }

    // Mock successful OTP trigger in frontend
    addNotification(`🔑 OTP sent to ${identifier} successfully!`, "success", 4000);
    setIdentifier("");
    onClose();
  };

  return (
    <div className="forgot-password-overlay" role="dialog" aria-modal="true" aria-labelledby="forgot-password-title">
      <div className="forgot-password-modal">
        <header className="forgot-password-header">
          <h2 id="forgot-password-title" className="forgot-password-title">
            <span className="blue-text">Forgot Your Password?</span> <span className="orange-text">Let Us help You.</span>
          </h2>
          <button type="button" className="forgot-password-close" onClick={onClose} aria-label="Close form">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="forgot-password-body">
          <div className="forgot-password-input-wrapper">
            <span className="forgot-password-input-icon">
              <User size={20} />
            </span>
            <input
              type="text"
              className="forgot-password-input"
              placeholder="Enter Your Login Email/Username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoFocus
            />
          </div>

          <div className="forgot-password-warning-box">
            <span className="forgot-password-warning-icon">
              <Info size={18} />
            </span>
            <p className="forgot-password-warning-text">
              If you do not know your LOGIN EMAIL, please contact ERP Coordinator.
            </p>
          </div>

          <div className="forgot-password-actions">
            <button type="submit" className="forgot-password-btn-send">
              Send OTP
            </button>
            <button type="button" className="forgot-password-btn-cancel" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForgotPasswordModal;

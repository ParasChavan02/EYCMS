import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../common/components/Input";
import Button from "../../common/components/Button";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setMessage("Please complete all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setMessage("Password successfully reset! Redirecting to login...");
    setTimeout(() => navigate("/login"), 1500);
  };

  return (
    <main className="page auth-page">
      <header className="login-topbar">
        <div className="login-brand">
          <strong>E-YUVA ERP</strong>
          <span>Grant management workspace</span>
        </div>
      </header>

      <section className="card auth-card">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>Choose a new password for your account.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            label="New Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            showPasswordToggle
          />
          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            showPasswordToggle
          />

          {message && <div className="form-note">{message}</div>}

          <div className="auth-actions">
            <Button type="submit">Reset Password</Button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default ResetPassword;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../common/components/Input";
import Button from "../../common/components/Button";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setMessage("Please enter your email address.");
      return;
    }
    setMessage("If an account exists with that email, a password reset link has been sent.");
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
          <h1>Forgot Password</h1>
          <p>Enter your email address to receive a recovery link.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          {message && <div className="form-note">{message}</div>}

          <div className="auth-actions">
            <Button type="submit">Send Recovery Link</Button>
          </div>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <button type="button" className="google-button" onClick={() => navigate("/login")}>
          Back to Login
        </button>
      </section>
    </main>
  );
}

export default ForgotPassword;

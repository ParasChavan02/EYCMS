import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../common/hooks/useAuth";
import { useNotification } from "../../common/hooks/useNotification";
import { registerAdmin, registerUser } from "../services/authService";
import Button from "../../common/components/Button";
import Input from "../../common/components/Input";
import AdminTokenField from "../components/AdminTokenField";
import AuthHelpModal from "../components/AuthHelpModal";
import { getHomeRoute } from "../../common/constants/routes";

function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "USER", adminToken: "" });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => {
      const updated = { ...current, [name]: value };
      if (name === "role" && value !== "ADMIN") {
        updated.adminToken = "";
      }
      return updated;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setMessage("Please complete all fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (form.role === "ADMIN" && !form.adminToken) {
      setMessage("Admin access token is required.");
      return;
    }

    setIsLoading(true);
    try {
      let result;
      if (form.role === "ADMIN") {
        result = await registerAdmin(form);
      } else {
        result = await registerUser(form);
      }

      if (result.success) {
        addNotification("✅ Account created successfully! Please log in.", "success", 4000);
        navigate("/login");
      } else {
        setMessage(result.error || "Registration failed");
      }
    } catch (error) {
      setMessage("An error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="page auth-page">
      <style>{`
        @keyframes fadeInField {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-field {
          animation: fadeInField 0.25s ease-out forwards;
        }
      `}</style>

      <header className="login-topbar">
        <div className="login-brand">
          <strong>E-YUVA ERP</strong>
          <span>Grant management workspace</span>
        </div>
        <nav className="login-nav">
          <a href="#features">Features</a>
          <button type="button" className="need-help-button" onClick={() => setHelpOpen(true)}>Need Help</button>
        </nav>
      </header>
      <AuthHelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />

      <div className="auth-wrapper">
        <div className="auth-logo-side">
          <img src="/eyuva_logo.jpg" alt="E-YUVA Center Rajkot" />
        </div>
        <section className="card auth-card">
          <div className="auth-header">
            <h1>Create an account</h1>
            <p>Join E-YUVA and manage your workspace.</p>
          </div>

          <div className="auth-tabs">
            <button type="button" onClick={() => navigate("/login")}>Login</button>
            <button type="button" className="active">Sign up</button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <Input
              label="Full name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
              showPasswordToggle
            />
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              showPasswordToggle
            />

            <label className="form-input">
              <span>Role</span>
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>

            {form.role === "ADMIN" && (
              <AdminTokenField
                value={form.adminToken}
                onChange={handleChange}
              />
            )}

            {message && <div className="form-note">{message}</div>}

            <div className="auth-actions">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Processing..." : "Create account"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default Signup;
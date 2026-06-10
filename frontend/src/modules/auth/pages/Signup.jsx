import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../common/hooks/useAuth";
import { useNotification } from "../../common/hooks/useNotification";
import { signup } from "../services/authService";
import Button from "../../common/components/Button";
import Input from "../../common/components/Input";
import AdminTokenField from "../components/AdminTokenField";
import { getHomeRoute } from "../../common/constants/routes";

function Signup() {
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "USER", adminToken: "" });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [redirectPending, setRedirectPending] = useState(false);
  const { user, signIn } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  // Redirect to dashboard after successful signup
  useEffect(() => {
    if (redirectPending && user) {
      navigate(getHomeRoute(user));
      setRedirectPending(false);
    }
  }, [user, redirectPending, navigate]);

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

    if (!form.email || !form.password || !form.name) {
      setMessage("Please complete all fields.");
      return;
    }

    if (form.role === "ADMIN" && !form.adminToken) {
      setMessage("Admin access token is required.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signup({
        email: form.email,
        password: form.password,
        name: form.name,
        role: form.role,
      });

      if (result.success) {
        addNotification(`✅ Welcome ${result.user.name}! Registered successfully.`, 'success', 3000);
        localStorage.setItem('current_user', JSON.stringify(result.user));
        setRedirectPending(true);
        signIn(result.user);
        setTimeout(() => navigate(getHomeRoute(result.user)), 100);
      } else {
        setMessage(result.error || "Registration failed");
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
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
          <a href="#support">Support</a>
        </nav>
      </header>

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
    </main>
  );
}

export default Signup;

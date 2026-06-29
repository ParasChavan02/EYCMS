import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../common/hooks/useAuth";
import { useNotification } from "../../common/hooks/useNotification";
import { login } from "../services/authService";
import Button from "../../common/components/Button";
import Input from "../../common/components/Input";
import AuthHelpModal from "../components/AuthHelpModal";
import { getHomeRoute } from "../../common/constants/routes";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [redirectPending, setRedirectPending] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { user, signIn } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  // Redirect to dashboard after successful login
  useEffect(() => {
    if (redirectPending && user) {
      navigate(getHomeRoute(user));
      setRedirectPending(false);
    }
  }, [user, redirectPending, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!form.email || !form.password) {
      setMessage("Please complete both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await login({ email: form.email, password: form.password });

      if (result.success) {
        addNotification(`✅ Welcome ${result.user.name}! Logged in successfully.`, 'success', 3000);
        localStorage.setItem('current_user', JSON.stringify(result.user));
        setRedirectPending(true);
        signIn(result.user);
        setTimeout(() => navigate(getHomeRoute(result.user)), 100);
      } else {
        setMessage(result.error || "Authentication failed");
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    const googleUser = { id: "google_1", name: "Google User", email: "google.user@example.com", role: "USER" };
    localStorage.setItem("current_user", JSON.stringify(googleUser));
    signIn(googleUser);
    navigate(getHomeRoute(googleUser));
  };

  return (
    <main className="page auth-page">
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

      <section className="card auth-card">
        <div className="auth-header">
          <h1>Welcome back</h1>
          <p>Sign in to access your workspace or create a new account.</p>
        </div>

        <div className="auth-tabs">
          <button type="button" className="active">Login</button>
          <button type="button" onClick={() => navigate("/signup")}>Sign up</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
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

          {message && <div className="form-note">{message}</div>}

          <div className="auth-actions">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Processing..." : "Login"}
            </Button>
          </div>
        </form>

        <div className="divider">
          <span></span>
        </div>

        {/* <button type="button" className="google-button" onClick={handleGoogleSignIn}>
          Continue with Google
        </button> */}
      </section>
    </main>
  );
}

export default Login;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useNotification } from "../hooks/useNotification";
import { login, signup } from "../services/authService";
import Button from "../components/common/Button";
import FormInput from "../components/common/FormInput";

function Login() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "USER" });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [redirectPending, setRedirectPending] = useState(false);
  const { user, signIn } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  // Redirect to dashboard after successful login
  useEffect(() => {
    console.log('🔍 useEffect running - redirectPending:', redirectPending, 'user:', user)
    if (redirectPending && user) {
      console.log('🔄 User state updated, navigating to dashboard...')
      navigate("/dashboard");
      setRedirectPending(false);
    }
  }, [user, redirectPending, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('📤 Form submitted in', mode, 'mode with:', form)
    setMessage("");

    if (!form.email || !form.password) {
      setMessage("Please complete both email and password.");
      return;
    }

    if (mode === "signup" && !form.name) {
      setMessage("Please enter your full name to sign up.");
      return;
    }

    setIsLoading(true);
    try {
      let result;
      if (mode === "signup") {
        console.log('→ Calling signup...')
        result = await signup({ email: form.email, password: form.password, name: form.name, role: form.role });
      } else {
        console.log('→ Calling login...')
        result = await login({ email: form.email, password: form.password });
      }

      console.log('← Auth result:', result)

      if (result.success) {
        addNotification(`✅ Welcome ${result.user.name}! Logged in successfully.`, 'success', 3000)
        console.log('✅ Auth successful, setting redirect flag and updating user...')
        console.log('👉 Calling signIn with:', result.user)
        // Save to localStorage as backup
        localStorage.setItem('current_user', JSON.stringify(result.user))
        console.log('💾 Saved user to localStorage')
        setRedirectPending(true);
        signIn(result.user);
        console.log('✋ After signIn call')
        // Also navigate immediately
        setTimeout(() => navigate("/dashboard"), 100)
      } else {
        console.log('❌ Auth failed:', result.error)
        setMessage(result.error || "Authentication failed");
      }
    } catch (error) {
      console.error('⚠️ Exception:', error)
      setMessage("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn({ id: "google_1", name: "Google User", email: "google.user@example.com", role: "USER" });
    navigate("/dashboard");
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
          <a href="#support">Support</a>
        </nav>
      </header>

      <section className="card auth-card">
        <div className="auth-header">
          <h1>Welcome back</h1>
          <p>Sign in to access your workspace or create a new account.</p>
        </div>

        <div className="auth-tabs">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</button>
          <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Sign up</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <FormInput label="Full name" name="name" value={form.name} onChange={handleChange} placeholder="Your name" />
          )}
          <FormInput label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />
          <FormInput label="Password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Enter password" showPasswordToggle />

          {mode === "signup" && (
            <label className="form-input">
              <span>Role</span>
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="ADMIN">ADMIN</option>
                <option value="USER">USER</option>
              </select>
            </label>
          )}

          {message && <div className="form-note">{message}</div>}

          <div className="auth-actions">
          <Button type="submit" disabled={isLoading}>{isLoading ? "Processing..." : mode === "login" ? "Login" : "Create account"}</Button>
          </div>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <button type="button" className="google-button" onClick={handleGoogleSignIn}>
          Continue with Google
        </button>
      </section>
    </main>
  );
}

export default Login;

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useNotification } from "../../common/hooks/useNotification";
import Button from "../../common/components/Button";
import Input from "../../common/components/Input";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const [invitationDetails, setInvitationDetails] = useState(null);
  const [form, setForm] = useState({ name: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Invitation token is missing in URL.");
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/invitations/${token}`);
        if (response.data && response.data.success) {
          const details = response.data.data;
          setInvitationDetails(details);
          setForm((f) => ({ ...f, name: details.invited_name }));
        } else {
          setError(response.data.message || "Invalid invitation token.");
        }
      } catch (err) {
        setError(err.response?.data?.error || err.response?.data?.detail || "This invitation link is invalid or has expired.");
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.password || !form.confirmPassword) {
      setError("Please complete all fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/invitations/accept`, {
        token,
        name: form.name.trim(),
        password: form.password,
        confirm_password: form.confirmPassword
      });

      if (response.data && response.data.success) {
        addNotification("🎉 Welcome aboard! Your account has been created. Please log in.", "success", 5000);
        navigate("/login");
      } else {
        setError(response.data.message || "Failed to accept invitation.");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || "An error occurred during account creation.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="page auth-page">
        <div className="auth-wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
          <div style={{ color: "#304761", fontSize: "1.2rem", fontWeight: "600" }}>Verifying invitation token...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="page auth-page">
      <header className="login-topbar">
        <div className="login-brand">
          <strong>E-YUVA ERP</strong>
          <span>Grant management workspace</span>
        </div>
      </header>

      <div className="auth-wrapper">
        <div className="auth-logo-side">
          <img src="/eyuva_logo.jpg" alt="E-YUVA Center Rajkot" />
        </div>

        <section className="card auth-card animate-in">
          {error && !invitationDetails ? (
            <div className="auth-header" style={{ textAlign: "center" }}>
              <h1 style={{ color: "#ef4444" }}>Invitation Invalid</h1>
              <p style={{ margin: "16px 0 24px", color: "#64748b" }}>{error}</p>
              <Button onClick={() => navigate("/login")}>Go to Login</Button>
            </div>
          ) : (
            <>
              <div className="auth-header">
                <h1>Complete Setup</h1>
                <p>Join project <strong>{invitationDetails?.projectId}</strong> and set up your password.</p>
              </div>

              <form className="auth-form" onSubmit={handleSubmit}>
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={invitationDetails?.invited_email}
                  disabled
                />
                <Input
                  label="Full Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  disabled={submitting}
                />
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Choose password"
                  showPasswordToggle
                  disabled={submitting}
                />
                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  showPasswordToggle
                  disabled={submitting}
                />

                {error && <div className="form-note" style={{ color: "#ef4444", background: "#fef2f2", border: "1px solid #fee2e2", padding: "8px 12px", borderRadius: "6px" }}>{error}</div>}

                <div className="auth-actions" style={{ marginTop: "24px" }}>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Creating account..." : "Complete Setup & Join"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default AcceptInvitation;

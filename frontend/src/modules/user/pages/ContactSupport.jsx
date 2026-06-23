import { useState, useEffect } from "react";
import { Clock3, Mail, MapPin, Phone, RefreshCw, AlertCircle, CheckCircle2, Send, XCircle } from "lucide-react";
import { useAuth } from "../../common/hooks/useAuth";
import { useNotification } from "../../common/hooks/useNotification";
import { teamService } from "../services/teamService";
import "./user-erp.css";

function ContactSupport() {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [resetRequest, setResetRequest] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && user.role === "USER") {
      teamService.getResetRequest(user).then((req) => {
        setResetRequest(req);
      });
    }
  }, [user]);

  const handleRequestReset = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const req = await teamService.requestTeamReset(user);
      setResetRequest(req);
      addNotification("✉️ Onboarding reset request submitted to admin portal!", "success", 4000);
    } catch (err) {
      addNotification("❌ Failed to submit request. Please try again.", "error", 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUserRole = user?.role === "USER";

  return (
    <main className="user-erp-page">
      <div className="user-support-layout">
        <header className="user-erp-header">
          <h1>Contact Support</h1>
          <p>Get in touch with our support team</p>
        </header>

        <section className="user-erp-card user-support-card">
          <div className="user-contact-item">
            <div className="user-contact-icon"><Mail size={36} /></div>
            <h3>Email</h3>
            <a href="mailto:support@eyuva-erp.com">eyuva@atmiyauni.ac.in</a>
          </div>

          <div className="user-contact-item">
            <div className="user-contact-icon"><Phone size={36} /></div>
            <h3>Phone</h3>
            <strong>+91 85478 50276</strong>
          </div>

          <div className="user-contact-item">
            <div className="user-contact-icon"><Clock3 size={36} /></div>
            <h3>Office Hours</h3>
            <p>Monday - Friday, 9:00 AM - 6:00 PM IST</p>
          </div>

          <div className="user-contact-item">
            <div className="user-contact-icon"><MapPin size={36} /></div>
            <h3>Address</h3>
            <p>E-YUVA ERP Support Desk, Atmiya Univesity</p>
          </div>
        </section>

        {isUserRole && (
          <section className="user-erp-card" style={{ marginTop: "24px", padding: "28px" }}>
            <div className="support-reset-panel" style={{ display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" }}>
              <div className="support-reset-icon-box" style={{
                background: "rgba(15, 90, 255, 0.08)",
                color: "#0f5aff",
                padding: "16px",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <RefreshCw size={32} />
              </div>
              <div style={{ flex: 1, minWidth: "280px" }}>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "1.2rem", fontWeight: "600", color: "var(--text-muted)" }}>
                  Team Workspace Setup Support
                </h3>
                <p style={{ color: "var(--text-light)", fontSize: "0.9rem", margin: "0 0 20px 0", lineHeight: "1.6" }}>
                  Forgot to add team members or entered an incorrect Project ID during onboarding? Submit a request to the Admin portal to reset your team workspace setup, allowing you to reconfigure the details.
                </p>

                {resetRequest ? (
                  <div className={`reset-request-alert status-${resetRequest.status.toLowerCase()}`} style={{
                    padding: "16px 20px",
                    borderRadius: "10px",
                    border: "1px solid",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    flexWrap: "wrap",
                    transition: "all 0.2s ease"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {resetRequest.status === "Pending" && <AlertCircle size={22} className="alert-icon-color" />}
                      {resetRequest.status === "Approved" && <CheckCircle2 size={22} className="alert-icon-color" />}
                      {resetRequest.status === "Rejected" && <XCircle size={22} className="alert-icon-color" />}
                      <div>
                        <strong style={{ display: "block", fontSize: "0.95rem" }}>
                          Reset Request Status: {resetRequest.status}
                        </strong>
                        <span style={{ fontSize: "0.85rem", opacity: 0.9 }}>
                          {resetRequest.status === "Pending" && "Your request was submitted and is pending review by administrators."}
                          {resetRequest.status === "Approved" && "Request approved! Refresh your browser page to re-open the onboarding setup."}
                          {resetRequest.status === "Rejected" && "Your request was declined. Please submit another request or contact support."}
                        </span>
                      </div>
                    </div>
                    {resetRequest.status === "Approved" && (
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="btn-refresh-onboard"
                        style={{
                          background: "#10b981",
                          color: "white",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          border: "none",
                          cursor: "pointer"
                        }}
                      >
                        Refresh Page
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestReset}
                    disabled={isSubmitting}
                    className="user-primary-button"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 20px",
                      borderRadius: "8px",
                      fontWeight: "600",
                      fontSize: "0.9rem",
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    <Send size={16} />
                    {isSubmitting ? "Submitting Request..." : "Request Workspace Reset"}
                  </button>
                )}
              </div>
            </div>

            <style>{`
              .reset-request-alert.status-pending {
                background: #fffbeb;
                border-color: #fef3c7;
                color: #b45309;
              }
              .reset-request-alert.status-pending .alert-icon-color {
                color: #d97706;
              }
              .reset-request-alert.status-approved {
                background: #ecfdf5;
                border-color: #d1fae5;
                color: #047857;
              }
              .reset-request-alert.status-approved .alert-icon-color {
                color: #059669;
              }
              .reset-request-alert.status-rejected {
                background: #fef2f2;
                border-color: #fee2e2;
                color: #b91c1c;
              }
              .reset-request-alert.status-rejected .alert-icon-color {
                color: #dc2626;
              }
              
              /* Dark mode styling overrides */
              html[data-theme="dark"] .reset-request-alert.status-pending {
                background: rgba(217, 119, 6, 0.15);
                border-color: rgba(217, 119, 6, 0.25);
                color: #fbbf24;
              }
              html[data-theme="dark"] .reset-request-alert.status-approved {
                background: rgba(5, 150, 105, 0.15);
                border-color: rgba(5, 150, 105, 0.25);
                color: #34d399;
              }
              html[data-theme="dark"] .reset-request-alert.status-rejected {
                background: rgba(220, 38, 38, 0.15);
                border-color: rgba(220, 38, 38, 0.25);
                color: #fca5a5;
              }
            `}</style>
          </section>
        )}
      </div>
    </main>
  );
}

export default ContactSupport;

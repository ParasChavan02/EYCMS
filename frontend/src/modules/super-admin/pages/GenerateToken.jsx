import React, { useState } from "react";
import { Copy, Download, KeyRound, CheckCircle } from "lucide-react";
import { superAdminService } from "../../../services/superAdminService";
import { useNotification } from "../../common/hooks/useNotification";
import Button from "../../common/components/Button";
import Input from "../../common/components/Input";

function GenerateToken() {
  const { addNotification } = useNotification();
  const [form, setForm] = useState({ invitedName: "", invitedEmail: "", expiryDuration: "24 Hours" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedToken, setGeneratedToken] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((curr) => ({ ...curr, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setGeneratedToken(null);

    if (!form.invitedName || !form.invitedEmail) {
      setError("Please complete all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await superAdminService.generateToken(form);
      if (res.success && res.data) {
        setGeneratedToken(res.data.token);
        addNotification("✅ Invitation token generated successfully!", "success", 3000);
      } else {
        setError(res.error || "Failed to generate token.");
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setError(err.response.data.error || err.response.data.detail || "Failed to generate token.");
      } else {
        setError("Could not connect to Backend API. Please verify FastAPI status.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      addNotification("📋 Token copied to clipboard!", "info", 2000);
    }
  };

  const handleDownload = () => {
    if (!generatedToken) return;
    const element = document.createElement("a");
    const file = new Blob(
      [
        `E-YUVA ERP Admin Invitation Token\n`,
        `=================================\n`,
        `Invited Name : ${form.invitedName}\n`,
        `Invited Email: ${form.invitedEmail}\n`,
        `Token Value  : ${generatedToken}\n`,
        `Expiry       : ${form.expiryDuration}\n`,
        `Generated At : ${new Date().toLocaleString()}\n`,
      ],
      { type: "text/plain" }
    );
    element.href = URL.createObjectURL(file);
    element.download = `ey_invitation_${form.invitedEmail}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    addNotification("💾 Invitation details downloaded!", "info", 2000);
  };

  return (
    <main className="page form-page" style={{ padding: "24px", maxWidth: "600px", margin: "0 auto", textAlign: "left" }}>
      <header className="dashboard-header" style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", margin: "0 0 4px 0", fontWeight: "600" }}>Generate Invitation</h1>
        <p style={{ color: "#64748b", margin: 0 }}>Create a registration token to onboard a new Coordinator Admin.</p>
      </header>

      {error && (
        <div style={{ padding: "16px", backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: "8px", marginBottom: "24px" }}>
          {error}
        </div>
      )}

      <section
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          border: "1px solid #e2e8f0",
        }}
      >
        <form onSubmit={handleSubmit} className="auth-form" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input
            label="Invited Full Name *"
            name="invitedName"
            value={form.invitedName}
            onChange={handleChange}
            placeholder="Enter full name"
            disabled={loading}
          />

          <Input
            label="Invited Email *"
            name="invitedEmail"
            type="email"
            value={form.invitedEmail}
            onChange={handleChange}
            placeholder="admin@example.com"
            disabled={loading}
          />

          <label className="form-input" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>Expiry Duration *</span>
            <select
              name="expiryDuration"
              value={form.expiryDuration}
              onChange={handleChange}
              disabled={loading}
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                backgroundColor: "white",
                fontSize: "14px",
                color: "#1e293b",
                outline: "none",
                transition: "border-color 0.2s",
              }}
            >
              <option value="24 Hours">24 Hours</option>
              <option value="7 Days">7 Days</option>
              <option value="30 Days">30 Days</option>
            </select>
          </label>

          <div style={{ marginTop: "8px" }}>
            <Button type="submit" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Generating..." : "Generate Token"}
            </Button>
          </div>
        </form>
      </section>

      {generatedToken && (
        <section
          style={{
            marginTop: "24px",
            backgroundColor: "#f8fafc",
            borderRadius: "12px",
            padding: "24px",
            border: "1px dashed #cbd5e1",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            animation: "fadeInField 0.3s ease-out forwards",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#166534" }}>
            <CheckCircle size={20} />
            <strong style={{ fontSize: "16px" }}>Token Generated Successfully</strong>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>ACCESS TOKEN</span>
            <div
              style={{
                backgroundColor: "white",
                padding: "12px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                fontFamily: "monospace",
                fontSize: "14px",
                wordBreak: "break-all",
                color: "#0f172a",
                userSelect: "all",
              }}
            >
              {generatedToken}
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={handleCopy}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid #0f5aff",
                backgroundColor: "white",
                color: "#0f5aff",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <Copy size={16} />
              Copy Token
            </button>
            <button
              onClick={handleDownload}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid #475569",
                backgroundColor: "white",
                color: "#475569",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <Download size={16} />
              Download Info
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

export default GenerateToken;

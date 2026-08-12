import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound, Clock, ShieldCheck, Laptop } from "lucide-react";
import { superAdminService } from "../../../services/superAdminService";
import TokenStatusBadge from "../components/TokenStatusBadge";

function TokenDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDetails() {
      try {
        setLoading(true);
        setError("");
        const res = await superAdminService.getTokenById(id);
        if (res.success && res.data) {
          setTokenData(res.data);
        } else {
          setError(res.error || "Invitation token details not found.");
        }
      } catch (err) {
        console.error(err);
        if (err.response && err.response.data) {
          setError(err.response.data.error || err.response.data.detail || "Failed to load token details.");
        } else {
          setError("Unable to connect to Backend API. Please verify FastAPI status.");
        }
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [id]);

  if (loading) {
    return (
      <main className="page" style={{ padding: "24px", textAlign: "left" }}>
        <div>Loading token details...</div>
      </main>
    );
  }

  if (error || !tokenData) {
    return (
      <main className="page" style={{ padding: "24px", textAlign: "left" }}>
        <button
          onClick={() => navigate("/super-admin/tokens")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            border: "none",
            background: "none",
            color: "#0f5aff",
            cursor: "pointer",
            fontWeight: "600",
            marginBottom: "16px",
          }}
        >
          <ArrowLeft size={16} /> Back to List
        </button>
        <div style={{ padding: "16px", backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: "8px" }}>
          {error || "Details not found."}
        </div>
      </main>
    );
  }

  const detailGroups = [
    {
      title: "Invitation Metadata",
      icon: <KeyRound size={18} color="#0f5aff" />,
      items: [
        { label: "Token ID", value: tokenData.id, mono: true },
        { label: "Token Value", value: tokenData.token, mono: true },
        { label: "Invited Name", value: tokenData.invited_name },
        { label: "Invited Email", value: tokenData.invited_email },
        {
          label: "Status",
          value: <TokenStatusBadge status={tokenData.status} />,
          raw: true,
        },
      ],
    },
    {
      title: "Token Lifecycle",
      icon: <Clock size={18} color="#10b981" />,
      items: [
        { label: "Created By", value: tokenData.creator_name || "Super Admin" },
        {
          label: "Created At",
          value: tokenData.created_at ? new Date(tokenData.created_at).toLocaleString() : "-",
        },
        {
          label: "Expiry Date",
          value: tokenData.expires_at ? new Date(tokenData.expires_at).toLocaleString() : "-",
        },
        {
          label: "Used At",
          value: tokenData.used_at ? new Date(tokenData.used_at).toLocaleString() : "Not used yet",
        },
        {
          label: "Revoked At",
          value: tokenData.revoked_at ? new Date(tokenData.revoked_at).toLocaleString() : "Not revoked",
        },
      ],
    },
    {
      title: "Registration Device Logs (Placeholders)",
      icon: <Laptop size={18} color="#475569" />,
      items: [
        { label: "Registration IP", value: tokenData.registration_ip || "192.168.1.105 (Placeholder)" },
        { label: "Device Info", value: tokenData.device || "Chrome on Windows 11 (Placeholder)" },
      ],
    },
  ];

  return (
    <main className="page" style={{ padding: "24px", textAlign: "left", maxWidth: "800px", margin: "0 auto" }}>
      <button
        onClick={() => navigate("/super-admin/tokens")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          border: "none",
          background: "none",
          color: "#0f5aff",
          cursor: "pointer",
          fontWeight: "600",
          marginBottom: "20px",
          padding: 0,
        }}
      >
        <ArrowLeft size={16} /> Back to List
      </button>

      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", margin: "0 0 4px 0", fontWeight: "600" }}>Token Details</h1>
        <p style={{ color: "#64748b", margin: 0 }}>Detailed specifications and lifecycle state of the invitation record.</p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {detailGroups.map((group, idx) => (
          <section
            key={idx}
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
              {group.icon}
              <h2 style={{ fontSize: "16px", fontWeight: "600", margin: 0, color: "#1e293b" }}>{group.title}</h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {group.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #f8fafc",
                    paddingBottom: "8px",
                  }}
                >
                  <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>{item.label}</span>
                  {item.raw ? (
                    item.value
                  ) : (
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#1e293b",
                        fontFamily: item.mono ? "monospace" : "inherit",
                        backgroundColor: item.mono ? "#f1f5f9" : "transparent",
                        padding: item.mono ? "2px 6px" : 0,
                        borderRadius: item.mono ? "4px" : 0,
                        wordBreak: "break-all",
                        maxWidth: "60%",
                        textAlign: "right",
                      }}
                    >
                      {item.value || "-"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

export default TokenDetails;

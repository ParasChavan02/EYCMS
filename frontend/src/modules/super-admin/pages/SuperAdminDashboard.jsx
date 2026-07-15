import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, List, Clock, ShieldAlert, CheckCircle } from "lucide-react";
import { superAdminService } from "../../../services/superAdminService";
import AnalyticsCard from "../../admin/components/AnalyticsCard";
import TokenStatusBadge from "../components/TokenStatusBadge";

function SuperAdminDashboard() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    used: 0,
    expired: 0,
    revoked: 0,
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");
        const res = await superAdminService.getTokens();
        // Assuming response structure is envelope: { success: true, data: [...] }
        const tokenList = res.success && res.data ? res.data : (Array.isArray(res) ? res : []);
        setTokens(tokenList);

        // Calculate stats
        const total = tokenList.length;
        let active = 0;
        let used = 0;
        let expired = 0;
        let revoked = 0;

        tokenList.forEach((t) => {
          const status = t.status ? t.status.toUpperCase() : "ACTIVE";
          if (status === "ACTIVE") active++;
          else if (status === "USED") used++;
          else if (status === "EXPIRED") expired++;
          else if (status === "REVOKED") revoked++;
        });

        setStats({ total, active, used, expired, revoked });
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError("Unable to connect to Backend API. Please verify FastAPI status.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const latestTokens = tokens.slice(0, 5);

  return (
    <main className="page dashboard-page" style={{ padding: "24px" }}>
      <header className="dashboard-header" style={{ marginBottom: "24px", textAlign: "left" }}>
        <h1 style={{ fontSize: "28px", margin: "0 0 4px 0", fontWeight: "600" }}>Super Admin Dashboard</h1>
        <p style={{ color: "#64748b", margin: 0 }}>Overview of Admin registration tokens and invitations.</p>
      </header>

      {error && (
        <div style={{ padding: "16px", backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: "8px", marginBottom: "24px", textAlign: "left" }}>
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <AnalyticsCard
          icon={<KeyRound color="#0f5aff" />}
          label="Total Invitations"
          value={loading ? "..." : stats.total}
          color="#0f5aff"
        />
        <AnalyticsCard
          icon={<Clock color="#10b981" />}
          label="Active Tokens"
          value={loading ? "..." : stats.active}
          color="#10b981"
        />
        <AnalyticsCard
          icon={<CheckCircle color="#3b82f6" />}
          label="Used Tokens"
          value={loading ? "..." : stats.used}
          color="#3b82f6"
        />
        <AnalyticsCard
          icon={<ShieldAlert color="#f59e0b" />}
          label="Expired Tokens"
          value={loading ? "..." : stats.expired}
          color="#f59e0b"
        />
        <AnalyticsCard
          icon={<ShieldAlert color="#ef4444" />}
          label="Revoked Tokens"
          value={loading ? "..." : stats.revoked}
          color="#ef4444"
        />
      </section>

      {/* Latest generated tokens table */}
      <section
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          textAlign: "left",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>Latest Generated Invitations</h2>
          <Link
            to="/super-admin/tokens"
            style={{ color: "#0f5aff", fontSize: "14px", fontWeight: "600", textDecoration: "none" }}
          >
            View All
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#475569", fontWeight: "600" }}>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Token ID</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Invited Name</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Invited Email</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: "32px", textAllign: "center", color: "#64748b", textAlign: "center" }}>
                    Loading data...
                  </td>
                </tr>
              ) : latestTokens.length > 0 ? (
                latestTokens.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: "12px", color: "#0f172a" }}>
                      {t.id ? t.id.slice(0, 8) + "..." : t.token ? t.token.slice(0, 10) + "..." : ""}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#334155" }}>{t.invited_name}</td>
                    <td style={{ padding: "12px 16px", color: "#334155" }}>{t.invited_email}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <TokenStatusBadge status={t.status} />
                    </td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>
                      {t.created_at ? new Date(t.created_at).toLocaleDateString() : ""}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                    No invitation tokens generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default SuperAdminDashboard;

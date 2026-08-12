import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, Copy, Trash2 } from "lucide-react";
import { superAdminService } from "../../../services/superAdminService";
import { useNotification } from "../../common/hooks/useNotification";
import DataTable from "../../admin/components/DataTable";
import TokenStatusBadge from "../components/TokenStatusBadge";

function GeneratedTokens() {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    loadTokens();
  }, []);

  async function loadTokens() {
    try {
      setLoading(true);
      setError("");
      const res = await superAdminService.getTokens();
      const list = res.success && res.data ? res.data : (Array.isArray(res) ? res : []);
      setTokens(list);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to Backend API. Please verify FastAPI status.");
    } finally {
      setLoading(false);
    }
  }

  const handleCopy = (tokenVal) => {
    navigator.clipboard.writeText(tokenVal);
    addNotification("📋 Token copied to clipboard!", "info", 2000);
  };

  const handleRevoke = async (id) => {
    if (!window.confirm("Are you sure you want to revoke this invitation token?")) {
      return;
    }

    try {
      const res = await superAdminService.revokeToken(id);
      if (res.success) {
        addNotification("✅ Invitation token revoked successfully!", "success", 3000);
        loadTokens();
      } else {
        addNotification(`❌ ${res.error || "Failed to revoke token"}`, "error", 3000);
      }
    } catch (err) {
      console.error(err);
      addNotification("❌ Error: Could not revoke token on backend.", "error", 3000);
    }
  };

  // Filter and Search logic
  const filteredTokens = tokens.filter((t) => {
    const term = search.toLowerCase();
    const matchesSearch =
      (t.id && t.id.toLowerCase().includes(term)) ||
      (t.token && t.token.toLowerCase().includes(term)) ||
      (t.invited_name && t.invited_name.toLowerCase().includes(term)) ||
      (t.invited_email && t.invited_email.toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === "ALL" || (t.status && t.status.toUpperCase() === statusFilter);

    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: "id",
      label: "Token ID",
      render: (val, row) => (
        <span style={{ fontFamily: "monospace", fontSize: "12px" }}>
          {val ? val.slice(0, 8) + "..." : row.token ? row.token.slice(0, 10) + "..." : ""}
        </span>
      ),
    },
    { key: "invited_name", label: "Invited Name" },
    { key: "invited_email", label: "Invited Email" },
    {
      key: "status",
      label: "Status",
      render: (val) => <TokenStatusBadge status={val} />,
    },
    {
      key: "created_at",
      label: "Created Date",
      render: (val) => (val ? new Date(val).toLocaleDateString() : ""),
    },
    {
      key: "expires_at",
      label: "Expiry Date",
      render: (val) => (val ? new Date(val).toLocaleDateString() : ""),
    },
    {
      key: "used_at",
      label: "Used Date",
      render: (val) => (val ? new Date(val).toLocaleDateString() : "-"),
    },
    {
      key: "revoked_at",
      label: "Revoked Date",
      render: (val) => (val ? new Date(val).toLocaleDateString() : "-"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => {
        const isActive = row.status && row.status.toUpperCase() === "ACTIVE";
        return (
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => navigate(`/super-admin/token/${row.id}`)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #dbe2ea",
                backgroundColor: "white",
                color: "#475569",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600",
              }}
              title="View Details"
            >
              <Eye size={14} />
              View
            </button>
            <button
              onClick={() => handleCopy(row.token)}
              disabled={!isActive}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #dbe2ea",
                backgroundColor: isActive ? "white" : "#f1f5f9",
                color: isActive ? "#0f5aff" : "#94a3b8",
                cursor: isActive ? "pointer" : "not-allowed",
                fontSize: "12px",
                fontWeight: "600",
              }}
              title="Copy Token"
            >
              <Copy size={14} />
              Copy
            </button>
            <button
              onClick={() => handleRevoke(row.id)}
              disabled={!isActive}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #fee2e2",
                backgroundColor: isActive ? "white" : "#f1f5f9",
                color: isActive ? "#ef4444" : "#94a3b8",
                cursor: isActive ? "pointer" : "not-allowed",
                fontSize: "12px",
                fontWeight: "600",
              }}
              title="Revoke Token"
            >
              <Trash2 size={14} />
              Revoke
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <main className="page list-page" style={{ padding: "24px", textAlign: "left" }}>
      <header className="dashboard-header" style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", margin: "0 0 4px 0", fontWeight: "600" }}>Generated Invitations</h1>
        <p style={{ color: "#64748b", margin: 0 }}>View and manage active, used, expired, or revoked admin invitation tokens.</p>
      </header>

      {error && (
        <div style={{ padding: "16px", backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: "8px", marginBottom: "24px" }}>
          {error}
        </div>
      )}

      {/* Search & Filter Bar */}
      <section
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "20px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 300px" }}>
          <Search
            size={18}
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
          />
          <input
            type="text"
            placeholder="Search by invited name, email, or token ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px 10px 40px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
              outline: "none",
              backgroundColor: "white",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              backgroundColor: "white",
              fontSize: "14px",
              color: "#334155",
              outline: "none",
            }}
          >
            <option value="ALL">All</option>
            <option value="ACTIVE">Active</option>
            <option value="USED">Used</option>
            <option value="EXPIRED">Expired</option>
            <option value="REVOKED">Revoked</option>
          </select>
        </div>
      </section>

      {/* Data Table */}
      <section>
        {loading ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              backgroundColor: "white",
              borderRadius: "12px",
              border: "1px solid #cbd5e1",
              color: "#64748b",
            }}
          >
            Loading invitation tokens...
          </div>
        ) : (
          <DataTable columns={columns} data={filteredTokens} />
        )}
      </section>
    </main>
  );
}

export default GeneratedTokens;

import React from "react";

function TokenStatusBadge({ status }) {
  const normalized = status ? status.toLowerCase() : "";

  const statusStyles = {
    active: { bg: "#dbeafe", color: "#1d4ed8", label: "ACTIVE" },
    used: { bg: "#e2e8f0", color: "#475569", label: "USED" },
    revoked: { bg: "#fee2e2", color: "#b91c1c", label: "REVOKED" },
    expired: { bg: "#ffedd5", color: "#ea580c", label: "EXPIRED" },
  };

  const fallback = { bg: "#f1f5f9", color: "#475569", label: status || "UNKNOWN" };
  const style = statusStyles[normalized] || fallback;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: "6px",
        backgroundColor: style.bg,
        color: style.color,
        fontSize: "12px",
        fontWeight: "600",
        letterSpacing: "0.5px",
        textTransform: "uppercase",
      }}
    >
      {style.label}
    </span>
  );
}

export default TokenStatusBadge;

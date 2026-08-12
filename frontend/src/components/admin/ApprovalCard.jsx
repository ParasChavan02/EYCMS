import StatusBadge from "./StatusBadge";

function ApprovalCard({ icon, type, title, requestedBy, date, status, onApprove, onReject }) {
  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        backgroundColor: "white",
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: "12px",
        alignItems: "center",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.08)";
        e.currentTarget.style.borderColor = "#cbd5e1";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "#e2e8f0";
      }}
    >
      <div
        style={{
          fontSize: "24px",
          width: "40px",
          height: "40px",
          borderRadius: "8px",
          backgroundColor: "#e0e7ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>

      <div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>
            {title}
          </h4>
          <span
            style={{
              padding: "2px 8px",
              backgroundColor: "#e0e7ff",
              color: "#0f5aff",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "600",
            }}
          >
            {type}
          </span>
        </div>
        <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#64748b" }}>
          Requested by: {requestedBy}
        </p>
        <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>{date}</p>
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {status === "Pending" ? (
          <>
            <button
              onClick={onApprove}
              style={{
                padding: "8px 12px",
                backgroundColor: "#dcfce7",
                color: "#166534",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#bbf7d0")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#dcfce7")}
            >
              ✓ Approve
            </button>
            <button
              onClick={onReject}
              style={{
                padding: "8px 12px",
                backgroundColor: "#fee2e2",
                color: "#991b1b",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#fecaca")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#fee2e2")}
            >
              ✗ Reject
            </button>
          </>
        ) : (
          <StatusBadge status={status} />
        )}
      </div>
    </div>
  );
}

export default ApprovalCard;

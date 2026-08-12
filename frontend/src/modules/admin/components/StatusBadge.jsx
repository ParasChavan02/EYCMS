function StatusBadge({ status, variant = "default" }) {
  const normalizedStatus = status ? status.toLowerCase() : "";

  const statusStyles = {
    pending: { bg: "#fef3c7", color: "#92400e", label: "Pending" },
    approved: { bg: "#dcfce7", color: "#166534", label: "Approved" },
    rejected: { bg: "#fee2e2", color: "#991b1b", label: "Rejected" },
    active: { bg: "#dbeafe", color: "#1d4ed8", label: "Active" },
    inactive: { bg: "#f3f4f6", color: "#4b5563", label: "Inactive" },
    completed: { bg: "#d1fae5", color: "#065f46", label: "Completed" },
    cancelled: { bg: "#fecaca", color: "#7f1d1d", label: "Cancelled" },
    
    // New Transaction and UC statuses
    draft: { bg: "#f1f5f9", color: "#475569", label: "Draft" },
    submitted: { bg: "#eff6ff", color: "#1e40af", label: "Submitted" },
    uc_submitted: { bg: "#eff6ff", color: "#1e40af", label: "UC Submitted" },
    finance_verified: { bg: "#ecfdf5", color: "#065f46", label: "Verified" },
    admin_approved: { bg: "#dcfce7", color: "#166534", label: "Approved" },
    revision_requested: { bg: "#fffbeb", color: "#b45309", label: "Revision Requested" },
    requested: { bg: "#fef3c7", color: "#92400e", label: "Requested" },
    template_granted: { bg: "#f5f3ff", color: "#5b21b6", label: "Template Granted" }
  };

  const fallback = { bg: "#f1f5f9", color: "#475569", label: status || "Unknown" };
  const style = statusStyles[normalizedStatus] || fallback;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "6px 12px",
        borderRadius: "6px",
        backgroundColor: style.bg,
        color: style.color,
        fontSize: "12px",
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}
    >
      {style.label}
    </span>
  );
}

export default StatusBadge;

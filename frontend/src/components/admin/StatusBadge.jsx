function StatusBadge({ status, variant = "default" }) {
  const statusStyles = {
    pending: { bg: "#fef3c7", color: "#92400e", label: "Pending" },
    approved: { bg: "#dcfce7", color: "#166534", label: "Approved" },
    rejected: { bg: "#fee2e2", color: "#991b1b", label: "Rejected" },
    active: { bg: "#dbeafe", color: "#1d4ed8", label: "Active" },
    inactive: { bg: "#f3f4f6", color: "#4b5563", label: "Inactive" },
    completed: { bg: "#d1fae5", color: "#065f46", label: "Completed" },
    cancelled: { bg: "#fecaca", color: "#7f1d1d", label: "Cancelled" },
  };

  const style = statusStyles[status] || statusStyles.default;

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
      {statusStyles[status]?.label || status}
    </span>
  );
}

export default StatusBadge;

import { Link } from "react-router-dom";

function AnalyticsCard({ icon, label, value, trend, color = "#0f5aff", to = null }) {
  const trendUp = trend && trend > 0;

  const content = (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        position: "relative",
        overflow: "hidden",
        display: "block",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: color,
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            backgroundColor: `${color}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
          }}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <span
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              backgroundColor: trendUp ? "#dcfce7" : "#fee2e2",
              color: trendUp ? "#166534" : "#991b1b",
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            {trendUp ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>

      <p
        style={{
          margin: "0 0 8px 0",
          fontSize: "12px",
          color: "#64748b",
          fontWeight: "600",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      <h3 style={{ margin: 0, fontSize: "28px", fontWeight: "700", color: "#0f172a" }}>{value}</h3>
    </div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }

  return content;
}

export default AnalyticsCard;

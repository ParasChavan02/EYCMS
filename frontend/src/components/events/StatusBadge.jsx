import "./event-components.css";

function StatusBadge({ status }) {
  const normalized = String(status || "Upcoming").toLowerCase();
  return <span className={`event-status-badge ${normalized}`}>{status || "Upcoming"}</span>;
}

export default StatusBadge;

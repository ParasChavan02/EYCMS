import { CalendarDays, MapPin } from "lucide-react";
import StatusBadge from "./StatusBadge";
import "./event-components.css";

function formatDate(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "-";
  const [hours = "00", minutes = "00"] = String(value).split(":");
  const parsed = new Date();
  parsed.setHours(Number(hours), Number(minutes), 0, 0);
  return parsed.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function EventCard({ event, onClick, compact = false }) {
  return (
    <button type="button" className="event-card" onClick={onClick} style={compact ? { padding: 14 } : undefined}>
      <div className="event-card__top">
        <div>
          <h3 className="event-card__title">{event.title}</h3>
          <div className="event-card__meta" style={{ marginTop: 6 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <CalendarDays size={14} />
              {formatDate(event.date)}
            </span>
            <span>{formatTime(event.time)}</span>
          </div>
        </div>
        <StatusBadge status={event.status} />
      </div>

      <div className="event-card__meta">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <MapPin size={14} />
          {event.venue}
        </span>
        <span className="event-pill">{event.type}</span>
      </div>
    </button>
  );
}

export default EventCard;

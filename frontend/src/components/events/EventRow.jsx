import { Eye, Pencil, Ban } from "lucide-react";
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

function EventRow({ event, adminMode, onView, onEdit, onCancel }) {
  return (
    <tr className="event-table-row">
      <td>{event.eventId}</td>
      <td>{event.title}</td>
      <td>{event.type}</td>
      <td>{formatDate(event.date)}</td>
      <td>{formatTime(event.time)}</td>
      <td>{event.venue}</td>
      <td>{event.coordinator}</td>
      <td>
        <StatusBadge status={event.status} />
      </td>
      <td>{event.createdBy}</td>
      <td>{formatDate(event.createdAt)}</td>
      <td>
        <div className="event-table-actions">
          <button type="button" className="event-icon-button" title="View" onClick={() => onView(event)}>
            <Eye size={15} />
          </button>
          {adminMode && (
            <>
              <button type="button" className="event-icon-button" title="Edit" onClick={() => onEdit(event)}>
                <Pencil size={15} />
              </button>
              <button type="button" className="event-icon-button danger" title="Cancel" onClick={() => onCancel(event)}>
                <Ban size={15} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default EventRow;

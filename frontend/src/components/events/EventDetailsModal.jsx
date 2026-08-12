import { useMemo } from "react";
import { useQuery } from "react-query";
import { CalendarDays, ClipboardList, Layers3, Loader2, Pencil, ShieldAlert, UserRound, X } from "lucide-react";
import Modal from "../../modules/common/components/Modal";
import { eventService } from "../../services/eventService";
import StatusBadge from "./StatusBadge";
import "./event-components.css";

function formatDate(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", {
    month: "long",
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

function Field({ label, value }) {
  return (
    <div className="event-details__field">
      <span className="event-details__field-label">{label}</span>
      <span className="event-details__field-value">{value || "-"}</span>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="event-details__section-title">
      <Icon size={18} />
      {title}
    </div>
  );
}

function EventDetailsModal({ eventId, visible, onClose, adminMode = false, onEdit, onCancel }) {
  const { data: event, isLoading, error } = useQuery(
    ["event-details", eventId],
    () => eventService.getEvent(eventId),
    {
      enabled: Boolean(visible && eventId),
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
    }
  );

  const cancelMeta = useMemo(() => {
    if (!event?.status || event.status !== "Cancelled") {
      return null;
    }

    return {
      by: event.cancelledBy || "-",
      at: event.cancelledAt ? formatDate(event.cancelledAt) : "-",
      reason: event.cancelReason || "No reason recorded.",
    };
  }, [event]);

  return (
    <Modal visible={visible} title="Event Details" onClose={onClose}>
      {isLoading ? (
        <div className="event-empty-state" style={{ justifyItems: "center" }}>
          <Loader2 size={20} className="spin" />
          <strong>Loading the latest event details...</strong>
        </div>
      ) : error ? (
        <div className="event-empty-state" style={{ justifyItems: "center" }}>
          <ShieldAlert size={20} />
          <strong>Could not load event details.</strong>
          <span>{error?.message || "Please try again."}</span>
        </div>
      ) : event ? (
        <div className="event-details">
          <div className="event-details__hero">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
              <h2 className="event-details__title">{event.title}</h2>
              <StatusBadge status={event.status} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <span className="event-pill">{event.type}</span>
              <span style={{ color: "#475569", fontWeight: 700 }}>{formatDate(event.date)}</span>
            </div>
          </div>

          <div className="event-details__sections">
            <section className="event-details__section">
              <SectionTitle icon={ClipboardList} title="Basic Information" />
              <div className="event-details__grid">
                <Field label="Event ID" value={event.eventId} />
                <Field label="Title" value={event.title} />
                <Field label="Type" value={event.type} />
                <Field label="Status" value={event.status} />
              </div>
            </section>

            <section className="event-details__section">
              <SectionTitle icon={CalendarDays} title="Schedule" />
              <div className="event-details__grid">
                <Field label="Date" value={formatDate(event.date)} />
                <Field label="Time" value={formatTime(event.time)} />
                <Field label="Venue" value={event.venue} />
                <Field label="Coordinator" value={event.coordinator} />
              </div>
            </section>

            <section className="event-details__section">
              <SectionTitle icon={Layers3} title="Description" />
              <div className="event-details__description">{event.description || "No description provided."}</div>
            </section>

            <section className="event-details__section">
              <SectionTitle icon={UserRound} title="Metadata" />
              <div className="event-details__grid">
                <Field label="Created By" value={event.createdBy} />
                <Field label="Created At" value={formatDate(event.createdAt)} />
                <Field label="Updated At" value={formatDate(event.updatedAt)} />
                {cancelMeta && <Field label="Cancelled At" value={cancelMeta.at} />}
              </div>
              {cancelMeta && (
                <div className="event-details__description" style={{ marginTop: 10 }}>
                  <strong>Cancellation</strong>
                  <div style={{ marginTop: 6 }}>
                    <div>By: {cancelMeta.by}</div>
                    <div>Reason: {cancelMeta.reason}</div>
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="event-details__actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close
            </button>
            {adminMode && (
              <>
                <button type="button" className="btn-primary" onClick={() => onEdit?.(event)}>
                  <Pencil size={16} style={{ marginRight: 8 }} />
                  Edit Event
                </button>
                <button type="button" className="btn-secondary" onClick={() => onCancel?.(event)}>
                  <X size={16} style={{ marginRight: 8 }} />
                  Cancel Event
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

export default EventDetailsModal;

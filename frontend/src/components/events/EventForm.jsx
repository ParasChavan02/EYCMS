import { useEffect, useState } from "react";
import StatusBadge from "./StatusBadge";
import "./event-components.css";

const EVENT_TYPES = ["Workshop", "Seminar", "Meeting", "Conference", "Training", "Review", "Other"];

const EMPTY_FORM = {
  event_id: "",
  title: "",
  type: "Workshop",
  date: "",
  time: "",
  venue: "",
  coordinator: "",
  description: "",
  status: "Upcoming",
};

function EventForm({ mode = "create", initialEvent = null, onSubmit, onCancel, isSubmitting = false }) {
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (initialEvent) {
      setFormData({
        event_id: initialEvent.eventId || "",
        title: initialEvent.title || "",
        type: initialEvent.type || "Workshop",
        date: initialEvent.date || "",
        time: initialEvent.time ? String(initialEvent.time).slice(0, 5) : "",
        venue: initialEvent.venue || "",
        coordinator: initialEvent.coordinator || "",
        description: initialEvent.description || "",
        status: initialEvent.status || "Upcoming",
      });
      return;
    }

    setFormData(EMPTY_FORM);
  }, [initialEvent, mode]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formData.title.trim() || !formData.type.trim() || !formData.date || !formData.time || !formData.venue.trim() || !formData.coordinator.trim()) {
      return;
    }
    onSubmit?.({
      event_id: formData.event_id.trim() || undefined,
      title: formData.title.trim(),
      type: formData.type,
      date: formData.date,
      time: formData.time,
      venue: formData.venue.trim(),
      coordinator: formData.coordinator.trim(),
      description: formData.description.trim() || undefined,
      status: mode === "edit" ? formData.status : "Upcoming",
    });
  };

  const readOnlyId = mode === "edit";

  return (
    <form onSubmit={handleSubmit} className="event-modal-stack">
      <div className="event-form-grid">
        <label className="form-group">
          <span className="form-label">Event ID</span>
          <input className={`form-input ${readOnlyId ? "event-form-readonly" : ""}`} name="event_id" value={formData.event_id} onChange={handleChange} placeholder="Leave blank for auto-generation" readOnly={readOnlyId} />
        </label>
        <label className="form-group">
          <span className="form-label">Title</span>
          <input className="form-input" name="title" value={formData.title} onChange={handleChange} placeholder="Leadership Workshop" />
        </label>
        <label className="form-group">
          <span className="form-label">Event Type</span>
          <select className="form-select" name="type" value={formData.type} onChange={handleChange}>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="event-form-grid">
        <label className="form-group">
          <span className="form-label">Date</span>
          <input className="form-input" type="date" name="date" value={formData.date} onChange={handleChange} />
        </label>
        <label className="form-group">
          <span className="form-label">Time</span>
          <input className="form-input" type="time" name="time" value={formData.time} onChange={handleChange} />
        </label>
        <label className="form-group">
          <span className="form-label">Venue</span>
          <input className="form-input" name="venue" value={formData.venue} onChange={handleChange} placeholder="Conference Hall" />
        </label>
      </div>

      <div className="event-form-grid">
        <label className="form-group">
          <span className="form-label">Coordinator</span>
          <input className="form-input" name="coordinator" value={formData.coordinator} onChange={handleChange} placeholder="Coordinator name" />
        </label>
        <label className="form-group">
          <span className="form-label">Status</span>
          <div style={{ display: "grid", gap: 8 }}>
            <StatusBadge status={mode === "edit" ? formData.status : "Upcoming"} />
            <small style={{ color: "#64748b" }}>Status is managed by event actions.</small>
          </div>
        </label>
      </div>

      <label className="form-group">
        <span className="form-label">Description</span>
        <textarea className="form-textarea" name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="Add event notes, agenda, or logistics." />
      </label>

      <div className="form-actions" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {mode === "edit" ? "Update Event" : "Create Event"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setFormData(EMPTY_FORM);
            onCancel?.();
          }}
        >
          Reset
        </button>
      </div>
    </form>
  );
}

export default EventForm;

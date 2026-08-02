import { useMemo, useState, useEffect } from "react";
import Modal from "../../common/components/Modal";
import { eventService } from "../../../services/eventService";
import "../../../styles/admin-management.css";

function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Form State
  const [form, setForm] = useState({
    eventId: "",
    title: "",
    type: "",
    eventDate: "",
    venue: "",
    coordinatorName: "",
    description: ""
  });
  const [message, setMessage] = useState(null);

  // Load events from backend
  const fetchEvents = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await eventService.adminGetEvents();
      setEvents(data || []);
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(() => {
      fetchEvents(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle Event Creation
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const payload = {
        event_id: form.eventId.trim() || null,
        title: form.title.trim(),
        type: form.type,
        event_date: new Date(form.eventDate).toISOString(),
        venue: form.venue.trim(),
        coordinator_name: form.coordinatorName.trim(),
        description: form.description.trim() || null
      };

      await eventService.adminCreateEvent(payload);
      setMessage({ type: "success", text: "Event scheduled successfully!" });
      
      // Reset form
      setForm({
        eventId: "",
        title: "",
        type: "",
        eventDate: "",
        venue: "",
        coordinatorName: "",
        description: ""
      });

      // Refetch events
      fetchEvents();
    } catch (err) {
      console.error("Error creating event:", err);
      const errorMsg = err.response?.data?.detail || "Failed to create event. Please check inputs.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Event Cancellation (Deletion)
  const handleCancelEvent = async (id) => {
    if (!window.confirm("Are you sure you want to cancel and delete this event? This action cannot be undone.")) {
      return;
    }

    try {
      await eventService.adminDeleteEvent(id);
      setMessage({ type: "success", text: "Event cancelled successfully!" });
      fetchEvents();
    } catch (err) {
      console.error("Error deleting event:", err);
      const errorMsg = err.response?.data?.detail || "Failed to cancel event.";
      setMessage({ type: "error", text: errorMsg });
    }
  };

  // Stats summary computed from active events
  const summary = useMemo(() => {
    const now = new Date();
    const upcoming = events.filter((event) => new Date(event.event_date) > now);
    const completed = events.filter((event) => new Date(event.event_date) <= now);
    return {
      total: events.length,
      upcoming: upcoming.length,
      completed: completed.length
    };
  }, [events]);

  const timelineEvents = useMemo(() => {
    const now = new Date();
    return [...events]
      .filter((event) => new Date(event.event_date) > now)
      .sort((a, b) => a.event_date.localeCompare(b.event_date))
      .slice(0, 5);
  }, [events]);

  const calendarDays = Array.from({ length: 30 }, (_, index) => index + 1);
  
  const eventDates = useMemo(() => {
    const now = new Date();
    const currentMonthEvents = events.filter((event) => {
      const d = new Date(event.event_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    return new Set(currentMonthEvents.map((event) => new Date(event.event_date).getDate()));
  }, [events]);

  // Date formatter helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <main className="admin-page">
      <section className="admin-header">
        <h1>Events Management</h1>
        <p>Schedule new events, manage current timelines, and cancel future events.</p>
      </section>

      {/* Stats Summary Grid */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Events</div>
          <div className="stat-value">{summary.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Upcoming Events</div>
          <div className="stat-value">{summary.upcoming}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed/Past Events</div>
          <div className="stat-value">{summary.completed}</div>
        </div>
      </section>

      {/* Creation form */}
      <section className="admin-card">
        <h2>Schedule New Event</h2>
        <form onSubmit={handleCreateEvent}>
          <div className="form-grid">
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Event ID (Optional)</label>
              <input
                type="text"
                placeholder="e.g. EVT001"
                value={form.eventId}
                onChange={(e) => setForm({ ...form, eventId: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Title *</label>
              <input
                type="text"
                placeholder="e.g. Startup Workshop"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Event Type *</label>
              <select
                required
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="">Select type...</option>
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Meeting">Meeting</option>
                <option value="Review">Review</option>
                <option value="Bootcamp">Bootcamp</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Date and Time *</label>
              <input
                type="datetime-local"
                required
                value={form.eventDate}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Venue *</label>
              <input
                type="text"
                placeholder="e.g. Auditorium"
                required
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Coordinator Name *</label>
              <input
                type="text"
                placeholder="e.g. Paras Chavan"
                required
                value={form.coordinatorName}
                onChange={(e) => setForm({ ...form, coordinatorName: e.target.value })}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Description</label>
            <textarea
              placeholder="Enter event details/description..."
              style={{
                padding: '12px',
                border: '1px solid #dbe2ea',
                borderRadius: '8px',
                fontSize: '14px',
                minHeight: '80px',
                fontFamily: 'inherit'
              }}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {message && (
            <div className={`form-message ${message.type}`} style={{ marginBottom: '16px' }}>
              {message.text}
            </div>
          )}

          <div className="form-actions">
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Scheduling..." : "Schedule Event"}
            </button>
          </div>
        </form>
      </section>

      {/* Dual panels: Upcoming timeline and calendar visualization */}
      <section className="dual-panel-grid">
        <div className="admin-card">
          <h2>Upcoming Events Timeline</h2>
          <div className="timeline-list">
            {timelineEvents.length > 0 ? (
              timelineEvents.map((event) => (
                <div key={event.id} className="timeline-item">
                  <div className="timeline-date">{formatDate(event.event_date)}</div>
                  <div className="timeline-copy">
                    <strong>{event.title}</strong>
                    <span>{event.venue}</span>
                  </div>
                  <span className="status-badge low">{event.type || "Event"}</span>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: '20px 0' }}>No upcoming events scheduled</div>
            )}
          </div>
        </div>

        <div className="admin-card">
          <h2>Event Calendar (Current Month)</h2>
          <div className="calendar-grid">
            {calendarDays.map((day) => (
              <div key={day} className={`calendar-cell ${eventDates.has(day) ? "active" : ""}`}>
                {day}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scheduled Events List (Admin View) */}
      <section className="admin-card">
        <h2>All Scheduled Events</h2>
        {loading ? (
          <div className="empty-state">Loading events...</div>
        ) : events.length > 0 ? (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Date & Time</th>
                  <th>Venue</th>
                  <th>Coordinator</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const isUpcoming = new Date(event.event_date) > new Date();
                  return (
                    <tr key={event.id}>
                      <td>{event.event_id || "N/A"}</td>
                      <td>{event.title}</td>
                      <td>{event.type || "N/A"}</td>
                      <td>{formatDate(event.event_date)}</td>
                      <td>{event.venue || "N/A"}</td>
                      <td>{event.coordinator_name || "N/A"}</td>
                      <td>
                        <span className={`status-badge ${isUpcoming ? "pending" : "approved"}`}>
                          {isUpcoming ? "Upcoming" : "Completed"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-sm" onClick={() => setSelectedEvent(event)}>
                            View
                          </button>
                          <button
                            className="btn-sm danger"
                            onClick={() => handleCancelEvent(event.id)}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state-card">
            <strong>No events scheduled</strong>
            <p>Create a new event using the form above to populate the schedules.</p>
          </div>
        )}
      </section>

      {/* Event Details Modal */}
      <Modal visible={Boolean(selectedEvent)} title={selectedEvent?.title || "Event Details"} onClose={() => setSelectedEvent(null)}>
        {selectedEvent && (
          <div className="detail-grid">
            <div className="detail-item">
              <span>Event ID</span>
              <strong>{selectedEvent.event_id || "N/A"}</strong>
            </div>
            <div className="detail-item">
              <span>Date & Time</span>
              <strong>{formatDate(selectedEvent.event_date)}</strong>
            </div>
            <div className="detail-item">
              <span>Type</span>
              <strong>{selectedEvent.type || "N/A"}</strong>
            </div>
            <div className="detail-item">
              <span>Coordinator</span>
              <strong>{selectedEvent.coordinator_name || "N/A"}</strong>
            </div>
            <div className="detail-item">
              <span>Venue</span>
              <strong>{selectedEvent.venue || "N/A"}</strong>
            </div>
            <div className="detail-item">
              <span>Status</span>
              <strong>
                {new Date(selectedEvent.event_date) > new Date() ? "Upcoming" : "Completed"}
              </strong>
            </div>
            <div className="detail-item detail-item-wide">
              <span>Description</span>
              <strong>{selectedEvent.description || "No description is mentioned by the admin"}</strong>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}

export default AdminEvents;
 
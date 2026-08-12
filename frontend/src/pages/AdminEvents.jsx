import { useMemo, useState } from "react";
import Modal from "../components/common/Modal";
import "../styles/admin-management.css";

function AdminEvents() {
  const [events] = useState([
    { id: "EVT001", title: "Startup Workshop", date: "2026-06-05", status: "Upcoming", priority: "High", coordinator: "Paras Chavan", participants: 45, venue: "Hall A", description: "Startup enablement session for regional teams." },
    { id: "EVT002", title: "Leadership Training", date: "2026-06-10", status: "Upcoming", priority: "Medium", coordinator: "Lakshay Jain", participants: 32, venue: "Conference Room", description: "Leadership bootcamp for department leads." },
    { id: "EVT003", title: "Budget Review", date: "2026-05-28", status: "Completed", priority: "High", coordinator: "Manas Pandya", participants: 18, venue: "Finance Board Room", description: "Monthly budget review and variance sign-off." },
    { id: "EVT004", title: "Technical Workshop", date: "2026-06-01", status: "Upcoming", priority: "Low", coordinator: "Priya Singh", participants: 28, venue: "Lab 2", description: "Hands-on workflow training for support teams." },
  ]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const summary = useMemo(
    () => ({
      upcoming: events.filter((event) => event.status === "Upcoming").length,
      completed: events.filter((event) => event.status === "Completed").length,
      participants: events.reduce((sum, event) => sum + event.participants, 0),
    }),
    [events]
  );

  const timelineEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const calendarDays = Array.from({ length: 30 }, (_, index) => index + 1);
  const eventDates = new Set(events.map((event) => Number(event.date.split("-")[2])));

  return (
    <main className="admin-page">
      <section className="admin-header">
        <h1>Events Management</h1>
        <p>Manage event timelines, scheduling, status distribution, and event-level details.</p>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Events</div>
          <div className="stat-value">{events.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Upcoming Events</div>
          <div className="stat-value">{summary.upcoming}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed Events</div>
          <div className="stat-value">{summary.completed}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Participants</div>
          <div className="stat-value">{summary.participants}</div>
        </div>
      </section>

      <section className="dual-panel-grid">
        <div className="admin-card">
          <h2>Upcoming Events Timeline</h2>
          <div className="timeline-list">
            {timelineEvents.map((event) => (
              <div key={event.id} className="timeline-item">
                <div className="timeline-date">{event.date}</div>
                <div className="timeline-copy">
                  <strong>{event.title}</strong>
                  <span>{event.venue}</span>
                </div>
                <span className={`status-badge ${event.priority.toLowerCase()}`}>{event.priority}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <h2>Event Calendar</h2>
          <div className="calendar-grid">
            {calendarDays.map((day) => (
              <div key={day} className={`calendar-cell ${eventDates.has(day) ? "active" : ""}`}>
                {day}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="admin-card">
        {events.length > 0 ? (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Coordinator</th>
                  <th>Participants</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>{event.id}</td>
                    <td>{event.title}</td>
                    <td>{event.date}</td>
                    <td>
                      <span className={`status-badge ${event.status === "Upcoming" ? "pending" : "approved"}`}>{event.status}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${event.priority.toLowerCase()}`}>{event.priority}</span>
                    </td>
                    <td>{event.coordinator}</td>
                    <td>{event.participants}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-sm" onClick={() => setSelectedEvent(event)}>
                          View
                        </button>
                        <button className="btn-sm">Edit</button>
                        <button className="btn-sm">Participants</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state-card">
            <strong>No events scheduled</strong>
            <p>Create a new event to populate the timeline, calendar, and activity dashboard.</p>
          </div>
        )}
      </section>

      <Modal visible={Boolean(selectedEvent)} title={selectedEvent?.title || "Event Details"} onClose={() => setSelectedEvent(null)}>
        {selectedEvent && (
          <div className="detail-grid">
            <div className="detail-item">
              <span>Event ID</span>
              <strong>{selectedEvent.id}</strong>
            </div>
            <div className="detail-item">
              <span>Date</span>
              <strong>{selectedEvent.date}</strong>
            </div>
            <div className="detail-item">
              <span>Coordinator</span>
              <strong>{selectedEvent.coordinator}</strong>
            </div>
            <div className="detail-item">
              <span>Venue</span>
              <strong>{selectedEvent.venue}</strong>
            </div>
            <div className="detail-item detail-item-wide">
              <span>Description</span>
              <strong>{selectedEvent.description}</strong>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}

export default AdminEvents;

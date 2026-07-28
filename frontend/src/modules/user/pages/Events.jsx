import { useState, useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { eventService } from "../../../services/eventService";
import { useAuth } from "../../common/hooks/useAuth";
import Modal from "../../common/components/Modal";
import "../../../styles/admin-management.css";
import "./user-erp.css";

function Events() {
  const { user } = useAuth();
  const userRole = user?.role?.toUpperCase();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchEvents = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await eventService.userGetEvents();
      setEvents(data || []);
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole !== "ACCOUNTS") {
      fetchEvents();
      const interval = setInterval(() => {
        fetchEvents(true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [userRole]);

  if (userRole === "ACCOUNTS") {
    return <Navigate to="/finance/dashboard" replace />;
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  const term = search.trim().toLowerCase();
  
  const filteredEvents = useMemo(() => {
    if (!term) return events;
    return events.filter((event) => {
      return (
        String(event.event_id || "").toLowerCase().includes(term) ||
        String(event.title || "").toLowerCase().includes(term) ||
        String(event.type || "").toLowerCase().includes(term) ||
        String(event.venue || "").toLowerCase().includes(term) ||
        String(event.coordinator_name || "").toLowerCase().includes(term)
      );
    });
  }, [events, term]);

  return (
    <main className="user-erp-page">
      <header className="user-erp-header">
        <h1>Events</h1>
        <p>Browse upcoming events and schedules.</p>
      </header>

      <section className="user-erp-card user-table-card">
        <input
          className="user-search-input"
          type="search"
          placeholder="Search Events..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div style={{ height: 24 }} />
        {loading ? (
          <div className="user-empty-cell" style={{ textAlign: "center", padding: "20px" }}>Loading events...</div>
        ) : (
          <div className="user-table-wrapper" style={{ overflowX: "auto" }}>
            <table className="user-table">
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
                {filteredEvents.map((event) => {
                  const isUpcoming = new Date(event.event_date) > new Date();
                  const tone = isUpcoming ? "review" : "completed";
                  const statusLabel = isUpcoming ? "Upcoming" : "Completed";
                  return (
                    <tr key={event.id}>
                      <td>{event.event_id || "N/A"}</td>
                      <td>{event.title}</td>
                      <td>{event.type || "N/A"}</td>
                      <td>{formatDate(event.event_date)}</td>
                      <td>{event.venue || "N/A"}</td>
                      <td>{event.coordinator_name || "N/A"}</td>
                      <td>
                        <span className={`user-status ${tone}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td>
                        <button
                          className="user-action-button"
                          style={{
                            minHeight: "32px",
                            padding: "0 12px",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#ffffff",
                            border: "1px solid #cfd9e8"
                          }}
                          onClick={() => setSelectedEvent(event)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan="8" className="user-empty-cell" style={{ textAlign: "center" }}>
                      No events found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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

export default Events;
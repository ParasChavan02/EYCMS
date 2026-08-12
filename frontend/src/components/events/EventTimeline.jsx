import "./eventTimeline.css";

function EventTimeline({ events }) {
  const getUpcomingEvents = () => {
    return events
      .filter((e) => e.status === "Upcoming" || e.status === "Ongoing")
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 5);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getEventTypeIcon = (type) => {
    const icons = {
      Meeting: "📞",
      Workshop: "🎓",
      Presentation: "📊",
      Training: "📚",
      Seminar: "🎤",
      Conference: "🏢",
    };
    return icons[type] || "📅";
  };

  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="event-timeline-card">
      <div className="timeline-header">
        <h3 className="timeline-title">📅 Upcoming Events Timeline</h3>
        <span className="timeline-badge">{upcomingEvents.length} events</span>
      </div>

      <div className="timeline-container">
        {upcomingEvents.length > 0 ? (
          <div className="timeline-list">
            {upcomingEvents.map((event, index) => (
              <div key={event.id} className="timeline-item">
                <div className="timeline-marker">
                  <div className="marker-dot"></div>
                  {index < upcomingEvents.length - 1 && <div className="marker-line"></div>}
                </div>

                <div className="timeline-content">
                  <div className="event-header-timeline">
                    <span className="event-type-icon">{getEventTypeIcon(event.eventType)}</span>
                    <h4 className="event-title-timeline">{event.title}</h4>
                    <span className="event-date-timeline">{formatDate(event.startDate)}</span>
                  </div>

                  <div className="event-details-timeline">
                    <p className="detail-item">
                      <strong>Project:</strong> {event.projectId}
                    </p>
                    {event.coordinator && (
                      <p className="detail-item">
                        <strong>Coordinator:</strong> {event.coordinator}
                      </p>
                    )}
                    {event.location && (
                      <p className="detail-item">
                        <strong>Location:</strong> {event.location}
                      </p>
                    )}
                  </div>

                  <div className="event-status-badge">
                    <span
                      className={`status-badge ${
                        event.status === "Ongoing"
                          ? "status-ongoing"
                          : "status-upcoming"
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="timeline-empty">
            <p>No upcoming events scheduled</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventTimeline;

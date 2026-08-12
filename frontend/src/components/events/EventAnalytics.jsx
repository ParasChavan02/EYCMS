import "./eventAnalytics.css";

function EventAnalytics({ events }) {
  const calculateMetrics = () => {
    const totalEvents = events.length;
    const upcoming = events.filter((e) => e.status === "Upcoming").length;
    const completed = events.filter((e) => e.status === "Completed").length;
    const ongoing = events.filter((e) => e.status === "Ongoing").length;

    return { totalEvents, upcoming, completed, ongoing };
  };

  const metrics = calculateMetrics();

  return (
    <div className="event-analytics">
      <div className="analytics-card">
        <div className="analytics-header">
          <span className="analytics-icon">📊</span>
          <span className="analytics-label">Total Events</span>
        </div>
        <div className="analytics-value">{metrics.totalEvents}</div>
        <div className="analytics-trend">All time</div>
      </div>

      <div className="analytics-card">
        <div className="analytics-header">
          <span className="analytics-icon">⏰</span>
          <span className="analytics-label">Upcoming Events</span>
        </div>
        <div className="analytics-value">{metrics.upcoming}</div>
        <div className="analytics-trend">Scheduled</div>
      </div>

      <div className="analytics-card">
        <div className="analytics-header">
          <span className="analytics-icon">✅</span>
          <span className="analytics-label">Completed Events</span>
        </div>
        <div className="analytics-value">{metrics.completed}</div>
        <div className="analytics-trend">Successfully completed</div>
      </div>

      <div className="analytics-card">
        <div className="analytics-header">
          <span className="analytics-icon">🔄</span>
          <span className="analytics-label">Ongoing Events</span>
        </div>
        <div className="analytics-value">{metrics.ongoing}</div>
        <div className="analytics-trend">In progress</div>
      </div>
    </div>
  );
}

export default EventAnalytics;

import { useState } from "react";
import "./eventsTable.css";

function EventsTable({ events, onDelete, onEdit }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.projectId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "All" || event.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Upcoming":
        return "badge-upcoming";
      case "Ongoing":
        return "badge-ongoing";
      case "Completed":
        return "badge-completed";
      case "Cancelled":
        return "badge-cancelled";
      default:
        return "badge-upcoming";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "priority-high";
      case "Medium":
        return "priority-medium";
      case "Low":
        return "priority-low";
      default:
        return "priority-medium";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="events-table-card">
      <div className="table-header">
        <h3 className="table-title">📋 All Events</h3>
        <div className="table-controls">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option>All</option>
            <option>Upcoming</option>
            <option>Ongoing</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="events-table">
          <thead>
            <tr>
              <th>Event ID</th>
              <th>Title</th>
              <th>Project</th>
              <th>Budget Head</th>
              <th>Coordinator</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEvents.length > 0 ? (
              paginatedEvents.map((event) => (
                <tr key={event.id} className="table-row">
                  <td className="cell-id">#{event.id}</td>
                  <td className="cell-title">
                    <strong>{event.title}</strong>
                  </td>
                  <td className="cell-project">{event.projectId}</td>
                  <td className="cell-budget">{event.budgetHeadId || "—"}</td>
                  <td className="cell-coordinator">{event.coordinator || "—"}</td>
                  <td className="cell-date">{formatDate(event.startDate)}</td>
                  <td className="cell-date">{formatDate(event.endDate)}</td>
                  <td className="cell-status">
                    <span className={`badge ${getStatusBadgeColor(event.status)}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="cell-priority">
                    <span className={`chip ${getPriorityColor(event.priority)}`}>
                      {event.priority}
                    </span>
                  </td>
                  <td className="cell-actions">
                    <button className="action-btn view-btn" title="View">
                      👁️
                    </button>
                    <button
                      className="action-btn edit-btn"
                      onClick={() => onEdit(event)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => onDelete(event.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="no-data">
                  No events found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="table-pagination">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            ← Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default EventsTable;

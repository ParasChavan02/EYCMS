import { useState } from "react";
import "../../user/pages/user-erp.css";

const events = [
  { id: "EVT001", title: "Startup Workshop", type: "Workshop", project: "PRJ001", date: "2026-05-28", venue: "Auditorium", coordinator: "Paras Chavan", status: "Approved", tone: "approved" },
  { id: "EVT002", title: "Induction Program", type: "Seminar", project: "PRJ003", date: "2026-05-12", venue: "Seminar hall", coordinator: "Lakshay Jain", status: "Completed", tone: "completed" },
  { id: "EVT003", title: "Leadership Workshop", type: "Workshop", project: "PRJ007", date: "2026-06-04", venue: "Conference Hall", coordinator: "Manas Pandya", status: "Upcoming", tone: "review" },
  { id: "EVT004", title: "Finance Review", type: "Review", project: "PRJ011", date: "2026-06-10", venue: "Board Room", coordinator: "Priya Singh", status: "Assigned", tone: "assigned" },
];

function Events() {
  const [search, setSearch] = useState("");
  const term = search.trim().toLowerCase();
  const filteredEvents = term
    ? events.filter((event) => Object.values(event).some((value) => String(value).toLowerCase().includes(term)))
    : events;

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
        <div style={{ height: 42 }} />
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Type</th>
              <th>Project</th>
              <th>Date</th>
              <th>Venue</th>
              <th>Coordinator</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map((event) => (
              <tr key={event.id}>
                <td>{event.id}</td>
                <td>{event.title}</td>
                <td>{event.type}</td>
                <td>{event.project}</td>
                <td>{event.date}</td>
                <td>{event.venue}</td>
                <td>{event.coordinator}</td>
                <td><span className={`user-status ${event.tone}`}>{event.status}</span></td>
              </tr>
            ))}
            {filteredEvents.length === 0 && (
              <tr>
                <td colSpan="8" className="user-empty-cell">No events match your search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}

export default Events;

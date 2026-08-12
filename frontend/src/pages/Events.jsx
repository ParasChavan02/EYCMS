import { useState, useEffect } from "react";
import EventForm from "../components/events/EventForm";
import EventsTable from "../components/events/EventsTable";
import EventAnalytics from "../components/events/EventAnalytics";
import EventTimeline from "../components/events/EventTimeline";
import "./events.css";

function Events() {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");

  // Load events from localStorage on mount
  useEffect(() => {
    const savedEvents = localStorage.getItem("events");
    if (savedEvents) {
      try {
        setEvents(JSON.parse(savedEvents));
      } catch (error) {
        console.error("Error loading events:", error);
      }
    }
  }, []);

  // Save events to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("events", JSON.stringify(events));
  }, [events]);

  const handleEventCreated = (newEvent) => {
    if (editingEvent) {
      setEvents((prev) =>
        prev.map((e) => (e.id === editingEvent.id ? { ...newEvent, id: editingEvent.id } : e))
      );
      setEditingEvent(null);
    } else {
      setEvents((prev) => [
        { ...newEvent, id: Date.now(), createdDate: new Date().toISOString() },
        ...prev,
      ]);
    }
    setShowForm(false);
  };

  const handleDeleteEvent = (eventId) => {
    if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  // Filter events based on search, status, and priority
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.projectId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "All" || event.status === filterStatus;
    const matchesPriority = filterPriority === "All" || event.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="events-page">
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <h1 className="page-title">📅 Events Management</h1>
            <div className="breadcrumb">
              <span>Home</span>
              <span className="separator">/</span>
              <span>Events</span>
            </div>
          </div>
          <button
            className="btn-primary-lg"
            onClick={() => {
              setEditingEvent(null);
              setShowForm(true);
            }}
          >
            + Add Event
          </button>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="events-toolbar">
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Search events by title, project, or location..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="filter-controls">
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              className="filter-select"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="All">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* ANALYTICS SECTION */}
      <EventAnalytics events={filteredEvents} />

      {/* MAIN CONTENT */}
      <div className="events-container">
        {/* CREATE EVENT FORM */}
        {showForm && (
          <EventForm
            onEventCreated={handleEventCreated}
            onCancel={handleCancelForm}
            editingEvent={editingEvent}
          />
        )}

        {/* EVENTS TABLE */}
        <EventsTable
          events={filteredEvents}
          onDelete={handleDeleteEvent}
          onEdit={handleEditEvent}
          totalEvents={events.length}
        />

        {/* EVENTS TIMELINE */}
        <EventTimeline events={filteredEvents} />
      </div>
    </div>
  );
}

export default Events;

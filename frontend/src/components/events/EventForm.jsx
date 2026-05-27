import { useState, useEffect } from "react";
import "../../../public/common.css";
import "./eventForm.css";

function EventForm({ onEventCreated, onCancel, editingEvent }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectId: "",
    budgetHeadId: "",
    eventType: "Meeting",
    startDate: "",
    endDate: "",
    location: "",
    coordinator: "",
    priority: "Medium",
    status: "Upcoming",
  });

  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  // Load event data if editing
  useEffect(() => {
    if (editingEvent) {
      setFormData({
        title: editingEvent.title || "",
        description: editingEvent.description || "",
        projectId: editingEvent.projectId || "",
        budgetHeadId: editingEvent.budgetHeadId || "",
        eventType: editingEvent.eventType || "Meeting",
        startDate: editingEvent.startDate || "",
        endDate: editingEvent.endDate || "",
        location: editingEvent.location || "",
        coordinator: editingEvent.coordinator || "",
        priority: editingEvent.priority || "Medium",
        status: editingEvent.status || "Upcoming",
      });
    }
  }, [editingEvent]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Event title is required";
    }

    if (!formData.projectId.trim()) {
      newErrors.projectId = "Project ID is required";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
      newErrors.endDate = "End date must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("");

    if (!validateForm()) {
      setMessage("error: Please fix the errors in the form");
      return;
    }

    onEventCreated(formData);
    
    if (!editingEvent) {
      resetForm();
      setMessage("success: Event created successfully!");
    } else {
      setMessage("success: Event updated successfully!");
    }
    
    setTimeout(() => setMessage(""), 3000);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      projectId: "",
      budgetHeadId: "",
      eventType: "Meeting",
      startDate: "",
      endDate: "",
      location: "",
      coordinator: "",
      priority: "Medium",
      status: "Upcoming",
    });
    setErrors({});
  };

  const handleCancel = () => {
    resetForm();
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="event-form-card">
      <div className="form-header">
        <h2 className="form-title">📅 Create New Event</h2>
        <p className="form-subtitle">Add and schedule a new event</p>
      </div>

      <form onSubmit={handleSubmit} className="event-form">
        <div className="form-grid-3">
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Event Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Project Kickoff Meeting"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="eventType" className="form-label">
              Event Type
            </label>
            <select
              id="eventType"
              name="eventType"
              value={formData.eventType}
              onChange={handleChange}
              className="form-select"
            >
              <option>Meeting</option>
              <option>Workshop</option>
              <option>Presentation</option>
              <option>Training</option>
              <option>Seminar</option>
              <option>Conference</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority" className="form-label">
              Priority Level
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="form-select"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label htmlFor="projectId" className="form-label">
              Project ID *
            </label>
            <input
              type="text"
              id="projectId"
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              placeholder="e.g., PRJ-001"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="budgetHeadId" className="form-label">
              Budget Head ID
            </label>
            <input
              type="text"
              id="budgetHeadId"
              name="budgetHeadId"
              value={formData.budgetHeadId}
              onChange={handleChange}
              placeholder="e.g., BH-005"
              className="form-input"
            />
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label htmlFor="startDate" className="form-label">
              Start Date *
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate" className="form-label">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label htmlFor="location" className="form-label">
              Event Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Conference Room A"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="coordinator" className="form-label">
              Assigned Coordinator
            </label>
            <input
              type="text"
              id="coordinator"
              name="coordinator"
              value={formData.coordinator}
              onChange={handleChange}
              placeholder="e.g., John Doe"
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Event details and description..."
            className="form-textarea"
            rows="4"
          />
        </div>

        {message && (
          <div className={`form-message ${message.startsWith("success") ? "success" : "error"}`}>
            {message.replace("success: ", "").replace("error: ", "")}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            ✅ Create Event
          </button>
          <button type="button" onClick={handleReset} className="btn-secondary">
            ↻ Reset Form
          </button>
        </div>
      </form>
    </div>
  );
}

export default EventForm;

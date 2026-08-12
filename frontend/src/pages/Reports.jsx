import { useMemo, useState } from "react";
import "../styles/reports.css";

function Reports() {

  /*
    CURRENT POV:
    Logged in as ADMIN
  */

  const currentUser = {
    role: "ADMIN",
    name: "Manas Pandya",
  };

  const isAdmin =
    currentUser.role === "ADMIN";

  const [activeTab, setActiveTab] =
    useState("events");

  const [eventForm, setEventForm] =
    useState({
      title: "",
      description: "",
      projectId: "",
      eventDate: "",
      venue: "",
      coordinator: "",
      eventType: "Workshop",
      status: "Pending",
    });

  const [events, setEvents] =
    useState([
      {
        id: "EVT001",
        title: "Startup Workshop",
        description:
          "Entrepreneurship awareness session",
        project: "PRJ001",
        eventDate: "2026-05-28",
        venue: "Auditorium",
        coordinator: "Paras Chavan",
        eventType: "Workshop",
        status: "Approved",
      },
            {
        id: "EVT002",
        title: "Induction Program",
        description:
          "Entrepreneurship awareness session",
        project: "PRJ003",
        eventDate: "2026-05-12",
        venue: "Seminar hall",
        coordinator: "Lakshay Jain",
        eventType: "Seminar",
        status: "Completed",
      },
    ]);

  const [search, setSearch] =
    useState("");

  const [notification, setNotification] =
    useState("");

  const [reportFile, setReportFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [supportFiles, setSupportFiles] = useState([]);
  const [uploadMessage, setUploadMessage] = useState("");

  const handleEventChange = (event) => {

    const { name, value } = event.target;

    setEventForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleReportFile = (event) => {
    setReportFile(event.target.files[0] || null);
  };

  const handleImageFiles = (event) => {
    setImageFiles(Array.from(event.target.files));
  };

  const handleSupportFiles = (event) => {
    setSupportFiles(Array.from(event.target.files));
  };

  const uploadMaterials = () => {
    if (!reportFile && imageFiles.length === 0 && supportFiles.length === 0) {
      setUploadMessage("Please select files to upload.");
      return;
    }

    setUploadMessage(
      `Selected: ${reportFile ? reportFile.name : "No report"}, ${imageFiles.length} image(s), ${supportFiles.length} supporting document(s).`
    );
  };

  const createEvent = () => {

    if (
      !eventForm.title ||
      !eventForm.projectId ||
      !eventForm.eventDate
    ) {
      setNotification(
        "Please fill all required fields."
      );

      return;
    }

    const newEvent = {
      id: `EVT${String(
        events.length + 1
      ).padStart(3, "0")}`,

      title: eventForm.title,

      description:
        eventForm.description,

      project:
        eventForm.projectId,

      eventDate:
        eventForm.eventDate,

      venue: eventForm.venue,

      coordinator:
        eventForm.coordinator,

      eventType:
        eventForm.eventType,

      status:
        eventForm.status,
    };

    setEvents((current) => [
      ...current,
      newEvent,
    ]);

    setEventForm({
      title: "",
      description: "",
      projectId: "",
      eventDate: "",
      venue: "",
      coordinator: "",
      eventType: "Workshop",
      status: "Pending",
    });

    setNotification(
      "Event created successfully."
    );
  };

  const deleteEvent = (id) => {

    setEvents((current) =>
      current.filter(
        (event) => event.id !== id
      )
    );

    setNotification(
      "Event deleted successfully."
    );
  };

  const generateApproval = () => {

    setNotification(
      "Approval letter generated successfully."
    );
  };

  const filteredEvents = useMemo(() => {

    return events.filter((event) =>
      event.title
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  }, [events, search]);

  return (
    <main className="page page-reports">

      {/* HEADER */}

      <section className="reports-header">

        <div>

          <h1>Events & Reports</h1>

          <p>
            Manage ERP events,
            workflows, and approvals.
          </p>

        </div>

      </section>

      {/* TABS */}

      <section className="card">

        <div className="tab-row">

          <button
            type="button"
            className={
              activeTab === "events"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("events")
            }
          >
            Events
          </button>

          <button
            type="button"
            className={
              activeTab === "reports"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("reports")
            }
          >
            Reports
          </button>

        </div>

      </section>

      {/* EVENTS SECTION */}

      {activeTab === "events" && (

        <>
          {/* ADMIN FORM */}

          {isAdmin && (

            <section className="card">

              <div className="section-title">

                <h2>Create Event</h2>

              </div>

              <div className="grid2">

                <input
                  name="title"
                  value={eventForm.title}
                  onChange={handleEventChange}
                  placeholder="Event Title"
                />

                {/* EVENT TYPE */}

                <select
                  name="eventType"
                  value={eventForm.eventType}
                  onChange={handleEventChange}
                >

                  <option>
                    Workshop
                  </option>

                  <option>
                    Seminar
                  </option>

                  <option>
                    Hackathon
                  </option>

                  <option>
                    Training
                  </option>

                  <option>
                    Conference
                  </option>

                </select>

                <input
                  name="description"
                  value={eventForm.description}
                  onChange={handleEventChange}
                  placeholder="Description"
                />

                <input
                  name="projectId"
                  value={eventForm.projectId}
                  onChange={handleEventChange}
                  placeholder="Project ID"
                />

                {/* EVENT DATE */}

                <input
                  type="date"
                  name="eventDate"
                  value={eventForm.eventDate}
                  onChange={handleEventChange}
                />

                <input
                  name="venue"
                  value={eventForm.venue}
                  onChange={handleEventChange}
                  placeholder="Venue"
                />

                <input
                  name="coordinator"
                  value={eventForm.coordinator}
                  onChange={handleEventChange}
                  placeholder="Coordinator Name"
                />

                {/* STATUS */}

                <select
                  name="status"
                  value={eventForm.status}
                  onChange={handleEventChange}
                >

                  <option>
                    Pending
                  </option>

                  <option>
                    Approved
                  </option>

                  <option>
                    Completed
                  </option>

                  <option>
                    Cancelled
                  </option>

                </select>

              </div>

              <div className="row">

                <button
                  type="button"
                  onClick={createEvent}
                >
                  Create Event
                </button>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={generateApproval}
                >
                  Generate Event Approval
                </button>

              </div>

              {notification && (

                <div className="form-note">
                  {notification}
                </div>

              )}

            </section>

          )}

          {/* EVENTS TABLE */}

          <section className="card">

            <div className="table-actions">

              <input
                type="text"
                placeholder="Search Events..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

            </div>

            <div className="table-wrapper">

              <table className="events-table">

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

                    {isAdmin && (
                      <th>Actions</th>
                    )}

                  </tr>

                </thead>

                <tbody>

                  {filteredEvents.length > 0 ? (

                    filteredEvents.map((event) => (

                      <tr key={event.id}>

                        <td>{event.id}</td>

                        <td>{event.title}</td>

                        <td>
                          {event.eventType}
                        </td>

                        <td>{event.project}</td>

                        <td>
                          {event.eventDate}
                        </td>

                        <td>{event.venue}</td>

                        <td>
                          {event.coordinator}
                        </td>

                        <td>

                          <span
                            className={`status-badge ${event.status.toLowerCase()}`}
                          >
                            {event.status}
                          </span>

                        </td>

                        {isAdmin && (

                          <td>

                            <div className="action-buttons">

                              <button className="small-btn">
                                View
                              </button>

                              <button
                                className="small-btn danger-btn"
                                onClick={() =>
                                  deleteEvent(event.id)
                                }
                              >
                                Delete
                              </button>

                            </div>

                          </td>

                        )}

                      </tr>

                    ))

                  ) : (

                    <tr>

                      <td
                        colSpan={
                          isAdmin ? 9 : 8
                        }
                      >
                        No events found.
                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          </section>
        </>
      )}

      {activeTab === "reports" && (
        <section className="card">
          <div className="section-title">
            <h2>Report Upload Center</h2>
            <p>
              Upload project reports, event images,
              and supporting documents in separate sections.
            </p>
          </div>

          <div className="upload-grid">
            <div className="upload-card">
              <h3>Upload Project Report</h3>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleReportFile}
              />
              <p className="upload-help">
                Accepted formats: PDF, DOC, DOCX.
              </p>
              {reportFile && (
                <div className="upload-details">
                  Selected: {reportFile.name}
                </div>
              )}
            </div>

            <div className="upload-card">
              <h3>Upload Event Images</h3>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageFiles}
              />
              <p className="upload-help">
                Upload multiple event images.
              </p>
              {imageFiles.length > 0 && (
                <div className="upload-details">
                  {imageFiles.length} image(s) selected
                </div>
              )}
            </div>

            <div className="upload-card">
              <h3>Upload Supporting Documents</h3>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xlsx,.pptx"
                multiple
                onChange={handleSupportFiles}
              />
              <p className="upload-help">
                Add supporting files for the event or report.
              </p>
              {supportFiles.length > 0 && (
                <div className="upload-details">
                  {supportFiles.length} document(s) selected
                </div>
              )}
            </div>
          </div>

          <div className="row">
            <button type="button" onClick={uploadMaterials}>
              Save Upload Selection
            </button>
          </div>

          {uploadMessage && (
            <div className="form-note">
              {uploadMessage}
            </div>
          )}
        </section>
      )}

    </main>
  );
}

export default Reports;

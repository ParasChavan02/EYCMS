import { useState } from "react";

function Reports() {
  const [activeTab, setActiveTab] = useState("events");
  const [eventForm, setEventForm] = useState({ title: "", description: "", projectId: "", headId: "" });
  const [events, setEvents] = useState([]);
  const [templateForm, setTemplateForm] = useState({ name: "UC Basic Template", type: "UC", json: "{\"sections\":[{\"title\":\"Grant Summary\"}]}" , html: "<h1>{{ project_name }}</h1><p>Total spent: {{ total_spent }}</p>" });
  const [placeholders, setPlaceholders] = useState([]);
  const [previewHtml, setPreviewHtml] = useState("");

  const handleEventChange = (event) => {
    const { name, value } = event.target;
    setEventForm((current) => ({ ...current, [name]: value }));
  };

  const createEvent = () => {
    setEvents((current) => [...current, { id: current.length + 1, title: eventForm.title || "New event", project: eventForm.projectId, head: eventForm.headId, start: new Date().toISOString().slice(0, 10) }]);
    setEventForm({ title: "", description: "", projectId: "", headId: "" });
  };

  const savePlaceholder = () => {
    setPlaceholders((current) => [...current, { id: current.length + 1, name: `Placeholder ${current.length + 1}` }]);
  };

  const generateReport = () => {
    setPreviewHtml(`<div><h2>${templateForm.name}</h2><p>Generated report preview</p></div>`);
  };

  return (
    <main className="page page-reports">
      <section className="card">
        <h2>Events & Reports</h2>
        <div className="tab-row">
          <button type="button" className={activeTab === "events" ? "active" : ""} onClick={() => setActiveTab("events")}>Events</button>
          <button type="button" className={activeTab === "reports" ? "active" : ""} onClick={() => setActiveTab("reports")}>Reports</button>
        </div>

        {activeTab === "events" ? (
          <div className="subview active">
            <div className="grid2">
              <input name="title" value={eventForm.title} onChange={handleEventChange} placeholder="Event title" />
              <input name="description" value={eventForm.description} onChange={handleEventChange} placeholder="Description" />
              <input name="projectId" value={eventForm.projectId} onChange={handleEventChange} placeholder="Project ID" />
              <input name="headId" value={eventForm.headId} onChange={handleEventChange} placeholder="Budget Head ID" />
            </div>
            <div className="row">
              <button type="button" onClick={createEvent}>Create Event</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Project</th>
                  <th>Budget Head</th>
                  <th>Start</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>{event.id}</td>
                    <td>{event.title}</td>
                    <td>{event.project}</td>
                    <td>{event.head}</td>
                    <td>{event.start}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="subview active">
            <h3>Template & Builder</h3>
            <div className="grid2">
              <input name="name" value={templateForm.name} onChange={(event) => setTemplateForm((current) => ({ ...current, name: event.target.value }))} placeholder="Template name" />
              <select name="type" value={templateForm.type} onChange={(event) => setTemplateForm((current) => ({ ...current, type: event.target.value }))}>
                <option>UC</option>
                <option>SoE</option>
                <option>PriorApproval</option>
                <option>EventReport</option>
                <option>Newsletter</option>
              </select>
            </div>
            <textarea value={templateForm.json} rows={4} onChange={(event) => setTemplateForm((current) => ({ ...current, json: event.target.value }))} />
            <textarea value={templateForm.html} rows={4} onChange={(event) => setTemplateForm((current) => ({ ...current, html: event.target.value }))} />
            <div className="row">
              <button type="button" onClick={savePlaceholder}>Save Placeholder</button>
              <button type="button" onClick={generateReport}>Generate</button>
            </div>
            <div className="form-note">Saved placeholders: {placeholders.length}</div>
            <div className="report-preview" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        )}
      </section>
    </main>
  );
}

export default Reports;

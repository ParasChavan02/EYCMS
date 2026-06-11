import { useState } from "react";
import "./user-erp.css";

function FeatureRequests() {
  const [mode, setMode] = useState("request");
  const requests = [
    { title: "Dark Mode Theme", status: "Under Review", votes: 24, date: "2024-01-10", tone: "review" },
    { title: "Export to Excel", status: "Approved", votes: 18, date: "2024-01-08", tone: "approved" },
    { title: "Mobile App", status: "In Development", votes: 45, date: "2024-01-05", tone: "progress" },
  ];

  return (
    <main className="user-erp-page">
      <div className="user-feature-layout">
        <header className="user-erp-header">
          <h1>Feature Requests</h1>
          <p>Suggest new features and track their status</p>
        </header>

        <div className="user-feature-tabs">
          <button type="button" className={mode === "request" ? "active" : ""} onClick={() => setMode("request")}>
            Request a Feature
          </button>
          <button type="button" className={mode === "browse" ? "active" : ""} onClick={() => setMode("browse")}>
            Browse Requests
          </button>
        </div>

        {mode === "request" ? (
          <section className="user-erp-card user-feature-card">
            <label className="user-form-field">
              <span>Feature Title *</span>
              <input type="text" placeholder="Brief title for the feature" />
            </label>
            <label className="user-form-field">
              <span>Problem Statement *</span>
              <textarea placeholder="Describe the current problem or limitation" />
            </label>
            <label className="user-form-field">
              <span>Proposed Solution *</span>
              <textarea placeholder="How would you like this feature to work?" />
            </label>
            <label className="user-form-field">
              <span>Expected Benefit *</span>
              <textarea placeholder="What benefits would this feature bring?" />
            </label>
            <button className="user-primary-button" type="button">Submit Feature Request</button>
          </section>
        ) : (
          <section className="user-erp-card user-feature-card">
            <div className="user-list">
              {requests.map((request) => (
                <div className="user-list-row" key={request.title}>
                  <div>
                    <strong>{request.title}</strong>
                    <p>{request.votes} upvotes&nbsp;&nbsp; {request.date}</p>
                  </div>
                  <span className={`user-status ${request.tone}`}>{request.status}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default FeatureRequests;

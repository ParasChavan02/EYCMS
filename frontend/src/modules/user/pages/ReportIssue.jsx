import { useState } from "react";
import "./user-erp.css";

function ReportIssue() {
  const [files, setFiles] = useState({ screenshot: null, attachments: [] });

  const handleFileChange = (event) => {
    const { name, files: selectedFiles } = event.target;
    setFiles((current) => ({
      ...current,
      [name]: name === "attachments" ? Array.from(selectedFiles) : selectedFiles[0],
    }));
  };

  return (
    <main className="user-erp-page">
      <div className="user-support-layout">
        <header className="user-erp-header">
          <h1>Report an Issue</h1>
          <p>Help us improve by reporting any issues you encounter</p>
        </header>

        <section className="user-erp-card">
          <form className="user-form-grid">
            <label className="user-form-field">
              <span>Issue Title *</span>
              <input type="text" placeholder="Brief title of the issue" />
            </label>
            <label className="user-form-field">
              <span>Category *</span>
              <select defaultValue="">
                <option value="" disabled>Select category</option>
                <option>Account</option>
                <option>Reports</option>
                <option>Events</option>
                <option>Support</option>
              </select>
            </label>
            <label className="user-form-field">
              <span>Priority</span>
              <select defaultValue="Medium">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </label>
            <label className="user-form-field wide">
              <span>Description *</span>
              <textarea placeholder="Describe the issue in detail" />
            </label>
            <div className="user-form-field wide">
              <span>Screenshot</span>
              <label className="user-upload-box">
                <input type="file" name="screenshot" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} />
                <div>
                  <strong>{files.screenshot?.name || "Click to upload or drag and drop"}</strong>
                  <br />
                  <span>JPG, PNG, PDF up to 5MB</span>
                </div>
              </label>
            </div>
            <div className="user-form-field wide">
              <span>Additional Attachments</span>
              <label className="user-upload-box">
                <input type="file" name="attachments" accept=".jpg,.jpeg,.png,.pdf" multiple onChange={handleFileChange} />
                <div>
                  <strong>
                    {files.attachments.length
                      ? `${files.attachments.length} file${files.attachments.length > 1 ? "s" : ""} selected`
                      : "Click to upload multiple files"}
                  </strong>
                  <br />
                  <span>JPG, PNG, PDF up to 5MB each</span>
                </div>
              </label>
            </div>
            <button className="user-primary-button" type="button">Submit Issue</button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default ReportIssue;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../common/hooks/useNotification";
import { ticketService } from "../../../services/support/ticketService";
import "./user-erp.css";

function ReportIssue() {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState({ screenshot: null, attachments: [] });

  const handleFileChange = (event) => {
    const { name, files: selectedFiles } = event.target;
    setFiles((current) => ({
      ...current,
      [name]: name === "attachments" ? Array.from(selectedFiles) : selectedFiles[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !category.trim() || !description.trim()) {
      addNotification("Please fill in all required fields (*).", "error", 1800, false);
      return;
    }

    setIsSubmitting(true);
    try {
      const screenshotPath = files.screenshot ? `/uploads/support/${files.screenshot.name}` : null;
      await ticketService.createTicket(
        title, 
        description, 
        category, 
        priority, 
        screenshotPath
      );
      
      addNotification("Support issue successfully reported to admin!", "success", 1800, false);
      navigate("/my-tickets");
    } catch (err) {
      console.error(err);
      addNotification("Failed to submit support issue. Please try again.", "error", 1800, false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="user-erp-page">
      <div className="user-support-layout">
        <header className="user-erp-header">
          <h1>Report an Issue</h1>
          <p>Help us improve by reporting any issues you encounter</p>
        </header>

        <section className="user-erp-card">
          <form className="user-form-grid" onSubmit={handleSubmit}>
            <label className="user-form-field">
              <span>Issue Title *</span>
              <input 
                type="text" 
                placeholder="Brief title of the issue" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
              />
            </label>
            <label className="user-form-field">
              <span>Category *</span>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                required
              >
                <option value="" disabled>Select category</option>
                <option value="Account">Account</option>
                <option value="Reports">Reports</option>
                <option value="Events">Events</option>
                <option value="Support">Support</option>
                <option value="Finance">Finance</option>
              </select>
            </label>
            <label className="user-form-field">
              <span>Priority</span>
              <select 
                value={priority} 
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </label>
            <label className="user-form-field wide">
              <span>Description *</span>
              <textarea 
                placeholder="Describe the issue in detail" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                required 
              />
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
            <button 
              className="user-primary-button" 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Issue"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default ReportIssue;

import { useState, useEffect } from "react";
import { useNotification } from "../../common/hooks/useNotification";
import { featureRequestService } from "../../../services/support/ticketService";
import { Loader2 } from "lucide-react";
import "./user-erp.css";

function FeatureRequests() {
  const { addNotification } = useNotification();
  const [mode, setMode] = useState("request");
  
  const [title, setTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [benefit, setBenefit] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const [requests, setRequests] = useState([]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await featureRequestService.getAllRequests();
      setRequests(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !problem.trim() || !solution.trim() || !benefit.trim()) {
      addNotification("Please fill in all required fields (*).", "error", 1800, false);
      return;
    }

    setIsSubmitting(true);
    try {
      const description = `Problem: ${problem}\nSolution: ${solution}`;
      await featureRequestService.createRequest(title, description, benefit);
      
      addNotification("Feature request successfully sent to admin!", "success", 1800, false);

      setTitle("");
      setProblem("");
      setSolution("");
      setBenefit("");
      setMode("browse");
      await loadRequests();
    } catch (err) {
      console.error(err);
      addNotification("Failed to submit feature request.", "error", 1800, false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTone = (status) => {
    switch (status) {
      case "Approved": return "approved";
      case "In Progress": return "progress";
      case "Completed": return "approved";
      case "Rejected": return "rejected";
      default: return "review";
    }
  };

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
          <button type="button" className={mode === "browse" ? "active" : ""} onClick={() => { setMode("browse"); loadRequests(); }}>
            Browse Requests ({requests.length})
          </button>
        </div>

        {mode === "request" ? (
          <section className="user-erp-card user-feature-card">
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
              <label className="user-form-field">
                <span>Feature Title *</span>
                <input 
                  type="text" 
                  placeholder="Brief title for the feature" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </label>
              <label className="user-form-field">
                <span>Problem Statement *</span>
                <textarea 
                  placeholder="Describe the current problem or limitation" 
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  required
                />
              </label>
              <label className="user-form-field">
                <span>Proposed Solution *</span>
                <textarea 
                  placeholder="How would you like this feature to work?" 
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  required
                />
              </label>
              <label className="user-form-field">
                <span>Expected Benefit *</span>
                <textarea 
                  placeholder="What benefits would this feature bring?" 
                  value={benefit}
                  onChange={(e) => setBenefit(e.target.value)}
                  required
                />
              </label>
              <button className="user-primary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Feature Request"}
              </button>
            </form>
          </section>
        ) : (
          <section className="user-erp-card user-feature-card">
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "30px 0" }}>
                <Loader2 className="animate-spin" size={28} color="#1d5cff" />
              </div>
            ) : (
              <div className="user-list">
                {requests.length > 0 ? (
                  requests.map((request) => (
                    <div className="user-list-row" key={request.id || request.requestId}>
                      <div>
                        <strong>{request.title}</strong>
                        <p>
                          {request.votes} upvotes&nbsp;&nbsp;
                          {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : ""}
                          {request.requestedBy?.name ? ` • by ${request.requestedBy.name}` : ""}
                        </p>
                        <p style={{ fontSize: "0.83rem", color: "#64748b", marginTop: "4px" }}>
                          {request.description}
                        </p>
                      </div>
                      <span className={`user-status ${getTone(request.status)}`}>{request.status}</span>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#64748b", textAlign: "center", padding: "20px 0" }}>No feature requests submitted yet.</p>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

export default FeatureRequests;

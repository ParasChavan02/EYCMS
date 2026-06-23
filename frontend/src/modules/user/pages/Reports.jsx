import { useEffect, useState } from "react";
import { Download, FileCheck2, Info, UploadCloud } from "lucide-react";
import { useNotification } from "../../common/hooks/useNotification";
import "./user-erp.css";

function Reports() {
  const { addNotification } = useNotification();
  const [ucStatus, setUcStatus] = useState(() => localStorage.getItem("uc_status") || "NOT_REQUESTED");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      setUcStatus(localStorage.getItem("uc_status") || "NOT_REQUESTED");
    };
    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUCSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      addNotification("Please select a completed UC file to upload.", "error", 3000, false);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      localStorage.setItem("uc_status", "SUBMITTED");
      localStorage.setItem("uc_submitted_file", selectedFile.name);
      localStorage.setItem("uc_submitted_date", new Date().toLocaleString());
      setUcStatus("SUBMITTED");
      setIsSubmitting(false);
      addNotification("Utilization Certificate uploaded and submitted successfully.", "success", 3000, false);
    }, 1200);
  };

  const handleReupload = () => {
    localStorage.setItem("uc_status", "TEMPLATE_UPLOADED");
    setUcStatus("TEMPLATE_UPLOADED");
    setSelectedFile(null);
  };

  const uploadBlocks = [
    { title: "Upload Project Report", hint: "Accepted formats: PDF, DOC, DOCX.", multiple: false },
    { title: "Upload Event Images", hint: "Upload multiple event images for the gallery.", multiple: true },
    { title: "Upload Supporting Documents", hint: "Add approval letters, attendance sheets, certificates.", multiple: true },
    { title: "Upload Bills", hint: "Travel, food, printing, and equipment bills.", multiple: true },
  ];

  return (
    <main className="user-erp-page">
      <header className="user-erp-header">
        <h1>Reports</h1>
        <p>Event documentation and reporting center.</p>
      </header>

      <div style={{ display: "grid", gap: "24px" }}>
        {/* Main Report Upload Center */}
        <section className="user-erp-card">
          <h2>Report Upload Center</h2>
          <p>Upload project reports, event images, supporting documents, and bills.</p>
          <div className="user-form-grid" style={{ marginTop: 26 }}>
            {uploadBlocks.map((block) => (
              <label className="user-form-field" key={block.title}>
                <span>{block.title}</span>
                <input type="file" multiple={block.multiple} />
                <p>{block.hint}</p>
              </label>
            ))}
          </div>
          <button className="user-primary-button" type="button" style={{ marginTop: "20px" }} onClick={() => addNotification("Upload selection saved successfully.", "success", 3000)}>
            Save Upload Selection
          </button>
        </section>

        {/* Utilization Certificate (UC) Section */}
        <section className="user-erp-card">
          <h2>Utilization Certificate (UC) Submission</h2>
          <p>Fill out and submit the provided UC template to report fund utilization.</p>

          <div style={{ marginTop: 26 }}>
            {/* Status alerts */}
            {(ucStatus === "NOT_REQUESTED" || ucStatus === "REQUESTED") && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "12px", padding: "16px 20px", color: "#b45309", fontSize: "0.95rem", marginBottom: "20px" }}>
                <Info size={20} strokeWidth={2} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Awaiting UC Template:</strong> You must request the UC template from the admin first. Go to the <strong>Transactions & Budgets</strong> page to request it.
                </span>
              </div>
            )}

            {ucStatus === "TEMPLATE_UPLOADED" && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "16px 20px", color: "#16a34a", fontSize: "0.95rem", marginBottom: "20px" }}>
                <Info size={20} strokeWidth={2} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Template Available:</strong> The admin has provided the template. Download it using the link below, fill it out, upload it, and click submit.
                </span>
              </div>
            )}

            {ucStatus === "SUBMITTED" && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f0f5ff", border: "1px solid #1d5cff", borderRadius: "12px", padding: "16px 20px", color: "#0f4ad8", fontSize: "0.95rem", marginBottom: "20px" }}>
                <FileCheck2 size={20} strokeWidth={2} style={{ flexShrink: 0 }} />
                <span>
                  <strong>UC Submitted:</strong> Your filled certificate has been uploaded and is under review.
                </span>
              </div>
            )}

            <form onSubmit={handleUCSubmit} className="user-form-grid" style={{ gridTemplateColumns: "1fr" }}>
              <div className="user-form-field">
                <span>Completed Utilization Certificate (UC)</span>
                
                {ucStatus === "TEMPLATE_UPLOADED" && (
                  <div style={{ marginBottom: "12px" }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); addNotification("UC Template PDF download started.", "success", 2000); }} style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#1d5cff", textDecoration: "none", fontWeight: "700", fontSize: "0.9rem" }}>
                      <Download size={16} />
                      Download UC Template PDF
                    </a>
                  </div>
                )}

                <div className="user-upload-box" style={{ opacity: (ucStatus === "NOT_REQUESTED" || ucStatus === "REQUESTED") ? 0.6 : 1, pointerEvents: (ucStatus === "NOT_REQUESTED" || ucStatus === "REQUESTED") ? "none" : "auto" }}>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    disabled={ucStatus === "NOT_REQUESTED" || ucStatus === "REQUESTED" || ucStatus === "SUBMITTED"}
                  />
                  <div style={{ padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <UploadCloud size={32} style={{ color: "#9ca3af" }} />
                    {selectedFile ? (
                      <strong style={{ color: "#304761" }}>{selectedFile.name}</strong>
                    ) : ucStatus === "SUBMITTED" ? (
                      <strong style={{ color: "#16a34a" }}>
                        Submitted File: {localStorage.getItem("uc_submitted_file") || "Utilization_Certificate.pdf"}
                      </strong>
                    ) : (
                      <span style={{ color: "#6b7280" }}>
                        {(ucStatus === "NOT_REQUESTED" || ucStatus === "REQUESTED") 
                          ? "Awaiting Admin template to unlock upload..." 
                          : "Drag & drop or click to upload filled UC document"}
                      </span>
                    )}
                    <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Accepted formats: PDF, DOC, DOCX up to 10MB</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                {ucStatus === "TEMPLATE_UPLOADED" && (
                  <button className="user-primary-button" type="submit" disabled={isSubmitting || !selectedFile} style={{ display: "inline-flex", alignItems: "center", gap: "8px", minHeight: "44px", background: "linear-gradient(135deg, #1d5cff, #0f46d8)" }}>
                    {isSubmitting ? "Submitting..." : "Submit Utilization Certificate"}
                  </button>
                )}

                {ucStatus === "SUBMITTED" && (
                  <button className="user-secondary-button" type="button" onClick={handleReupload} style={{ display: "inline-flex", alignItems: "center", gap: "8px", minHeight: "44px", color: "#b45309", border: "1px solid #b45309" }}>
                    Re-upload UC Document
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Reports;

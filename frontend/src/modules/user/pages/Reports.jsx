import "./user-erp.css";

function Reports() {
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
        <button className="user-primary-button" type="button">Save Upload Selection</button>
      </section>
    </main>
  );
}

export default Reports;

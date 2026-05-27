import { useState, useEffect } from "react";
import ReportFilters from "../components/reports/ReportFilters";
import ReportsTable from "../components/reports/ReportsTable";
import ReportAnalytics from "../components/reports/ReportAnalytics";
import ReportHistory from "../components/reports/ReportHistory";
import "./reports.css";

function Reports() {
  const [reports, setReports] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState({});

  useEffect(() => {
    const savedReports = localStorage.getItem("reports");
    if (savedReports) {
      setReports(JSON.parse(savedReports));
    } else {
      // Initialize with sample data
      const sampleReports = [
        {
          id: "RPT-001",
          name: "UC Basic Template Report",
          department: "Finance",
          generatedBy: "Admin",
          createdDate: new Date().toISOString(),
          status: "Generated",
          reportType: "UC",
          exportType: "PDF",
        },
        {
          id: "RPT-002",
          name: "Statement of Expenditure Q1",
          department: "Operations",
          generatedBy: "Manager",
          createdDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: "Generated",
          reportType: "SoE",
          exportType: "CSV",
        },
      ];
      setReports(sampleReports);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("reports", JSON.stringify(reports));
  }, [reports]);

  const handleApplyFilters = (filters) => {
    setAppliedFilters(filters);
  };

  const handleGenerateReport = () => {
    const newReport = {
      id: `RPT-${String(reports.length + 1).padStart(3, "0")}`,
      name: "New Report - " + new Date().toLocaleDateString(),
      department: appliedFilters.department || "General",
      generatedBy: "Current User",
      createdDate: new Date().toISOString(),
      status: "Generated",
      reportType: appliedFilters.reportType || "General",
      exportType: "PDF",
    };
    setReports((prev) => [newReport, ...prev]);
  };

  const handleDeleteReport = (reportId) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    }
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1 className="page-title">Reports Management</h1>
        <div className="breadcrumb">
          <span>Home</span>
          <span className="separator">/</span>
          <span>Reports</span>
        </div>
      </div>

      <div className="reports-container">
        <ReportAnalytics reports={reports} />

        <div className="reports-main">
          <ReportFilters onApplyFilters={handleApplyFilters} />

          <div className="generation-actions">
            <button onClick={handleGenerateReport} className="btn-generate">
              📊 Generate Report
            </button>
            <button className="btn-export-pdf">
              📥 Export PDF
            </button>
            <button className="btn-export-csv">
              📥 Export CSV
            </button>
          </div>

          <ReportsTable reports={reports} onDelete={handleDeleteReport} />

          <ReportHistory reports={reports} />
        </div>
      </div>
    </div>
  );
}

export default Reports;

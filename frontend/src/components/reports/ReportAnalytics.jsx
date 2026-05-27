import "./reportAnalytics.css";

function ReportAnalytics({ reports }) {
  const calculateMetrics = () => {
    const totalReports = reports.length;
    const generated = reports.filter((r) => r.status === "Generated").length;
    const pending = reports.filter((r) => r.status === "Pending").length;
    const failed = reports.filter((r) => r.status === "Failed").length;

    return { totalReports, generated, pending, failed };
  };

  const metrics = calculateMetrics();

  return (
    <div className="report-analytics">
      <div className="analytics-card">
        <div className="analytics-header">
          <span className="analytics-icon">📊</span>
          <span className="analytics-label">Total Reports</span>
        </div>
        <div className="analytics-value">{metrics.totalReports}</div>
        <div className="analytics-trend">All time</div>
      </div>

      <div className="analytics-card">
        <div className="analytics-header">
          <span className="analytics-icon">✅</span>
          <span className="analytics-label">Generated Reports</span>
        </div>
        <div className="analytics-value">{metrics.generated}</div>
        <div className="analytics-trend">Ready to use</div>
      </div>

      <div className="analytics-card">
        <div className="analytics-header">
          <span className="analytics-icon">⏳</span>
          <span className="analytics-label">Pending Reports</span>
        </div>
        <div className="analytics-value">{metrics.pending}</div>
        <div className="analytics-trend">In progress</div>
      </div>

      <div className="analytics-card">
        <div className="analytics-header">
          <span className="analytics-icon">❌</span>
          <span className="analytics-label">Failed Reports</span>
        </div>
        <div className="analytics-value">{metrics.failed}</div>
        <div className="analytics-trend">Need attention</div>
      </div>
    </div>
  );
}

export default ReportAnalytics;

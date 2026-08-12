import "./financeCard.css";

function FinanceCard({ head, sanctioned, spent, remaining, percent }) {
  const status = percent <= 50 ? "healthy" : percent <= 80 ? "warning" : "critical";
  const statusLabel = {
    healthy: "✓ Healthy",
    warning: "⚠ Warning",
    critical: "❌ Critical",
  };

  return (
    <div className={`finance-card finance-${status}`}>
      <div className="card-header">
        <div className="card-title">{head}</div>
        <div className={`card-status status-${status}`}>
          {statusLabel[status]}
        </div>
      </div>

      <div className="card-metrics">
        <div className="metric-row">
          <span className="metric-label">Sanctioned</span>
          <span className="metric-value">${(sanctioned / 1000).toFixed(0)}K</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Spent</span>
          <span className="metric-value">${(spent / 1000).toFixed(0)}K</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Remaining</span>
          <span className="metric-value">${(remaining / 1000).toFixed(0)}K</span>
        </div>
      </div>

      <div className="card-progress">
        <div className="progress-bar-container">
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${percent}%` }}></div>
          </div>
          <div className="progress-text">{percent}% Used</div>
        </div>
      </div>
    </div>
  );
}

export default FinanceCard;

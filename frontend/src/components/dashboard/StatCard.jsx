import "./dashboardCard.css";

function StatCard({ icon, label, value, change, color = "primary" }) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <p className="stat-label">{label}</p>
        <h3 className="stat-value">{value}</h3>
        {change && (
          <p className={`stat-change ${change.trend === 'up' ? 'positive' : 'negative'}`}>
            {change.trend === 'up' ? '↑' : '↓'} {change.value} from last month
          </p>
        )}
      </div>
    </div>
  );
}

export default StatCard;

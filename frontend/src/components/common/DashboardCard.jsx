function DashboardCard({ title, value, description }) {
  return (
    <div className="dashboard-card">
      <strong>{title}</strong>
      <div className="dashboard-card__value">{value}</div>
      <p>{description}</p>
    </div>
  )
}

export default DashboardCard

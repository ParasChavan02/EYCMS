export default function DashboardCards({ totalBudget, totalGrants, totalExpenses, remainingBalance }) {
  const cards = [
    {
      label: "Total Budget",
      value: `₹${totalBudget.toLocaleString("en-IN")}`,
      icon: "💼",
      accent: "#2563eb",
      iconBg: "#eff6ff",
      trend: "FY 2026",
    },
    {
      label: "Total Grants",
      value: `₹${totalGrants.toLocaleString("en-IN")}`,
      icon: "🏛️",
      accent: "#9333ea",
      iconBg: "#fdf4ff",
      trend: "Released this period",
    },
    {
      label: "Total Expenses",
      value: `₹${totalExpenses.toLocaleString("en-IN")}`,
      icon: "📊",
      accent: "#d97706",
      iconBg: "#fffbeb",
      trend: "Incurred so far",
    },
    {
      label: "Remaining Balance",
      value: `₹${remainingBalance.toLocaleString("en-IN")}`,
      icon: "🏦",
      accent: remainingBalance < 0 ? "#dc2626" : "#16a34a",
      iconBg: remainingBalance < 0 ? "#fef2f2" : "#f0fdf4",
      trend: remainingBalance < 0 ? "Over budget!" : "Available balance",
    },
  ];

  return (
    <div className="fin-kpi-grid">
      {cards.map((k, i) => (
        <div
          key={i}
          className="fin-kpi-card"
          style={{ "--accent": k.accent, "--icon-bg": k.iconBg }}
        >
          <div className="fin-kpi-icon">{k.icon}</div>
          <div className="fin-kpi-label">{k.label}</div>
          <div className="fin-kpi-value">{k.value}</div>
          <div className="fin-kpi-trend">{k.trend}</div>
        </div>
      ))}
    </div>
  );
}
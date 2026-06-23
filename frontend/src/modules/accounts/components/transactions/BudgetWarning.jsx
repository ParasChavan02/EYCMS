function BudgetWarning({ limit, used }) {
  const percent = limit ? Math.round((used / limit) * 100) : 0

  return (
    <div className="budget-warning">
      <strong>Budget usage</strong>
      <p>{used} of {limit} used ({percent}%)</p>
    </div>
  )
}

export default BudgetWarning
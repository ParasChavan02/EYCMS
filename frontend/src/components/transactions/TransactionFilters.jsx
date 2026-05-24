function TransactionFilters({ filters, onChange }) {
  return (
    <div className="transaction-filters">
      <label>
        Search
        <input type="text" name="search" value={filters.search} onChange={onChange} />
      </label>
      <label>
        Category
        <select name="category" value={filters.category} onChange={onChange}>
          <option value="">All</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </label>
    </div>
  )
}

export default TransactionFilters

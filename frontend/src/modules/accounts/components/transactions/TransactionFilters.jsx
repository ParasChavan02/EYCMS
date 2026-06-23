export default function TransactionFilters({ search, setSearch, viewOnly }) {
  return (
    <div className="fin-card fin-section">
      <div className="fin-card-header">
        <div>
          <div className="fin-card-title">Search Transactions</div>
          <div className="fin-card-subtitle">Filter by voucher, type or budget head</div>
        </div>
      </div>
      <div className="fin-card-body">
        <div className="fin-search-row" style={{ marginBottom: 0 }}>
          <div className="fin-search">
            <span className="fin-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by voucher number, type or budget head..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
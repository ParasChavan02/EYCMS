const statusMap = {
  Completed: "badge-success",
  Pending: "badge-warning",
  Failed: "badge-danger",
};

const typeColors = {
  "Grant Release": { bg: "#f0fdf4", color: "#16a34a" },
  "Expense": { bg: "#fffbeb", color: "#d97706" },
  "Bill Payment": { bg: "#eff6ff", color: "#2563eb" },
  "Refund": { bg: "#ecfeff", color: "#0891b2" },
  "Transfer": { bg: "#fdf4ff", color: "#9333ea" },
};

export default function TransactionTable({ transactions, viewOnly }) {
  return (
    <div className="fin-card fin-section">
      <div className="fin-card-header">
        <div>
          <div className="fin-card-title">Transaction Records</div>
          <div className="fin-card-subtitle">{transactions.length} transactions found</div>
        </div>
      </div>
      <div className="fin-card-body">
        {transactions.length === 0 ? (
          <div className="fin-empty">No transactions match your search criteria.</div>
        ) : (
          <div className="fin-table-wrap">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Voucher No.</th>
                  <th>Type</th>
                  <th>Budget Head</th>
                  <th>Debit Account</th>
                  <th>Credit Account</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => {
                  const tc = typeColors[t.type] || { bg: "#f1f5f9", color: "#475569" };
                  return (
                    <tr key={t.id}>
                      <td className="mono">{t.date}</td>
                      <td className="mono bold" style={{ fontSize: 12 }}>{t.voucher}</td>
                      <td>
                        <span
                          className="fin-badge"
                          style={{ background: tc.bg, color: tc.color }}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="bold">{t.budgetHead}</td>
                      <td>{t.debit}</td>
                      <td>{t.credit}</td>
                      <td className="bold mono">₹{t.amount.toLocaleString("en-IN")}</td>
                      <td>
                        <span className={`fin-badge ${statusMap[t.status] || "badge-info"}`}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-3)", fontSize: 13 }}>{t.remarks}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
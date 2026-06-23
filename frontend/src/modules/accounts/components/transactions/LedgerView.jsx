export default function LedgerView({ transactions }) {
  const totalDebit = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalCredit = transactions.reduce((sum, t) => sum + t.amount, 0);
  const balance = totalCredit - totalDebit;

  return (
    <div className="fin-card fin-section">
      <div className="fin-card-header">
        <div>
          <div className="fin-card-title">Ledger View</div>
          <div className="fin-card-subtitle">Double-entry summary of all transactions</div>
        </div>
      </div>
      <div className="fin-card-body">
        {/* Summary row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 20,
        }}>
          {[
            { label: "Total Debit", value: totalDebit, color: "var(--danger)" },
            { label: "Total Credit", value: totalCredit, color: "var(--success)" },
            { label: "Net Balance", value: Math.abs(balance), color: "var(--primary)" },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-sm)",
                padding: "16px 20px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 6 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>
                ₹{s.value.toLocaleString("en-IN")}
              </div>
            </div>
          ))}
        </div>

        {/* Ledger table */}
        <div className="fin-table-wrap">
          <table className="fin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Voucher</th>
                <th>Particulars</th>
                <th>Debit (₹)</th>
                <th>Credit (₹)</th>
                <th>Balance (₹)</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                let running = 0;
                return transactions.map((t) => {
                  running += t.amount;
                  return (
                    <tr key={t.id}>
                      <td className="mono">{t.date}</td>
                      <td className="mono" style={{ fontSize: 12 }}>{t.voucher}</td>
                      <td className="bold">{t.budgetHead}</td>
                      <td className="mono" style={{ color: "var(--danger)", fontWeight: 600 }}>
                        {t.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="mono" style={{ color: "var(--success)", fontWeight: 600 }}>
                        {t.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="mono bold">
                        {running.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
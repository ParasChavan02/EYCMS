import { useState } from "react";

const defaultForm = {
  date: "",
  type: "Expense",
  budgetHead: "",
  debit: "",
  credit: "",
  amount: "",
  status: "Pending",
  remarks: "",
};

export default function TransactionForm({ addTransaction }) {
  const [form, setForm] = useState(defaultForm);
  const [open, setOpen] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.date || !form.budgetHead || !form.amount) return;
    addTransaction(form);
    setForm(defaultForm);
    setOpen(false);
  };

  return (
    <div className="fin-card fin-section">
      <div className="fin-card-header">
        <div>
          <div className="fin-card-title">Add Transaction</div>
          <div className="fin-card-subtitle">Record a new financial transaction</div>
        </div>
        <button
          className="fin-btn fin-btn-primary"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "✕ Close" : "+ New Transaction"}
        </button>
      </div>

      {open && (
        <div className="fin-card-body">
          <form onSubmit={handleSubmit}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "16px",
              marginBottom: 20,
            }}>
              {[
                { label: "Date", name: "date", type: "date" },
                { label: "Budget Head", name: "budgetHead", type: "text", placeholder: "e.g. Operations" },
                { label: "Debit Account", name: "debit", type: "text", placeholder: "e.g. Bank Account" },
                { label: "Credit Account", name: "credit", type: "text", placeholder: "e.g. Vendor Account" },
                { label: "Amount (₹)", name: "amount", type: "number", placeholder: "Enter amount" },
                { label: "Remarks", name: "remarks", type: "text", placeholder: "Optional note" },
              ].map((f) => (
                <div key={f.name} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                    {f.label}
                  </label>
                  <input
                    name={f.name}
                    type={f.type}
                    placeholder={f.placeholder || ""}
                    value={form[f.name]}
                    onChange={handleChange}
                    style={{
                      padding: "9px 14px",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      fontFamily: "var(--font)",
                      fontSize: 13.5,
                      color: "var(--text-1)",
                      background: "var(--surface)",
                      outline: "none",
                      transition: "var(--transition)",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--primary)";
                      e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--border)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              ))}

              {/* Type select */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                  Type
                </label>
                <select name="type" value={form.type} onChange={handleChange} className="fin-select" style={{ padding: "9px 14px" }}>
                  <option>Expense</option>
                  <option>Grant Release</option>
                  <option>Bill Payment</option>
                  <option>Refund</option>
                  <option>Transfer</option>
                </select>
              </div>

              {/* Status select */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                  Status
                </label>
                <select name="status" value={form.status} onChange={handleChange} className="fin-select" style={{ padding: "9px 14px" }}>
                  <option>Pending</option>
                  <option>Completed</option>
                  <option>Failed</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" className="fin-btn fin-btn-primary">✓ Save Transaction</button>
              <button type="button" className="fin-btn fin-btn-ghost" onClick={() => { setForm(defaultForm); setOpen(false); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
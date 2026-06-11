import { useMemo, useState } from "react";
import "../styles/admin-management.css";

function AdminTransactions() {
  const [form, setForm] = useState({
    budgetHead: "",
    amount: "",
    description: "",
    date: "",
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [message, setMessage] = useState("");

  const [transactions, setTransactions] = useState([
    { id: "TXN001", head: "Travel", amount: 50000, description: "Domestic Travel", date: "2026-05-30", status: "Approved", approvedBy: "Manas Pandya" },
    { id: "TXN002", head: "Equipment", amount: 75000, description: "Laptop Purchase", date: "2026-05-29", status: "Pending", approvedBy: "-" },
    { id: "TXN003", head: "Supplies", amount: 30000, description: "Office Supplies", date: "2026-05-28", status: "Approved", approvedBy: "Manas Pandya" },
    { id: "TXN004", head: "Training", amount: 120000, description: "Staff Training Program", date: "2026-05-27", status: "Rejected", approvedBy: "Manas Pandya" },
    { id: "TXN005", head: "Maintenance", amount: 45000, description: "Building Maintenance", date: "2026-05-26", status: "Pending", approvedBy: "-" },
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const createTransaction = () => {
    setMessage("");
    if (!form.budgetHead || !form.amount || !form.description || !form.date) {
      setMessage("❌ Please fill all required fields");
      return;
    }

    const newTxn = {
      id: `TXN${String(transactions.length + 1).padStart(3, "0")}`,
      head: form.budgetHead,
      amount: parseInt(form.amount),
      description: form.description,
      date: form.date,
      status: "Pending",
      approvedBy: "-",
    };

    setTransactions([...transactions, newTxn]);
    setForm({ budgetHead: "", amount: "", description: "", date: "" });
    setMessage("✅ Transaction created successfully");
  };

  const approveTransaction = (id) => {
    setTransactions(
      transactions.map((t) =>
        t.id === id ? { ...t, status: "Approved", approvedBy: "You" } : t
      )
    );
    setMessage("✅ Transaction approved");
  };

  const rejectTransaction = (id) => {
    setTransactions(
      transactions.map((t) =>
        t.id === id ? { ...t, status: "Rejected", approvedBy: "You" } : t
      )
    );
    setMessage("✅ Transaction rejected");
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const matchesSearch =
        txn.id.toLowerCase().includes(search.toLowerCase()) ||
        txn.head.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" ? true : txn.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [transactions, search, statusFilter]);

  return (
    <main className="admin-page">
      <section className="admin-header">
        <h1>💳 Transactions Management</h1>
        <p>Create, approve, and manage financial transactions</p>
      </section>

      {/* CREATE TRANSACTION */}
      <section className="admin-card">
        <h2>Create New Transaction</h2>
        <div className="form-grid">
          <select name="budgetHead" value={form.budgetHead} onChange={handleChange}>
            <option value="">Select Budget Head</option>
            <option value="Travel">Travel</option>
            <option value="Equipment">Equipment</option>
            <option value="Supplies">Supplies</option>
            <option value="Training">Training</option>
            <option value="Maintenance">Maintenance</option>
          </select>
          <input
            name="amount"
            type="number"
            value={form.amount}
            onChange={handleChange}
            placeholder="Amount (₹)"
          />
          <input
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
          />
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
          />
        </div>
        <div className="form-actions">
          <button onClick={createTransaction} className="btn-primary">
            + Create Transaction
          </button>
        </div>
        {message && <div className={`form-message ${message.includes("✅") ? "success" : "error"}`}>{message}</div>}
      </section>

      {/* TRANSACTIONS TABLE */}
      <section className="admin-card">
        <div className="table-header">
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
            <option value="ALL">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Budget Head</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Date</th>
                <th>Status</th>
                <th>Approved By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((txn) => (
                  <tr key={txn.id}>
                    <td>{txn.id}</td>
                    <td>{txn.head}</td>
                    <td>₹{txn.amount.toLocaleString()}</td>
                    <td>{txn.description}</td>
                    <td>{txn.date}</td>
                    <td>
                      <span className={`status-badge ${txn.status.toLowerCase()}`}>
                        {txn.status}
                      </span>
                    </td>
                    <td>{txn.approvedBy}</td>
                    <td>
                      {txn.status === "Pending" && (
                        <div className="action-buttons">
                          <button className="btn-sm" onClick={() => approveTransaction(txn.id)}>
                            ✓ Approve
                          </button>
                          <button className="btn-sm danger" onClick={() => rejectTransaction(txn.id)}>
                            ✗ Reject
                          </button>
                        </div>
                      )}
                      {txn.status !== "Pending" && (
                        <span style={{ color: "#94a3b8", fontSize: "13px" }}>-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="empty-state">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default AdminTransactions;

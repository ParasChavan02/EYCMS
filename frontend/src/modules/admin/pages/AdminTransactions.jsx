import { useMemo, useState } from "react";
import { useAuth } from "../../common/hooks/useAuth";
import { transactionService } from "../../../services/transactionService";
import "../../../styles/admin-management.css";

function AdminTransactions() {
  const { user } = useAuth();
  const currentAdmin = user?.email || "admin@example.com";
  const currentAdminName = user?.name || "Admin";

  const [form, setForm] = useState({
    budgetHead: "",
    amount: "",
    description: "",
    date: "",
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL"); // ALL, MY, USER
  const [message, setMessage] = useState("");
  const [transactions, setTransactions] = useState(() => transactionService.getTransactions());

  const refreshTransactions = () => {
    setTransactions(transactionService.getTransactions());
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTransaction = () => {
    setMessage("");
    if (!form.budgetHead || !form.amount || !form.description) {
      setMessage("❌ Please fill all required fields");
      return;
    }

    const payload = {
      amount: form.amount,
      budgetHead: form.budgetHead,
      description: form.description,
      uploadedBills: ["admin_manual_invoice.pdf"]
    };

    transactionService.createTransaction(payload, currentAdmin, "ADMIN");
    refreshTransactions();
    setForm({ budgetHead: "", amount: "", description: "", date: "" });
    setMessage("✅ Transaction created successfully");
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const matchesSearch =
        txn.id.toLowerCase().includes(search.toLowerCase()) ||
        txn.budgetHead.toLowerCase().includes(search.toLowerCase()) ||
        txn.description.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "ALL" ? true : txn.status.toUpperCase() === statusFilter.toUpperCase();

      let matchesSource = true;
      if (sourceFilter === "MY") {
        matchesSource = txn.creatorRole === "ADMIN" || txn.transactionType === "ADMIN_CREATED";
      } else if (sourceFilter === "USER") {
        matchesSource = txn.creatorRole === "USER" || txn.transactionType === "USER_REQUEST";
      }

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [transactions, search, statusFilter, sourceFilter]);

  return (
    <main className="admin-page">
      <section className="admin-header">
        <h1>💳 Transactions Management</h1>
        <p>Create and search financial transactions across the enterprise</p>
      </section>

      {/* CREATE TRANSACTION */}
      <section className="admin-card">
        <h2>Create New Transaction</h2>
        <div className="form-grid">
          <select name="budgetHead" value={form.budgetHead} onChange={handleChange}>
            <option value="">Select Budget Head</option>
            <option value="Venue">Venue</option>
            <option value="Food & Refreshments">Food & Refreshments</option>
            <option value="Marketing">Marketing</option>
            <option value="Travel">Travel</option>
            <option value="Equipment">Equipment</option>
            <option value="Training">Training</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Miscellaneous">Miscellaneous</option>
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
        </div>
        <div className="form-actions">
          <button onClick={handleCreateTransaction} className="btn-primary">
            + Create Transaction
          </button>
        </div>
        {message && <div className={`form-message ${message.includes("✅") ? "success" : "error"}`}>{message}</div>}
      </section>

      {/* TRANSACTIONS TABLE */}
      <section className="admin-card">
        <div className="tab-nav" style={{ marginBottom: "20px" }}>
          <button
            type="button"
            className={`tab-chip ${sourceFilter === "ALL" ? "active" : ""}`}
            onClick={() => setSourceFilter("ALL")}
          >
            All Transactions
          </button>
          <button
            type="button"
            className={`tab-chip ${sourceFilter === "MY" ? "active" : ""}`}
            onClick={() => setSourceFilter("MY")}
          >
            My Transactions (Admin)
          </button>
          <button
            type="button"
            className={`tab-chip ${sourceFilter === "USER" ? "active" : ""}`}
            onClick={() => setSourceFilter("USER")}
          >
            User Transactions
          </button>
        </div>

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
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="FINANCE_VERIFIED">Finance Verified</option>
            <option value="ADMIN_APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="REVISION_REQUESTED">Revision Requested</option>
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
                <th>Created By</th>
                <th>Source</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((txn) => (
                  <tr key={txn.id}>
                    <td style={{ fontWeight: "600" }}>{txn.id}</td>
                    <td>{txn.budgetHead}</td>
                    <td>₹{txn.amount.toLocaleString("en-IN")}</td>
                    <td>{txn.description}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: "500" }}>{txn.createdBy}</span>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>{txn.creatorRole}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "600",
                          backgroundColor: txn.transactionType === "ADMIN_CREATED" ? "#f3e8ff" : "#e0f2fe",
                          color: txn.transactionType === "ADMIN_CREATED" ? "#6b21a8" : "#0369a1",
                        }}
                      >
                        {txn.transactionType || (txn.creatorRole === "ADMIN" ? "ADMIN_CREATED" : "USER_REQUEST")}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${txn.status.toLowerCase().replace("_", "")}`}>
                        {txn.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>{txn.createdAt ? new Date(txn.createdAt).toLocaleDateString() : "-"}</td>
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

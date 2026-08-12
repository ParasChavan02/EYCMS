import { useState } from "react";
import "../styles/admin-management.css";

function AdminAccounts() {
  const [accounts] = useState([
    { id: "ACC001", name: "General Fund", type: "Primary", balance: 5000000, status: "Active" },
    { id: "ACC002", name: "Project Fund", type: "Grant", balance: 3000000, status: "Active" },
    { id: "ACC003", name: "Reserve Fund", type: "Reserve", balance: 2000000, status: "Active" },
    { id: "ACC004", name: "Contingency Fund", type: "Emergency", balance: 1000000, status: "Inactive" },
  ]);

  return (
    <main className="admin-page">
      <section className="admin-header">
        <h1>Central Accounts</h1>
        <p>Monitor account balances, account types, and account-level actions.</p>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Balance</div>
          <div className="stat-value">Rs 1.10Cr</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Accounts</div>
          <div className="stat-value">{accounts.filter((account) => account.status === "Active").length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Inactive Accounts</div>
          <div className="stat-value">{accounts.filter((account) => account.status === "Inactive").length}</div>
        </div>
      </section>

      <section className="admin-card">
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Account Name</th>
                <th>Account Type</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td>{account.name}</td>
                  <td>{account.type}</td>
                  <td>Rs {account.balance.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${account.status.toLowerCase()}`}>{account.status}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-sm">View</button>
                      <button className="btn-sm">Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default AdminAccounts;

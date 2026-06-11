import "./user-erp.css";

function MyTickets() {
  const tickets = [
    { id: "TKT-001", issue: "Login page not loading", category: "Account", priority: "High", priorityTone: "high", status: "In Progress", statusTone: "progress", date: "2024-01-15" },
    { id: "TKT-002", issue: "Export report feature not working", category: "Reports", priority: "Medium", priorityTone: "medium", status: "Open", statusTone: "open", date: "2024-01-14" },
    { id: "TKT-003", issue: "Transaction approval delay", category: "Transactions", priority: "Critical", priorityTone: "critical", status: "Assigned", statusTone: "assigned", date: "2024-01-13" },
  ];

  return (
    <main className="user-erp-page">
      <div className="user-support-layout">
        <header className="user-erp-header">
          <h1>My Support Tickets</h1>
          <p>Track and manage your support requests</p>
        </header>

        <div className="user-ticket-filters">
          <select className="user-search-input" defaultValue="All Status">
            <option>All Status</option>
            <option>Open</option>
            <option>In Progress</option>
            <option>Assigned</option>
          </select>
          <select className="user-search-input" defaultValue="All Priority">
            <option>All Priority</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
        </div>

        <section className="user-erp-card user-table-card">
          <table className="user-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Issue</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="user-ticket-id"><strong>{ticket.id}</strong></td>
                  <td className="user-ticket-issue">{ticket.issue}</td>
                  <td>{ticket.category}</td>
                  <td className="user-table-center"><span className={`user-status ${ticket.priorityTone}`}>{ticket.priority}</span></td>
                  <td className="user-table-center"><span className={`user-status ${ticket.statusTone}`}>{ticket.status}</span></td>
                  <td className="user-ticket-date">{ticket.date}</td>
                  <td className="user-table-center"><button className="user-secondary-button" type="button">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}

export default MyTickets;

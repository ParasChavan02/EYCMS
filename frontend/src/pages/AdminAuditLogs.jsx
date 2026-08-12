import { useMemo, useState } from "react";
import "../styles/admin-management.css";

function AdminAuditLogs() {
  const [logs] = useState([
    { id: 1, timestamp: "2026-05-30 14:30:45", user: "Manas Pandya", action: "User Created", module: "Users", status: "Success" },
    { id: 2, timestamp: "2026-05-30 13:45:12", user: "Paras Chavan", action: "Transaction Approved", module: "Transactions", status: "Success" },
    { id: 3, timestamp: "2026-05-30 12:20:33", user: "Purva Kalkute", action: "Report Generated", module: "Reports", status: "Success" },
    { id: 4, timestamp: "2026-05-30 11:15:22", user: "Lakshay Jain", action: "Role Changed", module: "Users", status: "Success" },
    { id: 5, timestamp: "2026-05-30 10:05:11", user: "Admin", action: "Login Activity", module: "System", status: "Success" },
    { id: 6, timestamp: "2026-05-29 16:45:33", user: "Manas Pandya", action: "Configuration Changed", module: "System", status: "Success" },
    { id: 7, timestamp: "2026-05-29 14:04:01", user: "Finance Bot", action: "Payment Retry Failed", module: "Transactions", status: "Failed" },
    { id: 8, timestamp: "2026-05-29 09:31:19", user: "Compliance Desk", action: "Report Submission Missed", module: "Reports", status: "Warning" },
  ]);

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.user.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.module.toLowerCase().includes(search.toLowerCase());
      const matchesDate = !dateFilter || log.timestamp.startsWith(dateFilter);
      const matchesModule = moduleFilter === "ALL" || log.module === moduleFilter;
      const matchesStatus = statusFilter === "ALL" || log.status === statusFilter;
      return matchesSearch && matchesDate && matchesModule && matchesStatus;
    });
  }, [logs, search, dateFilter, moduleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <main className="admin-page">
      <section className="admin-header">
        <h1>Audit Logs</h1>
        <p>Track user activity, configuration changes, and operational exceptions.</p>
      </section>

      <section className="admin-card">
        <div className="table-header">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="search-input"
            placeholder="Search user, action, or module"
          />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
            className="search-input"
            style={{ flex: "0 0 200px" }}
          />
          <select value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }} className="filter-select">
            <option value="ALL">All Modules</option>
            <option value="Users">Users</option>
            <option value="Transactions">Transactions</option>
            <option value="Reports">Reports</option>
            <option value="System">System</option>
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="filter-select">
            <option value="ALL">All Statuses</option>
            <option value="Success">Success</option>
            <option value="Warning">Warning</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Module</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.timestamp}</td>
                    <td>{log.user}</td>
                    <td>{log.action}</td>
                    <td>{log.module}</td>
                    <td>
                      <span className={`status-badge ${log.status === "Success" ? "approved" : log.status === "Warning" ? "pending" : "rejected"}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-state">
                    No audit logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-bar">
          <span>
            Showing {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length}
          </span>
          <div className="action-buttons">
            <button className="btn-sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
              Previous
            </button>
            <button className="btn-sm" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>
              Next
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminAuditLogs;

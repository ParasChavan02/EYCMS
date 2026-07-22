import { useState, useEffect } from "react";
import { useNotification } from "../../common/hooks/useNotification";
import { ticketService } from "../../../services/support/ticketService";
import { Loader2, MessageSquare, Send, X, FileText, CheckCircle2, Clock, XCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import "./user-erp.css";

function MyTickets() {
  const { addNotification } = useNotification();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal & reply state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [priorityFilter, setPriorityFilter] = useState("All Priority");

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await ticketService.getAllTickets();
      setTickets(res.data || []);
    } catch (e) {
      console.error(e);
      addNotification("Failed to load support tickets.", "error", 1800, false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleViewTicket = async (t) => {
    try {
      setFetchingDetail(true);
      const detail = await ticketService.getTicketById(t.id);
      setSelectedTicket(detail);
    } catch (e) {
      console.error(e);
      // Fallback to table object if detail call fails
      setSelectedTicket(t);
      addNotification("Loaded summary ticket details.", "info", 1800, false);
    } finally {
      setFetchingDetail(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    setIsSending(true);
    try {
      await ticketService.addMessage(selectedTicket.id, replyText, [], false);
      // Reload ticket detail to get new messages
      const detail = await ticketService.getTicketById(selectedTicket.id);
      setSelectedTicket(detail);
      setReplyText("");
      addNotification("Message successfully sent to support admin!", "success", 1800, false);
    } catch (err) {
      console.error(err);
      addNotification("Failed to send message.", "error", 1800, false);
    } finally {
      setIsSending(false);
    }
  };

  // Local filtering based on status and priority select dropdowns
  const filteredTickets = tickets.filter(t => {
    const statusMatch = statusFilter === "All Status" || t.status === statusFilter.toUpperCase() || (statusFilter === "In Progress" && t.status === "IN_PROGRESS");
    const priorityMatch = priorityFilter === "All Priority" || t.priority === priorityFilter.toUpperCase();
    return statusMatch && priorityMatch;
  });

  const getPriorityClass = (priority) => {
    switch (priority?.toUpperCase()) {
      case "CRITICAL": return "user-status critical";
      case "HIGH": return "user-status high";
      case "LOW": return "user-status low";
      default: return "user-status medium";
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "OPEN": return "user-status open";
      case "IN_PROGRESS":
      case "ASSIGNED":
        return "user-status progress";
      case "RESOLVED":
      case "ACCEPTED":
      case "APPROVED":
        return "user-status approved";
      case "REJECTED":
      case "CLOSED":
        return "user-status rejected";
      default: return "user-status review";
    }
  };

  return (
    <main className="user-erp-page">
      <div className="user-support-layout">
        <header className="user-erp-header">
          <h1>My Support Tickets</h1>
          <p>Track and manage your support requests and view admin resolution updates</p>
        </header>

        <div className="user-ticket-filters">
          <select
            className="user-search-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All Status</option>
            <option>Open</option>
            <option>In Progress</option>
            <option>Resolved</option>
            <option>Closed</option>
          </select>
          <select
            className="user-search-input"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option>All Priority</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
            <Loader2 className="animate-spin" size={32} color="#1d5cff" />
          </div>
        ) : (
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
                {filteredTickets.length > 0 ? (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td className="user-ticket-id"><strong>{ticket.ticketId}</strong></td>
                      <td className="user-ticket-issue">{ticket.title}</td>
                      <td>{ticket.category}</td>
                      <td className="user-table-center"><span className={getPriorityClass(ticket.priority)}>{ticket.priority}</span></td>
                      <td className="user-table-center"><span className={getStatusClass(ticket.status)}>{ticket.status}</span></td>
                      <td className="user-ticket-date">{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "N/A"}</td>
                      <td className="user-table-center">
                        <button
                          className="user-secondary-button"
                          type="button"
                          onClick={() => handleViewTicket(ticket)}
                          style={{
                            minHeight: "36px",
                            height: "36px",
                            padding: "0 20px",
                            borderRadius: "8px",
                            fontSize: "0.85rem",
                            display: "inline-flex",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "auto",
                            whiteSpace: "nowrap"
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "var(--text-light)" }}>
                      No tickets found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}
      </div>

      {/* VIEW TICKET DETAIL MODAL DIALOG */}
      {selectedTicket && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99990,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => setSelectedTicket(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "720px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
              border: "1px solid #e2e8f0"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f8fafc",
                borderTopLeftRadius: "16px",
                borderTopRightRadius: "16px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#1d5cff", background: "#eff6ff", padding: "4px 10px", borderRadius: "6px" }}>
                  {selectedTicket.ticketId}
                </span>
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#0f172a" }}>
                  {selectedTicket.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Status and Priority Meta Row */}
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", background: "#f8fafc", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>Status</span>
                  <span className={getStatusClass(selectedTicket.status)} style={{ padding: "4px 10px", fontSize: "0.8rem" }}>
                    {selectedTicket.status}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>Priority</span>
                  <span className={getPriorityClass(selectedTicket.priority)} style={{ padding: "4px 10px", fontSize: "0.8rem" }}>
                    {selectedTicket.priority}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>Category</span>
                  <strong style={{ fontSize: "0.88rem", color: "#334155" }}>{selectedTicket.category}</strong>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>Created On</span>
                  <span style={{ fontSize: "0.85rem", color: "#475569" }}>
                    {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : "N/A"}
                  </span>
                </div>
              </div>

              {/* SECTION 1: BRIEF DESCRIPTION PROVIDED EARLIER */}
              <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "18px", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "#1e293b" }}>
                  <FileText size={18} color="#1d5cff" />
                  <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700" }}>Brief Description (Provided Earlier)</h3>
                </div>
                <p style={{ margin: 0, fontSize: "0.92rem", color: "#334155", lineHeight: "1.65", whiteSpace: "pre-wrap" }}>
                  {selectedTicket.description || selectedTicket.title}
                </p>
              </div>

              {/* SECTION 2: ADMIN STATUS UPDATES & NOTES */}
              <div
                style={{
                  background: selectedTicket.status?.toUpperCase() === "RESOLVED" || selectedTicket.status?.toUpperCase() === "ACCEPTED"
                    ? "#f0fdf4"
                    : selectedTicket.status?.toUpperCase() === "REJECTED" || selectedTicket.status?.toUpperCase() === "CLOSED"
                      ? "#fef2f2"
                      : "#f0f9ff",
                  border: `1px solid ${selectedTicket.status?.toUpperCase() === "RESOLVED" || selectedTicket.status?.toUpperCase() === "ACCEPTED"
                      ? "#bbf7d0"
                      : selectedTicket.status?.toUpperCase() === "REJECTED" || selectedTicket.status?.toUpperCase() === "CLOSED"
                        ? "#fecaca"
                        : "#bae6fd"
                    }`,
                  borderRadius: "12px",
                  padding: "18px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  {selectedTicket.status?.toUpperCase() === "RESOLVED" || selectedTicket.status?.toUpperCase() === "ACCEPTED" ? (
                    <CheckCircle2 size={18} color="#16a34a" />
                  ) : selectedTicket.status?.toUpperCase() === "REJECTED" || selectedTicket.status?.toUpperCase() === "CLOSED" ? (
                    <XCircle size={18} color="#dc2626" />
                  ) : (
                    <Clock size={18} color="#0284c7" />
                  )}
                  <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700", color: "#0f172a" }}>
                    Admin Review & Update Status
                  </h3>
                </div>

                <p style={{ margin: "0 0 8px", fontSize: "0.9rem", color: "#334155" }}>
                  <strong>Current Status: </strong>
                  {selectedTicket.status?.toUpperCase() === "RESOLVED" || selectedTicket.status?.toUpperCase() === "ACCEPTED"
                    ? "ACCEPTED / RESOLVED BY ADMIN"
                    : selectedTicket.status?.toUpperCase() === "REJECTED" || selectedTicket.status?.toUpperCase() === "CLOSED"
                      ? "REJECTED / CLOSED BY ADMIN"
                      : selectedTicket.status}
                </p>

                {selectedTicket.adminNotes ? (
                  <div style={{ background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.08)", marginTop: "8px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                      Admin Notes & Feedback:
                    </span>
                    <p style={{ margin: 0, fontSize: "0.88rem", color: "#1e293b", lineHeight: "1.5" }}>
                      {selectedTicket.adminNotes}
                    </p>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", italic: "true" }}>
                    {selectedTicket.status?.toUpperCase() === "OPEN"
                      ? "Ticket has been submitted to admin. Awaiting initial administrator review."
                      : "Admin is currently processing this ticket request."}
                  </p>
                )}
              </div>





            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default MyTickets;


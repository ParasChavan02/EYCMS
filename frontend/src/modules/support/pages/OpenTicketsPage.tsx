import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Inbox,
  Clock,
  MessageCircle,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
} from 'lucide-react';
import { useOpenTickets } from '../hooks/useTickets';
import { Ticket, TicketStatus } from '../types';
import '../../../styles/support.css';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getPriorityClass(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'low':      return 'sp-badge sp-badge-low';
    case 'medium':   return 'sp-badge sp-badge-medium';
    case 'high':     return 'sp-badge sp-badge-high';
    case 'critical': return 'sp-badge sp-badge-critical';
    default:         return 'sp-badge sp-badge-low';
  }
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'Open':             return 'sp-badge sp-badge-open';
    case 'Assigned':         return 'sp-badge sp-badge-assigned';
    case 'In Progress':      return 'sp-badge sp-badge-in-progress';
    case 'Waiting Response': return 'sp-badge sp-badge-waiting';
    case 'Resolved':         return 'sp-badge sp-badge-resolved';
    case 'Closed':           return 'sp-badge sp-badge-closed';
    default:                 return 'sp-badge sp-badge-open';
  }
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export const OpenTicketsPage: React.FC = () => {
  const [page, setPage]     = useState(1);
  const [pageSize]          = useState(10);
  const { data, isLoading } = useOpenTickets(page, pageSize);
  const navigate            = useNavigate();

  const tickets: Ticket[] = data?.data ?? [];

  /* Derived KPI counts */
  const waitingCount  = tickets.filter(
    (t) => t.status === TicketStatus.WAITING_RESPONSE,
  ).length;
  const assignedCount = tickets.filter(
    (t) => t.status === TicketStatus.ASSIGNED,
  ).length;

  const handleView = (ticket: Ticket, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/admin/support/ticket/${ticket.ticketId}`);
  };

  return (
    <div className="support-page">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="sp-header">
        <div className="sp-header-copy">
          <h1>Open Tickets</h1>
          <p>Tickets requiring action or response</p>
        </div>
      </div>

      {/* ── KPI Grid ────────────────────────────────────────────────────── */}
      <div className="sp-kpi-grid">

        {/* 1 · Total Open */}
        <div className="sp-kpi-card">
          <div className="sp-kpi-icon blue">
            <Inbox size={18} />
          </div>
          <div className="sp-kpi-body">
            <div className="sp-kpi-label">Total Open</div>
            <div className="sp-kpi-value">
              {isLoading ? '—' : (data?.total ?? 0)}
            </div>
            <div className="sp-kpi-sub">Across all statuses</div>
          </div>
        </div>

        {/* 2 · Waiting Response */}
        <div className="sp-kpi-card">
          <div className="sp-kpi-icon purple">
            <MessageCircle size={18} />
          </div>
          <div className="sp-kpi-body">
            <div className="sp-kpi-label">Waiting Response</div>
            <div className="sp-kpi-value">
              {isLoading ? '—' : waitingCount}
            </div>
            <div className="sp-kpi-sub">Pending admin reply</div>
          </div>
        </div>

        {/* 3 · Assigned */}
        <div className="sp-kpi-card">
          <div className="sp-kpi-icon green">
            <UserCheck size={18} />
          </div>
          <div className="sp-kpi-body">
            <div className="sp-kpi-label">Assigned</div>
            <div className="sp-kpi-value">
              {isLoading ? '—' : assignedCount}
            </div>
            <div className="sp-kpi-sub">Being handled</div>
          </div>
        </div>

        {/* 4 · Avg Ticket Age */}
        <div className="sp-kpi-card">
          <div className="sp-kpi-icon orange">
            <Clock size={18} />
          </div>
          <div className="sp-kpi-body">
            <div className="sp-kpi-label">Avg Ticket Age</div>
            <div className="sp-kpi-value">2.4 days</div>
            <div className="sp-kpi-sub">Since ticket created</div>
          </div>
        </div>

      </div>

      {/* ── SLA Compliance Card ─────────────────────────────────────────── */}
      <div className="sp-card" style={{ marginBottom: '14px' }}>
        <div className="sp-card-header">
          <h3>SLA Response Compliance</h3>
          <span className="sp-card-meta">Last 30 days</span>
        </div>
        <div className="sp-card-pad">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>
              Response SLA: 84% within 4 hours
            </span>
            <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700 }}>
              84%
            </span>
          </div>
          <div className="sp-progress-bar">
            <div className="sp-progress-fill green" style={{ width: '84%' }} />
          </div>
          <p
            style={{
              margin: '8px 0 0',
              fontSize: '0.75rem',
              color: '#94a3b8',
            }}
          >
            16% of tickets exceeded response time SLA target
          </p>
        </div>
      </div>

      {/* ── Tickets Table Card ──────────────────────────────────────────── */}
      <div className="sp-card">
        <div className="sp-card-header">
          <h3>Open Tickets</h3>
          <span className="sp-card-meta">
            {isLoading
              ? 'Loading…'
              : `${data?.total ?? 0} ticket${(data?.total ?? 0) !== 1 ? 's' : ''}`}
          </span>
        </div>

        <div className="sp-table-wrap">
          <table className="sp-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>User</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7}>
                    <div className="sp-table-empty">
                      <div className="sp-table-empty-icon">
                        <Inbox size={22} />
                      </div>
                      <p>Loading tickets…</p>
                      <span>Please wait a moment</span>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && tickets.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="sp-table-empty">
                      <div className="sp-table-empty-icon">
                        <CheckCircle size={22} />
                      </div>
                      <p>No open tickets</p>
                      <span>All tickets have been resolved or closed.</span>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading &&
                tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() =>
                      navigate(`/admin/support/ticket/${ticket.ticketId}`)
                    }
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Ticket ID */}
                    <td>
                      <span className="sp-ticket-id">#{ticket.ticketId}</span>
                    </td>

                    {/* User */}
                    <td>
                      <div className="sp-user-cell">
                        <div className="sp-user-avatar">
                          {getInitials(ticket.user.name)}
                        </div>
                        <div>
                          <div className="sp-user-name">{ticket.user.name}</div>
                          <div className="sp-user-email">{ticket.user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="muted">{ticket.category}</td>

                    {/* Priority */}
                    <td>
                      <span className={getPriorityClass(ticket.priority)}>
                        {ticket.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={getStatusClass(ticket.status)}>
                        <span className="sp-badge-dot" />
                        {ticket.status}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="muted">{formatDate(ticket.createdAt)}</td>

                    {/* Actions */}
                    <td>
                      <div className="sp-table-actions">
                        <button
                          className="sp-btn-icon blue"
                          title="View ticket"
                          onClick={(e) => handleView(ticket, e)}
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ────────────────────────────────────────────────── */}
        {data && data.totalPages > 1 && (
          <div className="sp-pagination">
            <span>
              Page {page} of {data.totalPages} &nbsp;·&nbsp; {data.total} total
            </span>
            <div className="sp-pagination-btns">
              <button
                className="sp-btn sp-btn-outline sp-btn-sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <button
                className="sp-btn sp-btn-outline sp-btn-sm"
                onClick={() => setPage(Math.min(data.totalPages, page + 1))}
                disabled={page === data.totalPages}
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};


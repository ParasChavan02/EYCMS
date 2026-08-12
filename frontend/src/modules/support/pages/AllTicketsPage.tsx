import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Eye,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useTickets, useUpdateTicketStatus, useAssignTicket } from '../hooks/useTickets';
import { useNotification } from '../../../hooks/useNotification';
import {
  TicketFilter,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  Ticket,
} from '../types';
import { formatDateRelative } from '../utils/ticketUtils';
import '../../../styles/support.css';

/* ── helpers ─────────────────────────────────────── */

function getStatusBadgeClass(status: TicketStatus): string {
  switch (status) {
    case TicketStatus.OPEN:             return 'sp-badge-open';
    case TicketStatus.ASSIGNED:        return 'sp-badge-assigned';
    case TicketStatus.IN_PROGRESS:     return 'sp-badge-in-progress';
    case TicketStatus.WAITING_RESPONSE: return 'sp-badge-waiting';
    case TicketStatus.RESOLVED:        return 'sp-badge-resolved';
    case TicketStatus.CLOSED:          return 'sp-badge-closed';
    default:                           return 'sp-badge-open';
  }
}

function getPriorityBadgeClass(priority: TicketPriority): string {
  switch (priority) {
    case TicketPriority.LOW:      return 'sp-badge-low';
    case TicketPriority.MEDIUM:   return 'sp-badge-medium';
    case TicketPriority.HIGH:     return 'sp-badge-high';
    case TicketPriority.CRITICAL: return 'sp-badge-critical';
    default:                      return 'sp-badge-low';
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/* ── component ───────────────────────────────────── */

export const AllTicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Filter state
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState<TicketCategory | ''>('');
  const [priority, setPriority]   = useState<TicketPriority | ''>('');
  const [status, setStatus]       = useState<TicketStatus | ''>('');
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');

  // Build filter object
  const filters: TicketFilter | undefined = (() => {
    const f: TicketFilter = {};
    if (search)   f.searchQuery = search;
    if (category) f.category    = category as TicketCategory;
    if (priority) f.priority    = priority as TicketPriority;
    if (status)   f.status      = status as TicketStatus;
    if (dateFrom || dateTo) {
      f.dateRange = {
        startDate: dateFrom || '',
        endDate:   dateTo   || '',
      };
    }
    return Object.keys(f).length ? f : undefined;
  })();

  const { addNotification } = useNotification();
  const updateStatus = useUpdateTicketStatus();
  const assignTicket = useAssignTicket();
  const [hiddenTicketIds, setHiddenTicketIds] = useState<string[]>([]);

  const { data, isLoading } = useTickets(page, pageSize, filters);

  const tickets: Ticket[] = (data?.data ?? []).filter(
    (t) => !hiddenTicketIds.includes(t.ticketId)
  );

  // KPI counts derived from fetched page + totals from server
  const totalTickets  = data?.total ?? 0;
  const openTickets   = tickets.filter((t) => t.status === TicketStatus.OPEN).length;
  const criticalCount = tickets.filter((t) => t.priority === TicketPriority.CRITICAL).length;
  const resolvedToday = tickets.filter((t) => {
    if (t.status !== TicketStatus.RESOLVED || !t.resolvedAt) return false;
    const today = new Date().toDateString();
    return new Date(t.resolvedAt).toDateString() === today;
  }).length;

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setPriority('');
    setStatus('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleViewTicket = (ticket: Ticket) => {
    navigate(`/admin/support/ticket/${ticket.id}`);
  };

  const handleAssignTicket = (ticket: Ticket) => {
    const currentAssignee = ticket.assignedTo?.id;
    const nextAssigneeId = currentAssignee === 'admin-1' ? 'admin-2' : 'admin-1';
    const nextAssigneeName = nextAssigneeId === 'admin-1' ? 'Alice Johnson' : 'Bob Smith';

    assignTicket.mutate(
      { ticketId: ticket.id, adminId: nextAssigneeId },
      {
        onSuccess: () => {
          addNotification(`👤 Ticket assigned to ${nextAssigneeName} successfully.`, 'success', 3000);
        },
      }
    );
  };

  const handleMarkResolved = (ticket: Ticket) => {
    updateStatus.mutate(
      { ticketId: ticket.id, status: TicketStatus.RESOLVED },
      {
        onSuccess: () => {
          addNotification(`✅ Ticket ${ticket.ticketId} marked as RESOLVED.`, 'success', 3000);
          setHiddenTicketIds((prev) => [...prev, ticket.ticketId]);
        },
      }
    );
  };

  return (
    <div className="support-page">
      {/* ── Header ──────────────────────────────────── */}
      <div className="sp-header">
        <div className="sp-header-copy">
          <h1>All Tickets</h1>
          <p>Manage and track all support requests</p>
        </div>
        <div className="sp-header-actions">
          <button className="sp-btn sp-btn-primary">
            <Plus size={14} />
            + New Ticket
          </button>
        </div>
      </div>

      {/* ── KPI Grid ────────────────────────────────── */}
      <div className="sp-kpi-grid">
        {/* Total Tickets */}
        <div className="sp-kpi-card">
          <div className="sp-kpi-icon blue">
            <BarChart3 size={18} />
          </div>
          <div className="sp-kpi-body">
            <div className="sp-kpi-label">Total Tickets</div>
            <div className="sp-kpi-value">{isLoading ? '—' : totalTickets}</div>
            <div className="sp-kpi-sub">All time</div>
          </div>
        </div>

        {/* Open Tickets */}
        <div className="sp-kpi-card">
          <div className="sp-kpi-icon yellow">
            <Clock size={18} />
          </div>
          <div className="sp-kpi-body">
            <div className="sp-kpi-label">Open Tickets</div>
            <div className="sp-kpi-value">{isLoading ? '—' : openTickets}</div>
            <div className="sp-kpi-sub">Awaiting response</div>
          </div>
        </div>

        {/* Critical */}
        <div className="sp-kpi-card">
          <div className="sp-kpi-icon red">
            <AlertCircle size={18} />
          </div>
          <div className="sp-kpi-body">
            <div className="sp-kpi-label">Critical</div>
            <div className="sp-kpi-value">{isLoading ? '—' : criticalCount}</div>
            <div className="sp-kpi-sub">Needs immediate action</div>
          </div>
        </div>

        {/* Resolved Today */}
        <div className="sp-kpi-card">
          <div className="sp-kpi-icon green">
            <CheckCircle size={18} />
          </div>
          <div className="sp-kpi-body">
            <div className="sp-kpi-label">Resolved Today</div>
            <div className="sp-kpi-value">{isLoading ? '—' : resolvedToday}</div>
            <div className="sp-kpi-sub">Closed this session</div>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ──────────────────────────────── */}
      <div className="sp-filter-bar">
        <div className="sp-filter-row">
          {/* Search */}
          <div className="sp-filter-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search tickets…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {/* Category */}
          <select
            className="sp-filter-select"
            value={category}
            onChange={(e) => { setCategory(e.target.value as TicketCategory | ''); setPage(1); }}
          >
            <option value="">Category</option>
            {Object.values(TicketCategory).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Priority */}
          <select
            className="sp-filter-select"
            value={priority}
            onChange={(e) => { setPriority(e.target.value as TicketPriority | ''); setPage(1); }}
          >
            <option value="">Priority</option>
            {Object.values(TicketPriority).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Status */}
          <select
            className="sp-filter-select"
            value={status}
            onChange={(e) => { setStatus(e.target.value as TicketStatus | ''); setPage(1); }}
          >
            <option value="">Status</option>
            {Object.values(TicketStatus).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Date From */}
          <input
            type="date"
            className="sp-filter-date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            title="From"
          />

          {/* Date To */}
          <input
            type="date"
            className="sp-filter-date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            title="To"
          />

          {/* Clear */}
          <button
            className="sp-btn sp-btn-outline sp-btn-sm"
            onClick={handleClearFilters}
          >
            <X size={14} />
            Clear Filters
          </button>
        </div>
      </div>

      {/* ── Tickets Table Card ───────────────────────── */}
      <div className="sp-card">
        <div className="sp-card-header">
          <h3>Tickets</h3>
          <span className="sp-card-meta">
            {isLoading ? 'Loading…' : `${data?.total ?? 0} total`}
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
                        <Clock size={22} />
                      </div>
                      <p>Loading tickets…</p>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && tickets.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="sp-table-empty">
                      <div className="sp-table-empty-icon">
                        <BarChart3 size={22} />
                      </div>
                      <p>No tickets found</p>
                      <span>Try adjusting your filters or search query</span>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className={ticket.priority === TicketPriority.CRITICAL ? 'critical-row' : ''}
                  onClick={() => handleViewTicket(ticket)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Ticket ID */}
                  <td>
                    <span className="sp-ticket-id">{ticket.ticketId}</span>
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
                  <td>
                    <span className="sp-cat-tag">{ticket.category}</span>
                  </td>

                  {/* Priority */}
                  <td>
                    <span className={`sp-badge ${getPriorityBadgeClass(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    <span className={`sp-badge ${getStatusBadgeClass(ticket.status)}`}>
                      <span className="sp-badge-dot" />
                      {ticket.status}
                    </span>
                  </td>

                  {/* Created */}
                  <td className="muted">
                    {formatDateRelative(ticket.createdAt)}
                  </td>

                  {/* Actions */}
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="sp-table-actions">
                      <button
                        className="sp-btn-icon blue"
                        title="View ticket"
                        onClick={() => handleViewTicket(ticket)}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="sp-btn-icon"
                        title="Assign ticket"
                        onClick={() => handleAssignTicket(ticket)}
                      >
                        <UserPlus size={14} />
                      </button>
                      <button
                        className="sp-btn-icon green"
                        title="Mark resolved"
                        onClick={() => handleMarkResolved(ticket)}
                      >
                        <CheckCircle size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ───────────────────────────── */}
        {data && data.totalPages > 1 && (
          <div className="sp-pagination">
            <span>
              Page {page} of {data.totalPages} &nbsp;·&nbsp; {data.total} tickets
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


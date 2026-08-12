import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  AlertCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  UserPlus,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useCriticalTickets } from '../../../hooks/support/useTickets';
import { formatDateRelative } from '../../../utils/support/ticketUtils';
import { Ticket } from '../../../types/support';

/* ─── Helpers ───────────────────────────────────────── */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    Open: 'sp-badge-open',
    Assigned: 'sp-badge-assigned',
    'In Progress': 'sp-badge-in-progress',
    'Waiting Response': 'sp-badge-waiting',
    Resolved: 'sp-badge-resolved',
    Closed: 'sp-badge-closed',
  };
  return map[status] ?? 'sp-badge-open';
}

/* ─── Component ─────────────────────────────────────── */
export const CriticalIssuesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const { data, isLoading } = useCriticalTickets(page, pageSize);
  const navigate = useNavigate();

  const criticalTickets: Ticket[] = data?.data ?? [];
  const totalCritical = data?.total ?? 0;
  const unassignedCount = criticalTickets.filter((t) => !t.assignedTo).length;

  const handleRowClick = (ticket: Ticket) => {
    navigate(`/admin/support/ticket/${ticket.ticketId}`);
  };

  return (
    <div className="support-page">
      {/* ── Alert Banner ─────────────────────────────── */}
      <div className="sp-alert-banner red">
        <div className="sp-alert-icon red">
          <ShieldAlert size={18} />
        </div>
        <div className="sp-alert-body">
          <h2>Critical Issues</h2>
          <p>Tickets requiring immediate escalation and senior technical response.</p>
        </div>
      </div>

      {/* ── KPI Grid ─────────────────────────────────── */}
      <div className="sp-kpi-grid">
        {/* 1 – Critical Active */}
        <div className="sp-kpi-card">
          <div className="sp-kpi-icon red">
            <ShieldAlert size={18} />
          </div>
          <div className="sp-kpi-body">
            <div className="sp-kpi-label">Critical Active</div>
            <div className="sp-kpi-value">{totalCritical}</div>
          </div>
        </div>

        {/* 2 – Unassigned */}
        <div className="sp-kpi-card">
          <div className="sp-kpi-icon orange">
            <AlertCircle size={18} />
          </div>
          <div className="sp-kpi-body">
            <div className="sp-kpi-label">Unassigned</div>
            <div className="sp-kpi-value">{unassignedCount}</div>
          </div>
        </div>

        {/* 3 – SLA Compliance */}
        <div className="sp-kpi-card">
          <div className="sp-kpi-icon green">
            <CheckCircle size={18} />
          </div>
          <div className="sp-kpi-body">
            <div className="sp-kpi-label">SLA Compliance</div>
            <div className="sp-kpi-value">68%</div>
          </div>
        </div>

        {/* 4 – Avg Resolution */}
        <div className="sp-kpi-card">
          <div className="sp-kpi-icon blue">
            <Clock size={18} />
          </div>
          <div className="sp-kpi-body">
            <div className="sp-kpi-label">Avg Resolution</div>
            <div className="sp-kpi-value">3.2 hrs</div>
          </div>
        </div>
      </div>

      {/* ── SLA Warning Card ──────────────────────────── */}
      <div className="sp-card sp-card-pad" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 6,
          }}
        >
          <AlertTriangle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
            SLA Critical Alert
          </span>
        </div>
        <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: '#64748b' }}>
          Unassigned critical tickets must be claimed within 15 minutes. Breaches trigger automatic
          escalation.
        </p>
        <div className="sp-progress-bar">
          <div className="sp-progress-fill red" style={{ width: '68%' }} />
        </div>
        <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#64748b' }}>
          68% of critical tickets resolved within SLA target (&lt;&nbsp;4hrs)
        </div>
      </div>

      {/* ── Tickets Table Card ────────────────────────── */}
      <div className="sp-card">
        {/* Card Header */}
        <div className="sp-card-header">
          <h3>Critical Priority Tickets</h3>
          <span className="sp-badge sp-badge-critical">{totalCritical}</span>
        </div>

        {/* Table */}
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
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                    Loading critical tickets…
                  </td>
                </tr>
              )}

              {!isLoading && criticalTickets.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="sp-table-empty">
                      <div
                        className="sp-table-empty-icon"
                        style={{ background: '#f0fdf4', color: '#16a34a' }}
                      >
                        <CheckCircle size={24} />
                      </div>
                      <p>No Critical Issues</p>
                      <span>All systems are healthy and operating normally.</span>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading &&
                criticalTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="critical-row"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleRowClick(ticket)}
                  >
                    {/* Ticket ID */}
                    <td>
                      <span className="sp-ticket-id">{ticket.ticketId}</span>
                    </td>

                    {/* User */}
                    <td>
                      <div className="sp-user-cell">
                        <div className="sp-user-avatar">{getInitials(ticket.user.name)}</div>
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
                      <span className="sp-badge sp-badge-critical">
                        <span className="sp-badge-dot" />
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
                    <td className="muted">{formatDateRelative(ticket.createdAt)}</td>

                    {/* Actions */}
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="sp-table-actions">
                        {/* View */}
                        <button
                          className="sp-btn-icon"
                          title="View ticket"
                          onClick={() => handleRowClick(ticket)}
                        >
                          <Eye size={14} />
                        </button>

                        {/* Escalate */}
                        <button className="sp-btn-icon red" title="Escalate ticket">
                          <TrendingUp size={14} />
                        </button>

                        {/* Assign */}
                        <button className="sp-btn-icon blue" title="Assign ticket">
                          <UserPlus size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="sp-pagination">
            <span>
              Page <strong>{page}</strong> of <strong>{data.totalPages}</strong>
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

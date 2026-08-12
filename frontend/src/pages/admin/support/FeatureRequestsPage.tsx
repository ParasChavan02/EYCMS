import React, { useState } from 'react';
import {
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Clock,
  Lightbulb,
  Star,
  ArrowLeft,
  Plus,
  BarChart3,
} from 'lucide-react';
import {
  useFeatureRequests,
  useUpdateFeatureRequestStatus,
  useVoteOnFeatureRequest,
} from '../../../hooks/support/useFeatureRequests';
import { FeatureRequest } from '../../../types/support';
import { formatDate } from '../../../utils/support/ticketUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusTab = 'All' | 'Open' | 'Approved' | 'In Progress' | 'Planned' | 'Completed';

const STATUS_TABS: StatusTab[] = ['All', 'Open', 'Approved', 'In Progress', 'Planned', 'Completed'];

// ─── Badge class helper ───────────────────────────────────────────────────────

function getStatusBadgeClass(status: FeatureRequest['status']): string {
  switch (status) {
    case 'Open':        return 'sp-badge sp-badge-open';
    case 'Approved':    return 'sp-badge sp-badge-approved';
    case 'In Progress': return 'sp-badge sp-badge-in-progress';
    case 'Planned':     return 'sp-badge sp-badge-planned';
    case 'Completed':   return 'sp-badge sp-badge-completed';
    case 'Rejected':    return 'sp-badge sp-badge-rejected';
    default:            return 'sp-badge sp-badge-open';
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const FeatureRequestsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedTab, setSelectedTab] = useState<StatusTab>('All');
  const [selectedRequest, setSelectedRequest] = useState<FeatureRequest | null>(null);

  const { data, isLoading } = useFeatureRequests(page, pageSize);
  const updateStatus = useUpdateFeatureRequestStatus();
  const voteOnRequest = useVoteOnFeatureRequest();

  // ── Detail view ─────────────────────────────────────────────────────────────
  if (selectedRequest) {
    return (
      <div className="support-page">
        <FeatureRequestDetail
          request={selectedRequest}
          onBack={() => setSelectedRequest(null)}
          onStatusChange={(status) => {
            updateStatus.mutate({ requestId: selectedRequest.requestId, status });
            setSelectedRequest((prev) => prev ? { ...prev, status: status as FeatureRequest['status'] } : null);
          }}
        />
      </div>
    );
  }

  // ── Filtered list ────────────────────────────────────────────────────────────
  const allRequests = data?.data ?? [];
  const filtered =
    selectedTab === 'All'
      ? allRequests
      : allRequests.filter((r) => r.status === selectedTab);

  const maxVotes = filtered.length > 0 ? Math.max(...filtered.map((r) => r.votes), 1) : 1;
  const totalCount = data?.total ?? 0;

  return (
    <div className="support-page">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="sp-header">
        <div className="sp-header-copy">
          <h1>Feature Requests</h1>
          <p>Community-requested improvements and enhancements</p>
        </div>
        <div className="sp-header-actions">
          <span className="sp-badge sp-badge-planned" style={{ fontSize: '0.8rem', padding: '5px 12px' }}>
            <BarChart3 size={13} />
            {totalCount} Requests
          </span>
        </div>
      </div>

      {/* ── Status Pill Tabs ────────────────────────────────────────────────── */}
      <div className="sp-tabs" style={{ marginBottom: '16px' }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            className={`sp-tab${selectedTab === tab ? ' active' : ''}`}
            onClick={() => {
              setSelectedTab(tab);
              setPage(1);
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Cards Grid ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="sp-fr-grid">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="sp-skeleton"
              style={{ height: '200px', borderRadius: '16px' }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="sp-card">
          <div className="sp-table-empty">
            <div className="sp-table-empty-icon">
              <Lightbulb size={24} />
            </div>
            <p>No feature requests found</p>
            <span>
              {selectedTab === 'All'
                ? 'No requests have been submitted yet.'
                : `No requests with status "${selectedTab}".`}
            </span>
          </div>
        </div>
      ) : (
        <div className="sp-fr-grid">
          {filtered.map((request) => (
            <FeatureRequestCard
              key={request.id}
              request={request}
              maxVotes={maxVotes}
              onSelect={() => setSelectedRequest(request)}
              onVote={() => voteOnRequest.mutate(request.requestId)}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {data && data.totalPages > 1 && (
        <div className="sp-card" style={{ marginTop: '16px' }}>
          <div className="sp-pagination">
            <span>
              Page {page} of {data.totalPages} &mdash; {data.total} total
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
        </div>
      )}
    </div>
  );
};

// ─── Feature Request Card ─────────────────────────────────────────────────────

interface FeatureRequestCardProps {
  request: FeatureRequest;
  maxVotes: number;
  onSelect: () => void;
  onVote: () => void;
}

const FeatureRequestCard: React.FC<FeatureRequestCardProps> = ({
  request,
  maxVotes,
  onSelect,
  onVote,
}) => {
  const votePct = maxVotes > 0 ? Math.round((request.votes / maxVotes) * 100) : 0;

  return (
    <div className="sp-fr-card" onClick={onSelect} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
    >
      {/* Card Header */}
      <div className="sp-fr-card-header">
        <span className="sp-fr-title">{request.title}</span>
        <span className={getStatusBadgeClass(request.status)}>
          {request.status}
        </span>
      </div>

      {/* Description – max 2 lines */}
      <p
        className="sp-fr-desc"
        style={{
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {request.description}
      </p>

      {/* Benefit */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '0.72rem', color: '#94a3b8', flexShrink: 0, paddingTop: '1px' }}>
          Benefit:
        </span>
        <span style={{ fontSize: '0.78rem', color: '#475569', lineHeight: '1.4' }}>
          {request.benefit}
        </span>
      </div>

      {/* Vote bar */}
      <div className="sp-vote-bar">
        <div className="sp-vote-fill" style={{ width: `${votePct}%` }} />
      </div>

      {/* Meta row */}
      <div className="sp-fr-meta">
        <span className="sp-fr-by">
          by <strong>{request.requestedBy.name}</strong>
        </span>
        <button
          className="sp-vote-btn"
          onClick={(e) => {
            e.stopPropagation();
            onVote();
          }}
          aria-label={`Vote for ${request.title}`}
        >
          <ThumbsUp size={12} />
          {request.votes}
        </button>
      </div>

      {/* Requested date */}
      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
        Requested {formatDate(request.createdAt)}
      </span>
    </div>
  );
};

// ─── Feature Request Detail ───────────────────────────────────────────────────

interface FeatureRequestDetailProps {
  request: FeatureRequest;
  onBack: () => void;
  onStatusChange: (status: string) => void;
}

const FeatureRequestDetail: React.FC<FeatureRequestDetailProps> = ({
  request,
  onBack,
  onStatusChange,
}) => {
  const adminActions: {
    label: string;
    status: string;
    icon: React.ReactNode;
    colorClass: string;
    style: React.CSSProperties;
  }[] = [
    {
      label: 'Approve',
      status: 'Approved',
      icon: <Check size={14} />,
      colorClass: 'sp-btn',
      style: { background: '#16a34a', color: '#fff' },
    },
    {
      label: 'Reject',
      status: 'Rejected',
      icon: <X size={14} />,
      colorClass: 'sp-btn',
      style: { background: '#dc2626', color: '#fff' },
    },
    {
      label: 'Planned',
      status: 'Planned',
      icon: <Star size={14} />,
      colorClass: 'sp-btn',
      style: { background: '#0369a1', color: '#fff' },
    },
    {
      label: 'In Progress',
      status: 'In Progress',
      icon: <Clock size={14} />,
      colorClass: 'sp-btn',
      style: { background: '#ea580c', color: '#fff' },
    },
    {
      label: 'Completed',
      status: 'Completed',
      icon: <Check size={14} />,
      colorClass: 'sp-btn',
      style: { background: '#0d9488', color: '#fff' },
    },
  ];

  return (
    <>
      {/* Back button */}
      <button
        className="sp-btn sp-btn-ghost"
        onClick={onBack}
        style={{ marginBottom: '16px', color: '#2563eb', padding: '0 4px' }}
      >
        <ArrowLeft size={15} />
        Back to Requests
      </button>

      {/* Detail card */}
      <div className="sp-card sp-card-pad" style={{ padding: '24px' }}>
        {/* Title + badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          <div>
            <h1
              style={{
                margin: '0 0 6px',
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              {request.title}
            </h1>
            <span className={getStatusBadgeClass(request.status)}>
              {request.status}
            </span>
          </div>
          <span
            style={{
              fontSize: '0.72rem',
              color: '#94a3b8',
              flexShrink: 0,
              paddingTop: '4px',
            }}
          >
            #{request.requestId}
          </span>
        </div>

        {/* Full description */}
        <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: '1.6', marginBottom: '20px' }}>
          {request.description}
        </p>

        {/* Meta grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            borderTop: '1px solid #f1f5f9',
            paddingTop: '16px',
            marginBottom: '20px',
          }}
        >
          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', margin: '0 0 4px' }}>
              Requested By
            </p>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', margin: '0 0 2px' }}>
              {request.requestedBy.name}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
              {request.requestedBy.email}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', margin: '0 0 4px' }}>
              Votes
            </p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb', margin: 0, lineHeight: 1 }}>
              {request.votes}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', margin: '0 0 4px' }}>
              Requested
            </p>
            <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0 }}>
              {formatDate(request.createdAt)}
            </p>
          </div>
        </div>

        {/* Benefit */}
        <div
          style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '20px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
          }}
        >
          <Lightbulb size={16} color="#0369a1" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0369a1', margin: '0 0 3px' }}>
              Benefit
            </p>
            <p style={{ fontSize: '0.83rem', color: '#0c4a6e', margin: 0 }}>
              {request.benefit}
            </p>
          </div>
        </div>

        {/* Comments (if any) */}
        {request.comments && (
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginBottom: '20px' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', margin: '0 0 6px' }}>
              Admin Comments
            </p>
            <p style={{ fontSize: '0.83rem', color: '#374151', lineHeight: '1.5', margin: 0 }}>
              {request.comments}
            </p>
          </div>
        )}

        {/* Admin status change buttons */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', margin: '0 0 10px' }}>
            Change Status
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {adminActions.map((action) => (
              <button
                key={action.status}
                className={action.colorClass}
                style={action.style}
                onClick={() => onStatusChange(action.status)}
                disabled={request.status === action.status}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

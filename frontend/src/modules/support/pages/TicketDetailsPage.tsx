import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Download,
  Share2,
  AlertCircle,
  CheckCircle,
  UserPlus,
  ExternalLink,
} from 'lucide-react';
import {
  useTicketDetail,
  useUpdateTicketStatus,
  useAddMessage,
  useAssignTicket,
  useEscalateTicket,
  useUpdateAdminNotes,
} from '../hooks/useTickets';
import { TicketInfoCard, UserInfoCard, SystemInfoCard } from '../components/TicketInfoCard';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/BadgeComponents';
import { MessageThread, ReplyForm } from '../components/MessageThread';
import { TicketStatus } from '../types';
import { getNextStatusOptions } from '../utils/ticketUtils';

interface TicketDetailsPageProps {
  ticketId?: string;
  onBack?: () => void;
}

export const TicketDetailsPage: React.FC<TicketDetailsPageProps> = ({
  ticketId: propTicketId,
  onBack: propOnBack,
}) => {
  const { ticketId: routeTicketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();

  const ticketId = propTicketId || routeTicketId || '';
  const onBack = propOnBack || (() => navigate(-1));

  const { data: ticket, isLoading } = useTicketDetail(ticketId);
  const updateStatus = useUpdateTicketStatus();
  const addMessage = useAddMessage();
  const assignTicket = useAssignTicket();
  const escalateTicket = useEscalateTicket();
  const updateAdminNotes = useUpdateAdminNotes();

  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Sync admin notes state when ticket finishes loading
  React.useEffect(() => {
    if (ticket) {
      setAdminNotes(ticket.adminNotes || '');
    }
  }, [ticket]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-32 animate-pulse rounded bg-gray-200"></div>
        <div className="grid gap-6 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-lg border border-gray-200 bg-gray-50"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
        <p className="text-red-800 font-medium">Ticket not found</p>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ChevronLeft className="h-4 w-4" />
            Go Back
          </button>
        )}
      </div>
    );
  }

  const nextStatusOptions = getNextStatusOptions(ticket.status);

  const handleSaveNotes = () => {
    updateAdminNotes.mutate(
      { ticketId: ticket.ticketId, notes: adminNotes },
      {
        onSuccess: () => {
          setIsEditingNotes(false);
        },
      }
    );
  };

  const handleAssignAgent = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const adminId = e.target.value;
    if (adminId) {
      assignTicket.mutate({ ticketId: ticket.ticketId, adminId });
    }
  };

  const handleEscalate = () => {
    const reason = prompt('Please enter the reason for escalation:');
    if (reason) {
      escalateTicket.mutate({ ticketId: ticket.ticketId, reason });
    }
  };

  const handleMarkResolved = () => {
    updateStatus.mutate({ ticketId: ticket.ticketId, status: TicketStatus.RESOLVED });
  };

  const handleCloseTicket = () => {
    updateStatus.mutate({ ticketId: ticket.ticketId, status: TicketStatus.CLOSED });
  };

  const handleReviewIssue = () => {
    const category = ticket.category?.toLowerCase() || '';
    const title = ticket.title?.toLowerCase() || '';
    const desc = ticket.description?.toLowerCase() || '';
    const url = ticket.systemInfo?.currentPageUrl || '';

    // Check if it's transaction/billing related
    if (
      category.includes('billing') ||
      category.includes('transaction') ||
      title.includes('transaction') ||
      title.includes('payment') ||
      title.includes('billing') ||
      desc.includes('transaction') ||
      desc.includes('payment') ||
      desc.includes('billing') ||
      url.includes('payments') ||
      url.includes('transaction')
    ) {
      navigate('/admin/transaction-review');
    }
    // Check if it's account/users related
    else if (
      category.includes('account') ||
      title.includes('account') ||
      title.includes('user') ||
      title.includes('profile') ||
      desc.includes('account') ||
      desc.includes('user') ||
      desc.includes('profile') ||
      url.includes('user') ||
      url.includes('profile')
    ) {
      navigate('/admin/users');
    }
    // Check if it's login/auth/permissions related
    else if (
      title.includes('login') ||
      title.includes('signup') ||
      title.includes('password') ||
      title.includes('permission') ||
      title.includes('role') ||
      desc.includes('login') ||
      desc.includes('signup') ||
      desc.includes('password') ||
      desc.includes('permission') ||
      desc.includes('role') ||
      url.includes('login') ||
      url.includes('signup') ||
      url.includes('permission')
    ) {
      navigate('/admin/permissions');
    }
    // Default fallback to admin dashboard
    else {
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Tickets
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{ticket.ticketId}</h1>
            <StatusBadge status={ticket.status} size="lg" />
          </div>
          <p className="mt-2 text-gray-600">{ticket.title}</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Status and Priority Bar */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 flex items-center justify-between shadow-sm">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Status</p>
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="flex items-center gap-2 rounded-md hover:bg-gray-50 px-2 py-1 border border-transparent hover:border-gray-200 transition-colors"
              >
                <StatusBadge status={ticket.status} />
              </button>
              {showStatusMenu && nextStatusOptions.length > 0 && (
                <div className="absolute top-full mt-2 left-0 rounded-lg border border-gray-200 bg-white shadow-lg z-10 min-w-[150px]">
                  {nextStatusOptions.map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        updateStatus.mutate({ ticketId: ticket.ticketId, status });
                        setShowStatusMenu(false);
                      }}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Priority</p>
            <PriorityBadge priority={ticket.priority} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Category</p>
            <span className="inline-block rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 border border-gray-200">
              {ticket.category}
            </span>
          </div>
          
          {/* Assignment Selection Option */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Assigned Agent</p>
            <div className="flex items-center gap-2">
              <select
                value={ticket.assignedTo?.id || ''}
                onChange={handleAssignAgent}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                <option value="admin-1">Alice Johnson</option>
                <option value="admin-2">Bob Smith</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Info */}
          <TicketInfoCard
            title={ticket.title}
            description={ticket.description}
            createdAt={ticket.createdAt}
            updatedAt={ticket.updatedAt}
          />

          {/* Messages */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Conversation ({ticket.messages.length})
            </h2>
            <MessageThread messages={ticket.messages} />
          </div>

          {/* Reply Form */}
          <ReplyForm
            onSubmit={async (message) => {
              await addMessage.mutateAsync({
                ticketId: ticket.ticketId,
                message,
                isAdminReply: true,
              });
            }}
            isLoading={addMessage.isLoading}
          />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* User Info */}
          <UserInfoCard user={ticket.user} />

          {/* System Info */}
          <SystemInfoCard systemInfo={ticket.systemInfo} />

          {/* Admin Notes */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Admin Notes</h3>
              {!isEditingNotes && (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Edit
                </button>
              )}
            </div>
            {isEditingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setIsEditingNotes(false)}
                    className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    disabled={updateAdminNotes.isLoading}
                    className="px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:bg-gray-400"
                  >
                    {updateAdminNotes.isLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed">
                {adminNotes || 'No notes added yet'}
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={handleReviewIssue}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 transition-all border border-blue-700 text-sm shadow-sm mb-3"
              >
                <ExternalLink className="h-4 w-4" />
                Review Issue Page
              </button>
              {ticket.status !== TicketStatus.RESOLVED && (
                <button
                  onClick={handleMarkResolved}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-50 px-4 py-2.5 font-semibold text-green-700 hover:bg-green-100 transition-all border border-green-200 text-sm shadow-sm"
                >
                  <CheckCircle className="h-4 w-4" />
                  Mark Resolved
                </button>
              )}
              <button
                onClick={handleEscalate}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-50 px-4 py-2.5 font-semibold text-orange-700 hover:bg-orange-100 transition-all border border-orange-200 text-sm shadow-sm"
              >
                <AlertCircle className="h-4 w-4" />
                Escalate Ticket
              </button>
              {ticket.status !== TicketStatus.CLOSED && (
                <button
                  onClick={handleCloseTicket}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 font-semibold text-red-700 hover:bg-red-100 transition-all border border-red-200 text-sm shadow-sm"
                >
                  Close Ticket
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


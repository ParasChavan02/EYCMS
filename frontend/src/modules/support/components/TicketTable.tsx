import React from 'react';
import { ChevronRight, MoreVertical } from 'lucide-react';
import { Ticket } from '../types';
import { PriorityBadge } from './BadgeComponents';
import { StatusBadge } from './StatusBadge';
import { formatDateRelative } from '../utils/ticketUtils';

interface TicketRowProps {
  ticket: Ticket;
  onSelectTicket: (ticket: Ticket) => void;
  onMoreActions?: (ticket: Ticket) => void;
}

export const TicketRow: React.FC<TicketRowProps> = ({
  ticket,
  onSelectTicket,
  onMoreActions,
}) => {
  return (
    <tr
      onClick={() => onSelectTicket(ticket)}
      className="cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors"
    >
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">{ticket.ticketId}</div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">{ticket.user.name}</div>
        <div className="text-xs text-gray-500">{ticket.user.email}</div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-700">{ticket.category}</div>
      </td>
      <td className="px-6 py-4">
        <PriorityBadge priority={ticket.priority} size="sm" />
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={ticket.status} size="sm" />
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-600">
          {formatDateRelative(ticket.createdAt)}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectTicket(ticket);
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            View <ChevronRight className="h-4 w-4" />
          </button>
          {onMoreActions && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoreActions(ticket);
              }}
              className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

interface TicketTableProps {
  tickets: Ticket[];
  isLoading?: boolean;
  onSelectTicket: (ticket: Ticket) => void;
  onMoreActions?: (ticket: Ticket) => void;
}

export const TicketTable: React.FC<TicketTableProps> = ({
  tickets,
  isLoading = false,
  onSelectTicket,
  onMoreActions,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="animate-pulse p-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="mb-4 h-12 rounded bg-gray-200"></div>
          ))}
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
        <p className="text-gray-500">No tickets found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
              Ticket ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
              Priority
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
              Created Date
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              onSelectTicket={onSelectTicket}
              onMoreActions={onMoreActions}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};


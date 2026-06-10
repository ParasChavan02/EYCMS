import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Ticket,
  TicketFilter,
  PaginatedResponse,
  TicketStatus,
} from '../types';
import { ticketService } from '../services/ticketService';

export const useTickets = (
  page = 1,
  pageSize = 10,
  filters?: TicketFilter
) => {
  return useQuery<PaginatedResponse<Ticket>>(
    ['tickets', page, pageSize, filters],
    () => ticketService.getAllTickets(page, pageSize, filters),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};

export const useOpenTickets = (page = 1, pageSize = 10) => {
  return useQuery<PaginatedResponse<Ticket>>(
    ['open-tickets', page, pageSize],
    () => ticketService.getOpenTickets(page, pageSize),
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );
};

export const useCriticalTickets = (page = 1, pageSize = 10) => {
  return useQuery<PaginatedResponse<Ticket>>(
    ['critical-tickets', page, pageSize],
    () => ticketService.getCriticalTickets(page, pageSize),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes for critical
      cacheTime: 5 * 60 * 1000,
    }
  );
};

export const useTicketDetail = (ticketId: string) => {
  return useQuery<Ticket>(
    ['ticket', ticketId],
    () => ticketService.getTicketById(ticketId),
    {
      enabled: !!ticketId,
      staleTime: 5 * 60 * 1000,
    }
  );
};

export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (params: { ticketId: string; status: TicketStatus }) =>
      ticketService.updateTicketStatus(params.ticketId, params.status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tickets');
        queryClient.invalidateQueries('open-tickets');
        queryClient.invalidateQueries('critical-tickets');
      },
    }
  );
};

export const useAssignTicket = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (params: { ticketId: string; adminId: string }) =>
      ticketService.assignTicket(params.ticketId, params.adminId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tickets');
      },
    }
  );
};

export const useAddMessage = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (params: {
      ticketId: string;
      message: string;
      attachments?: any[];
      isAdminReply: boolean;
    }) =>
      ticketService.addMessage(
        params.ticketId,
        params.message,
        params.attachments,
        params.isAdminReply
      ),
    {
      onSuccess: (_, params) => {
        queryClient.invalidateQueries(['ticket', params.ticketId]);
      },
    }
  );
};

export const useUpdateAdminNotes = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (params: { ticketId: string; notes: string }) =>
      ticketService.updateAdminNotes(params.ticketId, params.notes),
    {
      onSuccess: (_, params) => {
        queryClient.invalidateQueries(['ticket', params.ticketId]);
      },
    }
  );
};

export const useEscalateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (params: { ticketId: string; reason: string }) =>
      ticketService.escalateTicket(params.ticketId, params.reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tickets');
        queryClient.invalidateQueries('critical-tickets');
      },
    }
  );
};


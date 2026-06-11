import { useQuery, useMutation, useQueryClient } from 'react-query';
import { AnalyticsData, ServiceStatus, NotificationPayload } from '../../types/support';
import {
  analyticsService,
  serviceStatusService,
  notificationService,
} from '../../services/support/ticketService';

// ============ ANALYTICS HOOKS ============

export const useAnalytics = () => {
  return useQuery<AnalyticsData>(
    ['analytics'],
    () => analyticsService.getAnalytics(),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 15 * 60 * 1000,
    }
  );
};

export const useTicketStats = () => {
  return useQuery(
    ['ticket-stats'],
    () => analyticsService.getTicketStats(),
    {
      staleTime: 10 * 60 * 1000,
      cacheTime: 15 * 60 * 1000,
    }
  );
};

// ============ SERVICE STATUS HOOKS ============

export const useServiceStatus = () => {
  return useQuery<ServiceStatus[]>(
    ['service-status'],
    () => serviceStatusService.getServiceStatus(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 30 * 1000, // Refetch every 30 seconds
    }
  );
};

export const useCheckService = (service?: string) => {
  const queryClient = useQueryClient();

  return useMutation(
    (serviceName: string) => serviceStatusService.checkService(serviceName),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('service-status');
      },
    }
  );
};

// ============ NOTIFICATION HOOKS ============

export const useNotifications = () => {
  return useQuery<NotificationPayload[]>(
    ['notifications'],
    () => notificationService.getNotifications(),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchInterval: 30 * 1000, // Refetch every 30 seconds
    }
  );
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (notificationId: string) =>
      notificationService.markAsRead(notificationId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications');
      },
    }
  );
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation(() => notificationService.markAllAsRead(), {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications');
    },
  });
};

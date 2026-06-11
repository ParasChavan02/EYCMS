import {
  Ticket,
  FeatureRequest,
  ServiceStatus,
  AnalyticsData,
  NotificationPayload,
  TicketFilter,
  PaginatedResponse,
  TicketStatus,
  TicketMessage,
} from '../../types/support';
import {
  mockTickets,
  mockFeatureRequests,
  mockServiceStatus,
  mockAnalyticsData,
  mockNotifications,
} from './mockData';

// Simulate API delay
const delay = (ms = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ============ TICKET SERVICES ============

export const ticketService = {
  // Fetch all tickets with pagination
  getAllTickets: async (
    page = 1,
    pageSize = 10,
    filters?: TicketFilter
  ): Promise<PaginatedResponse<Ticket>> => {
    await delay();

    let filteredTickets = [...mockTickets];

    // Apply filters
    if (filters) {
      if (filters.category) {
        filteredTickets = filteredTickets.filter(
          (t) => t.category === filters.category
        );
      }
      if (filters.priority) {
        filteredTickets = filteredTickets.filter(
          (t) => t.priority === filters.priority
        );
      }
      if (filters.status) {
        filteredTickets = filteredTickets.filter(
          (t) => t.status === filters.status
        );
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredTickets = filteredTickets.filter(
          (t) =>
            t.ticketId.toLowerCase().includes(query) ||
            t.user.name.toLowerCase().includes(query) ||
            t.user.email.toLowerCase().includes(query) ||
            t.title.toLowerCase().includes(query)
        );
      }
      if (filters.dateRange) {
        const start = new Date(filters.dateRange.startDate).getTime();
        const end = new Date(filters.dateRange.endDate).getTime();
        filteredTickets = filteredTickets.filter((t) => {
          const created = new Date(t.createdAt).getTime();
          return created >= start && created <= end;
        });
      }
      if (filters.assignedTo) {
        filteredTickets = filteredTickets.filter(
          (t) => t.assignedTo?.id === filters.assignedTo
        );
      }
    }

    // Sort by creation date (newest first)
    filteredTickets.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Paginate
    const total = filteredTickets.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedData = filteredTickets.slice(
      startIndex,
      startIndex + pageSize
    );

    return {
      data: paginatedData,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  // Fetch open tickets
  getOpenTickets: async (
    page = 1,
    pageSize = 10
  ): Promise<PaginatedResponse<Ticket>> => {
    await delay();
    const openTickets = mockTickets.filter(
      (t) =>
        t.status === TicketStatus.OPEN ||
        t.status === TicketStatus.ASSIGNED ||
        t.status === TicketStatus.IN_PROGRESS ||
        t.status === TicketStatus.WAITING_RESPONSE
    );

    openTickets.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = openTickets.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedData = openTickets.slice(startIndex, startIndex + pageSize);

    return {
      data: paginatedData,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  // Fetch critical tickets
  getCriticalTickets: async (
    page = 1,
    pageSize = 10
  ): Promise<PaginatedResponse<Ticket>> => {
    await delay();
    const criticalTickets = mockTickets.filter(
      (t) => t.priority === 'Critical'
    );

    criticalTickets.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = criticalTickets.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedData = criticalTickets.slice(
      startIndex,
      startIndex + pageSize
    );

    return {
      data: paginatedData,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  // Fetch single ticket
  getTicketById: async (ticketId: string): Promise<Ticket> => {
    await delay();
    const ticket = mockTickets.find((t) => t.ticketId === ticketId);
    if (!ticket) throw new Error('Ticket not found');
    return ticket;
  },

  // Update ticket status
  updateTicketStatus: async (
    ticketId: string,
    status: TicketStatus
  ): Promise<Ticket> => {
    await delay();
    const ticket = mockTickets.find((t) => t.ticketId === ticketId);
    if (!ticket) throw new Error('Ticket not found');

    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();

    if (status === TicketStatus.RESOLVED) {
      ticket.resolvedAt = new Date().toISOString();
    }
    if (status === TicketStatus.CLOSED) {
      ticket.closedAt = new Date().toISOString();
    }

    return ticket;
  },

  // Assign ticket
  assignTicket: async (ticketId: string, adminId: string): Promise<Ticket> => {
    await delay();
    const ticket = mockTickets.find((t) => t.ticketId === ticketId);
    if (!ticket) throw new Error('Ticket not found');

    ticket.assignedTo = {
      id: adminId,
      name: adminId === 'admin-1' ? 'Alice Johnson' : 'Bob Smith',
      email:
        adminId === 'admin-1' ? 'alice@support.team' : 'bob@support.team',
    };
    ticket.status = TicketStatus.ASSIGNED;
    ticket.updatedAt = new Date().toISOString();

    return ticket;
  },

  // Add message to ticket
  addMessage: async (
    ticketId: string,
    message: string,
    attachments: any[] = [],
    isAdminReply = false
  ): Promise<TicketMessage> => {
    await delay();
    const ticket = mockTickets.find((t) => t.ticketId === ticketId);
    if (!ticket) throw new Error('Ticket not found');

    const newMessage: TicketMessage = {
      id: `msg-${Date.now()}`,
      ticketId,
      sender: isAdminReply
        ? {
            id: 'admin-1',
            name: 'Alice Johnson',
            email: 'alice@support.team',
          }
        : ticket.user,
      message,
      attachments,
      createdAt: new Date().toISOString(),
      isAdminReply,
    };

    ticket.messages.push(newMessage);
    ticket.updatedAt = new Date().toISOString();

    return newMessage;
  },

  // Update admin notes
  updateAdminNotes: async (ticketId: string, notes: string): Promise<Ticket> => {
    await delay();
    const ticket = mockTickets.find((t) => t.ticketId === ticketId);
    if (!ticket) throw new Error('Ticket not found');

    ticket.adminNotes = notes;
    ticket.updatedAt = new Date().toISOString();

    return ticket;
  },

  // Escalate ticket
  escalateTicket: async (
    ticketId: string,
    reason: string
  ): Promise<Ticket> => {
    await delay();
    const ticket = mockTickets.find((t) => t.ticketId === ticketId);
    if (!ticket) throw new Error('Ticket not found');

    ticket.priority = 'Critical';
    ticket.adminNotes = `Escalated: ${reason}`;
    ticket.updatedAt = new Date().toISOString();

    return ticket;
  },
};

// ============ FEATURE REQUEST SERVICES ============

export const featureRequestService = {
  // Fetch all feature requests
  getAllRequests: async (
    page = 1,
    pageSize = 10
  ): Promise<PaginatedResponse<FeatureRequest>> => {
    await delay();

    const sortedRequests = [...mockFeatureRequests].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = sortedRequests.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedData = sortedRequests.slice(
      startIndex,
      startIndex + pageSize
    );

    return {
      data: paginatedData,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  // Update feature request status
  updateStatus: async (
    requestId: string,
    status: string,
    comments?: string
  ): Promise<FeatureRequest> => {
    await delay();
    const request = mockFeatureRequests.find(
      (r) => r.requestId === requestId
    );
    if (!request) throw new Error('Feature request not found');

    request.status = status as any;
    request.updatedAt = new Date().toISOString();
    if (comments) request.comments = comments;

    return request;
  },

  // Vote on feature request
  voteOnRequest: async (requestId: string): Promise<FeatureRequest> => {
    await delay();
    const request = mockFeatureRequests.find(
      (r) => r.requestId === requestId
    );
    if (!request) throw new Error('Feature request not found');

    request.votes++;
    return request;
  },
};

// ============ SERVICE STATUS SERVICES ============

export const serviceStatusService = {
  // Fetch all service statuses
  getServiceStatus: async (): Promise<ServiceStatus[]> => {
    await delay();
    return mockServiceStatus;
  },

  // Check specific service
  checkService: async (service: string): Promise<ServiceStatus> => {
    await delay();
    const status = mockServiceStatus.find((s) => s.service === service);
    if (!status) throw new Error('Service not found');

    // Simulate real-time check
    status.lastChecked = new Date().toISOString();
    return status;
  },
};

// ============ ANALYTICS SERVICES ============

export const analyticsService = {
  // Fetch analytics data
  getAnalytics: async (): Promise<AnalyticsData> => {
    await delay();
    return mockAnalyticsData;
  },

  // Get ticket statistics
  getTicketStats: async () => {
    await delay();
    return {
      totalTickets: mockAnalyticsData.totalTickets,
      openTickets: mockAnalyticsData.openTickets,
      resolvedTickets: mockAnalyticsData.resolvedTickets,
      criticalTickets: mockAnalyticsData.criticalTickets,
      averageResolutionTime: mockAnalyticsData.averageResolutionTime,
      resolutionRate: mockAnalyticsData.resolutionRate,
    };
  },
};

// ============ NOTIFICATION SERVICES ============

export const notificationService = {
  // Fetch notifications
  getNotifications: async (): Promise<NotificationPayload[]> => {
    await delay();
    return mockNotifications;
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<NotificationPayload> => {
    await delay();
    const notification = mockNotifications.find((n) => n.id === notificationId);
    if (!notification) throw new Error('Notification not found');

    notification.read = true;
    return notification;
  },

  // Mark all as read
  markAllAsRead: async (): Promise<void> => {
    await delay();
    mockNotifications.forEach((n) => (n.read = true));
  },
};

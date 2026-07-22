import axios from "axios";
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
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("current_user");
      if (!window.location.pathname.endsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);


// Helper to determine if current user is admin/finance
const checkIsAdmin = (): boolean => {
  const userStr = localStorage.getItem("current_user");
  if (!userStr) return false;
  try {
    const user = JSON.parse(userStr);
    const role = user?.role?.toUpperCase();
    return role === "ADMIN" || role === "SUPER_ADMIN" || role === "ACCOUNTS";
  } catch (e) {
    return false;
  }
};

const mapTicketFromApi = (ticket: any): Ticket => {
  if (!ticket) return ticket;
  return {
    ...ticket,
    ticketId: ticket.ticket_id || ticket.ticketId,
    title: ticket.issue || ticket.title,
    createdAt: ticket.created_at || ticket.createdAt,
    updatedAt: ticket.updated_at || ticket.updatedAt,
    resolvedAt: ticket.resolved_at || ticket.resolvedAt,
    closedAt: ticket.closed_at || ticket.closedAt,
    assignedTo: ticket.assigned_to ? {
      ...ticket.assigned_to,
      phone: ticket.assigned_to.phone || "N/A",
      organization: ticket.assigned_to.organization || "E-YUVA Project"
    } : undefined,
    adminNotes: ticket.admin_notes || ticket.adminNotes,
    estimatedResolutionTime: ticket.estimated_resolution_time || ticket.estimatedResolutionTime,
    messages: (ticket.messages || []).map((msg: any) => ({
      ...msg,
      ticketId: msg.ticket_id || msg.ticketId,
      createdAt: msg.created_at || msg.createdAt,
      isAdminReply: msg.is_admin_reply !== undefined ? msg.is_admin_reply : msg.isAdminReply
    }))
  };
};

// ============ TICKET SERVICES ============

export const ticketService = {
  // Fetch all tickets with pagination
  getAllTickets: async (
    page = 1,
    pageSize = 10,
    filters?: TicketFilter
  ): Promise<PaginatedResponse<Ticket>> => {
    const isAdmin = checkIsAdmin();
    const url = isAdmin ? "/admin/support/tickets" : "/user/support/tickets";
    
    const params: any = {};
    if (isAdmin && filters) {
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.category) params.category = filters.category;
      if (filters.searchQuery) params.search = filters.searchQuery;
    }

    const response = await api.get(url, { params });
    const list = response.data.data || [];
    const mappedData = list.map(mapTicketFromApi);

    // Paginate client-side to fit UI paginator
    const total = mappedData.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedData = mappedData.slice(startIndex, startIndex + pageSize);

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
    const isAdmin = checkIsAdmin();
    const url = isAdmin ? "/admin/support/tickets" : "/user/support/tickets";
    const params = isAdmin ? { status: "OPEN_DESK" } : {};

    const response = await api.get(url, { params });
    const list = response.data.data || [];
    const mappedData = list.map(mapTicketFromApi);

    const total = mappedData.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedData = mappedData.slice(startIndex, startIndex + pageSize);

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
    const isAdmin = checkIsAdmin();
    const url = isAdmin ? "/admin/support/tickets" : "/user/support/tickets";
    const params = isAdmin ? { priority: "CRITICAL" } : {};

    const response = await api.get(url, { params });
    const list = response.data.data || [];
    const mappedData = list.map(mapTicketFromApi);

    const total = mappedData.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedData = mappedData.slice(startIndex, startIndex + pageSize);

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
    const isAdmin = checkIsAdmin();
    const url = isAdmin ? `/admin/support/tickets/${ticketId}` : `/user/support/tickets/${ticketId}`;
    const response = await api.get(url);
    return mapTicketFromApi(response.data.data);
  },

  // Create ticket (User raises support issue)
  createTicket: async (
    issue: string,
    description: string,
    category: string,
    priority: string = "MEDIUM",
    screenshotPath?: string
  ): Promise<Ticket> => {
    const response = await api.post("/user/support/ticket", {
      issue,
      description,
      category,
      priority,
      screenshot_path: screenshotPath
    });
    return mapTicketFromApi(response.data.data);
  },

  // Update ticket status
  updateTicketStatus: async (
    ticketId: string,
    status: TicketStatus
  ): Promise<Ticket> => {
    const isAdmin = checkIsAdmin();
    if (!isAdmin) {
      throw new Error("Only administrators can update ticket status.");
    }
    const response = await api.patch(`/admin/support/tickets/${ticketId}/status`, { status });
    return mapTicketFromApi(response.data.data);
  },

  // Assign ticket
  assignTicket: async (ticketId: string, adminId: string): Promise<Ticket> => {
    const response = await api.patch(`/admin/support/tickets/${ticketId}/assign`, { admin_id: adminId });
    return mapTicketFromApi(response.data.data);
  },

  // Add message to ticket
  addMessage: async (
    ticketId: string,
    message: string,
    attachments: any[] = [],
    isAdminReply = false
  ): Promise<TicketMessage> => {
    const url = isAdminReply 
      ? `/admin/support/tickets/${ticketId}/message` 
      : `/user/support/tickets/${ticketId}/message`;
    const response = await api.post(url, { message, attachments });
    const msg = response.data.data;
    return {
      ...msg,
      ticketId: msg.ticket_id || msg.ticketId,
      createdAt: msg.created_at || msg.createdAt,
      isAdminReply: msg.is_admin_reply !== undefined ? msg.is_admin_reply : msg.isAdminReply
    };
  },

  // Update admin notes
  updateAdminNotes: async (ticketId: string, notes: string): Promise<Ticket> => {
    const response = await api.patch(`/admin/support/tickets/${ticketId}/notes`, { notes });
    return mapTicketFromApi(response.data.data);
  },

  // Escalate ticket
  escalateTicket: async (
    ticketId: string,
    reason: string
  ): Promise<Ticket> => {
    const response = await api.post(`/admin/support/tickets/${ticketId}/escalate`, { reason });
    return mapTicketFromApi(response.data.data);
  },
};

// ============ FEATURE REQUEST SERVICES ============

export const featureRequestService = {
  getAllRequests: async (
    page = 1,
    pageSize = 10
  ): Promise<PaginatedResponse<FeatureRequest>> => {
    try {
      const response = await api.get("/support/feature-requests");
      const list = response.data.data || [];
      const mappedList: FeatureRequest[] = list.map((fr: any) => ({
        id: fr.id,
        requestId: fr.requestId || fr.request_id,
        requestedBy: fr.requestedBy || fr.requested_by || { id: "u-1", name: "User", email: "user@eyuva.org" },
        title: fr.title,
        description: fr.description,
        benefit: fr.benefit,
        votes: fr.votes || 1,
        status: fr.status || "Open",
        createdAt: fr.createdAt || fr.created_at,
        updatedAt: fr.updatedAt || fr.updated_at,
        comments: fr.comments
      }));
      const total = mappedList.length;
      const startIndex = (page - 1) * pageSize;
      return {
        data: mappedList.slice(startIndex, startIndex + pageSize),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      };
    } catch (e) {
      console.error("Failed to fetch feature requests from backend", e);
      return {
        data: [],
        total: 0,
        page: 1,
        pageSize,
        totalPages: 1
      };
    }
  },

  createRequest: async (
    title: string,
    description: string,
    benefit: string
  ): Promise<any> => {
    const response = await api.post("/support/feature-request", {
      title,
      description,
      benefit
    });
    return response.data.data;
  },

  updateStatus: async (
    requestId: string,
    status: string,
    comments?: string
  ): Promise<FeatureRequest> => {
    const response = await api.patch(`/support/feature-requests/${requestId}/status`, {
      status,
      comments
    });
    return response.data.data;
  },

  voteOnRequest: async (requestId: string): Promise<FeatureRequest> => {
    const response = await api.post(`/support/feature-requests/${requestId}/vote`);
    return response.data.data;
  },
};

// ============ SERVICE STATUS SERVICES ============

export const serviceStatusService = {
  getServiceStatus: async (): Promise<ServiceStatus[]> => {
    return mockServiceStatus;
  },

  checkService: async (service: string): Promise<ServiceStatus> => {
    const status = mockServiceStatus.find((s) => s.service === service);
    if (!status) throw new Error('Service not found');
    status.lastChecked = new Date().toISOString();
    return status;
  },
};

// ============ ANALYTICS SERVICES ============

export const analyticsService = {
  getAnalytics: async (): Promise<AnalyticsData> => {
    return mockAnalyticsData;
  },

  getTicketStats: async () => {
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
  getNotifications: async (): Promise<NotificationPayload[]> => {
    const response = await api.get("/notifications");
    return response.data.data.map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.is_read,
      createdAt: n.created_at || new Date().toISOString(),
    }));
  },

  markAsRead: async (notificationId: string): Promise<NotificationPayload> => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    const n = response.data.data;
    return {
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.is_read,
      createdAt: n.created_at,
    };
  },

  markAllAsRead: async (): Promise<void> => {
    await api.post("/notifications/read-all");
  },
};

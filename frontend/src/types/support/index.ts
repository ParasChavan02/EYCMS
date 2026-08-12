// Ticket Types
export enum TicketPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export enum TicketStatus {
  OPEN = 'Open',
  ASSIGNED = 'Assigned',
  IN_PROGRESS = 'In Progress',
  WAITING_RESPONSE = 'Waiting Response',
  RESOLVED = 'Resolved',
  CLOSED = 'Closed',
}

export enum TicketCategory {
  BUG = 'Bug',
  FEATURE = 'Feature',
  INTEGRATION = 'Integration',
  BILLING = 'Billing',
  ACCOUNT = 'Account',
  PERFORMANCE = 'Performance',
  SECURITY = 'Security',
  OTHER = 'Other',
}

export interface SupportUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  avatar?: string;
}

export interface TicketAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
  uploadedAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  sender: SupportUser;
  message: string;
  attachments: TicketAttachment[];
  createdAt: string;
  isAdminReply: boolean;
}

export interface Ticket {
  id: string;
  ticketId: string;
  user: SupportUser;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: SupportUser;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  attachments: TicketAttachment[];
  messages: TicketMessage[];
  systemInfo: SystemInfo;
  adminNotes?: string;
  estimatedResolutionTime?: string;
  resolutionNotes?: string;
}

export interface SystemInfo {
  browser: string;
  browserVersion: string;
  deviceType: 'Desktop' | 'Tablet' | 'Mobile';
  operatingSystem: string;
  currentPageUrl: string;
  timestamp: string;
  screenResolution?: string;
  userAgent?: string;
}

export interface FeatureRequest {
  id: string;
  requestId: string;
  requestedBy: SupportUser;
  title: string;
  description: string;
  benefit: string;
  votes: number;
  status: 'Open' | 'Approved' | 'Rejected' | 'Planned' | 'In Progress' | 'Completed';
  createdAt: string;
  updatedAt: string;
  comments?: string;
}

export interface ServiceStatus {
  service: 'Server' | 'Database' | 'Authentication' | 'Email Service' | 'Storage Service';
  status: 'Healthy' | 'Warning' | 'Down';
  lastChecked: string;
  responseTime?: number;
  message?: string;
}

export interface AnalyticsData {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  criticalTickets: number;
  averageResolutionTime: number;
  resolutionRate: number;
  ticketsByCategory: { category: TicketCategory; count: number }[];
  ticketsByPriority: { priority: TicketPriority; count: number }[];
  monthlyTrend: { month: string; tickets: number }[];
}

export interface NotificationPayload {
  id: string;
  type: 'new_ticket' | 'critical_ticket' | 'escalated_ticket' | 'ticket_resolved';
  title: string;
  message: string;
  ticketId?: string;
  read: boolean;
  createdAt: string;
}

export interface TicketFilter {
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  searchQuery?: string;
  assignedTo?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

import { TicketPriority, TicketStatus, TicketCategory } from '../types';

// Priority colors and styling
export const priorityConfig = {
  [TicketPriority.LOW]: {
    color: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
    badgeColor: 'bg-blue-500',
  },
  [TicketPriority.MEDIUM]: {
    color: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
    badgeColor: 'bg-yellow-500',
  },
  [TicketPriority.HIGH]: {
    color: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-200',
    badgeColor: 'bg-orange-500',
  },
  [TicketPriority.CRITICAL]: {
    color: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
    badgeColor: 'bg-red-500',
  },
};

// Status colors and styling
export const statusConfig = {
  [TicketStatus.OPEN]: {
    color: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-200',
    icon: 'CircleDot',
  },
  [TicketStatus.ASSIGNED]: {
    color: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
    icon: 'User',
  },
  [TicketStatus.IN_PROGRESS]: {
    color: 'bg-indigo-100',
    textColor: 'text-indigo-800',
    borderColor: 'border-indigo-200',
    icon: 'Clock',
  },
  [TicketStatus.WAITING_RESPONSE]: {
    color: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-200',
    icon: 'MessageCircle',
  },
  [TicketStatus.RESOLVED]: {
    color: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    icon: 'CheckCircle',
  },
  [TicketStatus.CLOSED]: {
    color: 'bg-gray-200',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-300',
    icon: 'X',
  },
};

// Category colors
export const categoryConfig = {
  [TicketCategory.BUG]: { color: 'bg-red-100', textColor: 'text-red-800' },
  [TicketCategory.FEATURE]: { color: 'bg-green-100', textColor: 'text-green-800' },
  [TicketCategory.INTEGRATION]: {
    color: 'bg-blue-100',
    textColor: 'text-blue-800',
  },
  [TicketCategory.BILLING]: {
    color: 'bg-yellow-100',
    textColor: 'text-yellow-800',
  },
  [TicketCategory.ACCOUNT]: {
    color: 'bg-purple-100',
    textColor: 'text-purple-800',
  },
  [TicketCategory.PERFORMANCE]: {
    color: 'bg-orange-100',
    textColor: 'text-orange-800',
  },
  [TicketCategory.SECURITY]: { color: 'bg-red-200', textColor: 'text-red-900' },
  [TicketCategory.OTHER]: { color: 'bg-gray-100', textColor: 'text-gray-800' },
};

// Format date
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format date relative (e.g., "2 hours ago")
export const formatDateRelative = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return formatDate(dateString);
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Get priority level
export const getPriorityLevel = (priority: TicketPriority): number => {
  const levels = {
    [TicketPriority.LOW]: 1,
    [TicketPriority.MEDIUM]: 2,
    [TicketPriority.HIGH]: 3,
    [TicketPriority.CRITICAL]: 4,
  };
  return levels[priority];
};

// Sort tickets by priority
export const sortByPriority = (a: any, b: any) => {
  return getPriorityLevel(b.priority) - getPriorityLevel(a.priority);
};

// Get color for status indicator
export const getStatusColor = (status: TicketStatus): string => {
  const colors = {
    [TicketStatus.OPEN]: 'bg-gray-400',
    [TicketStatus.ASSIGNED]: 'bg-blue-400',
    [TicketStatus.IN_PROGRESS]: 'bg-indigo-400',
    [TicketStatus.WAITING_RESPONSE]: 'bg-purple-400',
    [TicketStatus.RESOLVED]: 'bg-green-400',
    [TicketStatus.CLOSED]: 'bg-gray-500',
  };
  return colors[status];
};

// Get next status options
export const getNextStatusOptions = (currentStatus: TicketStatus): TicketStatus[] => {
  const statusFlow = {
    [TicketStatus.OPEN]: [TicketStatus.ASSIGNED, TicketStatus.CLOSED],
    [TicketStatus.ASSIGNED]: [
      TicketStatus.IN_PROGRESS,
      TicketStatus.OPEN,
      TicketStatus.CLOSED,
    ],
    [TicketStatus.IN_PROGRESS]: [
      TicketStatus.RESOLVED,
      TicketStatus.WAITING_RESPONSE,
      TicketStatus.ASSIGNED,
      TicketStatus.CLOSED,
    ],
    [TicketStatus.WAITING_RESPONSE]: [
      TicketStatus.IN_PROGRESS,
      TicketStatus.RESOLVED,
      TicketStatus.CLOSED,
    ],
    [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.IN_PROGRESS],
    [TicketStatus.CLOSED]: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS],
  };
  return statusFlow[currentStatus] || [];
};

// Export generic type helpers
export const getDeviceType = (userAgent?: string): 'Desktop' | 'Tablet' | 'Mobile' => {
  if (!userAgent) return 'Desktop';

  if (/Mobile|Android|iPhone/.test(userAgent)) return 'Mobile';
  if (/Tablet|iPad/.test(userAgent)) return 'Tablet';

  return 'Desktop';
};


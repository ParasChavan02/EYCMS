import React from 'react';
import { AlertCircle, CheckCircle, Clock, User, MessageCircle, X } from 'lucide-react';
import { TicketStatus } from '../types';
import { statusConfig } from '../utils/ticketUtils';

interface StatusBadgeProps {
  status: TicketStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = statusConfig[status];

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconMap = {
    CircleDot: (
      <div className="w-2 h-2 rounded-full bg-current" />
    ),
    User: <User className="w-4 h-4" />,
    Clock: <Clock className="w-4 h-4" />,
    MessageCircle: <MessageCircle className="w-4 h-4" />,
    CheckCircle: <CheckCircle className="w-4 h-4" />,
    X: <X className="w-4 h-4" />,
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full font-medium ${config.color} ${config.textColor} ${sizeClasses[size]}`}
    >
      {iconMap[config.icon as keyof typeof iconMap]}
      <span>{status}</span>
    </div>
  );
};


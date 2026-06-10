import React from 'react';
import { TicketPriority, TicketCategory } from '../types';
import { priorityConfig, categoryConfig } from '../utils/ticketUtils';

interface PriorityBadgeProps {
  priority: TicketPriority;
  size?: 'sm' | 'md' | 'lg';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const config = priorityConfig[priority];

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`inline-block rounded-full font-semibold ${config.color} ${config.textColor} ${sizeClasses[size]}`}
    >
      {priority}
    </span>
  );
};

interface CategoryBadgeProps {
  category: TicketCategory;
  size?: 'sm' | 'md' | 'lg';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, size = 'md' }) => {
  const config = categoryConfig[category];

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`inline-block rounded-md font-medium ${config.color} ${config.textColor} ${sizeClasses[size]}`}
    >
      {category}
    </span>
  );
};


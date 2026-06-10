import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface StatusIndicatorProps {
  status: 'Healthy' | 'Warning' | 'Down';
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  Healthy: {
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    dotColor: 'bg-green-500',
    icon: CheckCircle,
  },
  Warning: {
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    dotColor: 'bg-yellow-500',
    icon: AlertTriangle,
  },
  Down: {
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    dotColor: 'bg-red-500',
    icon: AlertCircle,
  },
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <div className="flex items-center gap-2">
      <Icon className={`${sizeClasses[size]} ${config.textColor}`} />
      <span className={`font-medium ${config.textColor}`}>{status}</span>
    </div>
  );
};

interface ServiceStatusCardProps {
  service: string;
  status: 'Healthy' | 'Warning' | 'Down';
  responseTime?: number;
  message?: string;
  lastChecked: string;
}

export const ServiceStatusCard: React.FC<ServiceStatusCardProps> = ({
  service,
  status,
  responseTime,
  message,
  lastChecked,
}) => {
  const config = statusConfig[status];

  return (
    <div className={`rounded-lg border ${config.bgColor} p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className={`font-semibold ${config.textColor}`}>{service}</h3>
          <StatusIndicator status={status} size="sm" />
          {message && (
            <p className={`text-sm ${config.textColor} mt-2`}>{message}</p>
          )}
        </div>
        {responseTime && (
          <div className="text-right">
            <div className={`text-sm font-medium ${config.textColor}`}>
              {responseTime}ms
            </div>
            <div className="text-xs text-gray-500">Response time</div>
          </div>
        )}
      </div>
      <div className="text-xs text-gray-500 mt-3">
        Last checked: {new Date(lastChecked).toLocaleTimeString()}
      </div>
    </div>
  );
};


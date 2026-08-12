import React from 'react';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: number;
  unit?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

const colorClasses = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200' },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    border: 'border-green-200',
  },
  red: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-200' },
  yellow: {
    bg: 'bg-yellow-50',
    icon: 'text-yellow-600',
    border: 'border-yellow-200',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    border: 'border-purple-200',
  },
};

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon,
  trend,
  unit = '',
  color = 'blue',
}) => {
  const colors = colorClasses[color];

  return (
    <div
      className={`rounded-lg border ${colors.border} ${colors.bg} p-6 transition-all hover:shadow-lg`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{value}</span>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              <TrendingUp
                className={`h-4 w-4 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}
              />
              <span
                className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
            </div>
          )}
        </div>
        {icon && <div className={`h-12 w-12 rounded-lg ${colors.bg} flex items-center justify-center ${colors.icon}`}>{icon}</div>}
      </div>
    </div>
  );
};

export const KPICardSkeleton: React.FC = () => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="animate-pulse">
        <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
        <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 w-20 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};

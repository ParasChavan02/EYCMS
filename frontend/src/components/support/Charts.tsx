import React from 'react';
import { BarChart3, LineChart, PieChart } from 'lucide-react';

interface ChartData {
  label: string;
  value: number;
}

interface BarChartProps {
  title: string;
  data: ChartData[];
  color?: 'blue' | 'green' | 'red' | 'purple';
}

export const SimpleBarChart: React.FC<BarChartProps> = ({
  title,
  data,
  color = 'blue',
}) => {
  const maxValue = Math.max(...data.map((d) => d.value));
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-6 text-lg font-semibold text-gray-900">{title}</h3>
      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {item.label}
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {item.value}
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full ${colorClasses[color]} transition-all`}
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface LineChartData {
  month: string;
  value: number;
}

interface LineChartProps {
  title: string;
  data: LineChartData[];
}

export const SimpleLineChart: React.FC<LineChartProps> = ({ title, data }) => {
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;

  // Calculate SVG path
  const width = 500;
  const height = 200;
  const points = data.map((item, index) => ({
    x: (index / (data.length - 1)) * (width - 40) + 20,
    y: height - 40 - ((item.value - minValue) / range) * (height - 80),
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-6 text-lg font-semibold text-gray-900">{title}</h3>
      <div className="overflow-x-auto">
        <svg width={width} height={height} className="w-full">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={`grid-${i}`}
              x1="20"
              y1={40 + (i * (height - 80)) / 4}
              x2={width - 20}
              y2={40 + (i * (height - 80)) / 4}
              stroke="#f3f4f6"
              strokeWidth="1"
            />
          ))}

          {/* Line */}
          <polyline
            points={points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {points.map((p, i) => (
            <circle
              key={`point-${i}`}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#3b82f6"
            />
          ))}

          {/* X-axis labels */}
          {data.map((item, i) => (
            <text
              key={`label-${i}`}
              x={points[i].x}
              y={height - 10}
              textAnchor="middle"
              fontSize="12"
              fill="#6b7280"
            >
              {item.month}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};

interface PieChartData {
  label: string;
  value: number;
}

interface PieChartProps {
  title: string;
  data: PieChartData[];
}

export const SimplePieChart: React.FC<PieChartProps> = ({ title, data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
  ];

  let currentAngle = -90;
  const slices = data.map((item, i) => {
    const sliceAngle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    const startRadians = (startAngle * Math.PI) / 180;
    const endRadians = (endAngle * Math.PI) / 180;

    const x1 = 100 + 80 * Math.cos(startRadians);
    const y1 = 100 + 80 * Math.sin(startRadians);
    const x2 = 100 + 80 * Math.cos(endRadians);
    const y2 = 100 + 80 * Math.sin(endRadians);

    const largeArc = sliceAngle > 180 ? 1 : 0;

    const pathData = [
      `M 100 100`,
      `L ${x1} ${y1}`,
      `A 80 80 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');

    return {
      pathData,
      color: colors[i % colors.length],
      label: item.label,
      value: item.value,
      percentage: ((item.value / total) * 100).toFixed(1),
    };
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-6 text-lg font-semibold text-gray-900">{title}</h3>
      <div className="flex flex-col lg:flex-row gap-6">
        <svg width="200" height="200" viewBox="0 0 200 200" className="flex-shrink-0">
          {slices.map((slice, i) => (
            <path
              key={`slice-${i}`}
              d={slice.pathData}
              fill={slice.color}
              stroke="white"
              strokeWidth="2"
            />
          ))}
        </svg>
        <div className="space-y-3 flex-1">
          {slices.map((slice, i) => (
            <div key={`legend-${i}`} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: slice.color }}
                ></div>
                <span className="text-sm text-gray-700">{slice.label}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {slice.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

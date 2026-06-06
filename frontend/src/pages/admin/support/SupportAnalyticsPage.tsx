import React from 'react';
import {
  BarChart3,
  CheckCircle,
  ShieldAlert,
  TrendingUp,
  Clock,
  Activity,
  Timer,
} from 'lucide-react';
import { useAnalytics } from '../../../hooks/support/useAnalytics';

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Inline SVG Line Chart                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */
interface LineChartPoint {
  month: string;
  tickets: number;
}

function InlineSVGLineChart({ data }: { data: LineChartPoint[] }) {
  if (!data || data.length === 0) return null;

  const W = 500;
  const H = 180;
  const PADDING = { top: 16, right: 20, bottom: 32, left: 40 };

  const plotW = W - PADDING.left - PADDING.right;
  const plotH = H - PADDING.top - PADDING.bottom;

  const maxVal = Math.max(...data.map((d) => d.tickets), 1);
  const minVal = 0;

  const xStep = data.length > 1 ? plotW / (data.length - 1) : plotW;

  const toX = (i: number) => PADDING.left + i * xStep;
  const toY = (v: number) =>
    PADDING.top + plotH - ((v - minVal) / (maxVal - minVal)) * plotH;

  const points = data.map((d, i) => ({ x: toX(i), y: toY(d.tickets) }));
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Grid lines (4 horizontal)
  const gridLines = [0.25, 0.5, 0.75, 1].map((frac) => ({
    y: PADDING.top + plotH * (1 - frac),
    label: Math.round(minVal + (maxVal - minVal) * frac),
  }));

  return (
    <div className="sp-chart-container">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: 'block', overflow: 'visible' }}
        aria-label="Monthly Ticket Trend Line Chart"
      >
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLines.map((g, idx) => (
          <g key={idx}>
            <line
              x1={PADDING.left}
              y1={g.y}
              x2={W - PADDING.right}
              y2={g.y}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <text
              x={PADDING.left - 6}
              y={g.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#94a3b8"
            >
              {g.label}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <polygon
          points={`${PADDING.left},${PADDING.top + plotH} ${polylinePoints} ${W - PADDING.right},${PADDING.top + plotH}`}
          fill="url(#lineGrad)"
        />

        {/* Line */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="#fff"
            stroke="#3b82f6"
            strokeWidth="2"
          />
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={toX(i)}
            y={H - 6}
            textAnchor="middle"
            fontSize="10"
            fill="#94a3b8"
          >
            {d.month.substring(0, 3)}
          </text>
        ))}

        {/* X-axis baseline */}
        <line
          x1={PADDING.left}
          y1={PADDING.top + plotH}
          x2={W - PADDING.right}
          y2={PADDING.top + plotH}
          stroke="#e2e8f0"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Priority color map                                                         */
/* ─────────────────────────────────────────────────────────────────────────── */
const PRIORITY_COLORS: Record<string, string> = {
  Low: '#94a3b8',
  Medium: '#eab308',
  High: '#ea580c',
  Critical: '#ef4444',
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Category color palette (8 colours)                                        */
/* ─────────────────────────────────────────────────────────────────────────── */
const CATEGORY_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
];

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Skeleton KPI Card                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */
function KPICardSkeleton() {
  return (
    <div className="sp-kpi-card" aria-hidden="true">
      <div
        className="sp-kpi-icon sp-skeleton"
        style={{ width: 40, height: 40, borderRadius: 10 }}
      />
      <div className="sp-kpi-body">
        <div
          className="sp-skeleton"
          style={{ height: 10, width: '55%', marginBottom: 8, borderRadius: 4 }}
        />
        <div
          className="sp-skeleton"
          style={{ height: 22, width: '70%', borderRadius: 4 }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Main Page Component                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */
export const SupportAnalyticsPage: React.FC = () => {
  const analytics = useAnalytics();

  /* ── Loading State ── */
  if (analytics.isLoading) {
    return (
      <div className="support-page">
        {/* Header */}
        <div className="sp-header">
          <div className="sp-header-copy">
            <h1>Support Analytics</h1>
            <p>Performance metrics and KPI dashboard</p>
          </div>
        </div>

        {/* Skeleton KPI grid */}
        <div className="sp-kpi-grid">
          {[0, 1, 2, 3].map((i) => (
            <KPICardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  /* ── Error State ── */
  if (analytics.error || !analytics.data) {
    return (
      <div className="support-page">
        <div className="sp-alert-banner red" role="alert">
          <div className="sp-alert-icon red">
            <ShieldAlert size={18} />
          </div>
          <div className="sp-alert-body">
            <h2>Failed to load analytics</h2>
            <p>
              Unable to fetch support analytics data. Please refresh the page or
              contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const data = analytics.data;

  /* ── Derived values ── */
  const resolutionRatePct =
    data.totalTickets > 0
      ? ((data.resolvedTickets / data.totalTickets) * 100).toFixed(1) + '%'
      : '0.0%';

  const resolutionRateNum =
    data.totalTickets > 0
      ? (data.resolvedTickets / data.totalTickets) * 100
      : 0;

  /* Priority bars — max is the highest count */
  const priorityMax = Math.max(...data.ticketsByPriority.map((p) => p.count), 1);

  /* Category bars — max is the highest count */
  const categoryTotal = data.ticketsByCategory.reduce(
    (sum, c) => sum + c.count,
    0,
  );

  /* ── Render ── */
  return (
    <div className="support-page">

      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <div className="sp-header">
        <div className="sp-header-copy">
          <h1>Support Analytics</h1>
          <p>Performance metrics and KPI dashboard</p>
        </div>
      </div>

      {/* ── KPI GRID ────────────────────────────────────────── */}
      <div className="sp-kpi-grid">

        {/* Total Tickets */}
        <div className="sp-kpi-card">
          <div className="sp-kpi-icon blue">
            <BarChart3 size={20} />
          </div>
          <div className="sp-kpi-body">
            <div className="sp-kpi-label">Total Tickets</div>
            <div className="sp-kpi-value">{data.totalTickets}</div>
          </div>
        </div>

        {/* Resolved Tickets */}
        <div className="sp-kpi-card">
          <div className="sp-kpi-icon green">
            <CheckCircle size={20} />
          </div>
          <div className="sp-kpi-body">
            <div className="sp-kpi-label">Resolved Tickets</div>
            <div className="sp-kpi-value">{data.resolvedTickets}</div>
          </div>
        </div>

        {/* Critical Issues */}
        <div className="sp-kpi-card">
          <div className="sp-kpi-icon red">
            <ShieldAlert size={20} />
          </div>
          <div className="sp-kpi-body">
            <div className="sp-kpi-label">Critical Issues</div>
            <div className="sp-kpi-value">{data.criticalTickets}</div>
          </div>
        </div>

        {/* Resolution Rate */}
        <div className="sp-kpi-card">
          <div className="sp-kpi-icon purple">
            <Activity size={20} />
          </div>
          <div className="sp-kpi-body">
            <div className="sp-kpi-label">Resolution Rate</div>
            <div className="sp-kpi-value">{resolutionRatePct}</div>
          </div>
        </div>

      </div>

      {/* ── SLA SUMMARY BANNER ──────────────────────────────── */}
      <div
        className="sp-card sp-card-pad"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 14,
        }}
      >
        {/* Left copy */}
        <div>
          <h3
            style={{
              margin: '0 0 4px',
              fontSize: '0.95rem',
              fontWeight: 700,
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <TrendingUp size={17} style={{ color: '#22c55e' }} />
            SLA Performance Summary
          </h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
            Track your service-level agreement compliance and resolution
            efficiency across all ticket categories.
          </p>
        </div>

        {/* Right mini stats */}
        <div style={{ display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
          {/* Avg Resolution Time */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '10px 18px',
              textAlign: 'center',
              minWidth: 130,
            }}
          >
            <div
              style={{
                fontSize: '1.3rem',
                fontWeight: 800,
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <Clock size={15} style={{ color: '#3b82f6' }} />
              {data.averageResolutionTime} hrs
            </div>
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginTop: 3,
              }}
            >
              Avg Resolution Time
            </div>
          </div>

          {/* First Contact Resolution */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '10px 18px',
              textAlign: 'center',
              minWidth: 130,
            }}
          >
            <div
              style={{
                fontSize: '1.3rem',
                fontWeight: 800,
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <Timer size={15} style={{ color: '#10b981' }} />
              68%
            </div>
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginTop: 3,
              }}
            >
              First Contact Resolution
            </div>
          </div>
        </div>
      </div>

      {/* ── CHART SECTION — ROW 1 (2fr + 1fr) ──────────────── */}
      <div className="sp-analytics-grid" style={{ marginBottom: 14 }}>

        {/* LEFT: SVG Line Chart */}
        <div className="sp-chart-card">
          <div className="sp-chart-title">Monthly Ticket Trend</div>
          <InlineSVGLineChart data={data.monthlyTrend} />
        </div>

        {/* RIGHT: Priority Bars */}
        <div className="sp-chart-card">
          <div className="sp-chart-title">Tickets by Priority</div>
          {data.ticketsByPriority.map((p) => {
            const pct = Math.round((p.count / priorityMax) * 100);
            const color = PRIORITY_COLORS[p.priority] ?? '#94a3b8';
            return (
              <div className="sp-bar-row" key={p.priority}>
                <div className="sp-bar-label">{p.priority}</div>
                <div className="sp-bar-track">
                  <div
                    className="sp-bar-fill"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
                <div className="sp-bar-count">{p.count}</div>
              </div>
            );
          })}
        </div>

      </div>

      {/* ── CHART SECTION — ROW 2 (1fr + 1fr) ──────────────── */}
      <div className="sp-grid-2">

        {/* LEFT: Category Legend */}
        <div className="sp-chart-card">
          <div className="sp-chart-title">Tickets by Category</div>
          <div className="sp-pie-legend">
            {data.ticketsByCategory.map((c, idx) => {
              const pct =
                categoryTotal > 0
                  ? ((c.count / categoryTotal) * 100).toFixed(1)
                  : '0.0';
              const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
              return (
                <div className="sp-pie-row" key={c.category}>
                  <div className="sp-pie-dot-label">
                    <span
                      className="sp-pie-dot"
                      style={{ background: color }}
                    />
                    <span>{c.category}</span>
                  </div>
                  <div style={{ flex: 1, margin: '0 10px' }}>
                    <div
                      style={{
                        height: 5,
                        background: '#f1f5f9',
                        borderRadius: 99,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: color,
                          borderRadius: 99,
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                  </div>
                  <div className="sp-pie-pct">{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Two stacked SLA cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* SLA Card 1 — Avg Resolution Time */}
          <div className="sp-sla-card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
              }}
            >
              <Clock size={15} style={{ color: '#3b82f6' }} />
              <span
                style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e40af' }}
              >
                Average Resolution Time
              </span>
            </div>
            <div className="sp-sla-metric">{data.averageResolutionTime}</div>
            <div className="sp-sla-label">hours per ticket</div>
          </div>

          {/* SLA Card 2 — Resolution Rate */}
          <div className="sp-card sp-card-pad">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}
            >
              <Activity size={15} style={{ color: '#7c3aed' }} />
              <span
                style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}
              >
                Resolution Rate
              </span>
            </div>
            <div
              style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                color: '#7c3aed',
                marginBottom: 6,
              }}
            >
              {resolutionRatePct}
            </div>
            <div className="sp-progress-bar">
              <div
                className="sp-progress-fill blue"
                style={{ width: `${Math.min(resolutionRateNum, 100)}%` }}
              />
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: '#94a3b8',
                marginTop: 6,
              }}
            >
              {data.resolvedTickets} of {data.totalTickets} tickets resolved
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

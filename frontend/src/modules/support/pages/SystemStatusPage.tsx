import React from 'react';
import {
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Activity,
  Server,
  Database,
  ShieldCheck,
  HardDrive,
  Wifi,
} from 'lucide-react';
import { useServiceStatus, useCheckService } from '../hooks/useAnalytics';
import '../../../styles/support.css';

/* ─── helpers ────────────────────────────────────────── */

type StatusKey = 'Healthy' | 'Warning' | 'Down';

const statusCssMap: Record<StatusKey, string> = {
  Healthy: 'healthy',
  Warning: 'warning',
  Down: 'down',
};

const badgeCssMap: Record<StatusKey, string> = {
  Healthy: 'sp-badge-healthy',
  Warning: 'sp-badge-warning',
  Down: 'sp-badge-down',
};

const dotColorMap: Record<StatusKey, string> = {
  Healthy: 'green',
  Warning: 'yellow',
  Down: 'red',
};

/** Map service name → Lucide icon component */
const ServiceIcon: React.FC<{ name: string }> = ({ name }) => {
  const sz = 18;
  if (name === 'Database') return <Database size={sz} />;
  if (name === 'Authentication') return <ShieldCheck size={sz} />;
  if (name === 'Email Service') return <Wifi size={sz} />;
  if (name === 'Storage Service') return <HardDrive size={sz} />;
  return <Server size={sz} />;
};

/** Format an ISO timestamp into a short readable string */
const fmtTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

/* ─── static data ────────────────────────────────────── */

const INFRA_ROWS: { label: string; value: string; valueClass?: string }[] = [
  { label: 'Deployment Region', value: 'AWS ap-south-1 (Mumbai)' },
  { label: 'SSL Status', value: 'Valid — Expires in 284 days', valueClass: 'color-green' },
  { label: 'API Gateway SLA', value: '99.98% (Last 30 days)' },
  { label: 'Maintenance Window', value: 'Sundays 02:00 – 04:00 IST' },
];

const INCIDENTS = [
  {
    time: '2 hrs ago',
    title: 'Email delivery latency spike',
    desc: 'Email Service experienced intermittent delays. Resolved after SMTP pool rebalancing.',
  },
  {
    time: '1 day ago',
    title: 'Database read replica failover',
    desc: 'Automatic failover to secondary replica triggered. No data loss. RTO: 47 seconds.',
  },
  {
    time: '3 days ago',
    title: 'API Gateway timeout — batch endpoint',
    desc: 'Timeout errors on /api/v2/batch due to upstream overload. Rate limiting applied.',
  },
];

/* ─── component ──────────────────────────────────────── */

export const SystemStatusPage: React.FC = () => {
  const { data: services, isLoading, refetch, isFetching } = useServiceStatus();
  const checkServiceMutation = useCheckService();

  const handleRefreshAll = () => {
    refetch();
  };

  const handleCheckService = (serviceName: string) => {
    checkServiceMutation.mutate(serviceName);
  };

  /* derive global banner state */
  const allHealthy = services?.every((s) => s.status === 'Healthy') ?? false;
  const hasDown    = services?.some((s) => s.status === 'Down')    ?? false;

  let bannerVariant: 'green' | 'yellow' | 'red';
  let bannerTitle: string;
  let bannerDesc: string;

  if (!services) {
    bannerVariant = 'yellow';
    bannerTitle   = 'Loading Status…';
    bannerDesc    = 'Fetching real-time service health data.';
  } else if (hasDown) {
    bannerVariant = 'red';
    bannerTitle   = 'Service Outage Detected';
    bannerDesc    = 'One or more critical services are unreachable. Our team has been notified.';
  } else if (!allHealthy) {
    bannerVariant = 'yellow';
    bannerTitle   = 'Minor Service Degradation';
    bannerDesc    = 'Some services are experiencing elevated response times or warnings.';
  } else {
    bannerVariant = 'green';
    bannerTitle   = 'All Systems Operational';
    bannerDesc    = 'Every core service is responding within SLA parameters. No incidents detected.';
  }

  /* banner icon */
  const BannerIcon = hasDown ? AlertCircle : !allHealthy ? AlertTriangle : CheckCircle;

  /* css colour token for banner (support.css only has red / yellow / blue for sp-alert-banner) */
  /* green banner uses blue variant as a fallback — we'll override with inline styles */
  const bannerCssVariant = bannerVariant === 'green' ? 'green-banner' : bannerVariant;

  return (
    <div className="support-page">

      {/* ── Page Header ───────────────────────────────── */}
      <div className="sp-header">
        <div className="sp-header-copy">
          <h1>System Status</h1>
          <p>Real-time monitoring of E-YUVA ERP infrastructure</p>
        </div>
        <div className="sp-header-actions">
          <button
            className="sp-btn sp-btn-outline"
            onClick={handleRefreshAll}
            disabled={isLoading || isFetching}
          >
            <RefreshCw
              size={14}
              style={isFetching ? { animation: 'spin 0.8s linear infinite' } : undefined}
            />
            Refresh All
          </button>
        </div>
      </div>

      {/* ── Global Status Banner ───────────────────────── */}
      <div
        className="sp-alert-banner"
        style={
          bannerVariant === 'green'
            ? {
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderLeft: '4px solid #16a34a',
              }
            : bannerVariant === 'red'
            ? {
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                borderLeft: '4px solid #dc2626',
              }
            : {
                background: '#fefce8',
                border: '1px solid #fde68a',
                borderLeft: '4px solid #ca8a04',
              }
        }
      >
        <div
          className="sp-alert-icon"
          style={
            bannerVariant === 'green'
              ? { background: '#dcfce7', color: '#16a34a' }
              : bannerVariant === 'red'
              ? { background: '#fee2e2', color: '#dc2626' }
              : { background: '#fef3c7', color: '#ca8a04' }
          }
        >
          <BannerIcon size={20} />
        </div>
        <div className="sp-alert-body">
          <h2>{bannerTitle}</h2>
          <p>{bannerDesc}</p>
        </div>
      </div>

      {/* ── Service Cards Grid ─────────────────────────── */}
      <div className="sp-service-grid">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="sp-skeleton"
                style={{ height: 110, borderRadius: 14 }}
              />
            ))
          : services?.map((svc) => {
              const css = statusCssMap[svc.status as StatusKey] ?? 'healthy';
              return (
                <div key={svc.service} className={`sp-service-card ${css}`}>
                  <div className="sp-service-header">
                    <span className="sp-service-name">{svc.service}</span>
                    <span className={`sp-service-dot ${css}`} />
                  </div>
                  <div className="sp-service-resp">
                    {svc.responseTime != null ? svc.responseTime : '—'}
                    {svc.responseTime != null ? 'ms' : ''}
                  </div>
                  <div className="sp-service-label">Response Time</div>
                  <span
                    className={`sp-badge ${badgeCssMap[svc.status as StatusKey] ?? 'sp-badge-healthy'}`}
                    style={{ marginTop: 8, display: 'inline-flex' }}
                  >
                    {svc.status}
                  </span>
                </div>
              );
            })}
      </div>

      {/* ── Live Services Monitor Table ────────────────── */}
      <div className="sp-card" style={{ marginBottom: 14 }}>
        <div className="sp-card-header">
          <h3>Live Services Monitor</h3>
          <span className="sp-card-meta">Auto-refreshes every 30 s</span>
        </div>
        <div className="sp-table-wrap">
          <table className="sp-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Status</th>
                <th>Response Time</th>
                <th>Last Checked</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                    Loading…
                  </td>
                </tr>
              ) : services && services.length > 0 ? (
                services.map((svc) => {
                  const css    = statusCssMap[svc.status as StatusKey] ?? 'healthy';
                  const dotCol = dotColorMap[svc.status as StatusKey] ?? 'green';
                  return (
                    <tr key={svc.service}>
                      {/* Service */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#64748b', display: 'flex' }}>
                            <ServiceIcon name={svc.service} />
                          </span>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{svc.service}</span>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td>
                        <span className={`sp-badge ${badgeCssMap[svc.status as StatusKey] ?? 'sp-badge-healthy'}`}>
                          <span className={`sp-badge-dot ${dotCol}`} />
                          {svc.status}
                        </span>
                      </td>

                      {/* Response time */}
                      <td className="muted">
                        {svc.responseTime != null ? `${svc.responseTime} ms` : '—'}
                      </td>

                      {/* Last checked */}
                      <td className="muted">
                        {svc.lastChecked ? fmtTime(svc.lastChecked) : '—'}
                      </td>

                      {/* Action */}
                      <td>
                        <div className="sp-table-actions">
                          <button
                            className="sp-btn-icon blue"
                            title={`Run diagnostic for ${svc.service}`}
                            onClick={() => handleCheckService(svc.service)}
                            disabled={checkServiceMutation.isLoading}
                          >
                            <Activity size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5}>
                    <div className="sp-table-empty">
                      <div className="sp-table-empty-icon">
                        <Server size={24} />
                      </div>
                      <p>No service data available</p>
                      <span>Try refreshing the page.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Bottom 2-col grid ──────────────────────────── */}
      <div className="sp-grid-2">

        {/* LEFT — Infrastructure Details */}
        <div className="sp-card sp-card-pad">
          <h3
            style={{
              margin: '0 0 14px',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Server size={16} style={{ color: '#64748b' }} />
            Infrastructure Details
          </h3>

          {INFRA_ROWS.map((row) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: '1px solid #f1f5f9',
                gap: 12,
              }}
            >
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{row.label}</span>
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: row.valueClass === 'color-green' ? '#16a34a' : '#0f172a',
                  textAlign: 'right',
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* RIGHT — Recent Incidents */}
        <div className="sp-card sp-card-pad">
          <h3
            style={{
              margin: '0 0 14px',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertTriangle size={16} style={{ color: '#ca8a04' }} />
            Recent Incidents
          </h3>

          {INCIDENTS.map((incident, idx) => (
            <div key={idx} className="sp-incident-row">
              <span className="sp-incident-time">{incident.time}</span>
              <div className="sp-incident-body">
                <h4>{incident.title}</h4>
                <p>{incident.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inline keyframe for the spin animation on the RefreshCw icon */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};


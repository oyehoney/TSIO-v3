/**
 * EngagementActivityPage.tsx — Admin page at /admin/engagement.
 *
 * Renders all engagement requests reverse-chronologically with filters.
 * Inline status update per row: SUBMITTED → IN_PROGRESS / COMPLETED / NO_ACTION.
 * Displays current routing email (from settings) with link to /admin/settings.
 *
 * API:
 *   GET   /api/v1/admin/engagement-requests?record_id=&request_type=&from_date=&to_date=&page=&page_size=
 *   PATCH /api/v1/admin/engagement-requests/:id  — status update
 *   GET   /api/v1/admin/settings — for routing email display
 *
 * Per UX-Mockup Screen-10 and US-7.3 acceptance criteria.
 * F7: Engagement Routing — EngagementActivityPage
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

// ── Types ─────────────────────────────────────────────────────────────────────

interface EngagementRequest {
  request_id: string;
  request_type: string;
  record_id: string;
  record_title?: string;
  requestor_name: string;
  requestor_office: string;
  status: 'SUBMITTED' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_ACTION';
  curator_note?: string | null;
  submitted_at: string;
  updated_at?: string;
}

interface Pagination {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
}

interface HubSetting {
  setting_key: string;
  setting_value: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const REQUEST_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'REQUEST_TECHNICAL_GUIDANCE', label: 'Technical Guidance' },
  { value: 'REQUEST_BRIEFING', label: 'Briefing Request' },
  { value: 'REQUEST_COLLABORATION', label: 'Collaboration' },
  { value: 'FLAG_FOR_REVIEW', label: 'Flag for Review' },
] as const;

const DATE_RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '', label: 'All time' },
] as const;

const STATUSES = ['SUBMITTED', 'IN_PROGRESS', 'COMPLETED', 'NO_ACTION'] as const;
const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  NO_ACTION: 'No Action',
};
const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: '#2563EB',
  IN_PROGRESS: '#D97706',
  COMPLETED: '#16A34A',
  NO_ACTION: '#6B7280',
};
const REQUEST_TYPE_LABELS: Record<string, string> = {
  REQUEST_TECHNICAL_GUIDANCE: 'Technical Guidance',
  REQUEST_BRIEFING: 'Briefing Request',
  REQUEST_COLLABORATION: 'Collaboration',
  FLAG_FOR_REVIEW: 'Flag for Review',
};

// ── API helpers ───────────────────────────────────────────────────────────────

async function adminFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(body?.error?.message || `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Toast ─────────────────────────────────────────────────────────────────────

const Toast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        backgroundColor: '#16A34A',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontWeight: 600,
        zIndex: 1000,
      }}
    >
      {message}
    </div>
  );
};

// ── Status badge ──────────────────────────────────────────────────────────────

const StatusChip: React.FC<{ status: string }> = ({ status }) => {
  const color = STATUS_COLORS[status] ?? '#6B7280';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '4px',
        backgroundColor: `${color}15`,
        color,
        fontSize: '0.75rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
};

// ── Inline status popover ─────────────────────────────────────────────────────

const StatusUpdatePopover: React.FC<{
  requestId: string;
  currentStatus: string;
  onSaved: (newStatus: string) => void;
  onCancel: () => void;
}> = ({ requestId, currentStatus, onSaved, onCancel }) => {
  const [selected, setSelected] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await adminFetch<EngagementRequest>(
        `/api/v1/admin/engagement-requests/${requestId}`,
        { method: 'PATCH', body: JSON.stringify({ status: selected }) }
      );
      onSaved(selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: '100%',
        zIndex: 200,
        backgroundColor: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        padding: '16px',
        minWidth: '280px',
      }}
    >
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
        Update Status for this Request
      </div>
      <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '12px' }}>
        Current: <strong>{STATUS_LABELS[currentStatus] ?? currentStatus}</strong>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
        {STATUSES.map(s => (
          <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
            <input
              type="radio"
              name={`status-${requestId}`}
              value={s}
              checked={selected === s}
              onChange={() => setSelected(s)}
            />
            {STATUS_LABELS[s]}
          </label>
        ))}
      </div>
      {error && (
        <div style={{ fontSize: '0.75rem', color: '#DC2626', marginBottom: '8px' }}>{error}</div>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '6px 14px',
            backgroundColor: saving ? '#93C5FD' : '#1D4ED8',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '6px 14px',
            backgroundColor: '#fff',
            color: '#374151',
            border: '1px solid #D1D5DB',
            borderRadius: '6px',
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

export const EngagementActivityPage: React.FC = () => {
  const [requests, setRequests] = useState<EngagementRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, page_size: 20, total_count: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routingEmail, setRoutingEmail] = useState<string>('');
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const popoverRef = useRef<HTMLDivElement>(null);

  // Filter state from URL
  const filterType = searchParams.get('request_type') ?? '';
  const filterDays = searchParams.get('days') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const buildUrl = useCallback((overrides: Record<string, string> = {}) => {
    const params: Record<string, string> = {
      page: String(page),
      page_size: '20',
      request_type: filterType,
    };
    if (filterDays) {
      const from = new Date(Date.now() - parseInt(filterDays, 10) * 86400000).toISOString().split('T')[0];
      params.from_date = from;
    }
    Object.assign(params, overrides);
    // Remove empty params
    Object.keys(params).forEach(k => !params[k] && delete params[k]);
    return `/api/v1/admin/engagement-requests?${new URLSearchParams(params)}`;
  }, [page, filterType, filterDays]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = buildUrl();
      const response = await adminFetch<{ data: EngagementRequest[]; pagination: Pagination }>(url);
      setRequests(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError('Unable to load engagement requests. Please try again.');
      console.error('Failed to load engagement requests:', err);
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  const fetchRoutingEmail = useCallback(async () => {
    try {
      const response = await adminFetch<{ data: HubSetting[] }>('/api/v1/admin/settings');
      const setting = response.data.find(s => s.setting_key === 'engagement_routing_email');
      if (setting) setRoutingEmail(setting.setting_value);
    } catch {
      // Non-critical; silently ignore
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    fetchRoutingEmail();
  }, [fetchRequests, fetchRoutingEmail]);

  // Close popover on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (openPopoverId && popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpenPopoverId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openPopoverId]);

  const handleFilterChange = (key: string, value: string) => {
    const newParams: Record<string, string> = { page: '1' };
    if (filterType) newParams.request_type = filterType;
    if (filterDays) newParams.days = filterDays;
    newParams[key] = value;
    if (!newParams[key]) delete newParams[key];
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams: Record<string, string> = { page: String(newPage) };
    if (filterType) newParams.request_type = filterType;
    if (filterDays) newParams.days = filterDays;
    setSearchParams(newParams);
  };

  const handleStatusSaved = (requestId: string, newStatus: string) => {
    setRequests(prev =>
      prev.map(r => r.request_id === requestId ? { ...r, status: newStatus as EngagementRequest['status'] } : r)
    );
    setOpenPopoverId(null);
    setToast('Status updated.');
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const recentCount = requests.filter(r => {
    const cutoff = Date.now() - 7 * 86400000;
    return new Date(r.submitted_at).getTime() > cutoff;
  }).length;

  return (
    <div style={{ padding: '0' }}>
      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            Engagement Activity Log
          </h1>
          {!loading && (
            <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
              {pagination.total_count} total · {recentCount} in the last 7 days
            </span>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {/* Type filter */}
        <div>
          <label
            htmlFor="filter-type"
            style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#6B7280', marginBottom: '4px' }}
          >
            Type
          </label>
          <select
            id="filter-type"
            aria-label="Type"
            value={filterType}
            onChange={e => handleFilterChange('request_type', e.target.value)}
            style={{
              padding: '6px 10px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: '#111827',
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
          >
            {REQUEST_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Date range filter */}
        <div>
          <label
            htmlFor="filter-date"
            style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#6B7280', marginBottom: '4px' }}
          >
            Date Range
          </label>
          <select
            id="filter-date"
            value={filterDays}
            onChange={e => handleFilterChange('days', e.target.value)}
            style={{
              padding: '6px 10px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: '#111827',
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
          >
            {DATE_RANGES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Loading engagement requests…</p>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '0.875rem', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && requests.length === 0 && (
        <div style={{ padding: '48px', textAlign: 'center', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB', marginBottom: '24px' }}>
          <p style={{ color: '#6B7280', margin: 0 }}>No engagement requests found.</p>
        </div>
      )}

      {/* Requests table */}
      {!loading && !error && requests.length > 0 && (
        <>
          <div style={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'visible', marginBottom: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  {['DATE', 'TYPE', 'RECORD', 'REQUESTOR', 'STATUS', ''].map(col => (
                    <th
                      key={col}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((req, idx) => (
                  <tr
                    key={req.request_id}
                    style={{ borderBottom: idx < requests.length - 1 ? '1px solid #F3F4F6' : 'none', position: 'relative' }}
                  >
                    <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: '#6B7280', whiteSpace: 'nowrap' }}>
                      {formatDate(req.submitted_at)}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: '#374151' }}>
                      {REQUEST_TYPE_LABELS[req.request_type] ?? req.request_type}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.875rem' }}>
                      {req.record_id ? (
                        <a
                          href={`/records/${req.record_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#1D4ED8', textDecoration: 'none' }}
                        >
                          {req.record_title ?? req.record_id}
                        </a>
                      ) : (
                        <span style={{ color: '#9CA3AF' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: '#111827' }}>
                      <div>{req.requestor_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{req.requestor_office}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <StatusChip status={req.status} />
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', position: 'relative' }}>
                      {req.status === 'COMPLETED' ? (
                        <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>View</span>
                      ) : (
                        <div style={{ position: 'relative', display: 'inline-block' }} ref={openPopoverId === req.request_id ? popoverRef : null}>
                          <button
                            onClick={() => setOpenPopoverId(openPopoverId === req.request_id ? null : req.request_id)}
                            style={{
                              padding: '4px 12px',
                              backgroundColor: '#fff',
                              color: '#1D4ED8',
                              border: '1px solid #BFDBFE',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Update
                          </button>
                          {openPopoverId === req.request_id && (
                            <StatusUpdatePopover
                              requestId={req.request_id}
                              currentStatus={req.status}
                              onSaved={(newStatus) => handleStatusSaved(req.request_id, newStatus)}
                              onCancel={() => setOpenPopoverId(null)}
                            />
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                style={{
                  padding: '6px 14px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  backgroundColor: page <= 1 ? '#F9FAFB' : '#fff',
                  color: page <= 1 ? '#9CA3AF' : '#374151',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                ← Previous
              </button>
              <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= pagination.total_pages}
                style={{
                  padding: '6px 14px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  backgroundColor: page >= pagination.total_pages ? '#F9FAFB' : '#fff',
                  color: page >= pagination.total_pages ? '#9CA3AF' : '#374151',
                  cursor: page >= pagination.total_pages ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Routing email display */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
          Routing Email
        </div>
        <div style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '8px' }}>
          Requests are routed to:{' '}
          <strong style={{ color: '#111827' }}>
            {routingEmail || <span style={{ color: '#9CA3AF' }}>(not configured)</span>}
          </strong>
        </div>
        <Link
          to="/admin/settings"
          style={{ fontSize: '0.875rem', color: '#1D4ED8', textDecoration: 'none', fontWeight: 500 }}
        >
          Update Routing Email — go to Settings →
        </Link>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default EngagementActivityPage;

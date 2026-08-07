// src/pages/admin/EngagementActivityPage.tsx
// Admin page: Engagement Activity Log — US-7.3 (F7)
// Route: /admin/engagement
// Curator-only — requires OIDC session cookie (sent via credentials: 'same-origin')

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';

// ── Types ──────────────────────────────────────────────────────────────────────

type EngagementStatus = 'SUBMITTED' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_ACTION';
type EngagementRequestType =
  | 'REQUEST_BRIEFING'
  | 'REQUEST_DEMO'
  | 'REQUEST_ADOPTION_DISCUSSION'
  | 'REQUEST_TECHNICAL_GUIDANCE'
  | 'SUBMIT_RELATED_PROBLEM';

interface EngagementRequest {
  request_id: string;
  request_type: EngagementRequestType;
  record_id: string;
  record_title?: string;
  requestor_name: string;
  requestor_office: string;
  requestor_email?: string;
  status: EngagementStatus;
  submitted_at: string;
  updated_at?: string;
}

interface PaginationMeta {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
}

type DateRange = 'last7' | 'last30' | 'last90' | 'all';

// ── API fetch wrapper ──────────────────────────────────────────────────────────

async function adminFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: { message?: string } })?.error?.message || `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const REQUEST_TYPE_LABELS: Record<string, string> = {
  REQUEST_BRIEFING: 'Request Briefing',
  REQUEST_DEMO: 'Request Demo',
  REQUEST_ADOPTION_DISCUSSION: 'Adoption Discussion',
  REQUEST_TECHNICAL_GUIDANCE: 'Technical Guidance',
  SUBMIT_RELATED_PROBLEM: 'Related Problem',
};

const STATUS_BADGE: Record<string, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-green-100 text-green-800',
  NO_ACTION: 'bg-gray-200 text-gray-600',
};

function getDateRange(range: DateRange): { from_date?: string; to_date?: string } {
  if (range === 'all') return {};
  const days = range === 'last7' ? 7 : range === 'last30' ? 30 : 90;
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from_date: from.toISOString().split('T')[0] };
}

// ── Toast ──────────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-green-700 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3" role="status">
      <span>✓</span>
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-2 text-white/70 hover:text-white text-lg leading-none">×</button>
    </div>
  );
}

// ── Inline status update popover ──────────────────────────────────────────────

const STATUS_OPTIONS: EngagementStatus[] = ['SUBMITTED', 'IN_PROGRESS', 'COMPLETED', 'NO_ACTION'];

interface StatusPopoverProps {
  requestId: string;
  currentStatus: EngagementStatus;
  onSaved: (newStatus: EngagementStatus) => void;
  onToast: (msg: string) => void;
  onClose: () => void;
}

function StatusPopover({ requestId, currentStatus, onSaved, onToast, onClose }: StatusPopoverProps) {
  const [selected, setSelected] = useState<EngagementStatus>(currentStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await adminFetch(`/api/v1/admin/engagement-requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: selected }),
      });
      onSaved(selected);
      onToast('Status updated.');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={ref}
      className="absolute z-30 right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-72"
      role="dialog"
      aria-label="Update Status"
    >
      <p className="text-sm font-semibold text-gray-800 mb-1">Update Status for this Request</p>
      <p className="text-xs text-gray-500 mb-3">Current: <span className="font-medium text-gray-700">{currentStatus}</span></p>

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      <div className="space-y-2 mb-3">
        {STATUS_OPTIONS.map(opt => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <input
              type="radio"
              name={`status-${requestId}`}
              value={opt}
              checked={selected === opt}
              onChange={() => setSelected(opt)}
              className="accent-indigo-600"
            />
            <span>{opt.replace('_', ' ')}</span>
          </label>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onClose}
          className="flex-1 border border-gray-300 text-gray-700 text-xs font-medium px-3 py-1.5 rounded hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main page component ────────────────────────────────────────────────────────

export function EngagementActivityPage() {
  const [requests, setRequests] = useState<EngagementRequest[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, page_size: 20, total_count: 0, total_pages: 0 });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [routingEmail, setRoutingEmail] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);

  // Filters
  const [filterRecordId, setFilterRecordId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDateRange, setFilterDateRange] = useState<DateRange>('last30');
  const [page, setPage] = useState(1);

  // Inline update state
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const fetchRequests = useCallback(async (p: number, recordId: string, type: string, dateRange: DateRange) => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams({ page: String(p), page_size: '20' });
      if (recordId) params.set('record_id', recordId);
      if (type) params.set('request_type', type);
      const { from_date } = getDateRange(dateRange);
      if (from_date) params.set('from_date', from_date);

      const data = await adminFetch<{ data: EngagementRequest[]; pagination: PaginationMeta }>(
        `/api/v1/admin/engagement-requests?${params.toString()}`
      );
      setRequests(data.data);
      setPagination(data.pagination);
    } catch {
      setFetchError('Unable to load engagement requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch routing email on mount
  useEffect(() => {
    void (async () => {
      try {
        const data = await adminFetch<{ data: Array<{ setting_key: string; setting_value: string }> }>(
          '/api/v1/admin/settings'
        );
        const emailSetting = data.data.find(s => s.setting_key === 'engagement_routing_email');
        if (emailSetting) setRoutingEmail(emailSetting.setting_value);
      } catch {
        // Non-critical — display empty if settings unavailable
      }
    })();
  }, []);

  useEffect(() => {
    void fetchRequests(page, filterRecordId, filterType, filterDateRange);
  }, [fetchRequests, page, filterRecordId, filterType, filterDateRange]);

  const handleStatusSaved = (requestId: string, newStatus: EngagementStatus) => {
    setRequests(prev =>
      prev.map(r => r.request_id === requestId ? { ...r, status: newStatus } : r)
    );
  };

  const countLast7Days = requests.filter(r => {
    const d = new Date(r.submitted_at);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return d >= cutoff;
  }).length;

  if (loading && requests.length === 0) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading engagement requests…</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Engagement Activity Log</h1>
        <p className="text-gray-500 text-sm mt-1">
          {pagination.total_count} total request{pagination.total_count !== 1 ? 's' : ''}
          {filterDateRange !== 'all' && ` · ${countLast7Days} in the last 7 days`}
        </p>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex flex-wrap gap-4 items-end">
        <div>
          <label htmlFor="filter-type" className="block text-xs font-medium text-gray-600 mb-1">Type</label>
          <select
            id="filter-type"
            value={filterType}
            onChange={e => { setFilterType(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[180px]"
            aria-label="Type"
          >
            <option value="">All Types</option>
            {Object.entries(REQUEST_TYPE_LABELS).map(([val, lbl]) => (
              <option key={val} value={val}>{lbl}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-record" className="block text-xs font-medium text-gray-600 mb-1">Record ID</label>
          <input
            id="filter-record"
            type="text"
            value={filterRecordId}
            onChange={e => { setFilterRecordId(e.target.value); setPage(1); }}
            placeholder="Filter by record ID…"
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
          />
        </div>
        <div>
          <label htmlFor="filter-date" className="block text-xs font-medium text-gray-600 mb-1">Date Range</label>
          <select
            id="filter-date"
            value={filterDateRange}
            onChange={e => { setFilterDateRange(e.target.value as DateRange); setPage(1); }}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="last7">Last 7 days</option>
            <option value="last30">Last 30 days</option>
            <option value="last90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {fetchError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {fetchError}
        </div>
      )}

      {/* Table */}
      {requests.length === 0 && !loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
          <p className="text-gray-500">No engagement requests found for the selected filters.</p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Record</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Requestor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map(req => (
                  <tr key={req.request_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {new Date(req.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">
                      {REQUEST_TYPE_LABELS[req.request_type] ?? req.request_type}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/records/${req.record_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 text-xs"
                      >
                        {req.record_title ?? req.record_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <span className="block text-sm">{req.requestor_name}</span>
                      <span className="block text-xs text-gray-500">{req.requestor_office}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[req.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right relative">
                      {req.status === 'COMPLETED' ? (
                        <span className="text-xs text-gray-400">View</span>
                      ) : (
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenPopoverId(openPopoverId === req.request_id ? null : req.request_id)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium border border-indigo-200 hover:border-indigo-400 px-2 py-1 rounded transition-colors"
                          >
                            [Update]
                          </button>
                          {openPopoverId === req.request_id && (
                            <StatusPopover
                              requestId={req.request_id}
                              currentStatus={req.status}
                              onSaved={(newStatus) => handleStatusSaved(req.request_id, newStatus)}
                              onToast={setToast}
                              onClose={() => setOpenPopoverId(null)}
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
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>Page {pagination.page} of {pagination.total_pages} ({pagination.total_count} total)</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.total_pages}
                  className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Routing email display (Screen-10) */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-gray-700 mb-1">Routing Email</p>
        <p className="text-sm text-gray-600 mb-1">
          Requests are routed to:{' '}
          <span className="font-medium text-gray-900">
            {routingEmail || <span className="text-gray-400 italic">Not configured</span>}
          </span>
        </p>
        <Link
          to="/admin/settings"
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Update Routing Email — go to Settings →
        </Link>
      </div>
    </div>
  );
}

export default EngagementActivityPage;

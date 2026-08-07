// src/pages/admin/submissions/OpportunitySubmissionsPage.tsx
// Admin page: Opportunity Submissions Queue — US-5.3 (F5/F8)
// Route: /admin/submissions/opportunities
// Curator-only — requires OIDC session cookie (sent via credentials: 'same-origin')

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

// ── Types ──────────────────────────────────────────────────────────────────────

type OpportunityDisposition =
  | 'UNDER_REVIEW'
  | 'ACCEPTED_FOR_CONSIDERATION'
  | 'DECLINED'
  | 'LINKED_TO_RECORD';

interface OpportunitySubmission {
  submission_id: string;
  submitter_name: string;
  submitter_email?: string;
  submitter_title?: string;
  submitting_office: string;
  mission_area: string;
  problem_description: string;
  urgency_context?: string;
  known_constraints?: string;
  status: string;
  disposition: OpportunityDisposition | null;
  linked_record_id?: string | null;
  internal_note?: string | null;
  submitted_at: string;
  reviewed_at?: string | null;
  reviewed_by_name?: string | null;
}

interface PaginationMeta {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
}

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

// ── Status badge colors (Screen-09 spec) ──────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-gray-200 text-gray-800',
  ACCEPTED_FOR_CONSIDERATION: 'bg-green-100 text-green-800',
  DECLINED: 'bg-red-100 text-red-800',
  LINKED_TO_RECORD: 'bg-teal-100 text-teal-800',
};

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'New',
  UNDER_REVIEW: 'Under Review',
  ACCEPTED_FOR_CONSIDERATION: 'Accepted',
  DECLINED: 'Declined',
  LINKED_TO_RECORD: 'Linked',
};

const DISPOSITION_OPTIONS: Array<{ value: OpportunityDisposition; label: string }> = [
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'ACCEPTED_FOR_CONSIDERATION', label: 'Accepted for Consideration' },
  { value: 'DECLINED', label: 'Declined' },
  { value: 'LINKED_TO_RECORD', label: 'Linked to Record' },
];

// ── Toast component ────────────────────────────────────────────────────────────

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

// ── Detail view component ──────────────────────────────────────────────────────

interface DetailViewProps {
  submission: OpportunitySubmission;
  onBack: () => void;
  onSaved: () => void;
  onToast: (msg: string) => void;
}

function OpportunityDetailView({ submission, onBack, onSaved, onToast }: DetailViewProps) {
  const [disposition, setDisposition] = useState<OpportunityDisposition>(
    submission.disposition ?? 'UNDER_REVIEW'
  );
  const [linkedRecordId, setLinkedRecordId] = useState<string>(
    submission.linked_record_id ?? ''
  );
  const [internalNote, setInternalNote] = useState<string>(
    submission.internal_note ?? ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    if (disposition === 'LINKED_TO_RECORD' && !linkedRecordId.trim()) {
      setError('Linked Record ID is required when disposition is Linked to Record.');
      return;
    }
    setSaving(true);
    try {
      await adminFetch(`/api/v1/admin/opportunity-submissions/${submission.submission_id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          disposition,
          ...(disposition === 'LINKED_TO_RECORD' ? { linked_record_id: linkedRecordId } : {}),
          ...(internalNote.trim() ? { internal_note: internalNote } : {}),
        }),
      });
      onToast('Disposition saved.');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save disposition.');
    } finally {
      setSaving(false);
    }
  };

  const displayStatus = submission.disposition
    ? (STATUS_LABELS[submission.disposition] ?? submission.disposition)
    : 'Not yet reviewed';

  const statusClass = submission.disposition
    ? (STATUS_BADGE[submission.disposition] ?? 'bg-gray-100 text-gray-800')
    : 'bg-gray-100 text-gray-600';

  return (
    <div className="max-w-3xl">
      <button
        onClick={onBack}
        className="mb-6 text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
      >
        ← Back to list
      </button>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Opportunity Submission</h2>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClass}`}>
            {displayStatus}
          </span>
        </div>

        {/* Submitter info */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Submitter Information</h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <dt className="text-gray-500 font-medium">Name</dt>
              <dd className="text-gray-900">{submission.submitter_name}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Office</dt>
              <dd className="text-gray-900">{submission.submitting_office}</dd>
            </div>
            {submission.submitter_email && (
              <div>
                <dt className="text-gray-500 font-medium">Email</dt>
                <dd className="text-gray-900">{submission.submitter_email}</dd>
              </div>
            )}
            {submission.submitter_title && (
              <div>
                <dt className="text-gray-500 font-medium">Title</dt>
                <dd className="text-gray-900">{submission.submitter_title}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500 font-medium">Mission Area</dt>
              <dd className="text-gray-900">{submission.mission_area}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Submitted</dt>
              <dd className="text-gray-900">{new Date(submission.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</dd>
            </div>
          </dl>
        </div>

        {/* Submission content */}
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Submission Content</h3>
          <div className="space-y-4 text-sm text-gray-800">
            <div>
              <p className="font-medium text-gray-700 mb-1">Problem Description</p>
              <p className="whitespace-pre-wrap">{submission.problem_description}</p>
            </div>
            {submission.urgency_context && (
              <div>
                <p className="font-medium text-gray-700 mb-1">Urgency Context</p>
                <p className="whitespace-pre-wrap">{submission.urgency_context}</p>
              </div>
            )}
            {submission.known_constraints && (
              <div>
                <p className="font-medium text-gray-700 mb-1">Known Constraints</p>
                <p className="whitespace-pre-wrap">{submission.known_constraints}</p>
              </div>
            )}
          </div>
        </div>

        {/* Disposition */}
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Disposition</h3>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="disposition" className="block text-sm font-medium text-gray-700 mb-1">
                Disposition
              </label>
              <select
                id="disposition"
                value={disposition}
                onChange={e => setDisposition(e.target.value as OpportunityDisposition)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="disposition"
              >
                {DISPOSITION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Conditional: linked record ID field */}
            {disposition === 'LINKED_TO_RECORD' && (
              <div>
                <label htmlFor="linked_record_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Linked Record ID <span className="text-red-600">*</span>
                </label>
                <input
                  id="linked_record_id"
                  type="text"
                  value={linkedRecordId}
                  onChange={e => setLinkedRecordId(e.target.value)}
                  placeholder="e.g. rec-001"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Linked Record ID"
                />
              </div>
            )}

            <div>
              <label htmlFor="internal_note" className="block text-sm font-medium text-gray-700 mb-1">
                Internal Notes <span className="text-xs text-gray-500 font-normal">(not visible to submitter)</span>
              </label>
              <textarea
                id="internal_note"
                rows={4}
                value={internalNote}
                onChange={e => setInternalNote(e.target.value)}
                placeholder="Add curator notes here…"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {saving ? 'Saving…' : 'Save Disposition'}
            </button>
          </div>
        </div>

        {/* Disposition history */}
        {(submission.reviewed_at || submission.reviewed_by_name) && (
          <div className="px-6 py-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Disposition History</h3>
            <div className="text-sm text-gray-600">
              {submission.reviewed_at && (
                <span>Reviewed {new Date(submission.reviewed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              )}
              {submission.reviewed_by_name && (
                <span> by {submission.reviewed_by_name}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page component ────────────────────────────────────────────────────────

export function OpportunitySubmissionsPage() {
  const [submissions, setSubmissions] = useState<OpportunitySubmission[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, page_size: 20, total_count: 0, total_pages: 0 });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const fetchSubmissions = useCallback(async (p: number) => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await adminFetch<{ data: OpportunitySubmission[]; pagination: PaginationMeta }>(
        `/api/v1/admin/opportunity-submissions?page=${p}&page_size=20`
      );
      setSubmissions(data.data);
      setPagination(data.pagination);
    } catch {
      setFetchError('Unable to load submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSubmissions(page);
  }, [fetchSubmissions, page]);

  const selectedSubmission = selectedId ? submissions.find(s => s.submission_id === selectedId) ?? null : null;

  const handleBack = () => {
    setSelectedId(null);
    void fetchSubmissions(page);
  };

  const setPage = (p: number) => {
    setSearchParams({ page: String(p) });
  };

  // Show toast in loading/error states too — toast must survive navigation back to list
  if (loading && !selectedSubmission) {
    return (
      <div className="p-8">
        {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
        <p className="text-gray-500">Loading submissions…</p>
      </div>
    );
  }

  if (fetchError && !selectedSubmission) {
    return (
      <div className="p-8">
        {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {fetchError}
        </div>
      </div>
    );
  }

  if (selectedSubmission) {
    return (
      <div className="p-8">
        {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
        <OpportunityDetailView
          submission={selectedSubmission}
          onBack={handleBack}
          onSaved={handleBack}
          onToast={setToast}
        />
      </div>
    );
  }

  return (
    <div className="p-8">
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Opportunity Submissions</h1>
        <p className="text-gray-500 text-sm mt-1">
          {pagination.total_count} total submission{pagination.total_count !== 1 ? 's' : ''} — reverse chronological
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
          <p className="text-gray-500">No submissions received yet.</p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Office</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Problem</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submissions.map(sub => {
                  const effectiveStatus = sub.disposition ?? sub.status;
                  const badgeClass = STATUS_BADGE[effectiveStatus] ?? 'bg-gray-100 text-gray-800';
                  const badgeLabel = STATUS_LABELS[effectiveStatus] ?? effectiveStatus;
                  return (
                    <tr key={sub.submission_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {new Date(sub.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{sub.submitting_office}</td>
                      <td className="px-4 py-3 text-gray-700">{sub.submitter_name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
                          {badgeLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs">
                        <span className="line-clamp-2">{sub.problem_description.substring(0, 120)}{sub.problem_description.length > 120 ? '…' : ''}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedId(sub.submission_id)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-xs whitespace-nowrap"
                          aria-label={`Review submission from ${sub.submitter_name}`}
                        >
                          Review →
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
    </div>
  );
}

export default OpportunitySubmissionsPage;

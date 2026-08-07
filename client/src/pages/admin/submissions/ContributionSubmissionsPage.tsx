// src/pages/admin/submissions/ContributionSubmissionsPage.tsx
// Admin page: Contribution Submissions Queue — US-6.3 (F6/F8)
// Route: /admin/submissions/contributions
// Curator-only — requires OIDC session cookie (sent via credentials: 'same-origin')

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// ── Types ──────────────────────────────────────────────────────────────────────

type ContributionDisposition =
  | 'UNDER_REVIEW'
  | 'ACCEPTED_FOR_CURATION'
  | 'DECLINED'
  | 'PUBLISHED'; // Set by backend after publication — NOT shown as a selectable option in UI

type CuratorSelectableDisposition = 'UNDER_REVIEW' | 'ACCEPTED_FOR_CURATION' | 'DECLINED';

interface ContributionSubmission {
  submission_id: string;
  contact_name: string;
  contact_email?: string;
  contact_title?: string;
  contributing_team?: string;
  contributing_office: string;
  problem_addressed: string;
  work_description: string;
  outcome_summary: string;
  self_assessed_maturity: string;
  artifact_urls: string[];
  additional_context?: string;
  status: string;
  disposition: ContributionDisposition | null;
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

// ── Status / maturity display ──────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-gray-200 text-gray-800',
  ACCEPTED_FOR_CURATION: 'bg-green-100 text-green-800',
  DECLINED: 'bg-red-100 text-red-800',
  PUBLISHED: 'bg-indigo-100 text-indigo-800',
};

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'New',
  UNDER_REVIEW: 'Under Review',
  ACCEPTED_FOR_CURATION: 'Accepted for Curation',
  DECLINED: 'Declined',
  PUBLISHED: 'Published',
};

const MATURITY_LABELS: Record<string, string> = {
  IDEA: 'Idea',
  EXPERIMENT_POC: 'Experiment / POC',
  PROTOTYPE_PILOT: 'Prototype / Pilot',
  PRODUCTION_VALIDATED: 'Production / Validated',
};

const DISPOSITION_OPTIONS: Array<{ value: CuratorSelectableDisposition; label: string }> = [
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'ACCEPTED_FOR_CURATION', label: 'Accepted for Curation' },
  { value: 'DECLINED', label: 'Declined' },
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
  submission: ContributionSubmission;
  onBack: () => void;
  onSaved: (updatedDisposition: ContributionDisposition | null) => void;
  onToast: (msg: string) => void;
}

function ContributionDetailView({ submission, onBack, onSaved, onToast }: DetailViewProps) {
  const navigate = useNavigate();
  const [disposition, setDisposition] = useState<CuratorSelectableDisposition>(
    // PUBLISHED is not curator-selectable; fall back to UNDER_REVIEW for display
    (submission.disposition === 'PUBLISHED' || submission.disposition === null)
      ? 'UNDER_REVIEW'
      : submission.disposition
  );
  const [savedDisposition, setSavedDisposition] = useState<ContributionDisposition | null>(
    submission.disposition
  );
  const [saving, setSaving] = useState(false);
  const [creatingRecord, setCreatingRecord] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const result = await adminFetch<{ submission_id: string; disposition: ContributionDisposition }>(
        `/api/v1/admin/contribution-submissions/${submission.submission_id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ disposition }),
        }
      );
      setSavedDisposition(result.disposition);
      onToast('Disposition saved.');
      onSaved(result.disposition);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save disposition.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRecord = async () => {
    setError(null);
    setCreatingRecord(true);
    try {
      const result = await adminFetch<{ record_id: string }>(
        `/api/v1/admin/contribution-submissions/${submission.submission_id}/create-record`,
        { method: 'POST' }
      );
      navigate(`/admin/records/${result.record_id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create record from submission.');
      setCreatingRecord(false);
    }
  };

  const effectiveDisplayDisposition = savedDisposition ?? submission.disposition;
  const displayStatus = effectiveDisplayDisposition
    ? (STATUS_LABELS[effectiveDisplayDisposition] ?? effectiveDisplayDisposition)
    : 'Not yet reviewed';
  const statusClass = effectiveDisplayDisposition
    ? (STATUS_BADGE[effectiveDisplayDisposition] ?? 'bg-gray-100 text-gray-800')
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
          <h2 className="text-lg font-semibold text-gray-900">Contribution Submission</h2>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClass}`}>
            {displayStatus}
          </span>
        </div>

        {/* Contact / submitter info */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Contact Information</h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <dt className="text-gray-500 font-medium">Contact Name</dt>
              <dd className="text-gray-900">{submission.contact_name}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Office</dt>
              <dd className="text-gray-900">{submission.contributing_office}</dd>
            </div>
            {submission.contact_email && (
              <div>
                <dt className="text-gray-500 font-medium">Email</dt>
                <dd className="text-gray-900">{submission.contact_email}</dd>
              </div>
            )}
            {submission.contributing_team && (
              <div>
                <dt className="text-gray-500 font-medium">Team</dt>
                <dd className="text-gray-900">{submission.contributing_team}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500 font-medium">Self-Assessed Maturity</dt>
              <dd className="text-gray-900">{MATURITY_LABELS[submission.self_assessed_maturity] ?? submission.self_assessed_maturity}</dd>
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
              <p className="font-medium text-gray-700 mb-1">Mission Problem Addressed</p>
              <p className="whitespace-pre-wrap">{submission.problem_addressed}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">Work Description</p>
              <p className="whitespace-pre-wrap">{submission.work_description}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">Outcome Summary</p>
              <p className="whitespace-pre-wrap">{submission.outcome_summary}</p>
            </div>
            {submission.additional_context && (
              <div>
                <p className="font-medium text-gray-700 mb-1">Additional Context</p>
                <p className="whitespace-pre-wrap">{submission.additional_context}</p>
              </div>
            )}
            {submission.artifact_urls && submission.artifact_urls.length > 0 && (
              <div>
                <p className="font-medium text-gray-700 mb-1">Artifact URLs</p>
                <ul className="space-y-1">
                  {submission.artifact_urls.map((url, i) => (
                    <li key={i}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 underline break-all"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
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

          {/* PUBLISHED dispositions cannot be changed via this selector */}
          {submission.disposition === 'PUBLISHED' ? (
            <p className="text-sm text-indigo-700 bg-indigo-50 px-4 py-2 rounded border border-indigo-200">
              This submission has been published. Disposition is locked.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="contrib-disposition" className="block text-sm font-medium text-gray-700 mb-1">
                  Disposition
                </label>
                <select
                  id="contrib-disposition"
                  value={disposition}
                  onChange={e => setDisposition(e.target.value as CuratorSelectableDisposition)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="disposition"
                >
                  {DISPOSITION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {saving ? 'Saving…' : 'Save Disposition'}
              </button>
            </div>
          )}
        </div>

        {/* Create Record CTA — shown ONLY when disposition is ACCEPTED_FOR_CURATION */}
        {(savedDisposition === 'ACCEPTED_FOR_CURATION' || submission.disposition === 'ACCEPTED_FOR_CURATION') && (
          <div className="px-6 py-4 bg-green-50 border-t border-green-200">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-green-600 text-lg mt-0.5">✅</span>
              <div>
                <p className="font-semibold text-green-800">Accepted for Curation</p>
              </div>
            </div>
            <button
              onClick={handleCreateRecord}
              disabled={creatingRecord}
              className="w-full bg-green-700 hover:bg-green-800 disabled:bg-green-500 text-white px-5 py-3 rounded-md text-sm font-semibold transition-colors mb-3"
            >
              {creatingRecord ? 'Creating record…' : 'Create Innovation Record from This Submission →'}
            </button>
            <div className="text-xs text-green-700 space-y-1">
              <p className="font-medium">This will create a Draft record pre-populated with:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-1">
                <li>Problem Description → Problem Statement</li>
                <li>Work Description → What Was Explored</li>
                <li>Outcome Summary → Outcome Summary</li>
                <li>Artifact URLs → Artifact Links</li>
                <li>Source Type → COMMUNITY (set automatically)</li>
              </ul>
            </div>
          </div>
        )}

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

export function ContributionSubmissionsPage() {
  const [submissions, setSubmissions] = useState<ContributionSubmission[]>([]);
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
      const data = await adminFetch<{ data: ContributionSubmission[]; pagination: PaginationMeta }>(
        `/api/v1/admin/contribution-submissions?page=${p}&page_size=20`
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

  const handleSaved = (updatedDisposition: ContributionDisposition | null) => {
    // Update local state so re-render shows CTA without full refetch
    setSubmissions(prev =>
      prev.map(s => s.submission_id === selectedId ? { ...s, disposition: updatedDisposition } : s)
    );
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
        <ContributionDetailView
          submission={selectedSubmission}
          onBack={handleBack}
          onSaved={handleSaved}
          onToast={setToast}
        />
      </div>
    );
  }

  return (
    <div className="p-8">
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contribution Submissions</h1>
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Maturity</th>
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
                      <td className="px-4 py-3 text-gray-700">{sub.contributing_office}</td>
                      <td className="px-4 py-3 text-gray-700">{sub.contact_name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
                          {badgeLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {MATURITY_LABELS[sub.self_assessed_maturity] ?? sub.self_assessed_maturity}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedId(sub.submission_id)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-xs whitespace-nowrap"
                          aria-label={`Review submission from ${sub.contact_name}`}
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

export default ContributionSubmissionsPage;

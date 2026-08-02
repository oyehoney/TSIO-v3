/**
 * OpportunitySubmissionsPage.tsx — Admin page at /admin/submissions/opportunities.
 *
 * Renders a reverse-chronological list of opportunity submissions with
 * per-row detail view for disposition management.
 *
 * Dispositions: UNDER_REVIEW | ACCEPTED_FOR_CONSIDERATION | DECLINED | LINKED_TO_RECORD
 * LINKED_TO_RECORD: shows conditional linked_record_id input.
 *
 * API:
 *   GET  /api/v1/admin/opportunity-submissions — list with pagination
 *   PATCH /api/v1/admin/opportunity-submissions/:id — update disposition
 *
 * Per UX-Mockup Screen-09 and US-5.3 acceptance criteria.
 * F8: Curation and Administration — OpportunitySubmissionsPage
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OpportunitySubmission {
  submission_id: string;
  submitter_name: string;
  submitting_office: string;
  mission_area: string;
  problem_description: string;
  urgency_context?: string;
  known_constraints?: string;
  contact_email?: string;
  status: string;
  disposition: string | null;
  linked_record_id?: string | null;
  internal_note?: string | null;
  reviewed_at?: string | null;
  reviewed_by_user_id?: string | null;
  submitted_at: string;
}

interface Pagination {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DISPOSITIONS = [
  { value: 'UNDER_REVIEW',               label: 'Under Review' },
  { value: 'ACCEPTED_FOR_CONSIDERATION', label: 'Accepted for Consideration' },
  { value: 'DECLINED',                   label: 'Declined' },
  { value: 'LINKED_TO_RECORD',           label: 'Linked to Record' },
] as const;

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED:                 '#2563EB', // blue
  UNDER_REVIEW:              '#6B7280', // gray
  ACCEPTED_FOR_CONSIDERATION:'#16A34A', // green
  DECLINED:                  '#DC2626', // red
  LINKED_TO_RECORD:          '#0D9488', // teal
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

// ── Status badge ──────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string; disposition: string | null }> = ({ status, disposition }) => {
  const displayValue = disposition ?? status;
  const color = STATUS_COLORS[displayValue] ?? '#6B7280';
  const label = disposition
    ? (DISPOSITIONS.find(d => d.value === disposition)?.label ?? disposition)
    : 'New';

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
      {label}
    </span>
  );
};

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

// ── Detail view ───────────────────────────────────────────────────────────────

const SubmissionDetail: React.FC<{
  submission: OpportunitySubmission;
  onClose: () => void;
  onSaved: (updated: OpportunitySubmission) => void;
}> = ({ submission, onClose, onSaved }) => {
  const [disposition, setDisposition] = useState<string>(
    submission.disposition ?? 'UNDER_REVIEW'
  );
  const [linkedRecordId, setLinkedRecordId] = useState(submission.linked_record_id ?? '');
  const [internalNote, setInternalNote] = useState(submission.internal_note ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { disposition, internal_note: internalNote };
      if (disposition === 'LINKED_TO_RECORD') {
        payload.linked_record_id = linkedRecordId;
      }
      const updated = await adminFetch<OpportunitySubmission>(
        `/api/v1/admin/opportunity-submissions/${submission.submission_id}`,
        { method: 'PATCH', body: JSON.stringify(payload) }
      );
      setToast(true);
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save disposition');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 500,
        paddingTop: '48px',
        overflowY: 'auto',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '680px',
          padding: '32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          marginBottom: '48px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            Opportunity Submission Review
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#9CA3AF', padding: '0 4px' }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Submitter info */}
        <section style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: '#6B7280', fontWeight: 500 }}>Submitter: </span>
              <span style={{ color: '#111827' }}>{submission.submitter_name}</span>
            </div>
            <div>
              <span style={{ color: '#6B7280', fontWeight: 500 }}>Office: </span>
              <span style={{ color: '#111827' }}>{submission.submitting_office}</span>
            </div>
            <div>
              <span style={{ color: '#6B7280', fontWeight: 500 }}>Mission Area: </span>
              <span style={{ color: '#111827' }}>{submission.mission_area}</span>
            </div>
            {submission.contact_email && (
              <div>
                <span style={{ color: '#6B7280', fontWeight: 500 }}>Email: </span>
                <span style={{ color: '#111827' }}>{submission.contact_email}</span>
              </div>
            )}
            <div>
              <span style={{ color: '#6B7280', fontWeight: 500 }}>Submitted: </span>
              <span style={{ color: '#111827' }}>{formatDate(submission.submitted_at)}</span>
            </div>
          </div>
        </section>

        {/* Problem description */}
        <section style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
            Problem Description
          </h3>
          <p style={{ color: '#111827', lineHeight: 1.6, margin: 0, fontSize: '0.875rem' }}>
            {submission.problem_description}
          </p>
        </section>

        {submission.urgency_context && (
          <section style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
              Urgency Context
            </h3>
            <p style={{ color: '#111827', lineHeight: 1.6, margin: 0, fontSize: '0.875rem' }}>
              {submission.urgency_context}
            </p>
          </section>
        )}

        {submission.known_constraints && (
          <section style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
              Known Constraints
            </h3>
            <p style={{ color: '#111827', lineHeight: 1.6, margin: 0, fontSize: '0.875rem' }}>
              {submission.known_constraints}
            </p>
          </section>
        )}

        {/* Disposition section */}
        <div style={{ borderTop: '1px solid #E5E7EB', marginTop: '24px', paddingTop: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '16px' }}>
            Disposition
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="disposition-select"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '6px' }}
            >
              Disposition
            </label>
            <select
              id="disposition-select"
              aria-label="disposition"
              value={disposition}
              onChange={e => setDisposition(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: '#111827',
                backgroundColor: '#fff',
                cursor: 'pointer',
              }}
            >
              {DISPOSITIONS.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Conditional linked record ID input */}
          {disposition === 'LINKED_TO_RECORD' && (
            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="linked-record-id"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '6px' }}
              >
                Linked Record ID
                <span style={{ color: '#DC2626', marginLeft: '2px' }}>*</span>
              </label>
              <input
                id="linked-record-id"
                type="text"
                value={linkedRecordId}
                onChange={e => setLinkedRecordId(e.target.value)}
                placeholder="Enter the record ID to link..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: '#111827',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="internal-note"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '6px' }}
            >
              Internal Notes
              <span style={{ marginLeft: '8px', fontSize: '0.75rem', fontWeight: 400, color: '#9CA3AF' }}>
                (not visible to submitter)
              </span>
            </label>
            <textarea
              id="internal-note"
              value={internalNote}
              onChange={e => setInternalNote(e.target.value)}
              rows={3}
              placeholder="Add internal curator notes..."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: '#111827',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', color: '#DC2626', fontSize: '0.875rem', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 20px',
              backgroundColor: saving ? '#93C5FD' : '#1D4ED8',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving…' : 'Save Disposition'}
          </button>
        </div>

        {/* Disposition history */}
        {(submission.reviewed_at || submission.disposition) && (
          <div style={{ borderTop: '1px solid #E5E7EB', marginTop: '24px', paddingTop: '16px' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
              Disposition History
            </h3>
            {submission.reviewed_at ? (
              <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: 0 }}>
                Last reviewed: {new Date(submission.reviewed_at).toLocaleString('en-US')}
                {submission.reviewed_by_user_id && ` by curator ${submission.reviewed_by_user_id}`}
              </p>
            ) : (
              <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: 0 }}>No review history yet.</p>
            )}
          </div>
        )}

        {toast && <Toast message="Disposition saved." onClose={() => setToast(false)} />}
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

export const OpportunitySubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<OpportunitySubmission[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, page_size: 20, total_count: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const fetchSubmissions = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ page: String(p), page_size: '20' }).toString();
      const response = await adminFetch<{ data: OpportunitySubmission[]; pagination: Pagination }>(
        `/api/v1/admin/opportunity-submissions?${qs}`
      );
      setSubmissions(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError('Unable to load submissions. Please try again.');
      console.error('Failed to load opportunity submissions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions(page);
  }, [page, fetchSubmissions]);

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: String(newPage) });
  };

  const handleSaved = (updated: OpportunitySubmission) => {
    setSubmissions(prev =>
      prev.map(s => s.submission_id === updated.submission_id ? { ...s, ...updated } : s)
    );
  };

  const selectedSubmission = submissions.find(s => s.submission_id === selectedId);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div style={{ padding: '0' }}>
      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
          Opportunity Submissions
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0 }}>
          Review and disposition opportunity submissions from courts and federal entities.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Loading submissions…</p>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && submissions.length === 0 && (
        <div style={{ padding: '48px', textAlign: 'center', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
          <p style={{ color: '#6B7280', margin: 0 }}>No submissions received yet.</p>
        </div>
      )}

      {/* Submissions table */}
      {!loading && !error && submissions.length > 0 && (
        <>
          <div style={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  {['DATE', 'OFFICE', 'CONTACT', 'STATUS', ''].map(col => (
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
                {submissions.map((sub, idx) => (
                  <tr
                    key={sub.submission_id}
                    style={{ borderBottom: idx < submissions.length - 1 ? '1px solid #F3F4F6' : 'none' }}
                  >
                    <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: '#6B7280', whiteSpace: 'nowrap' }}>
                      {formatDate(sub.submitted_at)}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: '#111827' }}>
                      {sub.submitting_office}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: '#111827' }}>
                      <div>{sub.submitter_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>
                        {sub.problem_description.length > 120
                          ? sub.problem_description.slice(0, 120) + '…'
                          : sub.problem_description}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <StatusBadge status={sub.status} disposition={sub.disposition} />
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <a
                        href="#"
                        role="link"
                        onClick={e => { e.preventDefault(); setSelectedId(sub.submission_id); }}
                        style={{ fontSize: '0.875rem', color: '#1D4ED8', textDecoration: 'none', fontWeight: 500 }}
                      >
                        Review →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
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
                Page {pagination.page} of {pagination.total_pages} ({pagination.total_count} total)
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

      {/* Detail modal */}
      {selectedSubmission && (
        <SubmissionDetail
          submission={selectedSubmission}
          onClose={() => setSelectedId(null)}
          onSaved={updated => {
            handleSaved(updated);
            setSelectedId(null);
          }}
        />
      )}
    </div>
  );
};

export default OpportunitySubmissionsPage;

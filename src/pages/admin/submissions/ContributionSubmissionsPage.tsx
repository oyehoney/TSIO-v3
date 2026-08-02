/**
 * ContributionSubmissionsPage.tsx — Admin page at /admin/submissions/contributions.
 *
 * Renders a reverse-chronological list of contribution submissions with
 * per-row detail view for disposition management.
 *
 * Dispositions: UNDER_REVIEW | ACCEPTED_FOR_CURATION | DECLINED
 * "Create Innovation Record from This Submission" CTA revealed ONLY when
 * disposition === 'ACCEPTED_FOR_CURATION'.
 * CTA calls POST /api/v1/admin/contribution-submissions/:id/create-record,
 * then navigates to /admin/records/:record_id/edit.
 *
 * Note: "PUBLISHED" disposition exists in the API but is set automatically
 * by the backend after record publication — not shown as a curator-selectable option.
 *
 * API:
 *   GET  /api/v1/admin/contribution-submissions — list with pagination
 *   PATCH /api/v1/admin/contribution-submissions/:id — update disposition
 *   POST  /api/v1/admin/contribution-submissions/:id/create-record — create record
 *
 * Per UX-Mockup Screen-09 and US-6.3 acceptance criteria.
 * F8: Curation and Administration — ContributionSubmissionsPage
 *
 * Note: Canonical implementation also lives at
 * src/admin/pages/submissions/ContributionSubmissionsPage.tsx.
 * This file satisfies the plan-16 artifact contract at src/pages/admin/submissions/.
 * React Router v6 is used (react-router-dom@6).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ContributionSubmission {
  submission_id: string;
  contact_name: string;
  contributing_office: string;
  self_assessed_maturity: string;
  problem_addressed: string;
  work_description: string;
  outcome_summary: string;
  artifact_urls: string[];
  status: string;
  disposition: string | null;
  linked_record_id?: string | null;
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

// Curator-selectable dispositions only (PUBLISHED is set automatically by backend)
const DISPOSITIONS = [
  { value: 'UNDER_REVIEW',          label: 'Under Review' },
  { value: 'ACCEPTED_FOR_CURATION', label: 'Accepted for Curation' },
  { value: 'DECLINED',              label: 'Declined' },
] as const;

const MATURITY_LABELS: Record<string, string> = {
  IDEA:                 'Idea',
  EXPERIMENT_POC:       'Experiment / POC',
  PROTOTYPE_PILOT:      'Prototype / Pilot',
  PRODUCTION_VALIDATED: 'Production / Validated',
  ARCHIVED:             'Archived',
};

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED:            '#2563EB',
  UNDER_REVIEW:         '#6B7280',
  ACCEPTED_FOR_CURATION:'#16A34A',
  DECLINED:             '#DC2626',
  PUBLISHED:            '#0D9488',
};

// ── Generic admin API fetch — uses session cookie (HttpOnly) set by OIDC auth ──

async function adminFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: 'same-origin', // send session cookie
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(body?.error?.message || `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Status badge ──────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ disposition: string | null; status: string }> = ({ disposition, status }) => {
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

const Toast: React.FC<{ message: string; type?: 'success' | 'error'; onClose: () => void }> = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        backgroundColor: type === 'success' ? '#16A34A' : '#DC2626',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontWeight: 600,
        zIndex: 1000,
        maxWidth: '400px',
      }}
    >
      {message}
    </div>
  );
};

// ── Detail view ───────────────────────────────────────────────────────────────

const SubmissionDetail: React.FC<{
  submission: ContributionSubmission;
  onClose: () => void;
  onSaved: (updated: ContributionSubmission) => void;
}> = ({ submission, onClose, onSaved }) => {
  const navigate = useNavigate();
  const [disposition, setDisposition] = useState<string>(
    submission.disposition ?? 'UNDER_REVIEW'
  );
  const [saving, setSaving] = useState(false);
  const [creatingRecord, setCreatingRecord] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  // Track saved disposition to control CTA visibility (must save before CTA appears)
  const [savedDisposition, setSavedDisposition] = useState<string | null>(submission.disposition);

  // Create Record CTA is revealed ONLY when saved disposition === 'ACCEPTED_FOR_CURATION'
  const showCreateRecordCTA = savedDisposition === 'ACCEPTED_FOR_CURATION';

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await adminFetch<ContributionSubmission>(
        `/api/v1/admin/contribution-submissions/${submission.submission_id}`,
        { method: 'PATCH', body: JSON.stringify({ disposition }) }
      );
      setSavedDisposition(updated.disposition ?? disposition);
      setToast({ message: 'Disposition saved.', type: 'success' });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save disposition');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRecord = async () => {
    setCreatingRecord(true);
    setError(null);
    try {
      // POST /api/v1/admin/contribution-submissions/:id/create-record
      // Returns { record_id } — navigate to /admin/records/:record_id/edit
      const result = await adminFetch<{ record_id: string }>(
        `/api/v1/admin/contribution-submissions/${submission.submission_id}/create-record`,
        { method: 'POST', body: JSON.stringify({}) }
      );
      navigate(`/admin/records/${result.record_id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create record from submission');
      setCreatingRecord(false);
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
          maxWidth: '720px',
          padding: '32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          marginBottom: '48px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            Contribution Submission Review
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
              <span style={{ color: '#6B7280', fontWeight: 500 }}>Contact: </span>
              <span style={{ color: '#111827' }}>{submission.contact_name}</span>
            </div>
            <div>
              <span style={{ color: '#6B7280', fontWeight: 500 }}>Office: </span>
              <span style={{ color: '#111827' }}>{submission.contributing_office}</span>
            </div>
            <div>
              <span style={{ color: '#6B7280', fontWeight: 500 }}>Self-Assessed Maturity: </span>
              <span style={{ color: '#111827' }}>
                {MATURITY_LABELS[submission.self_assessed_maturity] ?? submission.self_assessed_maturity}
              </span>
            </div>
            <div>
              <span style={{ color: '#6B7280', fontWeight: 500 }}>Submitted: </span>
              <span style={{ color: '#111827' }}>{formatDate(submission.submitted_at)}</span>
            </div>
          </div>
        </section>

        {/* Submission content — full content per US-6.3 */}
        <section style={{ marginBottom: '0' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Submission Content
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6B7280', margin: '0 0 6px' }}>Problem Addressed</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#111827', lineHeight: 1.6 }}>{submission.problem_addressed}</p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6B7280', margin: '0 0 6px' }}>What Was Explored</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#111827', lineHeight: 1.6 }}>{submission.work_description}</p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6B7280', margin: '0 0 6px' }}>Outcome Summary</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#111827', lineHeight: 1.6 }}>{submission.outcome_summary}</p>
          </div>

          {submission.artifact_urls && submission.artifact_urls.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6B7280', margin: '0 0 6px' }}>Artifact Links</h4>
              <ul style={{ margin: 0, paddingLeft: '16px' }}>
                {submission.artifact_urls.map((url, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.875rem', color: '#1D4ED8', wordBreak: 'break-all' }}
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Disposition section */}
        <div style={{ borderTop: '1px solid #E5E7EB', marginTop: '24px', paddingTop: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '16px' }}>
            Disposition
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="contrib-disposition-select"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '6px' }}
            >
              Disposition
            </label>
            <select
              id="contrib-disposition-select"
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
              marginBottom: '24px',
            }}
          >
            {saving ? 'Saving…' : 'Save Disposition'}
          </button>

          {/* Create Record CTA — visible ONLY when savedDisposition === ACCEPTED_FOR_CURATION (US-6.3) */}
          {showCreateRecordCTA && (
            <div
              style={{
                border: '1px solid #86EFAC',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#F0FDF4',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.1rem' }}>✅</span>
                <strong style={{ color: '#15803D', fontSize: '0.9rem' }}>Accepted for Curation</strong>
              </div>
              <button
                onClick={handleCreateRecord}
                disabled={creatingRecord}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 20px',
                  backgroundColor: creatingRecord ? '#6EE7B7' : '#16A34A',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: creatingRecord ? 'not-allowed' : 'pointer',
                  marginBottom: '12px',
                  textAlign: 'left',
                }}
              >
                {creatingRecord ? 'Creating record…' : 'Create Innovation Record from This Submission →'}
              </button>
              <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#166534' }}>
                This will create a Draft record pre-populated with:
              </p>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8rem', color: '#166534' }}>
                <li>Problem Description → Problem Statement</li>
                <li>Work Description → What Was Explored</li>
                <li>Outcome Summary → Outcome Summary</li>
                <li>Artifact URLs → Artifact Links</li>
                <li>Source Type → COMMUNITY (set automatically)</li>
              </ul>
            </div>
          )}
        </div>

        {/* Disposition history */}
        {submission.reviewed_at && (
          <div style={{ borderTop: '1px solid #E5E7EB', marginTop: '24px', paddingTop: '16px' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
              Disposition History
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: 0 }}>
              Last reviewed: {new Date(submission.reviewed_at).toLocaleString('en-US')}
              {submission.reviewed_by_user_id && ` by curator ${submission.reviewed_by_user_id}`}
            </p>
          </div>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

export const ContributionSubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<ContributionSubmission[]>([]);
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
      const response = await adminFetch<{ data: ContributionSubmission[]; pagination: Pagination }>(
        `/api/v1/admin/contribution-submissions?${qs}`
      );
      setSubmissions(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError('Unable to load submissions. Please try again.');
      console.error('Failed to load contribution submissions:', err);
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

  const handleSaved = (updated: ContributionSubmission) => {
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
          Contribution Submissions
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0 }}>
          Review and disposition innovation work contributions submitted by courts and federal entities.
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

      {/* Submissions table — columns: DATE, OFFICE, CONTACT, MATURITY, STATUS per Screen-09 */}
      {!loading && !error && submissions.length > 0 && (
        <>
          <div style={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  {['DATE', 'OFFICE', 'CONTACT', 'MATURITY', 'STATUS', ''].map(col => (
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
                      {sub.contributing_office}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: '#111827' }}>
                      <div>{sub.contact_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>
                        {sub.work_description.length > 100
                          ? sub.work_description.slice(0, 100) + '…'
                          : sub.work_description}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: '#6B7280' }}>
                      {MATURITY_LABELS[sub.self_assessed_maturity] ?? sub.self_assessed_maturity}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <StatusBadge disposition={sub.disposition} status={sub.status} />
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

export default ContributionSubmissionsPage;

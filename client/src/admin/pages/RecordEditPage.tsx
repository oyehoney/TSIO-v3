// RecordEditPage.tsx — Full 29-field record create/edit form per UX-Mockup Screen 07
// Includes readiness checklist, inline governance definitions, GovernanceGate error display,
// state-dependent action buttons, and auto-save.

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReadinessChecklist, getMissingPubRequiredFields, RecordFormValues } from '../components/ReadinessChecklist';
import { PublicationStateChip } from '../components/PublicationStateChip';
import {
  PublicationLifecycleControls,
  PublicationState,
} from '../components/PublicationLifecycleControls';
import { GovernanceGateFeedback } from '../components/GovernanceGateFeedback';
import { MaturityLevelDropdown, ReviewStatusDropdown } from '../components/MaturityStatusDropdowns';

// ── Inline Maturity Definitions (per F9 / PRD Section 6.1) ──────────────────

const MATURITY_DEFINITIONS: Record<string, string> = {
  IDEA: 'A problem or opportunity has been identified and captured; no technical exploration yet.',
  EXPERIMENT_POC: 'A targeted exploration was conducted to test feasibility; results may be positive, negative, or inconclusive.',
  PROTOTYPE_PILOT: 'A working model or limited deployment was built; tested in a realistic environment.',
  PRODUCTION_VALIDATED: 'Fully deployed and operational; or a proven architectural pattern validated through review.',
  ARCHIVED: 'Work is no longer active; captured for institutional learning; not recommended for adoption.',
};

// ── Inline Review Status Definitions (per F9 / PRD Section 6.2) ─────────────

const REVIEW_STATUS_DEFINITIONS: Record<string, string> = {
  SUBMITTED: 'Record is in the system; not yet curated.',
  CURATED: 'I&R curator has structured and enriched the record; not yet externally reviewed.',
  TECHNICALLY_REVIEWED: 'I&R or AO technical team has assessed architecture and findings.',
  SECURITY_REVIEWED: 'Cybersecurity or ISSO review of security implications completed.',
  POLICY_REVIEWED: 'Legal, privacy, or policy review completed.',
  VALIDATED_FOR_REUSE: 'All applicable reviews completed; recommended as a reuse-ready pattern.',
  SUPERSEDED_RETIRED: 'Record replaced by a newer version or retired; retained for institutional record.',
};

// ── Section header component ─────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <h2
      style={{
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#6B7280',
        borderBottom: '1px solid #E5E7EB',
        paddingBottom: '8px',
        marginTop: '28px',
        marginBottom: '16px',
      }}
    >
      {title}
    </h2>
  );
}

// ── Form field components ────────────────────────────────────────────────────

function FieldLabel({
  label,
  required,
  htmlFor,
}: {
  label: string;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: 'block',
        fontSize: '13px',
        fontWeight: 600,
        color: '#374151',
        marginBottom: '4px',
      }}
    >
      {label}
      {required && (
        <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>
      )}
    </label>
  );
}

function FieldHint({ text }: { text: string }) {
  return (
    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '3px' }}>{text}</div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

function TextInput({ error, style, ...props }: InputProps) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        padding: '8px 12px',
        border: `1px solid ${error ? '#EF4444' : '#D1D5DB'}`,
        borderRadius: '6px',
        fontSize: '14px',
        outline: 'none',
        boxSizing: 'border-box',
        ...style,
      }}
    />
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

function TextArea({ error, style, ...props }: TextAreaProps) {
  return (
    <textarea
      {...props}
      style={{
        width: '100%',
        padding: '8px 12px',
        border: `1px solid ${error ? '#EF4444' : '#D1D5DB'}`,
        borderRadius: '6px',
        fontSize: '14px',
        outline: 'none',
        resize: 'vertical',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
        ...style,
      }}
    />
  );
}

// ── Warning modal for editing Published record ───────────────────────────────

function PublishedWarningModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '28px',
          maxWidth: '480px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
          ⚠ Edit Published Record
        </div>
        <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, marginBottom: '20px' }}>
          This record is currently <strong>Published</strong> and visible to all Hub users.
          Editing will move this record to <strong>Review</strong> state and remove it from
          public view until it is re-published.
        </p>
        <p style={{ fontSize: '14px', color: '#374151', marginBottom: '24px' }}>
          Are you sure you want to proceed?
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '9px 20px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: '#374151',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '9px 20px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#DC2626',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Yes, Edit Record
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main RecordEditPage ──────────────────────────────────────────────────────

const EMPTY_FORM: RecordFormValues = {
  title: '',
  short_summary: '',
  problem_statement: '',
  what_was_explored: '',
  outcome_summary: '',
  key_findings: [''],
  maturity_level: '',
  review_status: '',
  reuse_potential: '',
  source_type: '',
  default_perspective: 'EXECUTIVE',
  executive_perspective_text: '',
  executive_recommendation: '',
  technical_perspective_text: '',
  security_findings: '',
  performance_findings: '',
  reuse_guidance: '',
  mission_area_tags: [],
  technology_area_tags: [],
  owner_name: '',
  owner_office: '',
  contributing_office: '',
  contributor_attribution: '',
  artifact_links: [],
  engagement_options: [],
  last_reviewed_date: '',
  publication_state: 'DRAFT',
};

const ENGAGEMENT_OPTIONS_LIST = [
  { value: 'REQUEST_BRIEFING', label: 'Request Briefing' },
  { value: 'REQUEST_DEMO', label: 'Request Demo' },
  { value: 'REQUEST_ADOPTION_DISCUSSION', label: 'Request Adoption Discussion' },
  { value: 'REQUEST_TECHNICAL_GUIDANCE', label: 'Request Technical Guidance' },
  { value: 'SUBMIT_RELATED_PROBLEM', label: 'Submit Related Problem' },
];

const ARTIFACT_SOURCE_TYPES = ['Document', 'Code', 'Video', 'Diagram', 'Other'];

export function RecordEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  const [form, setForm] = useState<RecordFormValues>({ ...EMPTY_FORM });
  const [originalState, setOriginalState] = useState<string>('DRAFT');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [apiError, setApiError] = useState<string | null>(null);
  const [governanceError, setGovernanceError] = useState<string[] | null>(null);
  // showPublishedWarning removed — Plan 15 PublicationLifecycleControls handles all dialogs internally
  const [tagInput, setTagInput] = useState('');
  const [techTagInput, setTechTagInput] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef(form);
  formRef.current = form;

  // Load existing record — uses /api/v1/records/:id (implemented backend route per Plan 05)
  useEffect(() => {
    if (!isNew && id) {
      setLoading(true);
      fetch(`/api/v1/records/${id}`, { credentials: 'same-origin' })
        .then(r => r.json())
        .then((data: RecordFormValues & { error?: { message: string } }) => {
          if (data.error) throw new Error(data.error.message || 'Failed to load record.');
          const loaded: RecordFormValues = {
            ...EMPTY_FORM,
            ...data,
            key_findings: Array.isArray(data.key_findings) && data.key_findings.length > 0
              ? data.key_findings
              : [''],
            mission_area_tags: Array.isArray(data.mission_area_tags) ? data.mission_area_tags : [],
            technology_area_tags: Array.isArray(data.technology_area_tags) ? data.technology_area_tags : [],
            artifact_links: Array.isArray(data.artifact_links) ? data.artifact_links : [],
            engagement_options: Array.isArray(data.engagement_options) ? data.engagement_options : [],
          };
          setForm(loaded);
          setOriginalState(String(data.publication_state || 'DRAFT'));
          setLoading(false);
        })
        .catch((err: Error) => {
          setApiError(err?.message || 'Failed to load record.');
          setLoading(false);
        });
    }
    document.title = isNew
      ? 'New Record — TSIO Innovation Hub Admin'
      : 'Edit Record — TSIO Innovation Hub Admin';
  }, [id, isNew]);

  // Auto-save every 60 seconds when dirty
  useEffect(() => {
    if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setInterval(() => {
      if (isDirty && !isNew && id) {
        handleSave(true);
      }
    }, 60000);
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [isDirty, isNew, id]);

  const updateField = useCallback(
    <K extends keyof RecordFormValues>(field: K, value: RecordFormValues[K]) => {
      setForm(prev => ({ ...prev, [field]: value }));
      setIsDirty(true);
    },
    []
  );

  const handleSave = async (isAutoSave = false) => {
    if (saving) return;
    setSaving(true);
    setApiError(null);

    const payload = buildPayload(formRef.current);

    try {
      const url = isNew ? '/api/v1/records' : `/api/v1/records/${id}`;
      const method = isNew ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || `HTTP ${res.status}`);
      }
      if (isNew && data.record_id) {
        setSaving(false);
        setSaveStatus('saved');
        setIsDirty(false);
        navigate(`/admin/records/${String(data.record_id)}/edit`);
      } else {
        setSaving(false);
        setSaveStatus('saved');
        setIsDirty(false);
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (err: unknown) {
      setSaving(false);
      setSaveStatus('error');
      if (!isAutoSave) {
        setApiError((err as Error)?.message || 'Failed to save record.');
      }
    }
  };

  // handleTransitionSuccess / handleTransitionError: callbacks from PublicationLifecycleControls (Plan 15)
  const handleTransitionSuccess = (newState: string, publishedAt?: string) => {
    setForm(prev => ({
      ...prev,
      publication_state: newState,
      ...(publishedAt ? { published_at: publishedAt } : {}),
    }));
    setOriginalState(newState);
    setGovernanceError(null);
    setApiError(null);
  };

  const handleTransitionError = (code: string, blockingFields?: string[]) => {
    if (code === 'PUBLICATION_GATE_FAILED' && blockingFields && blockingFields.length > 0) {
      setGovernanceError(blockingFields);
    } else if (code === 'INVALID_SUPERSEDES_REF') {
      setApiError('The superseding record ID does not exist.');
    } else if (code === 'NETWORK_ERROR') {
      setApiError('Network error. Please try again.');
    } else {
      setApiError(`Transition failed: ${code}`);
    }
  };

  const pubState = form.publication_state || 'DRAFT';
  const missingFields = getMissingPubRequiredFields(form);
  const canTransition = missingFields.length === 0;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280', fontSize: '14px' }}>
        Loading record…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Top bar: title + publication state chip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>
            {isNew ? 'New Innovation Record' : (form.title || 'Edit Record')}
          </h1>
          {!isNew && (
            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
              ID: {id}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span data-testid="publication-state-badge"><PublicationStateChip state={pubState} /></span>
          {saveStatus === 'saved' && (
            <span style={{ fontSize: '12px', color: '#166534', fontWeight: 500 }}>✓ Saved</span>
          )}
          {saveStatus === 'error' && (
            <span style={{ fontSize: '12px', color: '#DC2626', fontWeight: 500 }}>Save failed</span>
          )}
        </div>
      </div>

      {/* ARCHIVED notice */}
      {pubState === 'ARCHIVED' && (
        <div
          style={{
            backgroundColor: '#F3F4F6',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '14px',
            color: '#374151',
          }}
        >
          <strong>ARCHIVED</strong> — This record has been archived and is no longer active.
          It is retained for institutional learning only.
        </div>
      )}

      {/* ARCHIVED maturity advisory for PUBLISHED records */}
      {form.maturity_level === 'ARCHIVED' && pubState === 'PUBLISHED' && (
        <div
          style={{
            backgroundColor: '#FEF3C7',
            border: '1px solid #FDE68A',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '14px',
            color: '#92400E',
          }}
        >
          <strong>Advisory:</strong> This record is currently published. Setting maturity to
          Archived indicates the innovation work is no longer active. Consider also archiving
          the publication state to remove it from the default catalog browse. This does not
          happen automatically.
        </div>
      )}

      {/* API error banner */}
      {apiError && (
        <div
          data-testid="save-error"
          role="alert"
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#991B1B',
            fontSize: '14px',
          }}
        >
          {apiError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', alignItems: 'start' }}>
        {/* Main form */}
        <div>
          {/* ── BASIC INFORMATION ── */}
          <SectionHeader title="Basic Information" />

          <div style={{ marginBottom: '16px' }}>
            <FieldLabel label="Title" required htmlFor="title" />
            <TextInput
              id="title"
              name="title"
              value={form.title || ''}
              onChange={e => updateField('title', e.target.value)}
              placeholder="5–200 characters"
              maxLength={200}
              disabled={pubState === 'ARCHIVED'}
            />
            <FieldHint text={`${(form.title || '').length} / 200 characters`} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <FieldLabel label="Short Summary" required htmlFor="short_summary" />
            <TextArea
              id="short_summary"
              name="short_summary"
              value={form.short_summary || ''}
              onChange={e => updateField('short_summary', e.target.value)}
              rows={3}
              maxLength={280}
              placeholder="One or two sentences for catalog display. Max 280 characters."
              disabled={pubState === 'ARCHIVED'}
            />
            <FieldHint text={`${(form.short_summary || '').length} / 280`} />
          </div>

          {/* ── MISSION & TECHNICAL CONTEXT ── */}
          <SectionHeader title="Mission & Technical Context" />

          <div style={{ marginBottom: '16px' }}>
            <FieldLabel label="Problem Statement" required htmlFor="problem_statement" />
            <TextArea
              id="problem_statement"
              name="problem_statement"
              value={form.problem_statement || ''}
              onChange={e => updateField('problem_statement', e.target.value)}
              rows={5}
              placeholder="Describe the problem or opportunity that was addressed. (50–5000 characters)"
              disabled={pubState === 'ARCHIVED'}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <FieldLabel label="What Was Explored" required htmlFor="what_was_explored" />
            <TextArea
              id="what_was_explored"
              name="what_was_explored"
              value={form.what_was_explored || ''}
              onChange={e => updateField('what_was_explored', e.target.value)}
              rows={5}
              placeholder="What approaches, technologies, or methods were tested. (50–5000 characters)"
              disabled={pubState === 'ARCHIVED'}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <FieldLabel label="Outcome Summary" required htmlFor="outcome_summary" />
            <TextArea
              id="outcome_summary"
              name="outcome_summary"
              value={form.outcome_summary || ''}
              onChange={e => updateField('outcome_summary', e.target.value)}
              rows={4}
              placeholder="Summary of results and conclusions. (50–3000 characters)"
              disabled={pubState === 'ARCHIVED'}
            />
          </div>

          {/* Key Findings — dynamic list */}
          <div style={{ marginBottom: '16px' }}>
            <FieldLabel label="Key Findings" required />
            {(form.key_findings || ['']).map((finding, idx) => (
              <div
                key={idx}
                style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}
              >
                <span style={{ marginTop: '9px', color: '#9CA3AF', fontSize: '13px', flexShrink: 0 }}>
                  {idx + 1}.
                </span>
                <TextInput
                  value={finding}
                  onChange={e => {
                    const updated = [...(form.key_findings || [])];
                    updated[idx] = e.target.value;
                    updateField('key_findings', updated);
                  }}
                  placeholder={`Finding ${idx + 1}`}
                  disabled={pubState === 'ARCHIVED'}
                  style={{ flex: 1 }}
                />
                {(form.key_findings || []).length > 1 && (
                  <button
                    onClick={() => {
                      const updated = (form.key_findings || []).filter((_, i) => i !== idx);
                      updateField('key_findings', updated);
                    }}
                    disabled={pubState === 'ARCHIVED'}
                    style={{
                      padding: '8px 10px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      color: '#EF4444',
                      cursor: 'pointer',
                      fontSize: '14px',
                      flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {(form.key_findings || []).length < 20 && (
              <button
                onClick={() => updateField('key_findings', [...(form.key_findings || []), ''])}
                disabled={pubState === 'ARCHIVED'}
                style={{
                  padding: '7px 14px',
                  border: '1px dashed #D1D5DB',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#6B7280',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                + Add Finding
              </button>
            )}
          </div>

          {/* ── GOVERNANCE & CLASSIFICATION ── */}
          <SectionHeader title="Governance & Classification" />

          {/* Maturity Level — Plan 15: MaturityLevelDropdown with inline definitions */}
          <MaturityLevelDropdown
            value={form.maturity_level || ''}
            onChange={v => updateField('maturity_level', v)}
            publicationState={pubState}
            disabled={pubState === 'ARCHIVED'}
          />

          {/* Review Status — Plan 15: ReviewStatusDropdown with inline definitions */}
          <ReviewStatusDropdown
            value={form.review_status || ''}
            onChange={v => updateField('review_status', v)}
            disabled={pubState === 'ARCHIVED'}
          />

          {/* Reuse Potential */}
          <div style={{ marginBottom: '16px' }}>
            <FieldLabel label="Reuse Potential" required />
            <div style={{ display: 'flex', gap: '20px', marginTop: '4px' }}>
              {(['HIGH', 'MEDIUM', 'LOW'] as const).map(val => (
                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', color: '#374151' }}>
                  <input
                    type="radio"
                    name="reuse_potential"
                    value={val}
                    checked={form.reuse_potential === val}
                    onChange={() => updateField('reuse_potential', val)}
                    disabled={pubState === 'ARCHIVED'}
                  />
                  {val.charAt(0) + val.slice(1).toLowerCase()}
                </label>
              ))}
            </div>
          </div>

          {/* Source Type */}
          <div style={{ marginBottom: '16px' }}>
            <FieldLabel label="Source Type" required />
            <div style={{ display: 'flex', gap: '20px', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', color: '#374151' }}>
                <input
                  type="radio"
                  name="source_type"
                  value="IIR"
                  checked={form.source_type === 'IIR'}
                  onChange={() => updateField('source_type', 'IIR')}
                  disabled={pubState === 'ARCHIVED'}
                />
                I&R-Conducted (IIR)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', color: '#374151' }}>
                <input
                  type="radio"
                  name="source_type"
                  value="COMMUNITY"
                  checked={form.source_type === 'COMMUNITY'}
                  onChange={() => updateField('source_type', 'COMMUNITY')}
                  disabled={pubState === 'ARCHIVED'}
                />
                Community-Contributed (COMMUNITY)
              </label>
            </div>
          </div>

          {/* ── PERSPECTIVES ── */}
          <SectionHeader title="Perspectives" />

          {/* Default Perspective */}
          <div style={{ marginBottom: '16px' }}>
            <FieldLabel label="Default Perspective" />
            <div style={{ display: 'flex', gap: '20px', marginTop: '4px' }}>
              {(['EXECUTIVE', 'TECHNICAL'] as const).map(val => (
                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', color: '#374151' }}>
                  <input
                    type="radio"
                    name="default_perspective"
                    value={val}
                    checked={form.default_perspective === val}
                    onChange={() => updateField('default_perspective', val)}
                    disabled={pubState === 'ARCHIVED'}
                  />
                  {val.charAt(0) + val.slice(1).toLowerCase()}
                </label>
              ))}
            </div>
          </div>

          {/* Executive Perspective Text */}
          <div style={{ marginBottom: '16px' }}>
            <FieldLabel label="Executive Perspective Text" required htmlFor="executive_perspective_text" />
            <TextArea
              id="executive_perspective_text"
              name="executive_perspective_text"
              value={form.executive_perspective_text || ''}
              onChange={e => updateField('executive_perspective_text', e.target.value)}
              rows={6}
              placeholder="REQUIRED — not yet filled. Describe the executive-level significance and strategic context. (50–3000 characters)"
              style={{
                borderColor: !form.executive_perspective_text ? '#EF4444' : '#D1D5DB',
                color: !form.executive_perspective_text ? '#9CA3AF' : 'inherit',
              }}
              disabled={pubState === 'ARCHIVED'}
            />
          </div>

          {/* Executive Recommendation */}
          <div style={{ marginBottom: '16px' }}>
            <FieldLabel label="Executive Recommendation" required htmlFor="executive_recommendation" />
            <TextArea
              id="executive_recommendation"
              name="executive_recommendation"
              value={form.executive_recommendation || ''}
              onChange={e => updateField('executive_recommendation', e.target.value)}
              rows={4}
              placeholder="REQUIRED. Clear action or guidance for decision-makers. (50–1000 characters)"
              style={{
                borderColor: !form.executive_recommendation ? '#EF4444' : '#D1D5DB',
              }}
              disabled={pubState === 'ARCHIVED'}
            />
          </div>

          {/* Technical Perspective Text */}
          <div style={{ marginBottom: '16px' }}>
            <FieldLabel label="Technical Perspective Text" htmlFor="technical_perspective_text" />
            <TextArea
              id="technical_perspective_text"
              name="technical_perspective_text"
              value={form.technical_perspective_text || ''}
              onChange={e => updateField('technical_perspective_text', e.target.value)}
              rows={5}
              placeholder="Optional. Technical detail for architects and engineers. (50–5000 characters)"
              disabled={pubState === 'ARCHIVED'}
            />
          </div>

          {/* Security Findings */}
          <div style={{ marginBottom: '16px' }}>
            <FieldLabel label="Security Findings" htmlFor="security_findings" />
            <TextArea
              id="security_findings"
              name="security_findings"
              value={form.security_findings || ''}
              onChange={e => updateField('security_findings', e.target.value)}
              rows={4}
              placeholder="Optional. Security and compliance considerations."
              disabled={pubState === 'ARCHIVED'}
            />
          </div>

          {/* Performance Findings */}
          <div style={{ marginBottom: '16px' }}>
            <FieldLabel label="Performance Findings" htmlFor="performance_findings" />
            <TextArea
              id="performance_findings"
              name="performance_findings"
              value={form.performance_findings || ''}
              onChange={e => updateField('performance_findings', e.target.value)}
              rows={3}
              placeholder="Optional. Performance metrics and benchmarks."
              disabled={pubState === 'ARCHIVED'}
            />
          </div>

          {/* Reuse Guidance */}
          <div style={{ marginBottom: '16px' }}>
            <FieldLabel label="Reuse Guidance" htmlFor="reuse_guidance" />
            <TextArea
              id="reuse_guidance"
              name="reuse_guidance"
              value={form.reuse_guidance || ''}
              onChange={e => updateField('reuse_guidance', e.target.value)}
              rows={4}
              placeholder="Optional. How other teams can replicate or build on this work."
              disabled={pubState === 'ARCHIVED'}
            />
          </div>

          {/* ── TAGS & CLASSIFICATION ── */}
          <SectionHeader title="Tags & Classification" />

          {/* Mission Area Tags */}
          <div style={{ marginBottom: '16px' }}>
            <FieldLabel label="Mission Area Tags" required />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {(form.mission_area_tags || []).map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: '#EFF6FF',
                    color: '#1E40AF',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  {tag}
                  <button
                    onClick={() => updateField('mission_area_tags', (form.mission_area_tags || []).filter((_, i) => i !== idx))}
                    disabled={pubState === 'ARCHIVED'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93C5FD', fontSize: '14px', padding: '0 2px' }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <TextInput
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && tagInput.trim()) {
                    e.preventDefault();
                    updateField('mission_area_tags', [...(form.mission_area_tags || []), tagInput.trim()]);
                    setTagInput('');
                  }
                }}
                placeholder="Add tag and press Enter"
                disabled={pubState === 'ARCHIVED'}
              />
              <button
                onClick={() => {
                  if (tagInput.trim()) {
                    updateField('mission_area_tags', [...(form.mission_area_tags || []), tagInput.trim()]);
                    setTagInput('');
                  }
                }}
                disabled={pubState === 'ARCHIVED' || !tagInput.trim()}
                style={{
                  padding: '8px 14px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                }}
              >
                + Add Tag
              </button>
            </div>
          </div>

          {/* Technology Area Tags */}
          <div style={{ marginBottom: '16px' }}>
            <FieldLabel label="Technology Area Tags" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {(form.technology_area_tags || []).map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: '#F0FDF4',
                    color: '#166534',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  {tag}
                  <button
                    onClick={() => updateField('technology_area_tags', (form.technology_area_tags || []).filter((_, i) => i !== idx))}
                    disabled={pubState === 'ARCHIVED'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#86EFAC', fontSize: '14px', padding: '0 2px' }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <TextInput
                value={techTagInput}
                onChange={e => setTechTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && techTagInput.trim()) {
                    e.preventDefault();
                    updateField('technology_area_tags', [...(form.technology_area_tags || []), techTagInput.trim()]);
                    setTechTagInput('');
                  }
                }}
                placeholder="Add tag and press Enter"
                disabled={pubState === 'ARCHIVED'}
              />
              <button
                onClick={() => {
                  if (techTagInput.trim()) {
                    updateField('technology_area_tags', [...(form.technology_area_tags || []), techTagInput.trim()]);
                    setTechTagInput('');
                  }
                }}
                disabled={pubState === 'ARCHIVED' || !techTagInput.trim()}
                style={{
                  padding: '8px 14px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                }}
              >
                + Add Tag
              </button>
            </div>
          </div>

          {/* ── OWNERSHIP & ATTRIBUTION ── */}
          <SectionHeader title="Ownership & Attribution" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <FieldLabel label="Owner Name" required htmlFor="owner_name" />
              <TextInput
                id="owner_name"
                name="owner_name"
                value={form.owner_name || ''}
                onChange={e => updateField('owner_name', e.target.value)}
                placeholder="e.g. Jane Smith"
                disabled={pubState === 'ARCHIVED'}
              />
            </div>
            <div>
              <FieldLabel label="Owner Office" required htmlFor="owner_office" />
              <TextInput
                id="owner_office"
                name="owner_office"
                value={form.owner_office || ''}
                onChange={e => updateField('owner_office', e.target.value)}
                placeholder="e.g. AO I&R Division"
                disabled={pubState === 'ARCHIVED'}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <FieldLabel label="Contributing Office" required htmlFor="contributing_office" />
            <TextInput
              id="contributing_office"
              name="contributing_office"
              value={form.contributing_office || ''}
              onChange={e => updateField('contributing_office', e.target.value)}
              placeholder="Office or team that contributed this innovation"
              disabled={pubState === 'ARCHIVED'}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <FieldLabel label="Contributor Attribution" htmlFor="contributor_attribution" />
            <TextInput
              id="contributor_attribution"
              name="contributor_attribution"
              value={form.contributor_attribution || ''}
              onChange={e => updateField('contributor_attribution', e.target.value)}
              placeholder="Optional. Individual contributor credit."
              disabled={pubState === 'ARCHIVED'}
            />
          </div>

          {/* ── ARTIFACT LINKS ── */}
          <SectionHeader title="Artifact Links" />

          {(form.artifact_links || []).map((link, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '10px',
                backgroundColor: '#FAFAFA',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Link {idx + 1}</span>
                <button
                  onClick={() => updateField('artifact_links', (form.artifact_links || []).filter((_, i) => i !== idx))}
                  disabled={pubState === 'ARCHIVED'}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#EF4444',
                    fontSize: '13px',
                  }}
                >
                  Remove
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <FieldLabel label="Label" htmlFor={`link-label-${idx}`} />
                  <TextInput
                    id={`link-label-${idx}`}
                    value={link.label}
                    onChange={e => {
                      const updated = [...(form.artifact_links || [])];
                      updated[idx] = { ...updated[idx], label: e.target.value };
                      updateField('artifact_links', updated);
                    }}
                    placeholder="e.g. Technical Report"
                    disabled={pubState === 'ARCHIVED'}
                  />
                </div>
                <div>
                  <FieldLabel label="Type" htmlFor={`link-type-${idx}`} />
                  <select
                    id={`link-type-${idx}`}
                    value={link.source_type}
                    onChange={e => {
                      const updated = [...(form.artifact_links || [])];
                      updated[idx] = { ...updated[idx], source_type: e.target.value };
                      updateField('artifact_links', updated);
                    }}
                    disabled={pubState === 'ARCHIVED'}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                    }}
                  >
                    {ARTIFACT_SOURCE_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <FieldLabel label="URL" htmlFor={`link-url-${idx}`} />
                <TextInput
                  id={`link-url-${idx}`}
                  type="url"
                  value={link.url}
                  onChange={e => {
                    const updated = [...(form.artifact_links || [])];
                    updated[idx] = { ...updated[idx], url: e.target.value };
                    updateField('artifact_links', updated);
                  }}
                  placeholder="https://..."
                  disabled={pubState === 'ARCHIVED'}
                />
                {link.url && !link.url.startsWith('https://') && (
                  <div style={{ fontSize: '11px', color: '#EF4444', marginTop: '3px' }}>
                    URL must start with https://
                  </div>
                )}
              </div>
            </div>
          ))}
          <button
            onClick={() =>
              updateField('artifact_links', [
                ...(form.artifact_links || []),
                { label: '', url: '', source_type: 'Document' },
              ])
            }
            disabled={pubState === 'ARCHIVED'}
            style={{
              padding: '8px 16px',
              border: '1px dashed #D1D5DB',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#6B7280',
              cursor: 'pointer',
              fontSize: '13px',
              marginBottom: '8px',
            }}
          >
            + Add Artifact Link
          </button>

          {/* ── ENGAGEMENT OPTIONS ── */}
          <SectionHeader title="Engagement Options" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {ENGAGEMENT_OPTIONS_LIST.map(opt => (
              <label
                key={opt.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#374151',
                }}
              >
                <input
                  type="checkbox"
                  checked={(form.engagement_options || []).includes(opt.value)}
                  onChange={e => {
                    const current = form.engagement_options || [];
                    if (e.target.checked) {
                      updateField('engagement_options', [...current, opt.value]);
                    } else {
                      updateField('engagement_options', current.filter(v => v !== opt.value));
                    }
                  }}
                  disabled={pubState === 'ARCHIVED'}
                  style={{ width: '16px', height: '16px' }}
                />
                {opt.label}
              </label>
            ))}
          </div>

          {/* ── DATES ── */}
          <SectionHeader title="Dates" />

          <div style={{ marginBottom: '16px' }}>
            <FieldLabel label="Last Reviewed Date" required htmlFor="last_reviewed_date" />
            <TextInput
              id="last_reviewed_date"
              name="last_reviewed_date"
              type="date"
              value={form.last_reviewed_date || ''}
              onChange={e => updateField('last_reviewed_date', e.target.value)}
              disabled={pubState === 'ARCHIVED'}
              error={!form.last_reviewed_date}
              style={{ maxWidth: '200px' }}
            />
            {!form.last_reviewed_date && (
              <div style={{ fontSize: '11px', color: '#EF4444', marginTop: '3px' }}>REQUIRED</div>
            )}
          </div>

          {/* ── Record metadata (display only) ── */}
          {!isNew && (
            <div
              style={{
                marginTop: '32px',
                paddingTop: '16px',
                borderTop: '1px solid #F3F4F6',
                fontSize: '11px',
                color: '#9CA3AF',
                display: 'flex',
                gap: '20px',
                flexWrap: 'wrap',
              }}
            >
              <span>ID: {form.record_id || id}</span>
              {form.created_at && (
                <span>Created: {new Date(form.created_at).toLocaleDateString('en-US')}</span>
              )}
              {form.updated_at && (
                <span>Updated: {new Date(form.updated_at).toLocaleDateString('en-US')}</span>
              )}
            </div>
          )}
        </div>

        {/* Right sidebar — Readiness Checklist + Lifecycle Controls (Plan 15) */}
        <div style={{ position: 'sticky', top: '24px' }} data-testid="readiness-checklist">
          <ReadinessChecklist record={form} />

          {/* GovernanceGateFeedback — Plan 15: inline error panel for PUBLICATION_GATE_FAILED */}
          <GovernanceGateFeedback blockingFields={governanceError ?? []} />

          {/* PublicationLifecycleControls — Plan 15: state-aware action buttons */}
          {!isNew && id && (
            <div style={{ marginTop: '16px' }} data-testid="lifecycle-controls-wrapper">
              <PublicationLifecycleControls
                publicationState={pubState as PublicationState}
                recordId={id}
                canSubmitForReview={canTransition}
                isSaving={saving}
                onSaveDraft={() => handleSave(false)}
                onTransitionSuccess={handleTransitionSuccess}
                onTransitionError={handleTransitionError}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helper: build API payload from form values ───────────────────────────────

function buildPayload(form: RecordFormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  const fields: (keyof RecordFormValues)[] = [
    'title', 'short_summary', 'problem_statement', 'what_was_explored',
    'outcome_summary', 'key_findings', 'maturity_level', 'review_status',
    'reuse_potential', 'source_type', 'default_perspective',
    'executive_perspective_text', 'executive_recommendation',
    'technical_perspective_text', 'security_findings', 'performance_findings',
    'reuse_guidance', 'mission_area_tags', 'technology_area_tags',
    'owner_name', 'owner_office', 'contributing_office', 'contributor_attribution',
    'artifact_links', 'engagement_options', 'last_reviewed_date',
  ];

  for (const field of fields) {
    const val = form[field];
    if (val !== undefined && val !== null) {
      payload[field] = val;
    }
  }

  // Filter out empty key_findings
  if (Array.isArray(payload.key_findings)) {
    payload.key_findings = (payload.key_findings as string[]).filter(f => f.trim());
  }

  return payload;
}

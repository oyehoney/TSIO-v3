/**
 * RecordEditPage.tsx — Full 29-field record create/edit form at /admin/records/new
 * and /admin/records/:id/edit.
 *
 * Per UX-Mockup Screen 07. All 29 fields organized in sections.
 *
 * Features:
 *   - Inline maturity/review status definitions per F9 / PRD §6.1/6.2
 *   - ReadinessChecklist with ✅/❌ for 17 pub-required fields (right sidebar)
 *   - GovernanceGate error banner listing missing fields
 *   - State-dependent action buttons (DRAFT/REVIEW/PUBLISHED/SUPERSEDED/ARCHIVED)
 *   - [Submit for Review] and [Publish] disabled when pub-required fields missing
 *   - Warning modal for editing Published record
 *   - ARCHIVED maturity advisory for Published records
 *   - Auto-save every 60s (draft); manual Save Draft always available
 *   - Save creates new record → redirect to /admin/records/{id}/edit
 *
 * F8: Curation and Administration — RecordEditPage
 * F9: Content, Maturity & Trust Model — inline governance definitions
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApiClient } from '../api/adminApiClient';
import { ReadinessChecklist, getMissingPubRequiredFields, RecordFormValues, ArtifactLink } from '../components/ReadinessChecklist';
import { PublicationStateChip } from '../components/PublicationStateChip';
import { PublicationLifecycleControls, PublicationState } from '../components/PublicationLifecycleControls';
import { GovernanceGateFeedback } from '../components/GovernanceGateFeedback';
import { MaturityLevelDropdown, ReviewStatusDropdown } from '../components/MaturityStatusDropdowns';
import { ConfirmationDialog } from '../components/ConfirmationDialog';

// ── Maturity definitions (F9 / PRD §6.1) ────────────────────────────────────
const MATURITY_DEFINITIONS: Record<string, string> = {
  IDEA: 'A problem or opportunity has been identified and captured; no technical exploration yet.',
  EXPERIMENT_POC: 'A targeted exploration was conducted to test feasibility; results may be positive, negative, or inconclusive.',
  PROTOTYPE_PILOT: 'A working model or limited deployment was built; tested in a realistic environment.',
  PRODUCTION_VALIDATED: 'Fully deployed and operational; or a proven architectural pattern validated through review.',
  ARCHIVED: 'Work is no longer active; captured for institutional learning; not recommended for adoption.',
};

// ── Review Status definitions (F9 / PRD §6.2) ───────────────────────────────
const REVIEW_STATUS_DEFINITIONS: Record<string, string> = {
  SUBMITTED: 'Record is in the system; not yet curated.',
  CURATED: 'I&R curator has structured and enriched the record; not yet externally reviewed.',
  TECHNICALLY_REVIEWED: 'I&R or AO technical team has assessed architecture and findings.',
  SECURITY_REVIEWED: 'Cybersecurity or ISSO review of security implications completed.',
  POLICY_REVIEWED: 'Legal, privacy, or policy review completed.',
  VALIDATED_FOR_REUSE: 'All applicable reviews completed; recommended as a reuse-ready pattern.',
  SUPERSEDED_RETIRED: 'Record replaced by a newer version or retired; retained for institutional record.',
};

const ENGAGEMENT_OPTIONS = [
  { value: 'REQUEST_BRIEFING', label: 'Request Briefing' },
  { value: 'REQUEST_DEMO', label: 'Request Demo' },
  { value: 'REQUEST_ADOPTION_DISCUSSION', label: 'Request Adoption Discussion' },
  { value: 'REQUEST_TECHNICAL_GUIDANCE', label: 'Request Technical Guidance' },
  { value: 'SUBMIT_RELATED_PROBLEM', label: 'Submit Related Problem' },
];

// ── Form field styles ────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #D1D5DB',
  borderRadius: '6px',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: '100px',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '32px',
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  color: '#6B7280',
  borderBottom: '1px solid #E5E7EB',
  paddingBottom: '8px',
  marginBottom: '20px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '4px',
};

const pubRequiredDotStyle: React.CSSProperties = {
  display: 'inline-block',
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: '#DC2626',
  marginLeft: '4px',
  verticalAlign: 'middle',
};

const PubRequiredDot: React.FC = () => <span style={pubRequiredDotStyle} title="Required for publication" />;

const helperStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#6B7280',
  marginTop: '4px',
};

const definitionStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#374151',
  backgroundColor: '#F0F9FF',
  border: '1px solid #BAE6FD',
  borderRadius: '4px',
  padding: '8px 12px',
  marginTop: '6px',
};

// ── Initial form values ──────────────────────────────────────────────────────
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
  record_id: undefined,
  created_at: undefined,
};

export const RecordEditPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  const [form, setForm] = useState<RecordFormValues>({ ...EMPTY_FORM });
  const [originalState, setOriginalState] = useState<string>('DRAFT');
  // publicationState mirrors form.publication_state but as a typed PublicationState
  // so PublicationLifecycleControls gets the correct type
  const [publicationStateTyped, setPublicationStateTyped] = useState<PublicationState>('DRAFT');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [apiError, setApiError] = useState<string | null>(null);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [governanceErrors, setGovernanceErrors] = useState<string[]>([]);
  const [blockingFields, setBlockingFields] = useState<string[]>([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingEdit, setPendingEdit] = useState(false);
  const [tagInput, setTagInput] = useState({ mission: '', technology: '' });

  // Auto-save tracking
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');
  const isDirtyRef = useRef(false);

  useEffect(() => {
    document.title = isNew
      ? 'New Record — Administration — TSIO Innovation Hub'
      : 'Edit Record — Administration — TSIO Innovation Hub';
  }, [isNew]);

  // Load existing record
  useEffect(() => {
    if (!isNew && id) {
      setLoading(true);
      adminApiClient.getRecord(id)
        .then(data => {
          const r = data as Record<string, unknown>;
          const loaded: RecordFormValues = {
            ...EMPTY_FORM,
            title: String(r.title || ''),
            short_summary: String(r.short_summary || ''),
            problem_statement: String(r.problem_statement || ''),
            what_was_explored: String(r.what_was_explored || ''),
            outcome_summary: String(r.outcome_summary || ''),
            key_findings: Array.isArray(r.key_findings) ? (r.key_findings as string[]) : [''],
            maturity_level: String(r.maturity_level || ''),
            review_status: String(r.review_status || ''),
            reuse_potential: String(r.reuse_potential || ''),
            source_type: String(r.source_type || ''),
            default_perspective: String(r.default_perspective || 'EXECUTIVE'),
            executive_perspective_text: String(r.executive_perspective_text || ''),
            executive_recommendation: String(r.executive_recommendation || ''),
            technical_perspective_text: String(r.technical_perspective_text || ''),
            security_findings: String(r.security_findings || ''),
            performance_findings: String(r.performance_findings || ''),
            reuse_guidance: String(r.reuse_guidance || ''),
            mission_area_tags: Array.isArray(r.mission_area_tags) ? (r.mission_area_tags as string[]) : [],
            technology_area_tags: Array.isArray(r.technology_area_tags) ? (r.technology_area_tags as string[]) : [],
            owner_name: String(r.owner_name || ''),
            owner_office: String(r.owner_office || ''),
            contributing_office: String(r.contributing_office || ''),
            contributor_attribution: String(r.contributor_attribution || ''),
            artifact_links: Array.isArray(r.artifact_links) ? (r.artifact_links as ArtifactLink[]) : [],
            engagement_options: Array.isArray(r.engagement_options) ? (r.engagement_options as string[]) : [],
            last_reviewed_date: String(r.last_reviewed_date || ''),
            publication_state: String(r.publication_state || 'DRAFT'),
            record_id: String(r.record_id || ''),
            created_at: String(r.created_at || ''),
          };
          setForm(loaded);
          setOriginalState(loaded.publication_state || 'DRAFT');
          setPublicationStateTyped((loaded.publication_state || 'DRAFT') as PublicationState);
          lastSavedRef.current = JSON.stringify(loaded);
        })
        .catch((err: Error & { status?: number }) => {
          setApiError(`Failed to load record: ${err.message}`);
        })
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  // Auto-save every 60s for draft
  useEffect(() => {
    if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    const interval = setInterval(() => {
      if (!isDirtyRef.current || (form.publication_state !== 'DRAFT' && !isNew)) return;
      const currentJson = JSON.stringify(form);
      if (currentJson === lastSavedRef.current) return;
      handleSaveDraft(true);
    }, 60000);
    autoSaveRef.current = interval;
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, isNew]);

  const updateForm = useCallback(<K extends keyof RecordFormValues>(key: K, value: RecordFormValues[K]) => {
    isDirtyRef.current = true;
    setForm(prev => ({ ...prev, [key]: value }));
    setGovernanceErrors([]); // Clear governance errors on any change
  }, []);

  // ── Save Draft ─────────────────────────────────────────────────────────────
  const handleSaveDraft = useCallback(async (isAutoSave = false) => {
    if (!isAutoSave) setSaving(true);
    setSaveIndicator('saving');
    setApiError(null);

    const payload: Record<string, unknown> = { ...form };
    // Clean key_findings — remove empty
    payload.key_findings = (form.key_findings || []).filter(f => f.trim());

    try {
      if (isNew) {
        const result = await adminApiClient.createRecord(payload);
        const newId = (result as Record<string, unknown>).record_id as string;
        lastSavedRef.current = JSON.stringify(form);
        isDirtyRef.current = false;
        setSaveIndicator('saved');
        navigate(`/admin/records/${newId}/edit`, { replace: true });
      } else {
        await adminApiClient.updateRecord(id!, payload);
        lastSavedRef.current = JSON.stringify(form);
        isDirtyRef.current = false;
        setSaveIndicator('saved');
      }
    } catch (err) {
      const e = err as Error & { status?: number };
      setSaveIndicator('error');
      if (!isAutoSave) setApiError(`Save failed: ${e.message}`);
    } finally {
      if (!isAutoSave) setSaving(false);
      // Clear "Saved" indicator after 3s
      setTimeout(() => setSaveIndicator(prev => prev === 'saved' ? 'idle' : prev), 3000);
    }
  }, [form, id, isNew, navigate]);

  // ── State transitions ──────────────────────────────────────────────────────
  const handleTransition = useCallback(async (action: string, extraData?: Record<string, unknown>) => {
    const missing = getMissingPubRequiredFields(form);
    if ((action === 'SUBMIT_FOR_REVIEW' || action === 'PUBLISH') && missing.length > 0) {
      setGovernanceErrors(missing);
      return;
    }
    setGovernanceErrors([]);
    setTransitionError(null);

    try {
      await adminApiClient.transitionRecord(id!, action, extraData);
      // Reload record to get updated state
      if (id) {
        const updated = await adminApiClient.getRecord(id);
        const u = updated as Record<string, unknown>;
        const newState = String(u.publication_state || 'DRAFT');
        setForm(prev => ({ ...prev, publication_state: newState }));
        setOriginalState(newState);
        setPublicationStateTyped(newState as PublicationState);
      }
    } catch (err) {
      const e = err as Error & { status?: number; code?: string };
      // Show API error — do not suppress (Wave 6b lifecycle endpoint not yet implemented)
      setTransitionError(e.message || `Transition failed (${action})`);
    }
  }, [form, id]);

  // ── PublicationLifecycleControls callbacks ─────────────────────────────────
  /** Called by PublicationLifecycleControls when a lifecycle transition succeeds */
  const handleLifecycleTransitionSuccess = useCallback((newState: string, publishedAt?: string) => {
    setPublicationStateTyped(newState as PublicationState);
    setBlockingFields([]);
    setGovernanceErrors([]);
    setTransitionError(null);
    setForm(prev => ({
      ...prev,
      publication_state: newState,
      ...(publishedAt ? { published_at: publishedAt } : {}),
    }));
    setOriginalState(newState);
  }, []);

  /** Called by PublicationLifecycleControls when a lifecycle transition fails */
  const handleLifecycleTransitionError = useCallback((code: string, fields?: string[]) => {
    if (code === 'PUBLICATION_GATE_FAILED' && fields && fields.length > 0) {
      setBlockingFields(fields);
      setGovernanceErrors([]); // GovernanceGateFeedback handles display from blockingFields
    } else if (code === 'INVALID_SUPERSEDES_REF') {
      setTransitionError('The superseding record ID does not exist.');
    } else {
      setTransitionError(`Transition failed: ${code}`);
    }
  }, []);

  // ── Published record edit warning ─────────────────────────────────────────
  const handleEditPublished = useCallback(() => {
    if (form.publication_state === 'PUBLISHED') {
      setShowWarningModal(true);
      setPendingEdit(true);
    }
  }, [form.publication_state]);

  const confirmEditPublished = useCallback(async () => {
    setShowWarningModal(false);
    await handleTransition('RETURN_TO_DRAFT');
  }, [handleTransition]);

  // Missing pub-required for button enable/disable
  const missingPubRequired = getMissingPubRequiredFields(form);
  const hasMissingPubRequired = missingPubRequired.length > 0;

  const pubState = publicationStateTyped || (form.publication_state as PublicationState) || 'DRAFT';

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              border: '3px solid #E5E7EB',
              borderTopColor: '#1D4ED8',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Loading record…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (apiError && !isNew) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ color: '#DC2626', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '16px' }}>
          {apiError}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Page header with state chip ─────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
              {isNew ? 'New Innovation Record' : (form.title || 'Edit Record')}
            </h1>
            <span data-testid="publication-state-badge">
              <PublicationStateChip state={pubState} />
            </span>
          </div>
          {!isNew && form.record_id && (
            <p style={{ color: '#9CA3AF', fontSize: '0.75rem', margin: 0, fontFamily: 'monospace' }}>
              ID: {form.record_id}
            </p>
          )}
        </div>
        {/* Save indicator */}
        <div style={{ fontSize: '0.8rem', color: saveIndicator === 'saved' ? '#16A34A' : saveIndicator === 'error' ? '#DC2626' : '#9CA3AF' }}>
          {saveIndicator === 'saving' && '⏳ Saving…'}
          {saveIndicator === 'saved' && '✓ Saved'}
          {saveIndicator === 'error' && '⚠ Save failed'}
        </div>
      </div>

      {/* ── API error banner ─────────────────────────────────────────────── */}
      {apiError && (
        <div style={{ color: '#DC2626', marginBottom: '16px', fontSize: '0.875rem' }}>
          {apiError}
        </div>
      )}

      {/* ── ARCHIVED record notice ───────────────────────────────────────── */}
      {pubState === 'ARCHIVED' && (
        <div
          style={{
            backgroundColor: '#F3F4F6',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            color: '#374151',
            fontSize: '0.875rem',
          }}
        >
          <strong>ARCHIVED</strong> — This record has been archived and is no longer active.
          It is retained for institutional learning and is not recommended for adoption.
          State transitions are not available for archived records.
        </div>
      )}

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* ── Main form ────────────────────────────────────────────────────── */}
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>

          {/* ── BASIC INFORMATION ─────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>Basic Information</h2>

            {/* Title */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>
                Title <PubRequiredDot /> <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(5–200 chars)</span>
              </label>
              <input
                name="title"
                type="text"
                value={form.title || ''}
                onChange={e => updateForm('title', e.target.value)}
                maxLength={200}
                placeholder="Enter record title…"
                style={inputStyle}
              />
              <div style={helperStyle}>{(form.title || '').length} / 200 characters</div>
            </div>

            {/* Short Summary */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>
                Short Summary <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(max 280 chars)</span>
              </label>
              <textarea
                value={form.short_summary || ''}
                onChange={e => updateForm('short_summary', e.target.value)}
                maxLength={280}
                placeholder="One or two sentences for catalog cards…"
                style={{ ...textareaStyle, minHeight: '70px' }}
              />
              <div style={helperStyle}>{(form.short_summary || '').length} / 280</div>
            </div>
          </div>

          {/* ── MISSION & TECHNICAL CONTEXT ───────────────────────────────── */}
          <div style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>Mission &amp; Technical Context</h2>

            {/* Problem Statement */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>
                Problem Statement <PubRequiredDot /> <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(50–5000 chars)</span>
              </label>
              <textarea
                value={form.problem_statement || ''}
                onChange={e => updateForm('problem_statement', e.target.value)}
                maxLength={5000}
                placeholder="What problem or mission need was addressed?…"
                style={textareaStyle}
              />
              <div style={helperStyle}>{(form.problem_statement || '').length} / 5000</div>
            </div>

            {/* What Was Explored */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>
                What Was Explored <PubRequiredDot /> <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(50–5000 chars)</span>
              </label>
              <textarea
                value={form.what_was_explored || ''}
                onChange={e => updateForm('what_was_explored', e.target.value)}
                maxLength={5000}
                placeholder="What innovation or approach was explored?…"
                style={textareaStyle}
              />
              <div style={helperStyle}>{(form.what_was_explored || '').length} / 5000</div>
            </div>

            {/* Outcome Summary */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>
                Outcome Summary <PubRequiredDot /> <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(50–3000 chars)</span>
              </label>
              <textarea
                value={form.outcome_summary || ''}
                onChange={e => updateForm('outcome_summary', e.target.value)}
                maxLength={3000}
                placeholder="What were the key results or outcomes?…"
                style={textareaStyle}
              />
              <div style={helperStyle}>{(form.outcome_summary || '').length} / 3000</div>
            </div>

            {/* Key Findings */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>
                Key Findings <PubRequiredDot /> <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(1–20 findings)</span>
              </label>
              {(form.key_findings || ['']).map((finding, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ lineHeight: '38px', color: '#9CA3AF', fontSize: '0.8rem', flexShrink: 0 }}>
                    {idx + 1}.
                  </span>
                  <textarea
                    value={finding}
                    onChange={e => {
                      const updated = [...(form.key_findings || [''])];
                      updated[idx] = e.target.value;
                      updateForm('key_findings', updated);
                    }}
                    placeholder="Enter a key finding…"
                    style={{ ...textareaStyle, minHeight: '70px', flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (form.key_findings || ['']).filter((_, i) => i !== idx);
                      updateForm('key_findings', updated.length > 0 ? updated : ['']);
                    }}
                    style={{
                      padding: '0 10px',
                      border: '1px solid #FECACA',
                      backgroundColor: '#FEF2F2',
                      color: '#DC2626',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      flexShrink: 0,
                      alignSelf: 'flex-start',
                      marginTop: '4px',
                    }}
                    title="Remove finding"
                  >
                    ×
                  </button>
                </div>
              ))}
              {(form.key_findings || []).length < 20 && (
                <button
                  type="button"
                  onClick={() => updateForm('key_findings', [...(form.key_findings || ['']), ''])}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    border: '1px dashed #D1D5DB',
                    borderRadius: '4px',
                    backgroundColor: '#F9FAFB',
                    color: '#374151',
                    cursor: 'pointer',
                  }}
                >
                  + Add Finding
                </button>
              )}
            </div>
          </div>

          {/* ── GOVERNANCE & CLASSIFICATION ───────────────────────────────── */}
          <div style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>Governance &amp; Classification</h2>

            {/* MaturityLevelDropdown — with inline definitions per US-9.3 */}
            <MaturityLevelDropdown
              value={form.maturity_level || ''}
              onChange={v => updateForm('maturity_level', v)}
              publicationState={pubState}
              disabled={pubState === 'ARCHIVED'}
              error={
                blockingFields.includes('maturity_level')
                  ? 'Maturity level is required before publishing.'
                  : undefined
              }
            />

            {/* ReviewStatusDropdown — with inline definitions per US-9.3 */}
            <ReviewStatusDropdown
              value={form.review_status || ''}
              onChange={v => updateForm('review_status', v)}
              disabled={pubState === 'ARCHIVED'}
              error={
                blockingFields.includes('review_status')
                  ? 'Review status is required before publishing.'
                  : undefined
              }
            />

            {/* Reuse Potential */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>
                Reuse Potential <PubRequiredDot />
              </label>
              <div style={{ display: 'flex', gap: '16px' }}>
                {['HIGH', 'MEDIUM', 'LOW'].map(val => (
                  <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input
                      type="radio"
                      name="reuse_potential"
                      value={val}
                      checked={form.reuse_potential === val}
                      onChange={() => updateForm('reuse_potential', val)}
                    />
                    {val.charAt(0) + val.slice(1).toLowerCase()}
                  </label>
                ))}
              </div>
            </div>

            {/* Source Type */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>
                Source Type <PubRequiredDot />
              </label>
              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input
                    type="radio"
                    name="source_type"
                    value="IIR"
                    checked={form.source_type === 'IIR'}
                    onChange={() => updateForm('source_type', 'IIR')}
                  />
                  I&amp;R-Conducted (IIR)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input
                    type="radio"
                    name="source_type"
                    value="COMMUNITY"
                    checked={form.source_type === 'COMMUNITY'}
                    onChange={() => updateForm('source_type', 'COMMUNITY')}
                  />
                  Community-Contributed (COMMUNITY)
                </label>
              </div>
            </div>
          </div>

          {/* ── PERSPECTIVES ──────────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>Perspectives</h2>

            {/* Default Perspective */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Default Perspective</label>
              <div style={{ display: 'flex', gap: '16px' }}>
                {['EXECUTIVE', 'TECHNICAL'].map(val => (
                  <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input
                      type="radio"
                      name="default_perspective"
                      value={val}
                      checked={form.default_perspective === val}
                      onChange={() => updateForm('default_perspective', val)}
                    />
                    {val.charAt(0) + val.slice(1).toLowerCase()}
                  </label>
                ))}
              </div>
            </div>

            {/* Executive Perspective Text */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>
                Executive Perspective Text <PubRequiredDot /> <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(50–3000 chars)</span>
              </label>
              <textarea
                value={form.executive_perspective_text || ''}
                onChange={e => updateForm('executive_perspective_text', e.target.value)}
                maxLength={3000}
                placeholder={!form.executive_perspective_text ? 'REQUIRED — not yet filled. Explain the strategic significance for executive stakeholders…' : ''}
                style={{
                  ...textareaStyle,
                  borderColor: !form.executive_perspective_text ? '#FCA5A5' : '#D1D5DB',
                }}
              />
              {!form.executive_perspective_text && (
                <div style={{ ...helperStyle, color: '#DC2626', fontWeight: 500 }}>REQUIRED — not yet filled</div>
              )}
              <div style={helperStyle}>{(form.executive_perspective_text || '').length} / 3000</div>
            </div>

            {/* Executive Recommendation */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>
                Executive Recommendation <PubRequiredDot /> <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(50–1000 chars)</span>
              </label>
              <textarea
                value={form.executive_recommendation || ''}
                onChange={e => updateForm('executive_recommendation', e.target.value)}
                maxLength={1000}
                placeholder={!form.executive_recommendation ? 'REQUIRED — recommended action or decision for leadership…' : ''}
                style={{
                  ...textareaStyle,
                  minHeight: '80px',
                  borderColor: !form.executive_recommendation ? '#FCA5A5' : '#D1D5DB',
                }}
              />
              {!form.executive_recommendation && (
                <div style={{ ...helperStyle, color: '#DC2626', fontWeight: 500 }}>REQUIRED</div>
              )}
              <div style={helperStyle}>{(form.executive_recommendation || '').length} / 1000</div>
            </div>

            {/* Technical Perspective Text */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>
                Technical Perspective Text <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional, 50–5000 chars)</span>
              </label>
              <textarea
                value={form.technical_perspective_text || ''}
                onChange={e => updateForm('technical_perspective_text', e.target.value)}
                maxLength={5000}
                placeholder="Detailed technical context for technical audiences…"
                style={textareaStyle}
              />
            </div>

            {/* Security Findings */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Security Findings <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span></label>
              <textarea
                value={form.security_findings || ''}
                onChange={e => updateForm('security_findings', e.target.value)}
                placeholder="Any security implications or findings…"
                style={{ ...textareaStyle, minHeight: '80px' }}
              />
            </div>

            {/* Performance Findings */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Performance Findings <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span></label>
              <textarea
                value={form.performance_findings || ''}
                onChange={e => updateForm('performance_findings', e.target.value)}
                placeholder="Performance characteristics and benchmarks…"
                style={{ ...textareaStyle, minHeight: '80px' }}
              />
            </div>

            {/* Reuse Guidance */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Reuse Guidance <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span></label>
              <textarea
                value={form.reuse_guidance || ''}
                onChange={e => updateForm('reuse_guidance', e.target.value)}
                placeholder="How can other teams adopt or reuse this innovation?…"
                style={{ ...textareaStyle, minHeight: '80px' }}
              />
            </div>
          </div>

          {/* ── TAGS & CLASSIFICATION ─────────────────────────────────────── */}
          <div style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>Tags &amp; Classification</h2>

            {/* Mission Area Tags */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>
                Mission Area Tags <PubRequiredDot /> <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(1+ required)</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                {(form.mission_area_tags || []).map((tag, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      backgroundColor: '#EEF2FF',
                      color: '#3730A3',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (form.mission_area_tags || []).filter((_, i) => i !== idx);
                        updateForm('mission_area_tags', updated);
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3730A3', padding: '0 2px', fontSize: '1rem', lineHeight: 1 }}
                      title="Remove tag"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={tagInput.mission}
                  onChange={e => setTagInput(prev => ({ ...prev, mission: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && tagInput.mission.trim()) {
                      e.preventDefault();
                      updateForm('mission_area_tags', [...(form.mission_area_tags || []), tagInput.mission.trim()]);
                      setTagInput(prev => ({ ...prev, mission: '' }));
                    }
                  }}
                  placeholder="Type tag and press Enter…"
                  style={{ ...inputStyle, width: 'auto', flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (tagInput.mission.trim()) {
                      updateForm('mission_area_tags', [...(form.mission_area_tags || []), tagInput.mission.trim()]);
                      setTagInput(prev => ({ ...prev, mission: '' }));
                    }
                  }}
                  style={{
                    padding: '8px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    backgroundColor: '#F9FAFB',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  + Add tag
                </button>
              </div>
            </div>

            {/* Technology Area Tags */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>
                Technology Area Tags <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                {(form.technology_area_tags || []).map((tag, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      backgroundColor: '#F0FDF4',
                      color: '#166534',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (form.technology_area_tags || []).filter((_, i) => i !== idx);
                        updateForm('technology_area_tags', updated);
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534', padding: '0 2px', fontSize: '1rem', lineHeight: 1 }}
                      title="Remove tag"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={tagInput.technology}
                  onChange={e => setTagInput(prev => ({ ...prev, technology: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && tagInput.technology.trim()) {
                      e.preventDefault();
                      updateForm('technology_area_tags', [...(form.technology_area_tags || []), tagInput.technology.trim()]);
                      setTagInput(prev => ({ ...prev, technology: '' }));
                    }
                  }}
                  placeholder="Type tag and press Enter…"
                  style={{ ...inputStyle, width: 'auto', flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (tagInput.technology.trim()) {
                      updateForm('technology_area_tags', [...(form.technology_area_tags || []), tagInput.technology.trim()]);
                      setTagInput(prev => ({ ...prev, technology: '' }));
                    }
                  }}
                  style={{
                    padding: '8px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    backgroundColor: '#F9FAFB',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  + Add tag
                </button>
              </div>
            </div>
          </div>

          {/* ── OWNERSHIP & ATTRIBUTION ───────────────────────────────────── */}
          <div style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>Ownership &amp; Attribution</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Owner Name <PubRequiredDot /></label>
                <input
                  type="text"
                  value={form.owner_name || ''}
                  onChange={e => updateForm('owner_name', e.target.value)}
                  placeholder="Full name of primary owner…"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Owner Office <PubRequiredDot /></label>
                <input
                  type="text"
                  value={form.owner_office || ''}
                  onChange={e => updateForm('owner_office', e.target.value)}
                  placeholder="Office or unit designation…"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Contributing Office <PubRequiredDot /></label>
                <input
                  type="text"
                  value={form.contributing_office || ''}
                  onChange={e => updateForm('contributing_office', e.target.value)}
                  placeholder="Office that contributed this work…"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Contributor Attribution <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span></label>
                <input
                  type="text"
                  value={form.contributor_attribution || ''}
                  onChange={e => updateForm('contributor_attribution', e.target.value)}
                  placeholder="Individual contributor credit…"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* ── ARTIFACT LINKS ────────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>Artifact Links</h2>
            <p style={{ ...helperStyle, marginBottom: '12px' }}>
              <PubRequiredDot /> At least one artifact link required for publication.
              All URLs must begin with https://.
            </p>

            {(form.artifact_links || []).map((link, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px',
                  backgroundColor: '#F9FAFB',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
                    Artifact {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (form.artifact_links || []).filter((_, i) => i !== idx);
                      updateForm('artifact_links', updated);
                    }}
                    style={{
                      padding: '3px 10px',
                      border: '1px solid #FECACA',
                      backgroundColor: '#FEF2F2',
                      color: '#DC2626',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                    }}
                  >
                    × Remove
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Label</label>
                    <input
                      type="text"
                      value={link.label}
                      onChange={e => {
                        const updated = [...(form.artifact_links || [])];
                        updated[idx] = { ...updated[idx], label: e.target.value };
                        updateForm('artifact_links', updated);
                      }}
                      placeholder="e.g. Technical Report"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>URL (https://)</label>
                    <input
                      type="url"
                      value={link.url}
                      onChange={e => {
                        const updated = [...(form.artifact_links || [])];
                        updated[idx] = { ...updated[idx], url: e.target.value };
                        updateForm('artifact_links', updated);
                      }}
                      placeholder="https://..."
                      style={{
                        ...inputStyle,
                        borderColor: link.url && !link.url.startsWith('https://') ? '#FCA5A5' : '#D1D5DB',
                      }}
                    />
                    {link.url && !link.url.startsWith('https://') && (
                      <div style={{ ...helperStyle, color: '#DC2626' }}>URL must start with https://</div>
                    )}
                  </div>
                  <div>
                    <label style={labelStyle}>Type</label>
                    <select
                      value={link.source_type}
                      onChange={e => {
                        const updated = [...(form.artifact_links || [])];
                        updated[idx] = { ...updated[idx], source_type: e.target.value };
                        updateForm('artifact_links', updated);
                      }}
                      style={{ ...inputStyle }}
                    >
                      <option value="">— Type —</option>
                      <option value="Document">Document</option>
                      <option value="Code">Code</option>
                      <option value="Video">Video</option>
                      <option value="Diagram">Diagram</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                updateForm('artifact_links', [
                  ...(form.artifact_links || []),
                  { label: '', url: '', source_type: '' },
                ])
              }
              style={{
                padding: '8px 16px',
                fontSize: '0.8rem',
                border: '1px dashed #D1D5DB',
                borderRadius: '6px',
                backgroundColor: '#F9FAFB',
                color: '#374151',
                cursor: 'pointer',
              }}
            >
              + Add Artifact Link
            </button>
          </div>

          {/* ── ENGAGEMENT OPTIONS ───────────────────────────────────────── */}
          <div style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>Engagement Options</h2>
            <p style={{ ...helperStyle, marginBottom: '12px' }}>
              <PubRequiredDot /> Select at least one engagement option to enable for hub visitors.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {ENGAGEMENT_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.875rem', color: '#374151' }}
                >
                  <input
                    type="checkbox"
                    checked={(form.engagement_options || []).includes(opt.value)}
                    onChange={e => {
                      const current = form.engagement_options || [];
                      if (e.target.checked) {
                        updateForm('engagement_options', [...current, opt.value]);
                      } else {
                        updateForm('engagement_options', current.filter(o => o !== opt.value));
                      }
                    }}
                    style={{ width: '16px', height: '16px' }}
                  />
                  {opt.label}
                  <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>({opt.value})</span>
                </label>
              ))}
            </div>
          </div>

          {/* ── DATES ─────────────────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>Dates</h2>

            <div style={{ maxWidth: '240px' }}>
              <label style={labelStyle}>
                Last Reviewed Date <PubRequiredDot />
              </label>
              <input
                type="date"
                value={form.last_reviewed_date || ''}
                onChange={e => updateForm('last_reviewed_date', e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: !form.last_reviewed_date ? '#FCA5A5' : '#D1D5DB',
                }}
              />
              {!form.last_reviewed_date && (
                <div style={{ ...helperStyle, color: '#DC2626', fontWeight: 500 }}>REQUIRED</div>
              )}
            </div>
          </div>

          {/* ── ACTION BUTTONS & GOVERNANCE GATE ────────────────────────── */}
          <div
            style={{
              position: 'sticky',
              bottom: 0,
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #E5E7EB',
              padding: '16px 0',
              marginTop: '24px',
            }}
            data-testid="lifecycle-controls-wrapper"
          >
            {/* GovernanceGateFeedback — from PublicationLifecycleControls PUBLICATION_GATE_FAILED */}
            <GovernanceGateFeedback blockingFields={blockingFields} />

            {/* Legacy governance errors from inline transition handler */}
            {governanceErrors.length > 0 && blockingFields.length === 0 && (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#991B1B', marginBottom: '8px' }}>
                  ⛔ Cannot publish — missing required fields:
                </div>
                <ul style={{ margin: '0 0 8px 16px', padding: 0, color: '#B91C1C', fontSize: '0.8rem' }}>
                  {governanceErrors.map(field => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
                <div style={{ fontSize: '0.8rem', color: '#991B1B' }}>
                  Complete all required fields and try again.
                </div>
              </div>
            )}

            {/* Transition error */}
            {transitionError && (
              <div
                style={{ color: '#DC2626', marginBottom: '12px', fontSize: '0.875rem', backgroundColor: '#FEF2F2', padding: '10px 14px', borderRadius: '6px' }}
                data-testid="save-error"
              >
                {transitionError}
              </div>
            )}

            {/* PublicationLifecycleControls — state-aware action buttons for all 5 states */}
            {!isNew && id ? (
              <PublicationLifecycleControls
                publicationState={pubState}
                recordId={id}
                canSubmitForReview={!hasMissingPubRequired}
                isSaving={saving}
                onSaveDraft={handleSaveDraft}
                onTransitionSuccess={handleLifecycleTransitionSuccess}
                onTransitionError={handleLifecycleTransitionError}
              />
            ) : isNew ? (
              /* New record — just show Save / Create button */
              <button
                type="button"
                onClick={() => handleSaveDraft()}
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#1D4ED8',
                  color: '#FFFFFF',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
                data-testid="create-record-btn"
              >
                {saving ? 'Creating…' : 'Create Record'}
              </button>
            ) : null}
          </div>

          {/* ── Footer with record metadata ──────────────────────────────── */}
          {!isNew && (
            <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '16px', marginTop: '32px', color: '#9CA3AF', fontSize: '0.75rem' }}>
              <p style={{ margin: '2px 0' }}>
                Record ID: <span style={{ fontFamily: 'monospace' }}>{form.record_id}</span>
              </p>
              {form.created_at && (
                <p style={{ margin: '2px 0' }}>
                  Created: {new Date(form.created_at).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Sidebar: Publication Readiness Checklist ──────────────────── */}
        <div style={{ width: '280px', flexShrink: 0, position: 'sticky', top: '24px', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto' }}>
          <ReadinessChecklist record={form} />

          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '6px', fontSize: '0.75rem', color: '#6B7280' }}>
            <span style={{ ...pubRequiredDotStyle, display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }} />
            Required for publication
          </div>
        </div>
      </div>

      {/* ── Warning modal: editing published record (legacy inline path) ─────── */}
      {/* Note: PublicationLifecycleControls handles this dialog internally via ConfirmationDialog.
          This legacy modal is kept for backward compatibility with handleEditPublished callback. */}
      <ConfirmationDialog
        open={showWarningModal}
        title="Edit Published Record"
        body={
          <>
            <p style={{ marginBottom: '8px' }}>
              This record is currently Published and visible to all Hub users.
            </p>
            <p>
              Editing will move this record to <strong>Review state</strong> and remove it from
              public view until it is re-published.
            </p>
            <p style={{ marginTop: '8px' }}>Are you sure you want to proceed?</p>
          </>
        }
        confirmLabel="Yes, Edit Record"
        variant="danger"
        onConfirm={() => {
          setShowWarningModal(false);
          setPendingEdit(false);
          confirmEditPublished();
        }}
        onCancel={() => { setShowWarningModal(false); setPendingEdit(false); }}
      />
    </div>
  );
};

export default RecordEditPage;

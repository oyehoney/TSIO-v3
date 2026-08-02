/**
 * PublicationLifecycleControls.tsx
 *
 * State-aware publication lifecycle action buttons for RecordEditPage.
 *
 * UX Mockup Screen 07 — State Transition Actions table:
 *   DRAFT    → [Save Draft] [Submit for Review ▶]
 *   REVIEW   → [Save Draft] [Publish ▶] [Return to Draft]
 *   PUBLISHED → [Edit (confirmation)] [Supersede (dialog)] [Archive (confirmation)]
 *   SUPERSEDED → [Archive (confirmation)]
 *   ARCHIVED  → (read-only; no actions)
 *
 * Per US-2.3: "Submit for Review is disabled until all pub-required fields are complete"
 * Per US-2.4: "Supersede requires linked_record_id of newer record"
 * Per US-8.2: "Edit Published Record warning modal before PUBLISHED → REVIEW transition"
 *
 * Maps exactly to VALID_TRANSITIONS in publicationLifecycleService.js (05-PLAN.md).
 * API endpoints from 05-PLAN.md recordHandler.js integration contract.
 *
 * F8: Curation and Administration — publication lifecycle action buttons
 */

import React, { useState } from 'react';
import { ConfirmationDialog } from './ConfirmationDialog';

export type PublicationState = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'SUPERSEDED' | 'ARCHIVED';

export interface PublicationLifecycleControlsProps {
  publicationState: PublicationState;
  recordId: string;
  /** true only when all 18 pub-required fields are complete — disables Submit for Review when false */
  canSubmitForReview: boolean;
  isSaving?: boolean;
  onSaveDraft?: () => Promise<void>;
  onTransitionSuccess: (newState: string, publishedAt?: string) => void;
  onTransitionError: (code: string, blockingFields?: string[]) => void;
}

type DialogType = 'edit-published' | 'archive' | 'supersede' | null;

export function PublicationLifecycleControls({
  publicationState,
  recordId,
  canSubmitForReview,
  isSaving = false,
  onSaveDraft,
  onTransitionSuccess,
  onTransitionError,
}: PublicationLifecycleControlsProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);

  /**
   * Calls a lifecycle transition API endpoint and fires the appropriate callback.
   * endpoint: path segment after /api/v1/records/:id/ (e.g. 'publish', 'archive')
   *           pass '' for PATCH to base record URL (edit-published X-Confirm-Edit)
   */
  const callTransition = async (
    endpoint: string,
    method: 'POST' | 'PATCH' = 'POST',
    body?: Record<string, unknown>,
    headers?: Record<string, string>,
  ) => {
    setIsTransitioning(true);
    try {
      const url = endpoint
        ? `/api/v1/records/${recordId}/${endpoint}`
        : `/api/v1/records/${recordId}`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        credentials: 'same-origin',
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const code = (data as { error?: { code?: string } })?.error?.code ?? 'UNKNOWN_ERROR';
        // Extract blocking_fields from PUBLICATION_GATE_FAILED error envelope (05-PLAN.md §4.1)
        const rawFields = (data as { error?: { fields?: Array<{ field: string }> } })?.error?.fields ?? [];
        const blockingFields: string[] = rawFields.map((f) => f.field);
        onTransitionError(code, blockingFields.length > 0 ? blockingFields : undefined);
      } else {
        const record = data as { publication_state?: string; published_at?: string };
        onTransitionSuccess(record.publication_state ?? '', record.published_at);
      }
    } catch {
      onTransitionError('NETWORK_ERROR');
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleSubmitForReview = () => callTransition('submit-review');
  const handlePublish = () => callTransition('publish');
  const handleReturnToDraft = () => callTransition('return-to-draft');

  const handleConfirmEditPublished = () => {
    setActiveDialog(null);
    // PATCH with X-Confirm-Edit: true transitions PUBLISHED → REVIEW (05-PLAN.md recordService.updateRecord)
    callTransition('', 'PATCH', {}, { 'X-Confirm-Edit': 'true' });
  };

  const handleConfirmSupersede = (data?: Record<string, string>) => {
    setActiveDialog(null);
    if (data?.superseded_by_record_id) {
      callTransition('supersede', 'POST', {
        superseded_by_record_id: data.superseded_by_record_id,
      });
    }
  };

  const handleConfirmArchive = () => {
    setActiveDialog(null);
    callTransition('archive');
  };

  const disabled = isTransitioning || isSaving;

  // Button style helpers
  const primaryBtnStyle = (color: string, hoverColor: string): React.CSSProperties => ({
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: color,
    color: '#FFFFFF',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '0.875rem',
    fontWeight: 600,
    opacity: disabled ? 0.6 : 1,
    transition: 'background-color 0.15s',
  });

  const outlineBtnStyle = (borderColor: string, textColor: string, bgColor: string): React.CSSProperties => ({
    padding: '10px 20px',
    border: `1px solid ${borderColor}`,
    borderRadius: '6px',
    backgroundColor: bgColor,
    color: textColor,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
    opacity: disabled ? 0.6 : 1,
  });

  return (
    <>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}
        aria-label="Publication lifecycle actions"
        data-testid="lifecycle-controls"
        data-publication-state={publicationState}
      >
        {/* ── DRAFT ──────────────────────────────────────── */}
        {publicationState === 'DRAFT' && (
          <>
            {onSaveDraft && (
              <button
                type="button"
                style={outlineBtnStyle('#D1D5DB', '#374151', '#FFFFFF')}
                onClick={onSaveDraft}
                disabled={disabled}
                aria-label="Save draft"
              >
                {isSaving ? 'Saving…' : 'Save Draft'}
              </button>
            )}
            <button
              type="button"
              style={{
                ...primaryBtnStyle(canSubmitForReview ? '#1D4ED8' : '#E5E7EB', '#1E40AF'),
                color: canSubmitForReview ? '#FFFFFF' : '#9CA3AF',
                cursor: !canSubmitForReview || disabled ? 'not-allowed' : 'pointer',
              }}
              onClick={handleSubmitForReview}
              disabled={disabled || !canSubmitForReview}
              aria-disabled={!canSubmitForReview}
              aria-label={
                canSubmitForReview
                  ? 'Submit for review'
                  : 'Submit for Review — complete all required fields first'
              }
              title={
                !canSubmitForReview
                  ? 'Complete all pub-required fields before submitting for review'
                  : undefined
              }
              data-testid="submit-for-review-btn"
            >
              Submit for Review ▶
            </button>
          </>
        )}

        {/* ── REVIEW ──────────────────────────────────────── */}
        {publicationState === 'REVIEW' && (
          <>
            {onSaveDraft && (
              <button
                type="button"
                style={outlineBtnStyle('#D1D5DB', '#374151', '#FFFFFF')}
                onClick={onSaveDraft}
                disabled={disabled}
              >
                {isSaving ? 'Saving…' : 'Save Draft'}
              </button>
            )}
            <button
              type="button"
              style={outlineBtnStyle('#FDE68A', '#92400E', '#FFFBEB')}
              onClick={handleReturnToDraft}
              disabled={disabled}
              data-testid="return-to-draft-btn"
            >
              Return to Draft
            </button>
            <button
              type="button"
              style={primaryBtnStyle('#16A34A', '#15803D')}
              onClick={handlePublish}
              disabled={disabled}
              data-testid="publish-btn"
            >
              Publish ▶
            </button>
          </>
        )}

        {/* ── PUBLISHED ──────────────────────────────────── */}
        {publicationState === 'PUBLISHED' && (
          <>
            {/* Edit opens warning modal per UX Mockup Screen 07 */}
            <button
              type="button"
              style={outlineBtnStyle('#BFDBFE', '#1D4ED8', '#EFF6FF')}
              onClick={() => setActiveDialog('edit-published')}
              disabled={disabled}
              data-testid="edit-published-btn"
            >
              Edit
            </button>
            <button
              type="button"
              style={outlineBtnStyle('#FDE68A', '#92400E', '#FFFBEB')}
              onClick={() => setActiveDialog('supersede')}
              disabled={disabled}
              data-testid="supersede-btn"
            >
              Supersede
            </button>
            <button
              type="button"
              style={outlineBtnStyle('#D1D5DB', '#374151', '#F9FAFB')}
              onClick={() => setActiveDialog('archive')}
              disabled={disabled}
              data-testid="archive-btn"
            >
              Archive
            </button>
          </>
        )}

        {/* ── SUPERSEDED ─────────────────────────────────── */}
        {publicationState === 'SUPERSEDED' && (
          <button
            type="button"
            style={outlineBtnStyle('#D1D5DB', '#374151', '#F9FAFB')}
            onClick={() => setActiveDialog('archive')}
            disabled={disabled}
            data-testid="archive-btn"
          >
            Archive
          </button>
        )}

        {/* ── ARCHIVED ─────────────────────────────────────── */}
        {publicationState === 'ARCHIVED' && (
          <p
            style={{ fontSize: '0.875rem', color: '#9CA3AF', fontStyle: 'italic', margin: 0 }}
            data-testid="archived-message"
          >
            This record is archived. No further state changes are available.
          </p>
        )}
      </div>

      {/* ── Dialogs ──────────────────────────────────────── */}

      {/* Edit Published Record — Warning Modal (UX Mockup Screen 07) */}
      <ConfirmationDialog
        open={activeDialog === 'edit-published'}
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
        onConfirm={handleConfirmEditPublished}
        onCancel={() => setActiveDialog(null)}
      />

      {/* Archive Confirmation */}
      <ConfirmationDialog
        open={activeDialog === 'archive'}
        title="Archive Record"
        body={
          <p>
            This record will be removed from the default catalog browse. It will remain accessible
            via direct URL with an <strong>Archived</strong> label.
          </p>
        }
        confirmLabel="Archive Record"
        variant="danger"
        onConfirm={handleConfirmArchive}
        onCancel={() => setActiveDialog(null)}
      />

      {/* Supersede — requires linked_record_id input (US-2.4 AC) */}
      <ConfirmationDialog
        open={activeDialog === 'supersede'}
        supersede
        title="Supersede Record"
        body={
          <p>
            Marking this record as Superseded indicates it has been replaced by a newer record.
            The superseding record must exist in the system.
          </p>
        }
        confirmLabel="Supersede Record"
        variant="danger"
        onConfirm={handleConfirmSupersede}
        onCancel={() => setActiveDialog(null)}
      />
    </>
  );
}

export default PublicationLifecycleControls;

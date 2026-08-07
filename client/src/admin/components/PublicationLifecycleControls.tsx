// PublicationLifecycleControls.tsx
// State-aware publication lifecycle action buttons for RecordEditPage.
// UX Mockup Screen 07 — State Transition Actions table:
//   DRAFT    → [Save Draft] [Submit for Review ▶]
//   REVIEW   → [Save Draft] [Publish ▶] [Return to Draft]
//   PUBLISHED → [Edit (confirmation)] [Supersede (dialog)] [Archive (confirmation)]
//   SUPERSEDED → [Archive (confirmation)]
//   ARCHIVED  → (read-only; no actions)
// Per US-2.3: "Submit for Review is disabled until all pub-required fields are complete"
// API endpoints from 05-PLAN.md recordHandler.js integration contract.

import React, { useState } from 'react';
import { ConfirmationDialog } from './ConfirmationDialog';

export type PublicationState = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'SUPERSEDED' | 'ARCHIVED';

export interface PublicationLifecycleControlsProps {
  publicationState: PublicationState;
  recordId: string;
  canSubmitForReview: boolean;  // true only when all pub-required fields are complete
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
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'same-origin',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = data?.error?.code ?? 'UNKNOWN_ERROR';
        // Extract blocking_fields from PUBLICATION_GATE_FAILED error envelope (05-PLAN.md §4.1)
        const blockingFields: string[] =
          code === 'PUBLICATION_GATE_FAILED'
            ? (data?.error?.fields ?? []).map((f: { field: string }) => f.field)
            : [];
        onTransitionError(code, blockingFields.length > 0 ? blockingFields : undefined);
      } else {
        onTransitionSuccess(data.publication_state, data.published_at);
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

  return (
    <>
      <div
        className="flex items-center gap-3 flex-wrap"
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
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                onClick={onSaveDraft}
                disabled={disabled}
                aria-label="Save draft"
              >
                {isSaving ? 'Saving…' : 'Save Draft'}
              </button>
            )}
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                onClick={onSaveDraft}
                disabled={disabled}
              >
                {isSaving ? 'Saving…' : 'Save Draft'}
              </button>
            )}
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
              onClick={handleReturnToDraft}
              disabled={disabled}
              data-testid="return-to-draft-btn"
            >
              Return to Draft
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
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
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
              onClick={() => setActiveDialog('edit-published')}
              disabled={disabled}
              data-testid="edit-published-btn"
            >
              Edit
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium border border-amber-400 rounded bg-amber-50 text-amber-800 hover:bg-amber-100 disabled:opacity-50"
              onClick={() => setActiveDialog('supersede')}
              disabled={disabled}
              data-testid="supersede-btn"
            >
              Supersede
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium border border-red-300 rounded bg-white text-red-700 hover:bg-red-50 disabled:opacity-50"
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
            className="px-4 py-2 text-sm font-medium border border-red-300 rounded bg-white text-red-700 hover:bg-red-50 disabled:opacity-50"
            onClick={() => setActiveDialog('archive')}
            disabled={disabled}
            data-testid="archive-btn"
          >
            Archive
          </button>
        )}

        {/* ── ARCHIVED ─────────────────────────────────────── */}
        {publicationState === 'ARCHIVED' && (
          <p className="text-sm text-gray-500 italic" data-testid="archived-message">
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
            <p className="mb-2">
              This record is currently Published and visible to all Hub users.
            </p>
            <p>
              Editing will move this record to <strong>Review state</strong> and remove it from
              public view until it is re-published.
            </p>
            <p className="mt-2">Are you sure you want to proceed?</p>
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

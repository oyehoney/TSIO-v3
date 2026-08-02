/**
 * ConfirmationDialog.tsx
 *
 * Reusable confirmation modal for irreversible lifecycle transitions on RecordEditPage.
 * UX Mockup Screen 07: Warning Modal — Editing a Published Record + Archive action.
 *
 * Accessibility: role="dialog", aria-modal="true", aria-labelledby, focus placed on
 * cancel button on open (safe default — avoids accidentally confirming on Enter).
 *
 * Three use cases:
 *   1. Edit Published Record — variant='danger', body warns about REVIEW move
 *   2. Archive — variant='danger', body warns about catalog removal
 *   3. Supersede — supersede=true variant adds linked_record_id input with required validation
 *
 * F8: Curation and Administration — confirmation dialogs for irreversible transitions
 */

import React, { useEffect, useRef, useState } from 'react';

export type ConfirmationDialogVariant = 'default' | 'danger';

interface BaseConfirmationDialogProps {
  open: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: ConfirmationDialogVariant;
  onConfirm: (data?: Record<string, string>) => void;
  onCancel: () => void;
}

// Supersede variant requires a linked_record_id input
interface SupersedeDialogProps extends BaseConfirmationDialogProps {
  supersede?: true;
}

export type ConfirmationDialogProps = BaseConfirmationDialogProps | SupersedeDialogProps;

export function ConfirmationDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  ...rest
}: ConfirmationDialogProps) {
  const isSupersedeVariant = 'supersede' in rest && rest.supersede === true;
  const [supersededById, setSupersededById] = useState('');
  const [supersededByError, setSupersededByError] = useState('');
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Reset supersede input when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSupersededById('');
      setSupersededByError('');
      // Focus cancel button on open — safe default prevents accidental confirmation
      cancelButtonRef.current?.focus();
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    if (isSupersedeVariant) {
      if (!supersededById.trim()) {
        setSupersededByError('The ID of the superseding record is required.');
        return;
      }
      onConfirm({ superseded_by_record_id: supersededById.trim() });
    } else {
      onConfirm();
    }
  };

  const confirmButtonStyle: React.CSSProperties =
    variant === 'danger'
      ? {
          padding: '10px 20px',
          border: 'none',
          borderRadius: '6px',
          backgroundColor: '#DC2626',
          color: '#FFFFFF',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 600,
        }
      : {
          padding: '10px 20px',
          border: 'none',
          borderRadius: '6px',
          backgroundColor: '#1D4ED8',
          color: '#FFFFFF',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 600,
        };

  const cancelButtonStyle: React.CSSProperties = {
    padding: '10px 20px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    backgroundColor: '#FFFFFF',
    color: '#374151',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
  };

  return (
    // Backdrop — clicking outside dismisses the dialog
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
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-dialog-title"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '480px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span aria-hidden="true" style={{ fontSize: '1.5rem' }}>⚠</span>
            <h2
              id="confirmation-dialog-title"
              style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', margin: 0 }}
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9CA3AF',
              fontSize: '1.25rem',
              lineHeight: 1,
              padding: '0 4px',
            }}
            onClick={onCancel}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '24px', lineHeight: 1.6 }}>
          {body}
        </div>

        {/* Supersede input — only shown for supersede variant */}
        {isSupersedeVariant && (
          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="superseded-by-record-id"
              style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}
            >
              ID of the superseding record{' '}
              <span style={{ color: '#DC2626' }} aria-label="required">*</span>
            </label>
            <input
              id="superseded-by-record-id"
              type="text"
              value={supersededById}
              onChange={(e) => {
                setSupersededById(e.target.value);
                if (supersededByError) setSupersededByError('');
              }}
              placeholder="e.g. rec_01HZ..."
              style={{
                width: '100%',
                padding: '9px 12px',
                border: `1px solid ${supersededByError ? '#DC2626' : '#D1D5DB'}`,
                borderRadius: '6px',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              aria-describedby={supersededByError ? 'supersede-error' : undefined}
            />
            {supersededByError && (
              <p
                id="supersede-error"
                style={{ marginTop: '4px', fontSize: '0.75rem', color: '#DC2626' }}
                role="alert"
              >
                {supersededByError}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            ref={cancelButtonRef}
            type="button"
            style={cancelButtonStyle}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            style={confirmButtonStyle}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationDialog;

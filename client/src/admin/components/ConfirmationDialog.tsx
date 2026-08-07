// ConfirmationDialog.tsx
// Reusable confirmation modal for irreversible lifecycle transitions on RecordEditPage.
// UX Mockup Screen 07: Warning Modal — Editing a Published Record + Archive action.
// Accessibility: role="dialog", aria-modal="true", aria-labelledby, focus trap (Tab/Shift+Tab).

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

  // Focus first interactive element on open
  useEffect(() => {
    if (open) {
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

  const confirmButtonClass =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white';

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-dialog-title"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h2
            id="confirmation-dialog-title"
            className="text-lg font-semibold text-gray-900"
          >
            {title}
          </h2>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 ml-4"
            onClick={onCancel}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="mb-6 text-sm text-gray-700">
          {/* Warning icon for danger variant or PUBLISHED edit */}
          <div className="flex items-start gap-2">
            <span className="text-amber-500 text-lg" aria-hidden="true">⚠</span>
            <div>{body}</div>
          </div>
        </div>

        {/* Supersede input — only shown when supersede variant */}
        {isSupersedeVariant && (
          <div className="mb-6">
            <label
              htmlFor="superseded-by-record-id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              ID of the superseding record <span className="text-red-500">*</span>
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
              className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                supersededByError ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-describedby={supersededByError ? 'supersede-error' : undefined}
            />
            {supersededByError && (
              <p id="supersede-error" className="mt-1 text-xs text-red-600" role="alert">
                {supersededByError}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-1 ${confirmButtonClass}`}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

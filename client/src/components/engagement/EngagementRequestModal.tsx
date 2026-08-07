// src/components/engagement/EngagementRequestModal.tsx
// Engagement request modal overlay.
// UX-Mockup: Screen 03 — Engagement Request Modal + Flow 03
// UserStories: US-7.1, US-7.2

import React, { useEffect, useRef } from 'react';
import { useEngagementForm, EngagementType } from './useEngagementForm';
import { EngagementConfirmation } from './EngagementConfirmation';
import { CaptchaWidget } from './CaptchaWidget';

const ENGAGEMENT_TITLES: Record<EngagementType, string> = {
  REQUEST_DEMO: 'Request a Demo',
  REQUEST_ADOPTION_DISCUSSION: 'Request Adoption Discussion',
  REQUEST_TECHNICAL_GUIDANCE: 'Request Technical Guidance',
  REQUEST_BRIEFING: 'Request a Briefing',
};

const ENGAGEMENT_LABELS: Record<EngagementType, string> = {
  REQUEST_DEMO: 'a demo',
  REQUEST_ADOPTION_DISCUSSION: 'an adoption discussion',
  REQUEST_TECHNICAL_GUIDANCE: 'technical guidance',
  REQUEST_BRIEFING: 'a briefing',
};

export type { EngagementType };

export interface EngagementRequestModalProps {
  engagementType: EngagementType;
  recordId: string;
  recordTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EngagementRequestModal({
  engagementType,
  recordId,
  recordTitle,
  isOpen,
  onClose,
}: EngagementRequestModalProps): JSX.Element | null {
  const {
    fields,
    errors,
    captchaToken,
    setCaptchaToken,
    isSubmitting,
    confirmationState,
    submitError,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
  } = useEngagementForm(engagementType, recordId);

  const firstInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus management: move focus to first input on open (WCAG 2.1 AA)
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isOpen]);

  // Reset form state when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  // Keyboard trap: close on Escape, trap Tab within modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const title = ENGAGEMENT_TITLES[engagementType];
  const label = ENGAGEMENT_LABELS[engagementType];
  const isFormDisabled = isSubmitting;
  const canSubmit = !isSubmitting && captchaToken !== null;
  const descCharCount = fields.descriptionOfInterest.length;

  return (
    // Overlay backdrop
    <div
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal panel */}
      <div
        ref={modalRef}
        role="dialog"
        aria-labelledby="engagement-modal-title"
        aria-describedby="engagement-modal-desc"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
        }}
      >
        {/* Modal header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <h2 id="engagement-modal-title" style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
            {confirmationState ? 'Request Submitted' : title}
          </h2>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '20px', lineHeight: 1, padding: '4px', color: '#374151',
            }}
          >
            ✕
          </button>
        </div>
        <hr style={{ borderColor: '#E5E7EB', marginBottom: '20px' }} />

        {/* Success confirmation state */}
        {confirmationState ? (
          <EngagementConfirmation
            requestType={confirmationState.requestType}
            recordTitle={confirmationState.recordTitle}
            submittedAt={confirmationState.submittedAt}
            onClose={onClose}
          />
        ) : (
          /* Form state */
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(recordTitle);
            }}
            noValidate
          >
            {/* Record reference — read-only, pre-populated */}
            <p id="engagement-modal-desc" style={{ color: '#374151', marginBottom: '20px', fontSize: '15px' }}>
              You are requesting {label} for:{' '}
              <span style={{ fontWeight: 600 }}>📋 {recordTitle}</span>
              <br />
              <span style={{ fontSize: '13px', color: '#6B7280' }}>(Pre-populated — cannot edit record reference)</span>
            </p>

            {/* Submission error banner */}
            {submitError && (
              <div
                role="alert"
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '4px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  color: '#991B1B',
                  fontSize: '14px',
                }}
              >
                {submitError.message}
              </div>
            )}

            {/* Your Name */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="requestorName" style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                Your Name <span aria-hidden="true">*</span>
              </label>
              <input
                id="requestorName"
                ref={firstInputRef}
                type="text"
                value={fields.requestorName}
                onChange={(e) => handleChange('requestorName', e.target.value)}
                onBlur={() => handleBlur('requestorName')}
                disabled={isFormDisabled}
                aria-required="true"
                aria-invalid={!!errors.requestorName}
                aria-describedby={errors.requestorName ? 'requestorName-error' : undefined}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '4px',
                  border: `1px solid ${errors.requestorName ? '#EF4444' : '#D1D5DB'}`,
                  fontSize: '15px', boxSizing: 'border-box',
                }}
              />
              {errors.requestorName && (
                <p id="requestorName-error" role="alert" style={{ color: '#DC2626', fontSize: '13px', marginTop: '4px' }}>
                  {errors.requestorName}
                </p>
              )}
            </div>

            {/* Your Office */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="requestorOffice" style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                Your Office <span aria-hidden="true">*</span>
              </label>
              <input
                id="requestorOffice"
                type="text"
                value={fields.requestorOffice}
                onChange={(e) => handleChange('requestorOffice', e.target.value)}
                onBlur={() => handleBlur('requestorOffice')}
                disabled={isFormDisabled}
                aria-required="true"
                aria-invalid={!!errors.requestorOffice}
                aria-describedby={errors.requestorOffice ? 'requestorOffice-error' : undefined}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '4px',
                  border: `1px solid ${errors.requestorOffice ? '#EF4444' : '#D1D5DB'}`,
                  fontSize: '15px', boxSizing: 'border-box',
                }}
              />
              {errors.requestorOffice && (
                <p id="requestorOffice-error" role="alert" style={{ color: '#DC2626', fontSize: '13px', marginTop: '4px' }}>
                  {errors.requestorOffice}
                </p>
              )}
            </div>

            {/* Your Email Address */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="requestorEmail" style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                Your Email Address <span aria-hidden="true">*</span>
              </label>
              <input
                id="requestorEmail"
                type="email"
                value={fields.requestorEmail}
                onChange={(e) => handleChange('requestorEmail', e.target.value)}
                onBlur={() => handleBlur('requestorEmail')}
                disabled={isFormDisabled}
                aria-required="true"
                aria-invalid={!!errors.requestorEmail}
                aria-describedby={errors.requestorEmail ? 'requestorEmail-error' : undefined}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '4px',
                  border: `1px solid ${errors.requestorEmail ? '#EF4444' : '#D1D5DB'}`,
                  fontSize: '15px', boxSizing: 'border-box',
                }}
              />
              {errors.requestorEmail && (
                <p id="requestorEmail-error" role="alert" style={{ color: '#DC2626', fontSize: '13px', marginTop: '4px' }}>
                  {errors.requestorEmail}
                </p>
              )}
            </div>

            {/* Describe your interest */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="descriptionOfInterest" style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                Describe your interest or question <span aria-hidden="true">*</span>
              </label>
              <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 4px' }}>
                Help us understand your context so we can respond appropriately. (20–2000 chars)
              </p>
              <textarea
                id="descriptionOfInterest"
                value={fields.descriptionOfInterest}
                onChange={(e) => handleChange('descriptionOfInterest', e.target.value)}
                onBlur={() => handleBlur('descriptionOfInterest')}
                disabled={isFormDisabled}
                rows={4}
                maxLength={2000}
                aria-required="true"
                aria-invalid={!!errors.descriptionOfInterest}
                aria-describedby="descriptionOfInterest-count descriptionOfInterest-error"
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '4px',
                  border: `1px solid ${errors.descriptionOfInterest ? '#EF4444' : '#D1D5DB'}`,
                  fontSize: '15px', boxSizing: 'border-box', resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                {errors.descriptionOfInterest ? (
                  <p id="descriptionOfInterest-error" role="alert" style={{ color: '#DC2626', fontSize: '13px', margin: 0 }}>
                    {errors.descriptionOfInterest}
                  </p>
                ) : <span />}
                <span
                  id="descriptionOfInterest-count"
                  aria-live="polite"
                  style={{ fontSize: '13px', color: descCharCount > 1900 ? '#DC2626' : '#6B7280' }}
                >
                  {descCharCount} / 2000
                </span>
              </div>
            </div>

            {/* Desired next step (optional) */}
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="desiredNextStep" style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                Desired next step <span style={{ fontWeight: 400, color: '#6B7280' }}>(optional)</span>
              </label>
              <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 4px' }}>
                e.g., a call, a document review, a live demo
              </p>
              <input
                id="desiredNextStep"
                type="text"
                value={fields.desiredNextStep}
                onChange={(e) => handleChange('desiredNextStep', e.target.value)}
                disabled={isFormDisabled}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '4px',
                  border: '1px solid #D1D5DB', fontSize: '15px', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* CAPTCHA */}
            <div style={{ marginBottom: '20px' }}>
              <CaptchaWidget
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
              />
            </div>

            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
              * Required fields
            </p>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isFormDisabled}
                style={{
                  padding: '10px 20px', border: '1px solid #D1D5DB', borderRadius: '4px',
                  background: '#FFFFFF', cursor: 'pointer', fontSize: '15px',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                aria-busy={isSubmitting}
                style={{
                  padding: '10px 20px', borderRadius: '4px', border: 'none',
                  backgroundColor: canSubmit ? '#1D4ED8' : '#9CA3AF',
                  color: '#FFFFFF', fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed',
                  fontSize: '15px',
                }}
              >
                {isSubmitting ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

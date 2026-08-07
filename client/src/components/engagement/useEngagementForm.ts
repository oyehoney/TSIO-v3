// src/components/engagement/useEngagementForm.ts
// Manages engagement request form state, validation, and API submission.
// POST /api/v1/engagement-requests (Wave 3c / 08-PLAN.md provides this endpoint)
//
// API request shape (from 08-PLAN.md integration_contracts.provides):
//   { request_type, record_id, requestor_name, requestor_email, requestor_office,
//     description_of_interest, desired_next_step?, captcha_token }
// API success response: EngagementRequest { request_id, record_id, request_type, submitted_at, ... }
// API error 429: { error: { code: 'RATE_LIMIT_EXCEEDED', message: string } }
// API error 422: { error: { code: 'CAPTCHA_INVALID' | 'VALIDATION_ERROR', message: string, fields?: [] } }
// API error 5xx: generic server error

import { useState, useCallback } from 'react';

export type EngagementType =
  | 'REQUEST_DEMO'
  | 'REQUEST_ADOPTION_DISCUSSION'
  | 'REQUEST_TECHNICAL_GUIDANCE'
  | 'REQUEST_BRIEFING';

interface FormFields {
  requestorName: string;
  requestorOffice: string;
  requestorEmail: string;
  descriptionOfInterest: string;
  desiredNextStep: string;
}

interface FormErrors {
  requestorName?: string;
  requestorOffice?: string;
  requestorEmail?: string;
  descriptionOfInterest?: string;
}

interface ConfirmationState {
  requestType: EngagementType;
  recordTitle: string;
  submittedAt: string; // ISO 8601
}

interface SubmitError {
  code: string;
  message: string;
}

export interface UseEngagementFormResult {
  fields: FormFields;
  errors: FormErrors;
  captchaToken: string | null;
  setCaptchaToken: (token: string | null) => void;
  isSubmitting: boolean;
  confirmationState: ConfirmationState | null;
  submitError: SubmitError | null;
  handleChange: (field: keyof FormFields, value: string) => void;
  handleBlur: (field: keyof FormFields) => void;
  handleSubmit: (recordTitle: string) => Promise<void>;
  reset: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(field: keyof FormFields, value: string): string | undefined {
  switch (field) {
    case 'requestorName':
      if (!value.trim()) return 'Name is required.';
      return undefined;
    case 'requestorOffice':
      if (!value.trim()) return 'Office is required.';
      return undefined;
    case 'requestorEmail':
      if (!value.trim()) return 'Email address is required.';
      if (!EMAIL_RE.test(value.trim())) return 'Please enter a valid email address.';
      return undefined;
    case 'descriptionOfInterest':
      if (!value.trim()) return 'Description is required.';
      if (value.trim().length < 20) return 'Description must be at least 20 characters.';
      if (value.trim().length > 2000) return 'Description must be 2000 characters or fewer.';
      return undefined;
    default:
      return undefined;
  }
}

const EMPTY_FIELDS: FormFields = {
  requestorName: '',
  requestorOffice: '',
  requestorEmail: '',
  descriptionOfInterest: '',
  desiredNextStep: '',
};

export function useEngagementForm(
  engagementType: EngagementType,
  recordId: string
): UseEngagementFormResult {
  const [fields, setFields] = useState<FormFields>(EMPTY_FIELDS);
  const [errors, setErrors] = useState<FormErrors>({});
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationState, setConfirmationState] = useState<ConfirmationState | null>(null);
  const [submitError, setSubmitError] = useState<SubmitError | null>(null);

  const handleChange = useCallback((field: keyof FormFields, value: string) => {
    setFields(prev => ({ ...prev, [field]: value }));
    // Clear error as user types (only for validated fields)
    if (field !== 'desiredNextStep') {
      setErrors(prev => ({ ...prev, [field as keyof FormErrors]: undefined }));
    }
    setSubmitError(null);
  }, []);

  const handleBlur = useCallback((field: keyof FormFields) => {
    setFields(prev => {
      const value = prev[field] ?? '';
      const error = validateField(field, value);
      if (field !== 'desiredNextStep') {
        setErrors(e => ({ ...e, [field as keyof FormErrors]: error }));
      }
      return prev;
    });
  }, []);

  const handleSubmit = useCallback(async (recordTitle: string) => {
    // Validate all required fields
    const requiredFields: (keyof FormErrors)[] = [
      'requestorName', 'requestorOffice', 'requestorEmail', 'descriptionOfInterest',
    ];
    const newErrors: FormErrors = {};
    let hasError = false;
    for (const field of requiredFields) {
      const error = validateField(field, fields[field] ?? '');
      if (error) { newErrors[field] = error; hasError = true; }
    }
    if (hasError) { setErrors(newErrors); return; }

    if (!captchaToken) {
      setSubmitError({ code: 'CAPTCHA_REQUIRED', message: 'Please complete the CAPTCHA before submitting.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/v1/engagement-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_type: engagementType,
          record_id: recordId,
          requestor_name: fields.requestorName.trim(),
          requestor_email: fields.requestorEmail.trim(),
          requestor_office: fields.requestorOffice.trim(),
          description_of_interest: fields.descriptionOfInterest.trim(),
          desired_next_step: fields.desiredNextStep.trim() || undefined,
          captcha_token: captchaToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfirmationState({
          requestType: engagementType,
          recordTitle,
          submittedAt: data.submitted_at ?? new Date().toISOString(),
        });
        return;
      }

      // Error handling
      const errorData = await response.json().catch(() => ({}));
      const errorCode = errorData?.error?.code ?? 'UNKNOWN_ERROR';
      const errorMessage = errorData?.error?.message ?? 'An unexpected error occurred.';

      if (response.status === 429) {
        setSubmitError({ code: errorCode, message: 'Too many requests. Please try again later.' });
      } else if (response.status === 422) {
        if (errorCode === 'CAPTCHA_INVALID') {
          setSubmitError({ code: errorCode, message: 'CAPTCHA verification failed. Please complete the CAPTCHA again.' });
          setCaptchaToken(null); // Reset CAPTCHA
        } else {
          setSubmitError({ code: errorCode, message: errorMessage });
        }
      } else {
        setSubmitError({
          code: errorCode,
          message: 'Unable to submit at this time. Please try again or contact the I&R team directly.',
        });
      }
    } catch {
      setSubmitError({
        code: 'NETWORK_ERROR',
        message: 'Unable to submit at this time. Please check your connection and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [fields, captchaToken, engagementType, recordId]);

  const reset = useCallback(() => {
    setFields(EMPTY_FIELDS);
    setErrors({});
    setCaptchaToken(null);
    setIsSubmitting(false);
    setConfirmationState(null);
    setSubmitError(null);
  }, []);

  return {
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
  };
}

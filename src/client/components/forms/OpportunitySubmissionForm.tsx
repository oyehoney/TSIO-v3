// src/client/components/forms/OpportunitySubmissionForm.tsx
import React, { useState, useCallback } from 'react';
import { CaptchaWidget } from './CaptchaWidget';
import { RateLimitErrorBanner } from './RateLimitErrorBanner';
import { useOpportunitySubmit } from '../../hooks/useOpportunitySubmit';
import type { OpportunitySubmissionRequest } from '../../types/submissions';

// Mission area options — based on Judiciary domain (curator-configurable in future; hardcoded for MVP)
const MISSION_AREAS = [
  'Case Management',
  'Court Operations',
  'Records Management',
  'Cybersecurity',
  'Cloud Infrastructure',
  'AI / Machine Learning',
  'Communication Systems',
  'Access to Justice',
  'Human Resources',
  'Financial Management',
  'Other',
];

interface OpportunitySubmissionFormProps {
  onSuccess: () => void;
}

type FormErrors = Partial<Record<keyof OpportunitySubmissionRequest | 'summary', string>>;

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const OpportunitySubmissionForm: React.FC<OpportunitySubmissionFormProps> = ({ onSuccess }) => {
  const { state, submit } = useOpportunitySubmit();

  const [fields, setFields] = useState({
    problem_description: '',
    mission_area: '',
    urgency_context: '',
    known_constraints: '',
    submitting_office: '',
    submitter_name: '',
    submitter_title: '',
    submitter_email: '',
  });
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<string, boolean>>>({});

  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  function validateField(name: string, value: string): string | undefined {
    switch (name) {
      case 'problem_description':
        if (!value || value.trim().length < 50) return 'Problem description must be at least 50 characters.';
        if (value.trim().length > 3000) return 'Problem description must be 3000 characters or fewer.';
        break;
      case 'mission_area':
        if (!value) return 'Mission area is required.';
        break;
      case 'submitting_office':
        if (!value || value.trim().length < 2) return 'Submitting office is required.';
        break;
      case 'submitter_name':
        if (!value || value.trim().length < 2) return 'Your name is required.';
        break;
      case 'submitter_email':
        if (!value) return 'Email address is required.';
        if (!validateEmail(value)) return 'Please enter a valid email address.';
        break;
    }
    return undefined;
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFields(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }

  function validateAll(): FormErrors {
    const newErrors: FormErrors = {};
    const requiredFields = ['problem_description', 'mission_area', 'submitting_office', 'submitter_name', 'submitter_email'];
    requiredFields.forEach(fieldName => {
      const error = validateField(fieldName, fields[fieldName as keyof typeof fields] || '');
      if (error) newErrors[fieldName as keyof OpportunitySubmissionRequest] = error;
    });
    if (!captchaToken) {
      newErrors['summary'] = 'Please complete the CAPTCHA verification.';
    }
    return newErrors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const allErrors = validateAll();
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setTouched({
        problem_description: true,
        mission_area: true,
        submitting_office: true,
        submitter_name: true,
        submitter_email: true,
      });
      return;
    }

    const payload: OpportunitySubmissionRequest = {
      problem_description: fields.problem_description.trim(),
      mission_area: fields.mission_area,
      submitting_office: fields.submitting_office.trim(),
      submitter_name: fields.submitter_name.trim(),
      submitter_email: fields.submitter_email.trim(),
      ...(fields.submitter_title.trim() && { submitter_title: fields.submitter_title.trim() }),
      ...(fields.urgency_context.trim() && { urgency_context: fields.urgency_context.trim() }),
      ...(fields.known_constraints.trim() && { known_constraints: fields.known_constraints.trim() }),
      captcha_token: captchaToken,
    };

    const success = await submit(payload);
    if (success) {
      onSuccess();
    }
  }

  const isSubmitting = state.status === 'submitting';
  const serverErrors = state.status === 'error' ? state.error.fields : undefined;
  const hasErrorSummary = Object.values(errors).some(Boolean) || (serverErrors && serverErrors.length > 0);

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Submit a Mission Problem">
      {/* Non-commitment disclaimer — must appear before all fields per UX Mockup Screen 04 */}
      <div
        role="note"
        className="bg-blue-50 border border-blue-300 rounded-md p-4 mb-6 flex gap-3"
        aria-label="Important notice about this submission"
      >
        <span className="text-blue-600 flex-shrink-0 text-lg" aria-hidden="true">ℹ</span>
        <p className="text-blue-900 text-sm">
          Submitting this form <strong>does not imply acceptance</strong> of the opportunity into the I&R portfolio or a
          commitment to begin a project or establish a timeline.
        </p>
      </div>

      {/* Error summary (rendered when submit attempted with errors) */}
      {hasErrorSummary && (
        <div role="alert" aria-live="polite" className="bg-red-50 border border-red-300 rounded-md p-4 mb-6">
          <p className="font-semibold text-red-800 text-sm mb-2">Please fix the following errors:</p>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {Object.values(errors).filter(Boolean).map((msg, i) => <li key={i}>{msg}</li>)}
            {serverErrors?.map((f, i) => <li key={`srv-${i}`}>{f.message}</li>)}
          </ul>
        </div>
      )}

      {/* Rate limit error */}
      {state.status === 'rate_limited' && (
        <div className="mb-6">
          <RateLimitErrorBanner retryAfterSeconds={state.retryAfter} />
        </div>
      )}

      {/* Server error */}
      {state.status === 'error' && state.error.code !== 'VALIDATION_ERROR' && (
        <div role="alert" className="bg-red-50 border border-red-300 rounded-md p-4 mb-6">
          <p className="text-red-800 text-sm">{state.error.message}</p>
        </div>
      )}

      <fieldset className="mb-6 border-0 p-0 m-0">
        <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">— Describe the Problem —</legend>

        {/* Problem description — first field (problem-first ordering) */}
        <div className="mb-4">
          <label htmlFor="problem_description" className="block text-sm font-medium text-gray-700 mb-1">
            Describe the mission problem you are facing <span aria-label="required" className="text-red-600">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-1">Focus on the challenge, not a proposed solution. What is difficult or impossible today? Who is affected?</p>
          <textarea
            id="problem_description"
            name="problem_description"
            value={fields.problem_description}
            onChange={handleChange}
            onBlur={handleBlur}
            rows={5}
            maxLength={3000}
            disabled={isSubmitting}
            aria-describedby="problem_description_count problem_description_error"
            aria-invalid={!!errors.problem_description}
            className={`block w-full border rounded-md px-3 py-2 text-sm ${errors.problem_description ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          <div className="flex justify-between mt-1">
            <span id="problem_description_error" role="alert" className="text-xs text-red-600">{errors.problem_description || ''}</span>
            <span id="problem_description_count" className="text-xs text-gray-400">{fields.problem_description.length} / 3000</span>
          </div>
        </div>

        {/* Mission area */}
        <div className="mb-4">
          <label htmlFor="mission_area" className="block text-sm font-medium text-gray-700 mb-1">
            Mission Area <span aria-label="required" className="text-red-600">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-1">Select the primary mission area this problem affects.</p>
          <select
            id="mission_area"
            name="mission_area"
            value={fields.mission_area}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={!!errors.mission_area}
            className={`block w-full border rounded-md px-3 py-2 text-sm ${errors.mission_area ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">Select mission area</option>
            {MISSION_AREAS.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
          {errors.mission_area && <span role="alert" className="text-xs text-red-600">{errors.mission_area}</span>}
        </div>

        {/* Urgency context (optional) */}
        <div className="mb-4">
          <label htmlFor="urgency_context" className="block text-sm font-medium text-gray-700 mb-1">
            Urgency Context <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <p className="text-xs text-gray-500 mb-1">Is there a decision deadline or event driving urgency?</p>
          <textarea
            id="urgency_context"
            name="urgency_context"
            value={fields.urgency_context}
            onChange={handleChange}
            rows={2}
            disabled={isSubmitting}
            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Known constraints (optional) */}
        <div className="mb-4">
          <label htmlFor="known_constraints" className="block text-sm font-medium text-gray-700 mb-1">
            Known Constraints <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <p className="text-xs text-gray-500 mb-1">Budget, policy, technical, or operational constraints the I&R team should be aware of.</p>
          <textarea
            id="known_constraints"
            name="known_constraints"
            value={fields.known_constraints}
            onChange={handleChange}
            rows={2}
            disabled={isSubmitting}
            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </fieldset>

      <fieldset className="mb-6 border-0 p-0 m-0">
        <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">— Your Contact Information —</legend>

        {/* Submitting office */}
        <div className="mb-4">
          <label htmlFor="submitting_office" className="block text-sm font-medium text-gray-700 mb-1">
            Submitting Office <span aria-label="required" className="text-red-600">*</span>
          </label>
          <input
            id="submitting_office"
            name="submitting_office"
            type="text"
            value={fields.submitting_office}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={!!errors.submitting_office}
            className={`block w-full border rounded-md px-3 py-2 text-sm ${errors.submitting_office ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.submitting_office && <span role="alert" className="text-xs text-red-600">{errors.submitting_office}</span>}
        </div>

        {/* Submitter name */}
        <div className="mb-4">
          <label htmlFor="submitter_name" className="block text-sm font-medium text-gray-700 mb-1">
            Your Name <span aria-label="required" className="text-red-600">*</span>
          </label>
          <input
            id="submitter_name"
            name="submitter_name"
            type="text"
            value={fields.submitter_name}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={!!errors.submitter_name}
            className={`block w-full border rounded-md px-3 py-2 text-sm ${errors.submitter_name ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.submitter_name && <span role="alert" className="text-xs text-red-600">{errors.submitter_name}</span>}
        </div>

        {/* Submitter title (optional) */}
        <div className="mb-4">
          <label htmlFor="submitter_title" className="block text-sm font-medium text-gray-700 mb-1">
            Your Title <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="submitter_title"
            name="submitter_title"
            type="text"
            value={fields.submitter_title}
            onChange={handleChange}
            disabled={isSubmitting}
            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Submitter email */}
        <div className="mb-4">
          <label htmlFor="submitter_email" className="block text-sm font-medium text-gray-700 mb-1">
            Your Email Address <span aria-label="required" className="text-red-600">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-1">A confirmation may be sent to this address.</p>
          <input
            id="submitter_email"
            name="submitter_email"
            type="email"
            value={fields.submitter_email}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={!!errors.submitter_email}
            className={`block w-full border rounded-md px-3 py-2 text-sm ${errors.submitter_email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.submitter_email && <span role="alert" className="text-xs text-red-600">{errors.submitter_email}</span>}
        </div>
      </fieldset>

      {/* CAPTCHA */}
      <div className="mb-6">
        <CaptchaWidget onVerify={handleCaptchaVerify} />
        {errors.summary && !Object.keys(errors).filter(k => k !== 'summary').some(k => errors[k as keyof FormErrors]) && (
          <span role="alert" className="text-xs text-red-600 mt-1 block">{errors.summary}</span>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-4"><span className="text-red-600">*</span> Required fields</p>

      <button
        type="submit"
        disabled={isSubmitting || state.status === 'rate_limited'}
        aria-busy={isSubmitting}
        className="w-full sm:w-auto bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-md text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Submitting…' : 'Submit Mission Problem'}
      </button>
    </form>
  );
};

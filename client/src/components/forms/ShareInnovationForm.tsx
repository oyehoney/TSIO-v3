// src/components/forms/ShareInnovationForm.tsx
import React, { useState, useCallback } from 'react';
import { CaptchaWidget } from './CaptchaWidget';
import { RateLimitErrorBanner } from './RateLimitErrorBanner';
import { ArtifactUrlFields } from './ArtifactUrlFields';
import { useShareInnovationSubmit } from '../../hooks/useShareInnovationSubmit';
import type { ContributionSubmissionRequest, SelfAssessedMaturity } from '../../types/submissions';
import { SELF_ASSESSED_MATURITY_LABELS } from '../../types/submissions';

// CRITICAL: ARCHIVED is excluded from this list per F6 spec (PRD §7 F6, US-6.1, UX Screen 05)
const MATURITY_OPTIONS: SelfAssessedMaturity[] = [
  'IDEA',
  'EXPERIMENT_POC',
  'PROTOTYPE_PILOT',
  'PRODUCTION_VALIDATED',
  // NOTE: 'ARCHIVED' is intentionally absent — self-assessed maturity cannot be ARCHIVED
];

interface ShareInnovationFormProps {
  onSuccess: () => void;
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const ShareInnovationForm: React.FC<ShareInnovationFormProps> = ({ onSuccess }) => {
  const { state, submit } = useShareInnovationSubmit();

  const [fields, setFields] = useState({
    problem_addressed: '',
    work_description: '',
    outcome_summary: '',
    self_assessed_maturity: '' as SelfAssessedMaturity | '',
    contributing_team: '',
    contributing_office: '',
    contact_name: '',
    contact_title: '',
    contact_email: '',
    additional_context: '',
  });
  const [artifactUrls, setArtifactUrls] = useState<string[]>(['']);
  const [captchaToken, setCaptchaToken] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  function validateField(name: string, value: string): string | undefined {
    switch (name) {
      case 'problem_addressed':
        if (!value || value.trim().length < 50) return 'Problem addressed must be at least 50 characters.';
        if (value.trim().length > 2000) return 'Problem addressed must be 2000 characters or fewer.';
        break;
      case 'work_description':
        if (!value || value.trim().length < 50) return 'Work description must be at least 50 characters.';
        if (value.trim().length > 3000) return 'Work description must be 3000 characters or fewer.';
        break;
      case 'outcome_summary':
        if (!value || value.trim().length < 50) return 'Outcome summary must be at least 50 characters.';
        if (value.trim().length > 2000) return 'Outcome summary must be 2000 characters or fewer.';
        break;
      case 'self_assessed_maturity':
        if (!value) return 'Please select the current stage of this work.';
        break;
      case 'contributing_team':
        if (!value || value.trim().length < 2) return 'Contributing team name is required.';
        break;
      case 'contributing_office':
        if (!value || value.trim().length < 2) return 'Contributing office is required.';
        break;
      case 'contact_name':
        if (!value || value.trim().length < 2) return 'Contact name is required.';
        break;
      case 'contact_email':
        if (!value) return 'Contact email address is required.';
        if (!validateEmail(value)) return 'Please enter a valid email address.';
        break;
    }
    return undefined;
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error || '' }));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFields(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error || '' }));
    }
  }

  function validateAll(): Record<string, string> {
    const newErrors: Record<string, string> = {};
    const requiredTextFields = ['problem_addressed', 'work_description', 'outcome_summary', 'self_assessed_maturity', 'contributing_team', 'contributing_office', 'contact_name', 'contact_email'];
    requiredTextFields.forEach(f => {
      const error = validateField(f, fields[f as keyof typeof fields] || '');
      if (error) newErrors[f] = error;
    });
    // Artifact URLs: at least one required, all provided must be https://
    const validUrls = artifactUrls.filter(u => u.trim() !== '');
    if (validUrls.length === 0) {
      newErrors['artifact_urls'] = 'At least one artifact URL is required.';
    } else {
      validUrls.forEach((url, i) => {
        try {
          const parsed = new URL(url);
          if (parsed.protocol !== 'https:') newErrors[`artifact_url_${i}`] = `URL ${i + 1} must begin with https://`;
        } catch {
          newErrors[`artifact_url_${i}`] = `URL ${i + 1} is not a valid URL.`;
        }
      });
    }
    if (!captchaToken) newErrors['captcha'] = 'Please complete the CAPTCHA verification.';
    return newErrors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const allErrors = validateAll();
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setTouched(Object.fromEntries(Object.keys(fields).map(k => [k, true])));
      return;
    }

    const cleanedUrls = artifactUrls.filter(u => u.trim() !== '');

    const payload: ContributionSubmissionRequest = {
      work_description: fields.work_description.trim(),
      problem_addressed: fields.problem_addressed.trim(),
      outcome_summary: fields.outcome_summary.trim(),
      self_assessed_maturity: fields.self_assessed_maturity as SelfAssessedMaturity,
      artifact_urls: cleanedUrls,
      contributing_team: fields.contributing_team.trim(),
      contributing_office: fields.contributing_office.trim(),
      contact_name: fields.contact_name.trim(),
      contact_email: fields.contact_email.trim(),
      ...(fields.contact_title.trim() && { contact_title: fields.contact_title.trim() }),
      ...(fields.additional_context.trim() && { additional_context: fields.additional_context.trim() }),
      captcha_token: captchaToken,
    };

    const success = await submit(payload);
    if (success) onSuccess();
  }

  const isSubmitting = state.status === 'submitting';

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Share Your Innovation Work">
      {/* Curation-review governance notice — must appear before all fields per UX Mockup Screen 05 */}
      <div
        role="note"
        className="bg-blue-50 border border-blue-300 rounded-md p-4 mb-6 flex gap-3"
        aria-label="Important notice about submission review"
      >
        <span className="text-blue-600 flex-shrink-0 text-lg" aria-hidden="true">ℹ</span>
        <div className="text-sm text-blue-900">
          <p><strong>Submissions enter I&R curation review.</strong> Publication is not guaranteed.</p>
          <p className="mt-1">If published, your team will be credited.</p>
        </div>
      </div>

      {/* Rate limit error */}
      {state.status === 'rate_limited' && (
        <div className="mb-6">
          <RateLimitErrorBanner retryAfterSeconds={state.retryAfter} />
        </div>
      )}

      {/* Server error */}
      {state.status === 'error' && (
        <div role="alert" className="bg-red-50 border border-red-300 rounded-md p-4 mb-6">
          <p className="text-red-800 text-sm">{state.error.message || 'An error occurred. Please try again.'}</p>
        </div>
      )}

      <fieldset className="mb-6 border-0 p-0 m-0">
        <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">— About the Work —</legend>

        {/* Problem addressed (first content field — problem-first ordering) */}
        <div className="mb-4">
          <label htmlFor="problem_addressed" className="block text-sm font-medium text-gray-700 mb-1">
            Describe the mission problem your team addressed <span aria-label="required" className="text-red-600">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-1">What challenge were you solving? Who is affected? (50–2000 chars)</p>
          <textarea
            id="problem_addressed"
            name="problem_addressed"
            value={fields.problem_addressed}
            onChange={handleChange}
            onBlur={handleBlur}
            rows={3}
            maxLength={2000}
            disabled={isSubmitting}
            aria-invalid={!!errors.problem_addressed}
            className={`block w-full border rounded-md px-3 py-2 text-sm ${errors.problem_addressed ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          <div className="flex justify-between mt-1">
            {errors.problem_addressed ? <span role="alert" className="text-xs text-red-600">{errors.problem_addressed}</span> : <span />}
            <span className="text-xs text-gray-400">{fields.problem_addressed.length} / 2000</span>
          </div>
        </div>

        {/* Work description */}
        <div className="mb-4">
          <label htmlFor="work_description" className="block text-sm font-medium text-gray-700 mb-1">
            Describe what your team built or explored <span aria-label="required" className="text-red-600">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-1">What approach, technology, or method did you use? (50–3000 chars)</p>
          <textarea
            id="work_description"
            name="work_description"
            value={fields.work_description}
            onChange={handleChange}
            onBlur={handleBlur}
            rows={4}
            maxLength={3000}
            disabled={isSubmitting}
            aria-invalid={!!errors.work_description}
            className={`block w-full border rounded-md px-3 py-2 text-sm ${errors.work_description ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          <div className="flex justify-between mt-1">
            {errors.work_description ? <span role="alert" className="text-xs text-red-600">{errors.work_description}</span> : <span />}
            <span className="text-xs text-gray-400">{fields.work_description.length} / 3000</span>
          </div>
        </div>

        {/* Outcome summary */}
        <div className="mb-4">
          <label htmlFor="outcome_summary" className="block text-sm font-medium text-gray-700 mb-1">
            Outcome Summary <span aria-label="required" className="text-red-600">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-1">What were the results? Include limitations or gaps. (50–2000 chars)</p>
          <textarea
            id="outcome_summary"
            name="outcome_summary"
            value={fields.outcome_summary}
            onChange={handleChange}
            onBlur={handleBlur}
            rows={3}
            maxLength={2000}
            disabled={isSubmitting}
            aria-invalid={!!errors.outcome_summary}
            className={`block w-full border rounded-md px-3 py-2 text-sm ${errors.outcome_summary ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          <div className="flex justify-between mt-1">
            {errors.outcome_summary ? <span role="alert" className="text-xs text-red-600">{errors.outcome_summary}</span> : <span />}
            <span className="text-xs text-gray-400">{fields.outcome_summary.length} / 2000</span>
          </div>
        </div>

        {/* Self-assessed maturity — ARCHIVED intentionally absent */}
        <div className="mb-4">
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-1">
              What stage is this work at? <span aria-label="required" className="text-red-600">*</span>
            </legend>
            <p className="text-xs text-gray-500 mb-2">Your honest assessment of current maturity.</p>
            <div className="space-y-2">
              {MATURITY_OPTIONS.map(option => (
                <label key={option} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="self_assessed_maturity"
                    value={option}
                    checked={fields.self_assessed_maturity === option}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isSubmitting}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-gray-700">{SELF_ASSESSED_MATURITY_LABELS[option]}</span>
                </label>
              ))}
            </div>
            {/* Note to curator: maturity is self-assessed, final assigned by curator */}
            <p className="text-xs text-gray-500 mt-2">Note: Final maturity level is assigned by I&R curators.</p>
            {errors.self_assessed_maturity && (
              <span role="alert" className="text-xs text-red-600 block mt-1">{errors.self_assessed_maturity}</span>
            )}
          </fieldset>
        </div>

        {/* Artifact URLs */}
        <div className="mb-4">
          <p className="block text-sm font-medium text-gray-700 mb-1">
            Artifact Links <span aria-label="required" className="text-red-600">*</span>
          </p>
          <p className="text-xs text-gray-500 mb-2">
            Provide links to documentation, diagrams, code, or recordings that support your submission. (1–5 URLs)
            All URLs must begin with <code className="bg-gray-100 px-1 rounded text-xs">https://</code>
          </p>
          <ArtifactUrlFields
            urls={artifactUrls}
            onChange={setArtifactUrls}
            errors={
              Object.keys(errors)
                .filter(k => k.startsWith('artifact_url_'))
                .map(k => errors[k])
            }
          />
          {errors.artifact_urls && (
            <span role="alert" className="text-xs text-red-600 block mt-1">{errors.artifact_urls}</span>
          )}
        </div>

        {/* Additional context (optional) */}
        <div className="mb-4">
          <label htmlFor="additional_context" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Context <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <p className="text-xs text-gray-500 mb-1">Anything else I&R should know about this work.</p>
          <textarea
            id="additional_context"
            name="additional_context"
            value={fields.additional_context}
            onChange={handleChange}
            rows={2}
            disabled={isSubmitting}
            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </fieldset>

      <fieldset className="mb-6 border-0 p-0 m-0">
        <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">— Your Team —</legend>
        <div className="mb-4">
          <label htmlFor="contributing_team" className="block text-sm font-medium text-gray-700 mb-1">
            Contributing Team Name <span aria-label="required" className="text-red-600">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-1">This is how your team will be credited if published.</p>
          <input
            id="contributing_team"
            name="contributing_team"
            type="text"
            value={fields.contributing_team}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={!!errors.contributing_team}
            className={`block w-full border rounded-md px-3 py-2 text-sm ${errors.contributing_team ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.contributing_team && <span role="alert" className="text-xs text-red-600">{errors.contributing_team}</span>}
        </div>
        <div className="mb-4">
          <label htmlFor="contributing_office" className="block text-sm font-medium text-gray-700 mb-1">
            Contributing Office <span aria-label="required" className="text-red-600">*</span>
          </label>
          <input
            id="contributing_office"
            name="contributing_office"
            type="text"
            value={fields.contributing_office}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={!!errors.contributing_office}
            className={`block w-full border rounded-md px-3 py-2 text-sm ${errors.contributing_office ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.contributing_office && <span role="alert" className="text-xs text-red-600">{errors.contributing_office}</span>}
        </div>
      </fieldset>

      <fieldset className="mb-6 border-0 p-0 m-0">
        <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">— Your Contact Information —</legend>
        <div className="mb-4">
          <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700 mb-1">
            Contact Name <span aria-label="required" className="text-red-600">*</span>
          </label>
          <input
            id="contact_name"
            name="contact_name"
            type="text"
            value={fields.contact_name}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={!!errors.contact_name}
            className={`block w-full border rounded-md px-3 py-2 text-sm ${errors.contact_name ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.contact_name && <span role="alert" className="text-xs text-red-600">{errors.contact_name}</span>}
        </div>
        <div className="mb-4">
          <label htmlFor="contact_title" className="block text-sm font-medium text-gray-700 mb-1">
            Contact Title <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="contact_title"
            name="contact_title"
            type="text"
            value={fields.contact_title}
            onChange={handleChange}
            disabled={isSubmitting}
            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">
            Contact Email Address <span aria-label="required" className="text-red-600">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-1">A confirmation may be sent to this address. A curator may reach out before publication.</p>
          <input
            id="contact_email"
            name="contact_email"
            type="email"
            value={fields.contact_email}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={!!errors.contact_email}
            className={`block w-full border rounded-md px-3 py-2 text-sm ${errors.contact_email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.contact_email && <span role="alert" className="text-xs text-red-600">{errors.contact_email}</span>}
        </div>
      </fieldset>

      {/* CAPTCHA */}
      <div className="mb-6">
        <CaptchaWidget onVerify={handleCaptchaVerify} />
        {errors.captcha && <span role="alert" className="text-xs text-red-600 block mt-1">{errors.captcha}</span>}
      </div>

      <p className="text-xs text-gray-500 mb-4"><span className="text-red-600">*</span> Required fields</p>

      <button
        type="submit"
        disabled={isSubmitting || state.status === 'rate_limited'}
        aria-busy={isSubmitting}
        className="w-full sm:w-auto bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-md text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Submitting…' : 'Submit Innovation Work'}
      </button>
    </form>
  );
};

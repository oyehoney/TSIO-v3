// src/client/types/submissions.ts

// Maturity levels available for self-assessment on contribution form (ARCHIVED excluded per F6 spec)
export type SelfAssessedMaturity =
  | 'IDEA'
  | 'EXPERIMENT_POC'
  | 'PROTOTYPE_PILOT'
  | 'PRODUCTION_VALIDATED';

// Display labels for self-assessed maturity radio buttons
export const SELF_ASSESSED_MATURITY_LABELS: Record<SelfAssessedMaturity, string> = {
  IDEA: 'Idea (problem identified, no exploration yet)',
  EXPERIMENT_POC: 'Experiment / POC (feasibility explored)',
  PROTOTYPE_PILOT: 'Prototype / Pilot (working model tested)',
  PRODUCTION_VALIDATED: 'Production / Validated (deployed and operating)',
};

// POST /api/v1/opportunity-submissions request body (from 07-PLAN.md SubmissionService spec)
export interface OpportunitySubmissionRequest {
  problem_description: string;       // required, 50–3000 chars
  mission_area: string;              // required
  submitting_office: string;         // required
  submitter_name: string;            // required
  submitter_email: string;           // required, valid email
  submitter_title?: string;          // optional
  urgency_context?: string;          // optional
  known_constraints?: string;        // optional
  captcha_token: string;             // required
}

// POST /api/v1/contribution-submissions request body (from 07-PLAN.md SubmissionService spec)
export interface ContributionSubmissionRequest {
  work_description: string;          // required, 50–3000 chars
  problem_addressed: string;         // required, 50–2000 chars
  outcome_summary: string;           // required, 50–2000 chars
  self_assessed_maturity: SelfAssessedMaturity; // required, ARCHIVED excluded
  artifact_urls: string[];           // required, 1–5 valid HTTPS URLs
  contributing_team: string;         // required
  contributing_office: string;       // required
  contact_name: string;              // required
  contact_email: string;             // required, valid email
  contact_title?: string;            // optional
  additional_context?: string;       // optional
  captcha_token: string;             // required
}

// Shared API submission response shape
export interface SubmissionResponse {
  submission_id: string;
  status: 'SUBMITTED';
  submitted_at: string;
}

// API error shape
export interface SubmissionApiError {
  code: 'CAPTCHA_INVALID' | 'VALIDATION_ERROR' | 'RATE_LIMIT_EXCEEDED' | 'ARTIFACT_URL_REQUIRED' | 'INVALID_ARTIFACT_URL';
  message: string;
  fields?: Array<{ field: string; error_code: string; message: string }>;
  retryAfter?: number;
}

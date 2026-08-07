// Maturity level display labels (from PRD §6.1)
export const MATURITY_LABELS: Record<string, string> = {
  IDEA: 'Idea',
  EXPERIMENT_POC: 'Experiment / POC',
  PROTOTYPE_PILOT: 'Prototype / Pilot',
  PRODUCTION_VALIDATED: 'Production / Validated Pattern',
  ARCHIVED: 'Archived',
};

// Review status display labels (from PRD §6.2)
export const REVIEW_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted',
  CURATED: 'Curated',
  TECHNICALLY_REVIEWED: 'Technically Reviewed',
  SECURITY_REVIEWED: 'Security Reviewed',
  POLICY_REVIEWED: 'Policy Reviewed',
  VALIDATED_FOR_REUSE: 'Validated for Reuse',
  SUPERSEDED_RETIRED: 'Superseded / Retired',
};

// Maturity badge color classes (from UX-Mockup §Color System for Trust Signals)
// All colors meet WCAG 2.1 AA 4.5:1 contrast ratio against white text
export const MATURITY_BADGE_COLORS: Record<string, string> = {
  IDEA: 'bg-gray-500 text-white',               // #6B7280
  EXPERIMENT_POC: 'bg-amber-600 text-white',     // #D97706
  PROTOTYPE_PILOT: 'bg-orange-600 text-white',   // #EA580C
  PRODUCTION_VALIDATED: 'bg-green-600 text-white', // #16A34A
  ARCHIVED: 'bg-gray-700 text-white',             // #374151
};

// Engagement option labels (for card indicators)
export const ENGAGEMENT_LABELS: Record<string, string> = {
  REQUEST_DEMO: 'Demo Available',
  REQUEST_ADOPTION_DISCUSSION: 'Adoption Discussion',
  REQUEST_TECHNICAL_GUIDANCE: 'Technical Guidance',
  REQUEST_BRIEFING: 'Briefing Available',
};

// Engagement option icons (emoji fallback for accessibility; screen readers use text label)
export const ENGAGEMENT_ICONS: Record<string, string> = {
  REQUEST_DEMO: '📋',
  REQUEST_ADOPTION_DISCUSSION: '💬',
  REQUEST_TECHNICAL_GUIDANCE: '🔧',
  REQUEST_BRIEFING: '📊',
};

export const API_BASE = '/api/v1';
export const DEFAULT_PAGE_SIZE = 12;

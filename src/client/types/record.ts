/**
 * record.ts — Shared TypeScript types for Innovation Record client-side components.
 *
 * These types mirror the API response shape from GET /api/v1/records/:id
 * (recordService.js enrichRecord() output, Wave 2 / Plan 05).
 *
 * SECURITY NOTE (T-11-01): All string fields are rendered as React text children,
 * never via dangerouslySetInnerHTML. trust_disclaimers are server-computed.
 */

export type EngagementOptionType =
  | 'REQUEST_BRIEFING'
  | 'REQUEST_DEMO'
  | 'REQUEST_ADOPTION_DISCUSSION'
  | 'REQUEST_TECHNICAL_GUIDANCE'
  | 'SUBMIT_RELATED_PROBLEM';

export type ArtifactType = 'DOCUMENT' | 'CODE_REPOSITORY' | 'VIDEO' | 'DIAGRAM' | 'OTHER';

export interface ArtifactLink {
  link_id: string;
  label: string;
  url: string;
  artifact_type: ArtifactType;
  display_order: number;
}

export interface InnovationRecord {
  record_id: string;
  title: string;
  problem_statement: string;
  what_was_explored: string;
  outcome_summary: string;
  key_findings: string[];
  reuse_guidance: string | null;
  short_summary: string | null;
  maturity_level: string;
  maturity_label: string;
  review_status: string;
  review_status_label: string;
  reuse_potential: string;
  source_type: string;
  owner_name: string;
  owner_office: string;
  contributing_office: string;
  contributor_attribution: string | null;
  executive_perspective_text: string | null;
  executive_recommendation: string | null;
  technical_perspective_text: string | null;
  security_findings: string | null;
  performance_findings: string | null;
  default_perspective: 'EXECUTIVE' | 'TECHNICAL';
  mission_area_tags: string[];
  technology_area_tags: string[];
  artifact_links: ArtifactLink[];
  engagement_options: EngagementOptionType[];
  trust_disclaimers: string[];   // server-computed by TrustDisclaimerService (T-11-06)
  is_validated_for_reuse: boolean;
  is_community_contributed: boolean;
  publication_state: string;
  last_reviewed_date: string | null;
  published_at: string | null;
  superseded_by_record_id: string | null;
  created_at: string;
  updated_at: string;
}

export type PerspectiveView = 'executive' | 'technical';

/**
 * Callback type for engagement request actions.
 * Wave 5 (W5-b) wires this to the EngagementRequestModal in RecordPage.
 * The optional triggerEl parameter is the button that was clicked — used to return
 * focus on modal close (WCAG 2.1 AA focus management).
 */
export type OnEngagementRequest = (
  engagementType: EngagementOptionType,
  record: InnovationRecord,
  triggerEl?: HTMLButtonElement
) => void;

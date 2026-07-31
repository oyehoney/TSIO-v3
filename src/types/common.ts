// Common type aliases used across TSIO Innovation Hub
// Mirrors CHECK constraints defined in db/migrations/001_core_content_tables.sql
// and db/migrations/001_supporting_tables.sql

export type MaturityLevel =
  | 'IDEA'
  | 'EXPERIMENT_POC'
  | 'PROTOTYPE_PILOT'
  | 'PRODUCTION_VALIDATED'
  | 'ARCHIVED';

export type ReviewStatus =
  | 'SUBMITTED'
  | 'CURATED'
  | 'TECHNICALLY_REVIEWED'
  | 'SECURITY_REVIEWED'
  | 'POLICY_REVIEWED'
  | 'VALIDATED_FOR_REUSE'
  | 'SUPERSEDED_RETIRED';

export type ReusePotential = 'HIGH' | 'MEDIUM' | 'LOW';

export type SourceType = 'I_AND_R' | 'COMMUNITY';

export type PublicationState =
  | 'DRAFT'
  | 'REVIEW'
  | 'PUBLISHED'
  | 'SUPERSEDED'
  | 'ARCHIVED';

export type EngagementOptionType =
  | 'REQUEST_DEMO'
  | 'REQUEST_ADOPTION_DISCUSSION'
  | 'REQUEST_TECHNICAL_GUIDANCE'
  | 'REQUEST_BRIEFING'
  | 'SUBMIT_RELATED_PROBLEM';

export type DefaultPerspective = 'EXECUTIVE' | 'TECHNICAL';

export type ArtifactType =
  | 'DOCUMENT'
  | 'CODE_REPOSITORY'
  | 'VIDEO'
  | 'DIAGRAM'
  | 'OTHER';

/**
 * Shared test fixtures for TSIO Innovation Hub integration test suite
 * Plan 18 — Wave 7b: End-to-end integration validation
 *
 * These fixtures represent the Audio Security POC anchor record seeded by plan 17
 * (seeds/audio-security-poc.sql / seeds/seed.ts)
 */

// ─── Audio Security POC Anchor Record ────────────────────────────────────────

/**
 * AUDIO_SECURITY_POC matches the InnovationRecord type from client/src/types/record.ts
 * as served by the frontend RecordPage via GET /api/v1/records/:id
 */
export const AUDIO_SECURITY_POC = {
  record_id: 'rec-audio-security-poc-001',
  title: 'Audio Security POC — Courtroom Audio Processing',
  problem_statement:
    'Federal courtrooms require reliable audio capture and processing for proceedings, but existing consumer-grade audio hardware lacks the security posture required for classified or sensitive proceedings.',
  what_was_explored:
    'GPU/CPU separation approach to isolate audio processing from court network; Azure Government Cloud constraints on GPU VM availability; FIPS-compliant audio codec evaluation.',
  outcome_summary:
    'POC demonstrated feasibility of GPU/CPU separation for audio security, but identified significant Azure Government Cloud limitations and hardware procurement gaps.',
  maturity_level: 'EXPERIMENT_POC',
  maturity_label: 'Experiment / POC',
  review_status: 'TECHNICALLY_REVIEWED',
  review_status_label: 'Technically Reviewed',
  reuse_potential: 'HIGH',
  source_type: 'INTERNAL',
  owner_name: 'I&R Technical Lead',
  owner_office: 'TSIO Innovation & Research',
  contributing_office: 'TSIO I&R',
  contributor_attribution: null,
  publication_state: 'PUBLISHED',
  published_at: '2026-07-28T00:00:00Z',
  last_reviewed_date: '2026-07-25',
  executive_perspective_text:
    'This POC established that secure GPU-accelerated audio processing is technically feasible for Judiciary environments, but is not yet production-ready.',
  executive_recommendation:
    'Not recommended for production adoption without additional security review and hardware procurement assessment. Consider initiating a prototype/pilot phase.',
  technical_perspective_text:
    'GPU/CPU separation implemented using NVIDIA T4 instances on Azure Government Cloud. Audio processing pipeline isolated in a separate VLAN. FIPS 140-2 validated codec evaluated.',
  security_findings:
    'Azure Government Cloud GPU VM availability is limited to specific regions. FIPS-compliant codec introduces 40ms latency. Full ISSO review not yet completed.',
  performance_findings:
    'Real-time audio processing achievable at 48kHz sample rate with <80ms round-trip latency under normal load. GPU utilization peaks at 60% during active sessions.',
  reuse_guidance:
    'Courts adopting this approach must: (1) provision dedicated GPU infrastructure or Azure Government Cloud GPU VMs; (2) engage local ISSO for security review before deployment; (3) evaluate FIPS codec latency tolerance with court stakeholders.',
  short_summary:
    'A proof of concept exploring secure GPU/CPU-separated audio processing for courtroom use, including Azure Government Cloud constraints and production-readiness assessment.',
  default_perspective: 'EXECUTIVE' as const,
  // key_findings: string[] (frontend uses flat strings per InnovationRecord type)
  key_findings: [
    'GPU/CPU separation is technically feasible but requires dedicated GPU infrastructure not available in most courts.',
    'Azure Government Cloud imposes GPU VM availability constraints; dedicated hardware procurement is required for most court environments.',
    'FIPS 140-2 compliant codec introduces 40ms latency, which may be acceptable for recorded proceedings but requires stakeholder evaluation for live hearings.',
    'This POC has not completed security or policy review. It is not production-ready and should not be deployed in a production Judiciary environment without ISSO review.',
  ],
  // artifact_links: ArtifactLink[] objects
  artifact_links: [
    {
      link_id: 'al-001',
      label: 'Audio Security POC Lessons Learned Document',
      url: 'https://ao.sharepoint.com/sites/TSIO/Documents/AudioSecurityPOC-LessonsLearned.docx',
      artifact_type: 'DOCUMENT',
      display_order: 1,
    },
    {
      link_id: 'al-002',
      label: 'Architecture Diagram',
      url: 'https://ao.sharepoint.com/sites/TSIO/Diagrams/AudioSec-Architecture.png',
      artifact_type: 'DIAGRAM',
      display_order: 2,
    },
  ],
  // Tags: string arrays per InnovationRecord type
  mission_area_tags: ['Courtroom Technology'],
  technology_area_tags: ['Audio Processing', 'Cloud Infrastructure'],
  // Engagement options: EngagementOptionType[] (string array)
  engagement_options: ['REQUEST_DEMO', 'REQUEST_TECHNICAL_GUIDANCE', 'REQUEST_BRIEFING'],
  // Trust disclaimers: computed by TrustDisclaimerService based on maturity/source/state/review
  trust_disclaimers: [
    'This record documents a Proof of Concept (POC). POC ≠ production-ready. Do not deploy based on this record alone without full engineering and security review.',
    'Publication of this record does not constitute formal approval for adoption. Each court or office must conduct its own review and approval process.',
  ],
  is_validated_for_reuse: false,
  is_community_contributed: false,
  superseded_by_record_id: null,
  created_at: '2026-07-20T00:00:00Z',
  updated_at: '2026-07-28T00:00:00Z',
};

// ─── Catalog Card Projection ──────────────────────────────────────────────────
// This matches the frontend CatalogCard type from client/src/types/catalog.ts

export const AUDIO_SECURITY_CATALOG_CARD = {
  record_id: AUDIO_SECURITY_POC.record_id,
  title: AUDIO_SECURITY_POC.title,
  short_summary: AUDIO_SECURITY_POC.short_summary,
  maturity_level: AUDIO_SECURITY_POC.maturity_level,
  maturity_label: 'Experiment / POC',        // display label for EXPERIMENT_POC
  review_status: AUDIO_SECURITY_POC.review_status,
  review_status_label: 'Technically Reviewed', // display label for TECHNICALLY_REVIEWED
  reuse_potential: AUDIO_SECURITY_POC.reuse_potential,
  source_type: AUDIO_SECURITY_POC.source_type,
  publication_state: AUDIO_SECURITY_POC.publication_state,
  published_at: AUDIO_SECURITY_POC.published_at,
  // Frontend uses string arrays for tags
  mission_area_tags: ['Courtroom Technology'],
  technology_area_tags: ['Audio Processing', 'Cloud Infrastructure'],
  // Frontend uses string array of engagement option types
  engagement_options: ['REQUEST_DEMO', 'REQUEST_TECHNICAL_GUIDANCE', 'REQUEST_BRIEFING'],
  // Frontend uses boolean flags
  is_validated_for_reuse: false,
  is_community_contributed: false,
};

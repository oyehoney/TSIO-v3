/**
 * Seed 001: Audio Security POC — Anchor Record
 * TSIO Innovation Hub
 *
 * Grounded in: PRD §7 F4, JOURNEYS JRN-01.1, JRN-03.1, RTM TEST-F4-09
 * Fixed UUID: 11111111-1111-1111-1111-111111111001
 * Idempotent: all INSERTs use ON CONFLICT DO NOTHING
 *
 * Usage (Knex):
 *   npx knex seed:run --specific=001_audio_security_poc.js
 *
 * Usage (raw psql via run_seeds.sh):
 *   This script is also referenced by run_seeds.sh via node execution.
 */

'use strict';

const SEED_USER_ID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
const ANCHOR_UUID  = '11111111-1111-1111-1111-111111111001';

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // -------------------------------------------------------------------------
  // Seed user: system curator for attribution
  // Real curators upsert via OIDC (AuthMiddleware, Wave 3a plan 06)
  // -------------------------------------------------------------------------
  await knex.raw(`
    INSERT INTO users (user_id, email, display_name, role, is_active)
    VALUES (
      '${SEED_USER_ID}',
      'system-seed@tsio.courts.internal',
      'TSIO I&R Seed Curator',
      'CURATOR',
      TRUE
    )
    ON CONFLICT (user_id) DO NOTHING
  `);

  // -------------------------------------------------------------------------
  // Main innovation record — Audio Security POC anchor record
  // -------------------------------------------------------------------------
  await knex.raw(`
    INSERT INTO innovation_records (
      record_id,
      title,
      problem_statement,
      what_was_explored,
      outcome_summary,
      reuse_guidance,
      short_summary,
      maturity_level,
      review_status,
      reuse_potential,
      source_type,
      owner_name,
      owner_office,
      contributing_office,
      contributor_attribution,
      executive_perspective_text,
      executive_recommendation,
      technical_perspective_text,
      security_findings,
      performance_findings,
      default_perspective,
      publication_state,
      last_reviewed_date,
      published_at,
      created_by_user_id,
      updated_by_user_id
    )
    VALUES (
      '${ANCHOR_UUID}',

      'Audio Security in Azure Government Cloud — Proof of Concept',

      'Court environments must protect sensitive audio — including testimony, chambers discussions, and courtroom proceedings — from unauthorized interception or recording. The I&R team explored whether GPU-accelerated audio encryption and processing services could be deployed securely within Azure Government Cloud constraints while meeting real-time performance requirements for court use.',

      'GPU/CPU service separation architecture for real-time audio processing; Azure Government Cloud feature availability and compliance constraints; performance and latency characteristics under load; security architecture for audio data in motion; integration patterns with court AV systems.',

      'The POC demonstrated that GPU-accelerated audio encryption is technically feasible but currently constrained by Azure Government Cloud service availability and real-time latency requirements. Key findings indicate that production deployment requires infrastructure changes not yet available in the Judiciary hosting environment.',

      'Courts evaluating audio security technology should note: (1) Dedicated GPU infrastructure must be provisioned — standard Azure Government Cloud vCPU tiers are insufficient for real-time inference. (2) Courts on standard AO Azure Government Cloud subscriptions must obtain a security review of the AI model inference pipeline before any production trial. (3) Network segmentation constraints in federal facility environments may limit sensor placement. (4) The I&R team recommends requesting a technical guidance session before initiating any local procurement or infrastructure assessment.',

      'POC evaluation of GPU-accelerated audio encryption for court environments in Azure Government Cloud. Demonstrated feasibility with important infrastructure and compliance constraints. Not recommended for production adoption without further security review and GPU infrastructure investment.',

      'EXPERIMENT_POC',

      'TECHNICALLY_REVIEWED',

      'MEDIUM',

      'I_AND_R',

      'TSIO Innovation & Research Team',

      'TSIO I&R Branch, Administrative Office of the U.S. Courts',

      'TSIO Innovation & Research Branch',

      'TSIO I&R team conducted the POC evaluation. Audio security domain expertise provided by TSIO cybersecurity staff.',

      'The Audio Security POC addresses a real and growing mission risk: unauthorized audio interception in court environments. The I&R team has validated that GPU-accelerated audio encryption is technically feasible and has identified the specific constraints under which a production-grade solution could be deployed. This work does not constitute a deployed solution — it is a structured set of findings that can inform a future investment decision. Senior leaders considering audio security investments should use this record to understand what has been evaluated, what gaps remain, and what a realistic path to production would require.',

      'This effort is at POC/Experiment maturity. Production adoption is not recommended at this time. The findings identify prerequisites that must be addressed before a production trial: dedicated GPU infrastructure, an AO security review of the encryption pipeline, and a site-specific network assessment. Courts with active audio security concerns should request a technical guidance session with I&R to understand the full implications before initiating any procurement.',

      'The POC used GPU-accelerated audio processing deployed in a Docker container on a GPU-provisioned Azure Government Cloud VM. The encryption pipeline required NVIDIA CUDA 11.x and a minimum of 8GB VRAM for real-time processing at courtroom-scale audio sampling rates (48kHz stereo, 16-channel). CPU-only fallback produced latency of 340ms average (target: <50ms). The Azure Government Cloud tenant constraints currently block standard deployment of the encryption container in GCC tier — the GPU compute environment required is not available under standard subscription terms.',

      'Security review has NOT been completed for this effort. Known security considerations: (1) The encryption pipeline has not been evaluated by the AO cybersecurity team — required before any production deployment. (2) Audio signal data processed may constitute sensitive court proceeding content — data classification and retention policies must be established. Courts must conduct their own local security assessment.',

      'CPU-only processing: average 340ms latency (unacceptable for real-time; target <50ms). GPU-accelerated (NVIDIA A10G): average 18ms latency (within target). Encryption throughput in controlled lab: 94.2% success rate at 0.3% failure rate. Performance degrades under high acoustic load in multi-channel courtroom environments.',

      'EXECUTIVE',

      'PUBLISHED',

      '2025-06-15',

      NOW(),

      '${SEED_USER_ID}',
      '${SEED_USER_ID}'
    )
    ON CONFLICT (record_id) DO NOTHING
  `);

  // -------------------------------------------------------------------------
  // Key findings (5 findings covering GPU/CPU separation, Azure Gov constraints,
  // performance, production-readiness gaps, and reuse potential)
  // -------------------------------------------------------------------------
  await knex.raw(`
    INSERT INTO record_key_findings (finding_id, record_id, finding_text, display_order)
    VALUES
      (
        '11111111-1111-1111-1111-111111111101',
        '${ANCHOR_UUID}',
        'GPU/CPU separation is a hard architectural requirement: real-time audio encryption requires dedicated GPU provisioning (NVIDIA A10G or equivalent with CUDA 11.x+). CPU-only processing produced 340ms average latency — 6.8x over the 50ms real-time threshold. Any deployment evaluation must begin with GPU infrastructure procurement.',
        1
      ),
      (
        '11111111-1111-1111-1111-111111111102',
        '${ANCHOR_UUID}',
        'Azure Government Cloud constraints block standard deployment: the GPU-accelerated encryption container requires a dedicated compute environment not available in standard Government Community Cloud (GCC) subscription tiers. Courts on standard AO Azure Gov subscriptions cannot deploy without a subscription tier change or dedicated GPU endpoint provisioning.',
        2
      ),
      (
        '11111111-1111-1111-1111-111111111103',
        '${ANCHOR_UUID}',
        'Performance and throughput degrade under realistic courtroom conditions: GPU-accelerated success rate drops from 94.2% (controlled lab) to approximately 87% under multi-channel acoustic load, with latency variance increasing significantly. High-reverb courtroom environments require acoustic calibration before reliable operational use.',
        3
      ),
      (
        '11111111-1111-1111-1111-111111111104',
        '${ANCHOR_UUID}',
        'Three production-readiness gaps must be closed before any deployment: (1) AO cybersecurity/ISSO security review of the encryption pipeline — not yet conducted; (2) data classification and retention policy for processed audio — not yet established; (3) site-specific network segmentation assessment for AV system integration — required per facility security policy. None of these gaps can be waived.',
        4
      ),
      (
        '11111111-1111-1111-1111-111111111105',
        '${ANCHOR_UUID}',
        'Reuse potential is MEDIUM: the GPU/CPU separation architecture and Azure Government Cloud constraint findings are broadly applicable to any court AV or real-time media processing initiative. The specific encryption approach requires GPU infrastructure investment but the constraint analysis and performance benchmarks can inform future procurement decisions without re-running the POC.',
        5
      )
    ON CONFLICT (finding_id) DO NOTHING
  `);

  // -------------------------------------------------------------------------
  // Artifact link — links to authoritative SharePoint document per F4 design
  // -------------------------------------------------------------------------
  await knex.raw(`
    INSERT INTO record_artifact_links (link_id, record_id, label, url, artifact_type, display_order)
    VALUES
      (
        '11111111-1111-1111-1111-111111111201',
        '${ANCHOR_UUID}',
        'Audio Security POC Lessons-Learned Document',
        'https://ao.sharepoint.com/sites/tsio/Innovation/AudioSecurityPOC/LessonsLearned.docx',
        'DOCUMENT',
        1
      )
    ON CONFLICT (link_id) DO NOTHING
  `);

  // -------------------------------------------------------------------------
  // Tags — MISSION_AREA + TECHNOLOGY_AREA (both required for catalog filtering)
  // -------------------------------------------------------------------------
  await knex.raw(`
    INSERT INTO record_tags (tag_id, record_id, tag_type, tag_value, display_order)
    VALUES
      (
        '11111111-1111-1111-1111-111111111301',
        '${ANCHOR_UUID}',
        'MISSION_AREA',
        'Cybersecurity',
        1
      ),
      (
        '11111111-1111-1111-1111-111111111302',
        '${ANCHOR_UUID}',
        'MISSION_AREA',
        'Court Operations',
        2
      ),
      (
        '11111111-1111-1111-1111-111111111303',
        '${ANCHOR_UUID}',
        'TECHNOLOGY_AREA',
        'Azure Government Cloud',
        1
      ),
      (
        '11111111-1111-1111-1111-111111111304',
        '${ANCHOR_UUID}',
        'TECHNOLOGY_AREA',
        'GPU Computing',
        2
      )
    ON CONFLICT (tag_id) DO NOTHING
  `);

  // -------------------------------------------------------------------------
  // Engagement options — REQUEST_DEMO, REQUEST_TECHNICAL_GUIDANCE per user spec
  // -------------------------------------------------------------------------
  await knex.raw(`
    INSERT INTO record_engagement_options (option_id, record_id, option_type, display_order)
    VALUES
      (
        '11111111-1111-1111-1111-111111111401',
        '${ANCHOR_UUID}',
        'REQUEST_DEMO',
        1
      ),
      (
        '11111111-1111-1111-1111-111111111402',
        '${ANCHOR_UUID}',
        'REQUEST_TECHNICAL_GUIDANCE',
        2
      )
    ON CONFLICT (record_id, option_type) DO NOTHING
  `);
};

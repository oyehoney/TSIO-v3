/**
 * Seed 002: Additional Records — AI Redaction POC + Blockchain Experiment
 * TSIO Innovation Hub
 *
 * Grounded in: PRD §9 "at least 3 fully published innovation records at launch"
 *              PRD §9 "at least 1 archived/stopped experiment record is published"
 * Fixed UUIDs: stable across re-runs for Wave 7b test fixture references
 * Idempotent: all INSERTs use ON CONFLICT DO NOTHING
 *
 * Records:
 *   1. AI Redaction POC    — 22222222-2222-2222-2222-222222222001 (PUBLISHED, EXPERIMENT_POC)
 *   2. Blockchain Experiment — 33333333-3333-3333-3333-333333333001 (ARCHIVED, ARCHIVED)
 */

'use strict';

const SEED_USER_ID        = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
const AI_REDACTION_UUID   = '22222222-2222-2222-2222-222222222001';
const BLOCKCHAIN_UUID     = '33333333-3333-3333-3333-333333333001';

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // -------------------------------------------------------------------------
  // Seed user: system curator for attribution (idempotent — may already exist)
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

  // ===========================================================================
  // Record 1: AI Redaction POC (PUBLISHED, EXPERIMENT_POC)
  // Satisfies PRD §9: second fully published innovation record
  // ===========================================================================

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
      default_perspective,
      publication_state,
      last_reviewed_date,
      published_at,
      created_by_user_id,
      updated_by_user_id
    )
    VALUES (
      '${AI_REDACTION_UUID}',

      'AI-Assisted Document Redaction for Court Records — Proof of Concept',

      'Federal courts process large volumes of documents requiring redaction of sensitive personally identifiable information (PII) — including Social Security numbers, dates of birth, home addresses, and financial account numbers — before public docket release. Current manual review processes are labor-intensive, error-prone under volume, and create backlogs that delay public access to court records. The I&R team explored whether AI-assisted redaction could improve consistency, reduce review burden, and maintain compliance with judicial privacy requirements.',

      'The I&R team evaluated three commercial AI redaction services and one open-source NLP-based redaction pipeline against a synthetic court document corpus (anonymized docket filings). Evaluation criteria included PII detection accuracy, false positive rates, processing speed, Azure Government Cloud compatibility, and auditability requirements under CM/ECF integration constraints. The POC tested redaction of nine PII categories across five document types common in federal court dockets.',

      'AI-assisted redaction demonstrated statistically significant accuracy improvements over baseline manual processes for structured PII (SSNs, financial account numbers: >98% detection at <0.5% false positive rate). Unstructured PII (contextual addresses, informal name references) performed at 87–91% detection, below the threshold for unsupervised deployment. The POC recommends a human-in-the-loop workflow where AI pre-flags redaction candidates for attorney/clerk review — not a fully automated pipeline. Azure Government Cloud compatible services are available but require ATO review before production use.',

      'Courts evaluating AI redaction should: (1) Focus initial deployment on structured PII categories (SSN, financial identifiers) where AI performance exceeds manual baseline. (2) Require human review of all AI redaction suggestions before finalizing — do not deploy unsupervised. (3) Ensure any AI service has completed ATO review under your court''s ISSO before processing real docket filings. (4) Contact I&R for the full evaluation dataset and accuracy benchmark details before vendor engagement.',

      'POC evaluating AI-assisted PII redaction for federal court documents. Demonstrated strong accuracy for structured PII with human-in-the-loop workflow. Azure Government Cloud compatible services identified. Human review required — fully automated redaction not yet recommended.',

      'EXPERIMENT_POC',

      'TECHNICALLY_REVIEWED',

      'HIGH',

      'I_AND_R',

      'TSIO Innovation & Research Team',

      'TSIO I&R Branch, Administrative Office of the U.S. Courts',

      'TSIO Innovation & Research Branch',

      'TSIO I&R team led the evaluation. CM/ECF integration assessment provided by Case Management Division liaison.',

      'AI-assisted document redaction addresses one of the highest-volume, highest-risk clerical processes in federal courts. The I&R POC found that AI can meaningfully reduce redaction burden and error rates for structured PII categories, but human review remains essential for unstructured content. This finding has direct implications for court efficiency investments: AI redaction can accelerate review workflow without eliminating the attorney/clerk review step. Courts interested in piloting this capability should contact I&R — the POC evaluation criteria and vendor shortlist are available to inform local procurement decisions.',

      'This effort is at POC/Experiment maturity with HIGH reuse potential. The I&R team recommends courts with high docket redaction volume evaluate AI-assisted redaction with a structured pilot. Begin with structured PII categories. Require human-in-the-loop review. Obtain ISSO/ATO clearance before processing live filings. Request the full I&R evaluation dataset and benchmark report via a technical guidance session before vendor engagement.',

      'Evaluation used a 10,000-document synthetic corpus derived from anonymized CM/ECF filing patterns across five document types: complaints, motions, exhibits, orders, and sealed attachments. Three commercial services (Service A, B, C — names withheld per evaluation protocol) and one open-source NLP pipeline (SpaCy-based) were evaluated. Infrastructure: Azure Government Cloud B4ms VMs (no GPU required for inference at this scale). Processing throughput: 180–220 pages/minute depending on document complexity. CM/ECF integration pathway identified via CM/ECF API endpoints — requires Case Management Division approval for production access.',

      'EXECUTIVE',

      'PUBLISHED',

      '2025-09-10',

      NOW(),

      '${SEED_USER_ID}',
      '${SEED_USER_ID}'
    )
    ON CONFLICT (record_id) DO NOTHING
  `);

  // Key findings for AI Redaction POC
  await knex.raw(`
    INSERT INTO record_key_findings (finding_id, record_id, finding_text, display_order)
    VALUES
      (
        '22222222-2222-2222-2222-222222222101',
        '${AI_REDACTION_UUID}',
        'Structured PII redaction (SSNs, financial account numbers, dates of birth) exceeded 98% detection accuracy at <0.5% false positive rate — significantly outperforming the 91% baseline for manual review under volume. AI pre-flagging for these categories is ready for human-in-the-loop pilot deployment.',
        1
      ),
      (
        '22222222-2222-2222-2222-222222222102',
        '${AI_REDACTION_UUID}',
        'Unstructured PII detection (contextual addresses, informal name references, implied identifiers) performed at 87–91% — below the >95% threshold required for unsupervised deployment. Human review of AI redaction suggestions is required for all document types containing unstructured content.',
        2
      ),
      (
        '22222222-2222-2222-2222-222222222103',
        '${AI_REDACTION_UUID}',
        'Azure Government Cloud compatible AI redaction services are available and capable, but all three evaluated commercial services require ATO review under Judiciary security policy before processing real docket filings. None have existing Judiciary ATO coverage — ATO review is the critical path for production deployment.',
        3
      ),
      (
        '22222222-2222-2222-2222-222222222104',
        '${AI_REDACTION_UUID}',
        'Recommended deployment pattern: AI-assisted human-in-the-loop workflow where AI pre-flags redaction candidates, clerk/attorney reviews and approves, then system applies. This pattern reduces average redaction review time by an estimated 60–70% for structured PII-heavy documents while maintaining human accountability for final redaction decisions.',
        4
      )
    ON CONFLICT (finding_id) DO NOTHING
  `);

  // Artifact links for AI Redaction POC
  await knex.raw(`
    INSERT INTO record_artifact_links (link_id, record_id, label, url, artifact_type, display_order)
    VALUES
      (
        '22222222-2222-2222-2222-222222222201',
        '${AI_REDACTION_UUID}',
        'AI Redaction POC Evaluation Report — SharePoint',
        'https://ao.sharepoint.com/sites/tsio/Innovation/AIRedactionPOC/EvaluationReport.pdf',
        'DOCUMENT',
        1
      )
    ON CONFLICT (link_id) DO NOTHING
  `);

  // Tags for AI Redaction POC
  await knex.raw(`
    INSERT INTO record_tags (tag_id, record_id, tag_type, tag_value, display_order)
    VALUES
      (
        '22222222-2222-2222-2222-222222222301',
        '${AI_REDACTION_UUID}',
        'MISSION_AREA',
        'Records Management',
        1
      ),
      (
        '22222222-2222-2222-2222-222222222302',
        '${AI_REDACTION_UUID}',
        'MISSION_AREA',
        'Court Operations',
        2
      ),
      (
        '22222222-2222-2222-2222-222222222303',
        '${AI_REDACTION_UUID}',
        'TECHNOLOGY_AREA',
        'AI/ML — Natural Language Processing',
        1
      ),
      (
        '22222222-2222-2222-2222-222222222304',
        '${AI_REDACTION_UUID}',
        'TECHNOLOGY_AREA',
        'Azure Government Cloud',
        2
      )
    ON CONFLICT (tag_id) DO NOTHING
  `);

  // Engagement options for AI Redaction POC
  await knex.raw(`
    INSERT INTO record_engagement_options (option_id, record_id, option_type, display_order)
    VALUES
      (
        '22222222-2222-2222-2222-222222222401',
        '${AI_REDACTION_UUID}',
        'REQUEST_DEMO',
        1
      ),
      (
        '22222222-2222-2222-2222-222222222402',
        '${AI_REDACTION_UUID}',
        'REQUEST_TECHNICAL_GUIDANCE',
        2
      ),
      (
        '22222222-2222-2222-2222-222222222403',
        '${AI_REDACTION_UUID}',
        'REQUEST_BRIEFING',
        3
      )
    ON CONFLICT (record_id, option_type) DO NOTHING
  `);

  // ===========================================================================
  // Record 2: Blockchain Experiment (ARCHIVED, ARCHIVED publication_state)
  // Satisfies PRD §9: "at least 1 archived/stopped experiment record"
  // Demonstrates honest institutional lifecycle representation
  // ===========================================================================

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
      executive_perspective_text,
      executive_recommendation,
      default_perspective,
      publication_state,
      last_reviewed_date,
      published_at,
      created_by_user_id,
      updated_by_user_id
    )
    VALUES (
      '${BLOCKCHAIN_UUID}',

      'Blockchain-Based Court Record Integrity Verification — Archived Experiment',

      'Federal courts maintain authoritative court records that must be tamper-evident and auditable over multi-decade retention periods. The I&R team investigated whether blockchain or distributed ledger technology could provide cryptographic tamper-evidence for court records without requiring changes to existing CM/ECF infrastructure or introducing external dependencies incompatible with Judiciary security policy.',

      'The I&R team evaluated three blockchain approaches for court record integrity: (1) a permissioned private blockchain using Hyperledger Fabric; (2) a hash-anchoring approach publishing record hashes to a public blockchain (Ethereum); and (3) a simpler cryptographic hash chain stored within existing infrastructure. The experiment assessed technical feasibility, security policy compliance, operational complexity, and total cost of ownership for a representative district court with 10-year retention scope.',

      'The experiment was stopped after evaluation phase. The core finding is that blockchain technology does not provide meaningful security advantages over existing cryptographic hash-chain approaches for court record integrity within the Judiciary infrastructure context, while introducing significant operational complexity and vendor dependencies that conflict with AO security policy. The public blockchain (hash-anchoring) approach was ruled out immediately — policy prohibits publishing any court record identifier to public infrastructure. Hyperledger Fabric demonstrated technical feasibility but operational complexity and licensing costs exceeded the value of the tamper-evidence benefit relative to hash-chain alternatives. This record is retained for institutional learning to prevent duplicate evaluation of this approach.',

      'This effort is archived. Future evaluations of court record integrity technology should review this record before commissioning new work. The documented evaluation criteria and policy constraints remain valid. If the Judiciary hosting environment or AO security policy changes materially, contact I&R before re-initiating blockchain evaluation.',

      'Stopped experiment: blockchain-based court record integrity verification. Archived after evaluation phase — no meaningful security advantage over existing hash-chain approaches within Judiciary infrastructure constraints. Policy conflicts with public blockchain approaches. Retained for institutional learning.',

      'ARCHIVED',

      'CURATED',

      'LOW',

      'I_AND_R',

      'TSIO Innovation & Research Team',

      'TSIO I&R Branch, Administrative Office of the U.S. Courts',

      'TSIO Innovation & Research Branch',

      'The I&R team explored blockchain-based tamper-evidence for court records. The experiment was stopped because blockchain does not improve on existing cryptographic approaches within the Judiciary''s infrastructure and policy context — while adding operational complexity and cost. This record is retained so future leaders do not re-commission evaluation of this technology without first reviewing why the approach was archived. Negative findings are institutional knowledge.',

      'This effort has been archived. No further investment in blockchain-based court record integrity is recommended under current infrastructure and policy constraints. If AO security policy or Judiciary hosting infrastructure changes materially (e.g., permissioned blockchain becomes supportable under ATO), the I&R team should be consulted before re-initiating evaluation. Courts with active record integrity concerns should review existing hash-chain mechanisms already available in CM/ECF infrastructure.',

      'EXECUTIVE',

      'ARCHIVED',

      '2024-08-15',

      NOW(),

      '${SEED_USER_ID}',
      '${SEED_USER_ID}'
    )
    ON CONFLICT (record_id) DO NOTHING
  `);

  // Key findings for Blockchain Experiment
  await knex.raw(`
    INSERT INTO record_key_findings (finding_id, record_id, finding_text, display_order)
    VALUES
      (
        '33333333-3333-3333-3333-333333333101',
        '${BLOCKCHAIN_UUID}',
        'No meaningful security advantage over hash-chain alternatives: within the Judiciary infrastructure context, cryptographic hash chains stored within existing AO-controlled infrastructure provide equivalent tamper-evidence guarantees to permissioned blockchain approaches, without the operational complexity or external vendor dependencies. Blockchain adds governance overhead without security upside for this use case.',
        1
      ),
      (
        '33333333-3333-3333-3333-333333333102',
        '${BLOCKCHAIN_UUID}',
        'Public blockchain approaches are policy-prohibited: publishing any court record identifier or hash to public blockchain infrastructure (Ethereum or similar) violates AO security policy regarding disclosure of court record metadata to external systems. This approach cannot be pursued without a policy change.',
        2
      ),
      (
        '33333333-3333-3333-3333-333333333103',
        '${BLOCKCHAIN_UUID}',
        'Permissioned blockchain (Hyperledger Fabric) is technically feasible but operationally impractical: licensing costs, node operational requirements, and upgrade complexity for a 10-year retention scope exceeded the incremental value of the tamper-evidence benefit. Operational TCO estimated at 4–6x the equivalent hash-chain implementation.',
        3
      )
    ON CONFLICT (finding_id) DO NOTHING
  `);

  // Artifact link for Blockchain Experiment
  await knex.raw(`
    INSERT INTO record_artifact_links (link_id, record_id, label, url, artifact_type, display_order)
    VALUES
      (
        '33333333-3333-3333-3333-333333333201',
        '${BLOCKCHAIN_UUID}',
        'Blockchain Integrity Experiment — Termination Summary (SharePoint)',
        'https://ao.sharepoint.com/sites/tsio/Innovation/BlockchainExperiment/TerminationSummary.pdf',
        'DOCUMENT',
        1
      )
    ON CONFLICT (link_id) DO NOTHING
  `);

  // Tags for Blockchain Experiment
  await knex.raw(`
    INSERT INTO record_tags (tag_id, record_id, tag_type, tag_value, display_order)
    VALUES
      (
        '33333333-3333-3333-3333-333333333301',
        '${BLOCKCHAIN_UUID}',
        'MISSION_AREA',
        'Records Management',
        1
      ),
      (
        '33333333-3333-3333-3333-333333333302',
        '${BLOCKCHAIN_UUID}',
        'TECHNOLOGY_AREA',
        'Blockchain / Distributed Ledger',
        1
      )
    ON CONFLICT (tag_id) DO NOTHING
  `);
};

-- =============================================================================
-- Seed: Archived Experiment — Automated Case Scheduling Optimization POC
-- TSIO Innovation Hub
-- Grounded in: PRD §9 "at least 1 archived/stopped experiment record"
-- PRD §6.1: maturity_level=ARCHIVED + PRD §6.4: publication_state=ARCHIVED
-- Fixed UUID: a0000000-0000-0000-0000-000000000002
-- Idempotent: all INSERTs use ON CONFLICT DO NOTHING
-- =============================================================================

-- Seed user from poc seed (if not already seeded)
INSERT INTO users (user_id, email, display_name, role, is_active)
VALUES (
    'f0000000-0000-0000-0000-000000000001',
    'system-seed@tsio.courts.internal',
    'TSIO I&R Team (Seed)',
    'CURATOR',
    TRUE
)
ON CONFLICT (user_id) DO NOTHING;

-- Archived experiment record
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
    'a0000000-0000-0000-0000-000000000002',

    'Automated Case Scheduling Optimization POC (Archived)',

    'Federal courts face persistent scheduling inefficiencies due to manual coordination across judges, attorneys, courtrooms, and court staff. This effort explored whether AI-assisted scheduling optimization could reduce scheduling conflicts and continuances without displacing the human judgment required for complex case management decisions.',

    'The I&R team evaluated ML-based constraint satisfaction scheduling algorithms against a synthetic dataset derived from anonymized docket patterns. Two commercial scheduling optimization libraries were assessed alongside a custom constraint solver prototype. The effort was stopped at the early experiment stage after it became clear that court-specific scheduling constraints (e.g., judicial availability, mandatory appearance requirements, case type priority rules) varied too significantly across districts to support a general-purpose model without district-specific configuration investment that exceeded the POC scope.',

    'The experiment was stopped. The core finding is that general-purpose AI scheduling optimization is not viable across the Judiciary without significant district-specific configuration investment. The effort produced useful negative findings: what categories of scheduling constraints resist automation, and which configuration burden factors make general solutions impractical for a decentralized court system. No production deployment was ever intended. This record is retained for institutional learning.',

    'This effort is archived. The findings are retained to inform future scheduling technology evaluations. Courts exploring scheduling efficiency should review the documented constraint categories before evaluating any vendor scheduling solution — the negative findings from this POC identify the key questions any vendor must answer.',

    'Stopped experiment: AI-assisted case scheduling optimization. Archived after early POC stage due to district-specific constraint variability. Retained for institutional learning. Not recommended for reuse.',

    -- maturity_level = ARCHIVED (innovation work is no longer active)
    'ARCHIVED',

    -- review_status = CURATED (curator structured it; no external review)
    'CURATED',

    'LOW',
    'I_AND_R',

    'TSIO Innovation & Research Branch',
    'Technology Solutions & Innovation Office (TSIO)',
    'Technology Solutions & Innovation Office (TSIO)',

    'The I&R team explored whether AI-based scheduling optimization could reduce court scheduling inefficiencies. The experiment was stopped at the early POC stage. The work did not produce a deployable solution, but it produced structured findings about why general-purpose AI scheduling tools do not translate well to the Judiciary''s decentralized court system. This record is retained so future leaders do not commission duplicate work.',

    'This effort has been archived. No adoption or further investment is recommended. The archived findings are available to inform future scheduling technology evaluations. If your court is actively exploring scheduling efficiency, request a technical guidance session to understand the documented constraint categories before engaging vendors.',

    'EXECUTIVE',

    -- publication_state = ARCHIVED (removed from default catalog browse per PRD §6.4)
    'ARCHIVED',

    '2024-11-30',
    NOW(),
    'f0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (record_id) DO NOTHING;

-- Key findings for archived experiment
INSERT INTO record_key_findings (finding_id, record_id, finding_text, display_order)
VALUES
    (
        'b0000000-0000-0000-0000-000000000011',
        'a0000000-0000-0000-0000-000000000002',
        'District-specific scheduling constraint variability is the primary barrier to general AI scheduling solutions: mandatory appearance rules, judicial recusal patterns, and case type priority overrides differ significantly across districts and cannot be abstracted into a shared model without substantial per-district configuration investment.',
        1
    ),
    (
        'b0000000-0000-0000-0000-000000000012',
        'a0000000-0000-0000-0000-000000000002',
        'Negative finding retained for institutional learning: general-purpose commercial scheduling optimization tools evaluated during this effort could not accommodate the full range of mandatory judicial scheduling constraints without custom integration work estimated to exceed the value of automation at district scale.',
        2
    )
ON CONFLICT (finding_id) DO NOTHING;

-- Artifact link
INSERT INTO record_artifact_links (link_id, record_id, label, url, artifact_type, display_order)
VALUES
    (
        'c0000000-0000-0000-0000-000000000011',
        'a0000000-0000-0000-0000-000000000002',
        'Automated Scheduling POC — Termination Summary (SharePoint)',
        'https://ao.sharepoint.com/sites/TSIO-IR/Shared%20Documents/POC-Scheduling-TerminationSummary-2024.pdf',
        'DOCUMENT',
        1
    )
ON CONFLICT (link_id) DO NOTHING;

-- Tags
INSERT INTO record_tags (tag_id, record_id, tag_type, tag_value, display_order)
VALUES
    (
        'd0000000-0000-0000-0000-000000000011',
        'a0000000-0000-0000-0000-000000000002',
        'MISSION_AREA',
        'Case Management',
        1
    ),
    (
        'd0000000-0000-0000-0000-000000000012',
        'a0000000-0000-0000-0000-000000000002',
        'TECHNOLOGY_AREA',
        'AI/ML — Optimization',
        1
    )
ON CONFLICT (tag_id) DO NOTHING;

-- =============================================================================
-- End: seed_archived_experiment.sql
-- =============================================================================

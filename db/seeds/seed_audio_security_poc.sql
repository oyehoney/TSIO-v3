-- =============================================================================
-- Seed: Audio Security POC — Anchor Record
-- TSIO Innovation Hub
-- Grounded in: PRD §7 F4, JOURNEYS JRN-01.1, JRN-03.1, RTM TEST-F4-09
-- Fixed UUID: a0000000-0000-0000-0000-000000000001
-- Idempotent: all INSERTs use ON CONFLICT DO NOTHING
-- =============================================================================

-- Seed user: system curator for attribution (seeded here; real curators upsert via OIDC)
INSERT INTO users (user_id, email, display_name, role, is_active)
VALUES (
    'f0000000-0000-0000-0000-000000000001',
    'system-seed@tsio.courts.internal',
    'TSIO I&R Team (Seed)',
    'CURATOR',
    TRUE
)
ON CONFLICT (user_id) DO NOTHING;

-- Main innovation record
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
    'a0000000-0000-0000-0000-000000000001',

    -- title (VARCHAR 200, min 5)
    'Audio Security POC: Real-Time Audio Surveillance Detection in Federal Courtrooms',

    -- problem_statement (TEXT, min 50) — FTS weight A; JRN-03.1 "audio security" search anchor
    'Federal courtrooms face a growing risk from unauthorized audio recording devices concealed in courtroom environments. Detecting these devices in real time — without disrupting court proceedings — requires a technical approach that balances accuracy, performance, and operational constraints unique to federal facilities operating within Azure Government Cloud infrastructure.',

    -- what_was_explored (TEXT, min 50) — FTS weight B
    'The I&R team conducted a proof-of-concept evaluation of AI-assisted audio surveillance detection using GPU-accelerated signal processing to identify anomalous audio signatures indicative of concealed recording devices. The POC tested feasibility across three scenarios: controlled lab environment, simulated courtroom acoustics, and integration with existing Azure Government Cloud tenant constraints. The team evaluated GPU/CPU separation architectures, latency thresholds for real-time detection, and the boundaries of permissible compute environments under current AO security policy.',

    -- outcome_summary (TEXT, min 50) — FTS weight B
    'The POC demonstrated technical feasibility of AI-assisted audio surveillance detection with detection accuracy rates exceeding baseline thresholds in controlled environments. However, production deployment is not recommended at this time due to three critical gaps: (1) GPU infrastructure is not available in the standard Azure Government Cloud subscription tier used by most Judiciary facilities; (2) latency under realistic courtroom acoustic load exceeded acceptable real-time thresholds on CPU-only processing; and (3) the current AO security policy has not evaluated the AI model inference pipeline for compliance. The effort produced durable lessons on architectural constraints and a clear set of conditions under which production readiness could be achieved.',

    -- reuse_guidance (TEXT)
    'Courts evaluating audio security technology should note: (1) Dedicated GPU infrastructure must be provisioned before any deployment evaluation — standard Azure Government Cloud vCPU tiers are insufficient for real-time inference. (2) Courts operating under the standard AO Azure Government Cloud subscription must obtain a security review of the AI model inference pipeline before any production trial. (3) Network segmentation constraints in federal facility environments may limit sensor placement — a site-specific network assessment is required. (4) The I&R team recommends requesting a technical guidance session before initiating any local procurement or infrastructure assessment.',

    -- short_summary (VARCHAR 280)
    'POC evaluation of AI-assisted audio surveillance detection for federal courtrooms. Demonstrated feasibility with GPU/Azure Government Cloud constraints. Not recommended for production adoption without further security review and GPU infrastructure investment.',

    -- maturity_level — PROTOTYPE_PILOT triggers "POC ≠ production-ready" disclaimer
    'PROTOTYPE_PILOT',

    -- review_status — TECHNICALLY_REVIEWED; no security/policy review yet
    'TECHNICALLY_REVIEWED',

    -- reuse_potential
    'MEDIUM',

    -- source_type — I_AND_R conducted work
    'I_AND_R',

    -- owner_name
    'TSIO Innovation & Research Branch',

    -- owner_office
    'Technology Solutions & Innovation Office (TSIO)',

    -- contributing_office
    'Technology Solutions & Innovation Office (TSIO)',

    -- contributor_attribution
    'TSIO I&R team conducted the POC evaluation. Audio security domain expertise provided by TSIO cybersecurity staff.',

    -- executive_perspective_text — F3 pub-required; grounded in JRN-01.1 "Executive Perspective"
    'The Audio Security POC addresses a real and growing mission risk: unauthorized audio recording in federal courtroom environments. The I&R team has validated that AI-assisted detection is technically feasible and has identified the specific conditions under which a production-grade solution could be deployed. This work does not constitute a deployed solution — it is a structured set of findings that can inform a future investment decision. Senior leaders considering courtroom audio security investments should use this record to understand what has already been evaluated, what gaps remain, and what a realistic path to production deployment would require.',

    -- executive_recommendation — F3 pub-required; grounded in JRN-01.1 "Decision Recommendation"
    'This effort is at Prototype/Pilot maturity stage. Production adoption is not recommended at this time. The findings identify three prerequisites that must be addressed before a production trial: dedicated GPU infrastructure, an AO security review of the AI inference pipeline, and a site-specific network assessment. Courts with active audio security concerns should request a technical guidance session with I&R to understand the full implications before initiating any procurement.',

    -- technical_perspective_text
    'The POC used a transformer-based audio anomaly detection model deployed in a Docker container on a GPU-provisioned Azure VM. Signal acquisition used low-power RF sensors integrated with the Azure IoT Hub SDK. The inference pipeline required NVIDIA CUDA 11.x and a minimum of 8GB VRAM for real-time processing at courtroom-scale audio sampling rates (48kHz stereo, 16-channel). CPU-only fallback was tested but produced latency of 340ms average (target: <50ms). The Azure Government Cloud tenant constraints prohibited deployment of the inference container in the standard Government Community Cloud (GCC) tier — the model requires a dedicated compute environment not available under standard subscription terms.',

    -- security_findings
    'Security review has NOT been completed for this effort. Known security considerations include: (1) The AI inference model pipeline has not been evaluated by the AO cybersecurity team or an ISSO — required before any production deployment. (2) RF sensor integration with Azure IoT Hub introduces a network ingress point that requires security assessment under the facility''s network segmentation policy. (3) Audio signal data processed by the model may constitute sensitive court proceeding content — data classification and retention policies must be established before deployment. Courts must conduct their own local security assessment.',

    -- performance_findings
    'CPU-only inference: average 340ms latency (unacceptable for real-time detection; target <50ms). GPU-accelerated inference (NVIDIA A10G): average 18ms latency (within target). Model accuracy in controlled lab: 94.2% detection rate at 0.3% false positive rate. Model accuracy in simulated courtroom acoustic load (ambient HVAC + proceedings audio): 87.1% detection rate at 1.1% false positive rate. Performance degrades measurably in high-reverb environments. No production load testing was conducted.',

    -- default_perspective — executive by default (per PRD design principle; F3)
    'EXECUTIVE',

    -- publication_state — PUBLISHED; triggers "Published ≠ approved for adoption" disclaimer
    'PUBLISHED',

    -- last_reviewed_date
    '2025-06-15',

    -- published_at
    NOW(),

    -- created_by_user_id / updated_by_user_id — seed curator UUID
    'f0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (record_id) DO NOTHING;

-- Key findings (min 1 for publication; 4 required per PRD F4 + RTM TEST-F4-09)
-- Covers: GPU/CPU separation, Azure Gov Cloud constraints, performance/latency, production-readiness gaps
INSERT INTO record_key_findings (finding_id, record_id, finding_text, display_order)
VALUES
    (
        'b0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'GPU/CPU separation is a hard architectural requirement: real-time inference requires dedicated GPU provisioning (NVIDIA A10G or equivalent with CUDA 11.x+). CPU-only processing produced 340ms average latency — 6.8x over the 50ms real-time threshold. Any deployment evaluation must begin with GPU infrastructure procurement.',
        1
    ),
    (
        'b0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000001',
        'Azure Government Cloud constraints block standard deployment: the AI inference container requires a dedicated compute environment not available in standard Government Community Cloud (GCC) subscription tiers. Courts on standard AO Azure Gov subscriptions cannot deploy without a subscription tier change or dedicated inference endpoint provisioning.',
        2
    ),
    (
        'b0000000-0000-0000-0000-000000000003',
        'a0000000-0000-0000-0000-000000000001',
        'Performance and accuracy degrade under realistic courtroom conditions: GPU-accelerated accuracy drops from 94.2% (controlled lab) to 87.1% (simulated courtroom acoustic load) with false positive rate increasing from 0.3% to 1.1%. High-reverb courtroom environments require acoustic calibration and potentially model fine-tuning before reliable operational use.',
        3
    ),
    (
        'b0000000-0000-0000-0000-000000000004',
        'a0000000-0000-0000-0000-000000000001',
        'Three production-readiness gaps must be closed before any deployment: (1) AO cybersecurity/ISSO security review of the AI inference pipeline — not yet conducted; (2) data classification and retention policy for processed audio signals — not yet established; (3) site-specific network segmentation assessment for RF sensor placement — required per facility security policy. None of these gaps can be waived.',
        4
    )
ON CONFLICT (finding_id) DO NOTHING;

-- Artifact link — links to authoritative SharePoint document per F4 design principle
INSERT INTO record_artifact_links (link_id, record_id, label, url, artifact_type, display_order)
VALUES
    (
        'c0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'Audio Security POC Lessons Learned Document — SharePoint',
        'https://ao.sharepoint.com/sites/TSIO-IR/Shared%20Documents/POC-AudioSecurity-LessonsLearned-2025.pdf',
        'DOCUMENT',
        1
    ),
    (
        'c0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000001',
        'Audio Security POC Architecture Diagram — SharePoint',
        'https://ao.sharepoint.com/sites/TSIO-IR/Shared%20Documents/POC-AudioSecurity-ArchDiagram-2025.vsdx',
        'DIAGRAM',
        2
    )
ON CONFLICT (link_id) DO NOTHING;

-- Tags — mission area + technology area (both required for catalog filtering per F0)
INSERT INTO record_tags (tag_id, record_id, tag_type, tag_value, display_order)
VALUES
    (
        'd0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'MISSION_AREA',
        'Courtroom Security',
        1
    ),
    (
        'd0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000001',
        'MISSION_AREA',
        'Physical Security Technology',
        2
    ),
    (
        'd0000000-0000-0000-0000-000000000003',
        'a0000000-0000-0000-0000-000000000001',
        'TECHNOLOGY_AREA',
        'AI/ML — Audio Analysis',
        1
    ),
    (
        'd0000000-0000-0000-0000-000000000004',
        'a0000000-0000-0000-0000-000000000001',
        'TECHNOLOGY_AREA',
        'Azure Government Cloud',
        2
    ),
    (
        'd0000000-0000-0000-0000-000000000005',
        'a0000000-0000-0000-0000-000000000001',
        'TECHNOLOGY_AREA',
        'GPU Computing',
        3
    )
ON CONFLICT (tag_id) DO NOTHING;

-- Engagement options — 3 options per F7 design; REQUEST_TECHNICAL_GUIDANCE prominent per JRN-03.2
INSERT INTO record_engagement_options (option_id, record_id, option_type, display_order)
VALUES
    (
        'e0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'REQUEST_BRIEFING',
        1
    ),
    (
        'e0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000001',
        'REQUEST_TECHNICAL_GUIDANCE',
        2
    ),
    (
        'e0000000-0000-0000-0000-000000000003',
        'a0000000-0000-0000-0000-000000000001',
        'REQUEST_DEMO',
        3
    )
ON CONFLICT (record_id, option_type) DO NOTHING;

-- =============================================================================
-- End: seed_audio_security_poc.sql
-- =============================================================================

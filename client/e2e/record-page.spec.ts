import { test, expect } from '@playwright/test';

// Seeded record ID — set in beforeAll
let publishedRecordId: string;
const NONEXISTENT_ID = '00000000-0000-0000-0000-000000000000';

test.beforeAll(async ({ request }) => {
  // Seed a full PUBLISHED record with all required fields for these tests.
  // The API route /api/v1/test-seed (gated to NODE_ENV=test) accepts:
  //   POST /api/v1/test-seed/published-record → returns { record_id }
  // This endpoint is a test harness only — guarded by NODE_ENV !== 'production'.
  const seedRes = await request.post('/api/v1/test-seed/published-record', {
    data: {
      title: 'Audio Security Proof of Concept',
      problem_statement: 'Courts need reliable audio separation between participants in sensitive proceedings to prevent accidental recording of attorney-client communications and sidebars.',
      what_was_explored: 'Explored GPU/CPU audio separation architecture in Azure Government Cloud using ML-based speaker diarization.',
      outcome_summary: 'The POC demonstrated partial feasibility. GPU-based separation works in controlled conditions but Azure Government Cloud network segmentation constraints prevent production deployment.',
      maturity_level: 'EXPERIMENT_POC',
      review_status: 'CURATED',
      reuse_potential: 'MEDIUM',
      source_type: 'COMMUNITY',
      owner_name: 'I&R Branch',
      owner_office: 'TSIO',
      contributing_office: 'TSIO I&R',
      executive_perspective_text: 'This effort validated that GPU/CPU audio separation is technically feasible but faces meaningful constraints in the Azure Government Cloud environment.',
      executive_recommendation: 'This effort is at Proof of Concept stage and is not recommended for production adoption without additional security review.',
      technical_perspective_text: 'GPU-based audio separation using Python + TensorFlow on Azure GPU VMs. Dependency on premium GPU tiers not available in all Azure Government Cloud regions.',
      security_findings: null,
      performance_findings: 'Latency exceeds acceptable thresholds for real-time proceedings under standard Azure Government Cloud network conditions.',
      reuse_guidance: 'Courts without dedicated GPU infrastructure would require hardware provisioning.',
      key_findings: [
        'GPU/CPU separation architecture is viable for audio isolation',
        'Azure Government Cloud GPU availability is limited',
        'Latency exceeds acceptable thresholds for real-time proceedings',
      ],
      artifact_links: [
        { label: 'Audio Security POC Lessons-Learned Document', url: 'https://sharepoint.ao.dcn/sites/TSIO/AudioSecurityPOC', artifact_type: 'DOCUMENT' },
      ],
      engagement_options: ['REQUEST_BRIEFING', 'REQUEST_DEMO', 'REQUEST_ADOPTION_DISCUSSION', 'REQUEST_TECHNICAL_GUIDANCE'],
      mission_area_tags: ['Cybersecurity', 'Court Operations'],
      technology_area_tags: ['Cloud Infrastructure', 'AI/ML'],
    },
  });
  expect(seedRes.status()).toBe(201);
  const body = await seedRes.json();
  publishedRecordId = body.record_id;
});

test.afterAll(async ({ request }) => {
  if (publishedRecordId) {
    // Clean up seeded record
    await request.delete(`/api/v1/test-seed/records/${publishedRecordId}`);
  }
});

// ─── Breadcrumb ─────────────────────────────────────────────────────────────

test('breadcrumb "← Back to Catalog" links to /catalog', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}`);
  const breadcrumb = page.getByRole('link', { name: /back to catalog/i });
  await expect(breadcrumb).toBeVisible();
  await expect(breadcrumb).toHaveAttribute('href', '/catalog');
});

// ─── Record Header ───────────────────────────────────────────────────────────

test('record header shows title, maturity badge, review status badge, and owner', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}`);
  await expect(page.getByRole('heading', { name: 'Audio Security Proof of Concept' })).toBeVisible();
  await expect(page.locator('.maturity-badge')).toBeVisible();
  await expect(page.locator('.review-status-badge')).toBeVisible();
  // Community badge for COMMUNITY source_type
  await expect(page.locator('.community-badge')).toBeVisible();
  // Owner name — use first() to avoid strict mode violation when footer also shows owner
  await expect(page.getByText(/Owner:.*I&R Branch/).first()).toBeVisible();
});

// ─── Perspective Toggle ───────────────────────────────────────────────────────

test('perspective toggle is visible with both tabs', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}`);
  const tablist = page.getByRole('tablist');
  await expect(tablist).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Executive View' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Technical View' })).toBeVisible();
});

test('default view is Executive; executive sections visible', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}`);
  // Executive View tab is aria-selected
  const execTab = page.getByRole('tab', { name: 'Executive View' });
  await expect(execTab).toHaveAttribute('aria-selected', 'true');
  // Executive content sections visible
  await expect(page.getByText('MISSION PROBLEM')).toBeVisible();
  await expect(page.getByText('EXECUTIVE PERSPECTIVE')).toBeVisible();
  await expect(page.getByText('DECISION RECOMMENDATION')).toBeVisible();
  await expect(page.getByText('OUTCOME SUMMARY')).toBeVisible();
  await expect(page.getByText('KEY FINDINGS')).toBeVisible();
});

test('clicking Technical View tab switches view and updates URL ?view=technical', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}`);
  const techTab = page.getByRole('tab', { name: 'Technical View' });
  await techTab.click();

  // URL updated
  await expect(page).toHaveURL(/view=technical/);
  // Technical View tab now active
  await expect(techTab).toHaveAttribute('aria-selected', 'true');
  // Technical sections visible
  await expect(page.getByText('WHAT WAS EXPLORED')).toBeVisible();
  await expect(page.getByText('TECHNICAL DETAILS')).toBeVisible();
  await expect(page.getByText('SECURITY FINDINGS')).toBeVisible();
});

test('Technical View shows "Security review not completed" warning when security_findings is null', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}?view=technical`);
  await expect(page.getByText(/Security review has NOT been completed/i)).toBeVisible();
});

test('loading /records/{id}?view=technical opens directly in Technical View', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}?view=technical`);
  await expect(page.getByRole('tab', { name: 'Technical View' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('WHAT WAS EXPLORED')).toBeVisible();
});

// ─── Trust Disclaimers ───────────────────────────────────────────────────────

test('trust disclaimers section is visible with "TRUST & LIMITATIONS" heading', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}`);
  await expect(page.getByRole('heading', { name: /TRUST.*LIMITATIONS/i })).toBeVisible();
});

test('trust disclaimers include POC disclaimer for EXPERIMENT_POC maturity', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}`);
  // From TrustDisclaimerService: EXPERIMENT_POC → POC_NOT_PRODUCTION_READY text
  await expect(page.getByText(/proof-of-concept/i)).toBeVisible();
});

test('trust disclaimers include COMMUNITY disclaimer for COMMUNITY source_type', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}`);
  // From TrustDisclaimerService: source_type=COMMUNITY → COMMUNITY_NOT_CENTRALLY_ENDORSED text
  await expect(page.getByText(/team outside I&R/i)).toBeVisible();
});

test('trust disclaimers section appears in both executive and technical views', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}`);
  await expect(page.getByRole('heading', { name: /TRUST.*LIMITATIONS/i })).toBeVisible();
  await page.getByRole('tab', { name: 'Technical View' }).click();
  await expect(page.getByRole('heading', { name: /TRUST.*LIMITATIONS/i })).toBeVisible();
});

// ─── Artifact Links ──────────────────────────────────────────────────────────

test('artifact links section is visible with external link opening in new tab', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}`);
  const artifactLink = page.getByRole('link', { name: /Audio Security POC.*opens in new tab/i });
  await expect(artifactLink).toBeVisible();
  await expect(artifactLink).toHaveAttribute('target', '_blank');
  await expect(artifactLink).toHaveAttribute('rel', /noopener/);
});

// ─── Next-Action Panel ───────────────────────────────────────────────────────

test('next-action panel shows engagement buttons for all 4 configured engagement types', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}`);
  await expect(page.getByRole('button', { name: /Request a Briefing/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Request a Demo/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Request Adoption Discussion/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Request Technical Guidance/i })).toBeVisible();
});

test('next-action panel in executive view shows "View Technical Details" crosslink', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}`);
  await expect(page.getByRole('link', { name: /View Technical Details/i })).toBeVisible();
});

test('next-action panel in technical view shows "View Executive Summary" crosslink', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}?view=technical`);
  await expect(page.getByRole('link', { name: /View Executive Summary/i })).toBeVisible();
});

// ─── 404 Handling ────────────────────────────────────────────────────────────

test('navigating to /records/{nonexistent-id} shows 404 page', async ({ page }) => {
  await page.goto(`/records/${NONEXISTENT_ID}`);
  await expect(page.getByRole('heading', { name: /404/i })).toBeVisible();
  await expect(page.getByText(/The requested record was not found/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /Return to Catalog/i })).toBeVisible();
});

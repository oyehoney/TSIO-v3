# Performance Targets — TSIO Innovation Hub

**Document:** Performance Target Documentation  
**System:** TSIO Innovation Hub  
**Version:** 1.0  
**Date:** 2026-08-02  
**Status:** Targets defined — verification pending post-deployment load test

---

## Overview

This document defines performance targets for the TSIO Innovation Hub and describes the verification methodology. Targets are designed for the expected user population: Judiciary court staff accessing the catalog on an internal network, with peak usage concentrated during business hours (9 AM–5 PM ET).

---

## Target User Load

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Peak concurrent users | 10 | Conservative estimate for initial MVP launch. TSIO Innovation Hub is an internal staff tool — not a public-facing high-traffic application. |
| Sustained concurrent users | 5 | Typical business-hours concurrent load. |
| Expected DAU (daily active users) | 20–50 | Courts across the Judiciary accessing catalog; I&R staff managing records. |
| Request profile | 80% read (catalog browse, record detail); 20% write (engagement requests, submissions) | Read-heavy workload typical of catalog/discovery tools. |

---

## Response Time Targets

All targets measured at the **p95 (95th percentile)** response time under **10 concurrent users** on a production-equivalent infrastructure configuration.

| Endpoint | p95 Target | p99 Target | Notes |
|----------|-----------|-----------|-------|
| `GET /api/catalog` (catalog browse, paginated) | **< 3 seconds** | < 5 seconds | Primary performance KPI. Includes PostgreSQL FTS query + pagination. |
| `GET /api/records/:id` (record detail) | **< 2 seconds** | < 3 seconds | Single record with child table JOIN. |
| `GET /api/catalog?q=...` (full-text search) | **< 3 seconds** | < 5 seconds | FTS via `search_vector @@ plainto_tsquery`. GIN index required. |
| `POST /api/engage` (engagement request) | **< 2 seconds** | < 4 seconds | DB insert + email notification trigger. |
| `POST /api/opportunities` (submit opportunity) | **< 2 seconds** | < 4 seconds | DB insert only. |
| `GET /` (frontend page load — cached assets) | **< 1.5 seconds** | < 3 seconds | Static React bundle served by Nginx; cached at CDN/browser. |
| `GET /` (frontend page load — uncached) | **< 4 seconds** | < 6 seconds | First paint including bundle download. |

**Primary KPI:** `GET /api/catalog` p95 response time < 3 seconds under 10 concurrent users.

---

## Database Performance Requirements

| Requirement | Target | Implementation |
|-------------|--------|---------------|
| Catalog query (PUBLISHED, paginated) | < 500ms at PostgreSQL level | GIN index on `search_vector`; B-tree index on `publication_state`, `maturity_level` |
| FTS search | < 500ms at PostgreSQL level | GIN index `idx_innovation_records_fts` on `search_vector` |
| Record detail fetch | < 100ms at PostgreSQL level | Primary key lookup + indexed FK JOINs |
| Audit log insert | < 50ms | Simple INSERT; no complex joins |

---

## Infrastructure Assumptions for Targets

The above targets assume:

1. **Hosting:** AO Azure Government Cloud — general purpose VM tier (B2s or equivalent; 2 vCPU, 4 GB RAM minimum for API + DB co-location; 4 vCPU, 8 GB RAM for production)
2. **Database:** PostgreSQL 16 with all migrations applied and GIN indexes active
3. **Network:** Internal AO network (not public internet) — low latency between client and server (<10ms RTT on intranet)
4. **Data volume:** ≤ 500 innovation records (MVP scale). Targets may require re-evaluation at > 1,000 records.
5. **Connection pooling:** pg connection pool configured (min: 2, max: 10)

---

## Verification Methodology

**Status: To be verified post-deployment**

Performance targets will be verified using the following methodology after deployment to a production-equivalent staging environment:

### Load Test Tool
```
k6 (Grafana k6) — open source load testing tool
  OR
artillery (Node.js-native load testing)
```

### Test Scenario (to be executed post-deployment)
```javascript
// k6 test scenario — 10 concurrent users, 5-minute sustained run
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,           // 10 virtual users (concurrent)
  duration: '5m',    // 5 minute sustained run
  thresholds: {
    'http_req_duration{endpoint:catalog}': ['p(95)<3000'],   // p95 < 3s
    'http_req_duration{endpoint:record}':  ['p(95)<2000'],   // p95 < 2s
    'http_req_duration{endpoint:search}':  ['p(95)<3000'],   // p95 < 3s
    'http_req_failed': ['rate<0.01'],                         // < 1% error rate
  },
};

export default function () {
  // Catalog browse
  const catalogRes = http.get(`${BASE_URL}/api/catalog`, {
    tags: { endpoint: 'catalog' },
  });
  check(catalogRes, { 'catalog 200': (r) => r.status === 200 });
  sleep(1);

  // Record detail
  const recordRes = http.get(`${BASE_URL}/api/records/${ANCHOR_UUID}`, {
    tags: { endpoint: 'record' },
  });
  check(recordRes, { 'record 200': (r) => r.status === 200 });
  sleep(1);

  // FTS search
  const searchRes = http.get(`${BASE_URL}/api/catalog?q=audio+security`, {
    tags: { endpoint: 'search' },
  });
  check(searchRes, { 'search 200': (r) => r.status === 200 });
  sleep(2);
}
```

### Acceptance Criteria for Performance Verification

| Check | Pass Condition |
|-------|---------------|
| Catalog browse p95 | < 3,000 ms |
| Record detail p95 | < 2,000 ms |
| FTS search p95 | < 3,000 ms |
| HTTP error rate | < 1% across all endpoints |
| No database connection errors | 0 connection pool exhaustion events |

---

## Performance Risks

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| FTS slow on large text fields | Low (MVP scale ≤ 500 records) | GIN index `idx_innovation_records_fts` handles FTS at scale |
| Connection pool exhaustion under burst | Low at 10 concurrent users | pg pool max: 10; alert threshold: 80% utilization |
| Slow first paint (large JS bundle) | Medium | Code splitting via React lazy/Suspense; Nginx gzip compression |
| Engagement email latency adding to API response time | Low | Email dispatch is fire-and-forget (async) — does not block API response |
| DB cold start on container restart | Low | DB healthcheck in docker-compose ensures readiness before API accepts traffic |

---

## Performance Monitoring (Post-Deployment)

After deployment, performance should be monitored via:

- **Azure Monitor / Application Insights** — response time percentiles, error rates, dependency tracking (DB query duration)
- **PostgreSQL `pg_stat_statements`** — slow query identification
- **Nginx access logs** — request rate and response time distribution

Alert thresholds (to be configured):
- API p95 > 5 seconds → Warning alert
- API p99 > 10 seconds → Critical alert
- DB query duration > 1 second → Warning alert
- HTTP 5xx error rate > 1% → Critical alert

---

## Current Verification Status

| Verification Step | Status |
|------------------|--------|
| Unit/integration tests passing | Verified (seed-records.test.js, migration_boot.test.js) |
| Database indexes confirmed | Verified (GIN index on search_vector, migration 001) |
| Load test against production-equivalent environment | **PENDING — post-deployment** |
| p95 < 3s under 10 concurrent users confirmed | **PENDING — post-deployment** |

---

*Last updated: 2026-08-02 | Owner: TSIO I&R Branch | Performance verification: pending deployment to staging*

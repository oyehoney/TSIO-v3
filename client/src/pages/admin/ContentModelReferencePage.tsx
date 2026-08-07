// src/pages/admin/ContentModelReferencePage.tsx
// Admin page: Content Model Reference — US-8.3 (F9)
// Route: /admin/content-model
// READ-ONLY — displays maturity level and review status definitions
// Falls back to hard-coded constants if API returns 501 or any error.
// Per Screen-12 mockup: "Definitions require a code change"

import React, { useEffect, useState } from 'react';

// ── Hard-coded canonical values (F9 compile-time constants) ───────────────────
// These are the system's canonical definitions. If API returns 501, we fall back to these.
// Risk accepted per T-16-06: static data drifts only with code changes (documented behavior).

const MATURITY_LEVELS_DEFAULT = [
  {
    value: 'IDEA',
    label: 'Idea',
    color: '#6B7280',
    colorLabel: 'Gray',
    definition: 'A problem or opportunity has been identified; no technical exploration has been conducted yet.',
  },
  {
    value: 'EXPERIMENT_POC',
    label: 'Experiment / POC',
    color: '#D97706',
    colorLabel: 'Amber',
    definition: 'A targeted exploration was conducted to test feasibility; results may be positive, negative, or inconclusive.',
  },
  {
    value: 'PROTOTYPE_PILOT',
    label: 'Prototype / Pilot',
    color: '#EA580C',
    colorLabel: 'Orange',
    definition: 'A working model or limited deployment was built and tested in a realistic environment.',
  },
  {
    value: 'PRODUCTION_VALIDATED',
    label: 'Production / Validated Pattern',
    color: '#16A34A',
    colorLabel: 'Green',
    definition: 'Fully deployed and operational; or proven architectural pattern validated across multiple use cases.',
  },
  {
    value: 'ARCHIVED',
    label: 'Archived',
    color: '#374151',
    colorLabel: 'Dark Gray',
    definition: 'Work is no longer actively maintained; captured for institutional learning. Not recommended for adoption without re-evaluation.',
  },
];

const REVIEW_STATUSES_DEFAULT = [
  {
    value: 'SUBMITTED',
    label: 'Submitted',
    definition: 'Record is in the system; not yet curated or reviewed.',
  },
  {
    value: 'CURATED',
    label: 'Curated',
    definition: 'I&R curator has structured and enriched the record; it has not yet received external review.',
  },
  {
    value: 'TECHNICALLY_REVIEWED',
    label: 'Technically Reviewed',
    definition: 'I&R or AO technical team has assessed the technical approach and findings for accuracy.',
  },
  {
    value: 'SECURITY_REVIEWED',
    label: 'Security Reviewed',
    definition: 'Cybersecurity or ISSO review has been completed for this record.',
  },
  {
    value: 'POLICY_REVIEWED',
    label: 'Policy Reviewed',
    definition: 'Legal, privacy, or policy review has been completed.',
  },
  {
    value: 'VALIDATED_FOR_REUSE',
    label: 'Validated for Reuse',
    definition: 'All applicable I&R reviews have been completed. This status does not waive local security, policy, or operational review requirements before adoption.',
  },
  {
    value: 'SUPERSEDED_RETIRED',
    label: 'Superseded / Retired',
    definition: 'This record has been replaced by a newer record or retired; retained for institutional history.',
  },
];

// ── Types ──────────────────────────────────────────────────────────────────────

interface MaturityLevel {
  value: string;
  label: string;
  color: string;
  colorLabel: string;
  definition: string;
}

interface ReviewStatus {
  value: string;
  label: string;
  definition: string;
}

// ── API fetch with graceful fallback ──────────────────────────────────────────

async function tryFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) return null; // 501, 404, etc. → fall back to hard-coded
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

// ── Main page component ────────────────────────────────────────────────────────

export function ContentModelReferencePage() {
  const [maturityLevels, setMaturityLevels] = useState<MaturityLevel[]>(MATURITY_LEVELS_DEFAULT);
  const [reviewStatuses, setReviewStatuses] = useState<ReviewStatus[]>(REVIEW_STATUSES_DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      // Call both endpoints in parallel; fall back to hard-coded constants on 501 or error
      const [maturityResult, reviewResult] = await Promise.all([
        tryFetch<{ data: MaturityLevel[] }>('/api/v1/admin/maturity-reference'),
        tryFetch<{ data: ReviewStatus[] }>('/api/v1/admin/review-status-reference'),
      ]);

      if (maturityResult?.data && maturityResult.data.length > 0) {
        setMaturityLevels(maturityResult.data);
      }
      if (reviewResult?.data && reviewResult.data.length > 0) {
        setReviewStatuses(reviewResult.data);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading reference data…</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Content Model Reference</h1>
      </div>
      <p className="text-sm text-gray-500 mb-8 bg-amber-50 border border-amber-200 rounded px-4 py-2 inline-block">
        🔒 This reference is read-only. Definitions require a code change.
      </p>

      {/* Maturity Levels table */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Maturity Levels</h2>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Level</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Color</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Definition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {maturityLevels.map((m, i) => (
                <tr key={m.value} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 text-center">
                    {/* ARCHIVED (last) uses em dash per Screen-12 spec */}
                    {m.value === 'ARCHIVED' ? '—' : i + 1}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: m.color }}
                    >
                      <span aria-hidden="true">●</span>
                      {m.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{m.colorLabel}</td>
                  <td className="px-4 py-3 text-gray-700 leading-relaxed">{m.definition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Review Statuses table */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Review Statuses</h2>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-52">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Meaning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reviewStatuses.map(s => (
                <tr key={s.value} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <strong className="font-semibold text-gray-800">{s.label}</strong>
                    <span className="block text-xs text-gray-400 mt-0.5 font-mono">{s.value}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 leading-relaxed">{s.definition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default ContentModelReferencePage;

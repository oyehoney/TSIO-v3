/**
 * DashboardPage.tsx — Admin dashboard at /admin.
 *
 * Fetches GET /api/v1/admin/dashboard-summary and renders 5 summary tiles.
 * Per UX-Mockup Screen 06.
 *
 * Tiles:
 *   1. Published Records → total_published_records → /admin/records?state=published
 *   2. Draft / In Review → draft_review_records → /admin/records?state=draft,review
 *   3. Opportunity Submissions → pending_opportunity_submissions → /admin/submissions/opportunities
 *   4. Contribution Submissions → pending_contribution_submissions → /admin/submissions/contributions
 *   5. Recent Engagements (7d) → recent_engagement_requests_7d → /admin/engagement
 *
 * Graceful handling: 501 stub (Wave 3a) shows "0" counts without error.
 *
 * F8: Curation and Administration — DashboardPage with 5 summary tiles
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApiClient, DashboardSummary } from '../api/adminApiClient';

interface SummaryTileProps {
  label: string;
  value: number | null;
  loading: boolean;
  linkTo: string;
  color: string;
  icon: string;
  description?: string;
}

const SummaryTile: React.FC<SummaryTileProps> = ({
  label,
  value,
  loading,
  linkTo,
  color,
  icon,
  description,
}) => (
  <Link
    to={linkTo}
    style={{
      display: 'block',
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '10px',
      padding: '24px',
      textDecoration: 'none',
      transition: 'box-shadow 0.15s, border-color 0.15s',
      cursor: 'pointer',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
      (e.currentTarget as HTMLElement).style.borderColor = color;
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB';
    }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
      <div style={{ fontSize: '2rem' }}>{icon}</div>
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: color,
          marginTop: '8px',
        }}
      />
    </div>
    {loading ? (
      <div
        style={{
          height: '36px',
          width: '60px',
          backgroundColor: '#F3F4F6',
          borderRadius: '4px',
          animation: 'pulse 1.5s ease-in-out infinite',
          marginBottom: '8px',
        }}
      />
    ) : (
      <div
        style={{
          fontSize: '2.25rem',
          fontWeight: 800,
          color: color,
          lineHeight: 1,
          marginBottom: '8px',
        }}
      >
        {value ?? 0}
      </div>
    )}
    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>{label}</div>
    {description && (
      <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '4px' }}>{description}</div>
    )}
  </Link>
);

interface QuickActionProps {
  label: string;
  to: string;
  primary?: boolean;
}

const QuickAction: React.FC<QuickActionProps> = ({ label, to, primary = false }) => (
  <Link
    to={to}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '10px 20px',
      borderRadius: '6px',
      fontSize: '0.875rem',
      fontWeight: 600,
      textDecoration: 'none',
      backgroundColor: primary ? '#1D4ED8' : '#FFFFFF',
      color: primary ? '#FFFFFF' : '#1D4ED8',
      border: primary ? 'none' : '1px solid #BFDBFE',
      transition: 'background-color 0.15s',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLElement).style.backgroundColor = primary ? '#1E40AF' : '#EFF6FF';
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLElement).style.backgroundColor = primary ? '#1D4ED8' : '#FFFFFF';
    }}
  >
    {label}
  </Link>
);

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Dashboard — Administration — TSIO Innovation Hub';
    adminApiClient.getDashboardSummary()
      .then(data => {
        setSummary(data);
        setError(null);
      })
      .catch((err: Error & { status?: number }) => {
        // 501 stub from Wave 3a — show zero counts gracefully
        if (err.status === 501) {
          setSummary({
            total_published_records: 0,
            draft_review_records: 0,
            pending_opportunity_submissions: 0,
            pending_contribution_submissions: 0,
            recent_engagement_requests_7d: 0,
          });
        } else {
          setError('Dashboard data unavailable.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    adminApiClient.getDashboardSummary()
      .then(data => setSummary(data))
      .catch((err: Error & { status?: number }) => {
        if (err.status === 501) {
          setSummary({
            total_published_records: 0,
            draft_review_records: 0,
            pending_opportunity_submissions: 0,
            pending_contribution_submissions: 0,
            recent_engagement_requests_7d: 0,
          });
        } else {
          setError('Dashboard data unavailable.');
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
          Dashboard
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0 }}>
          TSIO Innovation Hub — Administration Overview
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ color: '#991B1B', fontSize: '0.875rem' }}>{error}</span>
          <button
            onClick={handleRetry}
            style={{
              padding: '6px 16px',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary tiles grid — 5 tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '40px',
        }}
      >
        <SummaryTile
          label="Published Records"
          value={summary?.total_published_records ?? null}
          loading={loading && !error}
          linkTo="/admin/records?state=published"
          color="#16A34A"
          icon="📋"
          description="Live in public catalog"
        />
        <SummaryTile
          label="Draft / In Review"
          value={summary?.draft_review_records ?? null}
          loading={loading && !error}
          linkTo="/admin/records?state=draft,review"
          color="#D97706"
          icon="✏️"
          description="Awaiting curation or review"
        />
        <SummaryTile
          label="Opportunity Submissions"
          value={summary?.pending_opportunity_submissions ?? null}
          loading={loading && !error}
          linkTo="/admin/submissions/opportunities"
          color="#7C3AED"
          icon="🎯"
          description="Pending review"
        />
        <SummaryTile
          label="Contribution Submissions"
          value={summary?.pending_contribution_submissions ?? null}
          loading={loading && !error}
          linkTo="/admin/submissions/contributions"
          color="#0369A1"
          icon="📤"
          description="Pending curation"
        />
        <SummaryTile
          label="Recent Engagements (7d)"
          value={summary?.recent_engagement_requests_7d ?? null}
          loading={loading && !error}
          linkTo="/admin/engagement"
          color="#B45309"
          icon="🤝"
          description="New requests this week"
        />
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#374151', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <QuickAction label="+ New Innovation Record" to="/admin/records/new" primary />
          <QuickAction label="Review Opportunity Submissions" to="/admin/submissions/opportunities" />
          <QuickAction label="Review Contribution Submissions" to="/admin/submissions/contributions" />
          <QuickAction label="View Engagement Activity" to="/admin/engagement" />
        </div>
      </div>

      {/* Info note about stubs */}
      {summary && Object.values(summary).every(v => v === 0) && (
        <div
          style={{
            backgroundColor: '#F0F9FF',
            border: '1px solid #BAE6FD',
            borderRadius: '8px',
            padding: '12px 16px',
          }}
        >
          <p style={{ color: '#0369A1', fontSize: '0.8rem', margin: 0 }}>
            Dashboard counts show 0 — the data service endpoints are being implemented.
            Create records using the "+ New Innovation Record" button above.
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

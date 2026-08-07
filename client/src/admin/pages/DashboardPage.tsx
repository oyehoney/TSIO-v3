// DashboardPage.tsx — Admin dashboard at /admin
// 5 summary tiles from GET /api/v1/admin/dashboard-summary + Quick Actions
// Per UX-Mockup Screen 06

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApiClient, DashboardSummary } from '../api/adminApiClient';

interface SummaryTileProps {
  label: string;
  value: number | string;
  linkTo: string;
  color?: string;
  loading?: boolean;
}

function SummaryTile({ label, value, linkTo, color = '#1E40AF', loading = false }: SummaryTileProps) {
  return (
    <Link
      to={linkTo}
      style={{
        display: 'block',
        backgroundColor: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: '10px',
        padding: '20px 24px',
        textDecoration: 'none',
        transition: 'box-shadow 0.15s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div
        style={{
          fontSize: '36px',
          fontWeight: 700,
          color: loading ? '#D1D5DB' : color,
          lineHeight: 1.1,
          marginBottom: '6px',
        }}
      >
        {loading ? '—' : value}
      </div>
      <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>{label}</div>
    </Link>
  );
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = () => {
    setLoading(true);
    setError(null);
    adminApiClient
      .getDashboardSummary()
      .then(data => {
        setSummary(data);
        setLoading(false);
      })
      .catch(err => {
        // Gracefully handle 501 (not yet implemented) and other errors
        if (err?.status === 501 || err?.code === 'NOT_IMPLEMENTED') {
          // Show zeros for stub endpoints
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
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboard();
    document.title = 'Admin Dashboard — TSIO Innovation Hub';
  }, []);

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
          Innovation records and activity at a glance.
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#991B1B',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{error}</span>
          <button
            onClick={fetchDashboard}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #FECACA',
              borderRadius: '6px',
              padding: '4px 12px',
              color: '#991B1B',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* 5 Summary tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <SummaryTile
          label="Published Records"
          value={summary?.total_published_records ?? 0}
          linkTo="/admin/records?state=published"
          color="#166534"
          loading={loading}
        />
        <SummaryTile
          label="Draft / In Review"
          value={summary?.draft_review_records ?? 0}
          linkTo="/admin/records?state=draft,review"
          color="#1E40AF"
          loading={loading}
        />
        <SummaryTile
          label="Opportunity Submissions"
          value={summary?.pending_opportunity_submissions ?? 0}
          linkTo="/admin/submissions/opportunities"
          color="#D97706"
          loading={loading}
        />
        <SummaryTile
          label="Contribution Submissions"
          value={summary?.pending_contribution_submissions ?? 0}
          linkTo="/admin/submissions/contributions"
          color="#EA580C"
          loading={loading}
        />
        <SummaryTile
          label="Recent Engagements (7d)"
          value={summary?.recent_engagement_requests_7d ?? 0}
          linkTo="/admin/engagement"
          color="#7C3AED"
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link
            to="/admin/records/new"
            style={{
              padding: '10px 18px',
              backgroundColor: '#1E40AF',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            + New Innovation Record
          </Link>
          <Link
            to="/admin/submissions/opportunities"
            style={{
              padding: '10px 18px',
              backgroundColor: 'white',
              color: '#374151',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Review Opportunity Submissions
          </Link>
          <Link
            to="/admin/submissions/contributions"
            style={{
              padding: '10px 18px',
              backgroundColor: 'white',
              color: '#374151',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Review Contribution Submissions
          </Link>
          <Link
            to="/admin/engagement"
            style={{
              padding: '10px 18px',
              backgroundColor: 'white',
              color: '#374151',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            View Engagement Activity
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * AdminApp.tsx — Admin React app root with React Router routes for all /admin/* paths.
 *
 * Structure:
 *   /admin/login             → <AdminLoginPage /> (no auth required)
 *   /admin                   → <AdminShell><DashboardPage /></AdminShell> (auth required)
 *   /admin/records           → <AdminShell><RecordsListPage /></AdminShell> (auth required)
 *   /admin/records/new       → <AdminShell><RecordEditPage /></AdminShell> (auth required)
 *   /admin/records/:id/edit  → <AdminShell><RecordEditPage /></AdminShell> (auth required)
 *   /admin/records/:id/audit → <AdminShell><AuditHistoryPlaceholder /></AdminShell>
 *   /admin/submissions/opportunities → <AdminShell><SubmissionsPlaceholder /></AdminShell>
 *   /admin/submissions/contributions → <AdminShell><ContributionsPlaceholder /></AdminShell>
 *   /admin/engagement        → <AdminShell><EngagementPlaceholder /></AdminShell>
 *   /admin/settings          → <AdminShell><SettingsPlaceholder /></AdminShell>
 *   /admin/content-model     → <AdminShell><ContentModelPlaceholder /></AdminShell>
 *
 * ProtectedRoute: calls useAdminAuth() — redirects to /admin/login on 401/403.
 * Wave 6c placeholder pages render actual JSX divs (not null/empty).
 *
 * F8: Curation and Administration — admin SPA root
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminShell } from './AdminShell';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { RecordsListPage } from './pages/RecordsListPage';
import { RecordEditPage } from './pages/RecordEditPage';
import { useAdminAuth } from './hooks/useAdminAuth';

/**
 * ProtectedRoute — auth guard wrapper.
 * Shows loading spinner while checking, redirects to /admin/login on failure.
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { checking, authenticated } = useAdminAuth();

  if (checking) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F9FAFB',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #E5E7EB',
              borderTopColor: '#1D4ED8',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Checking authentication…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    // useAdminAuth already redirected to /admin/login on failure
    // This is a fallback render while redirect is in progress
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

// Wave 6c placeholder pages — must render actual JSX divs
const AuditHistoryPage: React.FC = () => (
  <div style={{ padding: '24px' }}>
    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
      Audit History
    </h1>
    <p style={{ color: '#6B7280' }}>Audit history feature coming in Wave 6b.</p>
  </div>
);

const OpportunitySubmissionsPage: React.FC = () => (
  <div style={{ padding: '24px' }}>
    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
      Opportunity Submissions
    </h1>
    <p style={{ color: '#6B7280' }}>Opportunity submissions management coming in Wave 6c.</p>
  </div>
);

const ContributionSubmissionsPage: React.FC = () => (
  <div style={{ padding: '24px' }}>
    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
      Contribution Submissions
    </h1>
    <p style={{ color: '#6B7280' }}>Contribution submissions management coming in Wave 6c.</p>
  </div>
);

const EngagementActivityPage: React.FC = () => (
  <div style={{ padding: '24px' }}>
    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
      Engagement Activity Log
    </h1>
    <p style={{ color: '#6B7280' }}>Engagement activity log coming in Wave 6c.</p>
  </div>
);

const HubSettingsPage: React.FC = () => (
  <div style={{ padding: '24px' }}>
    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
      Hub Settings
    </h1>
    <p style={{ color: '#6B7280' }}>Hub settings management coming in Wave 6c.</p>
  </div>
);

const ContentModelPage: React.FC = () => (
  <div style={{ padding: '24px' }}>
    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
      Content Model Reference
    </h1>
    <p style={{ color: '#6B7280', marginBottom: '24px' }}>
      Reference documentation for maturity levels and review statuses.
    </p>

    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
      Maturity Levels
    </h2>
    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
      <li style={{ padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
        <strong>IDEA</strong> — A problem or opportunity has been identified and captured; no technical exploration yet.
      </li>
      <li style={{ padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
        <strong>EXPERIMENT / POC</strong> — A targeted exploration was conducted to test feasibility; results may be positive, negative, or inconclusive.
      </li>
      <li style={{ padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
        <strong>PROTOTYPE / PILOT</strong> — A working model or limited deployment was built; tested in a realistic environment.
      </li>
      <li style={{ padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
        <strong>PRODUCTION / VALIDATED</strong> — Fully deployed and operational; or a proven architectural pattern validated through review.
      </li>
      <li style={{ padding: '8px 0' }}>
        <strong>ARCHIVED</strong> — Work is no longer active; captured for institutional learning; not recommended for adoption.
      </li>
    </ul>

    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
      Review Statuses
    </h2>
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      <li style={{ padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
        <strong>SUBMITTED</strong> — Record is in the system; not yet curated.
      </li>
      <li style={{ padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
        <strong>CURATED</strong> — I&amp;R curator has structured and enriched the record; not yet externally reviewed.
      </li>
      <li style={{ padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
        <strong>TECHNICALLY_REVIEWED</strong> — I&amp;R or AO technical team has assessed architecture and findings.
      </li>
      <li style={{ padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
        <strong>SECURITY_REVIEWED</strong> — Cybersecurity or ISSO review of security implications completed.
      </li>
      <li style={{ padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
        <strong>POLICY_REVIEWED</strong> — Legal, privacy, or policy review completed.
      </li>
      <li style={{ padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
        <strong>VALIDATED_FOR_REUSE</strong> — All applicable reviews completed; recommended as a reuse-ready pattern.
      </li>
      <li style={{ padding: '8px 0' }}>
        <strong>SUPERSEDED_RETIRED</strong> — Record replaced by a newer version or retired; retained for institutional record.
      </li>
    </ul>
  </div>
);

export const AdminApp: React.FC = () => (
  <BrowserRouter>
    <Routes>
      {/* Unauthenticated route */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Authenticated routes — wrapped in AdminShell with ProtectedRoute guard */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminShell />
          </ProtectedRoute>
        }
      >
        {/* Dashboard (index) */}
        <Route index element={<DashboardPage />} />

        {/* Records */}
        <Route path="records" element={<RecordsListPage />} />
        <Route path="records/new" element={<RecordEditPage />} />
        <Route path="records/:id/edit" element={<RecordEditPage />} />
        <Route path="records/:id/audit" element={<AuditHistoryPage />} />

        {/* Submissions (Wave 6c placeholders) */}
        <Route path="submissions/opportunities" element={<OpportunitySubmissionsPage />} />
        <Route path="submissions/contributions" element={<ContributionSubmissionsPage />} />

        {/* Engagement (Wave 6c placeholder) */}
        <Route path="engagement" element={<EngagementActivityPage />} />

        {/* Settings (Wave 6c placeholder) */}
        <Route path="settings" element={<HubSettingsPage />} />

        {/* Content Model reference */}
        <Route path="content-model" element={<ContentModelPage />} />
      </Route>

      {/* Redirect /admin/* 404s back to /admin */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AdminApp;

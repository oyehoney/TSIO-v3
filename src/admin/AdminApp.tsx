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
 *   /admin/submissions/opportunities → <AdminShell><OpportunitySubmissionsPage /></AdminShell>
 *   /admin/submissions/contributions → <AdminShell><ContributionSubmissionsPage /></AdminShell>
 *   /admin/engagement        → <AdminShell><EngagementActivityPage /></AdminShell>
 *   /admin/settings          → <AdminShell><SettingsPage /></AdminShell>
 *   /admin/content-model     → <AdminShell><ContentModelReferencePage /></AdminShell>
 *
 * ProtectedRoute: calls useAdminAuth() — redirects to /admin/login on 401/403.
 * Wave 6c: all placeholder pages replaced with full implementations.
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
import { OpportunitySubmissionsPage } from './pages/submissions/OpportunitySubmissionsPage';
import { ContributionSubmissionsPage } from './pages/submissions/ContributionSubmissionsPage';
import { EngagementActivityPage } from './pages/EngagementActivityPage';
import { SettingsPage } from './pages/SettingsPage';
import { ContentModelReferencePage } from './pages/ContentModelReferencePage';

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

// Audit History placeholder (Wave 6b — not yet implemented)
const AuditHistoryPage: React.FC = () => (
  <div style={{ padding: '24px' }}>
    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
      Audit History
    </h1>
    <p style={{ color: '#6B7280' }}>Audit history feature coming in Wave 6b.</p>
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

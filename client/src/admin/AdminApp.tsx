// AdminApp.tsx — Root React component for admin interface.
// Sets up React Router with all admin routes.
// Unauthenticated routes redirect via ProtectedRoute which calls useAdminAuth().

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminShell } from './AdminShell';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { RecordsListPage } from './pages/RecordsListPage';
import { RecordEditPage } from './pages/RecordEditPage';
import { useAdminAuth } from './hooks/useAdminAuth';
// Wave 6c admin supporting pages — Plan 16 (all 5 admin supporting pages)
import { OpportunitySubmissionsPage } from '../pages/admin/submissions/OpportunitySubmissionsPage';
import { ContributionSubmissionsPage } from '../pages/admin/submissions/ContributionSubmissionsPage';
import { EngagementActivityPage } from '../pages/admin/EngagementActivityPage';
import { SettingsPage } from '../pages/admin/SettingsPage';
import { ContentModelReferencePage } from '../pages/admin/ContentModelReferencePage';

// ProtectedRoute — wraps authenticated admin routes.
// Shows loading spinner while checking auth; redirects to /admin/login on failure.
function ProtectedRoute({ children }: { children: React.ReactNode }) {
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
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid #E5E7EB',
              borderTop: '3px solid #1E40AF',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          <div style={{ fontSize: '14px', color: '#6B7280' }}>Verifying session…</div>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    // useAdminAuth already redirected to /admin/login via window.location
    return null;
  }

  return <>{children}</>;
}

// Wave 6c placeholder pages — actual JSX divs (not empty/null) so nav works
function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
        {title}
      </h1>
      <p style={{ fontSize: '14px', color: '#6B7280' }}>{description}</p>
      <div
        style={{
          marginTop: '24px',
          padding: '20px',
          backgroundColor: '#F3F4F6',
          borderRadius: '8px',
          border: '1px dashed #D1D5DB',
        }}
      >
        <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
          This section will be implemented in Wave 6c.
        </p>
      </div>
    </div>
  );
}

export function AdminApp() {
  // NOTE: This component is mounted under /admin/* in App.tsx.
  // React Router v6 nested Routes match against the remaining path after /admin.
  // So "login" matches /admin/login, "" matches /admin (index), "records" matches /admin/records, etc.
  return (
    <Routes>
      {/* /admin/login — no auth required */}
      <Route path="login" element={<AdminLoginPage />} />

      {/* All authenticated admin routes wrapped in ProtectedRoute + AdminShell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminShell />
          </ProtectedRoute>
        }
      >
        {/* /admin (index) → DashboardPage */}
        <Route index element={<DashboardPage />} />

        {/* /admin/records → RecordsListPage */}
        <Route path="records" element={<RecordsListPage />} />

        {/* /admin/records/new → RecordEditPage (new) */}
        <Route path="records/new" element={<RecordEditPage />} />

        {/* /admin/records/:id/edit → RecordEditPage (edit) */}
        <Route path="records/:id/edit" element={<RecordEditPage />} />

        {/* /admin/records/:id/audit → Audit History (placeholder) */}
        <Route
          path="records/:id/audit"
          element={
            <PlaceholderPage
              title="Audit History"
              description="View record change history and state transitions."
            />
          }
        />

        {/* /admin/submissions/opportunities → OpportunitySubmissionsPage (Plan 16, Wave 6c) */}
        <Route path="submissions/opportunities" element={<OpportunitySubmissionsPage />} />

        {/* /admin/submissions/contributions → ContributionSubmissionsPage (Plan 16, Wave 6c) */}
        <Route path="submissions/contributions" element={<ContributionSubmissionsPage />} />

        {/* /admin/engagement → EngagementActivityPage (Plan 16 Task 2, Wave 6c) */}
        <Route path="engagement" element={<EngagementActivityPage />} />

        {/* /admin/settings → SettingsPage (Plan 16 Task 2, Wave 6c) */}
        <Route path="settings" element={<SettingsPage />} />

        {/* /admin/content-model → ContentModelReferencePage (Plan 16 Task 2, Wave 6c) */}
        <Route path="content-model" element={<ContentModelReferencePage />} />

        {/* Fallback for unknown admin routes */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}

export default AdminApp;

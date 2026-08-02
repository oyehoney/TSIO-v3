/**
 * AdminShell.tsx — Layout shell wrapping authenticated admin pages.
 *
 * Renders AdminSidebar on left + main content on right via React Router <Outlet>.
 * Fetches dashboard summary to provide pending counts to sidebar badge display.
 * Persistent across all /admin/* child routes.
 *
 * F8: Curation and Administration — admin layout shell
 */

import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './components/AdminSidebar';
import { adminApiClient, DashboardSummary } from './api/adminApiClient';

export const AdminShell: React.FC = () => {
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    // Fetch summary for sidebar pending badges — ignore errors (non-critical for shell)
    adminApiClient.getDashboardSummary()
      .then(data => setDashboardSummary(data))
      .catch(() => {
        // Silently ignore — sidebar still renders without counts
      });
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <AdminSidebar
        pendingOpportunities={dashboardSummary?.pending_opportunity_submissions ?? 0}
        pendingContributions={dashboardSummary?.pending_contribution_submissions ?? 0}
      />
      <main style={{ flex: 1, padding: '32px', minWidth: 0, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminShell;

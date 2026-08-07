// AdminShell.tsx — Layout shell wrapping authenticated admin pages.
// Renders AdminSidebar on left, main content area (Outlet) on right.
// Passes pending counts from dashboard to sidebar for badge display.

import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './components/AdminSidebar';
import { adminApiClient, DashboardSummary } from './api/adminApiClient';

export function AdminShell() {
  const [summary, setSummary] = useState<Pick<DashboardSummary, 'pending_opportunity_submissions' | 'pending_contribution_submissions'> | null>(null);

  useEffect(() => {
    // Fetch summary to get pending counts for sidebar badges
    adminApiClient
      .getDashboardSummary()
      .then(data => {
        setSummary({
          pending_opportunity_submissions: data.pending_opportunity_submissions,
          pending_contribution_submissions: data.pending_contribution_submissions,
        });
      })
      .catch(() => {
        // Non-critical — sidebar badges will just show 0
        setSummary({ pending_opportunity_submissions: 0, pending_contribution_submissions: 0 });
      });
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        backgroundColor: '#F9FAFB',
      }}
    >
      <AdminSidebar
        pendingOpportunities={summary?.pending_opportunity_submissions ?? 0}
        pendingContributions={summary?.pending_contribution_submissions ?? 0}
      />
      <main
        style={{
          flex: 1,
          padding: '24px 32px',
          overflowX: 'auto',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}

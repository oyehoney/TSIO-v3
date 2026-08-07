// src/components/admin/AdminLayout.tsx
// Admin sidebar layout — wires all 5 admin supporting pages into nav
// Used for: /admin/* routes (CURATOR-only)
// Note: Uses React Router v6 NavLink for active route highlighting

import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

// ── Badge count types ──────────────────────────────────────────────────────────

interface DashboardSummary {
  pending_opportunity_submissions?: number;
  pending_contribution_submissions?: number;
}

// ── Nav badge component ────────────────────────────────────────────────────────

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto bg-indigo-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center leading-tight">
      {count > 99 ? '99+' : count}
    </span>
  );
}

// ── Nav section header ─────────────────────────────────────────────────────────

function NavSection({ label }: { label: string }) {
  return (
    <div className="px-3 pt-4 pb-1">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}

// ── Nav link component ─────────────────────────────────────────────────────────

interface NavItemProps {
  to: string;
  label: string;
  badge?: number;
  end?: boolean;
}

function NavItem({ to, label, badge = 0, end = false }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
          isActive
            ? 'bg-indigo-50 text-indigo-700 font-semibold'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
      aria-current={undefined}
    >
      <span className="flex-1">{label}</span>
      <NavBadge count={badge} />
    </NavLink>
  );
}

// ── AdminLayout component ──────────────────────────────────────────────────────

export function AdminLayout() {
  const [summary, setSummary] = useState<DashboardSummary>({
    pending_opportunity_submissions: 0,
    pending_contribution_submissions: 0,
  });

  useEffect(() => {
    // Fetch badge counts from dashboard-summary; gracefully handle 501 (stub not yet implemented)
    void (async () => {
      try {
        const res = await fetch('/api/v1/admin/dashboard-summary', { credentials: 'same-origin' });
        if (res.ok) {
          const data = (await res.json()) as { data?: DashboardSummary } | DashboardSummary;
          const summaryData = 'data' in data && data.data ? data.data : data as DashboardSummary;
          setSummary({
            pending_opportunity_submissions: summaryData.pending_opportunity_submissions ?? 0,
            pending_contribution_submissions: summaryData.pending_contribution_submissions ?? 0,
          });
        }
        // 501 Not Implemented: silently render 0 — no error
      } catch {
        // Network error: silently render 0 badge counts
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        {/* Branding */}
        <div className="px-4 py-5 border-b border-gray-200">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-0.5">TSIO Innovation Hub</p>
          <p className="text-sm font-semibold text-indigo-700">Admin Interface</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto" aria-label="Admin navigation">
          {/* Dashboard */}
          <NavItem to="/admin" label="Dashboard" end />

          {/* RECORDS section */}
          <NavSection label="Records" />
          <NavItem to="/admin/records" label="All Records" />
          <NavItem to="/admin/records/new" label="+ New Record" />

          {/* SUBMISSIONS section */}
          <NavSection label="Submissions" />
          <NavItem
            to="/admin/submissions/opportunities"
            label="Opportunities"
            badge={summary.pending_opportunity_submissions ?? 0}
          />
          <NavItem
            to="/admin/submissions/contributions"
            label="Contributions"
            badge={summary.pending_contribution_submissions ?? 0}
          />

          {/* ENGAGEMENT section */}
          <NavSection label="Engagement" />
          <NavItem to="/admin/engagement" label="Activity Log" />

          {/* REFERENCE section */}
          <NavSection label="Reference" />
          <NavItem to="/admin/content-model" label="Content Model" />

          {/* SETTINGS section */}
          <NavSection label="Settings" />
          <NavItem to="/admin/settings" label="Hub Settings" />
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200">
          <p className="text-xs text-gray-400">Administrative Office of the U.S. Courts</p>
          <p className="text-xs text-gray-400">TSIO Innovation &amp; Research Branch</p>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;

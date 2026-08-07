// AdminSidebar.tsx — Persistent sidebar per UX-Mockup Screen 06 Admin Navigation Sidebar
// All nav items link to real routes. Active route highlighted.

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

interface AdminSidebarProps {
  pendingOpportunities?: number;
  pendingContributions?: number;
}

interface NavItemProps {
  to: string;
  label: string;
  badge?: number;
}

function NavItem({ to, label, badge }: NavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to || 
    (to !== '/admin' && location.pathname.startsWith(to));

  return (
    <NavLink
      to={to}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderRadius: '6px',
        textDecoration: 'none',
        color: isActive ? '#1E40AF' : '#374151',
        backgroundColor: isActive ? '#EFF6FF' : 'transparent',
        fontWeight: isActive ? 600 : 400,
        fontSize: '14px',
        margin: '1px 0',
        transition: 'background-color 0.15s',
      }}
    >
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          style={{
            backgroundColor: '#EF4444',
            color: 'white',
            borderRadius: '10px',
            padding: '1px 7px',
            fontSize: '11px',
            fontWeight: 700,
            minWidth: '20px',
            textAlign: 'center',
          }}
        >
          {badge}
        </span>
      )}
    </NavLink>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        color: '#9CA3AF',
        padding: '12px 12px 4px',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </div>
  );
}

export function AdminSidebar({ pendingOpportunities = 0, pendingContributions = 0 }: AdminSidebarProps) {
  return (
    <aside
      style={{
        width: '240px',
        minWidth: '240px',
        backgroundColor: '#F9FAFB',
        borderRight: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        padding: '16px 8px',
      }}
    >
      {/* Branding */}
      <div
        style={{
          padding: '8px 12px 20px',
          borderBottom: '1px solid #E5E7EB',
          marginBottom: '8px',
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E40AF' }}>TSIO Innovation Hub</div>
        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Administration</div>
      </div>

      {/* Main nav */}
      <NavItem to="/admin" label="Dashboard" />

      {/* RECORDS section */}
      <SectionHeader label="Records" />
      <NavItem to="/admin/records" label="All Records" />
      <NavItem to="/admin/records/new" label="+ New Record" />

      {/* SUBMISSIONS section */}
      <SectionHeader label="Submissions" />
      <NavItem
        to="/admin/submissions/opportunities"
        label="Opportunities"
        badge={pendingOpportunities}
      />
      <NavItem
        to="/admin/submissions/contributions"
        label="Contributions"
        badge={pendingContributions}
      />

      {/* ENGAGEMENT section */}
      <SectionHeader label="Engagement" />
      <NavItem to="/admin/engagement" label="Activity Log" />

      {/* REFERENCE section */}
      <SectionHeader label="Reference" />
      <NavItem to="/admin/content-model" label="Content Model" />

      {/* SETTINGS section */}
      <SectionHeader label="Settings" />
      <NavItem to="/admin/settings" label="Hub Settings" />

      {/* Footer */}
      <div style={{ marginTop: 'auto', padding: '16px 12px 8px', borderTop: '1px solid #E5E7EB' }}>
        <a
          href="/catalog"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '13px',
            color: '#6B7280',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          View Public Hub ↗
        </a>
      </div>
    </aside>
  );
}

/**
 * AdminSidebar.tsx — Persistent admin navigation sidebar.
 *
 * Per UX-Mockup Screen 06 Admin Navigation Sidebar.
 * All nav items link to real routes. Active route highlighted.
 * Pending counts shown as badges on Opportunities and Contributions.
 *
 * F8: Curation and Administration — navigation shell
 */

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
  indent?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, label, badge, indent = false }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/admin' && location.pathname.startsWith(to));

  return (
    <NavLink
      to={to}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        paddingLeft: indent ? '28px' : '16px',
        borderRadius: '6px',
        color: isActive ? '#1E40AF' : '#374151',
        backgroundColor: isActive ? '#EFF6FF' : 'transparent',
        fontWeight: isActive ? 600 : 400,
        fontSize: '0.875rem',
        textDecoration: 'none',
        marginBottom: '2px',
        transition: 'background-color 0.1s',
      }}
      onMouseEnter={e => {
        if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB';
      }}
      onMouseLeave={e => {
        if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
      }}
    >
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '20px',
            height: '20px',
            padding: '0 6px',
            borderRadius: '10px',
            backgroundColor: '#DC2626',
            color: '#fff',
            fontSize: '0.7rem',
            fontWeight: 700,
          }}
        >
          {badge}
        </span>
      )}
    </NavLink>
  );
};

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      padding: '12px 16px 4px',
      fontSize: '0.7rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: '#9CA3AF',
    }}
  >
    {label}
  </div>
);

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  pendingOpportunities = 0,
  pendingContributions = 0,
}) => {
  return (
    <aside
      style={{
        width: '240px',
        minWidth: '240px',
        backgroundColor: '#FFFFFF',
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
          padding: '8px 16px 20px',
          borderBottom: '1px solid #E5E7EB',
          marginBottom: '8px',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          TSIO Innovation Hub
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
          Administration
        </div>
      </div>

      {/* Dashboard */}
      <NavItem to="/admin" label="Dashboard" />

      {/* Records */}
      <SectionLabel label="Records" />
      <NavItem to="/admin/records" label="All Records" indent />
      <NavItem to="/admin/records/new" label="+ New Record" indent />

      {/* Submissions */}
      <SectionLabel label="Submissions" />
      <NavItem
        to="/admin/submissions/opportunities"
        label="Opportunities"
        badge={pendingOpportunities}
        indent
      />
      <NavItem
        to="/admin/submissions/contributions"
        label="Contributions"
        badge={pendingContributions}
        indent
      />

      {/* Engagement */}
      <SectionLabel label="Engagement" />
      <NavItem to="/admin/engagement" label="Activity Log" indent />

      {/* Reference */}
      <SectionLabel label="Reference" />
      <NavItem to="/admin/content-model" label="Content Model" indent />

      {/* Settings */}
      <SectionLabel label="Settings" />
      <NavItem to="/admin/settings" label="Hub Settings" indent />

      {/* Footer */}
      <div style={{ flex: 1 }} />
      <div style={{ padding: '16px 8px', borderTop: '1px solid #E5E7EB', marginTop: '16px' }}>
        <a
          href="/catalog"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.8rem',
            color: '#6B7280',
            textDecoration: 'none',
            padding: '6px 8px',
            borderRadius: '4px',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#374151')}
          onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
        >
          View Public Hub ↗
        </a>
      </div>
    </aside>
  );
};

export default AdminSidebar;

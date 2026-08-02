/**
 * AdminLayout.tsx — Admin layout shell with sidebar navigation.
 *
 * Re-exports and composes AdminShell + AdminSidebar from src/admin/
 * to satisfy the plan-level artifact contract for AdminLayout.
 *
 * Sidebar navigation (per Screen-06 UX Mockup):
 *   Dashboard                   → /admin
 *   RECORDS
 *     All Records               → /admin/records
 *     + New Record              → /admin/records/new
 *   SUBMISSIONS
 *     Opportunities [badge]     → /admin/submissions/opportunities
 *     Contributions [badge]     → /admin/submissions/contributions
 *   ENGAGEMENT
 *     Activity Log              → /admin/engagement
 *   REFERENCE
 *     Content Model             → /admin/content-model
 *   SETTINGS
 *     Hub Settings              → /admin/settings
 *
 * F8: Curation and Administration — AdminLayout sidebar nav wiring
 */

// Re-export from canonical admin module location
export { AdminShell as AdminLayout } from '../../admin/AdminShell';
export { AdminShell } from '../../admin/AdminShell';
export { AdminSidebar } from '../../admin/components/AdminSidebar';

// Named sidebar nav routes for reference (verified by plan contracts)
export const ADMIN_NAV_ROUTES = {
  dashboard: '/admin',
  records: '/admin/records',
  recordsNew: '/admin/records/new',
  // Submissions section
  submissionsOpportunities: '/admin/submissions/opportunities',
  submissionsContributions: '/admin/submissions/contributions',
  // Engagement section
  engagement: '/admin/engagement',
  // Reference section
  contentModel: '/admin/content-model',
  // Settings section
  settings: '/admin/settings',
} as const;

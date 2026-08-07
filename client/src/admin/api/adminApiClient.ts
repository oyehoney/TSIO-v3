// adminApiClient.ts — Typed fetch layer for all admin API calls.
// All requests include credentials (session cookie).

// Base URL from environment; defaults to empty string (same-origin)
const API_BASE = import.meta.env.VITE_API_BASE || '';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include', // send session cookie
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  if (res.status === 401 || res.status === 403) {
    // Redirect to login for auth failures
    window.location.href = '/admin/login';
    throw new Error(`Auth error: ${res.status}`);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body?.error?.message || `HTTP ${res.status}`), {
      status: res.status,
      code: body?.error?.code,
      fields: body?.error?.fields,
    });
  }
  return res.json();
}

export interface DashboardSummary {
  total_published_records: number;
  draft_review_records: number;
  pending_opportunity_submissions: number;
  pending_contribution_submissions: number;
  recent_engagement_requests_7d: number;
}

export interface AdminRecord {
  record_id: string;
  title: string;
  maturity_level: string;
  review_status: string;
  publication_state: string;
  owner_name: string | null;
  owner_office: string | null;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; page_size: number; total_count: number; total_pages: number };
}

export interface AdminRecordDetail {
  record_id?: string;
  title?: string;
  short_summary?: string;
  problem_statement?: string;
  what_was_explored?: string;
  outcome_summary?: string;
  key_findings?: string[];
  maturity_level?: string;
  review_status?: string;
  reuse_potential?: string;
  source_type?: string;
  default_perspective?: string;
  executive_perspective_text?: string;
  executive_recommendation?: string;
  technical_perspective_text?: string;
  security_findings?: string;
  performance_findings?: string;
  reuse_guidance?: string;
  mission_area_tags?: string[];
  technology_area_tags?: string[];
  owner_name?: string;
  owner_office?: string;
  contributing_office?: string;
  contributor_attribution?: string;
  artifact_links?: { label: string; url: string; source_type: string }[];
  engagement_options?: string[];
  last_reviewed_date?: string;
  publication_state?: string;
  created_at?: string;
  updated_at?: string;
}

export const adminApiClient = {
  getDashboardSummary: () =>
    apiFetch<DashboardSummary>('/api/v1/admin/dashboard-summary'),

  getAdminRecords: (params?: {
    title?: string;
    publication_state?: string;
    maturity_level?: string;
    review_status?: string;
    page?: number;
    page_size?: number;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
  }) => {
    const qs = params
      ? '?' + new URLSearchParams(Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => [k, String(v)])).toString()
      : '';
    return apiFetch<PaginatedResponse<AdminRecord>>(`/api/v1/admin/records${qs}`);
  },

  getRecord: (id: string) =>
    apiFetch<AdminRecordDetail>(`/api/v1/admin/records/${id}`),

  createRecord: (data: Record<string, unknown>) =>
    apiFetch<AdminRecordDetail>('/api/v1/admin/records', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRecord: (id: string, data: Record<string, unknown>) =>
    apiFetch<AdminRecordDetail>(`/api/v1/admin/records/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  transitionRecord: (id: string, action: string, data?: Record<string, unknown>) =>
    apiFetch<Record<string, unknown>>(`/api/v1/admin/records/${id}/lifecycle`, {
      method: 'POST',
      body: JSON.stringify({ action, ...data }),
    }),
};

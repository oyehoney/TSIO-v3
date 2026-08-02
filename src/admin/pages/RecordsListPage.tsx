/**
 * RecordsListPage.tsx — Sortable/filterable table of all records at /admin/records.
 *
 * Per UX-Mockup Screen 08. Fetches GET /api/v1/admin/records with filter/sort params.
 *
 * Columns: Title | Maturity | Review Status | Publication State | Owner | Last Updated | Actions
 * Filters: Title (debounced 300ms) | State dropdown | Maturity dropdown | Review Status dropdown
 * Actions: [Edit] → /admin/records/{id}/edit | [View] → /records/{id} (new tab, PUBLISHED only)
 *
 * Gracefully handles 501 stub from Wave 3a.
 * Pagination from API response.
 * URL query params preserve filter state (bookmarkable).
 *
 * F8: Curation and Administration — RecordsListPage
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { adminApiClient, AdminRecord } from '../api/adminApiClient';
import { MaturityBadge } from '../components/MaturityBadge';
import { ReviewStatusBadge } from '../components/ReviewStatusBadge';
import { PublicationStateChip } from '../components/PublicationStateChip';

type SortField = 'title' | 'maturity_level' | 'review_status' | 'publication_state' | 'owner_name' | 'updated_at';
type SortDir = 'asc' | 'desc';

const SORT_ICONS = {
  none: ' ⇅',
  asc: ' ↑',
  desc: ' ↓',
};

const SortableHeader: React.FC<{
  label: string;
  field: SortField;
  currentSort: SortField;
  currentDir: SortDir;
  onSort: (field: SortField) => void;
}> = ({ label, field, currentSort, currentDir, onSort }) => {
  const isActive = currentSort === field;
  const icon = isActive ? (currentDir === 'asc' ? SORT_ICONS.asc : SORT_ICONS.desc) : SORT_ICONS.none;

  return (
    <th
      onClick={() => onSort(field)}
      style={{
        padding: '12px 16px',
        textAlign: 'left',
        fontSize: '0.75rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: isActive ? '#1D4ED8' : '#6B7280',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        borderBottom: '2px solid #E5E7EB',
        backgroundColor: '#F9FAFB',
      }}
    >
      {label}{icon}
    </th>
  );
};

const SkeletonRow: React.FC = () => (
  <tr>
    {[200, 120, 140, 110, 140, 120, 100].map((w, i) => (
      <td key={i} style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6' }}>
        <div
          style={{
            height: '16px',
            width: `${w}px`,
            maxWidth: '100%',
            backgroundColor: '#F3F4F6',
            borderRadius: '4px',
          }}
        />
      </td>
    ))}
  </tr>
);

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export const RecordsListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filter state from URL params
  const [titleFilter, setTitleFilter] = useState(searchParams.get('title') || '');
  const [stateFilter, setStateFilter] = useState(searchParams.get('state') || '');
  const [maturityFilter, setMaturityFilter] = useState(searchParams.get('maturity') || '');
  const [reviewFilter, setReviewFilter] = useState(searchParams.get('review') || '');
  const [sortBy, setSortBy] = useState<SortField>(
    (searchParams.get('sort_by') as SortField) || 'updated_at'
  );
  const [sortDir, setSortDir] = useState<SortDir>(
    (searchParams.get('sort_dir') as SortDir) || 'desc'
  );
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [pagination, setPagination] = useState({ page: 1, page_size: 20, total_count: 0, total_pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stubNotice, setStubNotice] = useState(false);

  // Debounce title search
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.title = 'All Records — Administration — TSIO Innovation Hub';
  }, []);

  const fetchRecords = useCallback(() => {
    setLoading(true);
    setError(null);
    setStubNotice(false);

    const params: Parameters<typeof adminApiClient.getAdminRecords>[0] = {
      sort_by: sortBy,
      sort_dir: sortDir,
      page,
      page_size: 20,
    };
    if (titleFilter) params.title = titleFilter;
    if (stateFilter) params.publication_state = stateFilter;
    if (maturityFilter) params.maturity_level = maturityFilter;
    if (reviewFilter) params.review_status = reviewFilter;

    adminApiClient.getAdminRecords(params)
      .then(res => {
        setRecords(res.data);
        setPagination(res.pagination);
      })
      .catch((err: Error & { status?: number }) => {
        if (err.status === 501) {
          setStubNotice(true);
          setRecords([]);
          setPagination({ page: 1, page_size: 20, total_count: 0, total_pages: 0 });
        } else {
          setError(`Failed to load records: ${err.message}`);
        }
      })
      .finally(() => setLoading(false));
  }, [titleFilter, stateFilter, maturityFilter, reviewFilter, sortBy, sortDir, page]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Sync URL params when filters change
  useEffect(() => {
    const params: Record<string, string> = {};
    if (titleFilter) params.title = titleFilter;
    if (stateFilter) params.state = stateFilter;
    if (maturityFilter) params.maturity = maturityFilter;
    if (reviewFilter) params.review = reviewFilter;
    if (sortBy !== 'updated_at') params.sort_by = sortBy;
    if (sortDir !== 'desc') params.sort_dir = sortDir;
    if (page > 1) params.page = String(page);
    setSearchParams(params, { replace: true });
  }, [titleFilter, stateFilter, maturityFilter, reviewFilter, sortBy, sortDir, page, setSearchParams]);

  const handleTitleChange = (value: string) => {
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    setTitleFilter(value);
    titleDebounceRef.current = setTimeout(() => {
      setPage(1);
    }, 300);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
            All Records
          </h1>
          <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: 0 }}>
            {loading ? 'Loading…' : `${pagination.total_count} record${pagination.total_count !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <Link
          to="/admin/records/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '10px 20px',
            backgroundColor: '#1D4ED8',
            color: '#FFFFFF',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          + New Record
        </Link>
      </div>

      {/* Filter controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
          padding: '16px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
        }}
      >
        <div style={{ flex: '1 1 200px', minWidth: '160px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
            Title search
          </label>
          <input
            type="search"
            placeholder="Search titles…"
            value={titleFilter}
            onChange={e => handleTitleChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '0.875rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
            Publication State
          </label>
          <select
            value={stateFilter}
            onChange={e => { setStateFilter(e.target.value); setPage(1); }}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '0.875rem',
              backgroundColor: '#FFFFFF',
            }}
          >
            <option value="">All States</option>
            <option value="DRAFT">DRAFT</option>
            <option value="REVIEW">IN REVIEW</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="SUPERSEDED">SUPERSEDED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>

        <div style={{ flex: '1 1 180px', minWidth: '160px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
            Maturity Level
          </label>
          <select
            value={maturityFilter}
            onChange={e => { setMaturityFilter(e.target.value); setPage(1); }}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '0.875rem',
              backgroundColor: '#FFFFFF',
            }}
          >
            <option value="">All Levels</option>
            <option value="IDEA">IDEA</option>
            <option value="EXPERIMENT_POC">EXPERIMENT / POC</option>
            <option value="PROTOTYPE_PILOT">PROTOTYPE / PILOT</option>
            <option value="PRODUCTION_VALIDATED">PRODUCTION / VALIDATED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>

        <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
            Review Status
          </label>
          <select
            value={reviewFilter}
            onChange={e => { setReviewFilter(e.target.value); setPage(1); }}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '0.875rem',
              backgroundColor: '#FFFFFF',
            }}
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="CURATED">Curated</option>
            <option value="TECHNICALLY_REVIEWED">Technically Reviewed</option>
            <option value="SECURITY_REVIEWED">Security Reviewed</option>
            <option value="POLICY_REVIEWED">Policy Reviewed</option>
            <option value="VALIDATED_FOR_REUSE">Validated for Reuse</option>
            <option value="SUPERSEDED_RETIRED">Superseded / Retired</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            color: '#991B1B',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Stub notice */}
      {stubNotice && (
        <div
          style={{
            backgroundColor: '#FFF7ED',
            border: '1px solid #FED7AA',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            color: '#92400E',
            fontSize: '0.875rem',
          }}
        >
          Records list unavailable — service not yet implemented. The records API will be available in a future wave.
        </div>
      )}

      {/* Records table */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <SortableHeader label="Title" field="title" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Maturity" field="maturity_level" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Review Status" field="review_status" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: sortBy === 'publication_state' ? '#1D4ED8' : '#6B7280',
                  cursor: 'pointer',
                  userSelect: 'none',
                  borderBottom: '2px solid #E5E7EB',
                  backgroundColor: '#F9FAFB',
                  whiteSpace: 'nowrap',
                }}
                onClick={() => handleSort('publication_state')}
              >
                State{sortBy === 'publication_state' ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ⇅'}
              </th>
              <SortableHeader label="Owner" field="owner_name" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Last Updated" field="updated_at" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'right',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#6B7280',
                  borderBottom: '2px solid #E5E7EB',
                  backgroundColor: '#F9FAFB',
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            )}

            {!loading && !error && !stubNotice && records.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: '60px 24px',
                    textAlign: 'center',
                    color: '#6B7280',
                    fontSize: '0.9rem',
                  }}
                >
                  No records exist yet.{' '}
                  <Link to="/admin/records/new" style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 600 }}>
                    + Create the first record
                  </Link>
                </td>
              </tr>
            )}

            {!loading && records.map(record => (
              <tr
                key={record.record_id}
                style={{ borderBottom: '1px solid #F3F4F6' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FAFAFA')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {/* Title */}
                <td style={{ padding: '14px 16px', maxWidth: '280px' }}>
                  <Link
                    to={`/admin/records/${record.record_id}/edit`}
                    style={{
                      color: '#111827',
                      textDecoration: 'none',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={record.title}
                  >
                    {record.title}
                  </Link>
                </td>

                {/* Maturity */}
                <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                  <MaturityBadge level={record.maturity_level} small />
                </td>

                {/* Review Status */}
                <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                  <ReviewStatusBadge status={record.review_status} small />
                </td>

                {/* Publication State */}
                <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                  <PublicationStateChip state={record.publication_state} small />
                </td>

                {/* Owner */}
                <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: '#6B7280', whiteSpace: 'nowrap' }}>
                  {record.owner_name ? (
                    <span title={record.owner_office || ''}>
                      {record.owner_name}
                      {record.owner_office && (
                        <span style={{ display: 'block', fontSize: '0.7rem', color: '#9CA3AF' }}>
                          {record.owner_office}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span style={{ color: '#D1D5DB', fontStyle: 'italic' }}>—</span>
                  )}
                </td>

                {/* Last Updated */}
                <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: '#6B7280', whiteSpace: 'nowrap' }}>
                  {formatDate(record.updated_at)}
                </td>

                {/* Actions */}
                <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Link
                      to={`/admin/records/${record.record_id}/edit`}
                      style={{
                        padding: '5px 12px',
                        fontSize: '0.8rem',
                        color: '#1D4ED8',
                        border: '1px solid #BFDBFE',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        fontWeight: 500,
                        backgroundColor: '#EFF6FF',
                      }}
                    >
                      Edit
                    </Link>
                    {record.publication_state === 'PUBLISHED' && (
                      <a
                        href={`/records/${record.record_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '5px 12px',
                          fontSize: '0.8rem',
                          color: '#374151',
                          border: '1px solid #E5E7EB',
                          borderRadius: '4px',
                          textDecoration: 'none',
                          fontWeight: 500,
                          backgroundColor: '#F9FAFB',
                        }}
                      >
                        View ↗
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && pagination.total_pages > 1 && (
          <div
            style={{
              padding: '16px',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#F9FAFB',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
              Page {pagination.page} of {pagination.total_pages} ({pagination.total_count} records)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px',
                  backgroundColor: page <= 1 ? '#F9FAFB' : '#FFFFFF',
                  color: page <= 1 ? '#D1D5DB' : '#374151',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                ← Previous
              </button>
              {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      border: '1px solid',
                      borderColor: p === page ? '#1D4ED8' : '#E5E7EB',
                      borderRadius: '4px',
                      backgroundColor: p === page ? '#1D4ED8' : '#FFFFFF',
                      color: p === page ? '#FFFFFF' : '#374151',
                      cursor: 'pointer',
                      fontWeight: p === page ? 700 : 400,
                    }}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
                disabled={page >= pagination.total_pages}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px',
                  backgroundColor: page >= pagination.total_pages ? '#F9FAFB' : '#FFFFFF',
                  color: page >= pagination.total_pages ? '#D1D5DB' : '#374151',
                  cursor: page >= pagination.total_pages ? 'not-allowed' : 'pointer',
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordsListPage;

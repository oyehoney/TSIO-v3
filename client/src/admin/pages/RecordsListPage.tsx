// RecordsListPage.tsx — Sortable table of ALL records per UX-Mockup Screen 08
// Filter controls, pagination, [Edit] and [View] actions per row.

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { adminApiClient, AdminRecord } from '../api/adminApiClient';
import { MaturityBadge } from '../components/MaturityBadge';
import { ReviewStatusBadge } from '../components/ReviewStatusBadge';
import { PublicationStateChip } from '../components/PublicationStateChip';

type SortField = 'title' | 'maturity_level' | 'review_status' | 'publication_state' | 'owner_name' | 'updated_at';
type SortDir = 'asc' | 'desc';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function SortableHeader({
  label,
  field,
  currentSort,
  currentDir,
  onSort,
}: {
  label: string;
  field: SortField;
  currentSort: SortField;
  currentDir: SortDir;
  onSort: (field: SortField) => void;
}) {
  const isActive = currentSort === field;
  return (
    <th
      onClick={() => onSort(field)}
      style={{
        padding: '10px 12px',
        textAlign: 'left',
        fontSize: '12px',
        fontWeight: 600,
        color: isActive ? '#1E40AF' : '#6B7280',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        borderBottom: '2px solid #E5E7EB',
        backgroundColor: '#F9FAFB',
      }}
    >
      {label} {isActive ? (currentDir === 'asc' ? '↑' : '↓') : '↕'}
    </th>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {[140, 100, 120, 100, 100, 80, 80].map((w, i) => (
        <td key={i} style={{ padding: '12px', borderBottom: '1px solid #F3F4F6' }}>
          <div
            style={{
              width: `${w}px`,
              height: '16px',
              backgroundColor: '#F3F4F6',
              borderRadius: '4px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        </td>
      ))}
    </tr>
  );
}

export function RecordsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filter state from URL params
  const [titleFilter, setTitleFilter] = useState(searchParams.get('title') || '');
  const [stateFilter, setStateFilter] = useState(searchParams.get('state') || '');
  const [maturityFilter, setMaturityFilter] = useState(searchParams.get('maturity') || '');
  const [reviewFilter, setReviewFilter] = useState(searchParams.get('review') || '');
  const [sortBy, setSortBy] = useState<SortField>((searchParams.get('sort_by') as SortField) || 'updated_at');
  const [sortDir, setSortDir] = useState<SortDir>((searchParams.get('sort_dir') as SortDir) || 'desc');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [pagination, setPagination] = useState({ total_count: 0, total_pages: 1, page: 1, page_size: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounced title filter
  const [debouncedTitle, setDebouncedTitle] = useState(titleFilter);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTitle(titleFilter), 300);
    return () => clearTimeout(timer);
  }, [titleFilter]);

  const fetchRecords = useCallback(() => {
    setLoading(true);
    setError(null);

    const params: Parameters<typeof adminApiClient.getAdminRecords>[0] = {
      sort_by: sortBy,
      sort_dir: sortDir,
      page,
      page_size: 20,
    };
    if (debouncedTitle) params.title = debouncedTitle;
    if (stateFilter) params.publication_state = stateFilter;
    if (maturityFilter) params.maturity_level = maturityFilter;
    if (reviewFilter) params.review_status = reviewFilter;

    // Update URL params for bookmarking
    const urlParams: Record<string, string> = {};
    if (debouncedTitle) urlParams.title = debouncedTitle;
    if (stateFilter) urlParams.state = stateFilter;
    if (maturityFilter) urlParams.maturity = maturityFilter;
    if (reviewFilter) urlParams.review = reviewFilter;
    if (sortBy !== 'updated_at') urlParams.sort_by = sortBy;
    if (sortDir !== 'desc') urlParams.sort_dir = sortDir;
    if (page > 1) urlParams.page = String(page);
    setSearchParams(urlParams, { replace: true });

    adminApiClient
      .getAdminRecords(params)
      .then(res => {
        setRecords(res.data);
        setPagination(res.pagination);
        setLoading(false);
      })
      .catch(err => {
        if (err?.status === 501 || err?.code === 'NOT_IMPLEMENTED') {
          setError('Records list unavailable — service not yet implemented.');
          setRecords([]);
        } else {
          setError(err?.message || 'Failed to load records.');
          setRecords([]);
        }
        setLoading(false);
      });
  }, [debouncedTitle, stateFilter, maturityFilter, reviewFilter, sortBy, sortDir, page]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  return (
    <div>
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>
            All Records
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
            {pagination.total_count > 0
              ? `${pagination.total_count} records across all publication states`
              : 'All innovation records'}
          </p>
        </div>
        <Link
          to="/admin/records/new"
          style={{
            padding: '10px 18px',
            backgroundColor: '#1E40AF',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          + New Record
        </Link>
      </div>

      {/* Filter controls */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="Search by title..."
          value={titleFilter}
          onChange={e => { setTitleFilter(e.target.value); setPage(1); }}
          style={{
            padding: '8px 12px',
            border: '1px solid #D1D5DB',
            borderRadius: '6px',
            fontSize: '14px',
            width: '220px',
            outline: 'none',
          }}
        />
        <select
          value={stateFilter}
          onChange={e => { setStateFilter(e.target.value); setPage(1); }}
          style={{
            padding: '8px 12px',
            border: '1px solid #D1D5DB',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white',
            color: stateFilter ? '#111827' : '#6B7280',
          }}
        >
          <option value="">All States</option>
          <option value="DRAFT">Draft</option>
          <option value="REVIEW">In Review</option>
          <option value="PUBLISHED">Published</option>
          <option value="SUPERSEDED">Superseded</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select
          value={maturityFilter}
          onChange={e => { setMaturityFilter(e.target.value); setPage(1); }}
          style={{
            padding: '8px 12px',
            border: '1px solid #D1D5DB',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white',
            color: maturityFilter ? '#111827' : '#6B7280',
          }}
        >
          <option value="">All Maturity Levels</option>
          <option value="IDEA">Idea</option>
          <option value="EXPERIMENT_POC">Experiment / POC</option>
          <option value="PROTOTYPE_PILOT">Prototype / Pilot</option>
          <option value="PRODUCTION_VALIDATED">Production / Validated</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select
          value={reviewFilter}
          onChange={e => { setReviewFilter(e.target.value); setPage(1); }}
          style={{
            padding: '8px 12px',
            border: '1px solid #D1D5DB',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white',
            color: reviewFilter ? '#111827' : '#6B7280',
          }}
        >
          <option value="">All Review Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="CURATED">Curated</option>
          <option value="TECHNICALLY_REVIEWED">Technically Reviewed</option>
          <option value="SECURITY_REVIEWED">Security Reviewed</option>
          <option value="POLICY_REVIEWED">Policy Reviewed</option>
          <option value="VALIDATED_FOR_REUSE">Validated for Reuse</option>
          <option value="SUPERSEDED_RETIRED">Superseded / Retired</option>
        </select>
        {(titleFilter || stateFilter || maturityFilter || reviewFilter) && (
          <button
            onClick={() => {
              setTitleFilter('');
              setStateFilter('');
              setMaturityFilter('');
              setReviewFilter('');
              setPage(1);
            }}
            style={{
              padding: '8px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '13px',
              backgroundColor: 'white',
              color: '#6B7280',
              cursor: 'pointer',
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: '#991B1B',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* Records table */}
      <div
        style={{
          backgroundColor: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <SortableHeader label="Title" field="title" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Maturity" field="maturity_level" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Review Status" field="review_status" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="State" field="publication_state" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Owner" field="owner_name" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Last Updated" field="updated_at" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
              <th
                style={{
                  padding: '10px 12px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#6B7280',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  borderBottom: '2px solid #E5E7EB',
                  backgroundColor: '#F9FAFB',
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : records.length === 0 && !error ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    color: '#6B7280',
                    fontSize: '14px',
                  }}
                >
                  <div style={{ marginBottom: '12px' }}>No records exist yet.</div>
                  <Link
                    to="/admin/records/new"
                    style={{
                      color: '#1E40AF',
                      textDecoration: 'underline',
                      fontSize: '14px',
                    }}
                  >
                    + Create the first record
                  </Link>
                </td>
              </tr>
            ) : (
              records.map(record => (
                <tr
                  key={record.record_id}
                  style={{ borderBottom: '1px solid #F3F4F6' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FAFAFA')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '12px', maxWidth: '240px' }}>
                    <button
                      onClick={() => navigate(`/admin/records/${record.record_id}/edit`)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: '#1E40AF',
                        fontSize: '14px',
                        fontWeight: 500,
                      }}
                    >
                      {record.title || '(Untitled)'}
                    </button>
                  </td>
                  <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                    <MaturityBadge level={record.maturity_level} small />
                  </td>
                  <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                    <ReviewStatusBadge status={record.review_status} small />
                  </td>
                  <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                    <PublicationStateChip state={record.publication_state} small />
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                    {record.owner_name || '—'}
                    {record.owner_office && (
                      <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{record.owner_office}</div>
                    )}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                    {formatDate(record.updated_at)}
                  </td>
                  <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                    <Link
                      to={`/admin/records/${record.record_id}/edit`}
                      style={{
                        color: '#1E40AF',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: 500,
                        marginRight: '12px',
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
                          color: '#6B7280',
                          textDecoration: 'none',
                          fontSize: '13px',
                        }}
                      >
                        View ↗
                      </a>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '16px',
            fontSize: '14px',
            color: '#6B7280',
          }}
        >
          <span>
            Page {pagination.page} of {pagination.total_pages} ({pagination.total_count} total)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: '6px 14px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                backgroundColor: page <= 1 ? '#F3F4F6' : 'white',
                color: page <= 1 ? '#9CA3AF' : '#374151',
                cursor: page <= 1 ? 'default' : 'pointer',
                fontSize: '13px',
              }}
            >
              ← Previous
            </button>
            {Array.from({ length: Math.min(pagination.total_pages, 7) }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid',
                    borderColor: page === pageNum ? '#1E40AF' : '#D1D5DB',
                    borderRadius: '6px',
                    backgroundColor: page === pageNum ? '#EFF6FF' : 'white',
                    color: page === pageNum ? '#1E40AF' : '#374151',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: page === pageNum ? 600 : 400,
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
              disabled={page >= pagination.total_pages}
              style={{
                padding: '6px 14px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                backgroundColor: page >= pagination.total_pages ? '#F3F4F6' : 'white',
                color: page >= pagination.total_pages ? '#9CA3AF' : '#374151',
                cursor: page >= pagination.total_pages ? 'default' : 'pointer',
                fontSize: '13px',
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

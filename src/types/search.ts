// Search-related TypeScript interfaces for TSIO Innovation Hub
// Consumed by: SearchService, SearchHandler, Wave 4b SearchPage frontend

import type {
  MaturityLevel,
  ReviewStatus,
  ReusePotential,
  PublicationState,
  EngagementOptionType,
  SourceType,
} from './common';

// CatalogCard is the base type for innovation record list items
// Extended by SearchResultCard with FTS-specific fields
export interface CatalogCard {
  record_id: string;
  title: string;
  short_summary: string | null;
  maturity_level: MaturityLevel;
  maturity_label: string;
  review_status: ReviewStatus;
  review_status_label: string;
  reuse_potential: ReusePotential;
  source_type: SourceType;
  mission_area_tags: string[];
  technology_area_tags: string[];
  engagement_options: EngagementOptionType[];
  is_validated_for_reuse: boolean;
  is_community_contributed: boolean;
  published_at: string | null;
  publication_state?: PublicationState; // Present for CURATOR role only
}

// SearchResultCard extends CatalogCard with FTS ranking and highlight fields
export interface SearchResultCard extends CatalogCard {
  relevance_score: number;           // ts_rank output from PostgreSQL FTS
  highlight_snippet: string | null;  // ts_headline excerpt; null if no match
}

// Validated query parameters for GET /api/v1/search
export interface SearchQueryParams {
  q: string;                              // 1–500 chars; required
  maturity_level?: MaturityLevel | MaturityLevel[];
  review_status?: ReviewStatus | ReviewStatus[];
  contributing_office?: string | string[];
  reuse_potential?: ReusePotential;
  page?: number;                          // default 1
  page_size?: number;                     // default 12, max 50
}

// Pagination envelope returned in every search response
export interface Pagination {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
}

// Full paginated search response shape
// Wave 4b SearchPage consumes this type directly from this module
export interface PaginatedSearchResponse {
  data: SearchResultCard[];
  pagination: Pagination;
}

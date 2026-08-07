// Shared type definitions for catalog feature.
// Consumed by: CatalogPage (this plan), SearchPage (Wave 4b), RecordPage (Wave 4c), AdminInterface (Wave 6).

export type MaturityLevel =
  | 'IDEA'
  | 'EXPERIMENT_POC'
  | 'PROTOTYPE_PILOT'
  | 'PRODUCTION_VALIDATED'
  | 'ARCHIVED';

export type ReviewStatus =
  | 'SUBMITTED'
  | 'CURATED'
  | 'TECHNICALLY_REVIEWED'
  | 'SECURITY_REVIEWED'
  | 'POLICY_REVIEWED'
  | 'VALIDATED_FOR_REUSE'
  | 'SUPERSEDED_RETIRED';

export type ReusePotential = 'HIGH' | 'MEDIUM' | 'LOW';

export type EngagementOptionType =
  | 'REQUEST_DEMO'
  | 'REQUEST_ADOPTION_DISCUSSION'
  | 'REQUEST_TECHNICAL_GUIDANCE'
  | 'REQUEST_BRIEFING';

export type SourceType = 'I_AND_R' | 'COMMUNITY';

export type SortOption = 'recent' | 'maturity' | 'relevance';

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
}

export interface Pagination {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
}

export interface PaginatedCatalogResponse {
  data: CatalogCard[];
  pagination: Pagination;
}

export interface CatalogFilters {
  maturity_levels: MaturityLevel[];
  review_statuses: ReviewStatus[];
  contributing_offices: string[];
  mission_area_tags: string[];
  technology_area_tags: string[];
  reuse_potentials: ReusePotential[];
}

// Active filter state used by FilterPanel and useCatalog
export interface FilterState {
  maturity_level: MaturityLevel[];
  review_status: ReviewStatus[];
  contributing_office: string[];
  mission_area: string[];
  technology_area: string[];
  reuse_potential: ReusePotential | '';
  sort: SortOption;
  page: number;
}

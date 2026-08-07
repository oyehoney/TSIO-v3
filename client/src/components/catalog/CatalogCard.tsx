import React from 'react';
import { Link } from 'react-router-dom';
import type { CatalogCard as CatalogCardType } from '../../types/catalog';
import { MaturityBadge } from '../badges/MaturityBadge';
import { ReviewStatusBadge } from '../badges/ReviewStatusBadge';
import { CommunityBadge } from '../badges/CommunityBadge';
import { ReuseBadge } from '../badges/ReuseBadge';
import { ENGAGEMENT_LABELS, ENGAGEMENT_ICONS } from '../../lib/constants';

interface Props {
  card: CatalogCardType;
}

export function CatalogCard({ card }: Props) {
  const summary = card.short_summary
    ? card.short_summary.length > 280
      ? card.short_summary.slice(0, 277) + '…'
      : card.short_summary
    : null;

  const publishedDate = card.published_at
    ? new Date(card.published_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <article
      className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
      data-testid="catalog-card"
      data-record-id={card.record_id}
    >
      {/* Badge row — Primary: maturity + review + conditional community/reuse */}
      <div className="flex flex-wrap gap-2">
        <MaturityBadge maturity_level={card.maturity_level} maturity_label={card.maturity_label} />
        <ReviewStatusBadge review_status={card.review_status} review_status_label={card.review_status_label} />
        {card.is_community_contributed && <CommunityBadge />}
        {card.is_validated_for_reuse && <ReuseBadge />}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-gray-900 leading-snug">{card.title}</h3>

      {/* Short summary */}
      {summary && (
        <p className="text-sm text-gray-600 leading-relaxed flex-1">{summary}</p>
      )}

      {/* Tags */}
      {(card.mission_area_tags.length > 0 || card.technology_area_tags.length > 0) && (
        <div className="flex flex-wrap gap-1.5" aria-label="Tags">
          {card.mission_area_tags.map(tag => (
            <span key={tag} className="inline-flex items-center text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
              🏷 {tag}
            </span>
          ))}
          {card.technology_area_tags.map(tag => (
            <span key={tag} className="inline-flex items-center text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
              🏷 {tag}
            </span>
          ))}
        </div>
      )}

      {/* Engagement indicators */}
      {card.engagement_options.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Available engagement options">
          {card.engagement_options.map(opt => (
            <span key={opt} className="text-xs text-indigo-700 font-medium">
              {ENGAGEMENT_ICONS[opt]} {ENGAGEMENT_LABELS[opt] ?? opt}
            </span>
          ))}
        </div>
      )}

      {/* Footer: date + CTA */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
        {publishedDate && (
          <span className="text-xs text-gray-500">{publishedDate}</span>
        )}
        <Link
          to={`/records/${card.record_id}`}
          className="text-sm font-medium text-indigo-700 hover:text-indigo-900 hover:underline ml-auto"
          aria-label={`View record: ${card.title}`}
          data-testid="view-record-link"
        >
          View Record →
        </Link>
      </div>
    </article>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import type { SearchResultCard as SearchResultCardType } from '../hooks/useSearch';

// F9 color system — per UX Mockup overview color table
const MATURITY_BADGE_CLASSES: Record<string, string> = {
  IDEA: 'bg-gray-100 text-gray-700 border border-gray-300',
  EXPERIMENT_POC: 'bg-amber-100 text-amber-800 border border-amber-300',
  PROTOTYPE_PILOT: 'bg-orange-100 text-orange-800 border border-orange-300',
  PRODUCTION_VALIDATED: 'bg-green-100 text-green-800 border border-green-300',
  ARCHIVED: 'bg-gray-200 text-gray-600 border border-gray-400',
};

const REVIEW_BADGE_CLASSES = 'bg-blue-50 text-blue-700 border border-blue-200';

const ENGAGEMENT_ICONS: Record<string, string> = {
  REQUEST_DEMO: '📋',
  REQUEST_ADOPTION_DISCUSSION: '💬',
  REQUEST_TECHNICAL_GUIDANCE: '🔧',
  REQUEST_BRIEFING: '📊',
};

const ENGAGEMENT_LABELS: Record<string, string> = {
  REQUEST_DEMO: 'Demo Available',
  REQUEST_ADOPTION_DISCUSSION: 'Adoption Discussion Available',
  REQUEST_TECHNICAL_GUIDANCE: 'Technical Guidance Available',
  REQUEST_BRIEFING: 'Briefing Available',
};

interface Props {
  card: SearchResultCardType;
}

export function SearchResultCard({ card }: Props) {
  // Sanitize highlight_snippet: only allow <mark> tags (per T-04-04 cross-wave constraint)
  const safeSnippet = card.highlight_snippet
    ? DOMPurify.sanitize(card.highlight_snippet, { ALLOWED_TAGS: ['mark'], ALLOWED_ATTR: [] })
    : null;

  const publishedDate = card.published_at
    ? new Date(card.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : null;

  return (
    <article
      className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
      aria-label={`Search result: ${card.title}`}
    >
      {/* Badges row */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${MATURITY_BADGE_CLASSES[card.maturity_level] ?? MATURITY_BADGE_CLASSES['IDEA']}`}
          aria-label={`Maturity: ${card.maturity_label}`}
        >
          ● {card.maturity_label}
        </span>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${REVIEW_BADGE_CLASSES}`}
          aria-label={`Review status: ${card.review_status_label}`}
        >
          {card.review_status_label}
        </span>
        {card.is_community_contributed && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300">
            COMMUNITY
          </span>
        )}
        {card.is_validated_for_reuse && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-300">
            Validated for Reuse ✓
          </span>
        )}
      </div>

      {/* Title */}
      <h2 className="text-base font-semibold text-gray-900 mb-2">
        <Link
          to={`/records/${card.record_id}`}
          className="hover:text-blue-700 hover:underline focus:outline-none focus:underline"
        >
          {card.title}
        </Link>
      </h2>

      {/* Highlight snippet — query terms in <mark> tags */}
      {safeSnippet ? (
        <p
          className="text-sm text-gray-600 mb-3 leading-relaxed [&_mark]:bg-yellow-100 [&_mark]:font-semibold [&_mark]:not-italic"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: safeSnippet }}
          aria-label="Search result excerpt with highlighted terms"
        />
      ) : card.short_summary ? (
        <p className="text-sm text-gray-600 mb-3 leading-relaxed">{card.short_summary}</p>
      ) : null}

      {/* Tags */}
      {(card.mission_area_tags.length > 0 || card.technology_area_tags.length > 0) && (
        <div className="flex flex-wrap gap-1 mb-3" aria-label="Topic tags">
          {card.mission_area_tags.map(tag => (
            <span key={`m-${tag}`} className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded">
              🏷 {tag}
            </span>
          ))}
          {card.technology_area_tags.map(tag => (
            <span key={`t-${tag}`} className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded">
              🏷 {tag}
            </span>
          ))}
        </div>
      )}

      {/* Engagement indicators */}
      {card.engagement_options.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3" aria-label="Available engagement options">
          {card.engagement_options.map(opt => (
            <span key={opt} className="text-xs text-gray-500">
              {ENGAGEMENT_ICONS[opt] ?? '•'} {ENGAGEMENT_LABELS[opt] ?? opt}
            </span>
          ))}
        </div>
      )}

      {/* Footer: date, reuse potential, view link */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex gap-3 text-xs text-gray-400">
          {publishedDate && <span>Published: {publishedDate}</span>}
          {card.reuse_potential && <span>Reuse Potential: {card.reuse_potential.charAt(0) + card.reuse_potential.slice(1).toLowerCase()}</span>}
        </div>
        <Link
          to={`/records/${card.record_id}`}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline focus:outline-none focus:underline"
          aria-label={`View full record: ${card.title}`}
        >
          View →
        </Link>
      </div>
    </article>
  );
}

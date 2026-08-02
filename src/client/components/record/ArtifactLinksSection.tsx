/**
 * ArtifactLinksSection.tsx — External artifact links with artifact_type icons.
 *
 * Per UX Mockup Screen 02 §SOURCE DOCUMENTS & ARTIFACTS and §TECHNICAL ARTIFACTS sections.
 * Security: T-11-05 — artifact URLs are stored strings (https:// enforced by DB CHECK
 * constraint on write). Hub never fetches artifact URLs — only stores + renders as href.
 * All links open in new tab with rel="noopener noreferrer" to prevent tab-napping.
 *
 * Sorted ascending by display_order. Returns null if no links.
 */

import React from 'react';
import type { ArtifactLink, ArtifactType } from '../../types/record';

const ARTIFACT_ICONS: Record<ArtifactType, string> = {
  DOCUMENT: '\uD83D\uDCC4',        // 📄
  CODE_REPOSITORY: '\uD83D\uDD27', // 🔧
  VIDEO: '\uD83C\uDFAC',           // 🎬
  DIAGRAM: '\uD83D\uDCD0',         // 📐
  OTHER: '\uD83D\uDD17',           // 🔗
};

interface Props {
  links: ArtifactLink[];
  heading?: string;
}

export const ArtifactLinksSection: React.FC<Props> = ({
  links,
  heading = 'SOURCE DOCUMENTS & ARTIFACTS',
}) => {
  if (!links || links.length === 0) return null;

  const sorted = [...links].sort((a, b) => a.display_order - b.display_order);

  return (
    <section className="artifact-links-section">
      <h2 className="record-section-heading">{heading}</h2>
      <ul className="artifact-links-list">
        {sorted.map((link) => (
          <li key={link.link_id} className="artifact-link-item">
            <span aria-hidden="true">{ARTIFACT_ICONS[link.artifact_type] ?? '\uD83D\uDD17'}</span>{' '}
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${link.label} (opens in new tab)`}
              className="artifact-link"
            >
              {link.label}
              <span aria-hidden="true"> &#8599;</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="artifact-links-note" style={{ fontSize: '0.85em', color: '#6B7280' }}>
        External links — opens in new tab. Hub does not host or cache these documents.
      </p>
    </section>
  );
};

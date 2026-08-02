/**
 * NotFoundPage.tsx — 404 fallback page.
 *
 * Rendered when:
 * - Record ID in URL does not exist in the database
 * - Record exists but is not in PUBLISHED state (PUBLIC role)
 * - Any network/API error that cannot be recovered from
 *
 * Security: T-11-02 — RecordPage never partially renders a non-PUBLISHED record.
 * Any 404 from GET /api/v1/records/:id renders this page with no record data.
 */

import React from 'react';

interface Props {
  message?: string;
}

export const NotFoundPage: React.FC<Props> = ({
  message = 'The requested record was not found.',
}) => (
  <main className="not-found-page">
    <h1>404 &mdash; Not Found</h1>
    <p>{message}</p>
    <a href="/catalog">&#8592; Return to Catalog</a>
  </main>
);

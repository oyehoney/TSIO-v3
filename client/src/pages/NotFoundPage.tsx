import React from 'react';

export const NotFoundPage: React.FC<{ message?: string }> = ({
  message = 'The requested record was not found.',
}) => (
  <main className="not-found-page">
    <h1>404 — Not Found</h1>
    <p>{message}</p>
    <a href="/catalog">← Return to Catalog</a>
  </main>
);

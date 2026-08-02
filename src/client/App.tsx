/**
 * App.tsx — React application root with React Router routes.
 *
 * Routes:
 *   /records/:id  → RecordPage (Wave 4, Plan 11)
 *   /catalog      → CatalogPage placeholder (Wave 4a, plans 09-10)
 *   /search       → SearchPage placeholder (Wave 4b)
 *
 * Wave 5 will wire onEngagementRequest modal to RecordPage here.
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RecordPage } from './pages/RecordPage';

export const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/records/:id" element={<RecordPage />} />
      <Route path="/catalog" element={<div className="catalog-placeholder">Catalog coming soon</div>} />
      <Route path="/search" element={<div className="search-placeholder">Search coming soon</div>} />
      <Route path="*" element={<div className="not-found-placeholder">404 — Page not found. <a href="/catalog">Go to Catalog</a></div>} />
    </Routes>
  </BrowserRouter>
);

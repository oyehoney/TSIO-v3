/**
 * App.tsx — React application root with React Router routes.
 *
 * Routes:
 *   /records/:id                       → RecordPage (Wave 4, Plan 11)
 *   /catalog                           → CatalogPage placeholder (Wave 4a, plans 09-10)
 *   /search                            → SearchPage placeholder (Wave 4b)
 *   /submit-opportunity                → SubmitOpportunityPage (Wave 5a, Plan 12)
 *   /submit-opportunity/confirmation   → SubmitOpportunityConfirmationPage (Wave 5a, Plan 12)
 *   /share-innovation                  → ShareInnovationPage (Wave 5a, Plan 12)
 *   /share-innovation/confirmation     → ShareInnovationConfirmationPage (Wave 5a, Plan 12)
 *
 * Top nav: Catalog | Submit a Mission Problem | Share Your Innovation Work
 */

import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { RecordPage } from './pages/RecordPage';
import { SubmitOpportunityPage } from './pages/SubmitOpportunityPage';
import { SubmitOpportunityConfirmationPage } from './pages/SubmitOpportunityConfirmationPage';
import { ShareInnovationPage } from './pages/ShareInnovationPage';
import { ShareInnovationConfirmationPage } from './pages/ShareInnovationConfirmationPage';

function TopNav() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <NavLink to="/catalog" className="font-bold text-gray-900 text-sm tracking-wide">
            TSIO INNOVATION HUB
          </NavLink>
          <nav aria-label="Main navigation">
            <ul className="flex gap-4 text-sm list-none m-0 p-0">
              <li>
                <NavLink
                  to="/catalog"
                  className={({ isActive }) => isActive ? 'text-blue-700 font-semibold' : 'text-gray-700 hover:text-blue-700'}
                >
                  Catalog
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/submit-opportunity"
                  className={({ isActive }) => isActive ? 'text-blue-700 font-semibold' : 'text-gray-700 hover:text-blue-700'}
                >
                  Submit a Mission Problem
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/share-innovation"
                  className={({ isActive }) => isActive ? 'text-blue-700 font-semibold' : 'text-gray-700 hover:text-blue-700'}
                >
                  Share Your Innovation Work
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
        {/* Global search bar placeholder — Wave 4 adds full search */}
        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Search…"
            aria-label="Search"
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-52"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                window.location.href = `/search?q=${encodeURIComponent(e.currentTarget.value.trim())}`;
              }
            }}
          />
        </div>
      </div>
    </header>
  );
}

export const App: React.FC = () => (
  <BrowserRouter>
    <TopNav />
    <Routes>
      <Route path="/records/:id" element={<RecordPage />} />
      <Route path="/catalog" element={<div className="catalog-placeholder p-8">Catalog coming soon</div>} />
      <Route path="/search" element={<div className="search-placeholder p-8">Search coming soon</div>} />
      {/* Submission routes (Wave 5a, Plan 12) */}
      <Route path="/submit-opportunity" element={<SubmitOpportunityPage />} />
      <Route path="/submit-opportunity/confirmation" element={<SubmitOpportunityConfirmationPage />} />
      <Route path="/share-innovation" element={<ShareInnovationPage />} />
      <Route path="/share-innovation/confirmation" element={<ShareInnovationConfirmationPage />} />
      <Route path="*" element={<div className="not-found-placeholder p-8">404 — Page not found. <a href="/catalog">Go to Catalog</a></div>} />
    </Routes>
  </BrowserRouter>
);

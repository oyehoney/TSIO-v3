/**
 * App.tsx — Main React application router
 *
 * NOTE: This file is a placeholder stub created by Plan 10 (SearchPage).
 * Plan 09 (CatalogPage) will replace/extend this with the full app shell,
 * catalog routes, and complete navigation. The /search route is wired here
 * so SearchPage is reachable and not an orphan.
 *
 * Wave 7 integration will validate the full route map.
 */
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { SearchPage } from './pages/SearchPage';

// Minimal App Shell with global search bar — reachable from every page
function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchInput.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo / Brand */}
            <Link to="/" className="text-lg font-bold text-blue-800 whitespace-nowrap">
              TSIO Innovation Hub
            </Link>

            {/* Global search bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex-1 max-w-lg"
              role="search"
              aria-label="Search innovation records"
            >
              <div className="relative">
                <input
                  type="search"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search innovation records…"
                  aria-label="Search innovation records"
                  className="w-full pl-4 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Submit search"
                >
                  🔍
                </button>
              </div>
            </form>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-6" aria-label="Primary navigation">
              <Link to="/catalog" className="text-sm text-gray-600 hover:text-blue-700 font-medium">
                Catalog
              </Link>
              <Link to="/submit-opportunity" className="text-sm text-gray-600 hover:text-blue-700 font-medium">
                Submit a Mission Problem
              </Link>
              <Link to="/share-innovation" className="text-sm text-gray-600 hover:text-blue-700 font-medium">
                Share Your Innovation Work
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Page content */}
      {children}
    </div>
  );
}

// Placeholder page component for routes not yet implemented
function PlaceholderPage({ title }: { title: string }) {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <h1 className="text-2xl font-semibold text-gray-700">{title}</h1>
      <p className="text-gray-500 mt-2">This page will be implemented in a future plan.</p>
      <Link to="/" className="mt-4 inline-block text-blue-600 underline">
        ← Return to Catalog
      </Link>
    </main>
  );
}

function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        {/* Search route — implemented by Plan 10 */}
        <Route path="/search" element={<SearchPage />} />

        {/* Placeholder routes — will be replaced by Plans 09, 11, 12, etc. */}
        <Route path="/" element={<PlaceholderPage title="Innovation Catalog" />} />
        <Route path="/catalog" element={<PlaceholderPage title="Innovation Catalog" />} />
        <Route path="/records/:id" element={<PlaceholderPage title="Record Detail" />} />
        <Route path="/submit-opportunity" element={<PlaceholderPage title="Submit a Mission Problem" />} />
        <Route path="/share-innovation" element={<PlaceholderPage title="Share Your Innovation Work" />} />
        <Route path="*" element={<PlaceholderPage title="Page Not Found" />} />
      </Routes>
    </AppShell>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function TopNav() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30" data-testid="top-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-6">
        {/* Logo / title */}
        <Link to="/catalog" className="text-lg font-bold text-indigo-800 hover:text-indigo-600 whitespace-nowrap">
          TSIO Innovation Hub
        </Link>

        {/* Primary nav links */}
        <nav aria-label="Primary navigation" className="flex items-center gap-4 text-sm font-medium">
          <Link to="/catalog" className="text-gray-700 hover:text-indigo-700" data-testid="nav-catalog">
            Catalog
          </Link>
          <Link to="/submit-opportunity" className="text-gray-700 hover:text-indigo-700" data-testid="nav-submit-opportunity">
            Submit a Mission Problem
          </Link>
          <Link to="/share-innovation" className="text-gray-700 hover:text-indigo-700" data-testid="nav-share-innovation">
            Share Your Innovation Work
          </Link>
        </nav>

        {/* Global search bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 ml-auto" role="search">
          <input
            type="search"
            placeholder="Search innovation records…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 w-56 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            aria-label="Search innovation records"
            data-testid="global-search-input"
          />
          <button
            type="submit"
            className="text-gray-500 hover:text-indigo-700"
            aria-label="Submit search"
            data-testid="global-search-submit"
          >
            🔍
          </button>
        </form>
      </div>
    </header>
  );
}

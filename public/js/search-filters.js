/**
 * Search filter client-side logic — progressive enhancement
 *
 * URL is the source of truth for all search state (US-1.2 bookmarkability).
 * Filter changes update the URL and navigate (standard form submit, no AJAX).
 * This script adds convenience helpers for chip removal and the global search bar.
 */

'use strict';

/**
 * Submit the filter form immediately.
 * Called on checkbox/radio onchange to navigate to updated URL.
 */
function submitFilterForm() {
  const form = document.getElementById('filter-form');
  if (form) form.submit();
}

/**
 * Remove a single filter value from the current URL and navigate.
 * Called from filter chip × buttons.
 *
 * @param {string} paramName  - 'maturity_level' | 'review_status' | 'reuse_potential'
 * @param {string} paramValue - the value to remove
 */
function removeFilter(paramName, paramValue) {
  const params = new URLSearchParams(window.location.search);

  if (paramName === 'reuse_potential') {
    params.delete('reuse_potential');
  } else {
    // Multi-value params — remove only the specific value
    const existing = params.getAll(paramName);
    params.delete(paramName);
    existing
      .filter(function(v) { return v !== paramValue; })
      .forEach(function(v) { params.append(paramName, v); });
  }

  // Always reset to page 1 when filter changes
  params.delete('page');

  window.location.href = '/search?' + params.toString();
}

/**
 * Clear all filters (preserve query).
 * Called from "Clear all filters" and "Clear Filters" buttons.
 */
function clearAllFilters() {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');

  const next = new URLSearchParams();
  if (q) next.set('q', q);

  window.location.href = '/search?' + next.toString();
}

/**
 * Pre-fill the global search input in the top nav with the current query
 * when the user is on the /search page.
 */
(function prefillSearchBar() {
  const searchInput = document.getElementById('global-search-input');
  if (!searchInput) return;

  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q && !searchInput.value) {
    searchInput.value = q;
  }
})();

/**
 * catalog.js — Client-side catalog interactivity
 *
 * Handles:
 * - Filter changes → fetch() GET /api/v1/catalog → re-render card grid (no page reload)
 * - Sort changes → fetch() and re-render
 * - Pagination → updates URL and re-renders
 * - Active filter chips with per-chip remove (×)
 * - Clear All Filters
 * - URL state persistence (all filters, sort, page in search params)
 * - aria-live region for screen reader announcements (WCAG 2.1 AA)
 */

'use strict';

(function () {
  // ─── Constants ──────────────────────────────────────────────────────────────

  const API_BASE = '/api/v1';
  const PAGE_SIZE = 12;

  const MATURITY_LABELS = {
    IDEA: 'Idea',
    EXPERIMENT_POC: 'Experiment / POC',
    PROTOTYPE_PILOT: 'Prototype / Pilot',
    PRODUCTION_VALIDATED: 'Production / Validated Pattern',
    ARCHIVED: 'Archived',
  };

  const REVIEW_STATUS_LABELS = {
    SUBMITTED: 'Submitted',
    CURATED: 'Curated',
    TECHNICALLY_REVIEWED: 'Technically Reviewed',
    SECURITY_REVIEWED: 'Security Reviewed',
    POLICY_REVIEWED: 'Policy Reviewed',
    VALIDATED_FOR_REUSE: 'Validated for Reuse',
    SUPERSEDED_RETIRED: 'Superseded / Retired',
  };

  const MATURITY_CLASS_MAP = {
    IDEA: 'badge--maturity-idea',
    EXPERIMENT_POC: 'badge--maturity-experiment',
    PROTOTYPE_PILOT: 'badge--maturity-prototype',
    PRODUCTION_VALIDATED: 'badge--maturity-production',
    ARCHIVED: 'badge--maturity-archived',
  };

  const ENGAGEMENT_LABELS = {
    REQUEST_DEMO: 'Demo Available',
    REQUEST_ADOPTION_DISCUSSION: 'Adoption Discussion',
    REQUEST_TECHNICAL_GUIDANCE: 'Technical Guidance',
    REQUEST_BRIEFING: 'Briefing Available',
  };

  const ENGAGEMENT_ICONS = {
    REQUEST_DEMO: '📋',
    REQUEST_ADOPTION_DISCUSSION: '💬',
    REQUEST_TECHNICAL_GUIDANCE: '🔧',
    REQUEST_BRIEFING: '📊',
  };

  // ─── State ───────────────────────────────────────────────────────────────────

  /**
   * Read current filter state from URL search params.
   * @returns {object} FilterState
   */
  function getFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);
    return {
      maturity_level: params.getAll('maturity_level'),
      review_status: params.getAll('review_status'),
      contributing_office: params.getAll('contributing_office'),
      mission_area: params.getAll('mission_area'),
      technology_area: params.getAll('technology_area'),
      reuse_potential: params.get('reuse_potential') || '',
      sort: params.get('sort') || 'recent',
      page: parseInt(params.get('page') || '1', 10) || 1,
    };
  }

  /**
   * Write filter state back into URL (pushState — adds history entry for bookmarkability).
   * @param {object} filters
   */
  function pushFiltersToURL(filters) {
    const params = new URLSearchParams();
    (filters.maturity_level || []).forEach(v => params.append('maturity_level', v));
    (filters.review_status || []).forEach(v => params.append('review_status', v));
    (filters.contributing_office || []).forEach(v => params.append('contributing_office', v));
    (filters.mission_area || []).forEach(v => params.append('mission_area', v));
    (filters.technology_area || []).forEach(v => params.append('technology_area', v));
    if (filters.reuse_potential) params.set('reuse_potential', filters.reuse_potential);
    if (filters.sort && filters.sort !== 'recent') params.set('sort', filters.sort);
    if (filters.page && filters.page > 1) params.set('page', String(filters.page));

    const newSearch = params.toString() ? '?' + params.toString() : window.location.pathname;
    const newURL = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.pushState({ filters }, '', newURL);
  }

  // ─── API ────────────────────────────────────────────────────────────────────

  /**
   * Fetch catalog data from API.
   * @param {object} filters
   * @returns {Promise<{data: CatalogCard[], pagination: object}>}
   */
  async function fetchCatalog(filters) {
    const params = new URLSearchParams();
    (filters.maturity_level || []).forEach(v => params.append('maturity_level', v));
    (filters.review_status || []).forEach(v => params.append('review_status', v));
    (filters.contributing_office || []).forEach(v => params.append('contributing_office', v));
    (filters.mission_area || []).forEach(v => params.append('mission_area', v));
    (filters.technology_area || []).forEach(v => params.append('technology_area', v));
    if (filters.reuse_potential) params.set('reuse_potential', filters.reuse_potential);
    params.set('sort', filters.sort || 'recent');
    params.set('page', String(filters.page || 1));
    params.set('page_size', String(PAGE_SIZE));

    const res = await fetch(`${API_BASE}/catalog?${params.toString()}`);
    if (!res.ok) throw new Error(`Catalog request failed: ${res.status}`);
    return res.json();
  }

  // ─── Rendering ──────────────────────────────────────────────────────────────

  /**
   * Escape HTML special characters to prevent XSS.
   * @param {string} str
   * @returns {string}
   */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Render a single CatalogCard to HTML string.
   * @param {object} card
   * @returns {string} HTML
   */
  function renderCard(card) {
    const summary = card.short_summary
      ? (card.short_summary.length > 280 ? card.short_summary.slice(0, 277) + '…' : card.short_summary)
      : null;

    const publishedDate = card.published_at
      ? new Date(card.published_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : null;

    const maturityClass = MATURITY_CLASS_MAP[card.maturity_level] || 'badge--maturity-idea';
    const maturityLabel = escHtml(card.maturity_label || MATURITY_LABELS[card.maturity_level] || card.maturity_level);

    // Badges
    let badgesHtml = `
      <span
        class="badge badge--maturity ${escHtml(maturityClass)}"
        aria-label="Maturity: ${maturityLabel}"
        data-testid="maturity-badge"
        data-maturity="${escHtml(card.maturity_level)}"
      >
        <span aria-hidden="true">●</span>
        ${maturityLabel}
      </span>
      <span
        class="badge badge--review-status"
        aria-label="Review status: ${escHtml(card.review_status_label || REVIEW_STATUS_LABELS[card.review_status] || card.review_status)}"
        data-testid="review-status-badge"
        data-review-status="${escHtml(card.review_status)}"
      >${escHtml(card.review_status_label || REVIEW_STATUS_LABELS[card.review_status] || card.review_status)}</span>
    `;

    if (card.is_community_contributed) {
      badgesHtml += `
        <span
          class="badge badge--community"
          aria-label="Community-contributed record"
          data-testid="community-badge"
        >COMMUNITY</span>
      `;
    }

    if (card.is_validated_for_reuse) {
      badgesHtml += `
        <span
          class="badge badge--reuse"
          aria-label="Validated for Reuse"
          data-testid="reuse-badge"
        >✓ Validated for Reuse</span>
      `;
    }

    // Tags
    let tagsHtml = '';
    const allTags = [...(card.mission_area_tags || []), ...(card.technology_area_tags || [])];
    if (allTags.length > 0) {
      tagsHtml = `
        <div class="catalog-card__tags" aria-label="Tags">
          ${allTags.map(tag => `<span class="tag">🏷 ${escHtml(tag)}</span>`).join('')}
        </div>
      `;
    }

    // Engagement options
    let engagementHtml = '';
    if (card.engagement_options && card.engagement_options.length > 0) {
      engagementHtml = `
        <div class="catalog-card__engagement" aria-label="Available engagement options">
          ${card.engagement_options.map(opt =>
            `<span class="engagement-indicator">${escHtml(ENGAGEMENT_ICONS[opt] || '')} ${escHtml(ENGAGEMENT_LABELS[opt] || opt)}</span>`
          ).join('')}
        </div>
      `;
    }

    // Footer
    const dateHtml = publishedDate ? `<span class="catalog-card__date">${escHtml(publishedDate)}</span>` : '';
    const footerHtml = `
      <div class="catalog-card__footer">
        ${dateHtml}
        <a
          href="/records/${escHtml(card.record_id)}"
          class="catalog-card__view-link"
          aria-label="View record: ${escHtml(card.title)}"
          data-testid="view-record-link"
        >View Record →</a>
      </div>
    `;

    return `
      <article
        class="catalog-card"
        data-testid="catalog-card"
        data-record-id="${escHtml(card.record_id)}"
      >
        <div class="catalog-card__badges">${badgesHtml}</div>
        <h3 class="catalog-card__title">${escHtml(card.title)}</h3>
        ${summary ? `<p class="catalog-card__summary">${escHtml(summary)}</p>` : ''}
        ${tagsHtml}
        ${engagementHtml}
        ${footerHtml}
      </article>
    `;
  }

  /**
   * Render empty state HTML.
   * @param {boolean} hasActiveFilters
   * @returns {string} HTML
   */
  function renderEmptyState(hasActiveFilters) {
    const filterHelp = hasActiveFilters ? `
      <p class="catalog-empty-state__message">No records match your current filters.</p>
      <ul class="catalog-empty-state__suggestions">
        <li>Clearing one or more filters</li>
        <li>Searching with a keyword</li>
      </ul>
    ` : `
      <p class="catalog-empty-state__message">No published innovation records are available yet.</p>
    `;

    return `
      <div class="catalog-empty-state" data-testid="catalog-empty-state" role="status">
        <span class="catalog-empty-state__icon" aria-hidden="true">📭</span>
        <h2 class="catalog-empty-state__title">No records found</h2>
        ${filterHelp}
        <p class="catalog-empty-state__cta-text">Can't find work on a problem your court is facing?</p>
        <a
          href="/submit-opportunity"
          class="catalog-empty-state__cta"
          data-testid="empty-state-submit-cta"
        >Submit a Mission Problem for I&amp;R Consideration →</a>
      </div>
    `;
  }

  /**
   * Render pagination HTML.
   * @param {number} currentPage
   * @param {number} totalPages
   * @returns {string} HTML
   */
  function renderPagination(currentPage, totalPages) {
    if (totalPages <= 1) return '';

    const pages = [];
    for (let p = 1; p <= Math.min(totalPages, 7); p++) pages.push(p);

    const prevDisabled = currentPage <= 1 ? 'disabled' : '';
    const nextDisabled = currentPage >= totalPages ? 'disabled' : '';

    const pageButtons = pages.map(p => {
      const activeClass = p === currentPage ? 'pagination__btn--active' : '';
      const ariaCurrent = p === currentPage ? 'aria-current="page"' : '';
      return `
        <button
          class="pagination__btn ${activeClass}"
          data-testid="pagination-page-${p}"
          data-page="${p}"
          aria-label="Page ${p}"
          ${ariaCurrent}
        >${p}</button>
      `;
    }).join('');

    return `
      <button
        class="pagination__btn"
        data-testid="pagination-prev"
        data-page="${currentPage - 1}"
        ${prevDisabled}
        aria-label="Previous page"
      >← Previous</button>
      ${pageButtons}
      <button
        class="pagination__btn"
        data-testid="pagination-next"
        data-page="${currentPage + 1}"
        ${nextDisabled}
        aria-label="Next page"
      >Next →</button>
    `;
  }

  /**
   * Render active filter chips HTML.
   * @param {object} filters
   * @returns {string} HTML
   */
  function renderFilterChips(filters) {
    const chips = [];

    (filters.maturity_level || []).forEach(level => {
      chips.push({ label: MATURITY_LABELS[level] || level, filter: 'maturity_level', value: level });
    });
    (filters.review_status || []).forEach(status => {
      chips.push({ label: REVIEW_STATUS_LABELS[status] || status, filter: 'review_status', value: status });
    });
    (filters.contributing_office || []).forEach(office => {
      chips.push({ label: office, filter: 'contributing_office', value: office });
    });
    (filters.mission_area || []).forEach(tag => {
      chips.push({ label: tag, filter: 'mission_area', value: tag });
    });
    (filters.technology_area || []).forEach(tag => {
      chips.push({ label: tag, filter: 'technology_area', value: tag });
    });
    if (filters.reuse_potential) {
      chips.push({
        label: 'Reuse: ' + filters.reuse_potential.charAt(0) + filters.reuse_potential.slice(1).toLowerCase(),
        filter: 'reuse_potential',
        value: filters.reuse_potential,
      });
    }

    if (chips.length === 0) return '';

    const chipsHtml = chips.map(chip => `
      <span class="filter-chip" data-testid="filter-chip" data-filter="${escHtml(chip.filter)}" data-value="${escHtml(chip.value)}">
        ${escHtml(chip.label)}
        <button
          type="button"
          class="filter-chip__remove"
          aria-label="Remove filter: ${escHtml(chip.label)}"
          data-remove-filter="${escHtml(chip.filter)}"
          data-remove-value="${escHtml(chip.value)}"
        >×</button>
      </span>
    `).join('');

    return `
      <span class="active-filters-label" aria-hidden="true">Active filters:</span>
      <div class="filter-chips" id="filter-chips">
        ${chipsHtml}
        <button type="button" class="btn-clear-filters-bar" data-testid="clear-all-filters-bar">
          Clear all filters
        </button>
      </div>
    `;
  }

  // ─── Main Controller ─────────────────────────────────────────────────────────

  /** @type {AbortController|null} */
  let currentRequest = null;

  /**
   * Apply new filter state: update URL, fetch data, re-render.
   * @param {object} newFilters
   */
  async function applyFilters(newFilters) {
    // Cancel any in-flight request
    if (currentRequest) {
      currentRequest.abort();
    }
    currentRequest = new AbortController();

    // Push new state to URL so it's bookmarkable
    pushFiltersToURL(newFilters);

    // Update filter panel checkboxes/radios to reflect current state
    syncFilterUI(newFilters);

    // Show loading state
    showLoading(true);

    try {
      const data = await fetchCatalogWithSignal(newFilters, currentRequest.signal);
      if (!data) return; // aborted

      // Update result count (aria-live region — announces to screen readers)
      updateResultCount(data.pagination.total_count, newFilters);

      // Re-render card grid
      renderCatalogGrid(data.data, newFilters);

      // Re-render pagination
      renderPaginationControls(data.pagination.page, data.pagination.total_pages);

      // Update active filter bar
      updateActiveFilterBar(newFilters);

    } catch (err) {
      if (err.name === 'AbortError') return;
      showError(true);
      console.error('Catalog fetch error:', err);
    } finally {
      showLoading(false);
    }
  }

  /**
   * Fetch catalog with AbortController signal support.
   * @param {object} filters
   * @param {AbortSignal} signal
   */
  async function fetchCatalogWithSignal(filters, signal) {
    const params = new URLSearchParams();
    (filters.maturity_level || []).forEach(v => params.append('maturity_level', v));
    (filters.review_status || []).forEach(v => params.append('review_status', v));
    (filters.contributing_office || []).forEach(v => params.append('contributing_office', v));
    (filters.mission_area || []).forEach(v => params.append('mission_area', v));
    (filters.technology_area || []).forEach(v => params.append('technology_area', v));
    if (filters.reuse_potential) params.set('reuse_potential', filters.reuse_potential);
    params.set('sort', filters.sort || 'recent');
    params.set('page', String(filters.page || 1));
    params.set('page_size', String(PAGE_SIZE));

    const res = await fetch(`${API_BASE}/catalog?${params.toString()}`, { signal });
    if (!res.ok) throw new Error(`Catalog request failed: ${res.status}`);
    return res.json();
  }

  // ─── DOM Helpers ─────────────────────────────────────────────────────────────

  function showLoading(show) {
    const el = document.getElementById('catalog-loading');
    if (el) el.hidden = !show;
    const grid = document.getElementById('catalog-grid-container');
    if (grid && show) {
      // Hide content area during loading
      const existingGrid = grid.querySelector('.catalog-grid');
      const existingEmpty = grid.querySelector('.catalog-empty-state');
      if (existingGrid) existingGrid.style.visibility = 'hidden';
      if (existingEmpty) existingEmpty.style.visibility = 'hidden';
    }
  }

  function showError(show) {
    const el = document.getElementById('catalog-error');
    if (el) el.hidden = !show;
  }

  /**
   * Update the aria-live result count span.
   * @param {number} count
   * @param {object} filters
   */
  function updateResultCount(count, filters) {
    const el = document.getElementById('result-count');
    if (!el) return;
    const hasActive = hasActiveFilters(filters);
    el.textContent = `Showing ${count} record${count !== 1 ? 's' : ''}${hasActive ? ' (filters applied)' : ''}`;
  }

  /**
   * Check if any filters are active.
   * @param {object} filters
   * @returns {boolean}
   */
  function hasActiveFilters(filters) {
    return (
      (filters.maturity_level || []).length > 0 ||
      (filters.review_status || []).length > 0 ||
      (filters.contributing_office || []).length > 0 ||
      (filters.mission_area || []).length > 0 ||
      (filters.technology_area || []).length > 0 ||
      Boolean(filters.reuse_potential)
    );
  }

  /**
   * Re-render the catalog card grid.
   * @param {object[]} cards
   * @param {object} filters
   */
  function renderCatalogGrid(cards, filters) {
    showError(false);
    const container = document.getElementById('catalog-grid-container');
    if (!container) return;

    if (cards.length === 0) {
      container.innerHTML = renderEmptyState(hasActiveFilters(filters));
    } else {
      container.innerHTML = `
        <div class="catalog-grid" data-testid="catalog-grid" id="catalog-grid">
          ${cards.map(renderCard).join('')}
        </div>
      `;
    }
  }

  /**
   * Re-render pagination controls.
   * @param {number} currentPage
   * @param {number} totalPages
   */
  function renderPaginationControls(currentPage, totalPages) {
    let nav = document.getElementById('pagination');
    if (!nav) {
      nav = document.createElement('nav');
      nav.id = 'pagination';
      nav.className = 'pagination';
      nav.setAttribute('aria-label', 'Catalog pagination');
      nav.setAttribute('data-testid', 'pagination');
      const main = document.querySelector('.catalog-main');
      if (main) main.appendChild(nav);
    }

    if (totalPages <= 1) {
      nav.hidden = true;
      return;
    }

    nav.hidden = false;
    nav.innerHTML = renderPagination(currentPage, totalPages);

    // Add click handlers for pagination buttons
    nav.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', function () {
        if (this.disabled) return;
        const page = parseInt(this.getAttribute('data-page'), 10);
        if (isNaN(page) || page < 1) return;
        const filters = getFiltersFromURL();
        applyFilters({ ...filters, page });
      });
    });
  }

  /**
   * Update the active filter bar with current chips.
   * @param {object} filters
   */
  function updateActiveFilterBar(filters) {
    const bar = document.getElementById('active-filter-bar');
    if (!bar) return;

    // Keep the result count span; rebuild filter chips area
    const countEl = document.getElementById('result-count');
    const chipsHtml = renderFilterChips(filters);

    // Remove old chips container and clear-all button
    bar.querySelectorAll('.active-filters-label, .filter-chips').forEach(el => el.remove());

    if (chipsHtml) {
      bar.insertAdjacentHTML('beforeend', chipsHtml);

      // Wire up chip remove buttons
      bar.querySelectorAll('[data-remove-filter]').forEach(btn => {
        btn.addEventListener('click', function () {
          const filterKey = this.getAttribute('data-remove-filter');
          const filterValue = this.getAttribute('data-remove-value');
          removeFilter(filterKey, filterValue);
        });
      });

      // Wire up clear-all button in bar
      const clearAllBar = bar.querySelector('[data-testid="clear-all-filters-bar"]');
      if (clearAllBar) {
        clearAllBar.addEventListener('click', clearAllFilters);
      }
    }
  }

  /**
   * Sync the filter panel UI (checkboxes, radios, sort select) to match current filter state.
   * @param {object} filters
   */
  function syncFilterUI(filters) {
    // Checkboxes
    document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
      const filterKey = checkbox.getAttribute('data-filter');
      const value = checkbox.value;
      if (filterKey && filters[filterKey]) {
        checkbox.checked = Array.isArray(filters[filterKey])
          ? filters[filterKey].includes(value)
          : filters[filterKey] === value;
      }
    });

    // Radio buttons
    document.querySelectorAll('.filter-radio').forEach(radio => {
      radio.checked = radio.value === (filters.reuse_potential || '');
    });

    // Sort select
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = filters.sort || 'recent';
  }

  // ─── Filter Mutation Helpers ─────────────────────────────────────────────────

  /**
   * Remove a single filter value.
   * @param {string} filterKey
   * @param {string} value
   */
  function removeFilter(filterKey, value) {
    const filters = getFiltersFromURL();

    if (filterKey === 'reuse_potential') {
      filters.reuse_potential = '';
    } else if (Array.isArray(filters[filterKey])) {
      filters[filterKey] = filters[filterKey].filter(v => v !== value);
    }

    filters.page = 1;
    applyFilters(filters);
  }

  /**
   * Clear all active filters (keep sort).
   */
  function clearAllFilters() {
    const filters = getFiltersFromURL();
    applyFilters({
      maturity_level: [],
      review_status: [],
      contributing_office: [],
      mission_area: [],
      technology_area: [],
      reuse_potential: '',
      sort: filters.sort || 'recent',
      page: 1,
    });
  }

  // ─── Event Wiring ─────────────────────────────────────────────────────────────

  /**
   * Wire up all interactive controls on DOMContentLoaded.
   */
  function init() {
    // ── Filter checkboxes ──────────────────────────────────────────────────────
    document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', function () {
        const filterKey = this.getAttribute('data-filter');
        if (!filterKey) return;
        const filters = getFiltersFromURL();
        const current = Array.isArray(filters[filterKey]) ? filters[filterKey] : [];
        if (this.checked) {
          filters[filterKey] = [...current, this.value];
        } else {
          filters[filterKey] = current.filter(v => v !== this.value);
        }
        filters.page = 1;
        applyFilters(filters);
      });
    });

    // ── Reuse potential radios ────────────────────────────────────────────────
    document.querySelectorAll('.filter-radio').forEach(radio => {
      radio.addEventListener('change', function () {
        const filters = getFiltersFromURL();
        filters.reuse_potential = this.value;
        filters.page = 1;
        applyFilters(filters);
      });
    });

    // ── Sort select ───────────────────────────────────────────────────────────
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', function () {
        const filters = getFiltersFromURL();
        filters.sort = this.value;
        filters.page = 1;
        applyFilters(filters);
      });
    }

    // ── Clear all filters button (panel sidebar) ──────────────────────────────
    const clearAllBtn = document.getElementById('clear-all-filters');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', clearAllFilters);
    }

    // ── Server-rendered filter chips: remove buttons ──────────────────────────
    document.querySelectorAll('[data-filter-chip]').forEach(chip => {
      const removeBtn = chip.querySelector('.filter-chip__remove');
      if (removeBtn) {
        removeBtn.addEventListener('click', function () {
          const filterKey = chip.getAttribute('data-filter');
          const value = chip.getAttribute('data-value');
          if (filterKey && value !== null) removeFilter(filterKey, value);
        });
      }
    });

    // Wire remove buttons from server-rendered chips (no data-filter-chip attr used in EJS)
    document.querySelectorAll('.filter-chip .filter-chip__remove').forEach(btn => {
      btn.addEventListener('click', function () {
        const chip = this.closest('.filter-chip');
        if (!chip) return;
        const filterKey = chip.getAttribute('data-filter');
        const value = chip.getAttribute('data-value');
        if (filterKey && value !== null) removeFilter(filterKey, value);
      });
    });

    // ── Server-rendered clear-all-filters-bar button ──────────────────────────
    const clearAllBarBtn = document.querySelector('[data-testid="clear-all-filters-bar"]');
    if (clearAllBarBtn) {
      clearAllBarBtn.addEventListener('click', clearAllFilters);
    }

    // ── Pagination buttons (server-rendered) ──────────────────────────────────
    document.querySelectorAll('#pagination [data-page]').forEach(btn => {
      btn.addEventListener('click', function () {
        if (this.disabled) return;
        const page = parseInt(this.getAttribute('data-page'), 10);
        if (isNaN(page) || page < 1) return;
        const filters = getFiltersFromURL();
        applyFilters({ ...filters, page });
      });
    });

    // ── Browser back/forward (popstate) ──────────────────────────────────────
    window.addEventListener('popstate', function () {
      const filters = getFiltersFromURL();
      syncFilterUI(filters);
      // Re-fetch on popstate to restore correct results
      fetchCatalogWithSignal(filters, new AbortController().signal)
        .then(data => {
          updateResultCount(data.pagination.total_count, filters);
          renderCatalogGrid(data.data, filters);
          renderPaginationControls(data.pagination.page, data.pagination.total_pages);
          updateActiveFilterBar(filters);
        })
        .catch(err => {
          if (err.name !== 'AbortError') console.error('popstate fetch error:', err);
        });
    });
  }

  // ─── Bootstrap ───────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

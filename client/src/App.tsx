import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CatalogPage } from './pages/CatalogPage';
import { RecordPage } from './pages/RecordPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SearchPage } from './pages/SearchPage';
import { SubmitOpportunityPage } from './pages/SubmitOpportunityPage';
import { SubmitOpportunityConfirmationPage } from './pages/SubmitOpportunityConfirmationPage';
import { ShareInnovationPage } from './pages/ShareInnovationPage';
import { ShareInnovationConfirmationPage } from './pages/ShareInnovationConfirmationPage';
import { AdminApp } from './admin/AdminApp';

// Wave 4 full route map:
// Plan 09 (Wave 4a): CatalogPage at / and /catalog
// Plan 10 (Wave 4b): SearchPage at /search
// Plan 11 (Wave 4c): RecordPage at /records/:id
// Wave 5a routes:
// Plan 12 (Wave 5a): SubmitOpportunityPage at /submit-opportunity
// Plan 12 (Wave 5a): ShareInnovationPage at /share-innovation
// Wave 6a routes:
// Plan 14 (Wave 6a): AdminApp at /admin/* — full admin interface with auth gate

// AdminRoot — renders AdminApp for /admin/* routes.
// AdminApp has its own <Routes> handling all /admin/* sub-routes.
function AdminRoot() {
  return <AdminApp />;
}

const App: React.FC = () => (
  <Routes>
    {/* F0: Innovation Catalog — implemented by Plan 09 (Wave 4a) */}
    <Route path="/" element={<Navigate to="/catalog" replace />} />
    <Route path="/catalog" element={<CatalogPage />} />

    {/* F1: Search — implemented by Plan 10 (Wave 4b) */}
    <Route path="/search" element={<SearchPage />} />

    {/* F2: Record Detail — implemented by Plan 11 (Wave 4c) */}
    <Route path="/records/:id" element={<RecordPage />} />

    {/* F5: Opportunity Submission — implemented by Plan 12 (Wave 5a) */}
    <Route path="/submit-opportunity" element={<SubmitOpportunityPage />} />
    <Route path="/submit-opportunity/confirmation" element={<SubmitOpportunityConfirmationPage />} />

    {/* F6: Share Innovation — implemented by Plan 12 (Wave 5a) */}
    <Route path="/share-innovation" element={<ShareInnovationPage />} />
    <Route path="/share-innovation/confirmation" element={<ShareInnovationConfirmationPage />} />

    {/* F8: Administration — Wave 6a (Plan 14): full admin interface */}
    <Route path="/admin/*" element={<AdminRoot />} />

    {/* 404 fallback */}
    <Route path="*" element={<NotFoundPage message="Page not found." />} />
  </Routes>
);

export default App;

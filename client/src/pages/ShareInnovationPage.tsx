// src/pages/ShareInnovationPage.tsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ShareInnovationForm } from '../components/forms/ShareInnovationForm';

/**
 * Route: /share-innovation
 * Reached from: Top nav "Share Your Innovation Work" link, Catalog page CTA.
 * Per UX Mockup Screen 05 and Navigation Map.
 */
export const ShareInnovationPage: React.FC = () => {
  const navigate = useNavigate();

  function handleSuccess() {
    navigate('/share-innovation/confirmation');
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <nav aria-label="Breadcrumb" className="mb-6">
          <Link to="/catalog" className="text-blue-700 hover:underline text-sm">
            ← Back to Catalog
          </Link>
        </nav>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Share Your Innovation Work</h1>
          <p className="text-sm text-gray-600 mb-6">
            Has your court or team done innovation work that could benefit the broader Judiciary?
            Submit it here for I&R curation review.
          </p>
          <ShareInnovationForm onSuccess={handleSuccess} />
        </div>
      </div>
    </AppShell>
  );
};

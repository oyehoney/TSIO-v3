// src/client/pages/SubmitOpportunityPage.tsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { OpportunitySubmissionForm } from '../components/forms/OpportunitySubmissionForm';

/**
 * Route: /submit-opportunity
 * Reached from: Top nav "Submit a Mission Problem" link, catalog empty state CTA,
 *               search empty state CTA, Innovation Record page CTA.
 * Per UX Mockup Screen 04 and Navigation Map.
 */
export const SubmitOpportunityPage: React.FC = () => {
  const navigate = useNavigate();

  function handleSuccess() {
    navigate('/submit-opportunity/confirmation');
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link to="/catalog" className="text-blue-700 hover:underline text-sm">
          ← Back to Catalog
        </Link>
      </nav>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Submit a Mission Problem</h1>
        <p className="text-sm text-gray-600 mb-6">
          Help the I&R team understand the mission challenges your court or organization is facing.
          Submissions are reviewed by the I&R team for future consideration.
        </p>
        <OpportunitySubmissionForm onSuccess={handleSuccess} />
      </div>
    </main>
  );
};

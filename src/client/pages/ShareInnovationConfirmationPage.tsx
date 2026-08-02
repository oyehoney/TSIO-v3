// src/client/pages/ShareInnovationConfirmationPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Route: /share-innovation/confirmation
 * Reached from: ShareInnovationForm on 201 response.
 * Per UX Mockup Screen 05 Layout — Confirmation Page.
 * Contains: 4-step curation process, attribution notice, "Return to Catalog" CTA.
 */
export const ShareInnovationConfirmationPage: React.FC = () => {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4" aria-hidden="true">✅</div>
          <h1 className="text-xl font-semibold text-gray-900">Your submission has been received.</h1>
        </div>

        <p className="text-sm text-gray-700 mb-4">
          The I&R team will review your submission for potential curation. Here is what happens next:
        </p>

        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 mb-6 pl-4">
          <li>I&R curators review your materials</li>
          <li>A curator may contact you for additional context</li>
          <li>If accepted, a curator will create and enrich a structured Innovation Record</li>
          <li>You will be contacted before any record is published</li>
        </ol>

        <hr className="border-gray-200 mb-4" />

        {/* Attribution and governance notice */}
        <div className="bg-amber-50 border border-amber-300 rounded-md p-4 text-left mb-6">
          <p className="text-sm text-amber-800">
            This submission <strong>does not guarantee publication.</strong>{' '}
            If your work is published, your team will receive <strong>named attribution</strong>.
          </p>
        </div>

        <hr className="border-gray-200 mb-6" />

        <div className="text-center">
          <Link
            to="/catalog"
            className="inline-block bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-md text-sm transition-colors"
          >
            Return to Innovation Catalog
          </Link>
        </div>
      </div>
    </main>
  );
};

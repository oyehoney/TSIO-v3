// src/client/pages/SubmitOpportunityConfirmationPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Route: /submit-opportunity/confirmation
 * Reached from: OpportunitySubmissionForm on 201 response via navigate().
 * Per UX Mockup Screen 04 Layout — Confirmation Page.
 * GOVERNANCE CRITICAL: Must contain "does not imply acceptance" language — do not alter or soften.
 */
export const SubmitOpportunityConfirmationPage: React.FC = () => {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm text-center">
        <div className="text-4xl mb-4" aria-hidden="true">✅</div>

        <h1 className="text-xl font-semibold text-gray-900 mb-3">Your submission has been received.</h1>

        <p className="text-sm text-gray-700 mb-6">
          Thank you for taking the time to describe this mission problem. Your input helps I&R prioritize future exploration.
        </p>

        <hr className="border-gray-200 mb-4" />

        {/* Non-commitment language — governance-critical, do not modify */}
        <div className="bg-amber-50 border border-amber-300 rounded-md p-4 text-left mb-6">
          <p className="text-sm text-amber-900 font-semibold mb-1">Important</p>
          <p className="text-sm text-amber-800">
            This submission <strong>does not imply acceptance</strong> of the opportunity into the I&R portfolio or
            a commitment to begin a project or establish a timeline.
          </p>
          <p className="text-sm text-amber-800 mt-2">
            The I&R curation team will review your submission. If I&R pursues this opportunity,
            the submitting contact may be engaged for additional context.
          </p>
        </div>

        <hr className="border-gray-200 mb-6" />

        <p className="text-sm text-gray-500 mb-6">
          A confirmation may have been sent to the email address you provided.
        </p>

        <Link
          to="/catalog"
          className="inline-block bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-md text-sm transition-colors"
        >
          Return to Innovation Catalog
        </Link>
      </div>
    </main>
  );
};

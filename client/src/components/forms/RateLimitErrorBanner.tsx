// src/components/forms/RateLimitErrorBanner.tsx
import React from 'react';

interface RateLimitErrorBannerProps {
  retryAfterSeconds?: number;
}

/**
 * Rate limit error banner shown when the API returns 429 RATE_LIMIT_EXCEEDED.
 * Per UX mockup Screen 05 states: "Too many submissions from this location. Please try again later."
 */
export const RateLimitErrorBanner: React.FC<RateLimitErrorBannerProps> = ({ retryAfterSeconds }) => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-red-50 border border-red-300 rounded-md p-4 flex items-start gap-3"
    >
      <span className="text-red-600 text-lg flex-shrink-0" aria-hidden="true">⚠</span>
      <div>
        <p className="text-red-800 font-semibold text-sm">Too many submissions</p>
        <p className="text-red-700 text-sm mt-1">
          Too many submissions from this location. Please try again later.
          {retryAfterSeconds && retryAfterSeconds > 0 && (
            <span> You may try again in approximately {Math.ceil(retryAfterSeconds / 60)} minute{Math.ceil(retryAfterSeconds / 60) !== 1 ? 's' : ''}.</span>
          )}
        </p>
      </div>
    </div>
  );
};

// src/client/components/forms/ArtifactUrlFields.tsx
import React from 'react';

interface ArtifactUrlFieldsProps {
  urls: string[];
  onChange: (urls: string[]) => void;
  errors?: string[];
}

const MAX_URLS = 5;

function isValidHttpsUrl(value: string): boolean {
  if (!value.trim()) return true; // empty optional fields are valid (URL 1 required separately)
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Dynamic artifact URL input list.
 * URL 1: always visible, required (min 1).
 * URLs 2–5: revealed by "+ Add another artifact URL" button, optional, but once added must be valid https://.
 * Per UX Mockup Screen 05 — Artifact Links section.
 */
export const ArtifactUrlFields: React.FC<ArtifactUrlFieldsProps> = ({ urls, onChange, errors }) => {
  // visibleCount tracks how many URL fields have been added (min 1)
  const [visibleCount, setVisibleCount] = React.useState(Math.max(1, urls.length));
  const [touched, setTouched] = React.useState<boolean[]>(new Array(MAX_URLS).fill(false));

  function handleUrlChange(index: number, value: string) {
    const updated = [...urls];
    // Ensure array is long enough
    while (updated.length <= index) updated.push('');
    updated[index] = value;
    onChange(updated);
  }

  function handleAddUrl() {
    if (visibleCount < MAX_URLS) {
      setVisibleCount(prev => prev + 1);
    }
  }

  function handleBlur(index: number) {
    setTouched(prev => {
      const updated = [...prev];
      updated[index] = true;
      return updated;
    });
  }

  return (
    <div>
      {Array.from({ length: visibleCount }, (_, i) => {
        const isRequired = i === 0;
        const value = urls[i] || '';
        const hasError = touched[i] && value.trim() !== '' && !isValidHttpsUrl(value);
        const missingRequired = touched[i] && isRequired && !value.trim();
        const externalError = errors?.[i];
        const showError = hasError || missingRequired || externalError;

        return (
          <div key={i} className="mb-3">
            <label htmlFor={`artifact_url_${i}`} className="block text-sm font-medium text-gray-700 mb-1">
              Artifact URL {i + 1}{' '}
              {isRequired
                ? <span aria-label="required" className="text-red-600">*</span>
                : <span className="text-gray-400 font-normal">(optional)</span>
              }
            </label>
            <input
              id={`artifact_url_${i}`}
              name={`artifact_urls[${i}]`}
              type="url"
              value={value}
              placeholder="https://"
              onChange={(e) => handleUrlChange(i, e.target.value)}
              onBlur={() => handleBlur(i)}
              aria-invalid={!!showError}
              aria-describedby={showError ? `artifact_url_${i}_error` : undefined}
              className={`block w-full border rounded-md px-3 py-2 text-sm font-mono ${showError ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {showError && (
              <span id={`artifact_url_${i}_error`} role="alert" className="text-xs text-red-600">
                {missingRequired && 'At least one artifact URL is required.'}
                {hasError && 'Artifact URL must begin with https://'}
                {externalError && !missingRequired && !hasError && externalError}
              </span>
            )}
          </div>
        );
      })}

      {visibleCount < MAX_URLS && (
        <button
          type="button"
          onClick={handleAddUrl}
          className="text-sm text-blue-700 hover:text-blue-900 underline mt-1"
          aria-label={`Add artifact URL ${visibleCount + 1} of ${MAX_URLS}`}
        >
          + Add another artifact URL
        </button>
      )}

      {visibleCount >= MAX_URLS && (
        <p className="text-xs text-gray-500 mt-1">Maximum of {MAX_URLS} artifact URLs reached.</p>
      )}
    </div>
  );
};

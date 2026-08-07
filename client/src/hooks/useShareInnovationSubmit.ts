// src/hooks/useShareInnovationSubmit.ts
import { useState } from 'react';
import type { ContributionSubmissionRequest, SubmissionResponse, SubmissionApiError } from '../types/submissions';

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; data: SubmissionResponse }
  | { status: 'error'; error: SubmissionApiError }
  | { status: 'rate_limited'; retryAfter?: number };

export function useShareInnovationSubmit() {
  const [state, setState] = useState<SubmitState>({ status: 'idle' });

  async function submit(payload: ContributionSubmissionRequest): Promise<boolean> {
    setState({ status: 'submitting' });
    try {
      const res = await fetch('/api/v1/contribution-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 201) {
        const data: SubmissionResponse = await res.json();
        setState({ status: 'success', data });
        return true;
      }

      if (res.status === 429) {
        const retryAfterHeader = res.headers.get('Retry-After');
        setState({ status: 'rate_limited', retryAfter: retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined });
        return false;
      }

      const errorBody = await res.json();
      setState({ status: 'error', error: errorBody.error as SubmissionApiError });
      return false;
    } catch {
      setState({
        status: 'error',
        error: { code: 'VALIDATION_ERROR', message: 'Unable to submit at this time. Please try again or contact the I&R team directly.' },
      });
      return false;
    }
  }

  function reset() { setState({ status: 'idle' }); }

  return { state, submit, reset };
}

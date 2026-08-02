// src/client/hooks/useOpportunitySubmit.ts
import { useState } from 'react';
import type { OpportunitySubmissionRequest, SubmissionResponse, SubmissionApiError } from '../types/submissions';

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; data: SubmissionResponse }
  | { status: 'error'; error: SubmissionApiError }
  | { status: 'rate_limited'; retryAfter?: number };

export function useOpportunitySubmit() {
  const [state, setState] = useState<SubmitState>({ status: 'idle' });

  async function submit(payload: OpportunitySubmissionRequest): Promise<boolean> {
    setState({ status: 'submitting' });
    try {
      const res = await fetch('/api/v1/opportunity-submissions', {
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
        const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;
        setState({ status: 'rate_limited', retryAfter });
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

  function reset() {
    setState({ status: 'idle' });
  }

  return { state, submit, reset };
}

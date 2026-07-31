'use strict';

/**
 * publicationLifecycleService.js
 *
 * State machine enforcement for Innovation Record publication lifecycle.
 * Per TechArch §1.4: DRAFT → REVIEW → PUBLISHED → SUPERSEDED / ARCHIVED
 *
 * Valid transitions:
 *   DRAFT    → REVIEW      (submit-review)
 *   REVIEW   → DRAFT       (return-to-draft)
 *   REVIEW   → PUBLISHED   (publish — governance gate MUST be called first by caller)
 *   PUBLISHED → SUPERSEDED (supersede)
 *   PUBLISHED → ARCHIVED   (archive)
 *   SUPERSEDED → ARCHIVED  (archive)
 *
 * Hard-delete rule: only DRAFT records may be deleted.
 * All other states require lifecycle transitions (no delete).
 */

/**
 * Maps each publication_state to allowed transition action names.
 * Keys are current states; values are arrays of allowed action strings.
 */
const VALID_TRANSITIONS = {
  DRAFT: ['submit-review'],
  REVIEW: ['return-to-draft', 'publish'],
  PUBLISHED: ['supersede', 'archive'],
  SUPERSEDED: ['archive'],
  ARCHIVED: [], // terminal state — no further transitions
};

/**
 * Maps a (currentState, action) pair to the resulting new publication_state.
 * Also carries metadata used by the caller (e.g., whether to set published_at).
 *
 * Returns: { newState: string, setPublishedAt: boolean }
 */
const TRANSITION_MAP = {
  DRAFT: {
    'submit-review': { newState: 'REVIEW', setPublishedAt: false },
  },
  REVIEW: {
    'return-to-draft': { newState: 'DRAFT', setPublishedAt: false },
    publish: { newState: 'PUBLISHED', setPublishedAt: true },
  },
  PUBLISHED: {
    supersede: { newState: 'SUPERSEDED', setPublishedAt: false },
    archive: { newState: 'ARCHIVED', setPublishedAt: false },
  },
  SUPERSEDED: {
    archive: { newState: 'ARCHIVED', setPublishedAt: false },
  },
  ARCHIVED: {},
};

/**
 * Attempt a state transition.
 *
 * @param {string} currentState - Current publication_state of the record.
 * @param {string} targetTransition - Action name (e.g. 'submit-review', 'publish').
 * @returns {{ newState: string, setPublishedAt: boolean }}
 * @throws {{ code: 'INVALID_STATE_TRANSITION', message: string, status: 422 }}
 */
function transition(currentState, targetTransition) {
  const allowed = VALID_TRANSITIONS[currentState];
  if (!allowed) {
    throw {
      code: 'INVALID_STATE_TRANSITION',
      message: `Unknown current state: ${currentState}. Cannot transition.`,
      status: 422,
    };
  }

  if (!allowed.includes(targetTransition)) {
    const allowedStr = allowed.length > 0 ? allowed.join(', ') : '(none — terminal state)';
    throw {
      code: 'INVALID_STATE_TRANSITION',
      message: `Current state: ${currentState}. Allowed transitions: ${allowedStr}. Requested: ${targetTransition}.`,
      status: 422,
    };
  }

  const result = TRANSITION_MAP[currentState][targetTransition];
  return result;
}

/**
 * Whether a record in the given state may be hard-deleted.
 * Per TechArch §1.4 deletion rule: only DRAFT records may be deleted.
 *
 * @param {string} publicationState
 * @returns {boolean}
 */
function canDelete(publicationState) {
  return publicationState === 'DRAFT';
}

module.exports = {
  VALID_TRANSITIONS,
  transition,
  canDelete,
};

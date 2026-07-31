// SearchIndexService: query sanitization and FTS index management
// TechArch §7.4: query sanitization uses sanitize-html (server-side HTML strip)
// Security: T-04-01 — HTML stripping prevents XSS stored via search terms in logs

import sanitizeHtml from 'sanitize-html';

export class SearchIndexService {
  /**
   * Sanitize raw user query for safe use with plainto_tsquery.
   *
   * Steps:
   * 1. Strip HTML tags using sanitize-html (prevents XSS in logs, T-04-01)
   * 2. Trim surrounding whitespace
   * 3. Return null if blank after sanitization (triggers guidance message in handler)
   * 4. Truncate to 500 chars max (safety net — handler rejects >500 before reaching service)
   *
   * The returned string is safe to pass as a parameterized bind variable to
   * plainto_tsquery('english', $1). plainto_tsquery treats all input as plain text
   * tokens, never as operator syntax — no SQL injection possible.
   */
  static buildQuery(rawQuery: string): string | null {
    if (!rawQuery || typeof rawQuery !== 'string') return null;

    // Strip HTML tags — allowedTags: [] means NO tags are permitted
    const stripped = sanitizeHtml(rawQuery, {
      allowedTags: [],
      allowedAttributes: {},
    });

    const trimmed = stripped.trim();
    if (trimmed.length === 0) return null;

    // Truncation guard — handler layer rejects >500 before reaching here;
    // this is a defense-in-depth safety net
    return trimmed.slice(0, 500);
  }

  /**
   * Rebuild the search_vector for a specific record by triggering an UPDATE.
   *
   * Used for manual refresh if trigger-based update is suspected stale.
   * The trigger trg_innovation_record_fts fires BEFORE UPDATE on innovation_records,
   * so a no-op update (touching updated_at) suffices to re-execute the trigger.
   */
  static async rebuildVectorForRecord(
    recordId: string,
    db: import('knex').Knex
  ): Promise<void> {
    await db('innovation_records')
      .where({ record_id: recordId })
      .update({ updated_at: db.fn.now() });
  }
}

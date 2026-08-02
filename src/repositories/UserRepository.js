// UserRepository — users table access for OIDC-driven upserts
// TechArch §5.1: "Backend upserts a users table row keyed on idp_subject"
// users schema (from Wave 1b 02-PLAN): user_id UUID PK, email VARCHAR(255) UNIQUE,
//   display_name VARCHAR(200), role VARCHAR(20) CHECK(CURATOR|ADMIN) DEFAULT 'CURATOR',
//   is_active BOOLEAN DEFAULT TRUE, last_login_at TIMESTAMPTZ, idp_subject VARCHAR(500) UNIQUE

'use strict';

class UserRepository {
  constructor(db) {
    // db: a Knex instance or pg Pool — injected by caller
    this.db = db;
  }

  /**
   * Upsert a curator user from OIDC token claims.
   * Keyed on idp_subject (Azure AD OID / sub claim).
   * On conflict: updates email, display_name, last_login_at.
   * Returns the full user row: { user_id, email, display_name, role, is_active }
   *
   * TechArch §5.1: "Backend upserts a users table row keyed on idp_subject = sub"
   */
  async upsertFromOidc(idpSubject, email, displayName) {
    const result = await this.db.raw(
      `INSERT INTO users (email, display_name, idp_subject, last_login_at, created_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (idp_subject)
       DO UPDATE SET
         email          = EXCLUDED.email,
         display_name   = EXCLUDED.display_name,
         last_login_at  = NOW()
       RETURNING user_id, email, display_name, role, is_active`,
      [email, displayName, idpSubject]
    );
    // Normalize for both pg-raw and knex-raw response shapes
    const rows = result.rows || (result[0] && result[0].rows);
    if (!rows || rows.length === 0) {
      throw new Error(`UserRepository.upsertFromOidc: no row returned for idp_subject=${idpSubject}`);
    }
    return rows[0];
  }

  /**
   * Find a user by their identity provider subject claim.
   * Returns user row or null if not found.
   */
  async findByIdpSubject(idpSubject) {
    const result = await this.db.raw(
      `SELECT user_id, email, display_name, role, is_active
         FROM users
        WHERE idp_subject = $1
          AND is_active = TRUE
        LIMIT 1`,
      [idpSubject]
    );
    const rows = result.rows || (result[0] && result[0].rows);
    return (rows && rows.length > 0) ? rows[0] : null;
  }
}

module.exports = UserRepository;

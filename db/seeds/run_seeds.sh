#!/usr/bin/env bash
# =============================================================================
# run_seeds.sh — Apply all TSIO Innovation Hub seed files
#
# Usage: ./db/seeds/run_seeds.sh
# Requires: Running PostgreSQL accessible via DATABASE_URL or docker-compose db service
# Idempotent: safe to run multiple times (all INSERTs use ON CONFLICT DO NOTHING)
#
# Environment:
#   DATABASE_URL  — PostgreSQL connection string (overrides docker-compose default)
#   USE_DOCKER    — Set to "false" to use DATABASE_URL directly (skips docker compose exec)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

DB_USER="${DB_USER:-tsio_hub_user}"
DB_NAME="${DB_NAME:-tsio_hub}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_PASSWORD="${DB_PASSWORD:-tsio_hub_dev_password}"

USE_DOCKER="${USE_DOCKER:-true}"
COMPOSE_CMD="docker compose"
DB_SERVICE="db"

# -----------------------------------------------------------------------------
# Determine execution mode
# -----------------------------------------------------------------------------
if [[ -n "${DATABASE_URL:-}" ]]; then
  # Use DATABASE_URL directly via psql (CI / test environments)
  USE_DOCKER="false"
fi

run_sql() {
  local sql_file="$1"
  echo "  Applying SQL: $(basename "${sql_file}")"
  if [[ "${USE_DOCKER}" == "true" ]]; then
    ${COMPOSE_CMD} -f "${PROJECT_ROOT}/docker-compose.yml" exec -T "${DB_SERVICE}" \
      psql -U "${DB_USER}" -d "${DB_NAME}" < "${sql_file}"
  else
    PGPASSWORD="${DB_PASSWORD}" psql \
      -h "${DB_HOST}" -p "${DB_PORT}" \
      -U "${DB_USER}" -d "${DB_NAME}" \
      < "${sql_file}"
  fi
}

# -----------------------------------------------------------------------------
# Check if Node/Knex seeds should be run via Knex CLI
# (preferred when DATABASE_URL is set and knex is installed)
# -----------------------------------------------------------------------------
if command -v npx &>/dev/null && [[ -f "${PROJECT_ROOT}/knexfile.js" ]] && [[ -n "${DATABASE_URL:-}" ]]; then
  echo "=== TSIO Innovation Hub — Knex Seed Runner ==="
  echo "Running seeds via Knex CLI..."
  cd "${PROJECT_ROOT}"
  npx knex seed:run --knexfile knexfile.js 2>&1
  echo ""
  echo "Knex seed run complete."
  exit 0
fi

# -----------------------------------------------------------------------------
# Fallback: run seeds by invoking Node directly for each seed file
# (works without knexfile.js — uses DATABASE_URL + pg directly)
# -----------------------------------------------------------------------------
echo "=== TSIO Innovation Hub — Direct Seed Runner ==="
echo "Checking database connectivity..."

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "Using DATABASE_URL: ${DATABASE_URL//:*@/:***@}"

  # Run each seed file via node
  for seed_file in "${SCRIPT_DIR}"/0*.js; do
    if [[ -f "${seed_file}" ]]; then
      echo "  Applying seed: $(basename "${seed_file}")"
      node -e "
        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const seed = require('${seed_file}');
        const knex = {
          raw: (sql) => pool.query(sql)
        };
        seed.seed(knex)
          .then(() => { console.log('    Done: $(basename "${seed_file}")'); pool.end(); })
          .catch((err) => { console.error('    ERROR:', err.message); pool.end(); process.exit(1); });
      "
    fi
  done
else
  # Docker compose mode — apply SQL equivalents via psql
  echo "Using docker-compose db service (postgres)"
  echo ""

  # Generate and apply seed SQL from Node seed files
  for seed_file in "${SCRIPT_DIR}"/0*.js; do
    if [[ -f "${seed_file}" ]]; then
      echo "  Applying seed via Node: $(basename "${seed_file}")"
      node -e "
        const { Pool } = require('pg');
        const pool = new Pool({
          host: 'localhost',
          port: ${DB_PORT},
          user: '${DB_USER}',
          password: '${DB_PASSWORD}',
          database: '${DB_NAME}'
        });
        const seed = require('${seed_file}');
        const knex = {
          raw: (sql) => pool.query(sql)
        };
        seed.seed(knex)
          .then(() => { console.log('    Done: $(basename "${seed_file}")'); pool.end(); })
          .catch((err) => { console.error('    ERROR:', err.message); pool.end(); process.exit(1); });
      "
    fi
  done
fi

echo ""
echo "=== Seed Verification ==="

if [[ -n "${DATABASE_URL:-}" ]]; then
  node -e "
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    pool.query('SELECT record_id, title, maturity_level, review_status, publication_state FROM innovation_records ORDER BY created_at')
      .then(r => {
        console.log('Records seeded:');
        r.rows.forEach(row => {
          console.log('  [' + row.publication_state + '/' + row.maturity_level + '] ' + row.title.substring(0, 60));
        });
        pool.end();
      })
      .catch(err => { console.error('Verification error:', err.message); pool.end(); process.exit(1); });
  "
fi

echo ""
echo "=== Seed complete. ==="

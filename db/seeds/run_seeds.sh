#!/usr/bin/env bash
# =============================================================================
# run_seeds.sh — Apply all TSIO Innovation Hub seed files
# Usage: ./db/seeds/run_seeds.sh
# Requires: docker-compose.yml + running 'db' service (docker compose up -d db)
# Idempotent: safe to run multiple times
# =============================================================================

set -euo pipefail

COMPOSE_CMD="docker compose"
DB_SERVICE="db"
DB_USER="tsio_hub_user"
DB_NAME="tsio_hub"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Applying seed: seed_audio_security_poc.sql"
$COMPOSE_CMD exec -T "$DB_SERVICE" psql -U "$DB_USER" -d "$DB_NAME" \
  < "$SCRIPT_DIR/seed_audio_security_poc.sql"

echo "Applying seed: seed_archived_experiment.sql"
$COMPOSE_CMD exec -T "$DB_SERVICE" psql -U "$DB_USER" -d "$DB_NAME" \
  < "$SCRIPT_DIR/seed_archived_experiment.sql"

echo ""
echo "Seed complete. Verifying..."

$COMPOSE_CMD exec -T "$DB_SERVICE" psql -U "$DB_USER" -d "$DB_NAME" -c \
  "SELECT record_id, title, maturity_level, review_status, publication_state FROM innovation_records ORDER BY created_at;"

echo ""
echo "Seed verification complete."

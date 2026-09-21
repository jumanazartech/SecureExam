#!/usr/bin/env bash
# Copies the local exam database to another PostgreSQL (e.g. Neon / Supabase).
#
#   TARGET_URL='postgres://user:pass@host/db?sslmode=require' ./scripts/migrate-db.sh
#
# The connection string stays in your shell; it is never written to a file.
# Source defaults to the DB_* values in server/.env. The target must be EMPTY (a fresh Neon project is).
set -euo pipefail

: "${TARGET_URL:?Set TARGET_URL to the destination connection string}"

cd "$(dirname "$0")/.."
set -a; . ./.env; set +a
PGBIN="${PGBIN:-/usr/lib/postgresql/18/bin}"
DUMP=$(mktemp --suffix=.sql)
trap 'rm -f "$DUMP"' EXIT

echo "1/3 Dumping ${DB_NAME} from ${DB_HOST}:${DB_PORT} ..."
PGPASSWORD="$DB_PASSWORD" "$PGBIN/pg_dump" -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --no-owner --no-privileges --no-comments > "$DUMP"

# A newer local pg_dump may emit statements an older hosted server rejects.
sed -i -e '/^SET transaction_timeout/d' -e '/^\\restrict/d' -e '/^\\unrestrict/d' "$DUMP"

echo "2/3 Checking the target is empty ..."
TABLES=$("$PGBIN/psql" "$TARGET_URL" -Atc "select count(*) from information_schema.tables where table_schema='public'")
if [ "$TABLES" != "0" ]; then
    echo "Target already has $TABLES tables. Refusing to overwrite it. Use an empty database." >&2
    exit 1
fi

echo "3/3 Restoring into the target ..."
"$PGBIN/psql" "$TARGET_URL" -v ON_ERROR_STOP=1 -q -f "$DUMP" > /dev/null

echo "Done. Row counts on the target:"
"$PGBIN/psql" "$TARGET_URL" -Atc "select 'Users', count(*) from \"Users\" union all select 'Exams', count(*) from \"Exams\" union all select 'Questions', count(*) from \"Questions\" union all select 'Submissions', count(*) from \"Submissions\""

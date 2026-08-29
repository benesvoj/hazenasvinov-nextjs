#!/usr/bin/env bash
#
# Fails if any SECURITY DEFINER function in `public` is callable by `anon`.
#
# A definer function runs with its owner's rights, so one reachable with the
# public browser key runs privileged for anyone who asks. This repo has had that
# hole twice: 20260810 revoked EXECUTE from the `anon` role but left the PUBLIC
# grant that `anon` inherits, so eleven functions stayed open — including
# is_admin, has_role and the user lookups.
#
# It cannot be fixed once and forgotten. Supabase's setup grants EXECUTE on new
# functions in `public` to anon by default, and revoking that default does not
# work (verified on a clean PostgreSQL 15: `ALTER DEFAULT PRIVILEGES IN SCHEMA
# public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC` left a new function executable
# by an unprivileged role anyway). So every migration that adds or replaces a
# definer function has to end with:
#
#   REVOKE EXECUTE ON FUNCTION public.<fn>(<args>) FROM PUBLIC, anon;
#
# This check is what stops that from being forgotten.
#
# Usage:
#   ./scripts/check_definer_functions.sh                    # local stack
#   DB_URL=postgresql://... ./scripts/check_definer_functions.sh
#
set -euo pipefail

DB_URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

# Functions that are deliberately callable by anonymous visitors. Add one only
# with a comment saying which public page needs it — an entry here is a hole
# opened on purpose.
ALLOWLIST=()

query="
SELECT p.oid::regprocedure::text
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef
  AND has_function_privilege('anon', p.oid, 'EXECUTE')
ORDER BY 1;
"

exposed="$(psql -X -A -t -d "$DB_URL" -c "$query")"

# Drop allowlisted entries
for allowed in "${ALLOWLIST[@]:-}"; do
  [[ -z "$allowed" ]] && continue
  exposed="$(grep -vxF "$allowed" <<<"$exposed" || true)"
done

exposed="$(sed '/^[[:space:]]*$/d' <<<"$exposed")"

if [[ -z "$exposed" ]]; then
  printf '\033[32m✓\033[0m No SECURITY DEFINER function in public is callable by anon.\n'
  exit 0
fi

count="$(wc -l <<<"$exposed" | tr -d ' ')"
printf '\033[31m✗ %s SECURITY DEFINER function(s) in public are callable by anon:\033[0m\n' "$count"
sed 's/^/    /' <<<"$exposed"
cat <<'EOF'

Each of these runs with its owner's rights for anyone holding the public
browser key. Add to the migration that introduced it:

    REVOKE EXECUTE ON FUNCTION public.<fn>(<args>) FROM PUBLIC, anon;

Naming only `anon` is not enough — the PUBLIC grant is what anon inherits.
If one of them is meant to be public, add it to ALLOWLIST in this script with
a comment naming the page that needs it.
EOF
exit 1

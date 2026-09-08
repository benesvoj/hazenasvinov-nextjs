Create a new SQL migration file following the project's naming and structure conventions.

## What to ask the user (if not already provided)

1. **Migration purpose** — short description (e.g. "add coach_cards table", "fix RLS policies for grants")
2. **Migration type** — one of:
   - `create_table` — new table with columns, indexes, RLS
   - `alter_table` — add/remove/rename columns
   - `create_function` — PostgreSQL functions
   - `create_view` / `create_materialized_view`
   - `create_trigger`
   - `fix_rls` — RLS policy changes only
   - `other` — freeform

---

## File to create

**Path**: `supabase/migrations/{YYYYMMDD}{HHMMSS}_{snake_case_description}.sql`

This is the directory the `Database` workflow (`.github/workflows/database.yml`)
applies from. `scripts/migrations/` holds the migrations applied by hand before
that workflow existed; it is gitignored and the Supabase CLI never sees it.
**Never move a file from there into `supabase/migrations/`** — `db push` would
replay its `CREATE TABLE` / `ALTER TABLE` / `DROP` against the live database.

Use today's date for `YYYYMMDD` (format: `20260220` for 2026-02-20).

Derive the filename snake_case description from the migration purpose (e.g. `create_coach_cards_table`, `fix_grants_rls_policies`).

**Example**: `supabase/migrations/20260220100000_create_coach_cards_table.sql`

The six-digit time suffix keeps the ordering unambiguous when two migrations
land on the same day; the CLI sorts by the whole version string.

---

## Standard file header

Every migration file must start with this header block:

```sql
-- =====================================================
-- Migration: {Human-readable title}
-- Date: {YYYY-MM-DD}
-- Description: {One or two sentence description of what this migration does
--              and why it's needed}
-- Dependencies: {Comma-separated list of tables/functions this depends on, or "none"}
-- =====================================================
```

---

## Templates by migration type

### `create_table`

```sql
-- =====================================================
-- Table: {table_name}
-- =====================================================

CREATE TABLE IF NOT EXISTS {table_name} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ... columns ...
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
-- CREATE INDEX IF NOT EXISTS idx_{table_name}_{column} ON {table_name}({column});

-- Enable Row Level Security
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- SELECT: authenticated users can read
CREATE POLICY "{table_name}_select_policy"
  ON {table_name} FOR SELECT
  TO authenticated
  USING (true);

-- INSERT/UPDATE/DELETE: restrict to service role or specific conditions
-- CREATE POLICY "{table_name}_insert_policy" ON {table_name} FOR INSERT ...

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_{table_name}_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER {table_name}_updated_at_trigger
  BEFORE UPDATE ON {table_name}
  FOR EACH ROW EXECUTE FUNCTION update_{table_name}_updated_at();
```

### `create_function`

```sql
-- =====================================================
-- Function: {function_name}
-- =====================================================
-- Replaces: {describe what query pattern this replaces}
-- Returns: {describe return shape}

DROP FUNCTION IF EXISTS {function_name}({param types});

CREATE OR REPLACE FUNCTION {function_name}(
  -- parameters
)
RETURNS TABLE (
  -- return columns
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- query body
  ;
END;
$$;
```

### `alter_table`

```sql
-- =====================================================
-- Alter: {table_name}
-- =====================================================

ALTER TABLE {table_name}
  ADD COLUMN IF NOT EXISTS {column_name} {type} {constraints};

-- DROP COLUMN IF EXISTS {column_name}; -- only if safe/intentional

-- Update existing rows if needed:
-- UPDATE {table_name} SET {column_name} = {default} WHERE {column_name} IS NULL;
```

### `fix_rls`

```sql
-- =====================================================
-- RLS: {table_name}
-- =====================================================

-- Drop existing policies before recreating
DROP POLICY IF EXISTS "{policy_name}" ON {table_name};

CREATE POLICY "{policy_name}"
  ON {table_name} FOR {SELECT|INSERT|UPDATE|DELETE}
  TO {authenticated|anon|service_role}
  USING ({condition})
  -- WITH CHECK ({condition}); -- for INSERT/UPDATE
```

---

## After creating the file

Migrations are applied by CI, not by hand. Do not run the file against
production yourself, and do not tell the user to paste it into the SQL editor.

Tell the user what will happen:
1. **Review the file** — migrations are hard to reverse.
2. **On the pull request**, the `Database` workflow's `verify` job starts a
   throwaway stack, runs `supabase db reset`, and fails the build if the
   migration does not apply from scratch. It also re-checks that no
   SECURITY DEFINER function is callable by `anon`.
3. **On merge to `main`**, the `deploy` job runs `supabase db push --dry-run`
   and then `db push` against production. It is gated by the
   `database-production` GitHub environment, so it waits for a review from the
   repo owner before it starts. `db push` applies only versions missing from
   `supabase_migrations.schema_migrations`.
4. **After it lands**, run `/db-sync` **only if the migration changed something
   the generated types can see** — a table, column, view, function or enum.
   Policies, grants and `COMMENT ON` do not appear in
   `src/types/database/supabase.ts`, so a migration that only touches those
   produces no diff and needs no sync. When it is needed, the regenerated types
   are a repo change of their own and belong in a follow-up commit.
5. **Rollback**: if the migration has destructive steps, check that Supabase's
   daily backups and PITR cover the window before approving the deploy job.
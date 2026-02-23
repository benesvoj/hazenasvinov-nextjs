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

**Path**: `scripts/migrations/{YYYYMMDD}_{snake_case_description}.sql`

Use today's date for `YYYYMMDD` (format: `20260220` for 2026-02-20).

Derive the filename snake_case description from the migration purpose (e.g. `create_coach_cards_table`, `fix_grants_rls_policies`).

**Example**: `scripts/migrations/20260220_create_coach_cards_table.sql`

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

Remind the user:
1. **Review the file** before running — migrations are hard to reverse.
2. **Run against Supabase**:
   - Via Supabase dashboard SQL editor (paste the file contents), OR
   - Via psql: `psql {connection_string} -f scripts/migrations/{filename}.sql`
3. **After running**: execute `/db-sync` to regenerate TypeScript types if the migration adds/modifies tables.
4. **Rollback**: if the migration has destructive steps, consider writing a rollback script at `scripts/migrations/rollback_{description}.sql`.
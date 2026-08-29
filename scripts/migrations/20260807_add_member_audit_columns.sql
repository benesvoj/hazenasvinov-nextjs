-- =====================================================
-- Migration: Member audit trail
-- Date: 2026-08-07
-- Description: Records who created a member and who last edited it, alongside
--              the existing created_at / updated_at timestamps. A trigger keeps
--              the fields filled for writes coming straight from the browser
--              client (CSV import, bulk edit, lineup quick-create), while API
--              routes using the service role pass the user id explicitly.
-- Dependencies: members, auth.users
-- =====================================================

-- =====================================================
-- Alter: members
-- =====================================================

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Existing rows keep NULL authors — the data predates this migration and
-- guessing an author would be worse than showing "neznámý".

ALTER TABLE public.members
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

COMMENT ON COLUMN public.members.created_by IS 'User who created the record; NULL for rows predating the audit trail or created by a system job.';
COMMENT ON COLUMN public.members.updated_by IS 'User who last modified the record; NULL until the first edit after this migration.';

-- =====================================================
-- Function: set_members_audit_fields
-- =====================================================
-- auth.uid() resolves the caller for browser-client writes but is NULL under
-- the service role, so an explicitly supplied value always wins. created_* are
-- frozen on UPDATE — an audit trail that can be rewritten is worthless.

CREATE OR REPLACE FUNCTION public.set_members_audit_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := COALESCE(NEW.created_at, now());
    NEW.created_by := COALESCE(NEW.created_by, auth.uid());
    NEW.updated_at := COALESCE(NEW.updated_at, NEW.created_at);
    NEW.updated_by := COALESCE(NEW.updated_by, NEW.created_by);
    RETURN NEW;
  END IF;

  NEW.created_at := OLD.created_at;
  NEW.created_by := OLD.created_by;
  NEW.updated_at := now();

  -- Untouched by the caller → fall back to the authenticated user, keeping the
  -- previous author when the write happens without an auth context.
  IF NEW.updated_by IS NOT DISTINCT FROM OLD.updated_by THEN
    NEW.updated_by := COALESCE(auth.uid(), OLD.updated_by);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS members_audit_fields_trigger ON public.members;

CREATE TRIGGER members_audit_fields_trigger
  BEFORE INSERT OR UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.set_members_audit_fields();

-- =====================================================
-- Grant Permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION public.set_members_audit_fields() TO anon, authenticated;

NOTIFY pgrst, 'reload schema';

-- =====================================================
-- Verification Queries (optional)
-- =====================================================
SELECT id, name, surname, created_by, created_at, updated_by, updated_at
  FROM members ORDER BY updated_at DESC LIMIT 5;

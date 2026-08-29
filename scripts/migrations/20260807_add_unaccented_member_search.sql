-- =====================================================
-- Migration: Diacritics-insensitive member search
-- Date: 2026-08-07
-- Description: Exposes an unaccented, lower-cased `search_text` field on the
--              members table and the three member views so the members list can
--              be searched without diacritics ("cerny" finds "Černý", "Černý"
--              finds "Cerny"). Implemented as PostgREST computed fields, so the
--              existing views keep their definitions untouched.
-- Dependencies: members, members_internal, members_external, members_on_loan
-- =====================================================
--
-- NOTE: this assumes the Supabase default of extensions living in the
-- `extensions` schema. If `unaccent` is installed into `public` in this project
-- (check with `\dx` or `SELECT extnamespace::regnamespace FROM pg_extension
-- WHERE extname = 'unaccent'`), replace the `extensions.` prefixes below.

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

-- =====================================================
-- Function: public.immutable_unaccent
-- =====================================================
-- unaccent() is only STABLE because it resolves its text search dictionary at
-- run time, which bars it from computed fields and index expressions. Pinning
-- the dictionary explicitly is the standard workaround that makes the wrapper
-- safe to declare IMMUTABLE.

CREATE OR REPLACE FUNCTION public.immutable_unaccent(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
PARALLEL SAFE
AS $$
  SELECT extensions.unaccent('extensions.unaccent'::regdictionary, input)
$$;

COMMENT ON FUNCTION public.immutable_unaccent(text) IS
  'IMMUTABLE wrapper around unaccent() with a pinned dictionary, usable in computed fields and index expressions.';

-- =====================================================
-- Computed field: search_text
-- =====================================================
-- PostgREST exposes a function taking a single row argument as a virtual column
-- on that relation, so clients can filter with `search_text=ilike.*cerny*`.
-- The field concatenates first name, surname and registration number, then
-- strips diacritics and lower-cases the result. Callers must normalise their
-- search term the same way (see `normalizeSearchTerm` in src/utils).

CREATE OR REPLACE FUNCTION public.search_text(member public.members)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT public.immutable_unaccent(lower(
    coalesce(member.name, '') || ' ' ||
    coalesce(member.surname, '') || ' ' ||
    coalesce(member.registration_number, '')
  ))
$$;

CREATE OR REPLACE FUNCTION public.search_text(member public.members_internal)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT public.immutable_unaccent(lower(
    coalesce(member.name, '') || ' ' ||
    coalesce(member.surname, '') || ' ' ||
    coalesce(member.registration_number, '')
  ))
$$;

CREATE OR REPLACE FUNCTION public.search_text(member public.members_external)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT public.immutable_unaccent(lower(
    coalesce(member.name, '') || ' ' ||
    coalesce(member.surname, '') || ' ' ||
    coalesce(member.registration_number, '')
  ))
$$;

CREATE OR REPLACE FUNCTION public.search_text(member public.members_on_loan)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT public.immutable_unaccent(lower(
    coalesce(member.name, '') || ' ' ||
    coalesce(member.surname, '') || ' ' ||
    coalesce(member.registration_number, '')
  ))
$$;

-- =====================================================
-- Performance note
-- =====================================================
-- Filtering a computed field is a sequential scan — no index can back it,
-- because the expression is evaluated on the *view* row, not on members. At a
-- few hundred members this is irrelevant. If the table ever grows enough for it
-- to matter, materialise the value instead: add a STORED generated column
-- `search_text` to members (immutable_unaccent makes that legal), index it with
-- gin/pg_trgm, expose it in the three views, and drop the functions below.

-- =====================================================
-- Grant Permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION public.immutable_unaccent(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_text(public.members) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_text(public.members_internal) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_text(public.members_external) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_text(public.members_on_loan) TO anon, authenticated;

-- Make PostgREST pick up the new computed fields immediately.
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- Verification Queries (optional)
-- =====================================================
-- SELECT name, surname, search_text FROM members_internal LIMIT 5;
-- SELECT count(*) FROM members_internal WHERE search_text ILIKE '%cerny%';

-- =====================================================
-- Migration: Actually take SECURITY DEFINER functions away from anon
-- Date: 2026-08-29
-- Description: 20260810_revoke_definer_functions_from_anon revoked EXECUTE
--              from `anon` only. That never took effect: CREATE FUNCTION grants
--              EXECUTE to PUBLIC, `anon` inherits it, and revoking the role
--              leaves the PUBLIC grant standing. Eleven SECURITY DEFINER
--              functions are still callable with the public browser key —
--              is_admin, has_role and the user/profile lookups among them.
--              This revokes PUBLIC as well. A CI check keeps it from decaying;
--              see the note below on why the default-privileges route does not
--              work.
-- Dependencies: the functions listed below
-- =====================================================
--
-- WHY THE EARLIER ATTEMPT WAS A NO-OP:
-- `REVOKE ... FROM anon` does not remove a PUBLIC grant, and CREATE FUNCTION
-- grants EXECUTE to PUBLIC, which `anon` inherits. 20260807 got this right
-- ("FROM PUBLIC, anon, authenticated"); 20260810 named only the role.
--
-- THIS IS A POINT-IN-TIME FIX, and deliberately so. Supabase's setup carries
-- `ALTER DEFAULT PRIVILEGES ... IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO
-- anon`, so a function created after this migration is granted to anon again.
-- Revoking that default looked like the durable answer and does not work: on a
-- clean PostgreSQL 15, `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE
-- EXECUTE ON FUNCTIONS FROM PUBLIC` left a newly created function executable by
-- an unprivileged role all the same. Rather than ship DDL whose comment claims
-- something untrue, the regression is caught by a check instead:
-- `scripts/check_definer_functions.sh`, wired into CI, fails the build if any
-- SECURITY DEFINER function in `public` becomes callable by anon.
--
-- So: every migration that adds or replaces a SECURITY DEFINER function in
-- `public` must end with `REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC, anon;`.
-- The CI check is what stops that from being forgotten.

-- VERIFIED BEFORE WRITING, against a full copy of production:
--   * No `.rpc()` call in the codebase runs on an unauthenticated path. Every
--     one sits behind withAuth, uses the admin client, or runs after sign-in.
--   * Of the RLS policies that call these functions (on user_profiles,
--     user_roles and role_definitions), all six are scoped to `authenticated`
--     and none to anon or public. A policy expression evaluates as the calling
--     role, so revoking anon cannot break policy evaluation for a visitor.
--   * `authenticated` and `service_role` hold grants of their own; they are
--     restated below so this file is also correct on a restored dump.

-- =====================================================
-- The eleven functions anon can still execute
-- =====================================================
-- Grants first, so the revoke can never leave a signed-in user without access
-- even if this runs against a database where the explicit grants are missing.

GRANT EXECUTE ON FUNCTION public.get_attendance_summary(character varying, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_current_user_summary() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_sponsorship_stats() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_training_session_stats(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_coach_categories(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_roles(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_summary_by_id(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_admin_access(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, character varying) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_has_profile(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_attendance_summary(character varying, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_current_user_summary() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_sponsorship_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_training_session_stats(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_coach_categories(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_roles(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_summary_by_id(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_admin_access(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, character varying) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_has_profile(uuid) FROM PUBLIC, anon;

-- The eleven above are the ones whose revoke was swallowed by a PUBLIC grant.
-- These eight were revoked from anon explicitly by 20260807 and 20260810 and
-- carry no PUBLIC grant, but they are restated so a database restored from a
-- dump — where ALTER DEFAULT PRIVILEGES re-grants anon on every recreated
-- function — ends up in the same place as production.

REVOKE EXECUTE ON FUNCTION public.exec_sql(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.ensure_user_profile(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.force_refresh_attendance_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.refresh_attendance_statistics_summary() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.refresh_materialized_view(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.scheduled_refresh_attendance_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.sync_profiles_on_user_profiles_change() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_members_audit_fields() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_metadata_created_by() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.trigger_refresh_attendance_stats() FROM PUBLIC, anon;

-- =====================================================
-- Verification
-- =====================================================
-- Must return zero rows: no SECURITY DEFINER function in public may be
-- executable by anon.
--
-- SELECT p.oid::regprocedure
-- FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public'
--   AND p.prosecdef
--   AND has_function_privilege('anon', p.oid, 'EXECUTE');
--
-- Must still return every function a signed-in coach relies on:
--
-- SELECT p.oid::regprocedure
-- FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public'
--   AND p.proname IN ('is_admin', 'has_role', 'get_user_roles')
--   AND has_function_privilege('authenticated', p.oid, 'EXECUTE');

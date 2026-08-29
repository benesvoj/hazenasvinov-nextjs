-- =====================================================
-- Migration: Take unused SECURITY DEFINER functions away from authenticated
-- Date: 2026-08-10
-- Description: Completes the previous migration's anon-side revoke. These
--              definer functions have no caller in the application and no RLS
--              policy depends on them, so leaving them callable by every
--              signed-in session is exposure without a purpose.
-- Dependencies: the functions listed below
-- =====================================================
--
-- DECIDED FROM EVIDENCE, not from guessing:
--
--   1. Policy dump (pg_policy, filtered to the role helpers) returned exactly
--      six rows, all of them `is_admin(auth.uid())` on role_definitions,
--      user_profiles and user_roles. No other helper appears in any policy.
--   2. Every `.rpc(...)` call in the codebase was checked: only
--      get_member_attendance_stats and get_attendance_trends are called, from
--      /api/attendance/statistics behind withAuth.
--
-- So `is_admin` and the two attendance functions keep EXECUTE for
-- `authenticated`; everything below loses it.

-- =====================================================
-- 1. Role helpers with no policy and no caller
-- =====================================================

REVOKE EXECUTE ON FUNCTION public.has_admin_access(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, character varying) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.user_has_profile(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_coach_categories(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_roles(uuid) FROM authenticated;

-- is_admin(uuid) stays: user_profiles, user_roles and role_definitions policies
-- call it, and policy expressions run as the calling role.

-- =====================================================
-- 2. User data lookups with no caller
-- =====================================================
-- get_user_summary_by_id answers with an arbitrary user's data. Until something
-- needs it, no session should be able to ask.

REVOKE EXECUTE ON FUNCTION public.get_current_user_summary() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_summary_by_id(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_user_profile(uuid) FROM authenticated;

-- =====================================================
-- 3. Statistics with no caller
-- =====================================================
-- The two that ARE used (get_member_attendance_stats, get_attendance_trends)
-- are deliberately absent from this list.

REVOKE EXECUTE ON FUNCTION public.get_attendance_summary(character varying, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_training_session_stats(uuid, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_sponsorship_stats() FROM authenticated;

-- =====================================================
-- 4. Tidy-up from my own search migration
-- =====================================================
-- The `search_text` computed fields and their unaccent helper were granted to
-- anon along with authenticated. Anon lost access to every member view in
-- 20260807_lock_down_member_data_and_rls, so the grant serves nothing.

REVOKE EXECUTE ON FUNCTION public.search_text(public.members) FROM anon;
REVOKE EXECUTE ON FUNCTION public.search_text(public.members_internal) FROM anon;
REVOKE EXECUTE ON FUNCTION public.search_text(public.members_external) FROM anon;
REVOKE EXECUTE ON FUNCTION public.search_text(public.members_on_loan) FROM anon;
REVOKE EXECUTE ON FUNCTION public.immutable_unaccent(text) FROM anon;

-- =====================================================
-- Verify
-- =====================================================
-- These are the paths that would break if a revoke above was wrong. Signed in:
--   * admin → Uživatelé → přiřazení rolí       (is_admin in policies)
--   * coach portal → Docházka → statistiky     (the two attendance functions)
--   * admin → Členové → vyhledávání "cerny"    (search_text as authenticated)
--   * login and the coach portal in general    (role resolution)
--
-- If something does turn out to need one of these, the fix is one line:
--   GRANT EXECUTE ON FUNCTION public.<name>(<args>) TO authenticated;

NOTIFY pgrst, 'reload schema';

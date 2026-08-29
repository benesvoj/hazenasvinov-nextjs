-- =====================================================
-- Migration: Take SECURITY DEFINER functions away from anon
-- Date: 2026-08-10
-- Description: The thirteen SECURITY DEFINER functions still executable by the
--              anon role. Definer functions run with their owner's rights, so
--              anything reachable with the public browser key runs privileged —
--              these hand out attendance records, user summaries and role
--              lookups to anyone who asks.
-- Dependencies: the functions listed below
-- =====================================================
--
-- VERIFIED BEFORE WRITING — every RPC call in the codebase was checked against
-- this list:
--   * get_member_attendance_stats and get_attendance_trends are called from
--     /api/attendance/statistics, which runs behind withAuth with the caller's
--     client → `authenticated` must keep EXECUTE.
--   * the other eleven have no caller anywhere in the app.
--   * no call site uses an anonymous session, so removing anon breaks nothing.
--
-- `authenticated` is deliberately left alone here. Several of these are role
-- helpers (is_admin, has_role, has_admin_access, user_has_profile,
-- get_user_coach_categories) and RLS policies call them — including the
-- user_profiles policies added in 20260810_fix_privilege_escalation_policies.
-- Policy expressions evaluate as the calling role, so revoking `authenticated`
-- would break the very policies that close the escalation hole. See the query
-- at the bottom before tightening that side.

-- =====================================================
-- 1. Member and attendance data
-- =====================================================
-- Attendance concerns children. None of it belongs behind an anonymous key.

REVOKE EXECUTE ON FUNCTION public.get_attendance_summary(character varying, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_attendance_trends(uuid, uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_member_attendance_stats(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_training_session_stats(uuid, uuid) FROM anon;

-- =====================================================
-- 2. User and role lookups
-- =====================================================
-- get_user_summary_by_id takes an arbitrary user id and answers with that
-- user's data — as a definer function, to whoever calls it. The rest let a
-- caller enumerate who holds which role.

REVOKE EXECUTE ON FUNCTION public.get_current_user_summary() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_summary_by_id(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_coach_categories(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_roles(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_admin_access(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, character varying) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_has_profile(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.ensure_user_profile(uuid) FROM anon;

-- =====================================================
-- 3. Aggregates
-- =====================================================

REVOKE EXECUTE ON FUNCTION public.get_sponsorship_stats() FROM anon;

-- =====================================================
-- Verify
-- =====================================================
-- With the anon key, each of these must now answer 401/404 rather than data:
--   curl -X POST "$URL/rest/v1/rpc/is_admin" -H "apikey: $ANON_KEY" \
--        -H "Authorization: Bearer $ANON_KEY" -H "Content-Type: application/json" \
--        -d '{"user_uuid":"00000000-0000-0000-0000-000000000000"}'
--
-- Then check the coach portal → Docházka → statistiky still loads (that is the
-- one path using two of these, through an authenticated API route).

-- =====================================================
-- Next step — deciding the `authenticated` side
-- =====================================================
-- Run this to see which of these functions RLS policies actually depend on.
-- Anything that does not appear can lose EXECUTE for `authenticated` too;
-- guessing without it risks breaking policy evaluation everywhere.
--
  SELECT c.relname AS table_name,
         p.polname AS policy,
         pg_get_expr(p.polqual, p.polrelid) AS using_expr,
         pg_get_expr(p.polwithcheck, p.polrelid) AS check_expr
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
   WHERE pg_get_expr(p.polqual, p.polrelid) ~ 'is_admin|has_role|has_admin_access|user_has_profile|get_user_coach_categories|get_user_roles'
      OR pg_get_expr(p.polwithcheck, p.polrelid) ~ 'is_admin|has_role|has_admin_access|user_has_profile|get_user_coach_categories|get_user_roles'
   ORDER BY c.relname, p.polname;

NOTIFY pgrst, 'reload schema';

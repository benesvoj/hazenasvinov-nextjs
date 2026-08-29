-- =====================================================
-- Migration: Lock down member data and enable missing RLS
-- Date: 2026-08-07
-- Description: Closes the ERROR-level findings from the Supabase database
--              linter. The critical part is member data: the anon role can
--              currently read every member row — including birth dates, contact
--              details, guardians and medical notes — through the members table
--              and the SECURITY DEFINER views built on it.
-- Dependencies: members, member_metadata, members_internal, members_external,
--               members_on_loan, members_with_metadata, member_fee_status,
--               point_deductions, migration_log, match_videos, betting_*,
--               coach_category_assignments, user_profiles_backup_20240127
-- =====================================================
--
-- VERIFIED BEFORE WRITING: no public (unauthenticated) page reads member data.
-- Every member query in the app goes through an authenticated API route or the
-- admin/coach UI, so revoking `anon` breaks nothing that is in use.
--
-- Check the result afterwards with the anon key:
--   curl "$URL/rest/v1/members_with_metadata?select=id&limit=1" \
--        -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
--   → expected: empty array or a permission error, never member rows.

-- =====================================================
-- 1. Member data: revoke anonymous access
-- =====================================================
-- Table-level REVOKE is deterministic: it does not depend on which RLS policies
-- happen to exist, and it also closes the SECURITY DEFINER views, which bypass
-- RLS by design and are the reason `member_metadata` leaks despite having RLS.

REVOKE SELECT ON public.members FROM anon;
REVOKE SELECT ON public.member_metadata FROM anon;
REVOKE SELECT ON public.members_internal FROM anon;
REVOKE SELECT ON public.members_external FROM anon;
REVOKE SELECT ON public.members_on_loan FROM anon;
REVOKE SELECT ON public.members_with_metadata FROM anon;
REVOKE SELECT ON public.member_fee_status FROM anon;

-- Authenticated access stays as it is — the club portal depends on it.
GRANT SELECT ON public.members_internal TO authenticated;
GRANT SELECT ON public.members_external TO authenticated;
GRANT SELECT ON public.members_on_loan TO authenticated;
GRANT SELECT ON public.members_with_metadata TO authenticated;
GRANT SELECT ON public.member_fee_status TO authenticated;

-- =====================================================
-- 2. Tables with RLS policies that never took effect
-- =====================================================
-- point_deductions already carries four policies (see
-- 20260525_create_point_deductions_table.sql) but RLS was never switched on, so
-- they are inert and the table is world-readable.
--
-- ⚠️ Its select policy is `TO authenticated`. If the public standings page
-- reads deductions with the anon key, enable RLS *and* add the anon policy
-- below — otherwise deductions silently drop to zero in public standings.

ALTER TABLE public.point_deductions ENABLE ROW LEVEL SECURITY;

-- Uncomment if public standings need it:
-- CREATE POLICY "point_deductions_public_select_policy"
--   ON public.point_deductions FOR SELECT
--   TO anon
--   USING (true);

-- =====================================================
-- 3. Tables in the public schema with no RLS at all
-- =====================================================
-- Default chosen here: readable by signed-in users, written only by the service
-- role (API routes). Verify each against the public site before running — any
-- table the anon key reads needs an explicit anon policy like the one above.

ALTER TABLE public.match_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "match_videos_select_policy"
  ON public.match_videos FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE public.betting_odds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "betting_odds_select_policy"
  ON public.betting_odds FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE public.betting_odds_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "betting_odds_history_select_policy"
  ON public.betting_odds_history FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE public.betting_team_elo_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "betting_team_elo_ratings_select_policy"
  ON public.betting_team_elo_ratings FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE public.coach_category_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_category_assignments_select_policy"
  ON public.coach_category_assignments FOR SELECT
  TO authenticated
  USING (true);

-- Bookkeeping only — nothing in the app reads it, so no policy is added and
-- RLS denies everyone except the service role.
ALTER TABLE public.migration_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. Leftover backup table
-- =====================================================
-- 18 rows of user ids, roles and assigned categories, readable by anyone.
-- Locked here; drop it once you have confirmed nothing needs it.

ALTER TABLE public.user_profiles_backup_20240127 ENABLE ROW LEVEL SECURITY;
REVOKE SELECT ON public.user_profiles_backup_20240127 FROM anon, authenticated;

-- DROP TABLE public.user_profiles_backup_20240127;

-- =====================================================
-- Not covered here — needs a decision per object
-- =====================================================
-- * betting_leaderboard exposes auth.users to anon. It has to be rewritten
--   without the auth.users join (or restricted to authenticated) — the linter
--   flags it as auth_users_exposed.
-- * The remaining SECURITY DEFINER views (teams, team_details, club_overview,
--   matches_with_teams_optimized, club_category_details, team_suffix_helper,
--   coach_cards_with_categories, attendance_stats_trigger_info) feed the public
--   site. Switching them to `security_invoker = on` makes them respect the
--   caller's RLS, which is correct but can break anonymous reads depending on
--   the underlying policies. Convert them one at a time and test.

NOTIFY pgrst, 'reload schema';

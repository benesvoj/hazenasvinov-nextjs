-- =====================================================
-- Migration: Restrict the remaining anon-readable views
-- Date: 2026-08-07
-- Description: Second pass over the Supabase linter errors, after
--              20260807_lock_down_member_data_and_rls.sql closed the member
--              data leak. Covers the three views that expose data the public
--              site does not need: the betting leaderboard (built on
--              auth.users), unpublished coach cards, and internal trigger
--              metadata.
-- Dependencies: betting_leaderboard, coach_cards_with_categories,
--               attendance_stats_trigger_info
-- =====================================================
--
-- VERIFIED with the anon key before writing:
--   betting_leaderboard            6 rows, one user_name is an e-mail address
--   coach_cards_with_categories    5 rows, 1 of them not published anywhere
--   attendance_stats_trigger_info  trigger names and their SQL bodies

-- =====================================================
-- 1. betting_leaderboard — auth.users exposed to anon
-- =====================================================
-- The betting page renders <BettingLogin> for anonymous visitors, so nothing
-- public reads the leaderboard. Signed-in players keep their access.

REVOKE SELECT ON public.betting_leaderboard FROM anon;
GRANT SELECT ON public.betting_leaderboard TO authenticated;

-- Follow-up worth doing separately: the view still carries `user_name` straight
-- from auth.users. Signed-in players seeing each other's login e-mail is a
-- weaker leak but a leak; the view should resolve display names from `profiles`
-- instead. Left alone here because it needs the view rewritten, not regranted.

-- =====================================================
-- 2. coach_cards_with_categories — unpublished cards
-- =====================================================
-- Coach contacts ARE meant to be public: /coaches renders name, photo, e-mail,
-- phone and note for published cards. But anon can query the view directly and
-- bypass the `published_categories` filter the API route applies — today that
-- exposes one card its owner never published.
--
-- The public route is switched to the service-role client in the same change,
-- so it keeps working while the filter moves server-side where it cannot be
-- bypassed.

REVOKE SELECT ON public.coach_cards_with_categories FROM anon;
GRANT SELECT ON public.coach_cards_with_categories TO authenticated;

-- =====================================================
-- 3. attendance_stats_trigger_info — internal introspection
-- =====================================================
-- Exposes trigger names and their action statements. Nothing in the app reads
-- it; it is a debugging helper and should not be reachable from a browser.

REVOKE SELECT ON public.attendance_stats_trigger_info FROM anon, authenticated;

-- =====================================================
-- Still open after this migration
-- =====================================================
-- Nine SECURITY DEFINER views remain flagged: teams, team_details,
-- team_suffix_helper, club_overview, club_category_details,
-- matches_with_teams_optimized, members_internal, members_external,
-- members_on_loan, members_with_metadata, member_fee_status,
-- coach_cards_with_categories, betting_leaderboard.
--
-- The member ones no longer leak (anon lost SELECT in the previous migration) —
-- the linter flags the property, not the exposure. The public-site ones serve
-- data that is meant to be public (matches, teams, clubs).
--
-- Clearing the lint means `ALTER VIEW ... SET (security_invoker = on)` on each,
-- which makes them respect the caller's RLS. That is the correct end state, but
-- every anonymous read then depends on the base tables having anon SELECT
-- policies — so convert one view at a time and check the public site after each.

NOTIFY pgrst, 'reload schema';

-- =====================================================
-- Migration: Restrict materialized views exposed through the API
-- Date: 2026-08-10
-- Description: Materialized views ignore RLS entirely — a policy on the
--              underlying table does nothing for them, so grants are the only
--              control. Four of the five are readable by anon today; only
--              own_club_matches has a caller that needs it.
-- Dependencies: betting_leaderboard, attendance_statistics_summary,
--               match_stats, teams_with_details, own_club_matches
-- =====================================================
--
-- ⚠️ FIXES A REGRESSION I INTRODUCED. 20260807_rewrite_betting_leaderboard.sql
-- drops and recreates the leaderboard, and I assumed the drop would leave the
-- new object without grants. It does not: Supabase sets ALTER DEFAULT
-- PRIVILEGES on the public schema, so anything created there is granted to anon
-- and authenticated automatically. Verified just now with the anon key — the
-- leaderboard was handing out user_id and real display names again.
--
-- The lesson generalises: after CREATE on anything in `public`, state the grants
-- explicitly rather than relying on the drop having removed them.
--
-- MEASURED WITH THE ANON KEY BEFORE WRITING:
--   betting_leaderboard            readable — user_id, user_name ("Vojtěch Beneš")
--   attendance_statistics_summary  readable — per-category session aggregates
--   match_stats                    readable — 8 columns
--   teams_with_details             readable — 22 columns
--   own_club_matches               readable — 38 columns, public fixture data
--
-- CODE PATHS CHECKED:
--   own_club_matches               services/optimizedMatchQueries.ts, browser
--                                  client → runs as anon on public pages. KEEP.
--   attendance_statistics_summary  /api/attendance/statistics behind withAuth
--                                  → authenticated only.
--   match_stats, teams_with_details, betting_leaderboard
--                                  no reader anywhere in the app.

-- =====================================================
-- 1. betting_leaderboard
-- =====================================================
-- The betting page renders a login form for anonymous visitors; the leaderboard
-- is for players.

REVOKE SELECT ON public.betting_leaderboard FROM anon;
GRANT SELECT ON public.betting_leaderboard TO authenticated;

-- =====================================================
-- 2. attendance_statistics_summary
-- =====================================================
-- Aggregates only — session counts and completion rates per category, no member
-- rows. Still club-internal, and its only reader is an authenticated route.

REVOKE SELECT ON public.attendance_statistics_summary FROM anon;
GRANT SELECT ON public.attendance_statistics_summary TO authenticated;

-- =====================================================
-- 3. match_stats, teams_with_details
-- =====================================================
-- No reader in the application. Left available to signed-in sessions rather
-- than dropped, since removing objects nothing references is a separate
-- decision from closing anonymous access.

REVOKE SELECT ON public.match_stats FROM anon;
GRANT SELECT ON public.match_stats TO authenticated;

REVOKE SELECT ON public.teams_with_details FROM anon;
GRANT SELECT ON public.teams_with_details TO authenticated;

-- =====================================================
-- 4. own_club_matches — deliberately untouched
-- =====================================================
-- Public fixture listings read it straight from the browser with no session, so
-- anon SELECT has to stay. It carries fixtures, scores, club and category names
-- — the same data the public match pages print anyway.

-- =====================================================
-- Verify
-- =====================================================
-- With the anon key: the first four must answer 401, own_club_matches 200.
--   for v in betting_leaderboard attendance_statistics_summary match_stats \
--            teams_with_details own_club_matches; do
--     curl -s -o /dev/null -w "$v %{http_code}\n" \
--       "$URL/rest/v1/$v?select=*&limit=1" \
--       -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
--   done
--
-- Then, signed in: the betting leaderboard still lists players, coach portal →
-- Docházka → statistiky still loads, and the public /matches page still shows
-- fixtures while logged out.

NOTIFY pgrst, 'reload schema';

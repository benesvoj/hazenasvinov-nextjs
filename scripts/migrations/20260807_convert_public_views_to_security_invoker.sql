-- =====================================================
-- Migration: Convert public views to security_invoker
-- Date: 2026-08-07
-- Description: Third pass over the Supabase linter errors. Clears the
--              security_definer_view findings for the six views that serve the
--              public site, and closes the coach_cards base table, which leaks
--              the same contact data the previous migration removed from the
--              view built on top of it.
-- Dependencies: coach_cards, teams, team_details, team_suffix_helper,
--               club_overview, club_category_details,
--               matches_with_teams_optimized
-- =====================================================

-- =====================================================
-- 1. coach_cards — the leak the view revoke did not cover
-- =====================================================
-- Revoking `coach_cards_with_categories` from anon was not enough: the base
-- table is readable on its own and returns 4 rows with user_id, e-mail, phone
-- and note, published or not. The public /coaches page goes through
-- /api/coach-cards/public, which now reads with the service role.

REVOKE SELECT ON public.coach_cards FROM anon;
GRANT SELECT ON public.coach_cards TO authenticated;

-- =====================================================
-- 2. Public views → security_invoker
-- =====================================================
-- VERIFIED with the anon key: every base table behind these views (clubs,
-- club_categories, club_category_teams, categories, seasons, matches) is
-- already readable by anon on its own. Making the views respect the caller's
-- RLS therefore changes nothing for anonymous visitors — the public site keeps
-- working — while the views stop running with the creator's privileges.

-- None of these six is referenced anywhere in the application either — the app
-- reads the base tables directly (`club_category_teams` for teams, `matches`
-- for matches). Worth considering whether they should exist at all.

ALTER VIEW public.teams SET (security_invoker = on);
ALTER VIEW public.team_details SET (security_invoker = on);
ALTER VIEW public.team_suffix_helper SET (security_invoker = on);
ALTER VIEW public.club_overview SET (security_invoker = on);
ALTER VIEW public.club_category_details SET (security_invoker = on);
ALTER VIEW public.matches_with_teams_optimized SET (security_invoker = on);

-- =====================================================
-- 3. coach_cards_with_categories → security_invoker
-- =====================================================
-- Its only reader is `getPublishedCoachCardsByCategory`, and both call sites
-- (the public API route and the category page server component) now use the
-- service role, which bypasses RLS regardless of how the view is defined. Safe
-- to convert.

ALTER VIEW public.coach_cards_with_categories SET (security_invoker = on);

-- =====================================================
-- Deliberately NOT converted here
-- =====================================================
-- members_internal, members_external, members_on_loan, members_with_metadata,
-- member_fee_status, betting_leaderboard.
--
-- These are read by signed-in users through API routes that use the caller's
-- client. Flipping them to security_invoker makes every read depend on the RLS
-- policies of the base tables — and members_internal INNER JOINs
-- member_club_relationships, which already returns nothing to anon. If its
-- policy does not admit `authenticated`, converting the view empties the whole
-- members list, the coach portal and the payment overview at once.
--
-- Run the query in the block below in the SQL editor first; the conversion can
-- then be written against what the policies actually say.
--
  SELECT c.relname AS object,
         c.relrowsecurity AS rls_enabled,
         p.polname AS policy,
         pg_get_expr(p.polqual, p.polrelid) AS using_expr,
         ARRAY(SELECT rolname FROM pg_roles WHERE oid = ANY(p.polroles)) AS roles,
         CASE p.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT'
                       WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE'
                       ELSE 'ALL' END AS command
    FROM pg_class c
    LEFT JOIN pg_policy p ON p.polrelid = c.oid
   WHERE c.relnamespace = 'public'::regnamespace
     AND c.relname IN ('members', 'member_metadata', 'member_club_relationships',
                       'membership_fee_payments', 'coach_cards', 'coach_card_categories')
   ORDER BY c.relname, p.polname;

NOTIFY pgrst, 'reload schema';

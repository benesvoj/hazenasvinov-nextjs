-- =====================================================
-- Migration: Convert member views to security_invoker
-- Date: 2026-08-07
-- Description: Final pass over the Supabase linter's security_definer_view
--              errors. Converts the five member views now that the base table
--              policies are known to admit `authenticated`, and drops a
--              redundant PUBLIC policy on members that would re-open the table
--              to anon the moment anyone restores its grant.
-- Dependencies: members, member_metadata, member_club_relationships,
--               membership_fee_payments, members_internal, members_external,
--               members_on_loan, members_with_metadata, member_fee_status
-- =====================================================
--
-- WRITTEN AGAINST THE ACTUAL POLICIES (dumped from pg_policy):
--   members                     "Allow authenticated users to read members"      USING true            {authenticated}
--   member_metadata             "Allow authenticated users to read ..."          USING true            {authenticated}
--   member_club_relationships   "Users can view member club relationships"       USING auth.role() = 'authenticated'
--   membership_fee_payments     admin policy + coach policy scoped to assigned_categories
--
-- The relationships policy is the one that mattered: members_internal INNER
-- JOINs that table, so a policy excluding `authenticated` would have emptied
-- the members list the moment these views stopped bypassing RLS.

-- =====================================================
-- 1. Drop the redundant PUBLIC policy on members
-- =====================================================
-- `{}` roles means PUBLIC — anon included. Today only the missing table grant
-- keeps anonymous readers out; this policy would hand them every member row
-- again if the grant ever came back. Authenticated access is already covered by
-- "Allow authenticated users to read members".

DROP POLICY IF EXISTS "Members are viewable by everyone" ON public.members;

-- =====================================================
-- 2. Make sure the base grants survive the switch
-- =====================================================
-- Once the views stop running as their creator, every read needs the caller to
-- hold SELECT on the underlying tables, not just on the view.

GRANT SELECT ON public.members TO authenticated;
GRANT SELECT ON public.member_metadata TO authenticated;
GRANT SELECT ON public.member_club_relationships TO authenticated;
GRANT SELECT ON public.membership_fee_payments TO authenticated;

-- =====================================================
-- 3. Member views → security_invoker
-- =====================================================
-- member_fee_status is converted together with the rest on purpose: it is
-- nested inside members_internal, and a SECURITY DEFINER view inside an invoker
-- view would keep bypassing RLS for the payment columns.

ALTER VIEW public.members_internal SET (security_invoker = on);
ALTER VIEW public.members_external SET (security_invoker = on);
ALTER VIEW public.members_on_loan SET (security_invoker = on);
ALTER VIEW public.members_with_metadata SET (security_invoker = on);
ALTER VIEW public.member_fee_status SET (security_invoker = on);

-- ⚠️ BEHAVIOUR CHANGE, not a no-op:
-- membership_fee_payments restricts coaches to their `assigned_categories`.
-- While the views ran as DEFINER that policy was bypassed, so a coach saw the
-- payment status of members in other categories too. From now on they see only
-- their own — which is what the policy always intended, but it is a visible
-- difference. Admins are unaffected (their policy covers everything).
--
-- Check right after running, signed in as a coach and as an admin:
--   * coach portal → Členové: list is populated, payment column filled
--   * admin → Členové: list is populated, payment column filled
--   * member detail → contact/medical fields load (members_with_metadata)
--   * admin → Členové → příspěvky tab (member_fee_status)
-- If the list comes back empty, revert with:
--   ALTER VIEW public.members_internal SET (security_invoker = off);  -- etc.

-- =====================================================
-- Still open after this migration
-- =====================================================
-- betting_leaderboard, flagged twice: security_definer_view and
-- auth_users_exposed. Regranting cannot fix the second one — the view selects
-- from auth.users, so it has to be rewritten to resolve display names from
-- `profiles` instead. Separate change, needs the view definition.

NOTIFY pgrst, 'reload schema';


SELECT pg_get_viewdef('public.betting_leaderboard'::regclass, true);
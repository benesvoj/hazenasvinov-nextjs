-- =====================================================
-- Migration: Close the role-escalation hole in user_profiles
-- Date: 2026-08-10
-- Description: user_profiles carries unrestricted RLS policies, so any signed-in
--              user can rewrite their own row — including the `role` column —
--              and promote themselves to admin. Same pattern on user_roles.
--              Replaces them with admin-scoped policies built on the existing
--              is_admin() helper.
-- Dependencies: user_profiles, user_roles, role_definitions, is_admin()
-- =====================================================
--
-- Reported by the linter as rls_policy_always_true:
--   user_profiles  "Allow all operations"                        ALL     unrestricted
--   user_profiles  "Allow authenticated users to insert ..."     INSERT  unrestricted
--   user_profiles  "Allow authenticated users to update ..."     UPDATE  unrestricted
--   user_roles     "Allow authenticated users to insert/update"  both    unrestricted
--
-- Why this is not theoretical: the club has coach accounts, and a coach can
-- currently `update user_profiles set role = 'admin' where user_id = auth.uid()`
-- straight from the browser console with their own session.
--
-- VERIFIED BEFORE WRITING:
--   * role assignment runs from the browser (useUserRoles.ts → RoleAssignmentModal),
--     not through an API route, so the write path must keep working for admins.
--   * is_admin(uuid) returns true for an admin account and false for a coach —
--     tested through RPC against production.
--   * is_admin is SECURITY DEFINER, so using it inside a user_profiles policy
--     does not recurse into that table's own RLS.

-- =====================================================
-- 1. user_profiles
-- =====================================================

DROP POLICY IF EXISTS "Allow all operations" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update user_profiles" ON public.user_profiles;

-- Everyone signed in may read: the app resolves roles and assigned categories
-- for the current user, and admin screens list all profiles.
CREATE POLICY "user_profiles_select_policy"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Writing is an administrative act. Admins keep doing it from the browser;
-- everyone else is refused, including on their own row.
CREATE POLICY "user_profiles_insert_policy"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "user_profiles_update_policy"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "user_profiles_delete_policy"
  ON public.user_profiles FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- =====================================================
-- 2. user_roles
-- =====================================================
-- Same exposure, same fix.

DROP POLICY IF EXISTS "Allow authenticated users to insert user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to update user_roles" ON public.user_roles;

CREATE POLICY "user_roles_insert_policy"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "user_roles_update_policy"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 3. role_definitions
-- =====================================================
-- The catalogue of roles themselves — writable by anyone signed in today.

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.role_definitions;

CREATE POLICY "role_definitions_insert_policy"
  ON public.role_definitions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- Verify after running
-- =====================================================
-- As an ADMIN account:
--   admin → Uživatelé → přiřadit roli    must still save
-- As a COACH account:
--   the coach portal must load (it reads user_profiles for assigned_categories)
--   and this must now fail from the browser console:
--     await supabase.from('user_profiles')
--       .update({role: 'admin'}).eq('user_id', (await supabase.auth.getUser()).data.user.id)
--   → expected: 0 rows updated / permission error, role unchanged.

NOTIFY pgrst, 'reload schema';

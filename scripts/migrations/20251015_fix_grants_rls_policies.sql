-- =====================================================
-- Fix Grants Table RLS Policies
-- Created: 2025-10-15
-- Purpose: Fix RLS policies to use user_profiles instead of non-existent profiles table
-- Issue: User deletion failing due to "relation profiles does not exist" error
-- =====================================================

-- Drop existing RLS policies that reference the non-existent profiles table
DROP POLICY IF EXISTS "Admins can view all grants" ON public.grants;
DROP POLICY IF EXISTS "Admins can insert grants" ON public.grants;
DROP POLICY IF EXISTS "Admins can update grants" ON public.grants;
DROP POLICY IF EXISTS "Admins can delete grants" ON public.grants;

-- Recreate RLS policies using user_profiles table (which actually exists)

-- Admins can view all grants (including inactive)
CREATE POLICY "Admins can view all grants"
    ON public.grants
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Admins can insert grants
CREATE POLICY "Admins can insert grants"
    ON public.grants
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Admins can update grants
CREATE POLICY "Admins can update grants"
    ON public.grants
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Admins can delete grants (soft delete by setting is_active to false)
CREATE POLICY "Admins can delete grants"
    ON public.grants
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Verify the policies were created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'grants'
ORDER BY policyname;
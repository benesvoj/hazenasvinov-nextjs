-- =====================================================
-- Grants Calendar Database Schema
-- Created: 2025-10-15
-- Purpose: Store grant information for calendar reminders
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- GRANTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.grants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_grants_month ON public.grants(month);
CREATE INDEX IF NOT EXISTS idx_grants_is_active ON public.grants(is_active);
CREATE INDEX IF NOT EXISTS idx_grants_created_at ON public.grants(created_at DESC);

-- Add RLS policies for grants
ALTER TABLE public.grants ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active grants
CREATE POLICY "Authenticated users can view active grants"
    ON public.grants
    FOR SELECT
    USING (auth.role() = 'authenticated' AND is_active = true);

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

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_grants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for grants updated_at
DROP TRIGGER IF EXISTS update_grants_updated_at ON public.grants;
CREATE TRIGGER update_grants_updated_at
    BEFORE UPDATE ON public.grants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_grants_updated_at();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant access to authenticated users
GRANT SELECT ON public.grants TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.grants TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.grants IS 'Grant calendar for tracking grant application deadlines';
COMMENT ON COLUMN public.grants.month IS 'Month when the grant is due (1-12)';
COMMENT ON COLUMN public.grants.name IS 'Name of the grant';
COMMENT ON COLUMN public.grants.description IS 'Additional details about the grant';
COMMENT ON COLUMN public.grants.is_active IS 'Whether the grant is active (soft delete)';

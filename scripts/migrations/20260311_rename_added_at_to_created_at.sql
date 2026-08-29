-- =====================================================
-- Migration: Standardize audit columns in category_lineup_members
-- Date: 2026-03-11
-- Description: Rename added_at → created_at, added_by → created_by.
--              Add updated_at, updated_by columns.
--              Aligns with standard audit column convention for all tables.
-- Dependencies: category_lineup_members table
-- =====================================================

-- Rename existing columns
ALTER TABLE public.category_lineup_members
  RENAME COLUMN added_at TO created_at;

ALTER TABLE public.category_lineup_members
  RENAME COLUMN added_by TO created_by;

-- Add new audit columns
ALTER TABLE public.category_lineup_members
  ADD COLUMN updated_at timestamptz DEFAULT NULL,
  ADD COLUMN updated_by uuid DEFAULT NULL REFERENCES auth.users(id);
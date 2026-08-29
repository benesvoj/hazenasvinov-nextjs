-- =====================================================
-- Migration: Add 'full_match' value to videos.match_part CHECK constraint
-- Date: 2026-05-12
-- Description: Extends the allowed values for match_part to include
--              'full_match' for recordings that cover the entire match.
-- Dependencies: videos table, 20260512_add_match_part_to_videos.sql
-- =====================================================

ALTER TABLE public.videos
  DROP CONSTRAINT IF EXISTS videos_match_part_check;

ALTER TABLE public.videos
  ADD CONSTRAINT videos_match_part_check
    CHECK (match_part IN ('first_half', 'second_half', 'overtime', 'full_match'));

-- =====================================================
-- Migration: Add match_part column to videos table
-- Date: 2026-05-12
-- Description: Adds optional 'match_part' column to store which part of the
--              match a recording covers (1st half, 2nd half, overtime).
--              Nullable — recordings not tied to a specific part (e.g. full
--              match, training) leave this field NULL.
-- Dependencies: videos table
-- =====================================================

ALTER TABLE public.videos
  ADD COLUMN match_part text DEFAULT NULL
    CHECK (match_part IN ('first_half', 'second_half', 'overtime'));

COMMENT ON COLUMN public.videos.match_part IS
  'Optional: which part of the match this recording covers. Values: first_half, second_half, overtime.';

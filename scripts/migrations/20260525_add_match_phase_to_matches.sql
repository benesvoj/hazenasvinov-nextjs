-- =====================================================
-- Migration: Add match_phase column to matches
-- Date: 2026-05-25
-- Description: Distinguishes regular season matches from playoff rounds
--              (quarterfinal, semifinal, final). Standings calculation
--              filters to 'regular' only so playoff results don't affect
--              the regular season table.
-- Dependencies: matches
-- =====================================================

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS match_phase TEXT NOT NULL DEFAULT 'regular'
    CONSTRAINT matches_match_phase_check
    CHECK (match_phase IN ('regular', 'quarterfinal', 'semifinal', 'final'));

-- Index for fast filtering in standings calculation
CREATE INDEX IF NOT EXISTS idx_matches_match_phase ON matches(match_phase);

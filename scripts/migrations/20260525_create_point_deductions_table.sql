-- =====================================================
-- Migration: Create point_deductions table
-- Date: 2026-05-25
-- Description: Stores manual point deductions for teams in league standings.
--              Used when a club lacks adequate youth teams of the same gender.
--              Deductions survive standings recalculation and are applied on top
--              of match-based points.
-- Dependencies: club_category_teams, categories, seasons
-- =====================================================

-- =====================================================
-- Table: point_deductions
-- =====================================================

CREATE TABLE IF NOT EXISTS point_deductions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID NOT NULL REFERENCES club_category_teams(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  season_id   UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  points      INTEGER NOT NULL CHECK (points < 0),
  reason      TEXT,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_point_deductions_team_id     ON point_deductions(team_id);
CREATE INDEX IF NOT EXISTS idx_point_deductions_category_id ON point_deductions(category_id);
CREATE INDEX IF NOT EXISTS idx_point_deductions_season_id   ON point_deductions(season_id);
CREATE INDEX IF NOT EXISTS idx_point_deductions_cat_season  ON point_deductions(category_id, season_id);

-- Enable Row Level Security
ALTER TABLE point_deductions ENABLE ROW LEVEL SECURITY;

-- SELECT: all authenticated users can read
CREATE POLICY "point_deductions_select_policy"
  ON point_deductions FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: admin only (enforced via API layer using withAdminAuth)
CREATE POLICY "point_deductions_insert_policy"
  ON point_deductions FOR INSERT
  TO service_role
  WITH CHECK (true);

-- UPDATE: admin only
CREATE POLICY "point_deductions_update_policy"
  ON point_deductions FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- DELETE: admin only
CREATE POLICY "point_deductions_delete_policy"
  ON point_deductions FOR DELETE
  TO service_role
  USING (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_point_deductions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER point_deductions_updated_at_trigger
  BEFORE UPDATE ON point_deductions
  FOR EACH ROW EXECUTE FUNCTION update_point_deductions_updated_at();

-- =====================================================
-- Alter: standings
-- Add points_deduction column to track applied deductions per recalculation
-- =====================================================

ALTER TABLE standings
  ADD COLUMN IF NOT EXISTS points_deduction INTEGER NOT NULL DEFAULT 0;

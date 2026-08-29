-- =====================================================
-- Migration: Create referees and match_referees tables
-- Date: 2026-05-14
-- Description: Adds referee management — a referee profile table (referees)
--              with optional link to club members, and a join table (match_referees)
--              linking referees to matches with order (1st/2nd referee).
-- Dependencies: members, matches
-- =====================================================

-- =====================================================
-- Table: referees
-- =====================================================

CREATE TABLE IF NOT EXISTS public.referees (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  surname     TEXT        NOT NULL,
  member_id   UUID        REFERENCES public.members(id) ON DELETE SET NULL,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE  public.referees              IS 'Referee profiles — club members or external referees';
COMMENT ON COLUMN public.referees.member_id   IS 'Set when the referee is also a club member, NULL for external referees';

CREATE INDEX IF NOT EXISTS idx_referees_member_id  ON public.referees(member_id);
CREATE INDEX IF NOT EXISTS idx_referees_is_active  ON public.referees(is_active);

ALTER TABLE public.referees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referees_select_policy"
  ON public.referees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "referees_insert_policy"
  ON public.referees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "referees_update_policy"
  ON public.referees FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "referees_delete_policy"
  ON public.referees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION public.update_referees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS referees_updated_at_trigger ON public.referees;
CREATE TRIGGER referees_updated_at_trigger
  BEFORE UPDATE ON public.referees
  FOR EACH ROW EXECUTE FUNCTION public.update_referees_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.referees TO authenticated;

-- =====================================================
-- Table: match_referees
-- =====================================================

CREATE TABLE IF NOT EXISTS public.match_referees (
  match_id    UUID        NOT NULL REFERENCES public.matches(id)   ON DELETE CASCADE,
  referee_id  UUID        NOT NULL REFERENCES public.referees(id)  ON DELETE RESTRICT,
  "order"     SMALLINT    NOT NULL CHECK ("order" IN (1, 2)),
  PRIMARY KEY (match_id, referee_id),
  UNIQUE (match_id, "order")
);

COMMENT ON TABLE  public.match_referees         IS 'Referees assigned to a match — up to 2 per match';
COMMENT ON COLUMN public.match_referees."order" IS '1 = first referee, 2 = second referee';

CREATE INDEX IF NOT EXISTS idx_match_referees_match_id   ON public.match_referees(match_id);
CREATE INDEX IF NOT EXISTS idx_match_referees_referee_id ON public.match_referees(referee_id);

ALTER TABLE public.match_referees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "match_referees_select_policy"
  ON public.match_referees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "match_referees_insert_policy"
  ON public.match_referees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "match_referees_update_policy"
  ON public.match_referees FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "match_referees_delete_policy"
  ON public.match_referees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_referees TO authenticated;

-- =====================================================
-- Migration: Rewrite betting_leaderboard without auth.users
-- Date: 2026-08-07
-- Description: Clears the auth_users_exposed error. The leaderboard selected
--              straight from auth.users and fell back to the login e-mail when
--              a user had no full_name in their metadata, so players saw each
--              other's e-mail addresses. It also listed every registered
--              account in the system, betting or not.
-- Dependencies: profiles, betting_wallets, betting_bets
-- =====================================================
--
-- NOTE: betting_leaderboard is a MATERIALIZED view (created in
-- 20251013_create_betting_tables.sql), so it cannot be CREATE OR REPLACE'd —
-- it has to be dropped and rebuilt, which also drops its index and grants.
-- Both are restored below. Materialized views ignore RLS entirely and always
-- run as their owner; there is no security_invoker option for them, which is
-- why this migration only removes the auth.users dependency.
--
-- MEASURED BEFORE WRITING:
--   betting_wallets   1 row      → exactly one person actually plays
--   betting_bets      3 rows
--   betting_leaderboard returned 6 rows, one user_name being an e-mail address
--   profiles          19 rows, only 3 with display_name filled in
--
-- Two changes follow from that:
--   * names come from `profiles.display_name`, never from an e-mail. With 16 of
--     19 profiles missing a display name, most players show as "Hráč" until
--     they fill their profile in — deliberately, because the alternative is
--     publishing e-mail addresses to everyone in the game.
--   * only people with a wallet or a settled bet appear. Listing all 19
--     accounts with zeroes was noise, and it leaked who has an account at all.

DROP MATERIALIZED VIEW IF EXISTS public.betting_leaderboard;

CREATE MATERIALIZED VIEW public.betting_leaderboard AS
SELECT
  p.user_id,
  COALESCE(NULLIF(btrim(p.display_name), ''), 'Hráč') AS user_name,
  COALESCE(w.balance, 0::numeric) AS current_balance,
  COALESCE(stats.total_bets, 0::bigint) AS total_bets,
  COALESCE(stats.won_bets, 0::bigint) AS won_bets,
  COALESCE(stats.lost_bets, 0::bigint) AS lost_bets,
  COALESCE(stats.total_wagered, 0::numeric) AS total_wagered,
  COALESCE(stats.total_winnings, 0::numeric) AS total_winnings,
  COALESCE(stats.total_winnings - stats.total_wagered, 0::numeric) AS net_profit,
  CASE
    WHEN COALESCE(stats.total_bets, 0::bigint) > 0
      THEN round(COALESCE(stats.won_bets, 0::bigint)::numeric / stats.total_bets::numeric * 100::numeric, 2)
    ELSE 0::numeric
  END AS win_rate,
  CASE
    WHEN COALESCE(stats.total_wagered, 0::numeric) > 0::numeric
      THEN round(COALESCE(stats.total_winnings - stats.total_wagered, 0::numeric) / stats.total_wagered * 100::numeric, 2)
    ELSE 0::numeric
  END AS roi
FROM public.profiles p
  LEFT JOIN public.betting_wallets w ON w.user_id = p.user_id
  LEFT JOIN (
    SELECT
      betting_bets.user_id,
      count(*) AS total_bets,
      count(*) FILTER (WHERE betting_bets.status = 'WON'::text) AS won_bets,
      count(*) FILTER (WHERE betting_bets.status = 'LOST'::text) AS lost_bets,
      sum(betting_bets.stake) AS total_wagered,
      sum(
        CASE
          WHEN betting_bets.status = 'WON'::text THEN betting_bets.potential_return
          ELSE 0::numeric
        END
      ) AS total_winnings
    FROM public.betting_bets
    WHERE betting_bets.status = ANY (ARRAY['WON'::text, 'LOST'::text])
    GROUP BY betting_bets.user_id
  ) stats ON stats.user_id = p.user_id
WHERE w.user_id IS NOT NULL OR stats.user_id IS NOT NULL
ORDER BY COALESCE(stats.total_winnings - stats.total_wagered, 0::numeric) DESC;

-- Unique index restored: refresh_betting_leaderboard() runs REFRESH ...
-- CONCURRENTLY, which Postgres refuses without one.
CREATE UNIQUE INDEX IF NOT EXISTS idx_betting_leaderboard_user_id
  ON public.betting_leaderboard (user_id);

-- Grants are lost with the drop. anon deliberately gets nothing — the betting
-- page renders a login form for anonymous visitors.
GRANT SELECT ON public.betting_leaderboard TO authenticated;

-- =====================================================
-- Verification
-- =====================================================
-- SELECT user_id, user_name, total_bets FROM betting_leaderboard;
--   → expect 1 row today (the single wallet), no e-mail addresses in user_name
--
-- The view is populated by CREATE; refresh_betting_leaderboard() keeps working
-- unchanged for later settlements.

NOTIFY pgrst, 'reload schema';

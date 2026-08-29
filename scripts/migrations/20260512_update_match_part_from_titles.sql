-- =====================================================
-- Migration: Backfill match_part column from video titles
-- Date: 2026-05-12
-- Description: Detects match part indicators in video titles and sets
--              match_part accordingly. Only updates rows where match_part
--              is currently NULL to avoid overwriting manual edits.
--
-- Patterns matched (case-insensitive):
--   first_half  : 1.poločas, I.poločas, 1. pol, I. pol, 1.půle, ...
--   second_half : 2.poločas, II.poločas, 2. pol, II. pol, 2.půle, ...
--   overtime    : nastavení, prodlož., prodlouž.
--
-- Run BEFORE the cleanup script (20260512_remove_match_part_from_titles.sql)
-- =====================================================

-- Preview (run SELECT first to verify matches before UPDATE):
-- SELECT id, title,
--   CASE
--     WHEN title ~* '(^|[\s\-–|(\[])([1I])\.\s*(polo[cč]as|pol\M|p[uů]le?)'   THEN 'first_half'
--     WHEN title ~* '(^|[\s\-–|(\[])(II|2)\.\s*(polo[cč]as|pol\M|p[uů]le?)'   THEN 'second_half'
--     WHEN title ~* '(^|[\s\-–|(\[])(nastaven[íi]|prodlou[žz])'                THEN 'overtime'
--   END AS detected_part
-- FROM public.videos
-- WHERE match_part IS NULL
-- ORDER BY title;

-- ── 1. poločas ──────────────────────────────────────────────────────────────
UPDATE public.videos
SET    match_part = 'first_half'
WHERE  match_part IS NULL
  AND  title ~* '(^|[\s\-–|(\[])([1I])\.\s*(polo[cč]as|pol\M|p[uů]le?)';

-- ── 2. poločas ──────────────────────────────────────────────────────────────
UPDATE public.videos
SET    match_part = 'second_half'
WHERE  match_part IS NULL
  AND  title ~* '(^|[\s\-–|(\[])(II|2)\.\s*(polo[cč]as|pol\M|p[uů]le?)';

-- ── Nastavení / prodloužení ──────────────────────────────────────────────────
UPDATE public.videos
SET    match_part = 'overtime'
WHERE  match_part IS NULL
  AND  title ~* '(^|[\s\-–|(\[])(nastaven[íi]|prodlou[žz])';

-- Verify result:
-- SELECT match_part, count(*) FROM public.videos GROUP BY match_part ORDER BY match_part;

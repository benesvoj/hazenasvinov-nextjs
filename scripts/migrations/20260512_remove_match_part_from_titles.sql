-- =====================================================
-- Migration: Remove match_part indicators from video titles
-- Date: 2026-05-12
-- Description: Strips match part strings from titles after they have been
--              migrated to the match_part column. Handles common separators
--              (dash, en-dash, pipe, brackets, parentheses) and trims result.
--
-- ⚠️  Run AFTER 20260512_update_match_part_from_titles.sql
-- ⚠️  Only touches rows where match_part IS NOT NULL (i.e. was set by backfill)
--
-- Regex covers variants like:
--   "... - 1. poločas"   "... – I.poločas"   "... | 1.pol"
--   "... (1. poločas)"   "... [I. poločas]"
--   "1. poločas - ..."   "[I.poločas] ..."
-- =====================================================

-- Preview (verify before applying):
-- SELECT id, title,
--   trim(regexp_replace(
--     title,
--     '\s*[\-–|]\s*(II|2|[1I])\.\s*(polo[cč]as|pol\M|p[uů]le?)'
--     || '|\s*[\(\[](II|2|[1I])\.\s*(polo[cč]as|pol\M|p[uů]le?)[\)\]]'
--     || '|(II|2|[1I])\.\s*(polo[cč]as|pol\M|p[uů]le?)\s*[\-–|]\s*'
--     || '|[\(\[](II|2|[1I])\.\s*(polo[cč]as|pol\M|p[uů]le?)[\)\]]\s*'
--     || '|\s*[\-–|]\s*(nastaven[íi]|prodlou[žz][a-záéíóúůýčďěňřšťž]*)'
--     || '|\s*[\(\[](nastaven[íi]|prodlou[žz][a-záéíóúůýčďěňřšťž]*)[\)\]]',
--     '', 'gi'
--   )) AS cleaned_title
-- FROM public.videos
-- WHERE match_part IS NOT NULL
-- ORDER BY title;

UPDATE public.videos
SET title = trim(regexp_replace(
  title,
  -- variant A: "... - 1. poločas" / "... – II.pol" / "... | 1. půle"
  '\s*[\-–|]\s*(II|2|[1I])\.\s*(polo[cč]as|pol\M|p[uů]le?)'
  -- variant B: "... (1. poločas)" / "... [I. pol]"
  || '|\s*[\(\[](II|2|[1I])\.\s*(polo[cč]as|pol\M|p[uů]le?)[\)\]]'
  -- variant C: "1. poločas - ..." (indicator at start with trailing separator)
  || '|(II|2|[1I])\.\s*(polo[cč]as|pol\M|p[uů]le?)\s*[\-–|]\s*'
  -- variant D: "[1. poločas] ..." (bracketed at start)
  || '|[\(\[](II|2|[1I])\.\s*(polo[cč]as|pol\M|p[uů]le?)[\)\]]\s*'
  -- variant E: bare indicator without separator (last resort)
  || '|\s*(II|2|[1I])\.\s*(polo[cč]as|pol\M|p[uů]le?)'
  -- variant F: nastavení / prodloužení with separator
  || '|\s*[\-–|]\s*(nastaven[íi]|prodlou[žz][a-záéíóúůýčďěňřšťž]*)'
  || '|\s*[\(\[](nastaven[íi]|prodlou[žz][a-záéíóúůýčďěňřšťž]*)[\)\]]'
  || '|\s*(nastaven[íi]|prodlou[žz][a-záéíóúůýčďěňřšťž]*)',
  '', 'gi'
))
WHERE match_part IS NOT NULL;

-- Verify — inspect a few results:
-- SELECT id, title, match_part FROM public.videos WHERE match_part IS NOT NULL ORDER BY title;

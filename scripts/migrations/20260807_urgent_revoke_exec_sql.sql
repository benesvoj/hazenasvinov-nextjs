-- =====================================================
-- Migration: URGENT — revoke arbitrary SQL execution from public roles
-- Date: 2026-08-07
-- Description: public.exec_sql(text) is SECURITY DEFINER and executable by the
--              anon role, so anyone holding the public anon key — which ships
--              in the browser bundle — can run arbitrary SQL against the
--              database. Run this before anything else in the warnings backlog.
-- Dependencies: exec_sql and the internal SECURITY DEFINER helpers below
-- =====================================================
--
-- CONFIRMED against production, not inferred:
--   POST /rest/v1/rpc/exec_sql  {"sql":"select 1"}  with the anon key
--   → HTTP 200, "SQL executed successfully"
--
-- Every RLS policy and grant fixed in the previous migrations is worthless
-- while this stands: a caller can simply GRANT themselves access, change a
-- role, or copy data into a table they can read.

-- =====================================================
-- 1. exec_sql
-- =====================================================
-- service_role keeps it — the admin API route uses it for index maintenance
-- and refreshes, and that path is being moved to the service-role client.

REVOKE EXECUTE ON FUNCTION public.exec_sql(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.exec_sql(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.exec_sql(text) FROM authenticated;

-- Consider dropping it altogether once the admin route stops calling it:
-- DROP FUNCTION public.exec_sql(text);

-- =====================================================
-- 2. Trigger functions exposed as callable RPCs
-- =====================================================
-- These fire from triggers, which do not consult EXECUTE grants. Being
-- reachable over the API only lets a caller invoke them out of context —
-- handle_new_user() and sync_profiles_on_user_profiles_change() touch profile
-- and role data, so that is not academic.

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_profiles_on_user_profiles_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_members_audit_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_metadata_created_by() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_refresh_attendance_stats() FROM PUBLIC, anon, authenticated;

-- The grant on set_members_audit_fields came from my own audit-trail migration
-- (20260807_add_member_audit_columns.sql). It was never needed — trigger
-- functions do not require EXECUTE — and it is withdrawn here.

-- =====================================================
-- 3. Maintenance routines
-- =====================================================
-- Refresh jobs belong to the backend, not to browsers. `refresh_materialized_view`
-- is only reachable today through dead client code (see refreshMaterializedView.ts,
-- which has no callers).

REVOKE EXECUTE ON FUNCTION public.refresh_materialized_view(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_attendance_statistics_summary() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.force_refresh_attendance_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.scheduled_refresh_attendance_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_user_profile(uuid) FROM PUBLIC, anon;

-- =====================================================
-- Verify
-- =====================================================
-- Repeat the probe with the anon key — it must now fail:
--   curl -X POST "$URL/rest/v1/rpc/exec_sql" -H "apikey: $ANON_KEY" \
--        -H "Authorization: Bearer $ANON_KEY" -H "Content-Type: application/json" \
--        -d '{"sql":"select 1"}'
--   → expected: 404 or "permission denied for function exec_sql"

NOTIFY pgrst, 'reload sch   ema';

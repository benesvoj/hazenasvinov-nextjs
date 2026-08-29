-- =====================================================
-- Migration: Pin search_path on all public functions
-- Date: 2026-08-10
-- Description: 73 functions run with a mutable search_path. In a SECURITY
--              DEFINER function that is a privilege-escalation vector: an
--              unqualified call resolves through whatever schema comes first
--              for the caller, so a table or function planted in an earlier
--              schema gets executed with the definer's rights instead.
-- Dependencies: every function in the public schema
-- =====================================================
--
-- RUN THIS IN TWO STEPS. Step 1 is a plain SELECT that writes the ALTER
-- statements for you; step 2 is running its output. No PL/pgSQL, no dollar
-- quoting — SQL clients that split input on semicolons mangle a DO block
-- (they cut it at the first `;` inside the body and report unterminated
-- dollar-quoted string).
--
-- Generating the statements instead of listing 73 of them by hand is
-- deliberate: function names alone are ambiguous when overloads exist, and
-- `oid::regprocedure` renders the exact signature Postgres expects.
--
-- `pg_temp` goes LAST on purpose. It is searched first when unlisted, which is
-- exactly the hole being closed: a caller can create objects in their temp
-- schema and shadow an unqualified name inside a definer function.
--
-- `extensions` is included because Supabase installs unaccent, pg_trgm and
-- friends there; several functions call them unqualified and would break
-- against a bare `public, pg_temp`.

-- =====================================================
-- STEP 1 — generate the statements
-- =====================================================
-- Run this and copy the whole `statement` column.

SELECT format(
         'ALTER FUNCTION %s SET search_path = public, extensions, pg_temp;',
         p.oid::regprocedure
       ) AS statement
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   -- Functions and procedures, not aggregates or window functions.
   AND p.prokind IN ('f', 'p')
   -- Skip anything owned by an extension: not ours to touch, and ALTER would
   -- fail or be reverted by the next extension update.
   AND NOT EXISTS (
     SELECT 1 FROM pg_depend d
      WHERE d.objid = p.oid AND d.deptype = 'e'
   )
   -- Only the ones that do not already pin it.
   AND NOT EXISTS (
     SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) AS cfg
      WHERE cfg LIKE 'search_path=%'
   )
 ORDER BY 1;

-- =====================================================
-- STEP 2 — run the generated statements
-- =====================================================
-- Paste the output above and execute it. Each line is an independent statement,
-- so any client can handle them.

ALTER FUNCTION create_member_metadata() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION ensure_user_profile(uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION exec_sql(text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION force_refresh_attendance_stats() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION generate_registration_number() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION generate_teams_for_club_category(uuid,integer) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION get_active_members_for_club(uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION get_attendance_records(uuid,uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION get_attendance_summary(character varying,uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION get_attendance_summary(uuid,uuid,uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION get_attendance_trends(uuid,uuid,integer) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION get_current_club_for_member(uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION get_current_user_summary() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION get_match_stats(uuid,uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION get_member_attendance_stats(uuid,uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION get_member_club_history(uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION get_member_fee_status_for_year(uuid,integer) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION get_or_create_external_player(character varying,character varying,character varying,character varying,uuid,character varying) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION get_sponsorship_stats() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION get_teams_for_category_season(uuid,uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION get_training_session_stats(uuid,uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION get_training_sessions(uuid,uuid,uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION get_user_coach_categories(uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION get_user_profile_safe(uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION get_user_roles(uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION get_user_summary_by_id(uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION has_admin_access(uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION has_role(uuid,character varying) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION immutable_unaccent(text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION initialize_user_wallet() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION is_admin(uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION listen_for_attendance_stats_refresh() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION populate_profiles_additional_fields() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION populate_profiles_from_auth_users() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION refresh_attendance_statistics_summary() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION refresh_betting_leaderboard() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION refresh_match_stats() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION refresh_materialized_view(text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION refresh_profiles_mv() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION refresh_profiles_mv_with_stats() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION refresh_teams_materialized_view() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION scheduled_refresh_attendance_stats() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION search_external_players(character varying) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION search_text(members_external) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION search_text(members_internal) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION search_text(members_on_loan) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION search_text(members) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION set_album_cover_photo(uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION set_metadata_created_by() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION sync_all_profiles_data() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION sync_assigned_categories() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION sync_profiles_data() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION sync_profiles_from_user_profiles() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION trigger_refresh_attendance_stats() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION trigger_refresh_match_stats() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION trigger_refresh_teams_mv() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION update_album_cover_photo() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION update_grants_updated_at() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION update_match_metadata_updated_at() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION update_meeting_attendees_updated_at() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION update_meeting_minutes_updated_at() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION update_member_club_relationships_updated_at() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION update_member_functions_updated_at() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION update_membership_fee_updated_at() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION update_members_updated_at() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION update_point_deductions_updated_at() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION update_referees_updated_at() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION update_tournaments_updated_at() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION update_updated_at_column() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION update_videos_updated_at() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION user_has_profile(uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION validate_team_manager_requirement() SET search_path = public, extensions, pg_temp;



-- =====================================================
-- STEP 3 — verify
-- =====================================================
-- Re-run the STEP 1 query. Zero rows means every public function now carries an
-- explicit search_path.
--
-- Then exercise the app: creating a member (audit trigger), recording
-- attendance (stats triggers), and an admin match edit (materialized view
-- refresh) all run through functions this migration touches. A function that
-- relied on an unqualified name from a schema outside the new path would fail
-- loudly there.

NOTIFY pgrst, 'reload schema';

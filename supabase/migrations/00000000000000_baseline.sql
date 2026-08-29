

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE SCHEMA IF NOT EXISTS "next_auth";


ALTER SCHEMA "next_auth" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "hypopg" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "index_advisor" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "next_auth"."uid"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select
  	coalesce(
		nullif(current_setting('request.jwt.claim.sub', true), ''),
		(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
	)::uuid
$$;


ALTER FUNCTION "next_auth"."uid"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_member_metadata"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  INSERT INTO member_metadata (member_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_member_metadata"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_user_profile"("input_user_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  profile_id UUID;
BEGIN
  -- Check if user exists in profiles using user_id field
  SELECT id INTO profile_id FROM profiles WHERE user_id = input_user_id;
  
  -- If user doesn't exist, create a basic profile
  IF profile_id IS NULL THEN
    INSERT INTO profiles (user_id, email, display_name, role, created_at, updated_at)
    VALUES (
      input_user_id,
      (SELECT email FROM auth.users WHERE id = input_user_id),
      COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = input_user_id), 'Unknown User'),
      'admin',
      NOW(),
      NOW()
    )
    RETURNING id INTO profile_id;
  END IF;
  
  RETURN profile_id;
END;
$$;


ALTER FUNCTION "public"."ensure_user_profile"("input_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."exec_sql"("sql" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
    result TEXT;
BEGIN
    -- Execute the SQL and return a success message
    EXECUTE sql;
    RETURN 'SQL executed successfully';
EXCEPTION
    WHEN OTHERS THEN
        -- Return error information
        RETURN 'Error: ' || SQLERRM;
END;
$$;


ALTER FUNCTION "public"."exec_sql"("sql" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."exec_sql"("sql" "text") IS 'Function to execute SQL dynamically from JavaScript scripts. Used for automated database fixes.';



CREATE OR REPLACE FUNCTION "public"."force_refresh_attendance_stats"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY attendance_statistics_summary;
  RAISE NOTICE 'Attendance statistics force refreshed at %', NOW();
END;
$$;


ALTER FUNCTION "public"."force_refresh_attendance_stats"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."force_refresh_attendance_stats"() IS 'Force immediate refresh of attendance statistics. Use for testing or when immediate update is required.';



CREATE OR REPLACE FUNCTION "public"."generate_registration_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
    new_reg_number VARCHAR(50);
    counter INTEGER := 1;
BEGIN
    -- Generate base registration number
    new_reg_number := 'REG-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(counter::text, 4, '0');
    
    -- Keep trying until we find a unique number
    WHILE EXISTS (SELECT 1 FROM members WHERE registration_number = new_reg_number) LOOP
        counter := counter + 1;
        new_reg_number := 'REG-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(counter::text, 4, '0');
    END LOOP;
    
    NEW.registration_number := new_reg_number;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_registration_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_teams_for_club_category"("p_club_category_id" "uuid", "p_max_teams" integer DEFAULT NULL::integer) RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
    v_max_teams INTEGER;
    v_team_suffix TEXT;
    v_suffixes TEXT[] := ARRAY['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    v_i INTEGER;
BEGIN
    -- Get max_teams from club_categories if not provided
    IF p_max_teams IS NULL THEN
        SELECT max_teams INTO v_max_teams 
        FROM club_categories 
        WHERE id = p_club_category_id;
    ELSE
        v_max_teams := p_max_teams;
    END IF;
    
    -- Clear existing teams for this club_category
    DELETE FROM club_category_teams WHERE club_category_id = p_club_category_id;
    
    -- Generate new teams based on max_teams
    FOR v_i IN 1..v_max_teams LOOP
        v_team_suffix := v_suffixes[v_i];
        
        INSERT INTO club_category_teams (club_category_id, team_suffix, is_active)
        VALUES (p_club_category_id, v_team_suffix, true);
        
        RAISE NOTICE 'Generated team % for club_category %', v_team_suffix, p_club_category_id;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."generate_teams_for_club_category"("p_club_category_id" "uuid", "p_max_teams" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_active_members_for_club"("club_uuid" "uuid") RETURNS TABLE("member_id" "uuid", "member_name" "text", "member_surname" "text", "registration_number" "text", "relationship_type" character varying, "valid_from" "date", "valid_to" "date")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id as member_id,
        m.name as member_name,
        m.surname as member_surname,
        m.registration_number,
        mcr.relationship_type,
        mcr.valid_from,
        mcr.valid_to
    FROM members m
    JOIN member_club_relationships mcr ON m.id = mcr.member_id
    WHERE mcr.club_id = club_uuid
      AND mcr.status = 'active'
      AND mcr.valid_from <= CURRENT_DATE
      AND (mcr.valid_to IS NULL OR mcr.valid_to >= CURRENT_DATE)
    ORDER BY m.surname, m.name;
END;
$$;


ALTER FUNCTION "public"."get_active_members_for_club"("club_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_attendance_records"("p_session_id" "uuid", "p_user_id" "uuid") RETURNS TABLE("id" "uuid", "member_id" "uuid", "member_name" character varying, "member_surname" character varying, "attendance_status" character varying, "notes" "text", "recorded_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ma.id,
        ma.member_id,
        m.name as member_name,
        m.surname as member_surname,
        ma.attendance_status,
        ma.notes,
        ma.recorded_at
    FROM member_attendance ma
    JOIN members m ON ma.member_id = m.id
    JOIN training_sessions ts ON ma.training_session_id = ts.id
    WHERE ma.training_session_id = p_session_id
    AND (
        -- Check if user is a coach for this session's category
        ts.coach_id = p_user_id
        OR
        -- Check if user has coach role for this session's category
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN categories c ON c.id = ts.category_id
            WHERE ur.user_id = p_user_id 
            AND ur.assigned_category_codes @> ARRAY[c.code]
            AND ur.role = 'coach'
        )
        OR
        -- Check if user is admin
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = p_user_id 
            AND ur.role = 'admin'
        )
    )
    ORDER BY m.surname, m.name;
END;
$$;


ALTER FUNCTION "public"."get_attendance_records"("p_session_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_attendance_records"("p_session_id" "uuid", "p_user_id" "uuid") IS 'Get attendance records for a specific session using category_id (updated from VARCHAR)';



CREATE OR REPLACE FUNCTION "public"."get_attendance_summary"("p_category" character varying, "p_season_id" "uuid") RETURNS TABLE("member_id" "uuid", "member_name" character varying, "member_surname" character varying, "total_sessions" integer, "present_count" integer, "absent_count" integer, "late_count" integer, "excused_count" integer, "attendance_percentage" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id as member_id,
        m.name as member_name,
        m.surname as member_surname,
        COUNT(ts.id)::INTEGER as total_sessions,
        COUNT(CASE WHEN ma.attendance_status = 'present' THEN 1 END)::INTEGER as present_count,
        COUNT(CASE WHEN ma.attendance_status = 'absent' THEN 1 END)::INTEGER as absent_count,
        COUNT(CASE WHEN ma.attendance_status = 'late' THEN 1 END)::INTEGER as late_count,
        COUNT(CASE WHEN ma.attendance_status = 'excused' THEN 1 END)::INTEGER as excused_count,
        CASE 
            WHEN COUNT(ts.id) > 0 THEN 
                ROUND(
                    (COUNT(CASE WHEN ma.attendance_status = 'present' THEN 1 END)::NUMERIC / COUNT(ts.id)::NUMERIC) * 100, 
                    2
                )
            ELSE 0 
        END as attendance_percentage
    FROM members m
    LEFT JOIN member_attendance ma ON m.id = ma.member_id
    LEFT JOIN training_sessions ts ON ma.training_session_id = ts.id 
        AND ts.category = p_category 
        AND ts.season_id = p_season_id
    WHERE m.category = p_category
    GROUP BY m.id, m.name, m.surname
    ORDER BY m.surname, m.name;
END;
$$;


ALTER FUNCTION "public"."get_attendance_summary"("p_category" character varying, "p_season_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_attendance_summary"("p_category" character varying, "p_season_id" "uuid") IS 'Get attendance summary for a category and season';



CREATE OR REPLACE FUNCTION "public"."get_attendance_summary"("p_category_id" "uuid", "p_season_id" "uuid", "p_user_id" "uuid") RETURNS TABLE("session_id" "uuid", "session_title" character varying, "session_date" "date", "total_members" integer, "present_count" integer, "absent_count" integer, "late_count" integer, "excused_count" integer)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ts.id as session_id,
        ts.title as session_title,
        ts.session_date,
        COUNT(ma.id)::INTEGER as total_members,
        COUNT(CASE WHEN ma.attendance_status = 'present' THEN 1 END)::INTEGER as present_count,
        COUNT(CASE WHEN ma.attendance_status = 'absent' THEN 1 END)::INTEGER as absent_count,
        COUNT(CASE WHEN ma.attendance_status = 'late' THEN 1 END)::INTEGER as late_count,
        COUNT(CASE WHEN ma.attendance_status = 'excused' THEN 1 END)::INTEGER as excused_count
    FROM training_sessions ts
    LEFT JOIN member_attendance ma ON ts.id = ma.training_session_id
    WHERE ts.category_id = p_category_id 
    AND ts.season_id = p_season_id
    AND (
        -- Check if user is a coach for this category
        ts.coach_id = p_user_id
        OR
        -- Check if user has coach role for this category
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN categories c ON c.id = p_category_id
            WHERE ur.user_id = p_user_id 
            AND ur.assigned_category_codes @> ARRAY[c.code]
            AND ur.role = 'coach'
        )
        OR
        -- Check if user is admin
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = p_user_id 
            AND ur.role = 'admin'
        )
    )
    GROUP BY ts.id, ts.title, ts.session_date
    ORDER BY ts.session_date DESC;
END;
$$;


ALTER FUNCTION "public"."get_attendance_summary"("p_category_id" "uuid", "p_season_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_attendance_trends"("p_category_id" "uuid", "p_season_id" "uuid", "p_days" integer DEFAULT 30) RETURNS TABLE("session_id" "uuid", "session_date" "date", "session_title" character varying, "present_count" bigint, "absent_count" bigint, "late_count" bigint, "excused_count" bigint, "total_members" bigint, "attendance_percentage" numeric)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  -- Calculate date range
  v_end_date := CURRENT_DATE;
  v_start_date := v_end_date - p_days;

  RETURN QUERY
  WITH category_members AS (
    -- Get total members for this category (for percentage calculation)
    SELECT COUNT(*)::BIGINT as total
    FROM members
    WHERE category_id = p_category_id
  )
  SELECT
    ts.id as session_id,
    ts.session_date::DATE as session_date,
    ts.title as session_title,

    -- Count attendance by status
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'present') as present_count,
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'absent') as absent_count,
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'late') as late_count,
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'excused') as excused_count,

    -- Total members in category
    cm.total as total_members,

    -- Calculate attendance percentage
    ROUND(
      COALESCE(
        COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'present')::numeric
        / NULLIF(cm.total, 0) * 100,
        0
      ),
      2
    ) as attendance_percentage

  FROM training_sessions ts
  CROSS JOIN category_members cm
  LEFT JOIN member_attendance ma ON ts.id = ma.training_session_id
  WHERE ts.category_id = p_category_id
    AND ts.season_id = p_season_id
    AND ts.status = 'done'
    AND ts.session_date >= v_start_date
    AND ts.session_date <= v_end_date
  GROUP BY ts.id, ts.session_date, ts.title, cm.total
  ORDER BY ts.session_date ASC;
END;
$$;


ALTER FUNCTION "public"."get_attendance_trends"("p_category_id" "uuid", "p_season_id" "uuid", "p_days" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_attendance_trends"("p_category_id" "uuid", "p_season_id" "uuid", "p_days" integer) IS 'Returns attendance trends over specified number of days. Replaces N+1 query pattern for session statistics.';



CREATE OR REPLACE FUNCTION "public"."get_current_club_for_member"("member_uuid" "uuid") RETURNS TABLE("club_id" "uuid", "club_name" "text", "relationship_type" character varying, "valid_from" "date", "valid_to" "date")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as club_id,
        c.name as club_name,
        mcr.relationship_type,
        mcr.valid_from,
        mcr.valid_to
    FROM member_club_relationships mcr
    JOIN clubs c ON mcr.club_id = c.id
    WHERE mcr.member_id = member_uuid
      AND mcr.status = 'active'
      AND mcr.valid_from <= CURRENT_DATE
      AND (mcr.valid_to IS NULL OR mcr.valid_to >= CURRENT_DATE)
    ORDER BY mcr.valid_from DESC
    LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_current_club_for_member"("member_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_user_summary"() RETURNS TABLE("user_id" "uuid", "email" "text", "full_name" "text", "profile_role" "text", "roles" "text"[], "assigned_categories" "uuid"[], "assigned_category_names" "text"[], "assigned_category_codes" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.email,
        COALESCE(
            u.raw_user_meta_data->>'full_name',
            u.email
        ) as full_name,
        up.role as profile_role,
        COALESCE(array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}') as roles,
        COALESCE(array_agg(DISTINCT cc.category_id) FILTER (WHERE cc.category_id IS NOT NULL), '{}') as assigned_categories,
        COALESCE(array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL), '{}') as assigned_category_names,
        COALESCE(array_agg(DISTINCT c.code) FILTER (WHERE c.code IS NOT NULL), '{}') as assigned_category_codes
    FROM auth.users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN coach_categories cc ON u.id = cc.user_id
    LEFT JOIN categories c ON cc.category_id = c.id
    WHERE u.id = auth.uid() -- Only return data for the authenticated user
    GROUP BY u.id, u.email, u.raw_user_meta_data, up.role;
END;
$$;


ALTER FUNCTION "public"."get_current_user_summary"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_current_user_summary"() IS 'Secure function to get current user summary including email (only returns own data)';



CREATE OR REPLACE FUNCTION "public"."get_match_stats"("p_category_id" "uuid", "p_season_id" "uuid") RETURNS TABLE("total_matches" bigint, "completed_matches" bigint, "upcoming_matches" bigint, "avg_goals_per_match" numeric, "first_match_date" "date", "last_match_date" "date")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ms.total_matches,
    ms.completed_matches,
    ms.upcoming_matches,
    ms.avg_goals_per_match,
    ms.first_match_date,
    ms.last_match_date
  FROM match_stats ms
  WHERE ms.category_id = p_category_id 
    AND ms.season_id = p_season_id;
END;
$$;


ALTER FUNCTION "public"."get_match_stats"("p_category_id" "uuid", "p_season_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_match_stats"("p_category_id" "uuid", "p_season_id" "uuid") IS 'Get match statistics for a specific category and season';



CREATE OR REPLACE FUNCTION "public"."get_member_attendance_stats"("p_category_id" "uuid", "p_season_id" "uuid") RETURNS TABLE("member_id" "uuid", "member_name" character varying, "member_surname" character varying, "present_count" bigint, "absent_count" bigint, "late_count" bigint, "excused_count" bigint, "total_sessions" bigint, "attendance_percentage" numeric, "last_attendance_date" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  WITH done_sessions AS (
    SELECT id
    FROM training_sessions
    WHERE category_id = p_category_id
      AND season_id = p_season_id
      AND status = 'done'
  ),
  done_session_count AS (
    SELECT COUNT(*) AS total FROM done_sessions
  )
  SELECT
    m.id AS member_id,
    m.name AS member_name,
    m.surname AS member_surname,

    -- Count only attendance records for done sessions
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'present') AS present_count,
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'absent')  AS absent_count,
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'late')    AS late_count,
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'excused') AS excused_count,

    -- Total done sessions (same for all members in the category)
    dsc.total AS total_sessions,

    -- Attendance percentage based only on done sessions
    ROUND(
      COALESCE(
        COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'present')::numeric
        / NULLIF(dsc.total, 0) * 100,
        0
      ),
      2
    ) AS attendance_percentage,

    MAX(ma.recorded_at) AS last_attendance_date

  FROM members m
  CROSS JOIN done_session_count dsc
  LEFT JOIN member_attendance ma
    ON  ma.member_id           = m.id
    AND ma.training_session_id IN (SELECT id FROM done_sessions)
  WHERE m.category_id = p_category_id
  GROUP BY m.id, m.name, m.surname, dsc.total
  ORDER BY m.surname, m.name;
END;
$$;


ALTER FUNCTION "public"."get_member_attendance_stats"("p_category_id" "uuid", "p_season_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_member_attendance_stats"("p_category_id" "uuid", "p_season_id" "uuid") IS 'Returns attendance statistics for all members in a category/season.
Counts are scoped to done sessions only to keep total_sessions and
status counts consistent.';



CREATE OR REPLACE FUNCTION "public"."get_member_club_history"("member_uuid" "uuid") RETURNS TABLE("club_id" "uuid", "club_name" "text", "relationship_type" character varying, "status" character varying, "valid_from" "date", "valid_to" "date", "notes" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as club_id,
        c.name as club_name,
        mcr.relationship_type,
        mcr.status,
        mcr.valid_from,
        mcr.valid_to,
        mcr.notes
    FROM member_club_relationships mcr
    JOIN clubs c ON mcr.club_id = c.id
    WHERE mcr.member_id = member_uuid
    ORDER BY mcr.valid_from DESC;
END;
$$;


ALTER FUNCTION "public"."get_member_club_history"("member_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_member_fee_status_for_year"("p_member_id" "uuid", "p_calendar_year" integer) RETURNS TABLE("expected_fee" numeric, "total_paid" numeric, "payment_status" "text", "payment_count" bigint)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(cf.fee_amount, 0) as expected_fee,
        COALESCE(SUM(p.amount) FILTER (WHERE p.fee_type != 'refund'), 0) -
            COALESCE(SUM(p.amount) FILTER (WHERE p.fee_type = 'refund'), 0) as total_paid,
        CASE
            WHEN COALESCE(cf.fee_amount, 0) = 0 THEN 'not_required'
            WHEN (COALESCE(SUM(p.amount) FILTER (WHERE p.fee_type != 'refund'), 0) -
                  COALESCE(SUM(p.amount) FILTER (WHERE p.fee_type = 'refund'), 0)) >=
                  COALESCE(cf.fee_amount, 0) THEN 'paid'
            WHEN (COALESCE(SUM(p.amount) FILTER (WHERE p.fee_type != 'refund'), 0) -
                  COALESCE(SUM(p.amount) FILTER (WHERE p.fee_type = 'refund'), 0)) > 0 THEN 'partial'
            ELSE 'unpaid'
        END as payment_status,
        COUNT(p.id) FILTER (WHERE p.fee_type != 'refund') as payment_count
    FROM members m
    LEFT JOIN category_membership_fees cf ON (
        m.category_id = cf.category_id
        AND cf.calendar_year = p_calendar_year
        AND cf.is_active = TRUE
    )
    LEFT JOIN membership_fee_payments p ON (
        m.id = p.member_id
        AND p.calendar_year = p_calendar_year
    )
    WHERE m.id = p_member_id
    GROUP BY cf.fee_amount;
END;
$$;


ALTER FUNCTION "public"."get_member_fee_status_for_year"("p_member_id" "uuid", "p_calendar_year" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_member_fee_status_for_year"("p_member_id" "uuid", "p_calendar_year" integer) IS 'Calculate payment status for specific member and year';



CREATE OR REPLACE FUNCTION "public"."get_or_create_external_player"("p_registration_number" character varying, "p_name" character varying, "p_surname" character varying, "p_position" character varying, "p_club_id" "uuid" DEFAULT NULL::"uuid", "p_club_name" character varying DEFAULT NULL::character varying) RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
    player_id UUID;
BEGIN
    -- Try to find existing player by registration number
    SELECT id INTO player_id
    FROM external_players
    WHERE registration_number = p_registration_number;
    
    IF player_id IS NOT NULL THEN
        -- Update existing player if name/position changed
        UPDATE external_players 
        SET 
            name = p_name,
            surname = p_surname,
            "position" = p_position,
            club_id = COALESCE(p_club_id, club_id),
            club_name = COALESCE(p_club_name, club_name),
            updated_at = NOW()
        WHERE id = player_id;
    ELSE
        -- Create new external player
        INSERT INTO external_players (
            registration_number, 
            name, 
            surname, 
            "position", 
            club_id,
            club_name
        ) VALUES (
            p_registration_number, 
            p_name, 
            p_surname, 
            p_position, 
            p_club_id,
            p_club_name
        ) RETURNING id INTO player_id;
    END IF;
    
    RETURN player_id;
END;
$$;


ALTER FUNCTION "public"."get_or_create_external_player"("p_registration_number" character varying, "p_name" character varying, "p_surname" character varying, "p_position" character varying, "p_club_id" "uuid", "p_club_name" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_sponsorship_stats"() RETURNS TABLE("total_main_partners" bigint, "total_business_partners" bigint, "total_media_partners" bigint, "active_main_partners" bigint, "active_business_partners" bigint, "active_media_partners" bigint, "total_monthly_value_czk" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM main_partners) as total_main_partners,
        (SELECT COUNT(*) FROM business_partners) as total_business_partners,
        (SELECT COUNT(*) FROM media_partners) as total_media_partners,
        (SELECT COUNT(*) FROM main_partners WHERE status = 'active') as active_main_partners,
        (SELECT COUNT(*) FROM business_partners WHERE status = 'active') as active_business_partners,
        (SELECT COUNT(*) FROM media_partners WHERE status = 'active') as active_media_partners,
        (SELECT COALESCE(SUM(monthly_value_czk), 0) FROM media_partners WHERE status = 'active') as total_monthly_value_czk;
END;
$$;


ALTER FUNCTION "public"."get_sponsorship_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_teams_for_category_season"("p_category_id" "uuid", "p_season_id" "uuid") RETURNS TABLE("team_id" "uuid", "club_name" "text", "club_short_name" "text", "team_suffix" "text", "display_name" "text", "full_name" "text", "club_logo" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        td.team_id,
        td.club_name,
        td.club_short_name,
        td.team_suffix,
        td.display_name,
        td.full_name,
        td.club_logo
    FROM team_details td
    WHERE td.category_name = (SELECT name FROM categories WHERE id = p_category_id)
      AND td.season_name = (SELECT name FROM seasons WHERE id = p_season_id)
      AND td.team_active = true
      AND td.club_category_active = true
      AND td.season_active = true
    ORDER BY td.club_name, td.team_suffix;
END;
$$;


ALTER FUNCTION "public"."get_teams_for_category_season"("p_category_id" "uuid", "p_season_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_training_session_stats"("p_category_id" "uuid", "p_season_id" "uuid") RETURNS TABLE("total_sessions" bigint, "completed_sessions" bigint, "planned_sessions" bigint, "cancelled_sessions" bigint, "completion_rate" numeric, "total_attendance_records" bigint, "avg_attendance_per_session" numeric)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(ts.id) as total_sessions,
    COUNT(ts.id) FILTER (WHERE ts.status = 'done') as completed_sessions,
    COUNT(ts.id) FILTER (WHERE ts.status = 'planned') as planned_sessions,
    COUNT(ts.id) FILTER (WHERE ts.status = 'cancelled') as cancelled_sessions,
    ROUND(
      COUNT(ts.id) FILTER (WHERE ts.status = 'done')::numeric
      / NULLIF(COUNT(ts.id), 0) * 100,
      2
    ) as completion_rate,
    COUNT(ma.id) as total_attendance_records,
    ROUND(
      COUNT(ma.id)::numeric / NULLIF(COUNT(DISTINCT ts.id) FILTER (WHERE ts.status = 'done'), 0),
      2
    ) as avg_attendance_per_session
  FROM training_sessions ts
  LEFT JOIN member_attendance ma ON ts.id = ma.training_session_id
  WHERE ts.category_id = p_category_id
    AND ts.season_id = p_season_id;
END;
$$;


ALTER FUNCTION "public"."get_training_session_stats"("p_category_id" "uuid", "p_season_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_training_session_stats"("p_category_id" "uuid", "p_season_id" "uuid") IS 'Returns high-level training session statistics for a category/season.';



CREATE OR REPLACE FUNCTION "public"."get_training_sessions"("p_category_id" "uuid", "p_season_id" "uuid", "p_user_id" "uuid") RETURNS TABLE("id" "uuid", "title" character varying, "description" "text", "session_date" "date", "session_time" time without time zone, "location" character varying, "coach_id" "uuid", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ts.id,
        ts.title,
        ts.description,
        ts.session_date,
        ts.session_time,
        ts.location,
        ts.coach_id,
        ts.created_at
    FROM training_sessions ts
    WHERE ts.category_id = p_category_id 
    AND ts.season_id = p_season_id
    AND (
        -- Check if user is a coach for this category
        ts.coach_id = p_user_id
        OR
        -- Check if user has coach role for this category
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN categories c ON c.id = p_category_id
            WHERE ur.user_id = p_user_id 
            AND ur.assigned_category_codes @> ARRAY[c.code]
            AND ur.role = 'coach'
        )
        OR
        -- Check if user is admin
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = p_user_id 
            AND ur.role = 'admin'
        )
    )
    ORDER BY ts.session_date DESC, ts.session_time DESC;
END;
$$;


ALTER FUNCTION "public"."get_training_sessions"("p_category_id" "uuid", "p_season_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_coach_categories"("user_uuid" "uuid") RETURNS TABLE("category_id" "uuid", "category_name" character varying, "category_code" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.category_id,
        c.name as category_name,
        c.code as category_code
    FROM coach_categories cc
    JOIN categories c ON cc.category_id = c.id
    WHERE cc.user_id = user_uuid;
END;
$$;


ALTER FUNCTION "public"."get_user_coach_categories"("user_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_coach_categories"("user_uuid" "uuid") IS 'Get assigned categories for a coach';



CREATE OR REPLACE FUNCTION "public"."get_user_profile_safe"("user_uuid" "uuid") RETURNS TABLE("user_id" "uuid", "role" "text", "club_id" "uuid", "assigned_categories" "uuid"[], "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
        BEGIN
          -- ensure predictable search path and avoid accidental schema resolution issues
          PERFORM set_config('search_path', 'public, auth, pg_catalog', true);

          -- Check if profile exists
          IF NOT user_has_profile(user_uuid) THEN
            -- Create profile if it doesn't exist (fallback for existing users)
            INSERT INTO public.user_profiles (user_id, role, created_at, updated_at)
            VALUES (user_uuid, 'member', NOW(), NOW())
            ON CONFLICT (user_id) DO NOTHING;
          END IF;

          -- Return the profile (fully-qualified)
          RETURN QUERY
          SELECT 
            up.user_id,
            up.role,
            up.club_id,
            up.assigned_categories,
            up.created_at
          FROM public.user_profiles up
          WHERE up.user_id = user_uuid;
        END;
        $$;


ALTER FUNCTION "public"."get_user_profile_safe"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_roles"("user_uuid" "uuid") RETURNS TABLE("role" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    RETURN QUERY
    SELECT ur.role
    FROM user_roles ur
    WHERE ur.user_id = user_uuid;
END;
$$;


ALTER FUNCTION "public"."get_user_roles"("user_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_roles"("user_uuid" "uuid") IS 'Get all roles for a specific user (uses user_profiles only)';



CREATE OR REPLACE FUNCTION "public"."get_user_summary_by_id"("target_user_id" "uuid") RETURNS TABLE("user_id" "uuid", "email" "text", "full_name" "text", "profile_role" "text", "roles" "text"[], "assigned_categories" "uuid"[], "assigned_category_names" "text"[], "assigned_category_codes" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.user_id = auth.uid() 
        AND up.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.email,
        COALESCE(
            u.raw_user_meta_data->>'full_name',
            u.email
        ) as full_name,
        up.role as profile_role,
        COALESCE(array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}') as roles,
        COALESCE(array_agg(DISTINCT cc.category_id) FILTER (WHERE cc.category_id IS NOT NULL), '{}') as assigned_categories,
        COALESCE(array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL), '{}') as assigned_category_names,
        COALESCE(array_agg(DISTINCT c.code) FILTER (WHERE c.code IS NOT NULL), '{}') as assigned_category_codes
    FROM auth.users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN coach_categories cc ON u.id = cc.user_id
    LEFT JOIN categories c ON cc.category_id = c.id
    WHERE u.id = target_user_id
    GROUP BY u.id, u.email, u.raw_user_meta_data, up.role;
END;
$$;


ALTER FUNCTION "public"."get_user_summary_by_id"("target_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_summary_by_id"("target_user_id" "uuid") IS 'Admin-only function to get any user summary including email (requires admin role)';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
BEGIN
    -- Create profile in user_profiles
    INSERT INTO public.user_profiles (user_id, role, created_at, updated_at)
    VALUES (NEW.id, 'member', NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;

    -- Create profile in profiles (with public. qualification)
    INSERT INTO public.profiles (user_id, role, created_at, updated_at, email, display_name)
    VALUES (NEW.id, 'member', NOW(), NOW(), NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_admin_access"("user_uuid" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    -- Check new role system first
    IF EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = user_uuid 
        AND ur.role = 'admin'
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Fallback to old role system
    RETURN EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.user_id = user_uuid 
        AND up.role = 'admin'
    );
END;
$$;


ALTER FUNCTION "public"."has_admin_access"("user_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."has_admin_access"("user_uuid" "uuid") IS 'Check if user has admin access (checks both new and old role systems)';



CREATE OR REPLACE FUNCTION "public"."has_role"("user_uuid" "uuid", "role_name" character varying) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = user_uuid 
        AND ur.role = role_name
    );
END;
$$;


ALTER FUNCTION "public"."has_role"("user_uuid" "uuid", "role_name" character varying) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."has_role"("user_uuid" "uuid", "role_name" character varying) IS 'Check if user has a specific role';



CREATE OR REPLACE FUNCTION "public"."immutable_unaccent"("input" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE STRICT PARALLEL SAFE
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
  SELECT extensions.unaccent('extensions.unaccent'::regdictionary, input)
$$;


ALTER FUNCTION "public"."immutable_unaccent"("input" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."immutable_unaccent"("input" "text") IS 'IMMUTABLE wrapper around unaccent() with a pinned dictionary, usable in computed fields and index expressions.';



CREATE OR REPLACE FUNCTION "public"."initialize_user_wallet"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  INSERT INTO wallets (user_id, balance, currency)
  VALUES (NEW.id, 1000, 'POINTS')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."initialize_user_wallet"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("user_uuid" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.user_id = user_uuid 
        AND up.role = 'admin'
    );
END;
$$;


ALTER FUNCTION "public"."is_admin"("user_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_admin"("user_uuid" "uuid") IS 'Check if user has admin role (uses user_profiles to avoid recursion)';



CREATE OR REPLACE FUNCTION "public"."listen_for_attendance_stats_refresh"() RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  LISTEN refresh_attendance_stats;
END;
$$;


ALTER FUNCTION "public"."listen_for_attendance_stats_refresh"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."listen_for_attendance_stats_refresh"() IS 'Subscribe to attendance statistics refresh notifications. Call this from application code to receive pg_notify events.';



CREATE OR REPLACE FUNCTION "public"."populate_profiles_additional_fields"() RETURNS TABLE("updated_count" integer, "message" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
        DECLARE
          update_count INTEGER;
        BEGIN
          -- This function will be called from the client side
          -- to populate additional fields from auth.users
          -- For now, just return a message
          RETURN QUERY SELECT 
            0 as updated_count,
            'Use client-side function to populate additional fields'::TEXT as message;
        END;
        $$;


ALTER FUNCTION "public"."populate_profiles_additional_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."populate_profiles_from_auth_users"() RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
        DECLARE
          user_record RECORD;
        BEGIN
          -- This function will be called from the client side
          -- to populate additional fields from auth.users
          -- For now, just return
          RETURN;
        END;
        $$;


ALTER FUNCTION "public"."populate_profiles_from_auth_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_attendance_statistics_summary"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  -- Use CONCURRENTLY to avoid locking the view during refresh
  -- Note: CONCURRENTLY requires a unique index (created above)
  REFRESH MATERIALIZED VIEW CONCURRENTLY attendance_statistics_summary;
END;
$$;


ALTER FUNCTION "public"."refresh_attendance_statistics_summary"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_betting_leaderboard"() RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.betting_leaderboard;
END;
$$;


ALTER FUNCTION "public"."refresh_betting_leaderboard"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."refresh_betting_leaderboard"() IS 'Refresh the betting leaderboard materialized view';



CREATE OR REPLACE FUNCTION "public"."refresh_match_stats"() RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW match_stats;
END;
$$;


ALTER FUNCTION "public"."refresh_match_stats"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."refresh_match_stats"() IS 'Refresh the match statistics materialized view';



CREATE OR REPLACE FUNCTION "public"."refresh_materialized_view"("view_name" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  EXECUTE format('REFRESH MATERIALIZED VIEW %I', view_name);
END;
$$;


ALTER FUNCTION "public"."refresh_materialized_view"("view_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_profiles_mv"() RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
        BEGIN
          REFRESH MATERIALIZED VIEW CONCURRENTLY profiles_mv;
        END;
        $$;


ALTER FUNCTION "public"."refresh_profiles_mv"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_profiles_mv_with_stats"() RETURNS TABLE("refreshed_at" timestamp with time zone, "total_profiles" integer, "message" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
        DECLARE
          profile_count INTEGER;
        BEGIN
          REFRESH MATERIALIZED VIEW CONCURRENTLY profiles_mv;
          
          SELECT COUNT(*) INTO profile_count FROM profiles_mv;
          
          RETURN QUERY SELECT 
            NOW() as refreshed_at,
            profile_count as total_profiles,
            'Materialized view refreshed successfully'::TEXT as message;
        END;
        $$;


ALTER FUNCTION "public"."refresh_profiles_mv_with_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_teams_materialized_view"() RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY teams_with_details;
END;
$$;


ALTER FUNCTION "public"."refresh_teams_materialized_view"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."refresh_teams_materialized_view"() IS 'Refreshes the teams materialized view with latest data';



CREATE OR REPLACE FUNCTION "public"."scheduled_refresh_attendance_stats"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  v_last_refresh TIMESTAMPTZ;
  v_refresh_interval INTERVAL := '5 minutes'::INTERVAL;
BEGIN
  -- Check if view needs refresh based on last refresh time
  SELECT last_refreshed INTO v_last_refresh
  FROM attendance_statistics_summary
  LIMIT 1;

  -- If never refreshed or older than interval, refresh
  IF v_last_refresh IS NULL OR (NOW() - v_last_refresh) > v_refresh_interval THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY attendance_statistics_summary;
    RAISE NOTICE 'Attendance statistics refreshed at %', NOW();
  ELSE
    RAISE NOTICE 'Attendance statistics still fresh, last refresh: %', v_last_refresh;
  END IF;
END;
$$;


ALTER FUNCTION "public"."scheduled_refresh_attendance_stats"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."scheduled_refresh_attendance_stats"() IS 'Scheduled function to refresh attendance statistics if older than 5 minutes. Can be called by cron/scheduler.';



CREATE OR REPLACE FUNCTION "public"."search_external_players"("search_term" character varying) RETURNS TABLE("id" "uuid", "registration_number" character varying, "name" character varying, "surname" character varying, "position" character varying, "club_id" "uuid", "club_name" character varying, "display_name" character varying)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ep.id,
        ep.registration_number,
        ep.name,
        ep.surname,
        ep."position",
        ep.club_id,
        ep.club_name,
        CONCAT(ep.name, ' ', ep.surname, ' (', ep.registration_number, ') - ', 
               COALESCE(t.name, ep.club_name, 'Externí klub')) as display_name
    FROM external_players ep
    LEFT JOIN teams t ON ep.club_id = t.id
    WHERE 
        ep.registration_number ILIKE '%' || search_term || '%' OR
        ep.name ILIKE '%' || search_term || '%' OR
        ep.surname ILIKE '%' || search_term || '%'
    ORDER BY ep.surname, ep.name
    LIMIT 20;
END;
$$;


ALTER FUNCTION "public"."search_external_players"("search_term" character varying) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "surname" character varying(100) NOT NULL,
    "date_of_birth" "date",
    "sex" character varying(10) NOT NULL,
    "functions" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "registration_number" character varying(50) NOT NULL,
    "category_id" "uuid",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "members_sex_check" CHECK ((("sex")::"text" = ANY (ARRAY[('male'::character varying)::"text", ('female'::character varying)::"text"])))
);


ALTER TABLE "public"."members" OWNER TO "postgres";


COMMENT ON COLUMN "public"."members"."date_of_birth" IS 'Optional date of birth for the member';



COMMENT ON COLUMN "public"."members"."registration_number" IS 'Unique federation registration number for the member';



COMMENT ON COLUMN "public"."members"."category_id" IS 'Foreign key reference to categories table - new approach for category filtering';



COMMENT ON COLUMN "public"."members"."is_active" IS 'Indicates if member is currently active in the club. Independent of functions - a member can be active without having functions assigned.';



COMMENT ON COLUMN "public"."members"."created_by" IS 'User who created the record; NULL for rows predating the audit trail or created by a system job.';



COMMENT ON COLUMN "public"."members"."updated_by" IS 'User who last modified the record; NULL until the first edit after this migration.';



CREATE OR REPLACE FUNCTION "public"."search_text"("member" "public"."members") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE PARALLEL SAFE
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
  SELECT public.immutable_unaccent(lower(
    coalesce(member.name, '') || ' ' ||
    coalesce(member.surname, '') || ' ' ||
    coalesce(member.registration_number, '')
  ))
$$;


ALTER FUNCTION "public"."search_text"("member" "public"."members") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clubs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "short_name" character varying(50),
    "logo_url" "text",
    "city" character varying(255),
    "founded_year" integer,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "venue" "text",
    "web" "text",
    "email" "text",
    "phone" "text",
    "address" "text",
    "description" "text",
    "contact_person" "text",
    "is_own_club" boolean DEFAULT false
);


ALTER TABLE "public"."clubs" OWNER TO "postgres";


COMMENT ON TABLE "public"."clubs" IS 'Clubs table with RLS policies for admin, coach, and public access';



CREATE TABLE IF NOT EXISTS "public"."member_club_relationships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "club_id" "uuid" NOT NULL,
    "relationship_type" character varying(50) NOT NULL,
    "status" character varying(50) DEFAULT 'active'::character varying NOT NULL,
    "valid_from" "date" NOT NULL,
    "valid_to" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "member_club_relationships_relationship_type_check" CHECK ((("relationship_type")::"text" = ANY (ARRAY[('permanent'::character varying)::"text", ('loan'::character varying)::"text", ('temporary'::character varying)::"text", ('youth_loan'::character varying)::"text"]))),
    CONSTRAINT "member_club_relationships_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('active'::character varying)::"text", ('inactive'::character varying)::"text", ('expired'::character varying)::"text", ('terminated'::character varying)::"text"])))
);


ALTER TABLE "public"."member_club_relationships" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."members_external" WITH ("security_invoker"='on') AS
 SELECT "m"."id",
    "m"."name",
    "m"."surname",
    "m"."date_of_birth",
    "m"."sex",
    "m"."functions",
    "m"."created_at",
    "m"."updated_at",
    "m"."registration_number",
    "m"."category_id",
    "m"."is_active",
    "mcr"."relationship_type",
    "mcr"."status" AS "relationship_status",
    "mcr"."valid_from",
    "mcr"."valid_to",
    "mcr"."notes",
    "c"."name" AS "origin_club_name",
    "c"."short_name" AS "origin_club_short_name"
   FROM (("public"."members" "m"
     JOIN "public"."member_club_relationships" "mcr" ON (("m"."id" = "mcr"."member_id")))
     JOIN "public"."clubs" "c" ON (("mcr"."club_id" = "c"."id")))
  WHERE (("c"."is_own_club" = false) AND (("mcr"."status")::"text" = 'active'::"text") AND ("mcr"."valid_from" <= CURRENT_DATE) AND (("mcr"."valid_to" IS NULL) OR ("mcr"."valid_to" >= CURRENT_DATE)) AND (("mcr"."relationship_type")::"text" <> ALL (ARRAY[('loan'::character varying)::"text", ('temporary'::character varying)::"text"])))
  ORDER BY "m"."surname", "m"."name";


ALTER TABLE "public"."members_external" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_text"("member" "public"."members_external") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE PARALLEL SAFE
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
  SELECT public.immutable_unaccent(lower(
    coalesce(member.name, '') || ' ' ||
    coalesce(member.surname, '') || ' ' ||
    coalesce(member.registration_number, '')
  ))
$$;


ALTER FUNCTION "public"."search_text"("member" "public"."members_external") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "age_group" character varying(50),
    "gender" character varying(20),
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "slug" character varying(50)
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


COMMENT ON COLUMN "public"."categories"."slug" IS 'URL-friendly category identifier - replaces legacy code field';



CREATE TABLE IF NOT EXISTS "public"."category_membership_fees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid" NOT NULL,
    "calendar_year" integer NOT NULL,
    "fee_amount" numeric(10,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'CZK'::character varying NOT NULL,
    "fee_period" character varying(20) DEFAULT 'yearly'::character varying,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "category_membership_fees_calendar_year_check" CHECK ((("calendar_year" >= 2000) AND ("calendar_year" <= 2100))),
    CONSTRAINT "category_membership_fees_fee_amount_check" CHECK (("fee_amount" >= (0)::numeric)),
    CONSTRAINT "category_membership_fees_fee_period_check" CHECK ((("fee_period")::"text" = ANY (ARRAY[('yearly'::character varying)::"text", ('semester'::character varying)::"text", ('quarterly'::character varying)::"text", ('monthly'::character varying)::"text"])))
);


ALTER TABLE "public"."category_membership_fees" OWNER TO "postgres";


COMMENT ON TABLE "public"."category_membership_fees" IS 'Membership fee configuration per category per calendar year';



COMMENT ON COLUMN "public"."category_membership_fees"."fee_period" IS 'Payment period: yearly (default), semester, quarterly, monthly';



CREATE TABLE IF NOT EXISTS "public"."membership_fee_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "calendar_year" integer NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'CZK'::character varying NOT NULL,
    "payment_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "payment_method" character varying(50),
    "payment_reference" character varying(100),
    "fee_type" character varying(20) DEFAULT 'membership'::character varying,
    "notes" "text",
    "receipt_number" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "membership_fee_payments_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "membership_fee_payments_calendar_year_check" CHECK ((("calendar_year" >= 2000) AND ("calendar_year" <= 2100))),
    CONSTRAINT "membership_fee_payments_fee_type_check" CHECK ((("fee_type")::"text" = ANY (ARRAY[('membership'::character varying)::"text", ('registration'::character varying)::"text", ('additional'::character varying)::"text", ('refund'::character varying)::"text"]))),
    CONSTRAINT "membership_fee_payments_payment_method_check" CHECK ((("payment_method")::"text" = ANY (ARRAY[('cash'::character varying)::"text", ('bank_transfer'::character varying)::"text", ('card'::character varying)::"text", ('other'::character varying)::"text"])))
);


ALTER TABLE "public"."membership_fee_payments" OWNER TO "postgres";


COMMENT ON TABLE "public"."membership_fee_payments" IS 'Individual membership fee payment records';



COMMENT ON COLUMN "public"."membership_fee_payments"."fee_type" IS 'Type of fee: membership (regular), registration (initial), additional, refund';



CREATE OR REPLACE VIEW "public"."member_fee_status" WITH ("security_invoker"='on') AS
 SELECT "m"."id" AS "member_id",
    "m"."registration_number",
    "m"."name",
    "m"."surname",
    "m"."category_id",
    "c"."name" AS "category_name",
    (EXTRACT(year FROM CURRENT_DATE))::integer AS "calendar_year",
    COALESCE("cf"."fee_amount", (0)::numeric) AS "expected_fee_amount",
    COALESCE("sum"("p"."amount") FILTER (WHERE (("p"."calendar_year" = (EXTRACT(year FROM CURRENT_DATE))::integer) AND (("p"."fee_type")::"text" <> 'refund'::"text"))), (0)::numeric) AS "total_paid",
    COALESCE("sum"("p"."amount") FILTER (WHERE (("p"."calendar_year" = (EXTRACT(year FROM CURRENT_DATE))::integer) AND (("p"."fee_type")::"text" = 'refund'::"text"))), (0)::numeric) AS "total_refunded",
    (COALESCE("sum"("p"."amount") FILTER (WHERE (("p"."calendar_year" = (EXTRACT(year FROM CURRENT_DATE))::integer) AND (("p"."fee_type")::"text" <> 'refund'::"text"))), (0)::numeric) - COALESCE("sum"("p"."amount") FILTER (WHERE (("p"."calendar_year" = (EXTRACT(year FROM CURRENT_DATE))::integer) AND (("p"."fee_type")::"text" = 'refund'::"text"))), (0)::numeric)) AS "net_paid",
        CASE
            WHEN (COALESCE("cf"."fee_amount", (0)::numeric) = (0)::numeric) THEN 'not_required'::"text"
            WHEN ((COALESCE("sum"("p"."amount") FILTER (WHERE (("p"."calendar_year" = (EXTRACT(year FROM CURRENT_DATE))::integer) AND (("p"."fee_type")::"text" <> 'refund'::"text"))), (0)::numeric) - COALESCE("sum"("p"."amount") FILTER (WHERE (("p"."calendar_year" = (EXTRACT(year FROM CURRENT_DATE))::integer) AND (("p"."fee_type")::"text" = 'refund'::"text"))), (0)::numeric)) >= COALESCE("cf"."fee_amount", (0)::numeric)) THEN 'paid'::"text"
            WHEN ((COALESCE("sum"("p"."amount") FILTER (WHERE (("p"."calendar_year" = (EXTRACT(year FROM CURRENT_DATE))::integer) AND (("p"."fee_type")::"text" <> 'refund'::"text"))), (0)::numeric) - COALESCE("sum"("p"."amount") FILTER (WHERE (("p"."calendar_year" = (EXTRACT(year FROM CURRENT_DATE))::integer) AND (("p"."fee_type")::"text" = 'refund'::"text"))), (0)::numeric)) > (0)::numeric) THEN 'partial'::"text"
            ELSE 'unpaid'::"text"
        END AS "payment_status",
    "max"("p"."payment_date") FILTER (WHERE ("p"."calendar_year" = (EXTRACT(year FROM CURRENT_DATE))::integer)) AS "last_payment_date",
    "count"("p"."id") FILTER (WHERE (("p"."calendar_year" = (EXTRACT(year FROM CURRENT_DATE))::integer) AND (("p"."fee_type")::"text" <> 'refund'::"text"))) AS "payment_count",
    "cf"."currency"
   FROM ((("public"."members" "m"
     LEFT JOIN "public"."categories" "c" ON (("m"."category_id" = "c"."id")))
     LEFT JOIN "public"."category_membership_fees" "cf" ON ((("c"."id" = "cf"."category_id") AND ("cf"."calendar_year" = (EXTRACT(year FROM CURRENT_DATE))::integer) AND ("cf"."is_active" = true))))
     LEFT JOIN "public"."membership_fee_payments" "p" ON (("m"."id" = "p"."member_id")))
  GROUP BY "m"."id", "m"."registration_number", "m"."name", "m"."surname", "m"."category_id", "c"."name", "cf"."fee_amount", "cf"."currency";


ALTER TABLE "public"."member_fee_status" OWNER TO "postgres";


COMMENT ON VIEW "public"."member_fee_status" IS 'Current year payment status for all active members with color indicator logic';



CREATE OR REPLACE VIEW "public"."members_internal" WITH ("security_invoker"='on') AS
 SELECT "m"."id",
    "m"."name",
    "m"."surname",
    "m"."registration_number",
    "m"."date_of_birth",
    "m"."sex",
    "m"."category_id",
    "m"."functions",
    "m"."is_active",
    "m"."created_at",
    "m"."updated_at",
    "c"."name" AS "club_name",
    "mcr"."relationship_type",
    "mcr"."status" AS "relationship_status",
    "mcr"."valid_from",
    "mcr"."valid_to",
    "mfs"."category_name",
    "mfs"."payment_status",
    "mfs"."expected_fee_amount",
    "mfs"."net_paid",
    "mfs"."total_paid",
    "mfs"."total_refunded",
    "mfs"."last_payment_date",
    "mfs"."payment_count",
    "mfs"."calendar_year",
    "mfs"."currency"
   FROM ((("public"."members" "m"
     JOIN "public"."member_club_relationships" "mcr" ON (("m"."id" = "mcr"."member_id")))
     JOIN "public"."clubs" "c" ON (("mcr"."club_id" = "c"."id")))
     LEFT JOIN "public"."member_fee_status" "mfs" ON (("m"."id" = "mfs"."member_id")))
  WHERE (("c"."is_own_club" = true) AND (("mcr"."status")::"text" = 'active'::"text") AND (("mcr"."valid_to" IS NULL) OR ("mcr"."valid_to" > CURRENT_DATE)));


ALTER TABLE "public"."members_internal" OWNER TO "postgres";


COMMENT ON VIEW "public"."members_internal" IS 'Internal club members with payment status information. Includes all active members who belong to our own club with their current payment status.';



CREATE OR REPLACE FUNCTION "public"."search_text"("member" "public"."members_internal") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE PARALLEL SAFE
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
  SELECT public.immutable_unaccent(lower(
    coalesce(member.name, '') || ' ' ||
    coalesce(member.surname, '') || ' ' ||
    coalesce(member.registration_number, '')
  ))
$$;


ALTER FUNCTION "public"."search_text"("member" "public"."members_internal") OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."members_on_loan" WITH ("security_invoker"='on') AS
 SELECT "m"."id",
    "m"."name",
    "m"."surname",
    "m"."date_of_birth",
    "m"."sex",
    "m"."functions",
    "m"."created_at",
    "m"."updated_at",
    "m"."registration_number",
    "m"."category_id",
    "m"."is_active",
    "mcr"."relationship_type",
    "mcr"."status" AS "relationship_status",
    "mcr"."valid_from",
    "mcr"."valid_to",
    "mcr"."notes",
    "c"."name" AS "origin_club_name",
    "c"."short_name" AS "origin_club_short_name"
   FROM (("public"."members" "m"
     JOIN "public"."member_club_relationships" "mcr" ON (("m"."id" = "mcr"."member_id")))
     JOIN "public"."clubs" "c" ON (("mcr"."club_id" = "c"."id")))
  WHERE (("c"."is_own_club" = false) AND (("mcr"."status")::"text" = 'active'::"text") AND ("mcr"."valid_from" <= CURRENT_DATE) AND (("mcr"."valid_to" IS NULL) OR ("mcr"."valid_to" >= CURRENT_DATE)) AND (("mcr"."relationship_type")::"text" = ANY (ARRAY[('loan'::character varying)::"text", ('temporary'::character varying)::"text"])))
  ORDER BY "m"."surname", "m"."name";


ALTER TABLE "public"."members_on_loan" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_text"("member" "public"."members_on_loan") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE PARALLEL SAFE
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
  SELECT public.immutable_unaccent(lower(
    coalesce(member.name, '') || ' ' ||
    coalesce(member.surname, '') || ' ' ||
    coalesce(member.registration_number, '')
  ))
$$;


ALTER FUNCTION "public"."search_text"("member" "public"."members_on_loan") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_album_cover_photo"("album_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    UPDATE photo_albums 
    SET cover_photo_url = (
        SELECT file_url 
        FROM photos 
        WHERE album_id = album_uuid 
        ORDER BY sort_order ASC, created_at ASC 
        LIMIT 1
    )
    WHERE id = album_uuid;
END;
$$;


ALTER FUNCTION "public"."set_album_cover_photo"("album_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_members_audit_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := COALESCE(NEW.created_at, now());
    NEW.created_by := COALESCE(NEW.created_by, auth.uid());
    NEW.updated_at := COALESCE(NEW.updated_at, NEW.created_at);
    NEW.updated_by := COALESCE(NEW.updated_by, NEW.created_by);
    RETURN NEW;
  END IF;

  NEW.created_at := OLD.created_at;
  NEW.created_by := OLD.created_by;
  NEW.updated_at := now();

  -- Untouched by the caller → fall back to the authenticated user, keeping the
  -- previous author when the write happens without an auth context.
  IF NEW.updated_by IS NOT DISTINCT FROM OLD.updated_by THEN
    NEW.updated_by := COALESCE(auth.uid(), OLD.updated_by);
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_members_audit_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_metadata_created_by"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  -- If created_by is not set, try to set it from auth.uid()
  IF NEW.created_by IS NULL THEN
    NEW.created_by := ensure_user_profile(auth.uid());
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_metadata_created_by"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."set_metadata_created_by"() IS 'Automatically sets created_by field for match metadata';



CREATE OR REPLACE FUNCTION "public"."sync_all_profiles_data"() RETURNS TABLE("synced_users" integer, "total_profiles" integer, "refreshed_at" timestamp with time zone, "message" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
        DECLARE
          user_count INTEGER;
          profile_count INTEGER;
        BEGIN
          -- Count users without profiles
          SELECT COUNT(*) INTO user_count
          FROM auth.users au
          LEFT JOIN public.user_profiles up ON au.id = up.user_id
          WHERE up.user_id IS NULL;
          
          -- Create profiles for users that don't have them
          INSERT INTO public.user_profiles (user_id, role, created_at, updated_at)
          SELECT 
            au.id,
            'member',
            NOW(),
            NOW()
          FROM auth.users au
          LEFT JOIN public.user_profiles up ON au.id = up.user_id
          WHERE up.user_id IS NULL
          ON CONFLICT (user_id) DO NOTHING;
          
          -- Refresh the materialized view
          REFRESH MATERIALIZED VIEW CONCURRENTLY profiles_mv;
          
          -- Get final count
          SELECT COUNT(*) INTO profile_count FROM profiles_mv;
          
          RETURN QUERY SELECT 
            user_count as synced_users,
            profile_count as total_profiles,
            NOW() as refreshed_at,
            'All profiles synced and materialized view refreshed'::TEXT as message;
        END;
        $$;


ALTER FUNCTION "public"."sync_all_profiles_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_assigned_categories"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    UPDATE user_profiles
    SET assigned_categories = (
        SELECT COALESCE(array_agg(category_id), '{}')
        FROM coach_category_assignments
        WHERE user_profile_id = COALESCE(NEW.user_profile_id, OLD.user_profile_id)
    )
    WHERE id = COALESCE(NEW.user_profile_id, OLD.user_profile_id);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_assigned_categories"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_profiles_data"() RETURNS TABLE("synced_count" integer, "message" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
        DECLARE
          user_count INTEGER;
        BEGIN
          -- Count existing users without profiles
          SELECT COUNT(*) INTO user_count
          FROM auth.users au
          LEFT JOIN public.user_profiles up ON au.id = up.user_id
          WHERE up.user_id IS NULL;
          
          -- Create profiles for users that don't have them
          INSERT INTO public.user_profiles (user_id, role, created_at, updated_at)
          SELECT 
            au.id,
            'member',
            NOW(),
            NOW()
          FROM auth.users au
          LEFT JOIN public.user_profiles up ON au.id = up.user_id
          WHERE up.user_id IS NULL
          ON CONFLICT (user_id) DO NOTHING;
          
          RETURN QUERY SELECT user_count, 'Profiles synced successfully'::TEXT;
        END;
        $$;


ALTER FUNCTION "public"."sync_profiles_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_profiles_from_user_profiles"() RETURNS TABLE("synced_count" integer, "total_profiles" integer, "message" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
        DECLARE
          sync_count INTEGER;
          total_count INTEGER;
        BEGIN
          -- Copy all data from user_profiles to profiles
          INSERT INTO profiles (
            user_id,
            role,
            club_id,
            assigned_categories,
            created_at,
            updated_at
          )
          SELECT 
            user_id,
            role,
            club_id,
            assigned_categories,
            created_at,
            updated_at
          FROM public.user_profiles
          ON CONFLICT (user_id) DO UPDATE SET
            role = EXCLUDED.role,
            club_id = EXCLUDED.club_id,
            assigned_categories = EXCLUDED.assigned_categories,
            updated_at = EXCLUDED.updated_at;
          
          GET DIAGNOSTICS sync_count = ROW_COUNT;
          SELECT COUNT(*) INTO total_count FROM profiles;
          
          RETURN QUERY SELECT 
            sync_count as synced_count,
            total_count as total_profiles,
            'Profiles synced successfully'::TEXT as message;
        END;
        $$;


ALTER FUNCTION "public"."sync_profiles_from_user_profiles"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_profiles_on_user_profiles_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        -- Delete from public.profiles (explicitly qualified)
        DELETE FROM public.profiles WHERE user_id = OLD.user_id;
        RETURN OLD;
    ELSIF (TG_OP = 'INSERT') THEN
        -- Insert into public.profiles (explicitly qualified)
        INSERT INTO public.profiles (user_id, role, assigned_categories, created_at, updated_at)
        VALUES (NEW.user_id, NEW.role, NEW.assigned_categories, NEW.created_at, NEW.updated_at)
        ON CONFLICT (user_id) DO UPDATE
        SET role = NEW.role,
            assigned_categories = NEW.assigned_categories,
            updated_at = NEW.updated_at;
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Update public.profiles (explicitly qualified)
        UPDATE public.profiles
        SET role = NEW.role,
            assigned_categories = NEW.assigned_categories,
            updated_at = NEW.updated_at
        WHERE user_id = NEW.user_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."sync_profiles_on_user_profiles_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_refresh_attendance_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  -- Schedule a background refresh using pg_notify
  -- This is non-blocking and won't slow down the insert/update/delete operation
  PERFORM pg_notify(
    'refresh_attendance_stats',
    json_build_object(
      'timestamp', NOW(),
      'table', TG_TABLE_NAME,
      'operation', TG_OP
    )::text
  );

  -- Optionally: Perform immediate refresh (blocking - use with caution)
  -- Only recommended for low-traffic periods or if real-time accuracy is critical
  -- REFRESH MATERIALIZED VIEW CONCURRENTLY attendance_statistics_summary;

  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."trigger_refresh_attendance_stats"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."trigger_refresh_attendance_stats"() IS 'Trigger function that notifies system to refresh attendance statistics materialized view. Uses pg_notify for non-blocking operation.';



CREATE OR REPLACE FUNCTION "public"."trigger_refresh_match_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  -- Try to refresh the materialized view, but don't fail if we don't have permissions
  BEGIN
    PERFORM refresh_match_stats();
  EXCEPTION
    WHEN insufficient_privilege THEN
      -- Log the error but don't fail the transaction
      RAISE WARNING 'Insufficient privileges to refresh match_stats materialized view';
    WHEN OTHERS THEN
      -- Log other errors but don't fail the transaction
      RAISE WARNING 'Error refreshing match_stats: %', SQLERRM;
  END;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."trigger_refresh_match_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_refresh_teams_mv"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  -- Use a background job to refresh the materialized view
  -- This prevents blocking the main transaction
  PERFORM pg_notify('refresh_teams_mv', '');
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."trigger_refresh_teams_mv"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."trigger_refresh_teams_mv"() IS 'Trigger function to refresh teams materialized view when underlying data changes';



CREATE OR REPLACE FUNCTION "public"."update_album_cover_photo"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    -- If this is a new photo, check if it should be the cover
    IF TG_OP = 'INSERT' THEN
        -- If album has no cover photo, set this one as cover
        IF NOT EXISTS (
            SELECT 1 FROM photo_albums 
            WHERE id = NEW.album_id AND cover_photo_url IS NOT NULL
        ) THEN
            UPDATE photo_albums 
            SET cover_photo_url = NEW.file_url 
            WHERE id = NEW.album_id;
        END IF;
    END IF;
    
    -- If this is a delete operation, check if we need to update cover
    IF TG_OP = 'DELETE' THEN
        -- If the deleted photo was the cover photo, set a new one
        IF EXISTS (
            SELECT 1 FROM photo_albums 
            WHERE id = OLD.album_id AND cover_photo_url = OLD.file_url
        ) THEN
            PERFORM set_album_cover_photo(OLD.album_id);
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_album_cover_photo"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_grants_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_grants_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_match_metadata_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_match_metadata_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_meeting_attendees_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_meeting_attendees_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_meeting_minutes_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_meeting_minutes_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_member_club_relationships_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_member_club_relationships_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_member_functions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_member_functions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_members_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_members_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_membership_fee_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_membership_fee_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_point_deductions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_point_deductions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_referees_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_referees_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_tournaments_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_tournaments_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_videos_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_videos_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_profile"("user_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
        BEGIN
          -- ensure predictable search path
          PERFORM set_config('search_path', 'public, auth, pg_catalog', true);
          
          RETURN EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = user_uuid
          );
        END;
        $$;


ALTER FUNCTION "public"."user_has_profile"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_team_manager_requirement"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
    team_manager_count INTEGER;
    lineup_id_to_check UUID;
BEGIN
    -- Determine which lineup_id to check
    IF TG_OP = 'DELETE' THEN
        lineup_id_to_check := OLD.lineup_id;
    ELSE
        lineup_id_to_check := NEW.lineup_id;
    END IF;
    
    -- Count team managers for this lineup
    SELECT COUNT(*) INTO team_manager_count
    FROM lineup_coaches 
    WHERE lineup_id = lineup_id_to_check 
      AND role = 'team_manager';
    
    -- Check if we have at least one team manager
    IF team_manager_count < 1 THEN
        RAISE EXCEPTION 'P0001: Lineup must have at least 1 team manager';
    END IF;
    
    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION "public"."validate_team_manager_requirement"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "next_auth"."accounts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "type" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "providerAccountId" "text" NOT NULL,
    "refresh_token" "text",
    "access_token" "text",
    "expires_at" bigint,
    "token_type" "text",
    "scope" "text",
    "id_token" "text",
    "session_state" "text",
    "oauth_token_secret" "text",
    "oauth_token" "text",
    "userId" "uuid"
);


ALTER TABLE "next_auth"."accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "next_auth"."sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "expires" timestamp with time zone NOT NULL,
    "sessionToken" "text" NOT NULL,
    "userId" "uuid"
);


ALTER TABLE "next_auth"."sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "next_auth"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text",
    "email" "text",
    "emailVerified" timestamp with time zone,
    "image" "text"
);


ALTER TABLE "next_auth"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "next_auth"."verification_tokens" (
    "identifier" "text",
    "token" "text" NOT NULL,
    "expires" timestamp with time zone NOT NULL
);


ALTER TABLE "next_auth"."verification_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."training_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying(200) NOT NULL,
    "description" "text",
    "session_date" "date" NOT NULL,
    "session_time" time without time zone,
    "season_id" "uuid" NOT NULL,
    "location" character varying(200),
    "coach_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "category_id" "uuid",
    "status" character varying(20) DEFAULT 'planned'::character varying NOT NULL,
    "status_reason" "text",
    CONSTRAINT "training_sessions_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('planned'::character varying)::"text", ('done'::character varying)::"text", ('cancelled'::character varying)::"text"])))
);


ALTER TABLE "public"."training_sessions" OWNER TO "postgres";


COMMENT ON TABLE "public"."training_sessions" IS 'Training sessions for different categories and seasons';



COMMENT ON COLUMN "public"."training_sessions"."category_id" IS 'Foreign key reference to categories table - migrated from legacy category VARCHAR field';



CREATE MATERIALIZED VIEW "public"."attendance_statistics_summary" AS
 SELECT "training_sessions"."category_id",
    "training_sessions"."season_id",
    "count"(DISTINCT "training_sessions"."id") FILTER (WHERE (("training_sessions"."status")::"text" = 'done'::"text")) AS "completed_sessions",
    "count"(DISTINCT "training_sessions"."id") FILTER (WHERE (("training_sessions"."status")::"text" = 'planned'::"text")) AS "planned_sessions",
    "count"(DISTINCT "training_sessions"."id") FILTER (WHERE (("training_sessions"."status")::"text" = 'cancelled'::"text")) AS "cancelled_sessions",
    "round"(((("count"(DISTINCT "training_sessions"."id") FILTER (WHERE (("training_sessions"."status")::"text" = 'done'::"text")))::numeric / (NULLIF("count"(DISTINCT "training_sessions"."id"), 0))::numeric) * (100)::numeric), 2) AS "completion_rate",
    "max"("training_sessions"."session_date") FILTER (WHERE (("training_sessions"."status")::"text" = 'done'::"text")) AS "last_session_date",
    "min"("training_sessions"."session_date") FILTER (WHERE ((("training_sessions"."status")::"text" = 'planned'::"text") AND ("training_sessions"."session_date" > CURRENT_DATE))) AS "next_session_date",
    "now"() AS "last_refreshed"
   FROM "public"."training_sessions"
  WHERE (("training_sessions"."category_id" IS NOT NULL) AND ("training_sessions"."season_id" IS NOT NULL))
  GROUP BY "training_sessions"."category_id", "training_sessions"."season_id"
  WITH NO DATA;


ALTER TABLE "public"."attendance_statistics_summary" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."attendance_stats_trigger_info" AS
 SELECT "triggers"."trigger_name",
    "triggers"."event_manipulation",
    "triggers"."event_object_table",
    "triggers"."action_statement",
    "triggers"."action_timing"
   FROM "information_schema"."triggers"
  WHERE (("triggers"."trigger_name")::"name" ~~ '%att_stats%'::"text")
  ORDER BY "triggers"."event_object_table", "triggers"."event_manipulation";


ALTER TABLE "public"."attendance_stats_trigger_info" OWNER TO "postgres";


COMMENT ON VIEW "public"."attendance_stats_trigger_info" IS 'View showing all active triggers related to attendance statistics refresh.';



CREATE TABLE IF NOT EXISTS "public"."betting_bet_legs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "bet_id" "uuid" NOT NULL,
    "match_id" "text" NOT NULL,
    "bet_type" "text" NOT NULL,
    "selection" "jsonb" NOT NULL,
    "odds" numeric(8,3) NOT NULL,
    "parameter" "jsonb",
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "result_determined_at" timestamp with time zone,
    "home_team" "text",
    "away_team" "text",
    "match_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "betting_bet_legs_odds_check" CHECK (("odds" > (0)::numeric)),
    CONSTRAINT "betting_bet_legs_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'WON'::"text", 'LOST'::"text", 'VOID'::"text"])))
);


ALTER TABLE "public"."betting_bet_legs" OWNER TO "postgres";


COMMENT ON TABLE "public"."betting_bet_legs" IS 'Individual selections/legs within a bet';



CREATE TABLE IF NOT EXISTS "public"."betting_bets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "structure" "text" NOT NULL,
    "stake" numeric(12,2) NOT NULL,
    "odds" numeric(8,3) NOT NULL,
    "potential_return" numeric(12,2) NOT NULL,
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "system_type" "text",
    "payout" numeric(12,2) DEFAULT 0,
    "placed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "settled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "betting_bets_odds_check" CHECK (("odds" > (0)::numeric)),
    CONSTRAINT "betting_bets_stake_check" CHECK (("stake" > (0)::numeric)),
    CONSTRAINT "betting_bets_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'WON'::"text", 'LOST'::"text", 'VOID'::"text", 'CANCELLED'::"text"]))),
    CONSTRAINT "betting_bets_structure_check" CHECK (("structure" = ANY (ARRAY['SINGLE'::"text", 'ACCUMULATOR'::"text", 'SYSTEM'::"text"])))
);


ALTER TABLE "public"."betting_bets" OWNER TO "postgres";


COMMENT ON TABLE "public"."betting_bets" IS 'User betting history and current bets';



CREATE TABLE IF NOT EXISTS "public"."betting_wallets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "balance" numeric(12,2) DEFAULT 1000.00 NOT NULL,
    "currency" "text" DEFAULT 'POINTS'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "betting_wallets_currency_check" CHECK (("currency" = ANY (ARRAY['POINTS'::"text", 'USD'::"text", 'EUR'::"text", 'CZK'::"text"])))
);


ALTER TABLE "public"."betting_wallets" OWNER TO "postgres";


COMMENT ON TABLE "public"."betting_wallets" IS 'User wallets for betting system';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" character varying(20) DEFAULT 'member'::character varying NOT NULL,
    "assigned_categories" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "email" "text",
    "display_name" "text",
    "phone" "text",
    "bio" "text",
    "position" "text",
    "is_blocked" boolean DEFAULT false,
    CONSTRAINT "profiles_role_check" CHECK ((("role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('coach'::character varying)::"text", ('member'::character varying)::"text", ('head_coach'::character varying)::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."betting_leaderboard" AS
 SELECT "p"."user_id",
    COALESCE(NULLIF("btrim"("p"."display_name"), ''::"text"), 'Hráč'::"text") AS "user_name",
    COALESCE("w"."balance", (0)::numeric) AS "current_balance",
    COALESCE("stats"."total_bets", (0)::bigint) AS "total_bets",
    COALESCE("stats"."won_bets", (0)::bigint) AS "won_bets",
    COALESCE("stats"."lost_bets", (0)::bigint) AS "lost_bets",
    COALESCE("stats"."total_wagered", (0)::numeric) AS "total_wagered",
    COALESCE("stats"."total_winnings", (0)::numeric) AS "total_winnings",
    COALESCE(("stats"."total_winnings" - "stats"."total_wagered"), (0)::numeric) AS "net_profit",
        CASE
            WHEN (COALESCE("stats"."total_bets", (0)::bigint) > 0) THEN "round"((((COALESCE("stats"."won_bets", (0)::bigint))::numeric / ("stats"."total_bets")::numeric) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS "win_rate",
        CASE
            WHEN (COALESCE("stats"."total_wagered", (0)::numeric) > (0)::numeric) THEN "round"(((COALESCE(("stats"."total_winnings" - "stats"."total_wagered"), (0)::numeric) / "stats"."total_wagered") * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS "roi"
   FROM (("public"."profiles" "p"
     LEFT JOIN "public"."betting_wallets" "w" ON (("w"."user_id" = "p"."user_id")))
     LEFT JOIN ( SELECT "betting_bets"."user_id",
            "count"(*) AS "total_bets",
            "count"(*) FILTER (WHERE ("betting_bets"."status" = 'WON'::"text")) AS "won_bets",
            "count"(*) FILTER (WHERE ("betting_bets"."status" = 'LOST'::"text")) AS "lost_bets",
            "sum"("betting_bets"."stake") AS "total_wagered",
            "sum"(
                CASE
                    WHEN ("betting_bets"."status" = 'WON'::"text") THEN "betting_bets"."potential_return"
                    ELSE (0)::numeric
                END) AS "total_winnings"
           FROM "public"."betting_bets"
          WHERE ("betting_bets"."status" = ANY (ARRAY['WON'::"text", 'LOST'::"text"]))
          GROUP BY "betting_bets"."user_id") "stats" ON (("stats"."user_id" = "p"."user_id")))
  WHERE (("w"."user_id" IS NOT NULL) OR ("stats"."user_id" IS NOT NULL))
  ORDER BY COALESCE(("stats"."total_winnings" - "stats"."total_wagered"), (0)::numeric) DESC
  WITH NO DATA;


ALTER TABLE "public"."betting_leaderboard" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."betting_odds" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "match_id" "text" NOT NULL,
    "bet_type" "text" NOT NULL,
    "selection" "text" NOT NULL,
    "odds" numeric(8,3) NOT NULL,
    "parameter" "text",
    "source" "text",
    "bookmaker_margin" numeric(5,2),
    "implied_probability" numeric(5,2),
    "effective_from" timestamp with time zone DEFAULT "now"(),
    "effective_until" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "previous_odds" numeric(8,3),
    "odds_change_percentage" numeric(5,2)
);


ALTER TABLE "public"."betting_odds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."betting_odds_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "odds_id" "uuid",
    "match_id" "text" NOT NULL,
    "bet_type" "text" NOT NULL,
    "selection" "text" NOT NULL,
    "old_odds" numeric(8,3),
    "new_odds" numeric(8,3),
    "change_percentage" numeric(5,2),
    "changed_at" timestamp with time zone DEFAULT "now"(),
    "reason" "text"
);


ALTER TABLE "public"."betting_odds_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."betting_team_elo_ratings" (
    "team_id" "text" NOT NULL,
    "elo_rating" integer DEFAULT 1500,
    "home_advantage" integer DEFAULT 100,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."betting_team_elo_ratings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."betting_transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "wallet_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "balance_after" numeric(12,2) NOT NULL,
    "description" "text" NOT NULL,
    "reference_id" "text",
    "status" "text" DEFAULT 'COMPLETED'::"text" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "betting_transactions_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'COMPLETED'::"text", 'FAILED'::"text", 'CANCELLED'::"text"]))),
    CONSTRAINT "betting_transactions_type_check" CHECK (("type" = ANY (ARRAY['DEPOSIT'::"text", 'WITHDRAWAL'::"text", 'BET_PLACED'::"text", 'BET_WON'::"text", 'BET_REFUND'::"text", 'ADJUSTMENT'::"text"])))
);


ALTER TABLE "public"."betting_transactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."betting_transactions" IS 'Transaction history for wallet operations';



CREATE TABLE IF NOT EXISTS "public"."blog_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "slug" character varying(255) NOT NULL,
    "content" "text" NOT NULL,
    "author_id" "uuid",
    "status" character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "image_url" "text",
    "category_id" "uuid",
    "match_id" "uuid",
    CONSTRAINT "blog_posts_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('draft'::character varying)::"text", ('published'::character varying)::"text", ('archived'::character varying)::"text"])))
);


ALTER TABLE "public"."blog_posts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."blog_posts"."id" IS 'Unique identifier for the blog post';



COMMENT ON COLUMN "public"."blog_posts"."title" IS 'Title of the blog post';



COMMENT ON COLUMN "public"."blog_posts"."slug" IS 'URL-friendly slug for the blog post';



COMMENT ON COLUMN "public"."blog_posts"."content" IS 'Full content of the blog post';



COMMENT ON COLUMN "public"."blog_posts"."author_id" IS 'ID of the user who created the post';



COMMENT ON COLUMN "public"."blog_posts"."status" IS 'Current status: draft, published, or archived';



COMMENT ON COLUMN "public"."blog_posts"."published_at" IS 'Timestamp when the post was published';



COMMENT ON COLUMN "public"."blog_posts"."created_at" IS 'Timestamp when the post was created';



COMMENT ON COLUMN "public"."blog_posts"."updated_at" IS 'Timestamp when the post was last updated';



COMMENT ON COLUMN "public"."blog_posts"."image_url" IS 'URL of the blog post featured image';



COMMENT ON COLUMN "public"."blog_posts"."match_id" IS 'Optional reference to related match';



CREATE TABLE IF NOT EXISTS "public"."business_partners" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "logo_url" "text",
    "website_url" "text",
    "email" character varying(255),
    "phone" character varying(50),
    "address" "text",
    "description" "text" NOT NULL,
    "partnership_type" character varying(50) NOT NULL,
    "level" character varying(20) NOT NULL,
    "start_date" "date" NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "notes" "text",
    "discount_percentage" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "business_partners_discount_percentage_check" CHECK ((("discount_percentage" >= 0) AND ("discount_percentage" <= 100))),
    CONSTRAINT "business_partners_level_check" CHECK ((("level")::"text" = ANY (ARRAY[('silver'::character varying)::"text", ('bronze'::character varying)::"text"]))),
    CONSTRAINT "business_partners_partnership_type_check" CHECK ((("partnership_type")::"text" = ANY (ARRAY[('supplier'::character varying)::"text", ('service'::character varying)::"text", ('collaboration'::character varying)::"text"]))),
    CONSTRAINT "business_partners_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('active'::character varying)::"text", ('inactive'::character varying)::"text", ('pending'::character varying)::"text"])))
);


ALTER TABLE "public"."business_partners" OWNER TO "postgres";


COMMENT ON TABLE "public"."business_partners" IS 'Obchodní partneři, dodavatelé a poskytovatelé služeb';



CREATE TABLE IF NOT EXISTS "public"."category_lineup_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lineup_id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "position" character varying(20) NOT NULL,
    "jersey_number" integer,
    "is_captain" boolean DEFAULT false,
    "is_vice_captain" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid" NOT NULL,
    "updated_at" timestamp with time zone,
    "updated_by" "uuid",
    CONSTRAINT "category_lineup_members_jersey_number_check" CHECK ((("jersey_number" >= 1) AND ("jersey_number" <= 99))),
    CONSTRAINT "category_lineup_members_position_check" CHECK ((("position")::"text" = ANY (ARRAY[('goalkeeper'::character varying)::"text", ('field_player'::character varying)::"text"])))
);


ALTER TABLE "public"."category_lineup_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."category_lineups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(200) NOT NULL,
    "description" "text",
    "category_id" "uuid" NOT NULL,
    "season_id" "uuid" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."category_lineups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."category_seasons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid",
    "season_id" "uuid",
    "matchweek_count" integer DEFAULT 0,
    "competition_type" character varying(50) DEFAULT 'league'::character varying,
    "team_count" integer DEFAULT 0,
    "allow_team_duplicates" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."category_seasons" OWNER TO "postgres";


COMMENT ON TABLE "public"."category_seasons" IS 'Junction table for category-season relationships - public read access, admin write access';



COMMENT ON COLUMN "public"."category_seasons"."matchweek_count" IS 'Number of matchweeks for this category in this season';



COMMENT ON COLUMN "public"."category_seasons"."competition_type" IS 'Type of competition for this category in this season';



COMMENT ON COLUMN "public"."category_seasons"."team_count" IS 'Expected number of teams for this category in this season';



COMMENT ON COLUMN "public"."category_seasons"."allow_team_duplicates" IS 'Whether to allow A/B teams for this category in this season';



CREATE TABLE IF NOT EXISTS "public"."club_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "club_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "season_id" "uuid" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "max_teams" integer DEFAULT 1
);


ALTER TABLE "public"."club_categories" OWNER TO "postgres";


COMMENT ON TABLE "public"."club_categories" IS 'Junction table for club-category relationships - public read access, admin write access';



COMMENT ON COLUMN "public"."club_categories"."max_teams" IS 'Maximum number of teams this club can have in this category';



CREATE TABLE IF NOT EXISTS "public"."club_category_teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "club_category_id" "uuid" NOT NULL,
    "team_suffix" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."club_category_teams" OWNER TO "postgres";


COMMENT ON TABLE "public"."club_category_teams" IS 'Team information for club-category combinations - public read access, admin write access';



CREATE OR REPLACE VIEW "public"."club_category_details" WITH ("security_invoker"='on') AS
 SELECT "cc"."id",
    "c"."name" AS "club_name",
    "c"."short_name" AS "club_short_name",
    "cat"."id" AS "category_id",
    "cat"."name" AS "category_name",
    "cat"."description" AS "category_description",
    "cc"."max_teams",
    "cc"."is_active",
    "cc"."created_at",
    "count"("cct"."id") AS "current_teams"
   FROM ((("public"."club_categories" "cc"
     JOIN "public"."clubs" "c" ON (("cc"."club_id" = "c"."id")))
     JOIN "public"."categories" "cat" ON (("cc"."category_id" = "cat"."id")))
     LEFT JOIN "public"."club_category_teams" "cct" ON (("cc"."id" = "cct"."club_category_id")))
  GROUP BY "cc"."id", "c"."name", "c"."short_name", "cat"."id", "cat"."name", "cat"."description", "cc"."max_teams", "cc"."is_active", "cc"."created_at";


ALTER TABLE "public"."club_category_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."club_config" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "club_name" character varying(255) DEFAULT 'TJ Sokol Svinov'::character varying NOT NULL,
    "club_logo_url" "text",
    "hero_image_url" "text",
    "hero_title" character varying(255) DEFAULT 'Vítejte v TJ Sokol Svinov'::character varying,
    "hero_subtitle" "text" DEFAULT 'Tradiční házenkářský klub s bohatou historií'::"text",
    "hero_button_text" character varying(100) DEFAULT 'Více informací'::character varying,
    "hero_button_link" character varying(255) DEFAULT '/about'::character varying,
    "contact_email" character varying(255),
    "contact_phone" character varying(50),
    "address" "text",
    "facebook_url" "text",
    "instagram_url" "text",
    "website_url" "text",
    "founded_year" integer DEFAULT 1920,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "club_logo_path" "text",
    "hero_image_path" "text",
    "identity_number" "text",
    "bank_name" "text",
    "bank_number" "text",
    "venue_address" "text"
);


ALTER TABLE "public"."club_config" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."club_overview" WITH ("security_invoker"='on') AS
 SELECT "c"."id",
    "c"."name",
    "c"."short_name",
    "c"."city",
    "c"."created_at",
    "count"(DISTINCT "cc"."id") AS "total_categories",
    "count"(DISTINCT "cct"."id") AS "total_teams",
    "count"(DISTINCT
        CASE
            WHEN ("cc"."is_active" = true) THEN "cc"."id"
            ELSE NULL::"uuid"
        END) AS "active_categories",
    "count"(DISTINCT
        CASE
            WHEN ("cct"."is_active" = true) THEN "cct"."id"
            ELSE NULL::"uuid"
        END) AS "active_teams"
   FROM (("public"."clubs" "c"
     LEFT JOIN "public"."club_categories" "cc" ON (("c"."id" = "cc"."club_id")))
     LEFT JOIN "public"."club_category_teams" "cct" ON (("cc"."id" = "cct"."club_category_id")))
  GROUP BY "c"."id", "c"."name", "c"."short_name", "c"."city", "c"."created_at";


ALTER TABLE "public"."club_overview" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_cards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "surname" character varying(100) NOT NULL,
    "email" character varying(255),
    "phone" character varying(50),
    "note" "text",
    "photo_url" "text",
    "photo_path" "text",
    "published_categories" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."coach_cards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" character varying(20) DEFAULT 'member'::character varying NOT NULL,
    "assigned_categories" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "role_id" "uuid"
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."coach_cards_with_categories" WITH ("security_invoker"='on') AS
 SELECT "cc"."id",
    "cc"."user_id",
    "cc"."name",
    "cc"."surname",
    "cc"."email",
    "cc"."phone",
    "cc"."note",
    "cc"."photo_url",
    "cc"."photo_path",
    "cc"."published_categories",
    "cc"."created_at",
    "cc"."updated_at",
    "up"."assigned_categories",
    "up"."role"
   FROM ("public"."coach_cards" "cc"
     JOIN "public"."user_profiles" "up" ON (("cc"."user_id" = "up"."user_id")))
  WHERE (("up"."role")::"text" = ANY (ARRAY[('coach'::character varying)::"text", ('head_coach'::character varying)::"text", ('admin'::character varying)::"text"]));


ALTER TABLE "public"."coach_cards_with_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."coach_categories" OWNER TO "postgres";


COMMENT ON TABLE "public"."coach_categories" IS 'Coach category assignments for access control';



CREATE TABLE IF NOT EXISTS "public"."coach_category_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_profile_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "assigned_by" "uuid"
);


ALTER TABLE "public"."coach_category_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text" NOT NULL,
    "author" character varying(255) NOT NULL,
    "user_email" character varying(255) NOT NULL,
    "type" character varying(20) DEFAULT 'general'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "comments_type_check" CHECK ((("type")::"text" = ANY (ARRAY[('general'::character varying)::"text", ('bug'::character varying)::"text", ('feature'::character varying)::"text", ('improvement'::character varying)::"text"])))
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


COMMENT ON TABLE "public"."comments" IS 'Project management comments - public read, users can manage their own, admins have full access';



COMMENT ON COLUMN "public"."comments"."content" IS 'The comment text content';



COMMENT ON COLUMN "public"."comments"."author" IS 'Author of the comment';



COMMENT ON COLUMN "public"."comments"."user_email" IS 'Email of the user who created the comment';



COMMENT ON COLUMN "public"."comments"."type" IS 'Type of comment: general, bug, feature, improvement';



CREATE TABLE IF NOT EXISTS "public"."committees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "code" character varying(20) NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."committees" OWNER TO "postgres";


COMMENT ON TABLE "public"."committees" IS 'Regional competition committees (OBLASTNÍ SOUTĚŽNÍ KOMISE)';



CREATE TABLE IF NOT EXISTS "public"."external_players" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "registration_number" character varying(50) NOT NULL,
    "name" character varying(100) NOT NULL,
    "surname" character varying(100) NOT NULL,
    "position" character varying(50) NOT NULL,
    "club_id" "uuid",
    "club_name" character varying(200),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "external_players_position_check" CHECK ((("position")::"text" = ANY (ARRAY[('goalkeeper'::character varying)::"text", ('field_player'::character varying)::"text"])))
);


ALTER TABLE "public"."external_players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."grants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "month" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "is_active" boolean DEFAULT true NOT NULL,
    CONSTRAINT "grants_month_check" CHECK ((("month" >= 1) AND ("month" <= 12)))
);


ALTER TABLE "public"."grants" OWNER TO "postgres";


COMMENT ON TABLE "public"."grants" IS 'Grant calendar for tracking grant application deadlines';



COMMENT ON COLUMN "public"."grants"."name" IS 'Name of the grant';



COMMENT ON COLUMN "public"."grants"."description" IS 'Additional details about the grant';



COMMENT ON COLUMN "public"."grants"."month" IS 'Month when the grant is due (1-12)';



COMMENT ON COLUMN "public"."grants"."is_active" IS 'Whether the grant is active (soft delete)';



CREATE TABLE IF NOT EXISTS "public"."lineup_coaches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lineup_id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "role" character varying(50) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "lineup_coaches_role_check" CHECK ((("role")::"text" = ANY (ARRAY[('head_coach'::character varying)::"text", ('assistant_coach'::character varying)::"text", ('team_manager'::character varying)::"text"])))
);


ALTER TABLE "public"."lineup_coaches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lineup_players" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lineup_id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "position" character varying(50) NOT NULL,
    "jersey_number" integer,
    "is_captain" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "goals" integer DEFAULT 0,
    "yellow_cards" integer DEFAULT 0,
    "red_cards_5min" integer DEFAULT 0,
    "red_cards_10min" integer DEFAULT 0,
    "red_cards_personal" integer DEFAULT 0
);


ALTER TABLE "public"."lineup_players" OWNER TO "postgres";


COMMENT ON TABLE "public"."lineup_players" IS 'Lineup players table - validation is handled on frontend only';



CREATE TABLE IF NOT EXISTS "public"."lineups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "match_id" "uuid" NOT NULL,
    "team_id" "uuid" NOT NULL,
    "is_home_team" boolean NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lineups" OWNER TO "postgres";


COMMENT ON TABLE "public"."lineups" IS 'Lineups table - validation is handled on frontend only';



CREATE TABLE IF NOT EXISTS "public"."login_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "login_time" timestamp with time zone DEFAULT "now"(),
    "ip_address" "text",
    "user_agent" "text",
    "status" "text" NOT NULL,
    "session_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "action" "text" DEFAULT 'login'::"text" NOT NULL,
    CONSTRAINT "login_logs_action_check" CHECK (("action" = ANY (ARRAY['login'::"text", 'logout'::"text"]))),
    CONSTRAINT "login_logs_status_check" CHECK (("status" = ANY (ARRAY['success'::"text", 'failed'::"text", 'pending'::"text"])))
);


ALTER TABLE "public"."login_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."main_partners" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "logo_url" "text",
    "website_url" "text",
    "description" "text",
    "level" character varying(20) NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "benefits" "jsonb" DEFAULT '[]'::"jsonb",
    "contact_person" character varying(255),
    "contact_email" character varying(255),
    "contact_phone" character varying(50),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "main_partners_level_check" CHECK ((("level")::"text" = ANY (ARRAY[('platinum'::character varying)::"text", ('gold'::character varying)::"text"]))),
    CONSTRAINT "main_partners_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('active'::character varying)::"text", ('inactive'::character varying)::"text", ('expired'::character varying)::"text", ('pending'::character varying)::"text"])))
);


ALTER TABLE "public"."main_partners" OWNER TO "postgres";


COMMENT ON TABLE "public"."main_partners" IS 'Hlavní partneři a sponzoři klubu (platinum/gold úrovně)';



CREATE TABLE IF NOT EXISTS "public"."match_metadata" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "match_id" "uuid" NOT NULL,
    "metadata_type" character varying(50) NOT NULL,
    "content" "text",
    "file_url" "text",
    "file_name" "text",
    "file_size" integer,
    "mime_type" character varying(100),
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "is_primary" boolean DEFAULT false,
    CONSTRAINT "match_metadata_metadata_type_check" CHECK ((("metadata_type")::"text" = ANY (ARRAY[('photo'::character varying)::"text", ('note'::character varying)::"text", ('video'::character varying)::"text", ('document'::character varying)::"text", ('lineup'::character varying)::"text"])))
);


ALTER TABLE "public"."match_metadata" OWNER TO "postgres";


COMMENT ON TABLE "public"."match_metadata" IS 'Updated placeholder URLs to prevent Next.js Image errors';



COMMENT ON COLUMN "public"."match_metadata"."metadata_type" IS 'Type of metadata: photo, note, video, document, lineup';



COMMENT ON COLUMN "public"."match_metadata"."content" IS 'Text content for notes and descriptions';



COMMENT ON COLUMN "public"."match_metadata"."file_url" IS 'URL to file in storage for photos, videos, documents';



COMMENT ON COLUMN "public"."match_metadata"."metadata" IS 'Additional structured data as JSON';



COMMENT ON COLUMN "public"."match_metadata"."is_primary" IS 'Whether this is the primary item of this type for the match';



CREATE TABLE IF NOT EXISTS "public"."match_referees" (
    "match_id" "uuid" NOT NULL,
    "referee_id" "uuid" NOT NULL,
    "order" smallint NOT NULL,
    CONSTRAINT "match_referees_order_check" CHECK (("order" = ANY (ARRAY[1, 2])))
);


ALTER TABLE "public"."match_referees" OWNER TO "postgres";


COMMENT ON TABLE "public"."match_referees" IS 'Referees assigned to a match — up to 2 per match';



COMMENT ON COLUMN "public"."match_referees"."order" IS '1 = first referee, 2 = second referee';



CREATE TABLE IF NOT EXISTS "public"."matches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "season_id" "uuid",
    "date" "date" NOT NULL,
    "time" time without time zone NOT NULL,
    "home_team_id" "uuid",
    "away_team_id" "uuid",
    "venue" character varying(200) NOT NULL,
    "competition" character varying(100) NOT NULL,
    "is_home" boolean DEFAULT true,
    "status" character varying(20) DEFAULT 'upcoming'::character varying,
    "home_score" integer,
    "away_score" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "category_id" "uuid",
    "matchweek" integer,
    "match_number" "text",
    "post_id" "uuid",
    "home_score_halftime" integer,
    "away_score_halftime" integer,
    "coach_notes" "text",
    "tournament_id" "uuid",
    "round" integer,
    "match_phase" "text" DEFAULT 'regular'::"text" NOT NULL,
    CONSTRAINT "matches_match_phase_check" CHECK (("match_phase" = ANY (ARRAY['regular'::"text", 'quarterfinal'::"text", 'semifinal'::"text", 'final'::"text"])))
);


ALTER TABLE "public"."matches" OWNER TO "postgres";


COMMENT ON TABLE "public"."matches" IS 'Matches table - photo_url and coach_note fields migrated to match_metadata table';



COMMENT ON COLUMN "public"."matches"."matchweek" IS 'Match week/round number for organizing matches in competitions';



COMMENT ON COLUMN "public"."matches"."match_number" IS 'Specific match identifier/number within a matchweek (e.g., "1", "2", "Finále", "Semifinále")';



COMMENT ON COLUMN "public"."matches"."post_id" IS 'Optional reference to related blog post';



COMMENT ON COLUMN "public"."matches"."home_score_halftime" IS 'Half-time score for the home team';



COMMENT ON COLUMN "public"."matches"."away_score_halftime" IS 'Half-time score for the away team';



COMMENT ON COLUMN "public"."matches"."coach_notes" IS 'Coach notes and observations about the match';



COMMENT ON COLUMN "public"."matches"."tournament_id" IS 'FK to tournaments; NULL for league matches';



COMMENT ON COLUMN "public"."matches"."round" IS 'Round number within tournament; NULL for league matches';



CREATE MATERIALIZED VIEW "public"."match_stats" AS
 SELECT "m"."category_id",
    "m"."season_id",
    "count"(*) AS "total_matches",
    "count"(
        CASE
            WHEN (("m"."status")::"text" = 'completed'::"text") THEN 1
            ELSE NULL::integer
        END) AS "completed_matches",
    "count"(
        CASE
            WHEN (("m"."status")::"text" = 'upcoming'::"text") THEN 1
            ELSE NULL::integer
        END) AS "upcoming_matches",
    "avg"(
        CASE
            WHEN (("m"."status")::"text" = 'completed'::"text") THEN ("m"."home_score" + "m"."away_score")
            ELSE NULL::integer
        END) AS "avg_goals_per_match",
    "min"("m"."date") AS "first_match_date",
    "max"("m"."date") AS "last_match_date"
   FROM "public"."matches" "m"
  GROUP BY "m"."category_id", "m"."season_id"
  WITH NO DATA;


ALTER TABLE "public"."match_stats" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."match_stats" IS 'Precomputed statistics for matches by category and season';



CREATE TABLE IF NOT EXISTS "public"."match_videos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "match_id" "uuid" NOT NULL,
    "video_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."match_videos" OWNER TO "postgres";


COMMENT ON TABLE "public"."match_videos" IS 'Junction table for many-to-many relationship between matches and videos';



COMMENT ON COLUMN "public"."match_videos"."match_id" IS 'Reference to the match';



COMMENT ON COLUMN "public"."match_videos"."video_id" IS 'Reference to the video';



COMMENT ON COLUMN "public"."match_videos"."created_at" IS 'When the relationship was created';



CREATE OR REPLACE VIEW "public"."matches_with_teams_optimized" WITH ("security_invoker"='on') AS
 SELECT "m"."id",
    "m"."date",
    "m"."time",
    "m"."venue",
    "m"."competition",
    "m"."status",
    "m"."home_score",
    "m"."away_score",
    "m"."home_score_halftime",
    "m"."away_score_halftime",
    "m"."matchweek",
    "m"."match_number",
    "m"."category_id",
    "m"."season_id",
    "m"."home_team_id",
    "m"."away_team_id",
    "m"."created_at",
    "m"."updated_at",
    "hcct"."id" AS "home_team_club_category_id",
    "hcct"."team_suffix" AS "home_team_suffix",
    "hc"."id" AS "home_club_id",
    "hc"."name" AS "home_club_name",
    "hc"."short_name" AS "home_club_short_name",
    "hc"."logo_url" AS "home_club_logo_url",
    "hc"."is_own_club" AS "home_club_is_own_club",
    "acct"."id" AS "away_team_club_category_id",
    "acct"."team_suffix" AS "away_team_suffix",
    "ac"."id" AS "away_club_id",
    "ac"."name" AS "away_club_name",
    "ac"."short_name" AS "away_club_short_name",
    "ac"."logo_url" AS "away_club_logo_url",
    "ac"."is_own_club" AS "away_club_is_own_club"
   FROM (((((("public"."matches" "m"
     LEFT JOIN "public"."club_category_teams" "hcct" ON (("m"."home_team_id" = "hcct"."id")))
     LEFT JOIN "public"."club_categories" "hcc" ON (("hcct"."club_category_id" = "hcc"."id")))
     LEFT JOIN "public"."clubs" "hc" ON (("hcc"."club_id" = "hc"."id")))
     LEFT JOIN "public"."club_category_teams" "acct" ON (("m"."away_team_id" = "acct"."id")))
     LEFT JOIN "public"."club_categories" "acc" ON (("acct"."club_category_id" = "acc"."id")))
     LEFT JOIN "public"."clubs" "ac" ON (("acc"."club_id" = "ac"."id")));


ALTER TABLE "public"."matches_with_teams_optimized" OWNER TO "postgres";


COMMENT ON VIEW "public"."matches_with_teams_optimized" IS 'Optimized view for match queries with team and club details';



CREATE TABLE IF NOT EXISTS "public"."media_partners" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "logo_url" "text",
    "website_url" "text",
    "email" character varying(255),
    "phone" character varying(50),
    "description" "text" NOT NULL,
    "media_type" character varying(50) NOT NULL,
    "coverage" character varying(20) NOT NULL,
    "start_date" "date" NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "coverage_details" "jsonb" DEFAULT '[]'::"jsonb",
    "notes" "text",
    "monthly_value_czk" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "media_partners_coverage_check" CHECK ((("coverage")::"text" = ANY (ARRAY[('local'::character varying)::"text", ('regional'::character varying)::"text", ('national'::character varying)::"text"]))),
    CONSTRAINT "media_partners_media_type_check" CHECK ((("media_type")::"text" = ANY (ARRAY[('newspaper'::character varying)::"text", ('radio'::character varying)::"text", ('tv'::character varying)::"text", ('online'::character varying)::"text", ('social'::character varying)::"text", ('other'::character varying)::"text"]))),
    CONSTRAINT "media_partners_monthly_value_czk_check" CHECK (("monthly_value_czk" >= 0)),
    CONSTRAINT "media_partners_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('active'::character varying)::"text", ('inactive'::character varying)::"text", ('pending'::character varying)::"text"])))
);


ALTER TABLE "public"."media_partners" OWNER TO "postgres";


COMMENT ON TABLE "public"."media_partners" IS 'Mediální partneři pro propagaci a reklamu';



CREATE TABLE IF NOT EXISTS "public"."meeting_attendees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meeting_minutes_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "meeting_attendees_status_check" CHECK (("status" = ANY (ARRAY['present'::"text", 'excused'::"text"])))
);


ALTER TABLE "public"."meeting_attendees" OWNER TO "postgres";


COMMENT ON TABLE "public"."meeting_attendees" IS 'List of attendees for each meeting';



COMMENT ON COLUMN "public"."meeting_attendees"."meeting_minutes_id" IS 'Reference to meeting minutes';



COMMENT ON COLUMN "public"."meeting_attendees"."user_id" IS 'Reference to member who attended (from members table)';



COMMENT ON COLUMN "public"."meeting_attendees"."status" IS 'Attendance status: present or excused';



COMMENT ON COLUMN "public"."meeting_attendees"."notes" IS 'Additional notes about attendance';



CREATE TABLE IF NOT EXISTS "public"."meeting_minutes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meeting_number" integer NOT NULL,
    "meeting_date" "date" NOT NULL,
    "meeting_place" "text",
    "season_id" "uuid",
    "wrote_by" "uuid",
    "attachment_url" "text",
    "attachment_filename" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."meeting_minutes" OWNER TO "postgres";


COMMENT ON TABLE "public"."meeting_minutes" IS 'Meeting minutes from board meetings';



COMMENT ON COLUMN "public"."meeting_minutes"."meeting_number" IS 'Sequential meeting number within the year';



COMMENT ON COLUMN "public"."meeting_minutes"."meeting_date" IS 'Date when the meeting took place';



COMMENT ON COLUMN "public"."meeting_minutes"."meeting_place" IS 'Location where the meeting was held';



COMMENT ON COLUMN "public"."meeting_minutes"."season_id" IS 'Related season (optional)';



COMMENT ON COLUMN "public"."meeting_minutes"."wrote_by" IS 'User who wrote the meeting minutes';



COMMENT ON COLUMN "public"."meeting_minutes"."attachment_url" IS 'URL to attached file (Word/PDF)';



COMMENT ON COLUMN "public"."meeting_minutes"."attachment_filename" IS 'Original filename of the attachment';



CREATE TABLE IF NOT EXISTS "public"."member_attendance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "training_session_id" "uuid" NOT NULL,
    "attendance_status" character varying(20) DEFAULT 'present'::character varying NOT NULL,
    "notes" "text",
    "recorded_by" "uuid" NOT NULL,
    "recorded_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "member_attendance_attendance_status_check" CHECK ((("attendance_status")::"text" = ANY (ARRAY[('present'::character varying)::"text", ('absent'::character varying)::"text", ('late'::character varying)::"text", ('excused'::character varying)::"text"])))
);


ALTER TABLE "public"."member_attendance" OWNER TO "postgres";


COMMENT ON TABLE "public"."member_attendance" IS 'Member attendance records for training sessions';



CREATE TABLE IF NOT EXISTS "public"."member_functions" (
    "name" character varying(100) NOT NULL,
    "display_name" character varying(100) NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."member_functions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."member_metadata" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "phone" character varying(20),
    "email" character varying(255),
    "address" "text",
    "parent_name" character varying(255),
    "parent_phone" character varying(20),
    "parent_email" character varying(255),
    "medical_notes" "text",
    "allergies" "text",
    "emergency_contact_name" character varying(255),
    "emergency_contact_phone" character varying(20),
    "notes" "text",
    "preferred_position" character varying(100),
    "jersey_size" character varying(10),
    "shoe_size" character varying(10),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."member_metadata" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."members_with_metadata" WITH ("security_invoker"='on') AS
 SELECT "m"."id",
    "m"."name",
    "m"."surname",
    "m"."date_of_birth",
    "m"."sex",
    "m"."functions",
    "m"."created_at",
    "m"."updated_at",
    "m"."registration_number",
    "m"."category_id",
    "mm"."phone",
    "mm"."email",
    "mm"."address",
    "mm"."parent_name",
    "mm"."parent_phone",
    "mm"."parent_email",
    "mm"."medical_notes",
    "mm"."allergies",
    "mm"."emergency_contact_name",
    "mm"."emergency_contact_phone",
    "mm"."notes",
    "mm"."preferred_position",
    "mm"."jersey_size",
    "mm"."shoe_size",
    "c"."name" AS "category_name"
   FROM (("public"."members" "m"
     LEFT JOIN "public"."member_metadata" "mm" ON (("m"."id" = "mm"."member_id")))
     LEFT JOIN "public"."categories" "c" ON (("m"."category_id" = "c"."id")));


ALTER TABLE "public"."members_with_metadata" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."members_with_payment_status" WITH ("security_invoker"='on') AS
 SELECT "m"."id",
    "m"."registration_number",
    "m"."name",
    "m"."surname",
    "m"."date_of_birth",
    "m"."sex",
    "m"."category_id",
    "m"."functions",
    "m"."is_active",
    "m"."created_at",
    "m"."updated_at",
    "c"."name" AS "category_name",
    COALESCE("mfs"."payment_status", 'not_required'::"text") AS "payment_status",
    COALESCE("mfs"."expected_fee_amount", (0)::numeric) AS "expected_fee_amount",
    COALESCE("mfs"."net_paid", (0)::numeric) AS "net_paid",
    COALESCE("mfs"."total_paid", (0)::numeric) AS "total_paid",
    COALESCE("mfs"."total_refunded", (0)::numeric) AS "total_refunded",
    "mfs"."last_payment_date",
    "mfs"."payment_count",
    COALESCE("mfs"."currency", 'CZK'::character varying) AS "currency",
    COALESCE("mfs"."calendar_year", (EXTRACT(year FROM CURRENT_DATE))::integer) AS "payment_year"
   FROM (("public"."members" "m"
     LEFT JOIN "public"."categories" "c" ON (("m"."category_id" = "c"."id")))
     LEFT JOIN "public"."member_fee_status" "mfs" ON (("m"."id" = "mfs"."member_id")))
  WHERE ("m"."is_active" = true);


ALTER TABLE "public"."members_with_payment_status" OWNER TO "postgres";


COMMENT ON VIEW "public"."members_with_payment_status" IS 'Unified view of active members with their payment status for the current year. ';



CREATE TABLE IF NOT EXISTS "public"."migration_log" (
    "id" integer NOT NULL,
    "migration_name" character varying(255) NOT NULL,
    "executed_at" timestamp with time zone DEFAULT "now"(),
    "description" "text"
);


ALTER TABLE "public"."migration_log" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."migration_log_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."migration_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."migration_log_id_seq" OWNED BY "public"."migration_log"."id";



CREATE TABLE IF NOT EXISTS "public"."seasons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "is_active" boolean DEFAULT false,
    "is_closed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."seasons" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."own_club_matches" AS
 SELECT "m"."id",
    "m"."date",
    "m"."time",
    "m"."venue",
    "m"."competition",
    "m"."status",
    "m"."home_score",
    "m"."away_score",
    "m"."home_score_halftime",
    "m"."away_score_halftime",
    "m"."matchweek",
    "m"."match_number",
    "m"."category_id",
    "m"."season_id",
    "m"."home_team_id",
    "m"."away_team_id",
    "m"."created_at",
    "m"."updated_at",
    "c"."id" AS "category_id_full",
    "c"."name" AS "category_name",
    "c"."description" AS "category_description",
    "c"."slug" AS "category_slug",
    "s"."id" AS "season_id_full",
    "s"."name" AS "season_name",
    "s"."start_date" AS "season_start_date",
    "s"."end_date" AS "season_end_date",
    "hc"."id" AS "home_club_id",
    "hc"."is_own_club" AS "home_is_own_club",
    "hc"."name" AS "home_club_name",
    "hc"."short_name" AS "home_club_short_name",
    "hc"."logo_url" AS "home_club_logo_url",
    "hcct"."team_suffix" AS "home_team_suffix",
    "ac"."id" AS "away_club_id",
    "ac"."is_own_club" AS "away_is_own_club",
    "ac"."name" AS "away_club_name",
    "ac"."short_name" AS "away_club_short_name",
    "ac"."logo_url" AS "away_club_logo_url",
    "acct"."team_suffix" AS "away_team_suffix"
   FROM (((((((("public"."matches" "m"
     LEFT JOIN "public"."categories" "c" ON (("m"."category_id" = "c"."id")))
     LEFT JOIN "public"."seasons" "s" ON (("m"."season_id" = "s"."id")))
     LEFT JOIN "public"."club_category_teams" "hcct" ON (("m"."home_team_id" = "hcct"."id")))
     LEFT JOIN "public"."club_categories" "hcc" ON (("hcct"."club_category_id" = "hcc"."id")))
     LEFT JOIN "public"."clubs" "hc" ON (("hcc"."club_id" = "hc"."id")))
     LEFT JOIN "public"."club_category_teams" "acct" ON (("m"."away_team_id" = "acct"."id")))
     LEFT JOIN "public"."club_categories" "acc" ON (("acct"."club_category_id" = "acc"."id")))
     LEFT JOIN "public"."clubs" "ac" ON (("acc"."club_id" = "ac"."id")))
  WHERE (("hc"."is_own_club" = true) OR ("ac"."is_own_club" = true))
  WITH NO DATA;


ALTER TABLE "public"."own_club_matches" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."own_club_matches" IS 'Matches involving own club teams with category and season information';



CREATE TABLE IF NOT EXISTS "public"."page_visibility" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "page_key" character varying(100) NOT NULL,
    "page_title" character varying(255) NOT NULL,
    "page_route" character varying(255) NOT NULL,
    "page_description" "text",
    "is_visible" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "category" character varying(100),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."page_visibility" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."photo_albums" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "cover_photo_url" "text",
    "is_public" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."photo_albums" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "title" character varying(255),
    "description" "text",
    "file_path" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_size" integer,
    "mime_type" character varying(100),
    "width" integer,
    "height" integer,
    "sort_order" integer DEFAULT 0,
    "is_featured" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "uploaded_by" "uuid"
);


ALTER TABLE "public"."photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."point_deductions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "season_id" "uuid" NOT NULL,
    "points" integer NOT NULL,
    "reason" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "point_deductions_points_check" CHECK (("points" < 0))
);


ALTER TABLE "public"."point_deductions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "surname" "text" NOT NULL,
    "member_id" "uuid",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."referees" OWNER TO "postgres";


COMMENT ON TABLE "public"."referees" IS 'Referee profiles — club members or external referees';



COMMENT ON COLUMN "public"."referees"."member_id" IS 'Set when the referee is also a club member, NULL for external referees';



CREATE TABLE IF NOT EXISTS "public"."role_definitions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "description" "text",
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."role_definitions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sponsorship_packages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "level" character varying(20) NOT NULL,
    "price_czk" integer NOT NULL,
    "currency" character varying(3) DEFAULT 'CZK'::character varying NOT NULL,
    "description" "text",
    "benefits" "jsonb" DEFAULT '[]'::"jsonb",
    "validity_months" integer NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "sponsorship_packages_level_check" CHECK ((("level")::"text" = ANY (ARRAY[('platinum'::character varying)::"text", ('gold'::character varying)::"text", ('silver'::character varying)::"text", ('bronze'::character varying)::"text", ('partner'::character varying)::"text"]))),
    CONSTRAINT "sponsorship_packages_price_czk_check" CHECK (("price_czk" >= 0)),
    CONSTRAINT "sponsorship_packages_validity_months_check" CHECK (("validity_months" > 0))
);


ALTER TABLE "public"."sponsorship_packages" OWNER TO "postgres";


COMMENT ON TABLE "public"."sponsorship_packages" IS 'Sponzorské balíčky a ceník';



CREATE TABLE IF NOT EXISTS "public"."standings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "position" integer NOT NULL,
    "team_id" "uuid",
    "season_id" "uuid",
    "matches" integer DEFAULT 0,
    "wins" integer DEFAULT 0,
    "draws" integer DEFAULT 0,
    "losses" integer DEFAULT 0,
    "goals_for" integer DEFAULT 0,
    "goals_against" integer DEFAULT 0,
    "points" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "category_id" "uuid",
    "club_id" "uuid",
    "points_deduction" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."standings" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."team_details" WITH ("security_invoker"='on') AS
 SELECT "cct"."id" AS "team_id",
    "cct"."team_suffix",
    "cct"."is_active" AS "team_active",
    "c"."name" AS "club_name",
    "c"."short_name" AS "club_short_name",
    "c"."logo_url" AS "club_logo",
    "cat"."name" AS "category_name",
    "s"."name" AS "season_name",
    "s"."is_active" AS "season_active",
    "cc"."max_teams",
    "cc"."is_active" AS "club_category_active",
        CASE
            WHEN ("c"."short_name" IS NOT NULL) THEN ((("c"."short_name")::"text" || ' '::"text") || "cct"."team_suffix")
            ELSE ((("c"."name")::"text" || ' '::"text") || "cct"."team_suffix")
        END AS "display_name",
    ((("c"."name")::"text" || ' '::"text") || "cct"."team_suffix") AS "full_name"
   FROM (((("public"."club_category_teams" "cct"
     JOIN "public"."club_categories" "cc" ON (("cct"."club_category_id" = "cc"."id")))
     JOIN "public"."clubs" "c" ON (("cc"."club_id" = "c"."id")))
     JOIN "public"."categories" "cat" ON (("cc"."category_id" = "cat"."id")))
     JOIN "public"."seasons" "s" ON (("cc"."season_id" = "s"."id")))
  WHERE (("cct"."is_active" = true) AND ("cc"."is_active" = true) AND ("c"."is_active" = true) AND ("cat"."is_active" = true));


ALTER TABLE "public"."team_details" OWNER TO "postgres";


COMMENT ON VIEW "public"."team_details" IS 'Team details with club and category information - safe for all authenticated users';



CREATE OR REPLACE VIEW "public"."team_suffix_helper" WITH ("security_invoker"='on') AS
 SELECT "t"."id" AS "team_id",
    "t"."team_suffix",
    "t"."club_category_id",
    "cc"."category_id",
    "c"."name" AS "club_name",
    "cat"."name" AS "category_name"
   FROM ((("public"."club_category_teams" "t"
     JOIN "public"."club_categories" "cc" ON (("t"."club_category_id" = "cc"."id")))
     JOIN "public"."clubs" "c" ON (("cc"."club_id" = "c"."id")))
     JOIN "public"."categories" "cat" ON (("cc"."category_id" = "cat"."id")));


ALTER TABLE "public"."team_suffix_helper" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."teams_with_details" AS
 SELECT "cct"."id" AS "team_id",
    "cct"."team_suffix",
    "cct"."is_active",
    "cct"."created_at",
    "cct"."updated_at",
    "c"."id" AS "club_id",
    "c"."name" AS "club_name",
    "c"."short_name" AS "club_short_name",
    "c"."logo_url" AS "club_logo_url",
    "c"."is_own_club",
    "cat"."id" AS "category_id",
    "cat"."name" AS "category_name",
    "cat"."gender",
    "cat"."age_group",
    "cat"."sort_order",
    "s"."id" AS "season_id",
    "s"."name" AS "season_name",
    "s"."start_date" AS "season_start_date",
    "s"."end_date" AS "season_end_date",
    "s"."is_active" AS "season_is_active",
    "concat"("c"."name", ' ', "cct"."team_suffix") AS "team_display_name",
    "concat"(COALESCE("c"."short_name", "c"."name"), ' ', "cct"."team_suffix") AS "team_short_name"
   FROM (((("public"."club_category_teams" "cct"
     JOIN "public"."club_categories" "cc" ON (("cct"."club_category_id" = "cc"."id")))
     JOIN "public"."clubs" "c" ON (("cc"."club_id" = "c"."id")))
     JOIN "public"."categories" "cat" ON (("cc"."category_id" = "cat"."id")))
     JOIN "public"."seasons" "s" ON (("cc"."season_id" = "s"."id")))
  WHERE ("cct"."is_active" = true)
  WITH NO DATA;


ALTER TABLE "public"."teams_with_details" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."teams_with_details" IS 'Precomputed teams data with club, category, and season details for improved query performance';



CREATE OR REPLACE VIEW "public"."teams" WITH ("security_invoker"='on') AS
 SELECT "teams_with_details"."team_id" AS "id",
    "teams_with_details"."team_display_name" AS "name",
    "teams_with_details"."team_short_name" AS "short_name",
    "teams_with_details"."club_id",
    "teams_with_details"."club_name",
    "teams_with_details"."club_short_name",
    "teams_with_details"."team_suffix",
    "teams_with_details"."category_id",
    "teams_with_details"."category_name",
    "teams_with_details"."season_id",
    "teams_with_details"."season_name",
    "teams_with_details"."is_active",
    "teams_with_details"."created_at",
    "teams_with_details"."updated_at"
   FROM "public"."teams_with_details";


ALTER TABLE "public"."teams" OWNER TO "postgres";


COMMENT ON VIEW "public"."teams" IS 'Compatibility view for teams data - points to teams_with_details materialized view';



CREATE TABLE IF NOT EXISTS "public"."todos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "priority" character varying(20) DEFAULT 'medium'::character varying,
    "status" character varying(20) DEFAULT 'todo'::character varying,
    "category" character varying(20) DEFAULT 'improvement'::character varying,
    "assigned_to" character varying(255),
    "due_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "user_email" character varying(255) NOT NULL,
    CONSTRAINT "todos_category_check" CHECK ((("category")::"text" = ANY (ARRAY[('feature'::character varying)::"text", ('bug'::character varying)::"text", ('improvement'::character varying)::"text", ('technical'::character varying)::"text"]))),
    CONSTRAINT "todos_priority_check" CHECK ((("priority")::"text" = ANY (ARRAY[('low'::character varying)::"text", ('medium'::character varying)::"text", ('high'::character varying)::"text", ('urgent'::character varying)::"text"]))),
    CONSTRAINT "todos_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('todo'::character varying)::"text", ('in-progress'::character varying)::"text", ('done'::character varying)::"text"])))
);


ALTER TABLE "public"."todos" OWNER TO "postgres";


COMMENT ON TABLE "public"."todos" IS 'Project management todos - public read, users can manage their own, admins have full access';



COMMENT ON COLUMN "public"."todos"."title" IS 'Title of the todo item';



COMMENT ON COLUMN "public"."todos"."description" IS 'Detailed description of the todo item';



COMMENT ON COLUMN "public"."todos"."priority" IS 'Priority level: low, medium, high, urgent';



COMMENT ON COLUMN "public"."todos"."status" IS 'Current status: todo, in-progress, done';



COMMENT ON COLUMN "public"."todos"."category" IS 'Category: feature, bug, improvement, technical';



COMMENT ON COLUMN "public"."todos"."assigned_to" IS 'Person assigned to this todo';



COMMENT ON COLUMN "public"."todos"."due_date" IS 'Due date for the todo item';



COMMENT ON COLUMN "public"."todos"."created_by" IS 'User who created the todo item';



COMMENT ON COLUMN "public"."todos"."user_email" IS 'Email of the user who created the todo item';



CREATE TABLE IF NOT EXISTS "public"."tournament_standings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tournament_id" "uuid" NOT NULL,
    "team_id" "uuid",
    "position" integer DEFAULT 0 NOT NULL,
    "matches" integer DEFAULT 0 NOT NULL,
    "wins" integer DEFAULT 0 NOT NULL,
    "draws" integer DEFAULT 0 NOT NULL,
    "losses" integer DEFAULT 0 NOT NULL,
    "goals_for" integer DEFAULT 0 NOT NULL,
    "goals_against" integer DEFAULT 0 NOT NULL,
    "points" integer DEFAULT 0 NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tournament_standings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tournament_teams" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tournament_id" "uuid" NOT NULL,
    "team_id" "uuid" NOT NULL,
    "seed_order" integer DEFAULT 0 NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tournament_teams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tournaments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "category_id" "uuid",
    "season_id" "uuid",
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "venue" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "post_id" "uuid",
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."tournaments" OWNER TO "postgres";


COMMENT ON TABLE "public"."tournaments" IS 'Round-robin tournaments';



COMMENT ON COLUMN "public"."tournaments"."slug" IS 'URL-safe identifier, auto-generated from name';



COMMENT ON COLUMN "public"."tournaments"."status" IS 'draft | published | archived';



CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" character varying(20) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "user_roles_role_check" CHECK ((("role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('coach'::character varying)::"text"])))
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_roles" IS 'User role assignments (admin, coach)';



CREATE TABLE IF NOT EXISTS "public"."videos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "youtube_url" "text" NOT NULL,
    "youtube_id" "text" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "club_id" "uuid",
    "recording_date" "date",
    "season_id" "uuid",
    "thumbnail_url" "text",
    "duration" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid",
    "match_part" "text",
    CONSTRAINT "videos_match_part_check" CHECK (("match_part" = ANY (ARRAY['first_half'::"text", 'second_half'::"text", 'overtime'::"text", 'full_match'::"text"])))
);


ALTER TABLE "public"."videos" OWNER TO "postgres";


COMMENT ON TABLE "public"."videos" IS 'Videos uploaded to YouTube for different categories';



COMMENT ON COLUMN "public"."videos"."title" IS 'Title of the video';



COMMENT ON COLUMN "public"."videos"."description" IS 'Optional description of the video';



COMMENT ON COLUMN "public"."videos"."youtube_url" IS 'Full YouTube URL of the video';



COMMENT ON COLUMN "public"."videos"."youtube_id" IS 'YouTube video ID extracted from URL';



COMMENT ON COLUMN "public"."videos"."category_id" IS 'Category this video belongs to';



COMMENT ON COLUMN "public"."videos"."club_id" IS 'Club this video is related to (optional)';



COMMENT ON COLUMN "public"."videos"."recording_date" IS 'Date when the video was recorded (optional)';



COMMENT ON COLUMN "public"."videos"."season_id" IS 'Season this video belongs to (optional)';



COMMENT ON COLUMN "public"."videos"."thumbnail_url" IS 'YouTube thumbnail URL';



COMMENT ON COLUMN "public"."videos"."duration" IS 'Video duration (if available)';



COMMENT ON COLUMN "public"."videos"."is_active" IS 'Whether the video is active and visible';



COMMENT ON COLUMN "public"."videos"."created_by" IS 'User who created the video';



COMMENT ON COLUMN "public"."videos"."updated_by" IS 'User who last updated the video';



COMMENT ON COLUMN "public"."videos"."match_part" IS 'Optional: which part of the match this recording covers. Values: first_half, second_half, overtime.';



ALTER TABLE ONLY "public"."migration_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."migration_log_id_seq"'::"regclass");



ALTER TABLE ONLY "next_auth"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "next_auth"."users"
    ADD CONSTRAINT "email_unique" UNIQUE ("email");



ALTER TABLE ONLY "next_auth"."accounts"
    ADD CONSTRAINT "provider_unique" UNIQUE ("provider", "providerAccountId");



ALTER TABLE ONLY "next_auth"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "next_auth"."sessions"
    ADD CONSTRAINT "sessiontoken_unique" UNIQUE ("sessionToken");



ALTER TABLE ONLY "next_auth"."verification_tokens"
    ADD CONSTRAINT "token_identifier_unique" UNIQUE ("token", "identifier");



ALTER TABLE ONLY "next_auth"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "next_auth"."verification_tokens"
    ADD CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("token");



ALTER TABLE ONLY "public"."betting_bet_legs"
    ADD CONSTRAINT "betting_bet_legs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."betting_bets"
    ADD CONSTRAINT "betting_bets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."betting_odds_history"
    ADD CONSTRAINT "betting_odds_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."betting_odds"
    ADD CONSTRAINT "betting_odds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."betting_team_elo_ratings"
    ADD CONSTRAINT "betting_team_elo_ratings_pkey" PRIMARY KEY ("team_id");



ALTER TABLE ONLY "public"."betting_transactions"
    ADD CONSTRAINT "betting_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."betting_wallets"
    ADD CONSTRAINT "betting_wallets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."betting_wallets"
    ADD CONSTRAINT "betting_wallets_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."business_partners"
    ADD CONSTRAINT "business_partners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."category_lineup_members"
    ADD CONSTRAINT "category_lineup_members_lineup_id_jersey_number_key" UNIQUE ("lineup_id", "jersey_number");



ALTER TABLE ONLY "public"."category_lineup_members"
    ADD CONSTRAINT "category_lineup_members_lineup_id_member_id_key" UNIQUE ("lineup_id", "member_id");



ALTER TABLE ONLY "public"."category_lineup_members"
    ADD CONSTRAINT "category_lineup_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."category_lineups"
    ADD CONSTRAINT "category_lineups_category_id_season_id_name_key" UNIQUE ("category_id", "season_id", "name");



ALTER TABLE ONLY "public"."category_lineups"
    ADD CONSTRAINT "category_lineups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."category_membership_fees"
    ADD CONSTRAINT "category_membership_fees_category_id_calendar_year_fee_peri_key" UNIQUE ("category_id", "calendar_year", "fee_period");



ALTER TABLE ONLY "public"."category_membership_fees"
    ADD CONSTRAINT "category_membership_fees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."category_seasons"
    ADD CONSTRAINT "category_seasons_category_id_season_id_key" UNIQUE ("category_id", "season_id");



ALTER TABLE ONLY "public"."category_seasons"
    ADD CONSTRAINT "category_seasons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."club_categories"
    ADD CONSTRAINT "club_categories_club_id_category_id_season_id_key" UNIQUE ("club_id", "category_id", "season_id");



ALTER TABLE ONLY "public"."club_categories"
    ADD CONSTRAINT "club_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."club_category_teams"
    ADD CONSTRAINT "club_category_teams_club_category_id_team_suffix_key" UNIQUE ("club_category_id", "team_suffix");



ALTER TABLE ONLY "public"."club_category_teams"
    ADD CONSTRAINT "club_category_teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."club_config"
    ADD CONSTRAINT "club_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clubs"
    ADD CONSTRAINT "clubs_name_unique" UNIQUE ("name");



ALTER TABLE ONLY "public"."clubs"
    ADD CONSTRAINT "clubs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_cards"
    ADD CONSTRAINT "coach_cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_cards"
    ADD CONSTRAINT "coach_cards_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."coach_categories"
    ADD CONSTRAINT "coach_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_categories"
    ADD CONSTRAINT "coach_categories_user_id_category_id_key" UNIQUE ("user_id", "category_id");



ALTER TABLE ONLY "public"."coach_category_assignments"
    ADD CONSTRAINT "coach_category_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_category_assignments"
    ADD CONSTRAINT "coach_category_assignments_user_profile_id_category_id_key" UNIQUE ("user_profile_id", "category_id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."committees"
    ADD CONSTRAINT "committees_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."committees"
    ADD CONSTRAINT "committees_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."committees"
    ADD CONSTRAINT "committees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."external_players"
    ADD CONSTRAINT "external_players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."external_players"
    ADD CONSTRAINT "external_players_registration_number_key" UNIQUE ("registration_number");



ALTER TABLE ONLY "public"."grants"
    ADD CONSTRAINT "grants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lineup_coaches"
    ADD CONSTRAINT "lineup_coaches_lineup_id_member_id_key" UNIQUE ("lineup_id", "member_id");



ALTER TABLE ONLY "public"."lineup_coaches"
    ADD CONSTRAINT "lineup_coaches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lineup_players"
    ADD CONSTRAINT "lineup_players_lineup_id_jersey_number_key" UNIQUE ("lineup_id", "jersey_number");



ALTER TABLE ONLY "public"."lineup_players"
    ADD CONSTRAINT "lineup_players_lineup_id_member_id_key" UNIQUE ("lineup_id", "member_id");



ALTER TABLE ONLY "public"."lineup_players"
    ADD CONSTRAINT "lineup_players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lineups"
    ADD CONSTRAINT "lineups_match_id_team_id_key" UNIQUE ("match_id", "team_id");



ALTER TABLE ONLY "public"."lineups"
    ADD CONSTRAINT "lineups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."login_logs"
    ADD CONSTRAINT "login_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."main_partners"
    ADD CONSTRAINT "main_partners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."match_metadata"
    ADD CONSTRAINT "match_metadata_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."match_referees"
    ADD CONSTRAINT "match_referees_match_id_order_key" UNIQUE ("match_id", "order");



ALTER TABLE ONLY "public"."match_referees"
    ADD CONSTRAINT "match_referees_pkey" PRIMARY KEY ("match_id", "referee_id");



ALTER TABLE ONLY "public"."match_videos"
    ADD CONSTRAINT "match_videos_match_id_video_id_key" UNIQUE ("match_id", "video_id");



ALTER TABLE ONLY "public"."match_videos"
    ADD CONSTRAINT "match_videos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media_partners"
    ADD CONSTRAINT "media_partners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meeting_attendees"
    ADD CONSTRAINT "meeting_attendees_meeting_minutes_id_user_id_key" UNIQUE ("meeting_minutes_id", "user_id");



ALTER TABLE ONLY "public"."meeting_attendees"
    ADD CONSTRAINT "meeting_attendees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meeting_minutes"
    ADD CONSTRAINT "meeting_minutes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."member_attendance"
    ADD CONSTRAINT "member_attendance_member_id_training_session_id_key" UNIQUE ("member_id", "training_session_id");



ALTER TABLE ONLY "public"."member_attendance"
    ADD CONSTRAINT "member_attendance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."member_club_relationships"
    ADD CONSTRAINT "member_club_relationships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."member_functions"
    ADD CONSTRAINT "member_functions_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."member_functions"
    ADD CONSTRAINT "member_functions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."member_metadata"
    ADD CONSTRAINT "member_metadata_member_id_key" UNIQUE ("member_id");



ALTER TABLE ONLY "public"."member_metadata"
    ADD CONSTRAINT "member_metadata_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_registration_number_key" UNIQUE ("registration_number");



ALTER TABLE ONLY "public"."membership_fee_payments"
    ADD CONSTRAINT "membership_fee_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."migration_log"
    ADD CONSTRAINT "migration_log_migration_name_key" UNIQUE ("migration_name");



ALTER TABLE ONLY "public"."migration_log"
    ADD CONSTRAINT "migration_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."page_visibility"
    ADD CONSTRAINT "page_visibility_page_key_key" UNIQUE ("page_key");



ALTER TABLE ONLY "public"."page_visibility"
    ADD CONSTRAINT "page_visibility_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photo_albums"
    ADD CONSTRAINT "photo_albums_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."point_deductions"
    ADD CONSTRAINT "point_deductions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."referees"
    ADD CONSTRAINT "referees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_definitions"
    ADD CONSTRAINT "role_definitions_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."role_definitions"
    ADD CONSTRAINT "role_definitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sponsorship_packages"
    ADD CONSTRAINT "sponsorship_packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."standings"
    ADD CONSTRAINT "standings_category_id_season_id_team_id_key" UNIQUE ("category_id", "season_id", "team_id");



ALTER TABLE ONLY "public"."standings"
    ADD CONSTRAINT "standings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."todos"
    ADD CONSTRAINT "todos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tournament_standings"
    ADD CONSTRAINT "tournament_standings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tournament_teams"
    ADD CONSTRAINT "tournament_teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tournaments"
    ADD CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tournaments"
    ADD CONSTRAINT "tournaments_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."training_sessions"
    ADD CONSTRAINT "training_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."betting_odds"
    ADD CONSTRAINT "unique_odds_per_match_bet_selection" UNIQUE ("match_id", "bet_type", "selection", "parameter", "effective_from");



ALTER TABLE ONLY "public"."tournament_standings"
    ADD CONSTRAINT "uq_tournament_standing" UNIQUE ("tournament_id", "team_id");



ALTER TABLE ONLY "public"."tournament_teams"
    ADD CONSTRAINT "uq_tournament_team" UNIQUE ("tournament_id", "team_id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_role_id_key" UNIQUE ("user_id", "role_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."videos"
    ADD CONSTRAINT "videos_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_att_stats_summary_category" ON "public"."attendance_statistics_summary" USING "btree" ("category_id");



CREATE INDEX "idx_att_stats_summary_last_refreshed" ON "public"."attendance_statistics_summary" USING "btree" ("last_refreshed");



CREATE UNIQUE INDEX "idx_att_stats_summary_pk" ON "public"."attendance_statistics_summary" USING "btree" ("category_id", "season_id");



CREATE INDEX "idx_att_stats_summary_season" ON "public"."attendance_statistics_summary" USING "btree" ("season_id");



CREATE INDEX "idx_away_score_halftime" ON "public"."matches" USING "btree" ("away_score_halftime");



CREATE INDEX "idx_betting_bet_legs_bet_id" ON "public"."betting_bet_legs" USING "btree" ("bet_id");



CREATE INDEX "idx_betting_bet_legs_match_id" ON "public"."betting_bet_legs" USING "btree" ("match_id");



CREATE INDEX "idx_betting_bet_legs_status" ON "public"."betting_bet_legs" USING "btree" ("status");



CREATE INDEX "idx_betting_bets_placed_at" ON "public"."betting_bets" USING "btree" ("placed_at" DESC);



CREATE INDEX "idx_betting_bets_status" ON "public"."betting_bets" USING "btree" ("status");



CREATE INDEX "idx_betting_bets_user_id" ON "public"."betting_bets" USING "btree" ("user_id");



CREATE UNIQUE INDEX "idx_betting_leaderboard_user_id" ON "public"."betting_leaderboard" USING "btree" ("user_id");



CREATE INDEX "idx_betting_odds_bet_type" ON "public"."betting_odds" USING "btree" ("bet_type");



CREATE INDEX "idx_betting_odds_effective" ON "public"."betting_odds" USING "btree" ("effective_from", "effective_until");



CREATE INDEX "idx_betting_odds_match" ON "public"."betting_odds" USING "btree" ("match_id");



CREATE INDEX "idx_betting_transactions_created_at" ON "public"."betting_transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_betting_transactions_reference_id" ON "public"."betting_transactions" USING "btree" ("reference_id");



CREATE INDEX "idx_betting_transactions_type" ON "public"."betting_transactions" USING "btree" ("type");



CREATE INDEX "idx_betting_transactions_user_id" ON "public"."betting_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_betting_transactions_wallet_id" ON "public"."betting_transactions" USING "btree" ("wallet_id");



CREATE INDEX "idx_betting_wallets_user_id" ON "public"."betting_wallets" USING "btree" ("user_id");



CREATE INDEX "idx_blog_posts_author_id" ON "public"."blog_posts" USING "btree" ("author_id");



CREATE INDEX "idx_blog_posts_category_id" ON "public"."blog_posts" USING "btree" ("category_id");



CREATE INDEX "idx_blog_posts_created_at" ON "public"."blog_posts" USING "btree" ("created_at");



CREATE INDEX "idx_blog_posts_match_id" ON "public"."blog_posts" USING "btree" ("match_id");



CREATE INDEX "idx_blog_posts_published_at" ON "public"."blog_posts" USING "btree" ("published_at");



CREATE INDEX "idx_blog_posts_slug" ON "public"."blog_posts" USING "btree" ("slug");



CREATE INDEX "idx_blog_posts_status" ON "public"."blog_posts" USING "btree" ("status");



CREATE INDEX "idx_business_partners_level" ON "public"."business_partners" USING "btree" ("level");



CREATE INDEX "idx_business_partners_status" ON "public"."business_partners" USING "btree" ("status");



CREATE INDEX "idx_business_partners_type" ON "public"."business_partners" USING "btree" ("partnership_type");



CREATE INDEX "idx_categories_active" ON "public"."categories" USING "btree" ("is_active");



CREATE INDEX "idx_categories_slug" ON "public"."categories" USING "btree" ("slug");



CREATE INDEX "idx_categories_sort_order" ON "public"."categories" USING "btree" ("sort_order");



CREATE INDEX "idx_category_fees_active" ON "public"."category_membership_fees" USING "btree" ("is_active");



CREATE INDEX "idx_category_fees_category_id" ON "public"."category_membership_fees" USING "btree" ("category_id");



CREATE INDEX "idx_category_fees_category_year" ON "public"."category_membership_fees" USING "btree" ("category_id", "calendar_year");



CREATE INDEX "idx_category_fees_year" ON "public"."category_membership_fees" USING "btree" ("calendar_year");



CREATE INDEX "idx_category_lineup_members_lineup" ON "public"."category_lineup_members" USING "btree" ("lineup_id");



CREATE INDEX "idx_category_lineup_members_member" ON "public"."category_lineup_members" USING "btree" ("member_id");



CREATE INDEX "idx_category_lineups_category" ON "public"."category_lineups" USING "btree" ("category_id");



CREATE INDEX "idx_category_lineups_created_by" ON "public"."category_lineups" USING "btree" ("created_by");



CREATE INDEX "idx_category_lineups_season" ON "public"."category_lineups" USING "btree" ("season_id");



CREATE INDEX "idx_category_seasons_active" ON "public"."category_seasons" USING "btree" ("is_active");



CREATE INDEX "idx_category_seasons_category" ON "public"."category_seasons" USING "btree" ("category_id");



CREATE INDEX "idx_category_seasons_season" ON "public"."category_seasons" USING "btree" ("season_id");



CREATE INDEX "idx_club_categories_active" ON "public"."club_categories" USING "btree" ("is_active");



CREATE INDEX "idx_club_categories_category_id" ON "public"."club_categories" USING "btree" ("category_id");



CREATE INDEX "idx_club_categories_club_id" ON "public"."club_categories" USING "btree" ("club_id");



CREATE INDEX "idx_club_categories_id" ON "public"."club_categories" USING "btree" ("id");



CREATE INDEX "idx_club_categories_season_id" ON "public"."club_categories" USING "btree" ("season_id");



CREATE INDEX "idx_club_category_teams_club_category" ON "public"."club_category_teams" USING "btree" ("club_category_id");



CREATE INDEX "idx_club_category_teams_id" ON "public"."club_category_teams" USING "btree" ("id");



CREATE INDEX "idx_club_config_active" ON "public"."club_config" USING "btree" ("is_active");



CREATE INDEX "idx_clubs_active" ON "public"."clubs" USING "btree" ("is_active");



CREATE INDEX "idx_clubs_id" ON "public"."clubs" USING "btree" ("id");



CREATE INDEX "idx_clubs_is_own_club" ON "public"."clubs" USING "btree" ("is_own_club") WHERE ("is_own_club" = true);



CREATE INDEX "idx_clubs_name" ON "public"."clubs" USING "btree" ("name");



CREATE INDEX "idx_coach_cards_published_categories" ON "public"."coach_cards" USING "gin" ("published_categories");



CREATE INDEX "idx_coach_cards_user_id" ON "public"."coach_cards" USING "btree" ("user_id");



CREATE INDEX "idx_coach_categories_category_id" ON "public"."coach_categories" USING "btree" ("category_id");



CREATE INDEX "idx_coach_categories_user_id" ON "public"."coach_categories" USING "btree" ("user_id");



CREATE INDEX "idx_comments_author" ON "public"."comments" USING "btree" ("author");



CREATE INDEX "idx_comments_created_at" ON "public"."comments" USING "btree" ("created_at");



CREATE INDEX "idx_comments_type" ON "public"."comments" USING "btree" ("type");



CREATE INDEX "idx_committees_active" ON "public"."committees" USING "btree" ("is_active");



CREATE INDEX "idx_committees_sort" ON "public"."committees" USING "btree" ("sort_order");



CREATE INDEX "idx_external_players_club_id" ON "public"."external_players" USING "btree" ("club_id");



CREATE INDEX "idx_external_players_name_search" ON "public"."external_players" USING "btree" ("name", "surname");



CREATE INDEX "idx_external_players_registration_number" ON "public"."external_players" USING "btree" ("registration_number");



CREATE INDEX "idx_grants_created_at" ON "public"."grants" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_grants_is_active" ON "public"."grants" USING "btree" ("is_active");



CREATE INDEX "idx_grants_month" ON "public"."grants" USING "btree" ("month");



CREATE INDEX "idx_home_score_halftime" ON "public"."matches" USING "btree" ("home_score_halftime");



CREATE INDEX "idx_lineup_coaches_lineup_id" ON "public"."lineup_coaches" USING "btree" ("lineup_id");



CREATE INDEX "idx_lineup_coaches_member_id" ON "public"."lineup_coaches" USING "btree" ("member_id");



CREATE INDEX "idx_lineup_players_lineup_id" ON "public"."lineup_players" USING "btree" ("lineup_id");



CREATE INDEX "idx_lineup_players_member_id" ON "public"."lineup_players" USING "btree" ("member_id");



CREATE INDEX "idx_lineups_match_id" ON "public"."lineups" USING "btree" ("match_id");



CREATE INDEX "idx_lineups_team_id" ON "public"."lineups" USING "btree" ("team_id");



CREATE INDEX "idx_login_logs_action" ON "public"."login_logs" USING "btree" ("action");



CREATE INDEX "idx_login_logs_email" ON "public"."login_logs" USING "btree" ("email");



CREATE INDEX "idx_login_logs_login_time" ON "public"."login_logs" USING "btree" ("login_time" DESC);



CREATE INDEX "idx_login_logs_status" ON "public"."login_logs" USING "btree" ("status");



CREATE INDEX "idx_login_logs_user_id" ON "public"."login_logs" USING "btree" ("user_id");



CREATE INDEX "idx_main_partners_dates" ON "public"."main_partners" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_main_partners_level" ON "public"."main_partners" USING "btree" ("level");



CREATE INDEX "idx_main_partners_status" ON "public"."main_partners" USING "btree" ("status");



CREATE INDEX "idx_match_metadata_created_at" ON "public"."match_metadata" USING "btree" ("created_at");



CREATE INDEX "idx_match_metadata_is_primary" ON "public"."match_metadata" USING "btree" ("is_primary");



CREATE INDEX "idx_match_metadata_match_id" ON "public"."match_metadata" USING "btree" ("match_id");



CREATE INDEX "idx_match_metadata_match_type" ON "public"."match_metadata" USING "btree" ("match_id", "metadata_type");



CREATE INDEX "idx_match_metadata_type" ON "public"."match_metadata" USING "btree" ("metadata_type");



CREATE INDEX "idx_match_referees_match_id" ON "public"."match_referees" USING "btree" ("match_id");



CREATE INDEX "idx_match_referees_referee_id" ON "public"."match_referees" USING "btree" ("referee_id");



CREATE INDEX "idx_match_stats_category_season" ON "public"."match_stats" USING "btree" ("category_id", "season_id");



CREATE INDEX "idx_match_videos_created_at" ON "public"."match_videos" USING "btree" ("created_at");



CREATE INDEX "idx_match_videos_match_id" ON "public"."match_videos" USING "btree" ("match_id");



CREATE INDEX "idx_match_videos_video_id" ON "public"."match_videos" USING "btree" ("video_id");



CREATE INDEX "idx_matches_away_team" ON "public"."matches" USING "btree" ("away_team_id");



CREATE INDEX "idx_matches_category_fk" ON "public"."matches" USING "btree" ("category_id");



CREATE INDEX "idx_matches_category_season" ON "public"."matches" USING "btree" ("category_id", "season_id");



CREATE INDEX "idx_matches_category_season_date" ON "public"."matches" USING "btree" ("category_id", "season_id", "date");



CREATE INDEX "idx_matches_category_season_status" ON "public"."matches" USING "btree" ("category_id", "season_id", "status");



CREATE INDEX "idx_matches_coach_notes" ON "public"."matches" USING "btree" ("coach_notes") WHERE ("coach_notes" IS NOT NULL);



CREATE INDEX "idx_matches_completed" ON "public"."matches" USING "btree" ("date", "category_id", "season_id") WHERE (("status")::"text" = 'completed'::"text");



CREATE INDEX "idx_matches_created_at" ON "public"."matches" USING "btree" ("created_at");



CREATE INDEX "idx_matches_date" ON "public"."matches" USING "btree" ("date");



CREATE INDEX "idx_matches_date_status" ON "public"."matches" USING "btree" ("date", "status");



CREATE INDEX "idx_matches_home_team" ON "public"."matches" USING "btree" ("home_team_id");



CREATE INDEX "idx_matches_match_number" ON "public"."matches" USING "btree" ("match_number");



CREATE INDEX "idx_matches_match_phase" ON "public"."matches" USING "btree" ("match_phase");



CREATE INDEX "idx_matches_matchweek" ON "public"."matches" USING "btree" ("matchweek");



CREATE INDEX "idx_matches_post_id" ON "public"."matches" USING "btree" ("post_id");



CREATE INDEX "idx_matches_scores_halftime" ON "public"."matches" USING "btree" ("home_score_halftime", "away_score_halftime");



CREATE INDEX "idx_matches_season" ON "public"."matches" USING "btree" ("season_id");



CREATE INDEX "idx_matches_season_fk" ON "public"."matches" USING "btree" ("season_id");



CREATE INDEX "idx_matches_status" ON "public"."matches" USING "btree" ("status");



CREATE INDEX "idx_matches_tournament" ON "public"."matches" USING "btree" ("tournament_id");



CREATE INDEX "idx_matches_upcoming" ON "public"."matches" USING "btree" ("date", "time", "category_id", "season_id") WHERE (("status")::"text" = 'upcoming'::"text");



CREATE INDEX "idx_matches_week_number" ON "public"."matches" USING "btree" ("matchweek", "match_number");



CREATE INDEX "idx_media_partners_coverage" ON "public"."media_partners" USING "btree" ("coverage");



CREATE INDEX "idx_media_partners_status" ON "public"."media_partners" USING "btree" ("status");



CREATE INDEX "idx_media_partners_type" ON "public"."media_partners" USING "btree" ("media_type");



CREATE INDEX "idx_meeting_attendees_meeting_minutes_id" ON "public"."meeting_attendees" USING "btree" ("meeting_minutes_id");



CREATE INDEX "idx_meeting_attendees_status" ON "public"."meeting_attendees" USING "btree" ("status");



CREATE INDEX "idx_meeting_attendees_user_id" ON "public"."meeting_attendees" USING "btree" ("user_id");



CREATE INDEX "idx_meeting_minutes_is_active" ON "public"."meeting_minutes" USING "btree" ("is_active");



CREATE INDEX "idx_meeting_minutes_meeting_date" ON "public"."meeting_minutes" USING "btree" ("meeting_date");



CREATE INDEX "idx_meeting_minutes_meeting_number" ON "public"."meeting_minutes" USING "btree" ("meeting_number");



CREATE INDEX "idx_meeting_minutes_season_id" ON "public"."meeting_minutes" USING "btree" ("season_id");



CREATE INDEX "idx_meeting_minutes_wrote_by" ON "public"."meeting_minutes" USING "btree" ("wrote_by");



CREATE INDEX "idx_member_attendance_member" ON "public"."member_attendance" USING "btree" ("member_id");



CREATE INDEX "idx_member_attendance_member_id" ON "public"."member_attendance" USING "btree" ("member_id");



CREATE INDEX "idx_member_attendance_recorded_by" ON "public"."member_attendance" USING "btree" ("recorded_by");



CREATE INDEX "idx_member_attendance_session" ON "public"."member_attendance" USING "btree" ("training_session_id");



CREATE INDEX "idx_member_attendance_session_id" ON "public"."member_attendance" USING "btree" ("training_session_id");



CREATE INDEX "idx_member_attendance_status" ON "public"."member_attendance" USING "btree" ("attendance_status");



CREATE INDEX "idx_member_club_relationships_active" ON "public"."member_club_relationships" USING "btree" ("member_id", "club_id") WHERE (("status")::"text" = 'active'::"text");



CREATE INDEX "idx_member_club_relationships_club_id" ON "public"."member_club_relationships" USING "btree" ("club_id");



CREATE INDEX "idx_member_club_relationships_dates" ON "public"."member_club_relationships" USING "btree" ("valid_from", "valid_to");



CREATE INDEX "idx_member_club_relationships_member_id" ON "public"."member_club_relationships" USING "btree" ("member_id");



CREATE INDEX "idx_member_club_relationships_status" ON "public"."member_club_relationships" USING "btree" ("status");



CREATE INDEX "idx_member_functions_active" ON "public"."member_functions" USING "btree" ("is_active");



CREATE INDEX "idx_member_functions_name" ON "public"."member_functions" USING "btree" ("name");



CREATE INDEX "idx_member_functions_sort" ON "public"."member_functions" USING "btree" ("sort_order");



CREATE INDEX "idx_member_metadata_email" ON "public"."member_metadata" USING "btree" ("email");



CREATE INDEX "idx_member_metadata_member_id" ON "public"."member_metadata" USING "btree" ("member_id");



CREATE INDEX "idx_member_metadata_phone" ON "public"."member_metadata" USING "btree" ("phone");



CREATE INDEX "idx_members_active_category" ON "public"."members" USING "btree" ("is_active", "category_id") WHERE ("is_active" = true);



CREATE INDEX "idx_members_category_active" ON "public"."members" USING "btree" ("category_id", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_members_category_id" ON "public"."members" USING "btree" ("category_id");



CREATE INDEX "idx_members_is_active" ON "public"."members" USING "btree" ("is_active");



CREATE INDEX "idx_members_name" ON "public"."members" USING "btree" ("name");



CREATE INDEX "idx_members_registration_number" ON "public"."members" USING "btree" ("registration_number");



CREATE INDEX "idx_members_sex" ON "public"."members" USING "btree" ("sex");



CREATE INDEX "idx_members_surname" ON "public"."members" USING "btree" ("surname");



CREATE INDEX "idx_membership_payments_category_id" ON "public"."membership_fee_payments" USING "btree" ("category_id");



CREATE INDEX "idx_membership_payments_date" ON "public"."membership_fee_payments" USING "btree" ("payment_date" DESC);



CREATE INDEX "idx_membership_payments_member_id" ON "public"."membership_fee_payments" USING "btree" ("member_id");



CREATE INDEX "idx_membership_payments_member_year" ON "public"."membership_fee_payments" USING "btree" ("member_id", "calendar_year");



CREATE INDEX "idx_membership_payments_year" ON "public"."membership_fee_payments" USING "btree" ("calendar_year");



CREATE INDEX "idx_odds_history_changed_at" ON "public"."betting_odds_history" USING "btree" ("changed_at" DESC);



CREATE INDEX "idx_odds_history_match" ON "public"."betting_odds_history" USING "btree" ("match_id");



CREATE INDEX "idx_own_club_matches_category_season" ON "public"."own_club_matches" USING "btree" ("category_id", "season_id");



CREATE INDEX "idx_own_club_matches_date" ON "public"."own_club_matches" USING "btree" ("date");



CREATE INDEX "idx_own_club_matches_status" ON "public"."own_club_matches" USING "btree" ("status");



CREATE INDEX "idx_page_visibility_active" ON "public"."page_visibility" USING "btree" ("is_active");



CREATE INDEX "idx_page_visibility_category" ON "public"."page_visibility" USING "btree" ("category");



CREATE INDEX "idx_page_visibility_sort_order" ON "public"."page_visibility" USING "btree" ("sort_order");



CREATE INDEX "idx_page_visibility_visible" ON "public"."page_visibility" USING "btree" ("is_visible");



CREATE INDEX "idx_photo_albums_public" ON "public"."photo_albums" USING "btree" ("is_public");



CREATE INDEX "idx_photo_albums_sort" ON "public"."photo_albums" USING "btree" ("sort_order");



CREATE INDEX "idx_photos_album_id" ON "public"."photos" USING "btree" ("album_id");



CREATE INDEX "idx_photos_sort" ON "public"."photos" USING "btree" ("sort_order");



CREATE INDEX "idx_point_deductions_cat_season" ON "public"."point_deductions" USING "btree" ("category_id", "season_id");



CREATE INDEX "idx_point_deductions_season_id" ON "public"."point_deductions" USING "btree" ("season_id");



CREATE INDEX "idx_point_deductions_team_id" ON "public"."point_deductions" USING "btree" ("team_id");



CREATE INDEX "idx_referees_is_active" ON "public"."referees" USING "btree" ("is_active");



CREATE INDEX "idx_referees_member_id" ON "public"."referees" USING "btree" ("member_id");



CREATE INDEX "idx_seasons_active" ON "public"."seasons" USING "btree" ("is_active");



CREATE INDEX "idx_seasons_dates" ON "public"."seasons" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_seasons_is_active" ON "public"."seasons" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_sponsorship_packages_active" ON "public"."sponsorship_packages" USING "btree" ("is_active");



CREATE INDEX "idx_sponsorship_packages_level" ON "public"."sponsorship_packages" USING "btree" ("level");



CREATE INDEX "idx_standings_position" ON "public"."standings" USING "btree" ("position");



CREATE INDEX "idx_standings_season" ON "public"."standings" USING "btree" ("season_id");



CREATE INDEX "idx_standings_team" ON "public"."standings" USING "btree" ("team_id");



CREATE INDEX "idx_teams_mv_category_id" ON "public"."teams_with_details" USING "btree" ("category_id");



CREATE INDEX "idx_teams_mv_category_season" ON "public"."teams_with_details" USING "btree" ("category_id", "season_id");



CREATE INDEX "idx_teams_mv_club_id" ON "public"."teams_with_details" USING "btree" ("club_id");



CREATE INDEX "idx_teams_mv_club_name" ON "public"."teams_with_details" USING "btree" ("club_name");



CREATE INDEX "idx_teams_mv_display_name" ON "public"."teams_with_details" USING "btree" ("team_display_name");



CREATE INDEX "idx_teams_mv_is_active" ON "public"."teams_with_details" USING "btree" ("is_active");



CREATE INDEX "idx_teams_mv_is_own_club" ON "public"."teams_with_details" USING "btree" ("is_own_club");



CREATE INDEX "idx_teams_mv_season_id" ON "public"."teams_with_details" USING "btree" ("season_id");



CREATE INDEX "idx_teams_mv_team_id" ON "public"."teams_with_details" USING "btree" ("team_id");



CREATE INDEX "idx_todos_category" ON "public"."todos" USING "btree" ("category");



CREATE INDEX "idx_todos_created_by" ON "public"."todos" USING "btree" ("created_by");



CREATE INDEX "idx_todos_due_date" ON "public"."todos" USING "btree" ("due_date");



CREATE INDEX "idx_todos_priority" ON "public"."todos" USING "btree" ("priority");



CREATE INDEX "idx_todos_status" ON "public"."todos" USING "btree" ("status");



CREATE INDEX "idx_tournament_standings_tournament" ON "public"."tournament_standings" USING "btree" ("tournament_id");



CREATE INDEX "idx_tournament_teams_tournament" ON "public"."tournament_teams" USING "btree" ("tournament_id");



CREATE INDEX "idx_tournaments_category_season" ON "public"."tournaments" USING "btree" ("category_id", "season_id");



CREATE UNIQUE INDEX "idx_tournaments_slug" ON "public"."tournaments" USING "btree" ("slug");



CREATE INDEX "idx_tournaments_status" ON "public"."tournaments" USING "btree" ("status");



CREATE INDEX "idx_training_sessions_category_id" ON "public"."training_sessions" USING "btree" ("category_id");



CREATE INDEX "idx_training_sessions_category_season" ON "public"."training_sessions" USING "btree" ("category_id", "season_id");



CREATE INDEX "idx_training_sessions_coach" ON "public"."training_sessions" USING "btree" ("coach_id");



CREATE INDEX "idx_training_sessions_date" ON "public"."training_sessions" USING "btree" ("session_date");



CREATE INDEX "idx_training_sessions_season" ON "public"."training_sessions" USING "btree" ("season_id");



CREATE INDEX "idx_training_sessions_session_date" ON "public"."training_sessions" USING "btree" ("session_date");



CREATE INDEX "idx_training_sessions_status" ON "public"."training_sessions" USING "btree" ("status");



CREATE INDEX "idx_user_profiles_user_id" ON "public"."user_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_user_roles_role" ON "public"."user_roles" USING "btree" ("role");



CREATE INDEX "idx_user_roles_user_id" ON "public"."user_roles" USING "btree" ("user_id");



CREATE INDEX "idx_videos_category_id" ON "public"."videos" USING "btree" ("category_id");



CREATE INDEX "idx_videos_club_id" ON "public"."videos" USING "btree" ("club_id");



CREATE INDEX "idx_videos_created_at" ON "public"."videos" USING "btree" ("created_at");



CREATE INDEX "idx_videos_is_active" ON "public"."videos" USING "btree" ("is_active");



CREATE INDEX "idx_videos_season_id" ON "public"."videos" USING "btree" ("season_id");



CREATE INDEX "idx_videos_youtube_id" ON "public"."videos" USING "btree" ("youtube_id");



CREATE INDEX "profiles_email_idx" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "profiles_role_idx" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "profiles_user_id_idx" ON "public"."profiles" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "generate_member_registration_number" BEFORE INSERT ON "public"."members" FOR EACH ROW WHEN (("new"."registration_number" IS NULL)) EXECUTE FUNCTION "public"."generate_registration_number"();



CREATE OR REPLACE TRIGGER "members_audit_fields_trigger" BEFORE INSERT OR UPDATE ON "public"."members" FOR EACH ROW EXECUTE FUNCTION "public"."set_members_audit_fields"();



CREATE OR REPLACE TRIGGER "point_deductions_updated_at_trigger" BEFORE UPDATE ON "public"."point_deductions" FOR EACH ROW EXECUTE FUNCTION "public"."update_point_deductions_updated_at"();



CREATE OR REPLACE TRIGGER "referees_updated_at_trigger" BEFORE UPDATE ON "public"."referees" FOR EACH ROW EXECUTE FUNCTION "public"."update_referees_updated_at"();



CREATE OR REPLACE TRIGGER "refresh_att_stats_on_attendance_delete" AFTER DELETE ON "public"."member_attendance" FOR EACH STATEMENT EXECUTE FUNCTION "public"."trigger_refresh_attendance_stats"();



CREATE OR REPLACE TRIGGER "refresh_att_stats_on_attendance_insert" AFTER INSERT ON "public"."member_attendance" FOR EACH STATEMENT EXECUTE FUNCTION "public"."trigger_refresh_attendance_stats"();



CREATE OR REPLACE TRIGGER "refresh_att_stats_on_attendance_update" AFTER UPDATE ON "public"."member_attendance" FOR EACH STATEMENT EXECUTE FUNCTION "public"."trigger_refresh_attendance_stats"();



CREATE OR REPLACE TRIGGER "refresh_att_stats_on_session_delete" AFTER DELETE ON "public"."training_sessions" FOR EACH STATEMENT EXECUTE FUNCTION "public"."trigger_refresh_attendance_stats"();



CREATE OR REPLACE TRIGGER "refresh_att_stats_on_session_insert" AFTER INSERT ON "public"."training_sessions" FOR EACH STATEMENT EXECUTE FUNCTION "public"."trigger_refresh_attendance_stats"();



CREATE OR REPLACE TRIGGER "refresh_att_stats_on_session_status" AFTER UPDATE OF "status" ON "public"."training_sessions" FOR EACH STATEMENT EXECUTE FUNCTION "public"."trigger_refresh_attendance_stats"();



CREATE OR REPLACE TRIGGER "refresh_match_stats_on_delete" AFTER DELETE ON "public"."matches" FOR EACH STATEMENT EXECUTE FUNCTION "public"."trigger_refresh_match_stats"();



CREATE OR REPLACE TRIGGER "refresh_match_stats_on_insert" AFTER INSERT ON "public"."matches" FOR EACH STATEMENT EXECUTE FUNCTION "public"."trigger_refresh_match_stats"();



CREATE OR REPLACE TRIGGER "refresh_match_stats_on_update" AFTER UPDATE ON "public"."matches" FOR EACH STATEMENT EXECUTE FUNCTION "public"."trigger_refresh_match_stats"();



CREATE OR REPLACE TRIGGER "refresh_teams_mv_on_category_update" AFTER UPDATE ON "public"."categories" FOR EACH STATEMENT EXECUTE FUNCTION "public"."trigger_refresh_teams_mv"();



CREATE OR REPLACE TRIGGER "refresh_teams_mv_on_club_update" AFTER UPDATE ON "public"."clubs" FOR EACH STATEMENT EXECUTE FUNCTION "public"."trigger_refresh_teams_mv"();



CREATE OR REPLACE TRIGGER "refresh_teams_mv_on_delete" AFTER DELETE ON "public"."club_category_teams" FOR EACH STATEMENT EXECUTE FUNCTION "public"."trigger_refresh_teams_mv"();



CREATE OR REPLACE TRIGGER "refresh_teams_mv_on_insert" AFTER INSERT ON "public"."club_category_teams" FOR EACH STATEMENT EXECUTE FUNCTION "public"."trigger_refresh_teams_mv"();



CREATE OR REPLACE TRIGGER "refresh_teams_mv_on_season_update" AFTER UPDATE ON "public"."seasons" FOR EACH STATEMENT EXECUTE FUNCTION "public"."trigger_refresh_teams_mv"();



CREATE OR REPLACE TRIGGER "refresh_teams_mv_on_update" AFTER UPDATE ON "public"."club_category_teams" FOR EACH STATEMENT EXECUTE FUNCTION "public"."trigger_refresh_teams_mv"();



CREATE OR REPLACE TRIGGER "sync_categories_on_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."coach_category_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."sync_assigned_categories"();



CREATE OR REPLACE TRIGGER "trigger_create_member_metadata" AFTER INSERT ON "public"."members" FOR EACH ROW EXECUTE FUNCTION "public"."create_member_metadata"();



CREATE OR REPLACE TRIGGER "trigger_set_metadata_created_by" BEFORE INSERT ON "public"."match_metadata" FOR EACH ROW EXECUTE FUNCTION "public"."set_metadata_created_by"();



CREATE OR REPLACE TRIGGER "trigger_update_album_cover_photo" AFTER INSERT OR DELETE ON "public"."photos" FOR EACH ROW EXECUTE FUNCTION "public"."update_album_cover_photo"();



CREATE OR REPLACE TRIGGER "trigger_update_match_metadata_updated_at" BEFORE UPDATE ON "public"."match_metadata" FOR EACH ROW EXECUTE FUNCTION "public"."update_match_metadata_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_meeting_attendees_updated_at" BEFORE UPDATE ON "public"."meeting_attendees" FOR EACH ROW EXECUTE FUNCTION "public"."update_meeting_attendees_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_meeting_minutes_updated_at" BEFORE UPDATE ON "public"."meeting_minutes" FOR EACH ROW EXECUTE FUNCTION "public"."update_meeting_minutes_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_member_club_relationships_updated_at" BEFORE UPDATE ON "public"."member_club_relationships" FOR EACH ROW EXECUTE FUNCTION "public"."update_member_club_relationships_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_videos_updated_at" BEFORE UPDATE ON "public"."videos" FOR EACH ROW EXECUTE FUNCTION "public"."update_videos_updated_at"();



CREATE OR REPLACE TRIGGER "update_betting_bets_updated_at" BEFORE UPDATE ON "public"."betting_bets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_betting_wallets_updated_at" BEFORE UPDATE ON "public"."betting_wallets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_blog_posts_updated_at" BEFORE UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_business_partners_updated_at" BEFORE UPDATE ON "public"."business_partners" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_categories_updated_at" BEFORE UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_category_fees_timestamp" BEFORE UPDATE ON "public"."category_membership_fees" FOR EACH ROW EXECUTE FUNCTION "public"."update_membership_fee_updated_at"();



CREATE OR REPLACE TRIGGER "update_category_seasons_updated_at" BEFORE UPDATE ON "public"."category_seasons" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_club_config_updated_at" BEFORE UPDATE ON "public"."club_config" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_clubs_updated_at" BEFORE UPDATE ON "public"."clubs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_comments_updated_at" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_committees_updated_at" BEFORE UPDATE ON "public"."committees" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_external_players_updated_at" BEFORE UPDATE ON "public"."external_players" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_grants_updated_at" BEFORE UPDATE ON "public"."grants" FOR EACH ROW EXECUTE FUNCTION "public"."update_grants_updated_at"();



CREATE OR REPLACE TRIGGER "update_main_partners_updated_at" BEFORE UPDATE ON "public"."main_partners" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_matches_updated_at" BEFORE UPDATE ON "public"."matches" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_media_partners_updated_at" BEFORE UPDATE ON "public"."media_partners" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_member_attendance_updated_at" BEFORE UPDATE ON "public"."member_attendance" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_member_functions_updated_at" BEFORE UPDATE ON "public"."member_functions" FOR EACH ROW EXECUTE FUNCTION "public"."update_member_functions_updated_at"();



CREATE OR REPLACE TRIGGER "update_members_updated_at" BEFORE UPDATE ON "public"."members" FOR EACH ROW EXECUTE FUNCTION "public"."update_members_updated_at"();



CREATE OR REPLACE TRIGGER "update_page_visibility_updated_at" BEFORE UPDATE ON "public"."page_visibility" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_payments_timestamp" BEFORE UPDATE ON "public"."membership_fee_payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_membership_fee_updated_at"();



CREATE OR REPLACE TRIGGER "update_photo_albums_updated_at" BEFORE UPDATE ON "public"."photo_albums" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_photos_updated_at" BEFORE UPDATE ON "public"."photos" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_seasons_updated_at" BEFORE UPDATE ON "public"."seasons" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_sponsorship_packages_updated_at" BEFORE UPDATE ON "public"."sponsorship_packages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_standings_updated_at" BEFORE UPDATE ON "public"."standings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_todos_updated_at" BEFORE UPDATE ON "public"."todos" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tournaments_updated_at" BEFORE UPDATE ON "public"."tournaments" FOR EACH ROW EXECUTE FUNCTION "public"."update_tournaments_updated_at"();



CREATE OR REPLACE TRIGGER "update_training_sessions_updated_at" BEFORE UPDATE ON "public"."training_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "user_profiles_sync_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_profiles_on_user_profiles_change"();



ALTER TABLE ONLY "next_auth"."accounts"
    ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "next_auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "next_auth"."sessions"
    ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "next_auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."betting_bet_legs"
    ADD CONSTRAINT "betting_bet_legs_bet_id_fkey" FOREIGN KEY ("bet_id") REFERENCES "public"."betting_bets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."betting_bets"
    ADD CONSTRAINT "betting_bets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."betting_odds_history"
    ADD CONSTRAINT "betting_odds_history_odds_id_fkey" FOREIGN KEY ("odds_id") REFERENCES "public"."betting_odds"("id");



ALTER TABLE ONLY "public"."betting_transactions"
    ADD CONSTRAINT "betting_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."betting_transactions"
    ADD CONSTRAINT "betting_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."betting_wallets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."betting_wallets"
    ADD CONSTRAINT "betting_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."category_lineup_members"
    ADD CONSTRAINT "category_lineup_members_added_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."category_lineup_members"
    ADD CONSTRAINT "category_lineup_members_lineup_id_fkey" FOREIGN KEY ("lineup_id") REFERENCES "public"."category_lineups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."category_lineup_members"
    ADD CONSTRAINT "category_lineup_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."category_lineup_members"
    ADD CONSTRAINT "category_lineup_members_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."category_lineups"
    ADD CONSTRAINT "category_lineups_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."category_lineups"
    ADD CONSTRAINT "category_lineups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."category_lineups"
    ADD CONSTRAINT "category_lineups_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."category_membership_fees"
    ADD CONSTRAINT "category_membership_fees_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."category_membership_fees"
    ADD CONSTRAINT "category_membership_fees_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."category_membership_fees"
    ADD CONSTRAINT "category_membership_fees_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."category_seasons"
    ADD CONSTRAINT "category_seasons_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."category_seasons"
    ADD CONSTRAINT "category_seasons_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."club_categories"
    ADD CONSTRAINT "club_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."club_categories"
    ADD CONSTRAINT "club_categories_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."club_categories"
    ADD CONSTRAINT "club_categories_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."club_category_teams"
    ADD CONSTRAINT "club_category_teams_club_category_id_fkey" FOREIGN KEY ("club_category_id") REFERENCES "public"."club_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_cards"
    ADD CONSTRAINT "coach_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_categories"
    ADD CONSTRAINT "coach_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_categories"
    ADD CONSTRAINT "coach_categories_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."coach_categories"
    ADD CONSTRAINT "coach_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_category_assignments"
    ADD CONSTRAINT "coach_category_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."coach_category_assignments"
    ADD CONSTRAINT "coach_category_assignments_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_category_assignments"
    ADD CONSTRAINT "coach_category_assignments_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grants"
    ADD CONSTRAINT "grants_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lineup_coaches"
    ADD CONSTRAINT "lineup_coaches_lineup_id_fkey" FOREIGN KEY ("lineup_id") REFERENCES "public"."lineups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lineup_coaches"
    ADD CONSTRAINT "lineup_coaches_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lineup_players"
    ADD CONSTRAINT "lineup_players_lineup_id_fkey" FOREIGN KEY ("lineup_id") REFERENCES "public"."lineups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lineup_players"
    ADD CONSTRAINT "lineup_players_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lineups"
    ADD CONSTRAINT "lineups_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lineups"
    ADD CONSTRAINT "lineups_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."club_category_teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."match_metadata"
    ADD CONSTRAINT "match_metadata_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."match_metadata"
    ADD CONSTRAINT "match_metadata_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."match_referees"
    ADD CONSTRAINT "match_referees_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."match_referees"
    ADD CONSTRAINT "match_referees_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "public"."referees"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."match_videos"
    ADD CONSTRAINT "match_videos_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."match_videos"
    ADD CONSTRAINT "match_videos_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "public"."club_category_teams"("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "public"."club_category_teams"("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."meeting_attendees"
    ADD CONSTRAINT "meeting_attendees_meeting_minutes_id_fkey" FOREIGN KEY ("meeting_minutes_id") REFERENCES "public"."meeting_minutes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting_attendees"
    ADD CONSTRAINT "meeting_attendees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting_minutes"
    ADD CONSTRAINT "meeting_minutes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."meeting_minutes"
    ADD CONSTRAINT "meeting_minutes_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."meeting_minutes"
    ADD CONSTRAINT "meeting_minutes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."meeting_minutes"
    ADD CONSTRAINT "meeting_minutes_wrote_by_fkey" FOREIGN KEY ("wrote_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."member_attendance"
    ADD CONSTRAINT "member_attendance_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_attendance"
    ADD CONSTRAINT "member_attendance_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_attendance"
    ADD CONSTRAINT "member_attendance_training_session_id_fkey" FOREIGN KEY ("training_session_id") REFERENCES "public"."training_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_club_relationships"
    ADD CONSTRAINT "member_club_relationships_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id");



ALTER TABLE ONLY "public"."member_club_relationships"
    ADD CONSTRAINT "member_club_relationships_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."member_club_relationships"
    ADD CONSTRAINT "member_club_relationships_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id");



ALTER TABLE ONLY "public"."member_metadata"
    ADD CONSTRAINT "member_metadata_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."membership_fee_payments"
    ADD CONSTRAINT "membership_fee_payments_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."membership_fee_payments"
    ADD CONSTRAINT "membership_fee_payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."membership_fee_payments"
    ADD CONSTRAINT "membership_fee_payments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."membership_fee_payments"
    ADD CONSTRAINT "membership_fee_payments_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."photo_albums"
    ADD CONSTRAINT "photo_albums_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."photo_albums"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."point_deductions"
    ADD CONSTRAINT "point_deductions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."point_deductions"
    ADD CONSTRAINT "point_deductions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."point_deductions"
    ADD CONSTRAINT "point_deductions_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."point_deductions"
    ADD CONSTRAINT "point_deductions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."club_category_teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referees"
    ADD CONSTRAINT "referees_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."standings"
    ADD CONSTRAINT "standings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."standings"
    ADD CONSTRAINT "standings_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id");



ALTER TABLE ONLY "public"."standings"
    ADD CONSTRAINT "standings_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id");



ALTER TABLE ONLY "public"."standings"
    ADD CONSTRAINT "standings_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."club_category_teams"("id");



ALTER TABLE ONLY "public"."todos"
    ADD CONSTRAINT "todos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tournament_standings"
    ADD CONSTRAINT "tournament_standings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tournament_standings"
    ADD CONSTRAINT "tournament_standings_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."club_category_teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tournament_standings"
    ADD CONSTRAINT "tournament_standings_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tournament_standings"
    ADD CONSTRAINT "tournament_standings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tournament_teams"
    ADD CONSTRAINT "tournament_teams_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tournament_teams"
    ADD CONSTRAINT "tournament_teams_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."club_category_teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tournament_teams"
    ADD CONSTRAINT "tournament_teams_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tournament_teams"
    ADD CONSTRAINT "tournament_teams_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tournaments"
    ADD CONSTRAINT "tournaments_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tournaments"
    ADD CONSTRAINT "tournaments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tournaments"
    ADD CONSTRAINT "tournaments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tournaments"
    ADD CONSTRAINT "tournaments_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tournaments"
    ADD CONSTRAINT "tournaments_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."training_sessions"
    ADD CONSTRAINT "training_sessions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."training_sessions"
    ADD CONSTRAINT "training_sessions_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_sessions"
    ADD CONSTRAINT "training_sessions_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."role_definitions"("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."videos"
    ADD CONSTRAINT "videos_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."videos"
    ADD CONSTRAINT "videos_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."videos"
    ADD CONSTRAINT "videos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."videos"
    ADD CONSTRAINT "videos_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."videos"
    ADD CONSTRAINT "videos_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



CREATE POLICY "Admin users can manage clubs" ON "public"."clubs" USING ((("auth"."uid"() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND (("user_roles"."role")::"text" = 'admin'::"text")))))) WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND (("user_roles"."role")::"text" = 'admin'::"text"))))));



CREATE POLICY "Admins can delete grants" ON "public"."grants" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can delete teams of tournaments" ON "public"."tournament_teams" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can delete tournament standings" ON "public"."tournament_standings" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can delete tournaments" ON "public"."tournaments" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can insert grants" ON "public"."grants" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can insert teams of tournaments" ON "public"."tournament_teams" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can insert tournament standings" ON "public"."tournament_standings" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can insert tournaments" ON "public"."tournaments" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can manage all profiles" ON "public"."profiles" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles" "up"
  WHERE (("up"."user_id" = "auth"."uid"()) AND (("up"."role")::"text" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles" "up"
  WHERE (("up"."user_id" = "auth"."uid"()) AND (("up"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can manage membership fees" ON "public"."category_membership_fees" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can manage payments" ON "public"."membership_fee_payments" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can update grants" ON "public"."grants" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can update teams of tournaments" ON "public"."tournament_teams" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can update tournament standings" ON "public"."tournament_standings" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can update tournaments" ON "public"."tournaments" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can view all grants" ON "public"."grants" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can view all payments" ON "public"."membership_fee_payments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can view all profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles" "up"
  WHERE (("up"."user_id" = "auth"."uid"()) AND (("up"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can view all tournaments" ON "public"."tournaments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can view teams of tournaments" ON "public"."tournament_teams" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can view tournament standings" ON "public"."tournament_standings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Allow all authenticated users full access to comments" ON "public"."comments" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all authenticated users full access to todos" ON "public"."todos" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to create lineups" ON "public"."category_lineups" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Allow authenticated users to create training sessions" ON "public"."training_sessions" FOR INSERT TO "authenticated" WITH CHECK (("coach_id" = "auth"."uid"()));



CREATE POLICY "Allow authenticated users to delete club_categories" ON "public"."club_categories" FOR DELETE TO "authenticated" USING (true);



COMMENT ON POLICY "Allow authenticated users to delete club_categories" ON "public"."club_categories" IS 'All authenticated users can delete club-category relationships (needed for removing assignments)';



CREATE POLICY "Allow authenticated users to delete club_category_teams" ON "public"."club_category_teams" FOR DELETE TO "authenticated" USING (true);



COMMENT ON POLICY "Allow authenticated users to delete club_category_teams" ON "public"."club_category_teams" IS 'All authenticated users can delete team records (needed for team cleanup)';



CREATE POLICY "Allow authenticated users to delete member metadata" ON "public"."member_metadata" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to delete posts" ON "public"."blog_posts" FOR DELETE USING ((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text"));



COMMENT ON POLICY "Allow authenticated users to delete posts" ON "public"."blog_posts" IS 'Optimized policy using (SELECT auth.role()) to prevent re-evaluation per row';



CREATE POLICY "Allow authenticated users to insert club_categories" ON "public"."club_categories" FOR INSERT TO "authenticated" WITH CHECK (true);



COMMENT ON POLICY "Allow authenticated users to insert club_categories" ON "public"."club_categories" IS 'All authenticated users can create club-category relationships (needed for category assignment)';



CREATE POLICY "Allow authenticated users to insert club_category_teams" ON "public"."club_category_teams" FOR INSERT TO "authenticated" WITH CHECK (true);



COMMENT ON POLICY "Allow authenticated users to insert club_category_teams" ON "public"."club_category_teams" IS 'All authenticated users can create team records (needed for team generation)';



CREATE POLICY "Allow authenticated users to insert login logs" ON "public"."login_logs" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to insert member metadata" ON "public"."member_metadata" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to insert member_attendance" ON "public"."member_attendance" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to insert posts" ON "public"."blog_posts" FOR INSERT WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text"));



COMMENT ON POLICY "Allow authenticated users to insert posts" ON "public"."blog_posts" IS 'Optimized policy using (SELECT auth.role()) to prevent re-evaluation per row';



CREATE POLICY "Allow authenticated users to insert training_sessions" ON "public"."training_sessions" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to manage lineup members" ON "public"."category_lineup_members" TO "authenticated" USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Allow authenticated users to read club_categories" ON "public"."club_categories" FOR SELECT TO "authenticated" USING (true);



COMMENT ON POLICY "Allow authenticated users to read club_categories" ON "public"."club_categories" IS 'All authenticated users can read club-category relationships (public configuration)';



CREATE POLICY "Allow authenticated users to read club_category_teams" ON "public"."club_category_teams" FOR SELECT TO "authenticated" USING (true);



COMMENT ON POLICY "Allow authenticated users to read club_category_teams" ON "public"."club_category_teams" IS 'All authenticated users can read team information (public data)';



CREATE POLICY "Allow authenticated users to read lineup members" ON "public"."category_lineup_members" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read lineups" ON "public"."category_lineups" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read login logs" ON "public"."login_logs" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to read member metadata" ON "public"."member_metadata" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read member_attendance" ON "public"."member_attendance" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read members" ON "public"."members" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read posts" ON "public"."blog_posts" FOR SELECT USING ((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text"));



COMMENT ON POLICY "Allow authenticated users to read posts" ON "public"."blog_posts" IS 'Optimized policy using (SELECT auth.role()) to prevent re-evaluation per row';



CREATE POLICY "Allow authenticated users to read training sessions" ON "public"."training_sessions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read training_sessions" ON "public"."training_sessions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read user_profiles" ON "public"."user_profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read user_roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to update club_categories" ON "public"."club_categories" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



COMMENT ON POLICY "Allow authenticated users to update club_categories" ON "public"."club_categories" IS 'All authenticated users can update club-category relationships (needed for configuration changes)';



CREATE POLICY "Allow authenticated users to update club_category_teams" ON "public"."club_category_teams" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



COMMENT ON POLICY "Allow authenticated users to update club_category_teams" ON "public"."club_category_teams" IS 'All authenticated users can update team records (needed for team management)';



CREATE POLICY "Allow authenticated users to update member metadata" ON "public"."member_metadata" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to update member_attendance" ON "public"."member_attendance" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to update posts" ON "public"."blog_posts" FOR UPDATE USING ((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text"));



COMMENT ON POLICY "Allow authenticated users to update posts" ON "public"."blog_posts" IS 'Optimized policy using (SELECT auth.role()) to prevent re-evaluation per row';



CREATE POLICY "Allow authenticated users to update training_sessions" ON "public"."training_sessions" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow public read access to categories" ON "public"."categories" FOR SELECT USING (true);



COMMENT ON POLICY "Allow public read access to categories" ON "public"."categories" IS 'Allows anonymous visitors to read category data for public pages';



CREATE POLICY "Allow public read access to category_seasons" ON "public"."category_seasons" FOR SELECT USING (true);



COMMENT ON POLICY "Allow public read access to category_seasons" ON "public"."category_seasons" IS 'Allows anonymous visitors to read category-season relationships for public pages';



CREATE POLICY "Allow public read access to club_categories" ON "public"."club_categories" FOR SELECT USING (true);



COMMENT ON POLICY "Allow public read access to club_categories" ON "public"."club_categories" IS 'Allows anonymous visitors to read club-category relationships for public pages';



CREATE POLICY "Allow public read access to club_category_teams" ON "public"."club_category_teams" FOR SELECT USING (true);



COMMENT ON POLICY "Allow public read access to club_category_teams" ON "public"."club_category_teams" IS 'Allows anonymous visitors to read club-category-team relationships for public pages';



CREATE POLICY "Allow public read access to clubs" ON "public"."clubs" FOR SELECT USING (true);



COMMENT ON POLICY "Allow public read access to clubs" ON "public"."clubs" IS 'Allows anonymous visitors to read club information for public pages';



CREATE POLICY "Allow public read access to matches" ON "public"."matches" FOR SELECT USING (true);



COMMENT ON POLICY "Allow public read access to matches" ON "public"."matches" IS 'Allows anonymous visitors to read match data for public pages';



CREATE POLICY "Allow public read access to seasons" ON "public"."seasons" FOR SELECT USING (true);



COMMENT ON POLICY "Allow public read access to seasons" ON "public"."seasons" IS 'Allows anonymous visitors to read season data for public pages';



CREATE POLICY "Allow public read access to standings" ON "public"."standings" FOR SELECT USING (true);



COMMENT ON POLICY "Allow public read access to standings" ON "public"."standings" IS 'Allows anonymous visitors to read standings data for public pages';



CREATE POLICY "Allow users to delete their own lineups" ON "public"."category_lineups" FOR DELETE TO "authenticated" USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Allow users to delete their own training sessions" ON "public"."training_sessions" FOR DELETE TO "authenticated" USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "Allow users to update their own lineups" ON "public"."category_lineups" FOR UPDATE TO "authenticated" USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Allow users to update their own training sessions" ON "public"."training_sessions" FOR UPDATE TO "authenticated" USING (("coach_id" = "auth"."uid"())) WITH CHECK (("coach_id" = "auth"."uid"()));



CREATE POLICY "Anyone can view published coach cards" ON "public"."coach_cards" FOR SELECT TO "authenticated", "anon" USING (("cardinality"("published_categories") > 0));



CREATE POLICY "Anyone can view published tournaments" ON "public"."tournaments" FOR SELECT USING (("status" = 'published'::"text"));



CREATE POLICY "Anyone can view teams of published tournaments" ON "public"."tournament_teams" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tournaments"
  WHERE (("tournaments"."id" = "tournament_teams"."tournament_id") AND ("tournaments"."status" = 'published'::"text")))));



CREATE POLICY "Anyone can view teams of published tournaments standings" ON "public"."tournament_standings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tournaments"
  WHERE (("tournaments"."id" = "tournament_standings"."tournament_id") AND ("tournaments"."status" = 'published'::"text")))));



CREATE POLICY "Authenticated users can create albums" ON "public"."photo_albums" FOR INSERT WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text"));



COMMENT ON POLICY "Authenticated users can create albums" ON "public"."photo_albums" IS 'Optimized policy using (SELECT auth.role()) to prevent re-evaluation per row';



CREATE POLICY "Authenticated users can create photos" ON "public"."photos" FOR INSERT WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text"));



COMMENT ON POLICY "Authenticated users can create photos" ON "public"."photos" IS 'Optimized policy using (SELECT auth.role()) to prevent re-evaluation per row';



CREATE POLICY "Authenticated users can delete albums" ON "public"."photo_albums" FOR DELETE USING ((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text"));



COMMENT ON POLICY "Authenticated users can delete albums" ON "public"."photo_albums" IS 'Optimized policy using (SELECT auth.role()) to prevent re-evaluation per row';



CREATE POLICY "Authenticated users can delete meeting attendees" ON "public"."meeting_attendees" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can delete meeting minutes" ON "public"."meeting_minutes" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can delete photos" ON "public"."photos" FOR DELETE USING ((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text"));



COMMENT ON POLICY "Authenticated users can delete photos" ON "public"."photos" IS 'Optimized policy using (SELECT auth.role()) to prevent re-evaluation per row';



CREATE POLICY "Authenticated users can delete videos" ON "public"."videos" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can insert meeting attendees" ON "public"."meeting_attendees" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can insert meeting minutes" ON "public"."meeting_minutes" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can insert videos" ON "public"."videos" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can update albums" ON "public"."photo_albums" FOR UPDATE USING ((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text"));



COMMENT ON POLICY "Authenticated users can update albums" ON "public"."photo_albums" IS 'Optimized policy using (SELECT auth.role()) to prevent re-evaluation per row';



CREATE POLICY "Authenticated users can update meeting attendees" ON "public"."meeting_attendees" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can update meeting minutes" ON "public"."meeting_minutes" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can update photos" ON "public"."photos" FOR UPDATE USING ((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text"));



COMMENT ON POLICY "Authenticated users can update photos" ON "public"."photos" IS 'Optimized policy using (SELECT auth.role()) to prevent re-evaluation per row';



CREATE POLICY "Authenticated users can update videos" ON "public"."videos" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view active grants" ON "public"."grants" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ("is_active" = true)));



CREATE POLICY "Authenticated users can view all albums" ON "public"."photo_albums" FOR SELECT USING ((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text"));



COMMENT ON POLICY "Authenticated users can view all albums" ON "public"."photo_albums" IS 'Optimized policy using (SELECT auth.role()) to prevent re-evaluation per row';



CREATE POLICY "Authenticated users can view all photos" ON "public"."photos" FOR SELECT USING ((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text"));



COMMENT ON POLICY "Authenticated users can view all photos" ON "public"."photos" IS 'Optimized policy using (SELECT auth.role()) to prevent re-evaluation per row';



CREATE POLICY "Authenticated users can view meeting attendees" ON "public"."meeting_attendees" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view meeting minutes" ON "public"."meeting_minutes" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view membership fees" ON "public"."category_membership_fees" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view videos" ON "public"."videos" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Categories are deletable by authenticated users" ON "public"."categories" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Categories are insertable by authenticated users" ON "public"."categories" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Categories are updatable by authenticated users" ON "public"."categories" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Categories are viewable by everyone" ON "public"."categories" FOR SELECT USING (true);



CREATE POLICY "Coaches can manage payments for their categories" ON "public"."membership_fee_payments" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = ANY (ARRAY['coach'::"text", 'head_coach'::"text"])) AND ("membership_fee_payments"."category_id" = ANY ("user_profiles"."assigned_categories")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = ANY (ARRAY['coach'::"text", 'head_coach'::"text"])) AND ("membership_fee_payments"."category_id" = ANY ("user_profiles"."assigned_categories"))))));



CREATE POLICY "Coaches can view clubs" ON "public"."clubs" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND (("user_roles"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('coach'::character varying)::"text", ('head_coach'::character varying)::"text"])))))));



CREATE POLICY "Coaches can view payments for their categories" ON "public"."membership_fee_payments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = ANY (ARRAY[('coach'::character varying)::"text", ('head_coach'::character varying)::"text"])) AND ("membership_fee_payments"."category_id" = ANY ("user_profiles"."assigned_categories"))))));



CREATE POLICY "Committees are deletable by authenticated users" ON "public"."committees" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Committees are insertable by authenticated users" ON "public"."committees" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Committees are updatable by authenticated users" ON "public"."committees" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Committees are viewable by everyone" ON "public"."committees" FOR SELECT USING (true);



CREATE POLICY "Enable delete for authenticated users only" ON "public"."business_partners" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete for authenticated users only" ON "public"."main_partners" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete for authenticated users only" ON "public"."media_partners" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete for authenticated users only" ON "public"."sponsorship_packages" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."business_partners" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."club_config" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."main_partners" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."media_partners" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."page_visibility" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."sponsorship_packages" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for all users" ON "public"."business_partners" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."club_config" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."main_partners" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."media_partners" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."page_visibility" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."role_definitions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."sponsorship_packages" FOR SELECT USING (true);



CREATE POLICY "Enable update for authenticated users only" ON "public"."business_partners" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for authenticated users only" ON "public"."club_config" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for authenticated users only" ON "public"."main_partners" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for authenticated users only" ON "public"."media_partners" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for authenticated users only" ON "public"."page_visibility" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for authenticated users only" ON "public"."sponsorship_packages" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "External players are deletable by authenticated users" ON "public"."external_players" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "External players are insertable by authenticated users" ON "public"."external_players" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "External players are updatable by authenticated users" ON "public"."external_players" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "External players are viewable by everyone" ON "public"."external_players" FOR SELECT USING (true);



CREATE POLICY "Lineup coaches are deletable by authenticated users" ON "public"."lineup_coaches" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Lineup coaches are insertable by authenticated users" ON "public"."lineup_coaches" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Lineup coaches are updatable by authenticated users" ON "public"."lineup_coaches" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Lineup coaches are viewable by everyone" ON "public"."lineup_coaches" FOR SELECT USING (true);



CREATE POLICY "Lineup players are deletable by authenticated users" ON "public"."lineup_players" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Lineup players are insertable by authenticated users" ON "public"."lineup_players" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Lineup players are updatable by authenticated users" ON "public"."lineup_players" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Lineup players are viewable by everyone" ON "public"."lineup_players" FOR SELECT USING (true);



CREATE POLICY "Lineups are deletable by authenticated users" ON "public"."lineups" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Lineups are insertable by authenticated users" ON "public"."lineups" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Lineups are updatable by authenticated users" ON "public"."lineups" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Lineups are viewable by everyone" ON "public"."lineups" FOR SELECT USING (true);



CREATE POLICY "Matches are deletable by authenticated users" ON "public"."matches" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Matches are insertable by authenticated users" ON "public"."matches" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Matches are updatable by authenticated users" ON "public"."matches" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Member functions are deletable by authenticated users" ON "public"."member_functions" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Member functions are insertable by authenticated users" ON "public"."member_functions" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Member functions are updatable by authenticated users" ON "public"."member_functions" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Member functions are viewable by everyone" ON "public"."member_functions" FOR SELECT USING (true);



CREATE POLICY "Members are deletable by authenticated users" ON "public"."members" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Members are insertable by authenticated users" ON "public"."members" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Members are updatable by authenticated users" ON "public"."members" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Photos from public albums are viewable by everyone" ON "public"."photos" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."photo_albums"
  WHERE (("photo_albums"."id" = "photos"."album_id") AND ("photo_albums"."is_public" = true)))));



CREATE POLICY "Profiles delete own" ON "public"."user_profiles" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Profiles insert own" ON "public"."user_profiles" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Profiles select own" ON "public"."user_profiles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Profiles update own" ON "public"."user_profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Public albums are viewable by everyone" ON "public"."photo_albums" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Public can read published posts" ON "public"."blog_posts" FOR SELECT USING ((("status")::"text" = 'published'::"text"));



CREATE POLICY "Public can view clubs" ON "public"."clubs" FOR SELECT USING (true);



CREATE POLICY "Seasons are deletable by authenticated users" ON "public"."seasons" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Seasons are insertable by authenticated users" ON "public"."seasons" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Seasons are updatable by authenticated users" ON "public"."seasons" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Seasons are viewable by everyone" ON "public"."seasons" FOR SELECT USING (true);



CREATE POLICY "Service role bypass" ON "public"."profiles" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage clubs" ON "public"."clubs" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access profiles" ON "public"."user_profiles" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access roles" ON "public"."user_roles" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Standings are deletable by authenticated users" ON "public"."standings" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Standings are insertable by authenticated users" ON "public"."standings" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Standings are updatable by authenticated users" ON "public"."standings" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "System can insert wallets" ON "public"."betting_wallets" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can create own coach card" ON "public"."coach_cards" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete member club relationships" ON "public"."member_club_relationships" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can delete own coach card" ON "public"."coach_cards" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert legs for their own bets" ON "public"."betting_bet_legs" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."betting_bets"
  WHERE (("betting_bets"."id" = "betting_bet_legs"."bet_id") AND ("betting_bets"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert member club relationships" ON "public"."member_club_relationships" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can insert their own bets" ON "public"."betting_bets" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own transactions" ON "public"."betting_transactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update legs of their own bets" ON "public"."betting_bet_legs" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."betting_bets"
  WHERE (("betting_bets"."id" = "betting_bet_legs"."bet_id") AND ("betting_bets"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update member club relationships" ON "public"."member_club_relationships" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can update own coach card" ON "public"."coach_cards" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own bets" ON "public"."betting_bets" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own wallet" ON "public"."betting_wallets" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view legs of their own bets" ON "public"."betting_bet_legs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."betting_bets"
  WHERE (("betting_bets"."id" = "betting_bet_legs"."bet_id") AND ("betting_bets"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view member club relationships" ON "public"."member_club_relationships" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can view own coach card" ON "public"."coach_cards" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own bets" ON "public"."betting_bets" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own coach categories" ON "public"."coach_categories" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own roles" ON "public"."user_roles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own transactions" ON "public"."betting_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own wallet" ON "public"."betting_wallets" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."betting_bet_legs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."betting_bets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."betting_odds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."betting_odds_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "betting_odds_history_select_policy" ON "public"."betting_odds_history" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "betting_odds_select_policy" ON "public"."betting_odds" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."betting_team_elo_ratings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "betting_team_elo_ratings_select_policy" ON "public"."betting_team_elo_ratings" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."betting_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."betting_wallets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blog_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_partners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."category_lineup_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."category_lineups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."category_membership_fees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."category_seasons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."club_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."club_category_teams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."club_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clubs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_cards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_category_assignments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "coach_category_assignments_select_policy" ON "public"."coach_category_assignments" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."committees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delete" ON "public"."match_metadata" FOR DELETE USING (((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))) OR (EXISTS ( SELECT 1
   FROM ("public"."matches" "m"
     JOIN "public"."user_profiles" "up" ON (("up"."user_id" = "auth"."uid"())))
  WHERE (("m"."id" = "match_metadata"."match_id") AND ("m"."category_id" = ANY ("up"."assigned_categories")) AND (("up"."role")::"text" = ANY (ARRAY[('coach'::character varying)::"text", ('head_coach'::character varying)::"text"])))))));



ALTER TABLE "public"."external_players" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."grants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert" ON "public"."match_metadata" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))) OR (EXISTS ( SELECT 1
   FROM ("public"."matches" "m"
     JOIN "public"."user_profiles" "up" ON (("up"."user_id" = "auth"."uid"())))
  WHERE (("m"."id" = "match_metadata"."match_id") AND ("m"."category_id" = ANY ("up"."assigned_categories")) AND (("up"."role")::"text" = ANY (ARRAY[('coach'::character varying)::"text", ('head_coach'::character varying)::"text"])))))));



ALTER TABLE "public"."lineup_coaches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lineup_players" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lineups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."login_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."main_partners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."match_metadata" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."match_referees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "match_referees_delete_policy" ON "public"."match_referees" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "match_referees_insert_policy" ON "public"."match_referees" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "match_referees_select_policy" ON "public"."match_referees" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "match_referees_update_policy" ON "public"."match_referees" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))));



ALTER TABLE "public"."match_videos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "match_videos_select_policy" ON "public"."match_videos" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."matches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."media_partners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meeting_attendees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meeting_minutes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."member_attendance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."member_club_relationships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."member_functions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."member_metadata" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."membership_fee_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."migration_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."page_visibility" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."photo_albums" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."point_deductions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "point_deductions_delete_policy" ON "public"."point_deductions" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "point_deductions_insert_policy" ON "public"."point_deductions" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "point_deductions_select_policy" ON "public"."point_deductions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "point_deductions_update_policy" ON "public"."point_deductions" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "read" ON "public"."match_metadata" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))) OR (EXISTS ( SELECT 1
   FROM ("public"."matches" "m"
     JOIN "public"."user_profiles" "up" ON (("up"."user_id" = "auth"."uid"())))
  WHERE (("m"."id" = "match_metadata"."match_id") AND ("m"."category_id" = ANY ("up"."assigned_categories")) AND (("up"."role")::"text" = ANY (ARRAY[('coach'::character varying)::"text", ('head_coach'::character varying)::"text"])))))));



ALTER TABLE "public"."referees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "referees_delete_policy" ON "public"."referees" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "referees_insert_policy" ON "public"."referees" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "referees_select_policy" ON "public"."referees" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "referees_update_policy" ON "public"."referees" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))));



ALTER TABLE "public"."role_definitions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "role_definitions_insert_policy" ON "public"."role_definitions" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"("auth"."uid"()));



ALTER TABLE "public"."seasons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sponsorship_packages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."standings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."todos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tournament_standings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tournament_teams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tournaments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."training_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update" ON "public"."match_metadata" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND (("user_profiles"."role")::"text" = 'admin'::"text")))) OR (EXISTS ( SELECT 1
   FROM ("public"."matches" "m"
     JOIN "public"."user_profiles" "up" ON (("up"."user_id" = "auth"."uid"())))
  WHERE (("m"."id" = "match_metadata"."match_id") AND ("m"."category_id" = ANY ("up"."assigned_categories")) AND (("up"."role")::"text" = ANY (ARRAY[('coach'::character varying)::"text", ('head_coach'::character varying)::"text"])))))));



ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_profiles_delete_policy" ON "public"."user_profiles" FOR DELETE TO "authenticated" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "user_profiles_insert_policy" ON "public"."user_profiles" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "user_profiles_select_policy" ON "public"."user_profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "user_profiles_update_policy" ON "public"."user_profiles" FOR UPDATE TO "authenticated" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));



ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_roles_insert_policy" ON "public"."user_roles" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "user_roles_update_policy" ON "public"."user_roles" FOR UPDATE TO "authenticated" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));



ALTER TABLE "public"."videos" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "next_auth" TO "service_role";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

































































































































































































































GRANT ALL ON FUNCTION "public"."create_member_metadata"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_member_metadata"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_member_metadata"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."ensure_user_profile"("input_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."ensure_user_profile"("input_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_user_profile"("input_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_user_profile"("input_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."exec_sql"("sql" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."exec_sql"("sql" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."exec_sql"("sql" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."exec_sql"("sql" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."force_refresh_attendance_stats"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."force_refresh_attendance_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."force_refresh_attendance_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."force_refresh_attendance_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_registration_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_registration_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_registration_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_teams_for_club_category"("p_club_category_id" "uuid", "p_max_teams" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."generate_teams_for_club_category"("p_club_category_id" "uuid", "p_max_teams" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_teams_for_club_category"("p_club_category_id" "uuid", "p_max_teams" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_active_members_for_club"("club_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_members_for_club"("club_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_members_for_club"("club_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_attendance_records"("p_session_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_attendance_records"("p_session_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_attendance_records"("p_session_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_attendance_summary"("p_category" character varying, "p_season_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_attendance_summary"("p_category" character varying, "p_season_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_attendance_summary"("p_category" character varying, "p_season_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_attendance_summary"("p_category_id" "uuid", "p_season_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_attendance_summary"("p_category_id" "uuid", "p_season_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_attendance_summary"("p_category_id" "uuid", "p_season_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_attendance_trends"("p_category_id" "uuid", "p_season_id" "uuid", "p_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_attendance_trends"("p_category_id" "uuid", "p_season_id" "uuid", "p_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_attendance_trends"("p_category_id" "uuid", "p_season_id" "uuid", "p_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_club_for_member"("member_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_club_for_member"("member_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_club_for_member"("member_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_summary"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_match_stats"("p_category_id" "uuid", "p_season_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_match_stats"("p_category_id" "uuid", "p_season_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_match_stats"("p_category_id" "uuid", "p_season_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_member_attendance_stats"("p_category_id" "uuid", "p_season_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_member_attendance_stats"("p_category_id" "uuid", "p_season_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_member_attendance_stats"("p_category_id" "uuid", "p_season_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_member_club_history"("member_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_member_club_history"("member_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_member_club_history"("member_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_member_fee_status_for_year"("p_member_id" "uuid", "p_calendar_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_member_fee_status_for_year"("p_member_id" "uuid", "p_calendar_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_member_fee_status_for_year"("p_member_id" "uuid", "p_calendar_year" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_external_player"("p_registration_number" character varying, "p_name" character varying, "p_surname" character varying, "p_position" character varying, "p_club_id" "uuid", "p_club_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_external_player"("p_registration_number" character varying, "p_name" character varying, "p_surname" character varying, "p_position" character varying, "p_club_id" "uuid", "p_club_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_external_player"("p_registration_number" character varying, "p_name" character varying, "p_surname" character varying, "p_position" character varying, "p_club_id" "uuid", "p_club_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_sponsorship_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_sponsorship_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_sponsorship_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_teams_for_category_season"("p_category_id" "uuid", "p_season_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_teams_for_category_season"("p_category_id" "uuid", "p_season_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_teams_for_category_season"("p_category_id" "uuid", "p_season_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_training_session_stats"("p_category_id" "uuid", "p_season_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_training_session_stats"("p_category_id" "uuid", "p_season_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_training_session_stats"("p_category_id" "uuid", "p_season_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_training_sessions"("p_category_id" "uuid", "p_season_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_training_sessions"("p_category_id" "uuid", "p_season_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_training_sessions"("p_category_id" "uuid", "p_season_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_coach_categories"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_coach_categories"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_coach_categories"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_profile_safe"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_profile_safe"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_profile_safe"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_roles"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_roles"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_roles"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_summary_by_id"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_summary_by_id"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_summary_by_id"("target_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_admin_access"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."has_admin_access"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_admin_access"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("user_uuid" "uuid", "role_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("user_uuid" "uuid", "role_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("user_uuid" "uuid", "role_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."immutable_unaccent"("input" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."immutable_unaccent"("input" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."immutable_unaccent"("input" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."initialize_user_wallet"() TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_user_wallet"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_user_wallet"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."listen_for_attendance_stats_refresh"() TO "anon";
GRANT ALL ON FUNCTION "public"."listen_for_attendance_stats_refresh"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."listen_for_attendance_stats_refresh"() TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_profiles_additional_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."populate_profiles_additional_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_profiles_additional_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_profiles_from_auth_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."populate_profiles_from_auth_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_profiles_from_auth_users"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."refresh_attendance_statistics_summary"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."refresh_attendance_statistics_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_attendance_statistics_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_attendance_statistics_summary"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_betting_leaderboard"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_betting_leaderboard"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_betting_leaderboard"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_match_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_match_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_match_stats"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."refresh_materialized_view"("view_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."refresh_materialized_view"("view_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_materialized_view"("view_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_materialized_view"("view_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_profiles_mv"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_profiles_mv"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_profiles_mv"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_profiles_mv_with_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_profiles_mv_with_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_profiles_mv_with_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_teams_materialized_view"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_teams_materialized_view"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_teams_materialized_view"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."scheduled_refresh_attendance_stats"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."scheduled_refresh_attendance_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."scheduled_refresh_attendance_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."scheduled_refresh_attendance_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_external_players"("search_term" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."search_external_players"("search_term" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_external_players"("search_term" character varying) TO "service_role";



GRANT ALL ON TABLE "public"."members" TO "anon";
GRANT ALL ON TABLE "public"."members" TO "authenticated";
GRANT ALL ON TABLE "public"."members" TO "service_role";



GRANT ALL ON FUNCTION "public"."search_text"("member" "public"."members") TO "anon";
GRANT ALL ON FUNCTION "public"."search_text"("member" "public"."members") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_text"("member" "public"."members") TO "service_role";



GRANT ALL ON TABLE "public"."clubs" TO "anon";
GRANT ALL ON TABLE "public"."clubs" TO "authenticated";
GRANT ALL ON TABLE "public"."clubs" TO "service_role";



GRANT ALL ON TABLE "public"."member_club_relationships" TO "anon";
GRANT ALL ON TABLE "public"."member_club_relationships" TO "authenticated";
GRANT ALL ON TABLE "public"."member_club_relationships" TO "service_role";



GRANT ALL ON TABLE "public"."members_external" TO "anon";
GRANT ALL ON TABLE "public"."members_external" TO "authenticated";
GRANT ALL ON TABLE "public"."members_external" TO "service_role";



GRANT ALL ON FUNCTION "public"."search_text"("member" "public"."members_external") TO "anon";
GRANT ALL ON FUNCTION "public"."search_text"("member" "public"."members_external") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_text"("member" "public"."members_external") TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."category_membership_fees" TO "anon";
GRANT ALL ON TABLE "public"."category_membership_fees" TO "authenticated";
GRANT ALL ON TABLE "public"."category_membership_fees" TO "service_role";



GRANT ALL ON TABLE "public"."membership_fee_payments" TO "anon";
GRANT ALL ON TABLE "public"."membership_fee_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."membership_fee_payments" TO "service_role";



GRANT ALL ON TABLE "public"."member_fee_status" TO "anon";
GRANT ALL ON TABLE "public"."member_fee_status" TO "authenticated";
GRANT ALL ON TABLE "public"."member_fee_status" TO "service_role";



GRANT ALL ON TABLE "public"."members_internal" TO "anon";
GRANT ALL ON TABLE "public"."members_internal" TO "authenticated";
GRANT ALL ON TABLE "public"."members_internal" TO "service_role";



GRANT ALL ON FUNCTION "public"."search_text"("member" "public"."members_internal") TO "anon";
GRANT ALL ON FUNCTION "public"."search_text"("member" "public"."members_internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_text"("member" "public"."members_internal") TO "service_role";



GRANT ALL ON TABLE "public"."members_on_loan" TO "anon";
GRANT ALL ON TABLE "public"."members_on_loan" TO "authenticated";
GRANT ALL ON TABLE "public"."members_on_loan" TO "service_role";



GRANT ALL ON FUNCTION "public"."search_text"("member" "public"."members_on_loan") TO "anon";
GRANT ALL ON FUNCTION "public"."search_text"("member" "public"."members_on_loan") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_text"("member" "public"."members_on_loan") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_album_cover_photo"("album_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."set_album_cover_photo"("album_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_album_cover_photo"("album_uuid" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_members_audit_fields"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_members_audit_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_members_audit_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_members_audit_fields"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_metadata_created_by"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_metadata_created_by"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_metadata_created_by"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_metadata_created_by"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_all_profiles_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_all_profiles_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_all_profiles_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_assigned_categories"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_assigned_categories"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_assigned_categories"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_profiles_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_profiles_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_profiles_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_profiles_from_user_profiles"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_profiles_from_user_profiles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_profiles_from_user_profiles"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."sync_profiles_on_user_profiles_change"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_profiles_on_user_profiles_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_profiles_on_user_profiles_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_profiles_on_user_profiles_change"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."trigger_refresh_attendance_stats"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."trigger_refresh_attendance_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_refresh_attendance_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_refresh_attendance_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_refresh_match_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_refresh_match_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_refresh_match_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_refresh_teams_mv"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_refresh_teams_mv"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_refresh_teams_mv"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_album_cover_photo"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_album_cover_photo"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_album_cover_photo"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_grants_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_grants_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_grants_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_match_metadata_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_match_metadata_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_match_metadata_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_meeting_attendees_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_meeting_attendees_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_meeting_attendees_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_meeting_minutes_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_meeting_minutes_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_meeting_minutes_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_member_club_relationships_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_member_club_relationships_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_member_club_relationships_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_member_functions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_member_functions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_member_functions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_members_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_members_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_members_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_membership_fee_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_membership_fee_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_membership_fee_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_point_deductions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_point_deductions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_point_deductions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_referees_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_referees_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_referees_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_tournaments_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_tournaments_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_tournaments_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_videos_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_videos_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_videos_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_profile"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_profile"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_profile"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_team_manager_requirement"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_team_manager_requirement"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_team_manager_requirement"() TO "service_role";
























GRANT ALL ON TABLE "next_auth"."accounts" TO "service_role";



GRANT ALL ON TABLE "next_auth"."sessions" TO "service_role";



GRANT ALL ON TABLE "next_auth"."users" TO "service_role";



GRANT ALL ON TABLE "next_auth"."verification_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."training_sessions" TO "anon";
GRANT ALL ON TABLE "public"."training_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."training_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_statistics_summary" TO "anon";
GRANT ALL ON TABLE "public"."attendance_statistics_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_statistics_summary" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_stats_trigger_info" TO "anon";
GRANT ALL ON TABLE "public"."attendance_stats_trigger_info" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_stats_trigger_info" TO "service_role";



GRANT ALL ON TABLE "public"."betting_bet_legs" TO "anon";
GRANT ALL ON TABLE "public"."betting_bet_legs" TO "authenticated";
GRANT ALL ON TABLE "public"."betting_bet_legs" TO "service_role";



GRANT ALL ON TABLE "public"."betting_bets" TO "anon";
GRANT ALL ON TABLE "public"."betting_bets" TO "authenticated";
GRANT ALL ON TABLE "public"."betting_bets" TO "service_role";



GRANT ALL ON TABLE "public"."betting_wallets" TO "anon";
GRANT ALL ON TABLE "public"."betting_wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."betting_wallets" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."betting_leaderboard" TO "anon";
GRANT ALL ON TABLE "public"."betting_leaderboard" TO "authenticated";
GRANT ALL ON TABLE "public"."betting_leaderboard" TO "service_role";



GRANT ALL ON TABLE "public"."betting_odds" TO "anon";
GRANT ALL ON TABLE "public"."betting_odds" TO "authenticated";
GRANT ALL ON TABLE "public"."betting_odds" TO "service_role";



GRANT ALL ON TABLE "public"."betting_odds_history" TO "anon";
GRANT ALL ON TABLE "public"."betting_odds_history" TO "authenticated";
GRANT ALL ON TABLE "public"."betting_odds_history" TO "service_role";



GRANT ALL ON TABLE "public"."betting_team_elo_ratings" TO "anon";
GRANT ALL ON TABLE "public"."betting_team_elo_ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."betting_team_elo_ratings" TO "service_role";



GRANT ALL ON TABLE "public"."betting_transactions" TO "anon";
GRANT ALL ON TABLE "public"."betting_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."betting_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."blog_posts" TO "anon";
GRANT ALL ON TABLE "public"."blog_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_posts" TO "service_role";



GRANT ALL ON TABLE "public"."business_partners" TO "anon";
GRANT ALL ON TABLE "public"."business_partners" TO "authenticated";
GRANT ALL ON TABLE "public"."business_partners" TO "service_role";



GRANT ALL ON TABLE "public"."category_lineup_members" TO "anon";
GRANT ALL ON TABLE "public"."category_lineup_members" TO "authenticated";
GRANT ALL ON TABLE "public"."category_lineup_members" TO "service_role";



GRANT ALL ON TABLE "public"."category_lineups" TO "anon";
GRANT ALL ON TABLE "public"."category_lineups" TO "authenticated";
GRANT ALL ON TABLE "public"."category_lineups" TO "service_role";



GRANT ALL ON TABLE "public"."category_seasons" TO "anon";
GRANT ALL ON TABLE "public"."category_seasons" TO "authenticated";
GRANT ALL ON TABLE "public"."category_seasons" TO "service_role";



GRANT ALL ON TABLE "public"."club_categories" TO "anon";
GRANT ALL ON TABLE "public"."club_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."club_categories" TO "service_role";



GRANT ALL ON TABLE "public"."club_category_teams" TO "anon";
GRANT ALL ON TABLE "public"."club_category_teams" TO "authenticated";
GRANT ALL ON TABLE "public"."club_category_teams" TO "service_role";



GRANT ALL ON TABLE "public"."club_category_details" TO "anon";
GRANT ALL ON TABLE "public"."club_category_details" TO "authenticated";
GRANT ALL ON TABLE "public"."club_category_details" TO "service_role";



GRANT ALL ON TABLE "public"."club_config" TO "anon";
GRANT ALL ON TABLE "public"."club_config" TO "authenticated";
GRANT ALL ON TABLE "public"."club_config" TO "service_role";



GRANT ALL ON TABLE "public"."club_overview" TO "anon";
GRANT ALL ON TABLE "public"."club_overview" TO "authenticated";
GRANT ALL ON TABLE "public"."club_overview" TO "service_role";



GRANT ALL ON TABLE "public"."coach_cards" TO "anon";
GRANT ALL ON TABLE "public"."coach_cards" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_cards" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."user_profiles" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."coach_cards_with_categories" TO "anon";
GRANT ALL ON TABLE "public"."coach_cards_with_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_cards_with_categories" TO "service_role";



GRANT ALL ON TABLE "public"."coach_categories" TO "anon";
GRANT ALL ON TABLE "public"."coach_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_categories" TO "service_role";



GRANT ALL ON TABLE "public"."coach_category_assignments" TO "anon";
GRANT ALL ON TABLE "public"."coach_category_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_category_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."committees" TO "anon";
GRANT ALL ON TABLE "public"."committees" TO "authenticated";
GRANT ALL ON TABLE "public"."committees" TO "service_role";



GRANT ALL ON TABLE "public"."external_players" TO "anon";
GRANT ALL ON TABLE "public"."external_players" TO "authenticated";
GRANT ALL ON TABLE "public"."external_players" TO "service_role";



GRANT ALL ON TABLE "public"."grants" TO "anon";
GRANT ALL ON TABLE "public"."grants" TO "authenticated";
GRANT ALL ON TABLE "public"."grants" TO "service_role";



GRANT ALL ON TABLE "public"."lineup_coaches" TO "anon";
GRANT ALL ON TABLE "public"."lineup_coaches" TO "authenticated";
GRANT ALL ON TABLE "public"."lineup_coaches" TO "service_role";



GRANT ALL ON TABLE "public"."lineup_players" TO "anon";
GRANT ALL ON TABLE "public"."lineup_players" TO "authenticated";
GRANT ALL ON TABLE "public"."lineup_players" TO "service_role";



GRANT ALL ON TABLE "public"."lineups" TO "anon";
GRANT ALL ON TABLE "public"."lineups" TO "authenticated";
GRANT ALL ON TABLE "public"."lineups" TO "service_role";



GRANT ALL ON TABLE "public"."login_logs" TO "anon";
GRANT ALL ON TABLE "public"."login_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."login_logs" TO "service_role";



GRANT ALL ON TABLE "public"."main_partners" TO "anon";
GRANT ALL ON TABLE "public"."main_partners" TO "authenticated";
GRANT ALL ON TABLE "public"."main_partners" TO "service_role";



GRANT ALL ON TABLE "public"."match_metadata" TO "anon";
GRANT ALL ON TABLE "public"."match_metadata" TO "authenticated";
GRANT ALL ON TABLE "public"."match_metadata" TO "service_role";



GRANT ALL ON TABLE "public"."match_referees" TO "anon";
GRANT ALL ON TABLE "public"."match_referees" TO "authenticated";
GRANT ALL ON TABLE "public"."match_referees" TO "service_role";



GRANT ALL ON TABLE "public"."matches" TO "anon";
GRANT ALL ON TABLE "public"."matches" TO "authenticated";
GRANT ALL ON TABLE "public"."matches" TO "service_role";



GRANT ALL ON TABLE "public"."match_stats" TO "anon";
GRANT ALL ON TABLE "public"."match_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."match_stats" TO "service_role";



GRANT ALL ON TABLE "public"."match_videos" TO "anon";
GRANT ALL ON TABLE "public"."match_videos" TO "authenticated";
GRANT ALL ON TABLE "public"."match_videos" TO "service_role";



GRANT ALL ON TABLE "public"."matches_with_teams_optimized" TO "anon";
GRANT ALL ON TABLE "public"."matches_with_teams_optimized" TO "authenticated";
GRANT ALL ON TABLE "public"."matches_with_teams_optimized" TO "service_role";



GRANT ALL ON TABLE "public"."media_partners" TO "anon";
GRANT ALL ON TABLE "public"."media_partners" TO "authenticated";
GRANT ALL ON TABLE "public"."media_partners" TO "service_role";



GRANT ALL ON TABLE "public"."meeting_attendees" TO "anon";
GRANT ALL ON TABLE "public"."meeting_attendees" TO "authenticated";
GRANT ALL ON TABLE "public"."meeting_attendees" TO "service_role";



GRANT ALL ON TABLE "public"."meeting_minutes" TO "anon";
GRANT ALL ON TABLE "public"."meeting_minutes" TO "authenticated";
GRANT ALL ON TABLE "public"."meeting_minutes" TO "service_role";



GRANT ALL ON TABLE "public"."member_attendance" TO "anon";
GRANT ALL ON TABLE "public"."member_attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."member_attendance" TO "service_role";



GRANT ALL ON TABLE "public"."member_functions" TO "anon";
GRANT ALL ON TABLE "public"."member_functions" TO "authenticated";
GRANT ALL ON TABLE "public"."member_functions" TO "service_role";



GRANT ALL ON TABLE "public"."member_metadata" TO "anon";
GRANT ALL ON TABLE "public"."member_metadata" TO "authenticated";
GRANT ALL ON TABLE "public"."member_metadata" TO "service_role";



GRANT ALL ON TABLE "public"."members_with_metadata" TO "anon";
GRANT ALL ON TABLE "public"."members_with_metadata" TO "authenticated";
GRANT ALL ON TABLE "public"."members_with_metadata" TO "service_role";



GRANT ALL ON TABLE "public"."members_with_payment_status" TO "anon";
GRANT ALL ON TABLE "public"."members_with_payment_status" TO "authenticated";
GRANT ALL ON TABLE "public"."members_with_payment_status" TO "service_role";



GRANT ALL ON TABLE "public"."migration_log" TO "anon";
GRANT ALL ON TABLE "public"."migration_log" TO "authenticated";
GRANT ALL ON TABLE "public"."migration_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."migration_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."migration_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."migration_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."seasons" TO "anon";
GRANT ALL ON TABLE "public"."seasons" TO "authenticated";
GRANT ALL ON TABLE "public"."seasons" TO "service_role";



GRANT ALL ON TABLE "public"."own_club_matches" TO "anon";
GRANT ALL ON TABLE "public"."own_club_matches" TO "authenticated";
GRANT ALL ON TABLE "public"."own_club_matches" TO "service_role";



GRANT ALL ON TABLE "public"."page_visibility" TO "anon";
GRANT ALL ON TABLE "public"."page_visibility" TO "authenticated";
GRANT ALL ON TABLE "public"."page_visibility" TO "service_role";



GRANT ALL ON TABLE "public"."photo_albums" TO "anon";
GRANT ALL ON TABLE "public"."photo_albums" TO "authenticated";
GRANT ALL ON TABLE "public"."photo_albums" TO "service_role";



GRANT ALL ON TABLE "public"."photos" TO "anon";
GRANT ALL ON TABLE "public"."photos" TO "authenticated";
GRANT ALL ON TABLE "public"."photos" TO "service_role";



GRANT ALL ON TABLE "public"."point_deductions" TO "anon";
GRANT ALL ON TABLE "public"."point_deductions" TO "authenticated";
GRANT ALL ON TABLE "public"."point_deductions" TO "service_role";



GRANT ALL ON TABLE "public"."referees" TO "anon";
GRANT ALL ON TABLE "public"."referees" TO "authenticated";
GRANT ALL ON TABLE "public"."referees" TO "service_role";



GRANT ALL ON TABLE "public"."role_definitions" TO "anon";
GRANT ALL ON TABLE "public"."role_definitions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_definitions" TO "service_role";



GRANT ALL ON TABLE "public"."sponsorship_packages" TO "anon";
GRANT ALL ON TABLE "public"."sponsorship_packages" TO "authenticated";
GRANT ALL ON TABLE "public"."sponsorship_packages" TO "service_role";



GRANT ALL ON TABLE "public"."standings" TO "anon";
GRANT ALL ON TABLE "public"."standings" TO "authenticated";
GRANT ALL ON TABLE "public"."standings" TO "service_role";



GRANT ALL ON TABLE "public"."team_details" TO "anon";
GRANT ALL ON TABLE "public"."team_details" TO "authenticated";
GRANT ALL ON TABLE "public"."team_details" TO "service_role";



GRANT ALL ON TABLE "public"."team_suffix_helper" TO "anon";
GRANT ALL ON TABLE "public"."team_suffix_helper" TO "authenticated";
GRANT ALL ON TABLE "public"."team_suffix_helper" TO "service_role";



GRANT ALL ON TABLE "public"."teams_with_details" TO "anon";
GRANT ALL ON TABLE "public"."teams_with_details" TO "authenticated";
GRANT ALL ON TABLE "public"."teams_with_details" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON TABLE "public"."todos" TO "anon";
GRANT ALL ON TABLE "public"."todos" TO "authenticated";
GRANT ALL ON TABLE "public"."todos" TO "service_role";



GRANT ALL ON TABLE "public"."tournament_standings" TO "anon";
GRANT ALL ON TABLE "public"."tournament_standings" TO "authenticated";
GRANT ALL ON TABLE "public"."tournament_standings" TO "service_role";



GRANT ALL ON TABLE "public"."tournament_teams" TO "anon";
GRANT ALL ON TABLE "public"."tournament_teams" TO "authenticated";
GRANT ALL ON TABLE "public"."tournament_teams" TO "service_role";



GRANT ALL ON TABLE "public"."tournaments" TO "anon";
GRANT ALL ON TABLE "public"."tournaments" TO "authenticated";
GRANT ALL ON TABLE "public"."tournaments" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."videos" TO "anon";
GRANT ALL ON TABLE "public"."videos" TO "authenticated";
GRANT ALL ON TABLE "public"."videos" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";































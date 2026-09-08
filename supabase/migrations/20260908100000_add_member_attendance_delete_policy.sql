-- =====================================================
-- Migration: Allow authenticated users to delete member_attendance
-- Date: 2026-09-08
-- Description: member_attendance carries RLS policies for INSERT, SELECT and
--              UPDATE — all of them `TO authenticated` with an unconditional
--              predicate — but none for DELETE. With RLS enabled and no
--              matching policy, a DELETE from a signed-in session matches zero
--              rows and returns no error, so the caller cannot tell a denied
--              delete from a delete that had nothing to remove.
--              `useAttendance.deleteAttendance` has been silently no-op'ing on
--              that ever since, and the new "remove a member from the lineup
--              and from the attendance sheets" action cannot work without it.
--              This adds the missing DELETE policy in the same shape as the
--              three that already exist. It does not widen who may act: the
--              real check (coach assigned to the category, or admin) lives in
--              /api/attendance/sync, which is the only caller.
-- Dependencies: member_attendance
-- =====================================================
--
-- MEASURED BEFORE WRITING, against production:
--   member_attendance                4167 rows
--   policies on member_attendance    3 (insert / select / update), 0 for delete
--   season 2026/2027                 157 training sessions across 4 categories
--   lineup vs. attendance drift      Dorostenky 1 member missing from 26 of 27
--                                    sessions; Dorostenci 4 missing from all 18
--
-- WHY NOT A NARROWER PREDICATE:
--   The other three policies on this table are USING (true) TO authenticated.
--   A DELETE policy that alone consulted user_profiles.assigned_categories
--   would be the only row-level check on the table and would still leave
--   INSERT and UPDATE wide open — it would read as protection without being
--   any. Tightening all four together is a separate piece of work; this
--   migration closes the functional gap without pretending to close a
--   security one.

-- =====================================================
-- 1. DELETE policy
-- =====================================================

DROP POLICY IF EXISTS "Allow authenticated users to delete member_attendance" ON public.member_attendance;

CREATE POLICY "Allow authenticated users to delete member_attendance"
  ON public.member_attendance FOR DELETE
  TO authenticated
  USING (true);

COMMENT ON TABLE public.member_attendance IS
  'Member attendance records for training sessions. RLS grants full CRUD to authenticated; authorization by category is enforced in the API layer (/api/attendance/*).';

-- =====================================================
-- 2. Verification
-- =====================================================
-- SELECT cmd, polname FROM pg_policies
--   JOIN pg_policy ON polname = policyname
--   WHERE tablename = 'member_attendance';
-- Expect four rows: SELECT, INSERT, UPDATE, DELETE.

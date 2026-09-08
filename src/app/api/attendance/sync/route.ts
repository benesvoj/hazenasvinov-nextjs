import {NextRequest} from 'next/server';

import type {SupabaseClient} from '@supabase/supabase-js';

import {errorResponse, successResponse, withAuth} from '@/utils/supabase/apiHelpers';
import {hasCategoryAccess, isAdmin} from '@/utils/supabase/coachAuth';

import {AttendanceStatuses} from '@/enums';
import {
  AttendanceSyncScope,
  describeAttendanceSync,
  selectSessionsForScope,
  SyncAttendanceRow,
  SyncSession,
} from '@/features/coach/lineups/helpers/describeAttendanceSync';
import {DB_TABLE as memberAttendanceTable} from '@/queries/memberAttendance';
import {DB_TABLE as trainingSessionTable} from '@/queries/trainingSessions';
import {isEmpty} from '@/utils';

/**
 * Reconciles a category lineup with the attendance sheets of its season.
 *
 * Attendance rows are created once, when a training session is created, from
 * whoever is on the lineup at that moment (see /api/training-sessions/bulk).
 * Nothing revisits them afterwards, so a player added to the lineup mid-season
 * is missing from every sheet created before, and one removed keeps appearing
 * on sessions that have not happened yet.
 *
 * GET     reports the gap per member.
 * POST    creates the missing rows.
 * DELETE  removes a member's rows.
 *
 * All three take the same category/season pair and the same scope vocabulary,
 * so the dialog and the write cannot disagree about which sessions are in play.
 */

/** Body shared by both write verbs. */
interface SyncWriteBody {
  categoryId?: string;
  seasonId?: string;
  memberIds?: string[];
  scope?: AttendanceSyncScope;
  status?: AttendanceStatuses;
}

const VALID_SCOPES = Object.values(AttendanceSyncScope);
const VALID_STATUSES = Object.values(AttendanceStatuses);

/**
 * Admins may touch any category; a coach only the ones assigned to them.
 * Returns an error response when access is denied, `null` when it is granted.
 */
async function assertCategoryAccess(supabase: SupabaseClient, userId: string, categoryId: string) {
  if (await isAdmin(supabase, userId)) return null;
  if (await hasCategoryAccess(supabase, userId, categoryId)) return null;

  return errorResponse('Forbidden', 403);
}

/** Every training session of the category and season, oldest first. */
async function fetchSessions(
  supabase: SupabaseClient,
  categoryId: string,
  seasonId: string
): Promise<SyncSession[]> {
  const {data, error} = await supabase
    .from(trainingSessionTable)
    .select('id, status, session_date')
    .eq('category_id', categoryId)
    .eq('season_id', seasonId)
    .order('session_date');

  if (error) throw error;

  return (data ?? []) as SyncSession[];
}

/**
 * Attendance rows for the given sessions.
 *
 * Chunked because `.in()` builds the id list into the URL and a category can
 * hold well over a hundred sessions in a season.
 */
async function fetchAttendance(
  supabase: SupabaseClient,
  sessionIds: string[]
): Promise<SyncAttendanceRow[]> {
  if (isEmpty(sessionIds)) return [];

  const CHUNK = 100;
  const rows: SyncAttendanceRow[] = [];

  for (let i = 0; i < sessionIds.length; i += CHUNK) {
    const {data, error} = await supabase
      .from(memberAttendanceTable)
      .select('member_id, training_session_id')
      .in('training_session_id', sessionIds.slice(i, i + CHUNK));

    if (error) throw error;

    rows.push(...((data ?? []) as SyncAttendanceRow[]));
  }

  return rows;
}

/**
 * GET /api/attendance/sync?categoryId=&seasonId=&memberIds=a,b,c
 *
 * `memberIds` is the lineup, already filtered to active members by the caller —
 * the route reports on exactly the members it is given rather than deciding for
 * itself which lineup is authoritative.
 */
export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const {searchParams} = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const seasonId = searchParams.get('seasonId');
    const memberIds = (searchParams.get('memberIds') ?? '').split(',').filter(Boolean);

    if (!categoryId || !seasonId) {
      return errorResponse('categoryId and seasonId are required', 400);
    }

    const denied = await assertCategoryAccess(supabase, user.id, categoryId);
    if (denied) return denied;

    const sessions = await fetchSessions(supabase, categoryId, seasonId);
    const attendance = await fetchAttendance(
      supabase,
      sessions.map((session) => session.id)
    );

    return successResponse(describeAttendanceSync({memberIds, sessions, attendance}));
  });
}

/**
 * POST /api/attendance/sync
 * `{categoryId, seasonId, memberIds, scope, status}`
 *
 * Creates the rows the given members are missing. Existing rows are left
 * exactly as they are: `ignoreDuplicates` on the (member_id,
 * training_session_id) unique key means a coach can run this repeatedly
 * without overwriting attendance somebody has already recorded.
 */
export async function POST(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const body: SyncWriteBody = await request.json();
    const {categoryId, seasonId, memberIds = [], scope, status} = body;

    if (!categoryId || !seasonId) {
      return errorResponse('categoryId and seasonId are required', 400);
    }
    if (isEmpty(memberIds)) {
      return errorResponse('memberIds must not be empty', 400);
    }
    if (!scope || !VALID_SCOPES.includes(scope)) {
      return errorResponse(`scope must be one of ${VALID_SCOPES.join(', ')}`, 400);
    }
    if (!status || !VALID_STATUSES.includes(status)) {
      return errorResponse(`status must be one of ${VALID_STATUSES.join(', ')}`, 400);
    }

    const denied = await assertCategoryAccess(supabase, user.id, categoryId);
    if (denied) return denied;

    const sessions = selectSessionsForScope(
      await fetchSessions(supabase, categoryId, seasonId),
      scope
    );

    if (isEmpty(sessions)) {
      return successResponse({created: 0, sessions: 0});
    }

    const timestamp = new Date().toISOString();
    const records = sessions.flatMap((session) =>
      memberIds.map((memberId) => ({
        member_id: memberId,
        training_session_id: session.id,
        attendance_status: status,
        recorded_by: user.id,
        recorded_at: timestamp,
      }))
    );

    const {data, error} = await supabase
      .from(memberAttendanceTable)
      .upsert(records, {onConflict: 'member_id,training_session_id', ignoreDuplicates: true})
      .select('id');

    if (error) throw error;

    return successResponse({created: data?.length ?? 0, sessions: sessions.length}, 201);
  });
}

/**
 * DELETE /api/attendance/sync
 * `{categoryId, seasonId, memberIds, scope}`
 *
 * Removes the members' attendance rows from the sessions in scope. Destructive
 * and unrecoverable — the UI states the count, including how many of those
 * sessions have already taken place, before it offers the button.
 */
export async function DELETE(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const body: SyncWriteBody = await request.json();
    const {categoryId, seasonId, memberIds = [], scope} = body;

    if (!categoryId || !seasonId) {
      return errorResponse('categoryId and seasonId are required', 400);
    }
    if (isEmpty(memberIds)) {
      return errorResponse('memberIds must not be empty', 400);
    }
    if (!scope || !VALID_SCOPES.includes(scope)) {
      return errorResponse(`scope must be one of ${VALID_SCOPES.join(', ')}`, 400);
    }

    const denied = await assertCategoryAccess(supabase, user.id, categoryId);
    if (denied) return denied;

    const sessions = selectSessionsForScope(
      await fetchSessions(supabase, categoryId, seasonId),
      scope
    );

    if (isEmpty(sessions)) {
      return successResponse({deleted: 0, sessions: 0});
    }

    // Same chunking reason as the read: the session ids travel in the URL.
    const CHUNK = 100;
    const sessionIds = sessions.map((session) => session.id);
    let deleted = 0;

    for (let i = 0; i < sessionIds.length; i += CHUNK) {
      const {data, error} = await supabase
        .from(memberAttendanceTable)
        .delete()
        .in('member_id', memberIds)
        .in('training_session_id', sessionIds.slice(i, i + CHUNK))
        .select('id');

      if (error) throw error;

      deleted += data?.length ?? 0;
    }

    return successResponse({deleted, sessions: sessions.length});
  });
}

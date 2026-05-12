import {NextRequest} from 'next/server';

import {errorResponse, successResponse, withAuth} from '@/utils/supabase/apiHelpers';
import {hasCategoryAccess, isAdmin} from '@/utils/supabase/coachAuth';

import {AttendanceStatuses} from '@/enums';

export async function POST(
  request: NextRequest,
  {params}: {params: Promise<{trainingId: string}>}
) {
  const {trainingId} = await params;

  return withAuth(async (user, supabase) => {
    const body = await request.json();
    const memberIds: string[] = body.memberIds ?? [];
    const status: AttendanceStatuses = body.status;
    const notes: string | undefined = body.notes;

    if (!status) {
      return errorResponse('status is required', 400);
    }

    if (memberIds.length === 0) {
      return errorResponse('memberIds must not be empty', 400);
    }

    const {data: session, error: sessionError} = await supabase
      .from('training_sessions')
      .select('id, category_id')
      .eq('id', trainingId)
      .single();

    if (sessionError || !session) {
      return errorResponse('Training session not found', 404);
    }

    const adminUser = await isAdmin(supabase, user.id);
    if (!adminUser) {
      const allowed = await hasCategoryAccess(supabase, user.id, session.category_id);
      if (!allowed) return errorResponse('Forbidden', 403);
    }

    const timestamp = new Date().toISOString();

    const upsertRecords = memberIds.map((memberId) => ({
      member_id: memberId,
      training_session_id: trainingId,
      attendance_status: status,
      notes: notes ?? null,
      recorded_by: user.id,
      recorded_at: timestamp,
      updated_at: timestamp,
    }));

    const {data, error} = await supabase
      .from('member_attendance')
      .upsert(upsertRecords, {onConflict: 'member_id,training_session_id'})
      .select();

    if (error) throw error;

    return successResponse({updated: data?.length ?? 0});
  });
}

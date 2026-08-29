import {NextRequest} from 'next/server';

import {errorResponse, successResponse, withAuth} from '@/utils/supabase/apiHelpers';
import {hasCategoryAccess, isAdmin} from '@/utils/supabase/coachAuth';

export interface MemberHistoryEntry {
  memberId: string;
  sessions: Array<{
    sessionId: string;
    sessionDate: string;
    status: 'present' | 'absent' | 'late' | 'excused' | null;
  }>;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const categoryId = searchParams.get('categoryId');
  const seasonId = searchParams.get('seasonId');
  const limit = parseInt(searchParams.get('limit') ?? '5');

  if (!categoryId || !seasonId) {
    return errorResponse('categoryId and seasonId are required', 400);
  }

  return withAuth(async (user, supabase) => {
    const adminUser = await isAdmin(supabase, user.id);
    if (!adminUser) {
      const allowed = await hasCategoryAccess(supabase, user.id, categoryId);
      if (!allowed) return errorResponse('Forbidden', 403);
    }

    // Fetch last N completed sessions for this category/season
    const {data: sessions, error: sessionsError} = await supabase
      .from('training_sessions')
      .select('id, session_date')
      .eq('category_id', categoryId)
      .eq('season_id', seasonId)
      .eq('status', 'done')
      .order('session_date', {ascending: false})
      .limit(limit);

    if (sessionsError) throw sessionsError;

    if (!sessions || sessions.length === 0) {
      return successResponse([]);
    }

    const sessionIds = sessions.map((s) => s.id);

    const {data: records, error: recordsError} = await supabase
      .from('member_attendance')
      .select('member_id, training_session_id, attendance_status')
      .in('training_session_id', sessionIds);

    if (recordsError) throw recordsError;

    // Group records by memberId
    const byMember = new Map<string, Map<string, 'present' | 'absent' | 'late' | 'excused'>>();

    for (const record of records ?? []) {
      if (!byMember.has(record.member_id)) {
        byMember.set(record.member_id, new Map());
      }
      byMember.get(record.member_id)!.set(record.training_session_id, record.attendance_status);
    }

    const result: MemberHistoryEntry[] = Array.from(byMember.entries()).map(
      ([memberId, sessionMap]) => ({
        memberId,
        sessions: sessions.map((s) => ({
          sessionId: s.id,
          sessionDate: s.session_date,
          status: sessionMap.get(s.id) ?? null,
        })),
      })
    );

    return successResponse(result);
  });
}

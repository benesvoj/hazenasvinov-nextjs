import {NextRequest} from 'next/server';

import {errorResponse, successResponse, withAuth} from '@/utils/supabase/apiHelpers';

import {AttendanceStatuses} from '@/enums';
import {DB_TABLE as memberAttendanceTable} from '@/queries/memberAttendance';
import {DB_TABLE as trainingSessionTable} from '@/queries/trainingSessions';
import {TrainingSessionInsert} from '@/types';
import {hasItems, isEmpty} from '@/utils';

export async function POST(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const body = await request.json();
    const sessions: TrainingSessionInsert[] = body.sessions;
    const memberIds: string[] = body.memberIds ?? [];

    if (isEmpty(sessions)) {
      return errorResponse('No training sessions provided', 400);
    }

    const timestamp = new Date().toISOString();
    const sessionsWithMeta = sessions.map((session) => ({
      ...session,
      created_at: timestamp,
    }));

    const {data: createdSessions, error: sessionsError} = await supabase
      .from(trainingSessionTable)
      .insert(sessionsWithMeta)
      .select();

    if (sessionsError) throw sessionsError;
    if (isEmpty(createdSessions)) {
      return errorResponse('Failed to create training sessions', 500);
    }

    let attendanceCreated = 0;

    if (hasItems(memberIds)) {
      const attendanceRecords = createdSessions.flatMap((session) =>
        memberIds.map((memberId) => ({
          member_id: memberId,
          attendance_status: AttendanceStatuses.PRESENT,
          training_session_id: session.id,
          recorded_by: user.id,
          recorded_at: timestamp,
        }))
      );

      const {data: attendanceData, error: attendanceError} = await supabase
        .from(memberAttendanceTable)
        .insert(attendanceRecords)
        .select();

      if (attendanceError) {
        console.error('Error creating attendance records:', attendanceError);
      } else {
        attendanceCreated = attendanceData?.length ?? 0;
      }
    }

    return successResponse(
      {
        sessionsCreated: createdSessions.length,
        attendanceCreated,
      },
      201
    );
  });
}

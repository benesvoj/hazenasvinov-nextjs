import {useState, useEffect, useCallback} from 'react';
import {createClient} from '@/utils/supabase/client';
import {
  TrainingSession,
  MemberAttendance,
  AttendanceRecord,
  RawAttendanceRecord,
  AttendanceSummary,
  TrainingSessionFormData,
  AttendanceFilters,
  AttendanceStats,
} from '@/types/attendance';
import {useUser} from '@/contexts/UserContext';
import showToast, {ToastOptions} from '@/components/Toast';

export function useAttendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {user, hasRole} = useUser();
  const supabase = createClient();

  // Fetch training sessions for a specific category and season
  const fetchTrainingSessions = useCallback(
    async (categoryId: string, seasonId: string) => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Use direct query until RPC functions are updated
        const {data, error} = await supabase
          .from('training_sessions')
          .select('*')
          .eq('category_id', categoryId)
          .eq('season_id', seasonId)
          .order('session_date', {ascending: false})
          .order('session_time', {ascending: false});

        if (error) {
          throw error;
        }

        setTrainingSessions(data || []);
      } catch (err) {
        console.error('Error fetching training sessions:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch training sessions');
      } finally {
        setLoading(false);
      }
    },
    [user?.id, supabase]
  );

  // Fetch attendance records for a training session
  const fetchAttendanceRecords = useCallback(
    async (trainingSessionId: string) => {
      try {
        setLoading(true);
        setError(null);

        const {data, error} = await supabase
          .from('member_attendance')
          .select(
            `
          id,
          member_id,
          training_session_id,
          attendance_status,
          notes,
          recorded_by,
          recorded_at,
          created_at,
          updated_at,
          members!inner (
            id,
            name,
            surname,
            category_id
          ),
          training_sessions!inner (
            id,
            title,
            session_date,
            session_time,
            category_id
          )
        `
          )
          .eq('training_session_id', trainingSessionId)
          .order('recorded_at', {ascending: false});

        if (error) {
          throw error;
        }

        const records: AttendanceRecord[] = (data || []).map((record: RawAttendanceRecord) => ({
          id: record.id,
          member: {
            id: record.members.id,
            name: record.members.name,
            surname: record.members.surname,
            category_id: record.members.category_id,
          },
          training_session: {
            id: record.training_sessions.id,
            title: record.training_sessions.title,
            session_date: record.training_sessions.session_date,
            session_time: record.training_sessions.session_time,
            category_id: record.training_sessions.category_id,
          },
          attendance_status: record.attendance_status,
          notes: record.notes,
          recorded_by: record.recorded_by,
          recorded_at: record.recorded_at,
        }));

        setAttendanceRecords(records);
      } catch (err) {
        console.error('Error fetching attendance records:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch attendance records');
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // Fetch attendance summary for a category and season
  const fetchAttendanceSummary = useCallback(
    async (categoryId: string, seasonId: string) => {
      try {
        setLoading(true);
        setError(null);

        // Use direct query until RPC functions are updated
        const {data: members, error: membersError} = await supabase
          .from('members')
          .select('id, name, surname')
          .eq('category_id', categoryId);

        if (membersError) {
          throw membersError;
        }

        // Create basic summary with zero attendance
        const basicSummary = members.map((member: {id: string; name: string; surname: string}) => ({
          member_id: member.id,
          member_name: member.name,
          member_surname: member.surname,
          total_sessions: 0,
          present_count: 0,
          absent_count: 0,
          late_count: 0,
          excused_count: 0,
          attendance_percentage: 0,
        }));

        setAttendanceSummary(basicSummary);
        return basicSummary;
      } catch (err) {
        console.error('Error fetching attendance summary:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch attendance summary');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // Create a new training session
  const createTrainingSession = useCallback(
    async (sessionData: TrainingSessionFormData) => {
      if (!user?.id) throw new Error('User not authenticated');

      try {
        setError(null);

        // Check user profile and role
        const {data: userProfile, error: profileError} = await supabase
          .from('user_profiles')
          .select('role, assigned_categories')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error('🔍 Debug: Profile error:', profileError);
        }

        // Prepare data with only non-empty optional fields
        const insertData = {
          title: sessionData.title,
          session_date: sessionData.session_date,
          category_id: sessionData.category_id,
          season_id: sessionData.season_id,
          coach_id: user.id,
          ...(sessionData.description && {description: sessionData.description}),
          ...(sessionData.session_time && {session_time: sessionData.session_time}),
          ...(sessionData.location && {location: sessionData.location}),
        };

        const {data, error} = await supabase
          .from('training_sessions')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error('Database error:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          throw error;
        }

        // Refresh training sessions
        await fetchTrainingSessions(sessionData.category_id, sessionData.season_id);

        return data;
      } catch (err) {
        console.error('Error creating training session:', err);
        setError(err instanceof Error ? err.message : 'Failed to create training session');
        throw err;
      }
    },
    [user?.id, supabase, fetchTrainingSessions]
  );

  // Update a training session
  const updateTrainingSession = useCallback(
    async (id: string, sessionData: Partial<TrainingSessionFormData>) => {
      try {
        setError(null);

        // Prepare data with only non-empty optional fields
        const updateData: any = {};
        if (sessionData.title) updateData.title = sessionData.title;
        if (sessionData.session_date) updateData.session_date = sessionData.session_date;
        if (sessionData.category_id) updateData.category_id = sessionData.category_id;
        if (sessionData.season_id) updateData.season_id = sessionData.season_id;
        if (sessionData.description !== undefined) updateData.description = sessionData.description;
        if (sessionData.session_time !== undefined)
          updateData.session_time = sessionData.session_time;
        if (sessionData.location !== undefined) updateData.location = sessionData.location;

        const {data, error} = await supabase
          .from('training_sessions')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Database error:', error);
          throw error;
        }

        // Refresh training sessions if category or season changed
        if (sessionData.category_id && sessionData.season_id) {
          await fetchTrainingSessions(sessionData.category_id, sessionData.season_id);
        }

        return data;
      } catch (err) {
        console.error('Error updating training session:', err);
        setError(err instanceof Error ? err.message : 'Failed to update training session');
        throw err;
      }
    },
    [supabase, fetchTrainingSessions]
  );

  // Delete a training session
  const deleteTrainingSession = useCallback(
    async (id: string) => {
      try {
        setError(null);

        const {error} = await supabase.from('training_sessions').delete().eq('id', id);

        if (error) throw error;

        // Remove from local state
        setTrainingSessions((prev) => prev.filter((session) => session.id !== id));
      } catch (err) {
        console.error('Error deleting training session:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete training session');
        throw err;
      }
    },
    [supabase]
  );

  // Create attendance records for all lineup members
  const createAttendanceForLineupMembers = useCallback(
    async (
      trainingSessionId: string,
      memberIds: string[],
      defaultStatus: 'present' | 'absent' | 'late' | 'excused' = 'present'
    ) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (memberIds.length === 0) return [];

      try {
        setError(null);

        // Prepare attendance data for all members
        const attendanceData = memberIds.map((memberId) => ({
          member_id: memberId,
          training_session_id: trainingSessionId,
          attendance_status: defaultStatus,
          recorded_by: user.id,
          recorded_at: new Date().toISOString(),
        }));

        const {data, error} = await supabase
          .from('member_attendance')
          .insert(attendanceData)
          .select();

        if (error) {
          throw error;
        }
        return data || [];
      } catch (err) {
        showToast.danger(
          'Error in createAttendanceForLineupMembers:',
          err as Partial<ToastOptions>
        );
        throw err;
      }
    },
    [supabase, user?.id]
  );

  // Record member attendance
  const recordAttendance = useCallback(
    async (
      memberId: string,
      trainingSessionId: string,
      attendanceStatus: 'present' | 'absent' | 'late' | 'excused',
      notes?: string
    ) => {
      if (!user?.id) throw new Error('User not authenticated');

      try {
        setError(null);

        // Check user profile
        const {data: userProfile, error: profileError} = await supabase
          .from('user_profiles')
          .select('role, assigned_categories')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error('🔍 Debug: Profile error:', profileError);
        }

        // Check training session details
        const {data: sessionData, error: sessionError} = await supabase
          .from('training_sessions')
          .select('id, category_id, coach_id')
          .eq('id', trainingSessionId)
          .single();

        if (sessionError) {
          console.error('🔍 Debug: Session error:', sessionError);
        }

        const attendanceData = {
          member_id: memberId,
          training_session_id: trainingSessionId,
          attendance_status: attendanceStatus,
          notes,
          recorded_by: user.id,
        };

        // First, try to find existing attendance record
        const {data: existingRecord, error: findError} = await supabase
          .from('member_attendance')
          .select('id')
          .eq('member_id', memberId)
          .eq('training_session_id', trainingSessionId)
          .single();

        let data, error;

        if (findError && findError.code !== 'PGRST116') {
          // PGRST116 is "not found" error, which is expected for new records
          console.error('🔍 Debug: Error finding existing record:', findError);
          throw findError;
        }

        if (existingRecord) {
          // Update existing record
          const updateResult = await supabase
            .from('member_attendance')
            .update({
              attendance_status: attendanceStatus,
              notes,
              recorded_by: user.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingRecord.id)
            .select()
            .single();

          data = updateResult.data;
          error = updateResult.error;
        } else {
          // Insert new record
          const insertResult = await supabase
            .from('member_attendance')
            .insert(attendanceData)
            .select()
            .single();

          data = insertResult.data;
          error = insertResult.error;
        }

        if (error) {
          // Provide more user-friendly error messages
          if (error.code === '23505') {
            throw new Error(
              'Tento člen už má zaznamenanou docházku pro tento trénink. Zkuste aktualizovat stránku.'
            );
          } else if (error.code === '42501') {
            throw new Error('Nemáte oprávnění k zaznamenání docházky. Kontaktujte administrátora.');
          } else {
            throw new Error(`Chyba při zaznamenávání docházky: ${error.message}`);
          }
        }

        // Refresh attendance records
        await fetchAttendanceRecords(trainingSessionId);

        return data;
      } catch (err) {
        console.error('Error recording attendance:', err);
        setError(err instanceof Error ? err.message : 'Failed to record attendance');
        throw err;
      }
    },
    [user?.id, supabase, fetchAttendanceRecords]
  );

  // Update attendance record
  const updateAttendance = useCallback(
    async (
      attendanceId: string,
      attendanceStatus: 'present' | 'absent' | 'late' | 'excused',
      notes?: string
    ) => {
      try {
        setError(null);

        const {data, error} = await supabase
          .from('member_attendance')
          .update({
            attendance_status: attendanceStatus,
            notes,
          })
          .eq('id', attendanceId)
          .select()
          .single();

        if (error) throw error;

        // Refresh attendance records
        const record = attendanceRecords.find((r) => r.id === attendanceId);
        if (record) {
          await fetchAttendanceRecords(record.training_session.id);
        }

        return data;
      } catch (err) {
        console.error('Error updating attendance:', err);
        setError(err instanceof Error ? err.message : 'Failed to update attendance');
        throw err;
      }
    },
    [supabase, attendanceRecords, fetchAttendanceRecords]
  );

  // Delete attendance record
  const deleteAttendance = useCallback(
    async (attendanceId: string) => {
      try {
        setError(null);

        const {error} = await supabase.from('member_attendance').delete().eq('id', attendanceId);

        if (error) throw error;

        // Remove from local state
        setAttendanceRecords((prev) => prev.filter((record) => record.id !== attendanceId));
      } catch (err) {
        console.error('Error deleting attendance record:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete attendance record');
        throw err;
      }
    },
    [supabase]
  );

  // Get attendance statistics
  const getAttendanceStats = useCallback(
    async (categoryId: string, seasonId: string): Promise<AttendanceStats> => {
      try {
        const summary = await fetchAttendanceSummary(categoryId, seasonId);

        const totalMembers = summary.length;
        const totalSessions = summary.reduce(
          (sum: number, member: AttendanceSummary) => sum + member.total_sessions,
          0
        );
        const totalPresent = summary.reduce(
          (sum: number, member: AttendanceSummary) => sum + member.present_count,
          0
        );
        const totalAbsent = summary.reduce(
          (sum: number, member: AttendanceSummary) => sum + member.absent_count,
          0
        );
        const totalLate = summary.reduce(
          (sum: number, member: AttendanceSummary) => sum + member.late_count,
          0
        );
        const totalExcused = summary.reduce(
          (sum: number, member: AttendanceSummary) => sum + member.excused_count,
          0
        );

        return {
          total_members: totalMembers,
          total_sessions: totalSessions,
          average_attendance:
            totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0,
          attendance_by_status: {
            present: totalPresent,
            absent: totalAbsent,
            late: totalLate,
            excused: totalExcused,
          },
        };
      } catch (err) {
        console.error('Error getting attendance stats:', err);
        throw err;
      }
    },
    [fetchAttendanceSummary]
  );

  return {
    attendanceRecords,
    trainingSessions,
    attendanceSummary,
    loading,
    error,
    setError,
    fetchTrainingSessions,
    fetchAttendanceRecords,
    fetchAttendanceSummary,
    createTrainingSession,
    updateTrainingSession,
    deleteTrainingSession,
    recordAttendance,
    updateAttendance,
    deleteAttendance,
    getAttendanceStats,
    createAttendanceForLineupMembers,
  };
}

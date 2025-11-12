'use client';

import {useState, useCallback, useMemo} from 'react';

import {showToast} from '@/components/ui/feedback';

import {createClient} from '@/utils/supabase/client';

import {useUser} from '@/contexts/UserContext';

import {
  TrainingSession,
  TrainingSessionStatus,
  AttendanceRecord,
  RawAttendanceRecord,
  AttendanceSummary,
  TrainingSessionFormData,
  AttendanceStats,
  MemberAttendanceStats,
  TrainingSessionStats,
  AttendanceTrendData,
  CoachAnalytics,
  ToastOptions,
} from '@/types';

export function useAttendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {user, hasRole} = useUser();
  const supabase = useMemo(() => createClient(), []);

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

        // Check if session can be deleted (not done or cancelled)
        const session = trainingSessions.find((s) => s.id === id);
        if (session && (session.status === 'done' || session.status === 'cancelled')) {
          throw new Error('Nelze smazat trénink se stavem "Proveden" nebo "Zrušen"');
        }

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
    [supabase, trainingSessions]
  );

  // Update training session status
  const updateTrainingSessionStatus = useCallback(
    async (sessionId: string, status: TrainingSessionStatus, statusReason?: string) => {
      try {
        setError(null);

        const updateData: any = {
          status,
          updated_at: new Date().toISOString(),
        };

        if (status === 'cancelled' && statusReason) {
          updateData.status_reason = statusReason;
        }

        const {data, error} = await supabase
          .from('training_sessions')
          .update(updateData)
          .eq('id', sessionId)
          .select()
          .single();

        if (error) throw error;

        // Update local state
        setTrainingSessions((prev) =>
          prev.map((session) =>
            session.id === sessionId ? {...session, status, status_reason: statusReason} : session
          )
        );

        // If cancelled, set all attendance records to absent
        if (status === 'cancelled') {
          const {error: attendanceError} = await supabase
            .from('member_attendance')
            .update({
              attendance_status: 'absent',
              updated_at: new Date().toISOString(),
            })
            .eq('training_session_id', sessionId);

          if (attendanceError) {
            console.error('Error updating attendance records:', attendanceError);
            // Don't throw error here, status update was successful
          } else {
            // Refresh attendance records if this session is currently selected
            const currentSession = trainingSessions.find((s) => s.id === sessionId);
            if (currentSession) {
              await fetchAttendanceRecords(sessionId);
            }
          }
        }

        return data;
      } catch (err) {
        console.error('Error updating training session status:', err);
        setError(err instanceof Error ? err.message : 'Failed to update training session status');
        throw err;
      }
    },
    [supabase, trainingSessions, fetchAttendanceRecords]
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

  // Get detailed member attendance statistics
  const getMemberAttendanceStats = useCallback(
    async (categoryId: string, seasonId: string): Promise<MemberAttendanceStats[]> => {
      try {
        const {data: members, error: membersError} = await supabase
          .from('members')
          .select('id, name, surname')
          .eq('category_id', categoryId);

        if (membersError) throw membersError;

        const {data: sessions, error: sessionsError} = await supabase
          .from('training_sessions')
          .select('id, session_date, status')
          .eq('category_id', categoryId)
          .eq('season_id', seasonId)
          .eq('status', 'done')
          .order('session_date', {ascending: true});

        if (sessionsError) throw sessionsError;

        const memberStats: MemberAttendanceStats[] = [];

        for (const member of members || []) {
          const {data: attendance, error: attendanceError} = await supabase
            .from('member_attendance')
            .select('attendance_status, recorded_at')
            .eq('member_id', member.id)
            .in('training_session_id', sessions?.map((s: any) => s.id) || []);

          if (attendanceError) continue;

          const presentCount =
            attendance?.filter((a: any) => a.attendance_status === 'present').length || 0;
          const absentCount =
            attendance?.filter((a: any) => a.attendance_status === 'absent').length || 0;
          const lateCount =
            attendance?.filter((a: any) => a.attendance_status === 'late').length || 0;
          const excusedCount =
            attendance?.filter((a: any) => a.attendance_status === 'excused').length || 0;
          const totalSessions = sessions?.length || 0;
          const attendancePercentage =
            totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

          // Calculate trends (last 5 sessions vs previous 5)
          const sortedAttendance =
            attendance?.sort(
              (a: any, b: any) =>
                new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
            ) || [];

          const recentSessions = sortedAttendance.slice(-5);
          const previousSessions = sortedAttendance.slice(-10, -5);

          const recentPresent = recentSessions.filter(
            (a: any) => a.attendance_status === 'present'
          ).length;
          const previousPresent = previousSessions.filter(
            (a: any) => a.attendance_status === 'present'
          ).length;

          let trend: 'improving' | 'declining' | 'stable' = 'stable';
          if (recentSessions.length >= 3 && previousSessions.length >= 3) {
            const recentRate = recentPresent / recentSessions.length;
            const previousRate = previousPresent / previousSessions.length;
            if (recentRate > previousRate + 0.1) trend = 'improving';
            else if (recentRate < previousRate - 0.1) trend = 'declining';
          }

          // Calculate consecutive absences/present
          let consecutiveAbsences = 0;
          let consecutivePresent = 0;
          let currentStreak = 0;
          let currentStatus = '';

          for (let i = sortedAttendance.length - 1; i >= 0; i--) {
            const status = sortedAttendance[i].attendance_status;
            if (i === sortedAttendance.length - 1 || status === currentStatus) {
              currentStreak++;
              currentStatus = status;
            } else {
              break;
            }
          }

          if (currentStatus === 'absent') consecutiveAbsences = currentStreak;
          else if (currentStatus === 'present') consecutivePresent = currentStreak;

          const lastAttendance = sortedAttendance[sortedAttendance.length - 1];

          memberStats.push({
            member_id: member.id,
            member_name: member.name,
            member_surname: member.surname,
            total_sessions: totalSessions,
            present_count: presentCount,
            absent_count: absentCount,
            late_count: lateCount,
            excused_count: excusedCount,
            attendance_percentage: attendancePercentage,
            recent_trend: trend,
            last_attendance_date: lastAttendance?.recorded_at,
            consecutive_absences: consecutiveAbsences,
            consecutive_present: consecutivePresent,
          });
        }

        return memberStats.sort((a, b) => b.attendance_percentage - a.attendance_percentage);
      } catch (err) {
        console.error('Error getting member attendance stats:', err);
        throw err;
      }
    },
    [supabase]
  );

  // Get training session statistics
  const getTrainingSessionStats = useCallback(
    async (categoryId: string, seasonId: string): Promise<TrainingSessionStats> => {
      try {
        const {data: sessions, error: sessionsError} = await supabase
          .from('training_sessions')
          .select('id, status')
          .eq('category_id', categoryId)
          .eq('season_id', seasonId);

        if (sessionsError) throw sessionsError;

        const totalSessions = sessions?.length || 0;
        const plannedSessions = sessions?.filter((s: any) => s.status === 'planned').length || 0;
        const completedSessions = sessions?.filter((s: any) => s.status === 'done').length || 0;
        const cancelledSessions =
          sessions?.filter((s: any) => s.status === 'cancelled').length || 0;

        const completionRate =
          totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
        const cancellationRate =
          totalSessions > 0 ? Math.round((cancelledSessions / totalSessions) * 100) : 0;

        // Get attendance records for completed sessions
        const {data: attendance, error: attendanceError} = await supabase
          .from('member_attendance')
          .select('attendance_status')
          .in(
            'training_session_id',
            sessions?.filter((s: any) => s.status === 'done').map((s: any) => s.id) || []
          );

        if (attendanceError) throw attendanceError;

        const totalAttendanceRecords = attendance?.length || 0;
        const presentRecords =
          attendance?.filter((a: any) => a.attendance_status === 'present').length || 0;
        const averageAttendancePercentage =
          totalAttendanceRecords > 0
            ? Math.round((presentRecords / totalAttendanceRecords) * 100)
            : 0;

        return {
          total_sessions: totalSessions,
          planned_sessions: plannedSessions,
          completed_sessions: completedSessions,
          cancelled_sessions: cancelledSessions,
          completion_rate: completionRate,
          cancellation_rate: cancellationRate,
          average_attendance_percentage: averageAttendancePercentage,
          total_attendance_records: totalAttendanceRecords,
        };
      } catch (err) {
        console.error('Error getting training session stats:', err);
        throw err;
      }
    },
    [supabase]
  );

  // Get attendance trends over time
  const getAttendanceTrends = useCallback(
    async (
      categoryId: string,
      seasonId: string,
      days: number = 30
    ): Promise<AttendanceTrendData[]> => {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const {data: sessions, error: sessionsError} = await supabase
          .from('training_sessions')
          .select('id, session_date')
          .eq('category_id', categoryId)
          .eq('season_id', seasonId)
          .eq('status', 'done')
          .gte('session_date', startDate.toISOString().split('T')[0])
          .lte('session_date', endDate.toISOString().split('T')[0])
          .order('session_date', {ascending: true});

        if (sessionsError) throw sessionsError;

        const {data: members, error: membersError} = await supabase
          .from('members')
          .select('id')
          .eq('category_id', categoryId);

        if (membersError) throw membersError;

        const totalMembers = members?.length || 0;
        const trends: AttendanceTrendData[] = [];

        for (const session of sessions || []) {
          const {data: attendance, error: attendanceError} = await supabase
            .from('member_attendance')
            .select('attendance_status')
            .eq('training_session_id', session.id);

          if (attendanceError) continue;

          const present =
            attendance?.filter((a: any) => a.attendance_status === 'present').length || 0;
          const absent =
            attendance?.filter((a: any) => a.attendance_status === 'absent').length || 0;
          const late = attendance?.filter((a: any) => a.attendance_status === 'late').length || 0;
          const excused =
            attendance?.filter((a: any) => a.attendance_status === 'excused').length || 0;
          const attendancePercentage =
            totalMembers > 0 ? Math.round((present / totalMembers) * 100) : 0;

          trends.push({
            date: session.session_date,
            present,
            absent,
            late,
            excused,
            total_members: totalMembers,
            attendance_percentage: attendancePercentage,
          });
        }

        return trends;
      } catch (err) {
        console.error('Error getting attendance trends:', err);
        throw err;
      }
    },
    [supabase]
  );

  // Get comprehensive coach analytics
  const getCoachAnalytics = useCallback(
    async (categoryId: string, seasonId: string): Promise<CoachAnalytics> => {
      try {
        const [overallStats, memberPerformance, attendanceTrends] = await Promise.all([
          getTrainingSessionStats(categoryId, seasonId),
          getMemberAttendanceStats(categoryId, seasonId),
          getAttendanceTrends(categoryId, seasonId, 30),
        ]);

        // Generate insights
        const insights: string[] = [];
        const recommendations: string[] = [];

        // Attendance insights
        if (overallStats.average_attendance_percentage < 70) {
          insights.push('Nízká celková docházka - méně než 70%');
          recommendations.push('Zvažte změnu času tréninků nebo komunikaci s rodiči');
        }

        if (overallStats.cancellation_rate > 20) {
          insights.push('Vysoká míra zrušení tréninků - více než 20%');
          recommendations.push('Analyzujte důvody zrušení a zvažte alternativní termíny');
        }

        // Member performance insights
        const lowPerformers = memberPerformance.filter((m) => m.attendance_percentage < 60);
        if (lowPerformers.length > 0) {
          insights.push(`${lowPerformers.length} členů má docházku pod 60%`);
          recommendations.push('Kontaktujte rodiče členů s nízkou docházkou');
        }

        const highPerformers = memberPerformance.filter((m) => m.attendance_percentage > 90);
        if (highPerformers.length > 0) {
          insights.push(`${highPerformers.length} členů má docházku nad 90%`);
          recommendations.push('Oceňte členy s vynikající docházkou');
        }

        // Trend insights
        if (attendanceTrends.length >= 2) {
          const recentTrend = attendanceTrends.slice(-3);
          const olderTrend = attendanceTrends.slice(-6, -3);

          const recentAvg =
            recentTrend.reduce((sum, t) => sum + t.attendance_percentage, 0) / recentTrend.length;
          const olderAvg =
            olderTrend.reduce((sum, t) => sum + t.attendance_percentage, 0) / olderTrend.length;

          if (recentAvg > olderAvg + 10) {
            insights.push('Docházka se v poslední době zlepšuje');
          } else if (recentAvg < olderAvg - 10) {
            insights.push('Docházka se v poslední době zhoršuje');
            recommendations.push('Identifikujte příčiny poklesu docházky');
          }
        }

        return {
          overall_stats: overallStats,
          member_performance: memberPerformance,
          attendance_trends: attendanceTrends,
          monthly_breakdown: [], // TODO: Implement monthly breakdown
          category_analysis: [], // TODO: Implement category analysis
          insights,
          recommendations,
        };
      } catch (err) {
        console.error('Error getting coach analytics:', err);
        throw err;
      }
    },
    [getTrainingSessionStats, getMemberAttendanceStats, getAttendanceTrends]
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
    updateTrainingSessionStatus,
    recordAttendance,
    updateAttendance,
    deleteAttendance,
    getAttendanceStats,
    getMemberAttendanceStats,
    getTrainingSessionStats,
    getAttendanceTrends,
    getCoachAnalytics,
    createAttendanceForLineupMembers,
  };
}

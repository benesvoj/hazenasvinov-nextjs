import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  TrainingSession, 
  MemberAttendance, 
  AttendanceRecord, 
  AttendanceSummary, 
  TrainingSessionFormData,
  AttendanceFilters,
  AttendanceStats
} from '@/types/attendance';
import { useAuth } from './useAuth';
import { useUserRoles } from './useUserRoles';

export function useAttendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { getCurrentUserCategories, hasRole } = useUserRoles();
  const supabase = createClient();

  // Fetch training sessions for a specific category and season
  const fetchTrainingSessions = useCallback(async (category: string, seasonId: string) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Debug: Log the parameters being sent to RPC
      console.log('🔍 RPC Debug - Calling get_training_sessions with:', {
        p_category: category,
        p_season_id: seasonId,
        p_user_id: user.id
      });

      // First try the RPC function
      const { data, error } = await supabase
        .rpc('get_training_sessions', {
          p_category: category,
          p_season_id: seasonId,
          p_user_id: user.id
        });

      console.log('🔍 RPC Debug - RPC response:', { data, error });

      if (error) {
        console.error('RPC function error:', error);
        
        // Fallback: query training_sessions directly
        console.log('Falling back to direct query...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('training_sessions')
          .select('*')
          .eq('category', category)
          .eq('season_id', seasonId)
          .order('session_date', { ascending: false })
          .order('session_time', { ascending: false });

        console.log('🔍 Direct query result:', { fallbackData, fallbackError });

        if (fallbackError) {
          throw fallbackError;
        }

        setTrainingSessions(fallbackData || []);
      } else {
        console.log('🔍 RPC success, setting training sessions:', data);
        setTrainingSessions(data || []);
      }
    } catch (err) {
      console.error('Error fetching training sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch training sessions');
    } finally {
      setLoading(false);
    }
  }, [user?.id, supabase]);

  // Fetch attendance records for a training session
  const fetchAttendanceRecords = useCallback(async (trainingSessionId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('member_attendance')
        .select(`
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
            category
          ),
          training_sessions!inner (
            id,
            title,
            session_date,
            session_time,
            category
          )
        `)
        .eq('training_session_id', trainingSessionId)
        .order('recorded_at', { ascending: false });

      if (error) throw error;

      const records: AttendanceRecord[] = (data || []).map(record => ({
        id: record.id,
        member: {
          id: record.members.id,
          name: record.members.name,
          surname: record.members.surname,
          category: record.members.category
        },
        training_session: {
          id: record.training_sessions.id,
          title: record.training_sessions.title,
          session_date: record.training_sessions.session_date,
          session_time: record.training_sessions.session_time,
          category: record.training_sessions.category
        },
        attendance_status: record.attendance_status,
        notes: record.notes,
        recorded_by: record.recorded_by,
        recorded_at: record.recorded_at
      }));

      setAttendanceRecords(records);
    } catch (err) {
      console.error('Error fetching attendance records:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Fetch attendance summary for a category and season
  const fetchAttendanceSummary = useCallback(async (category: string, seasonId: string) => {
    try {
      setLoading(true);
      setError(null);

      // First try the RPC function
      const { data, error } = await supabase
        .rpc('get_attendance_summary', {
          p_category: category,
          p_season_id: seasonId
        });

      if (error) {
        console.error('RPC function error:', error);
        
        // Fallback: create basic summary from members
        console.log('Falling back to basic summary...');
        const { data: members, error: membersError } = await supabase
          .from('members')
          .select('id, name, surname')
          .eq('category', category);

        if (membersError) {
          throw membersError;
        }

        // Create basic summary with zero attendance
        const basicSummary = members.map(member => ({
          member_id: member.id,
          member_name: member.name,
          member_surname: member.surname,
          total_sessions: 0,
          present_count: 0,
          absent_count: 0,
          late_count: 0,
          excused_count: 0,
          attendance_percentage: 0
        }));

        setAttendanceSummary(basicSummary);
      } else {
        setAttendanceSummary(data || []);
      }
    } catch (err) {
      console.error('Error fetching attendance summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance summary');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Create a new training session
  const createTrainingSession = useCallback(async (sessionData: TrainingSessionFormData) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      setError(null);

      // Debug: Check user role and permissions
      console.log('🔍 Debug: User ID:', user.id);
      console.log('🔍 Debug: Session data:', sessionData);
      
      // Check user profile and role
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, assigned_categories')
        .eq('user_id', user.id)
        .single();
      
      console.log('🔍 Debug: User profile:', userProfile);
      if (profileError) {
        console.error('🔍 Debug: Profile error:', profileError);
      }

      // Prepare data with only non-empty optional fields
      const insertData = {
        title: sessionData.title,
        session_date: sessionData.session_date,
        category: sessionData.category,
        season_id: sessionData.season_id,
        coach_id: user.id,
        ...(sessionData.description && { description: sessionData.description }),
        ...(sessionData.session_time && { session_time: sessionData.session_time }),
        ...(sessionData.location && { location: sessionData.location })
      };

      console.log('Creating training session with data:', insertData);

      const { data, error } = await supabase
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
          code: error.code
        });
        throw error;
      }

      // Refresh training sessions
      await fetchTrainingSessions(sessionData.category, sessionData.season_id);
      
      return data;
    } catch (err) {
      console.error('Error creating training session:', err);
      setError(err instanceof Error ? err.message : 'Failed to create training session');
      throw err;
    }
  }, [user?.id, supabase, fetchTrainingSessions]);

  // Update a training session
  const updateTrainingSession = useCallback(async (id: string, sessionData: Partial<TrainingSessionFormData>) => {
    try {
      setError(null);

      // Prepare data with only non-empty optional fields
      const updateData: any = {};
      if (sessionData.title) updateData.title = sessionData.title;
      if (sessionData.session_date) updateData.session_date = sessionData.session_date;
      if (sessionData.category) updateData.category = sessionData.category;
      if (sessionData.season_id) updateData.season_id = sessionData.season_id;
      if (sessionData.description !== undefined) updateData.description = sessionData.description;
      if (sessionData.session_time !== undefined) updateData.session_time = sessionData.session_time;
      if (sessionData.location !== undefined) updateData.location = sessionData.location;

      console.log('Updating training session with data:', updateData);

      const { data, error } = await supabase
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
      if (sessionData.category && sessionData.season_id) {
        await fetchTrainingSessions(sessionData.category, sessionData.season_id);
      }

      return data;
    } catch (err) {
      console.error('Error updating training session:', err);
      setError(err instanceof Error ? err.message : 'Failed to update training session');
      throw err;
    }
  }, [supabase, fetchTrainingSessions]);

  // Delete a training session
  const deleteTrainingSession = useCallback(async (id: string) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('training_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove from local state
      setTrainingSessions(prev => prev.filter(session => session.id !== id));
    } catch (err) {
      console.error('Error deleting training session:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete training session');
      throw err;
    }
  }, [supabase]);

  // Record member attendance
  const recordAttendance = useCallback(async (
    memberId: string,
    trainingSessionId: string,
    attendanceStatus: 'present' | 'absent' | 'late' | 'excused',
    notes?: string
  ) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      setError(null);

      const { data, error } = await supabase
        .from('member_attendance')
        .upsert({
          member_id: memberId,
          training_session_id: trainingSessionId,
          attendance_status: attendanceStatus,
          notes,
          recorded_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh attendance records
      await fetchAttendanceRecords(trainingSessionId);
      
      return data;
    } catch (err) {
      console.error('Error recording attendance:', err);
      setError(err instanceof Error ? err.message : 'Failed to record attendance');
      throw err;
    }
  }, [user?.id, supabase, fetchAttendanceRecords]);

  // Update attendance record
  const updateAttendance = useCallback(async (
    attendanceId: string,
    attendanceStatus: 'present' | 'absent' | 'late' | 'excused',
    notes?: string
  ) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('member_attendance')
        .update({
          attendance_status: attendanceStatus,
          notes
        })
        .eq('id', attendanceId)
        .select()
        .single();

      if (error) throw error;

      // Refresh attendance records
      const record = attendanceRecords.find(r => r.id === attendanceId);
      if (record) {
        await fetchAttendanceRecords(record.training_session.id);
      }

      return data;
    } catch (err) {
      console.error('Error updating attendance:', err);
      setError(err instanceof Error ? err.message : 'Failed to update attendance');
      throw err;
    }
  }, [supabase, attendanceRecords, fetchAttendanceRecords]);

  // Delete attendance record
  const deleteAttendance = useCallback(async (attendanceId: string) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('member_attendance')
        .delete()
        .eq('id', attendanceId);

      if (error) throw error;

      // Remove from local state
      setAttendanceRecords(prev => prev.filter(record => record.id !== attendanceId));
    } catch (err) {
      console.error('Error deleting attendance record:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete attendance record');
      throw err;
    }
  }, [supabase]);

  // Get attendance statistics
  const getAttendanceStats = useCallback(async (category: string, seasonId: string): Promise<AttendanceStats> => {
    try {
      const summary = await fetchAttendanceSummary(category, seasonId);
      
      const totalMembers = summary.length;
      const totalSessions = summary.reduce((sum, member) => sum + member.total_sessions, 0);
      const totalPresent = summary.reduce((sum, member) => sum + member.present_count, 0);
      const totalAbsent = summary.reduce((sum, member) => sum + member.absent_count, 0);
      const totalLate = summary.reduce((sum, member) => sum + member.late_count, 0);
      const totalExcused = summary.reduce((sum, member) => sum + member.excused_count, 0);

      return {
        total_members: totalMembers,
        total_sessions: totalSessions,
        average_attendance: totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0,
        attendance_by_status: {
          present: totalPresent,
          absent: totalAbsent,
          late: totalLate,
          excused: totalExcused
        }
      };
    } catch (err) {
      console.error('Error getting attendance stats:', err);
      throw err;
    }
  }, [fetchAttendanceSummary]);

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
    getAttendanceStats
  };
}

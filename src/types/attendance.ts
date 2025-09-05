export interface TrainingSession {
  id: string;
  title: string;
  description?: string;
  session_date: string;
  session_time?: string;
  category: string;
  season_id: string;
  location?: string;
  coach_id: string;
  created_at: string;
  updated_at: string;
}

export interface MemberAttendance {
  id: string;
  member_id: string;
  training_session_id: string;
  attendance_status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  recorded_by: string;
  recorded_at: string;
  created_at: string;
  updated_at: string;
}

// Raw database record structure from Supabase query
export interface RawAttendanceRecord {
  id: string;
  member_id: string;
  training_session_id: string;
  attendance_status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  recorded_by: string;
  recorded_at: string;
  members: {
    id: string;
    name: string;
    surname: string;
    category: string;
  };
  training_sessions: {
    id: string;
    title: string;
    session_date: string;
    session_time?: string;
    category: string;
  };
}

export interface AttendanceRecord {
  id: string;
  member: {
    id: string;
    name: string;
    surname: string;
    category: string;
  };
  training_session: {
    id: string;
    title: string;
    session_date: string;
    session_time?: string;
    category: string;
  };
  attendance_status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  recorded_by: string;
  recorded_at: string;
}

export interface AttendanceSummary {
  member_id: string;
  member_name: string;
  member_surname: string;
  total_sessions: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  attendance_percentage: number;
}

export interface TrainingSessionFormData {
  title: string;
  description?: string;
  session_date: string;
  session_time?: string;
  category: string;
  season_id: string;
  location?: string;
}

export interface AttendanceFilters {
  category?: string;
  season_id?: string;
  member_id?: string;
  attendance_status?: 'present' | 'absent' | 'late' | 'excused';
  date_from?: string;
  date_to?: string;
}

export interface AttendanceStats {
  total_members: number;
  total_sessions: number;
  average_attendance: number;
  attendance_by_status: {
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
}

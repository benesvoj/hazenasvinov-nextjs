export interface MemberAttendanceStats {
  member_id: string;
  member_name: string;
  member_surname: string;
  total_sessions: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  attendance_percentage: number;
  recent_trend: 'improving' | 'declining' | 'stable';
  last_attendance_date?: string;
  consecutive_absences: number;
  consecutive_present: number;
}

export interface TrainingSessionStats {
  total_sessions: number;
  planned_sessions: number;
  completed_sessions: number;
  cancelled_sessions: number;
  completion_rate: number;
  cancellation_rate: number;
  average_attendance_percentage: number;
  total_attendance_records: number;
}

export interface AttendanceTrendData {
  date: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total_members: number;
  attendance_percentage: number;
}

export interface MonthlyStats {
  month: string;
  year: number;
  total_sessions: number;
  average_attendance: number;
  most_attended_session: string;
  least_attended_session: string;
  top_performers: string[];
  attendance_issues: string[];
}

export interface CategoryStats {
  category_id: string;
  category_name: string;
  total_members: number;
  total_sessions: number;
  average_attendance: number;
  best_performing_member: string;
  worst_performing_member: string;
  attendance_trend: AttendanceTrendData[];
}

export interface CoachAnalytics {
  overall_stats: TrainingSessionStats;
  member_performance: MemberAttendanceStats[];
  attendance_trends: AttendanceTrendData[];
  monthly_breakdown: MonthlyStats[];
  category_analysis: CategoryStats[];
  insights: string[];
  recommendations: string[];
}

export interface AttendanceFilter {
  date_from?: string;
  date_to?: string;
  category_id?: string;
  member_id?: string;
  status?: 'present' | 'absent' | 'late' | 'excused';
}

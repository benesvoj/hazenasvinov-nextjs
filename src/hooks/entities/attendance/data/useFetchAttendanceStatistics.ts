'use client';

import {useQuery, useQueryClient} from '@tanstack/react-query';

import {API_ROUTES} from '@/lib';

export interface AttendanceStatistics {
  summary: {
    completed_sessions: number;
    planned_sessions: number;
    cancelled_sessions: number;
    completion_rate: number;
    last_session_date: string;
    next_session_date: string;
  };
  memberStats: Array<{
    member_id: string;
    member_name: string;
    member_surname: string;
    present_count: number;
    absent_count: number;
    late_count: number;
    excused_count: number;
    total_sessions: number;
    attendance_percentage: number;
    last_attendance_date: string;
  }>;
  trends: Array<{
    session_id: string;
    session_date: string;
    session_title: string;
    present_count: number;
    absent_count: number;
    late_count: number;
    excused_count: number;
    total_members: number;
    attendance_percentage: number;
  }>;
  insights: Array<{
    type: 'success' | 'warning' | 'info';
    title: string;
    message: string;
    data?: any;
  }>;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    description: string;
    members?: any[];
  }>;
  metadata: {
    generated_at: string;
    query_count: number;
  };
}

export function useFetchAttendanceStatistics(
  categoryId: string,
  seasonId: string,
  days: number = 30
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['attendance-statistics', categoryId, seasonId, days],
    queryFn: async (): Promise<AttendanceStatistics> => {
      const params = new URLSearchParams({
        categoryId: categoryId!,
        seasonId: seasonId!,
        days: days.toString(),
      });

      const response = await fetch(`${API_ROUTES.attendance.statistics}?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      return response.json();
    },
    enabled: !!categoryId && !!seasonId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // cacheTime: 30 * 60 * 1000 // 30 minutes
  });

  // Invalidate cache when attendance is recorded
  const invalidateStatistics = () => {
    queryClient.invalidateQueries({
      queryKey: ['attendance-statistics', categoryId, seasonId],
    });
  };

  return {
    ...query,
    invalidateStatistics,
  };
}

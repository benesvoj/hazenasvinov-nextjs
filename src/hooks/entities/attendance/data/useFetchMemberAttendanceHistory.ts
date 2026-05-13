'use client';

import {useQuery} from '@tanstack/react-query';

import {API_ROUTES} from '@/lib/api-routes';

import type {MemberHistoryEntry} from '@/app/api/attendance/member-history/route';

export type {MemberHistoryEntry};

export function useFetchMemberAttendanceHistory(params: {
  categoryId: string | null;
  seasonId: string | null;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['attendance-member-history', params.categoryId, params.seasonId, params.limit ?? 5],
    queryFn: async (): Promise<MemberHistoryEntry[]> => {
      const searchParams = new URLSearchParams({
        categoryId: params.categoryId!,
        seasonId: params.seasonId!,
        limit: String(params.limit ?? 5),
      });
      const response = await fetch(`${API_ROUTES.attendance.memberHistory}?${searchParams}`);
      if (!response.ok) throw new Error('Failed to fetch member attendance history');
      const json = await response.json();
      const payload = json.data ?? json;
      return Array.isArray(payload) ? payload : [];
    },
    enabled: !!params.categoryId && !!params.seasonId,
    staleTime: 2 * 60 * 1000,
  });
}

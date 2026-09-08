'use client';

import {useMemo} from 'react';

import {useQuery, useQueryClient} from '@tanstack/react-query';

import {API_ROUTES} from '@/lib/api-routes';

import {
  AttendanceSyncSummary,
  MemberAttendanceSync,
} from '@/features/coach/lineups/helpers/describeAttendanceSync';

export const ATTENDANCE_SYNC_QUERY_KEY = 'attendance-sync';

/** Empty summary used while loading and whenever the query is disabled. */
const EMPTY_SUMMARY: AttendanceSyncSummary = {
  members: [],
  membersOutOfSync: 0,
  missingRecords: 0,
  totalSessions: 0,
  plannedSessions: 0,
};

interface UseFetchAttendanceSyncParams {
  categoryId: string;
  seasonId: string;
  /** Active members of the lineup being reconciled. */
  memberIds: string[];
}

/**
 * How far the attendance sheets of a category and season have drifted from the
 * given lineup.
 *
 * The member ids are part of the query key: adding or removing somebody from
 * the lineup has to change the answer, and react-query has no other way of
 * knowing that it did.
 */
export function useFetchAttendanceSync({
  categoryId,
  seasonId,
  memberIds,
}: UseFetchAttendanceSyncParams) {
  const queryClient = useQueryClient();

  // Sorted so that reordering the lineup does not look like a different query.
  const memberKey = [...memberIds].sort().join(',');

  const query = useQuery({
    queryKey: [ATTENDANCE_SYNC_QUERY_KEY, categoryId, seasonId, memberKey],
    queryFn: async (): Promise<AttendanceSyncSummary> => {
      const params = new URLSearchParams({categoryId, seasonId, memberIds: memberKey});

      const response = await fetch(`${API_ROUTES.attendance.sync}?${params}`);

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const json = await response.json();
      return (json.data ?? json) as AttendanceSyncSummary;
    },
    enabled: Boolean(categoryId) && Boolean(seasonId) && memberIds.length > 0,
    staleTime: 60 * 1000,
  });

  const summary = query.data ?? EMPTY_SUMMARY;

  /**
   * Per-member lookup, so a table row does not have to scan the array.
   *
   * Memoised on the summary, not rebuilt every render: callers key their own
   * memos off this map, and a fresh Map on every render would defeat them.
   */
  const byMemberId = useMemo(
    () =>
      new Map<string, MemberAttendanceSync>(
        summary.members.map((member) => [member.memberId, member])
      ),
    [summary]
  );

  const invalidateAttendanceSync = () =>
    queryClient.invalidateQueries({queryKey: [ATTENDANCE_SYNC_QUERY_KEY, categoryId, seasonId]});

  return {
    summary,
    byMemberId,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    invalidateAttendanceSync,
  };
}

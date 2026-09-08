'use client';

import {useCallback, useState} from 'react';

import {useQueryClient} from '@tanstack/react-query';

import {ATTENDANCE_SYNC_QUERY_KEY} from '@/hooks/entities/attendance/data/useFetchAttendanceSync';

import {showToast} from '@/components/ui/feedback';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {AttendanceStatuses} from '@/enums';
import {AttendanceSyncScope} from '@/features/coach/lineups/helpers/describeAttendanceSync';

const t = translations.lineupMembers.attendanceSync.responseMessages;

interface SyncTarget {
  categoryId: string;
  seasonId: string;
  memberIds: string[];
  scope: AttendanceSyncScope;
}

interface AddAttendanceParams extends SyncTarget {
  status: AttendanceStatuses;
}

/**
 * Writes the lineup back into the attendance sheets.
 *
 * Both operations go through /api/attendance/sync rather than the browser
 * client: the route is where the coach's access to the category is checked,
 * and it is the only place that knows which sessions a scope covers.
 *
 * After either write, both react-query caches that read attendance for this
 * category are invalidated — the sync summary and the statistics tiles.
 * Forgetting that was the bug behind #96, where the page kept showing
 * pre-change numbers until a browser reload. The per-session attendance list
 * is not react-query (createDataFetchHook is useState + useEffect) and
 * refetches when the coach opens a session.
 */
export function useSyncAttendanceWithLineup() {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const invalidateAttendance = useCallback(
    (categoryId: string, seasonId: string) => {
      queryClient.invalidateQueries({
        queryKey: [ATTENDANCE_SYNC_QUERY_KEY, categoryId, seasonId],
      });
      queryClient.invalidateQueries({
        queryKey: ['attendance-statistics', categoryId, seasonId],
      });
    },
    [queryClient]
  );

  /** Creates the missing rows. Never overwrites a record that already exists. */
  const addToAttendance = useCallback(
    async ({categoryId, seasonId, memberIds, scope, status}: AddAttendanceParams) => {
      setLoading(true);
      try {
        const response = await fetch(API_ROUTES.attendance.sync, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({categoryId, seasonId, memberIds, scope, status}),
        });

        if (!response.ok) throw new Error(await response.text());

        const json = await response.json();
        const created: number = json.data?.created ?? 0;

        invalidateAttendance(categoryId, seasonId);
        showToast.success(t.created(created));

        return created;
      } catch (err) {
        showToast.danger(`${t.createFailed}${err instanceof Error ? `: ${err.message}` : ''}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [invalidateAttendance]
  );

  /** Removes the members' rows from the sessions in scope. Destructive. */
  const removeFromAttendance = useCallback(
    async ({categoryId, seasonId, memberIds, scope}: SyncTarget) => {
      setLoading(true);
      try {
        const response = await fetch(API_ROUTES.attendance.sync, {
          method: 'DELETE',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({categoryId, seasonId, memberIds, scope}),
        });

        if (!response.ok) throw new Error(await response.text());

        const json = await response.json();
        const deleted: number = json.data?.deleted ?? 0;

        invalidateAttendance(categoryId, seasonId);
        showToast.success(t.deleted(deleted));

        return deleted;
      } catch (err) {
        showToast.danger(`${t.deleteFailed}${err instanceof Error ? `: ${err.message}` : ''}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [invalidateAttendance]
  );

  return {loading, addToAttendance, removeFromAttendance};
}

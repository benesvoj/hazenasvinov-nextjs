import {useMemo} from 'react';

import {AttendanceStatistics} from '@/hooks';
import {BaseTrainingSession} from '@/types';

export interface AttendanceStats {
  totalTrainings: number;
  averageAttendance: number;
  excusedPct: number;
  absentPct: number;
}

export function useAttendanceStats(
  sessions: BaseTrainingSession[],
  statistics: AttendanceStatistics | undefined
): AttendanceStats {
  return useMemo(() => {
    const totalTrainings = sessions.length;

    const memberStats = statistics?.memberStats;
    if (!memberStats || memberStats.length === 0) {
      return {totalTrainings, averageAttendance: 0, excusedPct: 0, absentPct: 0};
    }

    const totalPossible = memberStats.reduce((sum, m) => sum + m.total_sessions, 0);
    if (totalPossible === 0) {
      return {totalTrainings, averageAttendance: 0, excusedPct: 0, absentPct: 0};
    }

    const totalPresent = memberStats.reduce((sum, m) => sum + m.present_count, 0);
    const totalExcused = memberStats.reduce((sum, m) => sum + m.excused_count, 0);
    const totalAbsent = memberStats.reduce((sum, m) => sum + m.absent_count, 0);

    return {
      totalTrainings,
      averageAttendance: Math.round((totalPresent / totalPossible) * 100),
      excusedPct: Math.round((totalExcused / totalPossible) * 100),
      absentPct: Math.round((totalAbsent / totalPossible) * 100),
    };
  }, [sessions, statistics]);
}

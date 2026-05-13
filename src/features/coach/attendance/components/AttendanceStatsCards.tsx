'use client';

import {translations} from '@/lib/translations';

import {Grid, GridItem} from '@/components';
import {AttendanceStatistics} from '@/hooks';
import {BaseTrainingSession} from '@/types';

import {useAttendanceStats} from '../hooks/useAttendanceStats';

import {StatCard} from './AttendanceStatCard';

interface AttendanceStatsCardsProps {
  sessions: BaseTrainingSession[];
  statistics: AttendanceStatistics | undefined;
  isLoading: boolean;
}

export function AttendanceStatsCards({sessions, statistics, isLoading}: AttendanceStatsCardsProps) {
  const t = translations.attendance.labels;
  const stats = useAttendanceStats(sessions, statistics);

  if (isLoading) {
    return (
      <Grid columns={4} gap="sm" className="grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <GridItem key={i} className="h-full">
            <div className="bg-content1 rounded-xl border border-divider p-4 h-full min-h-[88px] animate-pulse" />
          </GridItem>
        ))}
      </Grid>
    );
  }

  return (
    <Grid columns={4} gap="sm" className="grid-cols-2">
      <GridItem className="h-full">
        <StatCard
          label={t.totalTrainings}
          value={stats.totalTrainings}
          subtitle={t.totalTrainingsSubtitle}
        />
      </GridItem>
      <GridItem className="h-full">
        <StatCard
          label={t.averageAttendance}
          value={`${stats.averageAttendance}%`}
          valueColor="text-success-600 dark:text-success-400"
        />
      </GridItem>
      <GridItem className="h-full">
        <StatCard
          label={t.excusedAbsences}
          value={`${stats.excusedPct}%`}
          valueColor="text-warning-600 dark:text-warning-400"
        />
      </GridItem>
      <GridItem className="h-full">
        <StatCard
          label={t.unexcusedAbsences}
          value={`${stats.absentPct}%`}
          valueColor="text-danger-600 dark:text-danger-400"
        />
      </GridItem>
    </Grid>
  );
}

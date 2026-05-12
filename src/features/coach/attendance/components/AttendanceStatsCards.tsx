'use client';

import {useMemo} from 'react';

import {translations} from '@/lib/translations';

import {Grid, GridItem} from '@/components';
import {AttendanceStatistics} from '@/hooks';
import {BaseTrainingSession} from '@/types';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  valueColor?: string;
}

function StatCard({label, value, subtitle, valueColor = 'text-foreground'}: StatCardProps) {
  return (
    <div className="bg-content1 rounded-xl border border-divider p-4 flex flex-col gap-1">
      <span className="text-[12px] text-foreground-500 font-medium uppercase tracking-wide">
        {label}
      </span>
      <span className={`text-[22px] font-[500] leading-tight ${valueColor}`}>{value}</span>
      {subtitle && <span className="text-[11px] text-foreground-400">{subtitle}</span>}
    </div>
  );
}

interface AttendanceStatsCardsProps {
  sessions: BaseTrainingSession[];
  statistics: AttendanceStatistics | undefined;
  isLoading: boolean;
}

export function AttendanceStatsCards({sessions, statistics, isLoading}: AttendanceStatsCardsProps) {
  const t = translations.attendance.labels;

  const stats = useMemo(() => {
    const totalTrainings = sessions.length;

    if (!statistics?.memberStats || statistics.memberStats.length === 0) {
      return {
        totalTrainings,
        averageAttendance: 0,
        excusedPct: 0,
        absentPct: 0,
      };
    }

    const memberStats = statistics.memberStats;
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

  if (isLoading) {
    return (
      <Grid columns={4} gap="sm">
        {[...Array(4)].map((_, i) => (
          <GridItem key={i}>
            <div className="bg-content1 rounded-xl border border-divider p-4 h-20 animate-pulse" />
          </GridItem>
        ))}
      </Grid>
    );
  }

  return (
    <Grid columns={4} gap="sm">
      <GridItem>
        <StatCard
          label={t.totalTrainings}
          value={stats.totalTrainings}
          subtitle={t.totalTrainingsSubtitle}
        />
      </GridItem>
      <GridItem>
        <StatCard
          label={t.averageAttendance}
          value={`${stats.averageAttendance}%`}
          valueColor="text-success-600 dark:text-success-400"
        />
      </GridItem>
      <GridItem>
        <StatCard
          label={t.excusedAbsences}
          value={`${stats.excusedPct}%`}
          valueColor="text-warning-600 dark:text-warning-400"
        />
      </GridItem>
      <GridItem>
        <StatCard
          label={t.unexcusedAbsences}
          value={`${stats.absentPct}%`}
          valueColor="text-danger-600 dark:text-danger-400"
        />
      </GridItem>
    </Grid>
  );
}

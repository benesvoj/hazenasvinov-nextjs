'use client';

import {useMemo, useState} from 'react';

import {Alert, Card, CardBody, CardHeader, Tab, Tabs} from '@heroui/react';

import {ArrowTrendingUpIcon, LightBulbIcon, UserGroupIcon} from '@heroicons/react/24/outline';

import {match} from 'ts-pattern';

import {translations} from '@/lib/translations/index';

import {AttendanceTrendsChart} from '@/app/coaches/attendance/components/AttendanceTrendsChart';
import {MemberPerformanceTable} from '@/app/coaches/attendance/components/MemberPerformanceTable';
import {RecommendationsPanel} from '@/app/coaches/attendance/components/RecommendationsPanel';
import {SummarySessionCard} from '@/app/coaches/attendance/components/SummarySessionCard';

import {Heading, LoadingSpinner} from '@/components';
import {useFetchAttendanceStatistics} from '@/hooks';
import {hasItems} from '@/utils';

interface Props {
  categoryId: string;
  seasonId: string;
}

/**
 * Default values for statistics data to prevent undefined access errors.
 * Used when API returns partial data or data structure is incomplete.
 */
const DEFAULT_SUMMARY = {
  completed_sessions: 0,
  planned_sessions: 0,
  completion_rate: 0,
  cancelled_sessions: 0,
} as const;

const DEFAULT_METADATA = {
  generated_at: new Date().toISOString(),
  query_count: 0,
} as const;

export default function AttendanceStatisticsLazy({categoryId, seasonId}: Props) {
  const [selectedDays, setSelectedDays] = useState(30);
  const {data, isLoading, error} = useFetchAttendanceStatistics(categoryId, seasonId, selectedDays);

  // Safely extract data with fallback defaults using useMemo for performance
  const {summary, insights, memberStats, trends, recommendations, metadata} = useMemo(() => {
    return {
      summary: data?.summary ?? DEFAULT_SUMMARY,
      insights: data?.insights ?? [],
      memberStats: data?.memberStats ?? [],
      trends: data?.trends ?? [],
      recommendations: data?.recommendations ?? [],
      metadata: data?.metadata ?? DEFAULT_METADATA,
    };
  }, [data]);

  // Check if we have meaningful data to display
  const hasData = data != null && data.summary != null;

  if (isLoading) {
    return (
      <Card>
        <CardBody className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardBody>
          <Alert
            color={'warning'}
            description={translations.attendance.errorMessage}
            title={translations.common.alerts.warning}
          />
        </CardBody>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card>
        <CardBody>
          <p className="text-gray-500 text-center py-8">{translations.attendance.noDataMessage}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummarySessionCard
          title={translations.attendance.completedSessions}
          value={summary.completed_sessions}
        />
        <SummarySessionCard
          title={translations.attendance.plannedSessions}
          value={summary.planned_sessions}
        />
        <SummarySessionCard
          title={translations.attendance.completionRate}
          value={summary.completion_rate + '%'}
        />
        <SummarySessionCard
          title={translations.attendance.cancelledSessions}
          value={summary.cancelled_sessions}
        />
      </div>

      {/* Insights - only show if there are insights */}
      {hasItems(insights) && (
        <Card>
          <CardHeader>
            <LightBulbIcon className="w-6 h-6 mr-2" />
            <Heading size={3}>Insights</Heading>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border ${match(insight.type)
                    .with('success', () => 'bg-green-50 border-green-200')
                    .with('warning', () => 'bg-yellow-50 border-yellow-200')
                    .otherwise(() => 'bg-blue-50 border-blue-200')}`}
                >
                  <Heading size={4}>{insight.title}</Heading>
                  <p className="text-sm mt-1">{insight.message}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Detailed Tabs */}
      <Card>
        <CardBody>
          <Tabs>
            <Tab
              key="members"
              title={
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4" />
                  Member Performance
                </div>
              }
            >
              <MemberPerformanceTable memberStats={memberStats} />
            </Tab>

            <Tab
              key="trends"
              title={
                <div className="flex items-center gap-2">
                  <ArrowTrendingUpIcon className="w-4 h-4" />
                  Attendance Trends
                </div>
              }
            >
              <AttendanceTrendsChart
                trends={trends}
                onDaysChange={setSelectedDays}
                selectedDays={selectedDays}
              />
            </Tab>

            <Tab key="recommendations" title="Recommendations">
              <RecommendationsPanel recommendations={recommendations} />
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Metadata */}
      <div className="text-xs text-gray-500 text-right">
        Generated at: {new Date(metadata.generated_at).toLocaleString()}
        {' • '}
        Queries: {metadata.query_count}
      </div>
    </div>
  );
}

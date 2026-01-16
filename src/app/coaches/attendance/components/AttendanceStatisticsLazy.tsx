'use client';

import {useState} from 'react';

import {Card, CardBody, CardHeader, Tab, Tabs} from '@heroui/react';

import {LightBulbIcon, ArrowTrendingUpIcon, UserGroupIcon} from '@heroicons/react/24/outline';

import {AttendanceTrendsChart} from '@/app/coaches/attendance/components/AttendanceTrendsChart';
import {MemberPerformanceTable} from '@/app/coaches/attendance/components/MemberPerformanceTable';
import {RecommendationsPanel} from '@/app/coaches/attendance/components/RecommendationsPanel';

import {LoadingSpinner} from '@/components';
import {useFetchAttendanceStatistics} from '@/hooks';

interface Props {
  categoryId: string;
  seasonId: string;
}

export default function AttendanceStatisticsLazy({categoryId, seasonId}: Props) {
  const [selectedDays, setSelectedDays] = useState(30);
  const {data, isLoading, error} = useFetchAttendanceStatistics(categoryId, seasonId, selectedDays);

  if (isLoading) {
    return (
      <Card>
        <CardBody className="flex items-center justify-center h-96">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading statistics...</p>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardBody>
          <p className="text-danger">Failed to load statistics. Please try again.</p>
        </CardBody>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600">Completed Sessions</p>
            <p className="text-3xl font-bold">{data.summary.completed_sessions}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600">Planned Sessions</p>
            <p className="text-3xl font-bold">{data.summary.planned_sessions}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600">Completion Rate</p>
            <p className="text-3xl font-bold">{data.summary.completion_rate}%</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600">Cancelled Sessions</p>
            <p className="text-3xl font-bold">{data.summary.cancelled_sessions}</p>
          </CardBody>
        </Card>
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <Card>
          <CardHeader>
            <LightBulbIcon className="w-6 h-6 mr-2" />
            <h3 className="text-xl font-semibold">Insights</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {data.insights.map((insight, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border ${
                    insight.type === 'success'
                      ? 'bg-green-50 border-green-200'
                      : insight.type === 'warning'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <h4 className="font-semibold">{insight.title}</h4>
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
              <MemberPerformanceTable memberStats={data.memberStats} />
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
                trends={data.trends}
                onDaysChange={setSelectedDays}
                selectedDays={selectedDays}
              />
            </Tab>

            <Tab key="recommendations" title="Recommendations">
              <RecommendationsPanel recommendations={data.recommendations} />
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Metadata */}
      <div className="text-xs text-gray-500 text-right">
        Generated at: {new Date(data.metadata.generated_at).toLocaleString()}
        {' • '}
        Queries: {data.metadata.query_count}
      </div>
    </div>
  );
}

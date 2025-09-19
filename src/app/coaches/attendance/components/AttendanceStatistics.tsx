'use client';

import React, {useState, useEffect, useCallback} from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Progress,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tabs,
  Tab,
  Spinner,
} from '@heroui/react';
import {
  ChartBarIcon,
  UserGroupIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import {CoachAnalytics} from '@/types/statistics';
import {formatDateString} from '@/helpers';
import {LoadingSpinner} from '@/components';

interface AttendanceStatisticsProps {
  categoryId: string;
  seasonId: string;
  onLoadAnalytics: (categoryId: string, seasonId: string) => Promise<CoachAnalytics>;
}

export default function AttendanceStatistics({
  categoryId,
  seasonId,
  onLoadAnalytics,
}: AttendanceStatisticsProps) {
  const [analytics, setAnalytics] = useState<CoachAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isExpanded, setIsExpanded] = useState(false);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await onLoadAnalytics(categoryId, seasonId);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při načítání statistik');
    } finally {
      setLoading(false);
    }
  }, [categoryId, seasonId, onLoadAnalytics]);

  useEffect(() => {
    if (categoryId && seasonId) {
      loadAnalytics();
    }
  }, [categoryId, seasonId, loadAnalytics]);

  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  const getTrendColor = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return 'success';
      case 'declining':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" label="Načítání statistik..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardBody className="text-center p-6">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 mb-4">{error}</p>
          <Button color="primary" onPress={loadAnalytics}>
            Zkusit znovu
          </Button>
        </CardBody>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Summary View (when collapsed) */}
      {!isExpanded && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardBody className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <ChartBarIcon className="w-6 h-6 text-blue-500 mr-2" />
                <span className="text-2xl font-bold text-blue-600">
                  {analytics.overall_stats.average_attendance_percentage}%
                </span>
              </div>
              <p className="text-sm text-gray-600">Celková docházka</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <CalendarIcon className="w-6 h-6 text-green-500 mr-2" />
                <span className="text-2xl font-bold text-green-600">
                  {analytics.overall_stats.completed_sessions}
                </span>
              </div>
              <p className="text-sm text-gray-600">Dokončené tréninky</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <UserGroupIcon className="w-6 h-6 text-purple-500 mr-2" />
                <span className="text-2xl font-bold text-purple-600">
                  {analytics.member_performance.length}
                </span>
              </div>
              <p className="text-sm text-gray-600">Členů v týmu</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mr-2" />
                <span className="text-2xl font-bold text-red-600">
                  {analytics.overall_stats.cancelled_sessions}
                </span>
              </div>
              <p className="text-sm text-gray-600">Zrušené tréninky</p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Collapsible Content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {isExpanded && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-2">
              <Card>
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Celková docházka</p>
                      <p className="text-2xl font-bold">
                        {analytics.overall_stats.average_attendance_percentage}%
                      </p>
                    </div>
                    <ChartBarIcon className="w-8 h-8 text-blue-500" />
                  </div>
                  <Progress
                    value={analytics.overall_stats.average_attendance_percentage}
                    color={getAttendanceColor(
                      analytics.overall_stats.average_attendance_percentage
                    )}
                    className="mt-2"
                    aria-label="Celková docházka"
                  />
                </CardBody>
              </Card>

              <Card>
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Dokončené tréninky</p>
                      <p className="text-2xl font-bold">
                        {analytics.overall_stats.completed_sessions}
                      </p>
                      <p className="text-xs text-gray-500">
                        z {analytics.overall_stats.total_sessions} celkem
                      </p>
                    </div>
                    <CalendarIcon className="w-8 h-8 text-green-500" />
                  </div>
                  <Progress
                    value={analytics.overall_stats.completion_rate}
                    color="success"
                    className="mt-2"
                    aria-label="Dokončené tréninky"
                  />
                </CardBody>
              </Card>

              <Card>
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Zrušené tréninky</p>
                      <p className="text-2xl font-bold">
                        {analytics.overall_stats.cancelled_sessions}
                      </p>
                      <p className="text-xs text-gray-500">
                        {analytics.overall_stats.cancellation_rate}% z celku
                      </p>
                    </div>
                    <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                  </div>
                  <Progress
                    value={analytics.overall_stats.cancellation_rate}
                    color="danger"
                    className="mt-2"
                    aria-label="Zrušené tréninky"
                  />
                </CardBody>
              </Card>

              <Card>
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Záznamy docházky</p>
                      <p className="text-2xl font-bold">
                        {analytics.overall_stats.total_attendance_records}
                      </p>
                    </div>
                    <UserGroupIcon className="w-8 h-8 text-purple-500" />
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Tabs for different views */}
            <Tabs
              selectedKey={selectedTab}
              onSelectionChange={(key) => setSelectedTab(key as string)}
              className="w-full p-2"
            >
              <Tab key="overview" title="Přehled">
                <div className="space-y-6">
                  {/* Insights and Recommendations */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-2">
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold">Insights</h3>
                      </CardHeader>
                      <CardBody>
                        {analytics.insights.length > 0 ? (
                          <ul className="space-y-2">
                            {analytics.insights.map((insight, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{insight}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 text-sm">Žádné specifické insights</p>
                        )}
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold">Doporučení</h3>
                      </CardHeader>
                      <CardBody>
                        {analytics.recommendations.length > 0 ? (
                          <ul className="space-y-2">
                            {analytics.recommendations.map((recommendation, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{recommendation}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 text-sm">Žádná specifická doporučení</p>
                        )}
                      </CardBody>
                    </Card>
                  </div>
                </div>
              </Tab>

              <Tab key="members" title="Výkonnost členů">
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Docházka členů</h3>
                  </CardHeader>
                  <CardBody>
                    <Table aria-label="Member attendance statistics">
                      <TableHeader>
                        <TableColumn>ČLEN</TableColumn>
                        <TableColumn>DOCHÁZKA</TableColumn>
                        <TableColumn>TREND</TableColumn>
                        <TableColumn>STREAK</TableColumn>
                        <TableColumn>POSLEDNÍ</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {analytics.member_performance.map((member) => (
                          <TableRow key={member.member_id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {member.member_surname} {member.member_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {member.present_count}/{member.total_sessions} tréninků
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={member.attendance_percentage}
                                  color={getAttendanceColor(member.attendance_percentage)}
                                  className="w-20"
                                  aria-label="Docházka členů"
                                />
                                <span className="text-sm font-medium">
                                  {member.attendance_percentage}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Chip
                                color={getTrendColor(member.recent_trend)}
                                variant="flat"
                                size="sm"
                                startContent={getTrendIcon(member.recent_trend)}
                              >
                                {member.recent_trend === 'improving' && 'Zlepšuje se'}
                                {member.recent_trend === 'declining' && 'Zhoršuje se'}
                                {member.recent_trend === 'stable' && 'Stabilní'}
                              </Chip>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {member.consecutive_present > 0 && (
                                  <span className="text-green-600">
                                    {member.consecutive_present}× přítomen
                                  </span>
                                )}
                                {member.consecutive_absences > 0 && (
                                  <span className="text-red-600">
                                    {member.consecutive_absences}× nepřítomen
                                  </span>
                                )}
                                {member.consecutive_present === 0 &&
                                  member.consecutive_absences === 0 && (
                                    <span className="text-gray-500">-</span>
                                  )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-500">
                                {member.last_attendance_date
                                  ? formatDateString(member.last_attendance_date)
                                  : '-'}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardBody>
                </Card>
              </Tab>

              <Tab key="trends" title="Trendy">
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Trend docházky (posledních 30 dní)</h3>
                  </CardHeader>
                  <CardBody>
                    {analytics.attendance_trends.length > 0 ? (
                      <div className="space-y-4">
                        {analytics.attendance_trends.slice(-10).map((trend, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{formatDateString(trend.date)}</p>
                              <p className="text-sm text-gray-600">
                                {trend.present} přítomných, {trend.absent} nepřítomných
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">{trend.attendance_percentage}%</p>
                              <Progress
                                value={trend.attendance_percentage}
                                color={getAttendanceColor(trend.attendance_percentage)}
                                className="w-24"
                                aria-label="Trend docházky"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        Žádné data o trendech v posledních 30 dnech
                      </p>
                    )}
                  </CardBody>
                </Card>
              </Tab>
            </Tabs>
          </>
        )}
      </div>

      {/* Expand/Collapse Button */}
      <div className="flex justify-center pt-2">
        <Button
          variant="bordered"
          color="primary"
          onPress={() => setIsExpanded(!isExpanded)}
          startContent={
            isExpanded ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )
          }
          className="transition-all duration-200 hover:scale-105"
        >
          {isExpanded ? 'Skrýt detailní statistiky' : 'Zobrazit detailní statistiky'}
        </Button>
      </div>
    </div>
  );
}

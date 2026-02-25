'use client';

import React from 'react';

import {AttendanceTrendData} from '@/types/entities/trainingSession/business/statistics';

import {translations} from '@/lib/translations/index';

import {isEmpty} from '@/utils/arrayHelper';

import {UnifiedCard} from '@/components';

interface AttendanceChartProps {
  data: AttendanceTrendData[];
  title?: string;
}

export default function AttendanceChart({
  data,
  title = translations.attendance.charts.attendanceTrend,
}: AttendanceChartProps) {
  if (isEmpty(data)) {
    return (
      <UnifiedCard title={title}>
        <p className="text-gray-500 text-center py-8">{translations.common.noData}</p>
      </UnifiedCard>
    );
  }

  const maxAttendance = Math.max(...data.map((d) => d.attendance_percentage));
  const minAttendance = Math.min(...data.map((d) => d.attendance_percentage));

  return (
    <UnifiedCard title={title}>
      <div className="space-y-4">
        {/* Simple bar chart */}
        <div className="flex items-end justify-between h-48 border-b border-l border-gray-200">
          {data.slice(-14).map((item, index) => {
            const height =
              ((item.attendance_percentage - minAttendance) / (maxAttendance - minAttendance)) *
              100;
            const color =
              item.attendance_percentage >= 80
                ? 'bg-green-500'
                : item.attendance_percentage >= 60
                  ? 'bg-yellow-500'
                  : 'bg-red-500';

            return (
              <div key={index} className="flex flex-col items-center flex-1 mx-1">
                <div
                  className={`w-full ${color} rounded-t transition-all duration-300 hover:opacity-80`}
                  style={{height: `${Math.max(height, 5)}%`}}
                  title={`${item.attendance_percentage}% - ${item.date}`}
                />
                <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                  {new Date(item.date).toLocaleDateString('cs-CZ', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>80%+</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>60-79%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>&lt;60%</span>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {Math.round(data.reduce((sum, d) => sum + d.present, 0) / data.length)}
            </p>
            <p className="text-sm text-gray-600">
              {translations.attendance.charts.attendanceAverage}
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {Math.round(data.reduce((sum, d) => sum + d.attendance_percentage, 0) / data.length)}%
            </p>
            <p className="text-sm text-gray-600">
              {translations.attendance.charts.attendancePercentage}
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {Math.round(data.reduce((sum, d) => sum + d.absent, 0) / data.length)}
            </p>
            <p className="text-sm text-gray-600">{translations.attendance.charts.absenceAverage}</p>
          </div>
        </div>
      </div>
    </UnifiedCard>
  );
}

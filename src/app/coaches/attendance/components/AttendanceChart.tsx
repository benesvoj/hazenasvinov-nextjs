'use client';

import React from 'react';
import {Card, CardBody, CardHeader} from '@heroui/react';
import {AttendanceTrendData} from '@/types/statistics';

interface AttendanceChartProps {
  data: AttendanceTrendData[];
  title?: string;
}

export default function AttendanceChart({data, title = 'Trend docházky'}: AttendanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">{title}</h3>
        </CardHeader>
        <CardBody>
          <p className="text-gray-500 text-center py-8">Žádná data k zobrazení</p>
        </CardBody>
      </Card>
    );
  }

  const maxAttendance = Math.max(...data.map((d) => d.attendance_percentage));
  const minAttendance = Math.min(...data.map((d) => d.attendance_percentage));

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{title}</h3>
      </CardHeader>
      <CardBody>
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
              <p className="text-sm text-gray-600">Průměr přítomných</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {Math.round(
                  data.reduce((sum, d) => sum + d.attendance_percentage, 0) / data.length
                )}
                %
              </p>
              <p className="text-sm text-gray-600">Průměrná docházka</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {Math.round(data.reduce((sum, d) => sum + d.absent, 0) / data.length)}
              </p>
              <p className="text-sm text-gray-600">Průměr nepřítomných</p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

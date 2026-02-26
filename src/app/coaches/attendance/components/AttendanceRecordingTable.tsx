import React, {useMemo} from 'react';

import {
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';

import {translations} from '@/lib/translations/index';

import {UnifiedCard} from '@/components';
import {AttendanceStatuses, getAttendanceStatusOptions} from '@/enums';
import {formatDateString, formatTime, formatTimeString} from '@/helpers';
import {BaseTrainingSession, MemberAttendanceWithMember} from '@/types';
import {isNotNilOrEmpty} from '@/utils';

import {getShortAttendanceStatusText, getStatusColor} from '../helpers';

interface AttendanceRecordingTableProps {
  attendanceRecords: MemberAttendanceWithMember[];
  selectedSession: string | null;
  loading: boolean;
  handleRecordAttendance: (id: string, status: AttendanceStatuses) => Promise<void>;
  handleCreateAttendanceForSession: (sessionId: string) => Promise<void>;
  selectedSessionData: BaseTrainingSession | null;
}

/**
 * Type guard to check if an attendance record has a valid member
 */
function hasValidMember(
  record: MemberAttendanceWithMember
): record is MemberAttendanceWithMember & {
  member: NonNullable<MemberAttendanceWithMember['member']>;
} {
  return record.member != null && true;
}

export const AttendanceRecordingTable = ({
  attendanceRecords,
  selectedSession,
  loading,
  handleRecordAttendance,
  handleCreateAttendanceForSession,
  selectedSessionData,
}: AttendanceRecordingTableProps) => {
  const validRecords = useMemo(() => {
    return attendanceRecords.filter(hasValidMember).sort((a, b) => {
      const surnameComparison = (a.member.surname || '').localeCompare(b.member.surname || '');
      if (surnameComparison !== 0) {
        return surnameComparison;
      }
      return (a.member.name || '').localeCompare(b.member.name || '');
    });
  }, [attendanceRecords]);

  // Count of records with missing member data (for debugging/monitoring)
  const invalidRecordsCount = attendanceRecords.length - validRecords.length;

  const cardTitle = isNotNilOrEmpty(selectedSession)
    ? translations.attendance.labels.attendanceList(validRecords.length)
    : translations.attendance.labels.attendanceListEmpty;

  const cardSubtitle = isNotNilOrEmpty(selectedSessionData)
    ? `${formatDateString(selectedSessionData.session_date)} ${formatTime(selectedSessionData.session_time ?? '')}`
    : '';

  return (
    <div className="lg:col-span-2">
      <UnifiedCard isLoading={loading} title={cardTitle} subtitle={cardSubtitle}>
        {!selectedSession ? (
          <p className="text-gray-500 text-center py-8">
            {translations.attendance.responseMessages.selectSessionToShowAttendance}
          </p>
        ) : (
          <>
            {invalidRecordsCount > 0 && (
              <Alert
                color="warning"
                title={translations.attendance.alerts.missingAttendanceRecords(invalidRecordsCount)}
              />
            )}
            <div className="overflow-x-auto">
              <Table aria-label={translations.attendance.labels.attendanceListEmpty}>
                <TableHeader>
                  <TableColumn>{translations.attendance.table.columns.memberName}</TableColumn>
                  <TableColumn>{translations.attendance.table.columns.status}</TableColumn>
                </TableHeader>
                <TableBody>
                  {validRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm sm:text-base">
                            {record.member.surname} {record.member.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getAttendanceStatusOptions().map((status) => (
                            <Button
                              key={status.value}
                              size="sm"
                              variant={
                                record.attendance_status === status.value ? 'solid' : 'light'
                              }
                              color={getStatusColor(status.value)}
                              onPress={() => handleRecordAttendance(record.member.id, status.value)}
                              className="text-xs sm:text-sm"
                            >
                              <span className="hidden sm:inline">{status.label}</span>
                              <span className="sm:hidden">
                                {getShortAttendanceStatusText(status.value)}
                              </span>
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </UnifiedCard>
    </div>
  );
};

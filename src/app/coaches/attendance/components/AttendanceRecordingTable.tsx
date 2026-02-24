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
import {MemberAttendanceWithMember} from '@/types';
import {hasItems} from '@/utils';

import {getShortAttendanceStatusText, getStatusColor} from '../helpers';

interface AttendanceRecordingTableProps {
  attendanceRecords: MemberAttendanceWithMember[];
  selectedSession: string | null;
  handleCreateAttendanceForSession: () => void;
  loading: boolean;
  handleRecordAttendance: (id: string, status: AttendanceStatuses) => Promise<void>;
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
  handleCreateAttendanceForSession,
  loading,
  handleRecordAttendance,
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

  return (
    <div className="lg:col-span-2">
      <UnifiedCard
        isLoading={loading}
        title={translations.attendance.labels.attendanceList(
          hasItems(validRecords) ? validRecords.length : 0
        )}
      >
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
              <Table aria-label="Attendance records">
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

import React from 'react';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';

import {MemberAttendanceWithMember} from '@/types';

interface AttendanceRecordingTableProps {
  attendanceRecords: MemberAttendanceWithMember[];
  selectedSession: any;
  handleCreateAttendanceForSession: () => void;
  loading: boolean;
  handleRecordAttendance: (
    id: string,
    status: 'present' | 'absent' | 'late' | 'excused'
  ) => Promise<void>;
}

export const AttendanceRecordingTable = ({
  attendanceRecords,
  selectedSession,
  handleCreateAttendanceForSession,
  loading,
  handleRecordAttendance,
}: AttendanceRecordingTableProps) => {
  return (
    <div className="lg:col-span-2">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <h3 className="text-lg font-semibold">
              Docházka {attendanceRecords ? `(${attendanceRecords.length})` : ''}
            </h3>
            {selectedSession && attendanceRecords.length === 0 && (
              <Button
                size="sm"
                color="primary"
                variant="bordered"
                onPress={handleCreateAttendanceForSession}
              >
                Vytvořit záznamy docházky
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {!selectedSession ? (
            <p className="text-gray-500 text-center py-8">Vyberte trénink pro zobrazení docházky</p>
          ) : loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : attendanceRecords.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Žádné záznamy docházky pro tento trénink
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table aria-label="Attendance records">
                <TableHeader>
                  <TableColumn>ČLEN</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                </TableHeader>
                <TableBody>
                  {attendanceRecords
                    .sort((a, b) => {
                      // Sort by surname, then by name
                      if (!a.member || !b.member) return 0;
                      const surnameComparison = (a.member.surname || '').localeCompare(
                        b.member.surname || ''
                      );
                      if (surnameComparison !== 0) {
                        return surnameComparison;
                      }
                      return (a.member.name || '').localeCompare(b.member.name || '');
                    })
                    .map((record) => (
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
                            {(['present', 'absent', 'late', 'excused'] as const).map((status) => (
                              <Button
                                key={status}
                                size="sm"
                                variant={record.attendance_status === status ? 'solid' : 'light'}
                                color={getStatusColor(status)}
                                onPress={() => handleRecordAttendance(record.member.id, status)}
                                className="text-xs sm:text-sm"
                              >
                                <span className="hidden sm:inline">{getStatusText(status)}</span>

                                {/*TODO: make as a function*/}
                                <span className="sm:hidden">
                                  {status === 'present'
                                    ? 'P'
                                    : status === 'absent'
                                      ? 'N'
                                      : status === 'late'
                                        ? 'L'
                                        : 'O'}
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
          )}
        </CardBody>
      </Card>
    </div>
  );
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'present':
      return 'Přítomen';
    case 'absent':
      return 'Nepřítomen';
    case 'late':
      return 'Pozdní příchod';
    case 'excused':
      return 'Omluven';
    default:
      return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'present':
      return 'success';
    case 'absent':
      return 'danger';
    case 'late':
      return 'warning';
    case 'excused':
      return 'default';
    default:
      return 'default';
  }
};

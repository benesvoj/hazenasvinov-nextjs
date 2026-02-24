import {translations} from '@/lib/translations/index';

export enum AttendanceStatuses {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
}

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatuses, string> = {
  [AttendanceStatuses.PRESENT]: translations.attendance.enums.statuses.present,
  [AttendanceStatuses.ABSENT]: translations.attendance.enums.statuses.absent,
  [AttendanceStatuses.LATE]: translations.attendance.enums.statuses.late,
  [AttendanceStatuses.EXCUSED]: translations.attendance.enums.statuses.excused,
} as const;

export const getAttendanceStatusOptions = () =>
  Object.entries(ATTENDANCE_STATUS_LABELS).map(([value, label]) => ({
    value: value as AttendanceStatuses,
    label,
  }));

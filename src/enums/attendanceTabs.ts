import {translations} from '@/lib/translations/index';

export enum AttendanceTabs {
  ATTENDANCE = 'attendance',
  STATISTICS = 'statistics',
}

export const ATTENDANCE_TABS_LABELS: Record<AttendanceTabs, string> = {
  [AttendanceTabs.ATTENDANCE]: translations.attendance.enums.tabs.attendance,
  [AttendanceTabs.STATISTICS]: translations.attendance.enums.tabs.statistics,
} as const;

export const getAttendanceTabOptions = () =>
  Object.entries(ATTENDANCE_TABS_LABELS).map(([value, label]) => ({
    value: value as AttendanceTabs,
    label,
  }));

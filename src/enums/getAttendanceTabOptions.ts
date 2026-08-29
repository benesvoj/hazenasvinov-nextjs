import {AttendanceTabs} from '@/enums/attendanceTabs';

import {translations} from '@/lib/translations';

export function attendanceTabsLabels() {
  return {
    [AttendanceTabs.ATTENDANCE]: translations.attendance.enums.tabs.attendance,
    [AttendanceTabs.STATISTICS]: translations.attendance.enums.tabs.statistics,
  };
}

export const getAttendanceTabOptions = () => {
  const labels = attendanceTabsLabels();

  return Object.entries(labels).map(([value, label]) => ({
    value: value as AttendanceTabs,
    label,
  }));
};

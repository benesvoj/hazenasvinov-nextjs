import {AttendanceStatuses} from '@/enums/attendanceStatuses';

import {translations} from '@/lib/translations';

export function attendanceStatusLabels() {
  return {
    [AttendanceStatuses.PRESENT]: translations.attendance.enums.statuses.present,
    [AttendanceStatuses.ABSENT]: translations.attendance.enums.statuses.absent,
    [AttendanceStatuses.LATE]: translations.attendance.enums.statuses.late,
    [AttendanceStatuses.EXCUSED]: translations.attendance.enums.statuses.excused,
  };
}

export const getAttendanceStatusOptions = () => {
  const labels = attendanceStatusLabels();

  return Object.entries(labels).map(([value, label]) => ({
    value: value as AttendanceStatuses,
    label,
  }));
};

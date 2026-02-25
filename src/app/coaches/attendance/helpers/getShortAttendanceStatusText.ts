import {match} from 'ts-pattern';

import {AttendanceStatuses} from '@/enums';

export const getShortAttendanceStatusText = (status: string) => {
  return match(status)
    .when(
      () => AttendanceStatuses.PRESENT,
      () => 'P'
    )
    .when(
      () => AttendanceStatuses.ABSENT,
      () => 'N'
    )
    .when(
      () => AttendanceStatuses.LATE,
      () => 'L'
    )
    .when(
      () => AttendanceStatuses.EXCUSED,
      () => 'O'
    )
    .otherwise(() => '?');
};

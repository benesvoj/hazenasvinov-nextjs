import {match} from 'ts-pattern';

import {AttendanceStatuses} from '@/enums';

export const getShortAttendanceStatusText = (status: string) => {
  return match(status)
    .with(AttendanceStatuses.PRESENT, () => 'P')
    .with(AttendanceStatuses.ABSENT, () => 'N')
    .with(AttendanceStatuses.LATE, () => 'L')
    .with(AttendanceStatuses.EXCUSED, () => 'O')
    .otherwise(() => '?');
};

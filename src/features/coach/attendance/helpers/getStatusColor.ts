import {AttendanceStatuses} from '@/enums';

export const getStatusColor = (status: string) => {
  switch (status) {
    case AttendanceStatuses.PRESENT:
      return 'success';
    case AttendanceStatuses.ABSENT:
      return 'danger';
    case AttendanceStatuses.LATE:
      return 'warning';
    case AttendanceStatuses.EXCUSED:
      return 'default';
    default:
      return 'default';
  }
};

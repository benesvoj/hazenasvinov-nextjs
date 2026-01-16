import {MemberAttendanceSchema, MemberSchema} from '@/types';

export interface MemberAttendanceWithMember extends MemberAttendanceSchema {
  member: MemberSchema;
}

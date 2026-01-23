import {MemberAttendanceSchema, MemberSchema} from '@/types';

/**
 * Member attendance record with joined member data.
 * Note: `member` is optional because:
 * 1. The member might have been deleted (orphaned attendance record)
 * 2. The JOIN query might fail to find the member
 * 3. Data integrity issues in the database
 *
 * Always use optional chaining or null checks when accessing `member` properties.
 */
export interface MemberAttendanceWithMember extends MemberAttendanceSchema {
  member?: MemberSchema | null;
}

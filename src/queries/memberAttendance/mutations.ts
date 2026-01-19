import {DB_TABLE, ENTITY} from '@/queries/memberAttendance';
import {createMutationHelpers} from '@/queries/shared/createMutationHelpers';
import {QueryContext} from '@/queries/shared/types';
import {MemberAttendanceWithMember, MemberAttendanceInsert} from '@/types';

/**
 * CRUD mutations for MemberAttendance
 * Uses memoized createMutationHelpers factory
 */

// Memoized helper instance
let helpers: ReturnType<
  typeof createMutationHelpers<MemberAttendanceWithMember, MemberAttendanceInsert>
> | null = null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<MemberAttendanceWithMember, MemberAttendanceInsert>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

// Export mutation functions
export const createMemberAttendance = (ctx: QueryContext, data: MemberAttendanceInsert) =>
  getHelpers().create(ctx, data);

export const updateMemberAttendance = (
  ctx: QueryContext,
  id: string,
  data: Partial<MemberAttendanceInsert>
) => getHelpers().update(ctx, id, data);

export const deleteMemberAttendance = (ctx: QueryContext, id: string) =>
  getHelpers().delete(ctx, id);

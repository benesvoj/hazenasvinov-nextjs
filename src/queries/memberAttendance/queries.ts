import {buildSelectQuery, handleSupabasePaginationBug} from '@/queries';
import {DB_TABLE, ENTITY} from '@/queries/memberAttendance';
import {GetEntitiesOptions, QueryContext, QueryResult} from '@/queries/shared/types';
import {MemberAttendanceWithMember} from '@/types';

interface GetMembersAttendanceOptions extends GetEntitiesOptions {
  filters?: {
    trainingSessionId?: string;
  };
}

export async function getAllMembersOfTrainingSession(
  ctx: QueryContext,
  options?: GetMembersAttendanceOptions
): Promise<QueryResult<MemberAttendanceWithMember[]>> {
  try {
    // Use alias 'member:members' to match the TypeScript interface MemberAttendanceWithMember
    // which expects 'member' (singular) not 'members' (plural table name)
    const query = buildSelectQuery(ctx.supabase, DB_TABLE, {
      select: '*, member:members(id, name, surname, category_id)',
      filters: options?.filters,
      sorting: options?.sorting,
      pagination: options?.pagination,
    });

    const {data, error, count} = await query;

    const paginationBugResult = handleSupabasePaginationBug<MemberAttendanceWithMember>(
      error,
      count
    );
    if (paginationBugResult) {
      return paginationBugResult;
    }
    return {
      data: data as unknown as MemberAttendanceWithMember[],
      error: null,
      count: count ?? 0,
    };
  } catch (err: any) {
    console.error(`Exception in getAll${ENTITY.plural}:`, err);
    return {
      data: null,
      error: err.message || 'Unknown error',
      count: 0,
    };
  }
}

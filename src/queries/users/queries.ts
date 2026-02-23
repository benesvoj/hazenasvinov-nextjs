import {buildSelectQuery, handleSupabasePaginationBug} from '@/queries';
import {GetEntitiesOptions, QueryContext, QueryResult} from '@/queries/shared/types';
import {DB_TABLE, ENTITY} from '@/queries/users';
import {User} from '@/types';

export async function getAllUsers(
  ctx: QueryContext,
  options?: GetEntitiesOptions
): Promise<QueryResult<User[]>> {
  try {
    const query = buildSelectQuery(ctx.supabase, DB_TABLE, {
      filters: options?.filters,
      sorting: options?.sorting,
      pagination: options?.pagination,
    });
    const {data, error, count} = await query;

    const paginationBugResult = handleSupabasePaginationBug<User>(error, count);
    if (paginationBugResult) {
      return paginationBugResult;
    }

    return {
      data: data as unknown as User[],
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

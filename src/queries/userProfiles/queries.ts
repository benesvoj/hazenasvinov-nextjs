import {buildSelectQuery} from '@/queries';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {DB_TABLE, ENTITY} from '@/queries/userProfiles';
import {UserProfile} from '@/types';

export async function getUserProfiles(
  ctx: QueryContext,
  userId?: string
): Promise<QueryResult<UserProfile[]>> {
  try {
    const query = buildSelectQuery(ctx.supabase, DB_TABLE, {
      filters: userId ? {user_id: userId} : undefined,
    });
    const {data, error, count} = await query;

    return {
      data: data as unknown as UserProfile[],
      error: error ? error.message : null,
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

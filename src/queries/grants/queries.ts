import {buildSelectOneQuery, buildSelectQuery, handleSupabasePaginationBug} from '@/queries';
import {DB_TABLE, ENTITY} from '@/queries/grants/constants';
import {GetEntitiesOptions, QueryContext, QueryResult} from '@/queries/shared/types';
import {Grant} from '@/types';

export async function getAllGrants(
  ctx: QueryContext,
  options?: GetEntitiesOptions
): Promise<QueryResult<Grant[]>> {
  try {
    const query = buildSelectQuery(ctx.supabase, DB_TABLE, {
      sorting: options?.sorting,
      pagination: options?.pagination,
      filters: options?.filters,
    });

    const {data, error, count} = await query;

    // Handle malformed Supabase error (bug when pagination is beyond available records)
    const paginationBugResult = handleSupabasePaginationBug<Grant>(error, count);
    if (paginationBugResult) {
      return paginationBugResult;
    }

    return {
      data: data as unknown as Grant[],
      error: null,
      count: count ?? 0,
    };
  } catch (err: any) {
    console.error(`Exception in getAll${ENTITY}`, err);
    return {
      data: null,
      error: err.message || 'Unknown error',
      count: 0,
    };
  }
}

export async function getGrantById(ctx: QueryContext, id: string): Promise<QueryResult<Grant>> {
  try {
    const query = buildSelectOneQuery(ctx.supabase, DB_TABLE, id);

    const {data, error} = await query;

    if (error) {
      console.error(`Error fetching ${ENTITY}`, error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as unknown as Grant,
      error: null,
    };
  } catch (err: any) {
    console.error(`Exception in get${ENTITY}ById:`, err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}
